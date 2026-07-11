import type {
  Tile,
  Meld,
  Wind,
  Hand,
  Table,
  WinContext,
  Decomposition,
  WaitType,
  YakuId,
  RuleSettings,
} from '../types/index.ts';
import { tileKind, isHonor, isTerminal, isYaochu, isSimple, isDragon, isWindTile } from './tiles.ts';
import { getYaku } from './yaku-table.ts';

/**
 * 役判定（yaku）。1つの Decomposition に対して実際に成立する役（YakuId）を列挙する。
 * scoring-rules.md §1 が翻・成立条件の正。純粋関数（乱数・DOMなし）。
 *
 * - 門前/副露で喰い下がり・門前限定を切り替える（翻は yaku-table が持つ）。
 * - 排他：double-riichi 成立時 riichi を出さない／ryanpeikou 成立時 iipeikou を出さない／
 *   上位役満（十三面・四暗刻単騎・純正九蓮・大四喜）は下位の代わりに出す。
 * - 仕上げの順は enabledYaku 除外 → 上位役の置換 → 役満抑制（finalize）。オフ除外を先に
 *   行うことで、オフの上位役が下位役・通常役を消して手全体が役なしになるのを防ぐ。
 * - 役満が1つでも成立したら通常役は落とす（点数は役満固定 → scoring-rules §6）。
 *
 * 高点法（複数 Decomposition からの最大選択）は score() の仕事。ここは1解釈の判定に徹する。
 */
export function detectYaku(
  d: Decomposition,
  hand: Hand,
  table: Table,
  win: WinContext,
  rules: RuleSettings,
): YakuId[] {
  const menzen = hand.calledMelds.every((m) => !m.open);
  const tiles = allTilesOf(d);
  const out: YakuId[] = [];

  // ── 状況役（WinContext 由来。全形に共通） ──
  if (win.doubleRiichi) out.push('double-riichi');
  else if (win.riichi) out.push('riichi');
  if (win.ippatsu) out.push('ippatsu');
  if (menzen && win.win === 'tsumo') out.push('menzen-tsumo');
  if (win.haitei && win.win === 'tsumo') out.push('haitei');
  if (win.houtei && win.win === 'ron') out.push('houtei');
  if (win.rinshan && win.win === 'tsumo') out.push('rinshan');
  if (win.chankan && win.win === 'ron') out.push('chankan');
  if (win.tenho) out.push('tenho');
  if (win.chiho) out.push('chiho');

  // ── 形ごとの役 ──
  if (d.specialForm === 'kokushi') {
    // 国士は牌構成役（混老頭等）を持たない特殊形。十三面は門前13種そろい
    out.push(distinctKinds(hand.concealed) === 13 ? 'kokushi-13' : 'kokushi');
  } else {
    // 牌構成役（么九/一色など。形に依らず牌集合で決まる）
    detectComposition(out, tiles, menzen, rules);
    if (d.specialForm === 'chiitoitsu') {
      out.push('chiitoitsu');
    } else {
      detectStandard(out, d, hand, table, win, menzen);
      detectChuuren(out, tiles, menzen, hand.winningTile);
    }
  }

  return finalize(out, rules);
}

// ── 牌構成役 ───────────────────────────────────────────────

function detectComposition(
  out: YakuId[],
  tiles: Tile[],
  menzen: boolean,
  rules: RuleSettings,
): void {
  const suits = new Set<string>();
  let hasHonor = false;
  let hasTerminal = false;
  for (const t of tiles) {
    if (t.kind === 'suited') suits.add(t.suit);
    if (isHonor(t)) hasHonor = true;
    if (isTerminal(t)) hasTerminal = true;
  }

  // 一色系
  if (suits.size === 1 && !hasHonor) out.push('chinitsu');
  else if (suits.size === 1 && hasHonor) out.push('honitsu');

  // 断幺九（喰いタン無効かつ副露なら不成立）
  if (tiles.every(isSimple) && (menzen || rules.kuitan)) out.push('tanyao');

  // 么九系（字牌は yaochu に含むので all-honor は下の else 経由で字一色になる）
  if (tiles.every(isYaochu)) {
    if (!hasHonor) out.push('chinroutou'); // 清老頭（老頭のみ。役満）
    else if (hasTerminal) out.push('honroutou'); // 混老頭（老頭＋字）
    else out.push('tsuuiisou'); // 字一色（字のみ。役満）
  }

  // 緑一色
  if (tiles.every(isGreen)) out.push('ryuuiisou');
}

