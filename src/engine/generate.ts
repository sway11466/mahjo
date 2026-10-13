import type {
  Tile,
  Meld,
  Wind,
  Hand,
  Table,
  WinContext,
  YakuId,
  RuleSettings,
  StudyMode,
  Progress,
} from '../types/index.ts';
import { tileFromId, tileKind, kindOfSuited, TILE_KINDS, TILE_COPIES } from './tiles.ts';
import { type Rng, randInt, pick, shuffle } from './rng.ts';
import { SEEDS, type Difficulty, type BuildPlan, type SetSpec } from './generate-seeds.ts';
import { parse } from './parse.ts';
import { detectYaku } from './yaku.ts';
import { getYaku } from './yaku-table.ts';
import { riichiActive } from './score.ts';

/**
 * 出題生成（役シード方式）。出題対象の役プールからシード役を1つ抽選し、それを必ず含む
 * 合法和了形を構築する（generation.md §1）。純粋関数・rng 注入で決定的（testing.md §7）。
 *
 * 難易度（generation.md §2）：見抜きの難しさで易→難の3帯に分け、現在キャラ・モードの
 * 累計正答数（Progress.correctByMode）で上の帯を解放する（増える方向のみ）。
 *   出題プール ＝ enabledYaku（オン） ∩ アンロック済み帯 ∩ 構築器のある役。
 * シード役は「生成のきっかけ」にすぎず、表示する採点はエンジンが実際に検出した内容が正。
 *
 * 役ごとの構築器（SEEDS）と構築計画の型は generate-seeds.ts（データ性の強い部分を分離）。
 * 本ファイルは 出題のオーケストレーション（帯・プール・生成後ガード）・和了状況の付与
 * （applyContext）・実体化（realize）を持つ。
 */
export type { Difficulty } from './generate-seeds.ts';

/** 帯のアンロックしきい値（仮。generation.md §2。correctByMode[mode] がこの値以上で解放） */
export const BAND_THRESHOLD: Record<Exclude<Difficulty, 'easy'>, number> = {
  medium: 10,
  hard: 30,
};

/** 帯の順序（生成後ガードの比較用）。役満は最上位超え（YAKUMAN_RANK）。 */
const BAND_RANK: Record<Difficulty, number> = { easy: 0, medium: 1, hard: 2 };
const YAKUMAN_RANK = 3;

/** 和了状況を付与する確率（仮）。副露可能シードを副露に / 門前手をリーチに / リーチ手を一発に。 */
const P_OPEN = 0.4;
const P_RIICHI = 0.3;
const P_DOUBLE_RIICHI = 0.1; // リーチのうち第一巡宣言＝ダブルリーチにする割合（riichi と排他）
const P_IPPATSU = 0.05;
const P_KAN = 0.15; // 暗刻を槓子化する確率
const P_RINSHAN = 0.3; // 槓ツモ手を嶺上開花にする確率

/** 副露版を作らないシード：門前限定役（副露で不成立）＋副露で形が崩れる役（三暗刻）。 */
const NO_OPEN_SEEDS: YakuId[] = ['pinfu', 'iipeikou', 'ryanpeikou', 'chiitoitsu', 'sanankou'];

export interface GeneratedQuestion {
  seed: YakuId; // 生成のきっかけになった役
  hand: Hand;
  table: Table;
  winContext: WinContext;
}

/** 進捗（キャラ・モード別）から解放済みの難易度帯を求める。増える方向のみ。 */
export function unlockedBands(progress: Progress, mode: StudyMode): Difficulty[] {
  const n = progress.correctByMode[mode] ?? 0;
  const bands: Difficulty[] = ['easy'];
  if (n >= BAND_THRESHOLD.medium) bands.push('medium');
  if (n >= BAND_THRESHOLD.hard) bands.push('hard');
  return bands;
}

/** 出題プール ＝ オン役 ∩ 指定帯 ∩ 構築器のある役 */
export function seedPool(rules: RuleSettings, bands: Difficulty[]): YakuId[] {
  return seedIds().filter(
    (id) => bands.includes(SEEDS[id]!.band) && rules.enabledYaku[id] !== false,
  );
}

