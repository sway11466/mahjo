import type { Hand, Meld, Decomposition, WaitType } from '../types/index.ts';
import type { Tile } from '../types/index.ts';
import { tileKind, isSuitedKind, TILE_KINDS } from './tiles.ts';

/**
 * 面子分解（parse）。Hand を「4面子1雀頭」または特殊形（七対子・国士無双）へ分解し、
 * 成立する全ての解釈（Decomposition）を列挙する。高点法のため重複以外は捨てない
 * （最高点の採用は score() の仕事 → scoring-rules.md §4）。純粋関数・乱数なし。
 *
 * 前提（契約）：完全な手牌 ＝ hand.concealed ＋ hand.winningTile。
 *   winningTile は concealed に含めない別フィールドとして渡す（data-model §4）。
 *   副露・暗槓は hand.calledMelds に既に確定した面子として入っており、分解対象は concealed のみ。
 *   よって concealed から作る面子の数 ＝ 4 − calledMelds.length（＋雀頭1）。
 *
 * 待ち（wait）は winningTile がどの面子/雀頭を完成させたかで決まる。同じ構造でも
 * 上がり牌の置き場所が複数あれば（＝待ちが変わるなら）別解釈として列挙する。
 * 上がり牌の物理 id は、その解釈で「完成させた面子」へ配置する（fu.ts が明刻/明槓を
 * winningTile から判定できるように）。
 */
export function parse(hand: Hand): Decomposition[] {
  const full: Tile[] = [...hand.concealed, hand.winningTile];
  const meldsNeeded = 4 - hand.calledMelds.length;
  const wk = tileKind(hand.winningTile);

  const counts = new Array<number>(TILE_KINDS).fill(0);
  for (const t of full) counts[tileKind(t)] = counts[tileKind(t)]! + 1;

  const results: Decomposition[] = [];
  const seen = new Set<string>();
  const add = (d: Decomposition) => {
    const sig = signature(d);
    if (!seen.has(sig)) {
      seen.add(sig);
      results.push(d);
    }
  };

  // 通常形（4面子1雀頭）
  if (meldsNeeded >= 0) {
    for (const { pair, melds } of decompose(counts.slice(), meldsNeeded)) {
      // 上がり牌の種別を含むグループ（0=雀頭, 1..=面子）ごとに別解釈を作る
      const groups: number[][] = [[pair, pair], ...melds.map((m) => m.kinds)];
      for (let gi = 0; gi < groups.length; gi++) {
        if (!groups[gi]!.includes(wk)) continue;
        add(materialize(full, pair, melds, hand.calledMelds, gi, wk, hand.winningTile));
      }
    }
  }

  // 特殊形（門前14枚のときのみ）。通常形と排他ではない（両立する手は両方列挙）。
  if (hand.calledMelds.length === 0 && full.length === 14) {
    const chiitoi = tryChiitoitsu(counts, full);
    if (chiitoi) add(chiitoi);
    const kokushi = tryKokushi(counts, full);
    if (kokushi) add(kokushi);
  }

  return results;
}

// ── 通常形の列挙（kind ベース） ──────────────────────────────

interface MeldKinds {
  type: 'kotsu' | 'shuntsu';
  kinds: [number, number, number];
}

/** 雀頭を1つ選び、残りを面子に分解する全パターン（pair=雀頭のkind） */
function decompose(
  counts: number[],
  meldsNeeded: number,
): Array<{ pair: number; melds: MeldKinds[] }> {
  const out: Array<{ pair: number; melds: MeldKinds[] }> = [];
  for (let k = 0; k < counts.length; k++) {
    if (counts[k]! < 2) continue;
    counts[k] = counts[k]! - 2;
    for (const melds of decomposeMelds(counts, meldsNeeded)) {
      out.push({ pair: k, melds });
    }
    counts[k] = counts[k]! + 2;
  }
  return out;
}

/** counts を need 個の面子（刻子/順子）に分解する全パターン。最小kind優先で正準化し重複を避ける */
function decomposeMelds(counts: number[], need: number): MeldKinds[][] {
  if (need === 0) {
    return counts.every((c) => c === 0) ? [[]] : [];
  }
  let k = -1;
  for (let i = 0; i < counts.length; i++) {
    if (counts[i]! > 0) {
      k = i;
      break;
    }
  }
  if (k === -1) return [];

  const results: MeldKinds[][] = [];

  // 刻子
  if (counts[k]! >= 3) {
    counts[k] = counts[k]! - 3;
    for (const rest of decomposeMelds(counts, need - 1)) {
      results.push([{ type: 'kotsu', kinds: [k, k, k] }, ...rest]);
    }
    counts[k] = counts[k]! + 3;
  }

  // 順子（同色内 1–7 始まりのみ）
  if (isSuitedKind(k) && k % 9 <= 6 && counts[k + 1]! > 0 && counts[k + 2]! > 0) {
    counts[k] = counts[k]! - 1;
    counts[k + 1] = counts[k + 1]! - 1;
    counts[k + 2] = counts[k + 2]! - 1;
    for (const rest of decomposeMelds(counts, need - 1)) {
      results.push([{ type: 'shuntsu', kinds: [k, k + 1, k + 2] }, ...rest]);
    }
    counts[k] = counts[k]! + 1;
    counts[k + 1] = counts[k + 1]! + 1;
    counts[k + 2] = counts[k + 2]! + 1;
  }

  return results;
}