// ── 標準形（4面子1雀頭）固有の役 ───────────────────────────

function detectStandard(
  out: YakuId[],
  d: Decomposition,
  hand: Hand,
  table: Table,
  win: WinContext,
  menzen: boolean,
): void {
  const pair = d.melds.find((m) => m.type === 'pair')!;
  const sets = d.melds.filter((m) => m.type !== 'pair');
  const triplets = sets.filter((m) => m.type === 'kotsu' || m.type === 'kantsu');
  const shuntsu = sets.filter((m) => m.type === 'shuntsu');

  // 平和：門前・全順子・役牌でない雀頭・両面待ち
  if (
    menzen &&
    shuntsu.length === 4 &&
    !isYakuhaiTile(pair.tiles[0]!, table.roundWind, win.seatWind) &&
    d.wait === 'ryanmen'
  ) {
    out.push('pinfu');
  }

  // 一盃口 / 二盃口（門前）。形の出所は findPeikou（ハイライトと共有）。
  if (menzen) {
    const peikou = findPeikou(shuntsu).length;
    if (peikou >= 2) out.push('ryanpeikou');
    else if (peikou === 1) out.push('iipeikou');
  }

  // 役牌（三元牌・場風・自風）
  for (const m of triplets) {
    const t = m.tiles[0]!;
    if (t.kind !== 'honor') continue;
    if (t.honor === 'haku') out.push('yakuhai-haku');
    else if (t.honor === 'hatsu') out.push('yakuhai-hatsu');
    else if (t.honor === 'chun') out.push('yakuhai-chun');
    if (t.honor === table.roundWind) out.push('yakuhai-round');
    if (t.honor === win.seatWind) out.push('yakuhai-seat'); // 連風は round/seat 両方計上
  }

  // 三色同順 / 三色同刻 / 一気通貫（形の出所は finder。ハイライトと共有）。
  if (findSanshokuDoujun(shuntsu)) out.push('sanshoku-doujun');
  if (findSanshokuDoukou(triplets)) out.push('sanshoku-doukou');
  if (findIttsuu(shuntsu)) out.push('ittsuu');

  // チャンタ / ジュンチャン（全面子・雀頭が么九を含み、順子あり）
  const allMeldsHaveYaochu = d.melds.every((m) => m.tiles.some(isYaochu));
  if (allMeldsHaveYaochu && shuntsu.length > 0) {
    const hasHonor = d.melds.some((m) => m.tiles.some(isHonor));
    out.push(hasHonor ? 'chanta' : 'junchan');
  }

  // 対々和
  if (triplets.length === 4) out.push('toitoi');

  // 暗刻数（形の出所は concealedTriplets。ロン完成の刻子は明刻＝除外。ハイライトと共有）。
  // 暗刻4は上位から順に全部積む（四暗刻単騎→四暗刻→三暗刻）。上位が enabledYaku でオフでも
  // 下位へ格下げできるように候補を出し切る（余分は finalize の置換・役満抑制が畳む）。
  const ankou = concealedTriplets(triplets, hand, win, d.wait).length;
  if (ankou === 4) {
    if (d.wait === 'tanki') out.push('suuankou-tanki');
    out.push('suuankou', 'sanankou');
  } else if (ankou === 3) {
    out.push('sanankou');
  }

  // 三槓子 / 四槓子
  const kantsuCount = sets.filter((m) => m.type === 'kantsu').length;
  if (kantsuCount === 4) out.push('suukantsu');
  else if (kantsuCount === 3) out.push('sankantsu');

  // 三元牌（小三元 / 大三元）
  const dragonTriplets = triplets.filter((m) => isDragon(m.tiles[0]!)).length;
  const pairIsDragon = isDragon(pair.tiles[0]!);
  if (dragonTriplets === 3) out.push('daisangen');
  else if (dragonTriplets === 2 && pairIsDragon) out.push('shousangen');

  // 風牌（小四喜 / 大四喜）
  const windTriplets = triplets.filter((m) => isWindTile(m.tiles[0]!)).length;
  const pairIsWind = isWindTile(pair.tiles[0]!);
  if (windTriplets === 4) out.push('daisuushi');
  else if (windTriplets === 3 && pairIsWind) out.push('shousuushi');
}