/** 出題可能な RuleSettings に整える：enabledYaku が構築器のある役を全てオフにしているとき
 *  （localStorage の手編集・部分破損。設定UIは最後のシード役をロックするので通常操作では
 *  起きない）、enabledYaku を無視した rules を返す。解釈できないデータで止まる（generate が
 *  throw → 白画面）より既定で動く（storage.md §5 の防御方針）。生成と採点は同じ rules を
 *  見るので、出題の入口（session/problem）でこれを一度通し、「生成は通るが採点は全役オフ＝
 *  役なし」のねじれも防ぐ。 */
export function sanitizeForGeneration(rules: RuleSettings): RuleSettings {
  if (seedIds().some((id) => rules.enabledYaku[id] !== false)) return rules;
  return { ...rules, enabledYaku: {} };
}

/** 進捗・モードに応じて1問生成する（高レベルの入口）。
 *  roundWind を渡すとその場風で（セッションの局に整合させて）生成する。
 *  省略時は東・南からランダム（単発生成）。generation.md §2。 */
export function generate(
  progress: Progress,
  mode: StudyMode,
  rng: Rng,
  rules: RuleSettings,
  roundWind?: Wind,
): GeneratedQuestion {
  const bands = unlockedBands(progress, mode);
  let pool = seedPool(rules, bands);
  if (pool.length === 0) {
    // 解放帯の役が全てオフ等で空なら、オンの構築器付き役へフォールバック（防御的）
    pool = seedIds().filter((id) => rules.enabledYaku[id] !== false);
  }
  if (pool.length === 0) throw new Error('no seed available');

  const seed = pick(rng, pool);
  const cap = BAND_RANK[bands[bands.length - 1]!]; // 解放帯の最上位

  // 生成後ガード（generation.md §3）：複合役で実現難易度が解放帯を超えたら1回だけ振り直し、
  // それでも超えたら許容する（複合役は学習上むしろ歓迎・厳密保証はしない）。
  // ただし役満は許容しない：役満シードは未対応（parking lot）で、通り抜けると翻あての正解値が
  // 壊れる（summarize が han:0 を返す）ため、役満でなくなるまで振り直す。
  let q = generateForSeed(seed, rng, rules, roundWind);
  let bandRerolled = false;
  for (let attempt = 0; attempt < 300; attempt++) {
    const rank = realizedRank(q, rules);
    if (rank >= YAKUMAN_RANK) {
      q = generateForSeed(seed, rng, rules, roundWind);
    } else if (rank > cap && !bandRerolled) {
      bandRerolled = true;
      q = generateForSeed(seed, rng, rules, roundWind);
    } else {
      return q;
    }
  }
  return q; // 振り直し上限（実質到達しない）。役満は mistakes.ts の防御分岐が最終網
}

/** 生成した手が実際に内包する難易度ランク：検出役のうち構築器が持つ band の最大
 *  （役満は最上位超え）。生成後ガードの判定に使う。シード以外の複合役を見て決まる。 */
function realizedRank(q: GeneratedQuestion, rules: RuleSettings): number {
  let rank = 0;
  for (const d of parse(q.hand)) {
    for (const id of detectYaku(d, q.hand, q.table, q.winContext, rules)) {
      const def = SEEDS[id];
      if (def) rank = Math.max(rank, BAND_RANK[def.band]);
      else if (getYaku(id)?.yakuman) rank = YAKUMAN_RANK;
    }
  }
  return rank;
}

/** 指定したシード役を含む和了形を生成する。roundWind を渡すとその場風で構築する。 */
export function generateForSeed(
  seed: YakuId,
  rng: Rng,
  rules: RuleSettings,
  roundWind?: Wind,
): GeneratedQuestion {
  const def = SEEDS[seed];
  if (!def) throw new Error(`no constructor for seed: ${seed}`);
  for (let attempt = 0; attempt < 300; attempt++) {
    try {
      const plan = applyContext(def.build(rng, roundWind), seed, rng, rules);
      return realize(plan, rng, rules.akaDoraCount);
    } catch (e) {
      if (e instanceof CopyOverflow) continue; // 同種5枚目など。rng を進めて再試行
      throw e;
    }
  }
  throw new Error(`failed to generate seed: ${seed}`);
}