// ── 牌の割り当て（materialize）と待ち判定 ──────────────────

/** pool から指定 kind の牌を1枚取り出す。preferId があればその物理牌を優先 */
function take(pool: Map<number, Tile[]>, kind: number, preferId?: number): Tile {
  const arr = pool.get(kind)!;
  if (preferId !== undefined) {
    const idx = arr.findIndex((t) => t.id === preferId);
    if (idx >= 0) return arr.splice(idx, 1)[0]!;
  }
  return arr.shift()!;
}

/**
 * kind 解釈に実際の Tile を割り当てて Decomposition を作る。
 * gi（0=雀頭, 1..=面子）が「上がり牌が完成させたグループ」。そこへ winningTile を配置する。
 */
function materialize(
  full: Tile[],
  pairKind: number,
  meldKinds: MeldKinds[],
  calledMelds: Meld[],
  gi: number,
  wk: number,
  winningTile: Tile,
): Decomposition {
  const pool = new Map<number, Tile[]>();
  for (const t of full) {
    const k = tileKind(t);
    const arr = pool.get(k);
    if (arr) arr.push(t);
    else pool.set(k, [t]);
  }

  let usedWinning = false;
  const takeFor = (groupIndex: number, kind: number): Tile => {
    const prefer =
      groupIndex === gi && kind === wk && !usedWinning ? winningTile.id : undefined;
    const t = take(pool, kind, prefer);
    if (prefer !== undefined && t.id === winningTile.id) usedWinning = true;
    return t;
  };

  const concealedMelds: Meld[] = meldKinds.map((m, j) => ({
    type: m.type,
    tiles: m.kinds.map((k) => takeFor(j + 1, k)),
    open: false,
  }));
  const pairMeld: Meld = {
    type: 'pair',
    tiles: [takeFor(0, pairKind), takeFor(0, pairKind)],
    open: false,
  };

  return {
    melds: [...concealedMelds, ...calledMelds, pairMeld],
    wait: waitFor(gi, meldKinds, wk),
  };
}

/** 完成させたグループ gi と上がり牌種別 wk から待ちを決める */
function waitFor(gi: number, meldKinds: MeldKinds[], wk: number): WaitType {
  if (gi === 0) return 'tanki'; // 雀頭を完成＝単騎
  const m = meldKinds[gi - 1]!;
  if (m.type === 'kotsu') return 'shanpon';
  // 順子 [a, a+1, a+2]
  const a = m.kinds[0];
  const pos = wk - a; // 0=下端 / 1=中央 / 2=上端
  if (pos === 1) return 'kanchan';
  if (pos === 0) return a % 9 === 6 ? 'penchan' : 'ryanmen'; // 789 の 7 待ち
  return a % 9 === 0 ? 'penchan' : 'ryanmen'; // 123 の 3 待ち
}

// ── 特殊形 ──────────────────────────────────────────────

const KOKUSHI_KINDS = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];
//                     1m 9m 1p 9p 1s 9s 東  南  西  北  白  發  中

/** 七対子：異なる7対子（門前14枚）。25符固定は fu.ts、ここでは形のみ */
function tryChiitoitsu(counts: number[], full: Tile[]): Decomposition | null {
  let pairs = 0;
  for (const c of counts) {
    if (c === 0) continue;
    if (c !== 2) return null; // 同種4枚などは七対子にしない
    pairs++;
  }
  if (pairs !== 7) return null;
  return { melds: [], wait: 'tanki', specialForm: 'chiitoitsu', specialTiles: full.slice() };
}

/** 国士無双：么九13種＋いずれか1枚（門前14枚）。十三面の判定は yaku 側 */
function tryKokushi(counts: number[], full: Tile[]): Decomposition | null {
  for (let k = 0; k < counts.length; k++) {
    const c = counts[k]!;
    const inSet = KOKUSHI_KINDS.includes(k);
    if (!inSet && c > 0) return null;
    if (inSet && (c < 1 || c > 2)) return null;
  }
  const pairCount = KOKUSHI_KINDS.filter((k) => counts[k] === 2).length;
  if (pairCount !== 1) return null;
  return { melds: [], wait: 'tanki', specialForm: 'kokushi', specialTiles: full.slice() };
}

// ── 重複除去 ──────────────────────────────────────────────

/** 解釈の同値判定キー（牌の物理コピー差は無視、種別＋待ち＋特殊形で同値） */
function signature(d: Decomposition): string {
  if (d.specialForm) return `special:${d.specialForm}`;
  const parts = d.melds
    .map(
      (m) =>
        `${m.type}:${m.tiles
          .map(tileKind)
          .sort((a, b) => a - b)
          .join('-')}${m.open ? 'o' : ''}`,
    )
    .sort();
  return `${parts.join('|')}#${d.wait}`;
}