/** 九蓮宝燈（門前・清一色・1112345678999＋1）。純正は九面待ち */
function detectChuuren(
  out: YakuId[],
  tiles: Tile[],
  menzen: boolean,
  winningTile: Tile,
): void {
  if (!menzen || tiles.length !== 14) return;
  let suit: string | null = null;
  for (const t of tiles) {
    if (t.kind !== 'suited') return; // 字牌混じりは不可
    if (suit === null) suit = t.suit;
    else if (suit !== t.suit) return; // 清一色のみ
  }
  const ranks = new Array<number>(10).fill(0);
  for (const t of tiles) if (t.kind === 'suited') ranks[t.rank] = ranks[t.rank]! + 1;
  if (ranks[1]! < 3 || ranks[9]! < 3) return;
  for (let r = 1; r <= 9; r++) if (ranks[r]! < 1) return; // 1–9 すべて1枚以上＝合計14で余り1枚

  // 純正：上がり牌を除くと純form（3,1,1,1,1,1,1,1,3）＝九面待ち
  if (winningTile.kind === 'suited' && suit === winningTile.suit) {
    const pure = [0, 3, 1, 1, 1, 1, 1, 1, 1, 3];
    ranks[winningTile.rank] = ranks[winningTile.rank]! - 1;
    const isPure = ranks.every((c, r) => c === pure[r]);
    ranks[winningTile.rank] = ranks[winningTile.rank]! + 1;
    out.push(isPure ? 'chuuren-junsei' : 'chuuren');
    return;
  }
  out.push('chuuren');
}

// ── 仕上げ（排他・役満抑制・enabledYaku） ──────────────────

function finalize(detected: YakuId[], rules: RuleSettings): YakuId[] {
  let ids = unique(detected);

  // enabledYaku でオフの役を除外（未指定＝オン）。置換・役満抑制より先に行う：後だとオフの
  // 上位役が下位役を消した後に自分も消え、手全体が「役なし・0点」になりうる（enabledYaku は
  // 出題・判定範囲の設定＝scoring-rules §5 であって、和了自体を消す設定ではない）
  ids = ids.filter((id) => rules.enabledYaku[id] !== false);

  // 上位役で下位を置換（オフで上位が消えていれば下位が生きる＝格下げ）
  if (ids.includes('ryanpeikou')) ids = ids.filter((id) => id !== 'iipeikou');
  if (ids.includes('kokushi-13')) ids = ids.filter((id) => id !== 'kokushi');
  if (ids.includes('suuankou-tanki')) ids = ids.filter((id) => id !== 'suuankou');
  if (ids.includes('chuuren-junsei')) ids = ids.filter((id) => id !== 'chuuren');
  if (ids.includes('daisuushi')) ids = ids.filter((id) => id !== 'shousuushi');
  if (ids.includes('daisangen')) ids = ids.filter((id) => id !== 'shousangen');

  // 役満が成立したら通常役は落とす（役満は固定点）
  const yakuman = ids.filter((id) => getYaku(id)?.yakuman);
  if (yakuman.length > 0) ids = yakuman;

  return ids;
}

// ── 補助 ───────────────────────────────────────────────────

function allTilesOf(d: Decomposition): Tile[] {
  if (d.specialForm) return d.specialTiles ?? [];
  return d.melds.flatMap((m) => m.tiles);
}

function distinctKinds(tiles: Tile[]): number {
  return new Set(tiles.map(tileKind)).size;
}

function unique(ids: YakuId[]): YakuId[] {
  return [...new Set(ids)];
}

/** 順子/刻子のスート（数牌のみ。字牌刻子は null） */
function meldSuit(m: Meld): string | null {
  const t = m.tiles[0]!;
  return t.kind === 'suited' ? t.suit : null;
}

/** 面子の最小ランク（順子の開始ランク） */
function meldLowRank(m: Meld): number {
  let min = 10;
  for (const t of m.tiles) if (t.kind === 'suited' && t.rank < min) min = t.rank;
  return min;
}

function isYakuhaiTile(t: Tile, roundWind: Wind, seatWind: Wind): boolean {
  if (t.kind !== 'honor') return false;
  return isDragon(t) || t.honor === roundWind || t.honor === seatWind;
}