/**
 * 和了状況（槓・副露・リーチ・ダブルリーチ・一発・嶺上）を確率で付与する。順序が大事：
 * 槓（暗槓は門前維持／明槓は門前を崩す）→ 副露（ポン/チー）→ リーチ（門前のときだけ。低確率でダブルリーチ）→ 一発。
 * 明い面子（ポン/チー/明槓）があると門前でなくなり、リーチ・門前ツモは付かない（session.md・generation.md）。
 */
function applyContext(plan: BuildPlan, seed: YakuId, rng: Rng, rules: RuleSettings): BuildPlan {
  let melds = plan.melds;

  // 槓：勝ち面子でない暗刻を1つ槓子化（暗槓。副露可能な役なら明槓も）
  const kanIdx = melds.findIndex(
    (m, i) => i !== plan.winning.meldIndex && m.type === 'kotsu' && !m.open,
  );
  if (kanIdx >= 0 && rng() < P_KAN) {
    const open = canOpen(seed, rules) && rng() < 0.5; // 明槓 or 暗槓
    const k = melds[kanIdx]!.kinds[0]!;
    melds = melds.map((m, i) => (i === kanIdx ? { type: 'kantsu', kinds: [k, k, k, k], open } : m));
  }

  // 副露：勝ち面子・雀頭・槓でない面子を1つ明（チー/ポン）にする（既に明があればそのまま）
  if (!melds.some((m) => m.open) && canOpen(seed, rules) && rng() < P_OPEN) {
    const idx = melds.findIndex(
      (m, i) => i !== plan.winning.meldIndex && (m.type === 'kotsu' || m.type === 'shuntsu'),
    );
    if (idx >= 0) melds = melds.map((m, i) => (i === idx ? { ...m, open: true } : m));
  }

  // リーチ：門前のときだけ（明い面子なし。暗槓は門前を崩さない）。低確率で第一巡宣言＝
  // ダブルリーチ（riichi とは排他＝scoring-rules §1.1）。リーチ時のみ一発をロール
  let winContext = plan.winContext;
  if (!melds.some((m) => m.open) && rng() < P_RIICHI) {
    const double = rng() < P_DOUBLE_RIICHI;
    winContext = {
      ...winContext,
      riichi: !double,
      doubleRiichi: double,
      ippatsu: rng() < P_IPPATSU,
    };
  }

  // 嶺上開花：槓があってツモなら一定確率で。直前に槓を宣言している＝一発は必ず消える（両立不可）
  if (melds.some((m) => m.type === 'kantsu') && winContext.win === 'tsumo' && rng() < P_RINSHAN) {
    winContext = { ...winContext, rinshan: true, ippatsu: false };
  }

  return { ...plan, melds, winContext };
}

/** その役で副露版を作ってよいか（喰いタンなしの断幺九は副露で消えるので不可） */
function canOpen(seed: YakuId, rules: RuleSettings): boolean {
  if (NO_OPEN_SEEDS.includes(seed)) return false;
  if (seed === 'tanyao' && !rules.kuitan) return false;
  return true;
}

/** 構築器を持つシード役の一覧 */
export function seedIds(): YakuId[] {
  return Object.keys(SEEDS) as YakuId[];
}

// ── 構築計画 → 実体化 ───────────────────────────────────────

class CopyOverflow extends Error {}

/** 計画に実際の Tile を割り当て、契約どおり winningTile を concealed から分離する（data-model §4）。
 *  ドラ表示牌を1枚（リーチ時は裏ドラ表示牌も1枚）付与する。表示牌は手牌と id 衝突しない空きコピーを使う。
 *  akaDora（RuleSettings.akaDoraCount）を上限に赤5を混ぜる（scoring-rules §1.4・§5）。 */