/** 緑一色の構成牌（索子 2/3/4/6/8 と發）か */
function isGreen(t: Tile): boolean {
  if (t.kind === 'honor') return t.honor === 'hatsu';
  return t.suit === 'sou' && [2, 3, 4, 6, 8].includes(t.rank);
}

// ── 役の形（finder） ───────────────────────────────────────
// 役の「形」の唯一の出所。判定（detectStandard）は「形があるか？＝null でないか」で使い、
// ハイライト（yaku-highlight.ts）は「その形の面子＝牌」を使う。両者が同じ定義を共有することで、
// 判定とハイライトがサイレントに乖離しない（data-model §10）。

const SUITS3 = ['man', 'pin', 'sou'] as const;

/** Map<K, Meld[]> に push（無ければ初期化） */
function groupMeld<K>(map: Map<K, Meld[]>, key: K, m: Meld): void {
  const arr = map.get(key);
  if (arr) arr.push(m);
  else map.set(key, [m]);
}

/** 三色同順を成す3順子（man/pin/sou が同じ開始ランクでそろう最初のランク）。無ければ null。 */
export function findSanshokuDoujun(shuntsu: Meld[]): Meld[] | null {
  const byRank = new Map<number, Meld[]>();
  for (const m of shuntsu) groupMeld(byRank, meldLowRank(m), m);
  for (const melds of byRank.values()) {
    const suits = new Set(melds.map(meldSuit));
    if (SUITS3.every((s) => suits.has(s))) {
      return SUITS3.map((s) => melds.find((m) => meldSuit(m) === s)!);
    }
  }
  return null;
}

/** 三色同刻を成す3刻子（man/pin/sou が同じランク）。無ければ null。 */
export function findSanshokuDoukou(triplets: Meld[]): Meld[] | null {
  const byRank = new Map<number, Meld[]>();
  for (const m of triplets) {
    const t = m.tiles[0]!;
    if (t.kind === 'suited') groupMeld(byRank, t.rank, m);
  }
  for (const melds of byRank.values()) {
    const suits = new Set(melds.map(meldSuit));
    if (SUITS3.every((s) => suits.has(s))) {
      return SUITS3.map((s) => melds.find((m) => meldSuit(m) === s)!);
    }
  }
  return null;
}

/** 一気通貫を成す 123/456/789（同色）。無ければ null。 */
export function findIttsuu(shuntsu: Meld[]): Meld[] | null {
  for (const suit of SUITS3) {
    const inSuit = shuntsu.filter((m) => meldSuit(m) === suit);
    const starts = new Set(inSuit.map(meldLowRank));
    if (starts.has(1) && starts.has(4) && starts.has(7)) {
      return [1, 4, 7].map((r) => inSuit.find((m) => meldLowRank(m) === r)!);
    }
  }
  return null;
}

/** 同種同順の順子の組（各組＝同一の2順子）。length で一盃口(1)/二盃口(2) を判定し、
 *  ハイライトは先頭から必要数の組の牌を使う。 */
export function findPeikou(shuntsu: Meld[]): Meld[][] {
  const byKind = new Map<string, Meld[]>();
  for (const m of shuntsu) groupMeld(byKind, `${meldSuit(m)}-${meldLowRank(m)}`, m);
  const pairs: Meld[][] = [];
  for (const ms of byKind.values()) {
    for (let i = 0; i + 1 < ms.length; i += 2) pairs.push([ms[i]!, ms[i + 1]!]);
  }
  return pairs;
}

/** 暗刻（暗槓含む）の集合。ロンで完成した刻子（シャンポン待ちのロン牌を含む刻子）は明刻＝除外。
 *  三暗刻/四暗刻の判定（length）と、その牌のハイライトの単一の出所（scoring-rules §1.1・§2）。 */
export function concealedTriplets(
  triplets: Meld[],
  hand: Hand,
  win: WinContext,
  wait: WaitType,
): Meld[] {
  const ronTripletId = win.win === 'ron' && wait === 'shanpon' ? hand.winningTile.id : -1;
  return triplets.filter(
    (m) => !m.open && !(ronTripletId >= 0 && m.tiles.some((t) => t.id === ronTripletId)),
  );
}