function realize(plan: BuildPlan, rng: Rng, akaDora: number): GeneratedQuestion {
  const used = new Map<number, number>();
  const take = (kind: number): Tile => {
    const c = used.get(kind) ?? 0;
    if (c >= 4) throw new CopyOverflow();
    used.set(kind, c + 1);
    return tileFromId(kind * 4 + c);
  };

  const built = plan.melds.map((spec) => ({ spec, tiles: spec.kinds.map(take) }));
  const wm = built[plan.winning.meldIndex]!;
  if (wm.spec.open) throw new Error('winning meld must be concealed');
  const wTile = wm.tiles.find((t) => tileKind(t) === plan.winning.kind)!;

  // 確定面子（副露＋暗槓）は calledMelds へ。暗槓は open:false を保つ（data-model §2）
  const isCalled = (s: SetSpec): boolean => !!s.open || s.type === 'kantsu';
  const calledMelds: Meld[] = built
    .filter((b) => isCalled(b.spec))
    .map((b) => ({ type: b.spec.type, tiles: b.tiles, open: !!b.spec.open }));
  const concealed: Tile[] = built
    .filter((b) => !isCalled(b.spec))
    .flatMap((b) => b.tiles)
    .filter((t) => t.id !== wTile.id);

  // ドラ表示牌は基本1枚＋カン1つにつき1枚（カンドラ）。リーチ時は裏ドラも同数（scoring-rules §1.4・data-model §5）
  const indicators = 1 + built.filter((b) => b.spec.type === 'kantsu').length;
  const draw = (): Tile => drawIndicator(used, rng);
  const doraIndicators = Array.from({ length: indicators }, draw);
  const table: Table = riichiActive(plan.winContext)
    ? { ...plan.table, doraIndicators, uraDoraIndicators: Array.from({ length: indicators }, draw) }
    : { ...plan.table, doraIndicators };

  // 赤ドラ：割当計画（各色の5のどのコピーが赤か）に載っている牌だけ red を立てる。
  // 手・表示牌の全部に適用する（表示牌の赤は数えない＝score 側の仕様どおり、見た目だけ現実に寄せる）
  const red = redCopyPlan(akaDora, rng);
  const paint = (t: Tile): Tile =>
    t.kind === 'suited' && t.rank === 5 && red.get(tileKind(t))?.has(t.id % TILE_COPIES)
      ? { ...t, red: true }
      : t;

  return {
    seed: plan.seed,
    hand: {
      concealed: concealed.map(paint),
      calledMelds: calledMelds.map((m) => ({ ...m, tiles: m.tiles.map(paint) })),
      winningTile: paint(wTile),
    },
    table: {
      ...table,
      doraIndicators: table.doraIndicators.map(paint),
      ...(table.uraDoraIndicators ? { uraDoraIndicators: table.uraDoraIndicators.map(paint) } : {}),
    },
    winContext: plan.winContext,
  };
}

/** 赤ドラの割当計画：akaDoraCount（生成時の上限＝scoring-rules §5）を萬→筒→索の順に均等配分し、
 *  各色の5のどのコピー（4枚中）を赤にするかを問題ごとに rng で選ぶ。選んだコピーが手・表示牌に
 *  入らなければ赤は出ない＝上限であって出現の保証ではない。id・模様は不変で red だけ立てる
 *  （data-model §1「赤ドラ(red)は設定から決まる」）。0枚（既定）は rng を消費しない。 */
function redCopyPlan(count: number, rng: Rng): Map<number, Set<number>> {
  const plan = new Map<number, Set<number>>();
  const n = Math.max(0, Math.min(12, Math.floor(count))); // 上限12＝5の牌の物理枚数（storage/validate.ts と同じ）
  (['man', 'pin', 'sou'] as const).forEach((suit, i) => {
    const quota = Math.floor(n / 3) + (i < n % 3 ? 1 : 0);
    if (quota > 0) {
      plan.set(kindOfSuited(suit, 5), new Set(shuffle(rng, [0, 1, 2, 3]).slice(0, quota)));
    }
  });
  return plan;
}

/** 手牌で未使用のコピーを使ってドラ表示牌を1枚引く（手牌との id 一意を保証）。used を更新。 */
function drawIndicator(used: Map<number, number>, rng: Rng): Tile {
  let kind = randInt(rng, TILE_KINDS);
  while ((used.get(kind) ?? 0) >= 4) kind = randInt(rng, TILE_KINDS);
  const copy = used.get(kind) ?? 0;
  used.set(kind, copy + 1);
  return tileFromId(kind * 4 + copy);
}
