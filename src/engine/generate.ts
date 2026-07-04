import type {
  Tile,
  Meld,
  MeldType,
  Wind,
  Honor,
  Hand,
  Table,
  WinContext,
  YakuId,
  RuleSettings,
  StudyMode,
  Progress,
} from '../types/index.ts';
import { tileFromId, tileKind, kindOfSuited, kindOfHonor, HONORS, TILE_KINDS, TILE_COPIES } from './tiles.ts';
import { type Rng, randInt, pick, shuffle } from './rng.ts';
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
 */
export type Difficulty = 'easy' | 'medium' | 'hard';

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
 *  省略時は RuleSettings.round に従いランダム（単発生成）。generation.md §2。 */
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
      const plan = applyContext(def.build(rng, rules, roundWind), seed, rng, rules);
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

interface SetSpec {
  type: MeldType;
  kinds: number[]; // 牌種別（0–33）の並び
  open?: boolean; // 副露（明）か
}

interface BuildPlan {
  seed: YakuId;
  melds: SetSpec[]; // 通常は4面子＋雀頭（七対子は7対子）
  winning: { meldIndex: number; kind: number }; // 上がり牌が完成させる面子（門前＝閉じた面子）
  table: Table;
  winContext: WinContext;
}

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

// ── 牌種別・面子スペックのヘルパ ───────────────────────────

const SUITS3 = ['man', 'pin', 'sou'] as const;
const WINDS: readonly Wind[] = ['east', 'south', 'west', 'north'];
const DRAGONS: readonly Honor[] = ['haku', 'hatsu', 'chun'];

// kind 算術の出所は tiles.ts。生成 DSL の terse な別名として委譲する（num=数牌, honKind=字牌）。
function num(suit: (typeof SUITS3)[number], rank: number): number {
  return kindOfSuited(suit, rank);
}
function honKind(honor: Honor): number {
  return kindOfHonor(honor);
}
function sh(suit: (typeof SUITS3)[number], start: number): SetSpec {
  return { type: 'shuntsu', kinds: [num(suit, start), num(suit, start + 1), num(suit, start + 2)] };
}
function ko(kind: number): SetSpec {
  return { type: 'kotsu', kinds: [kind, kind, kind] };
}
function pr(kind: number): SetSpec {
  return { type: 'pair', kinds: [kind, kind] };
}

function makeCtx(rng: Rng, over: Partial<WinContext> = {}): WinContext {
  return {
    seatWind: pick(rng, WINDS),
    win: pick(rng, ['ron', 'tsumo'] as const),
    riichi: false,
    doubleRiichi: false,
    ippatsu: false,
    haitei: false,
    houtei: false,
    rinshan: false,
    chankan: false,
    tenho: false,
    chiho: false,
    ...over,
  };
}
/** 場風を決める：roundWind が渡されればそれ、なければ RuleSettings.round に従う（generation.md §2） */
function makeTable(rng: Rng, rules: RuleSettings, roundWind?: Wind): Table {
  return {
    roundWind:
      roundWind ?? (rules.round === 'east-fixed' ? 'east' : pick(rng, ['east', 'south'] as const)),
    doraIndicators: [],
  };
}

/** 中張（2–8）の面子をランダムに1つ */
function randSimpleSet(rng: Rng): SetSpec {
  const s = pick(rng, SUITS3);
  return rng() < 0.5 ? sh(s, 2 + randInt(rng, 5)) : ko(num(s, 2 + randInt(rng, 7)));
}
/** 任意の数牌面子をランダムに1つ */
function randSet(rng: Rng): SetSpec {
  const s = pick(rng, SUITS3);
  return rng() < 0.5 ? sh(s, 1 + randInt(rng, 7)) : ko(num(s, 1 + randInt(rng, 9)));
}

// ── シード役の構築器（band＝難易度帯） ─────────────────────

interface SeedDef {
  band: Difficulty;
  build: (rng: Rng, rules: RuleSettings, roundWind: Wind | undefined) => BuildPlan;
}

const SEEDS: Partial<Record<YakuId, SeedDef>> = {
  // ── 易 ──
  tanyao: {
    band: 'easy',
    build: (rng, rules, roundWind) => {
      const melds = [randSimpleSet(rng), randSimpleSet(rng), randSimpleSet(rng), randSimpleSet(rng)];
      melds.push(pr(num(pick(rng, SUITS3), 2 + randInt(rng, 7))));
      const m0 = melds[0]!;
      return {
        seed: 'tanyao',
        melds,
        winning: { meldIndex: 0, kind: m0.kinds[m0.kinds.length - 1]! },
        table: makeTable(rng, rules, roundWind),
        winContext: makeCtx(rng),
      };
    },
  },
  chiitoitsu: {
    band: 'easy',
    build: (rng, rules, roundWind) => {
      const kinds = shuffle(rng, range(TILE_KINDS)).slice(0, 7);
      return {
        seed: 'chiitoitsu',
        melds: kinds.map(pr),
        winning: { meldIndex: 0, kind: kinds[0]! },
        table: makeTable(rng, rules, roundWind),
        winContext: makeCtx(rng),
      };
    },
  },
  toitoi: {
    band: 'easy',
    build: (rng, rules, roundWind) => {
      // 4刻子＋雀頭。1組を副露（明刻）にして四暗刻化を避ける。上がりは雀頭（単騎）
      const ks = shuffle(rng, [num('man', 2 + randInt(rng, 7)), num('pin', 2 + randInt(rng, 7)), num('sou', 2 + randInt(rng, 7)), honKind(pick(rng, WINDS))]);
      const pairKind = honKind(pick(rng, DRAGONS));
      const melds: SetSpec[] = [
        { ...ko(ks[0]!), open: true },
        ko(ks[1]!),
        ko(ks[2]!),
        ko(ks[3]!),
        pr(pairKind),
      ];
      return {
        seed: 'toitoi',
        melds,
        winning: { meldIndex: 4, kind: pairKind },
        table: makeTable(rng, rules, roundWind),
        winContext: makeCtx(rng),
      };
    },
  },
  ...yakuhaiDragon('yakuhai-haku', 'haku'),
  ...yakuhaiDragon('yakuhai-hatsu', 'hatsu'),
  ...yakuhaiDragon('yakuhai-chun', 'chun'),
  'yakuhai-round': {
    band: 'easy',
    build: (rng, rules, roundWind) => {
      // 場風牌の刻子。セッションから場風が来たらそれで構築（局に整合）
      const w = roundWind ?? pick(rng, WINDS);
      const other = pick(rng, WINDS.filter((x) => x !== w)); // 自風は場風と別（連風回避）
      const melds: SetSpec[] = [ko(honKind(w)), randShuntsu(rng), randShuntsu(rng), randShuntsu(rng), pr(num(pick(rng, SUITS3), 2 + randInt(rng, 7)))];
      return {
        seed: 'yakuhai-round',
        melds,
        winning: { meldIndex: 0, kind: honKind(w) },
        table: makeTable(rng, rules, w),
        winContext: makeCtx(rng, { seatWind: other }),
      };
    },
  },
  'yakuhai-seat': {
    band: 'easy',
    build: (rng, rules, roundWind) => {
      // 自風牌の刻子。自風は random、場風はセッション指定があればそれ（無ければ自風と別）
      const w = pick(rng, WINDS);
      const round = roundWind ?? pick(rng, WINDS.filter((x) => x !== w));
      const melds: SetSpec[] = [ko(honKind(w)), randShuntsu(rng), randShuntsu(rng), randShuntsu(rng), pr(num(pick(rng, SUITS3), 2 + randInt(rng, 7)))];
      return {
        seed: 'yakuhai-seat',
        melds,
        winning: { meldIndex: 0, kind: honKind(w) },
        table: makeTable(rng, rules, round),
        winContext: makeCtx(rng, { seatWind: w }),
      };
    },
  },

  // ── 中 ──
  'sanshoku-doujun': {
    band: 'medium',
    build: (rng, rules, roundWind) => {
      const r = 1 + randInt(rng, 7);
      const melds: SetSpec[] = [sh('man', r), sh('pin', r), sh('sou', r), randSet(rng), pr(honKind(pick(rng, [...WINDS, ...DRAGONS])))];
      return {
        seed: 'sanshoku-doujun',
        melds,
        winning: { meldIndex: 0, kind: num('man', r + 2) },
        table: makeTable(rng, rules, roundWind),
        winContext: makeCtx(rng),
      };
    },
  },
  'sanshoku-doukou': {
    band: 'medium',
    build: (rng, rules, roundWind) => {
      // 同じ数の刻子を3色。1組を副露（明刻）にして三暗刻の常伴を避ける（toitoi と同じ手筋）。
      // 上がりは4つ目の順子側＝刻子を崩さない
      const r = 1 + randInt(rng, 9);
      const openIdx = randInt(rng, 3);
      const s4 = randShuntsu(rng);
      const melds: SetSpec[] = [
        ...SUITS3.map((s, i) => (i === openIdx ? { ...ko(num(s, r)), open: true } : ko(num(s, r)))),
        s4,
        pr(honKind(pick(rng, [...WINDS, ...DRAGONS]))),
      ];
      return {
        seed: 'sanshoku-doukou',
        melds,
        winning: { meldIndex: 3, kind: s4.kinds[2]! },
        table: makeTable(rng, rules, roundWind),
        winContext: makeCtx(rng),
      };
    },
  },
  ittsuu: {
    band: 'medium',
    build: (rng, rules, roundWind) => {
      const s = pick(rng, SUITS3);
      const melds: SetSpec[] = [sh(s, 1), sh(s, 4), sh(s, 7), ko(honKind(pick(rng, DRAGONS))), pr(honKind(pick(rng, WINDS)))];
      return {
        seed: 'ittsuu',
        melds,
        winning: { meldIndex: 1, kind: num(s, 5) },
        table: makeTable(rng, rules, roundWind),
        winContext: makeCtx(rng),
      };
    },
  },
  honitsu: {
    band: 'medium',
    build: (rng, rules, roundWind) => {
      const s = pick(rng, SUITS3);
      // 2順子の開始ランク（各 1–7。独立なので一致しうる＝混一色に一盃口が乗ることもある）
      const a = 1 + randInt(rng, 7);
      const b = 1 + randInt(rng, 7);
      const melds: SetSpec[] = [sh(s, a), sh(s, b), ko(honKind(pick(rng, DRAGONS))), ko(honKind(pick(rng, WINDS))), pr(num(s, 1 + randInt(rng, 9)))];
      return {
        seed: 'honitsu',
        melds,
        winning: { meldIndex: 0, kind: num(s, a + 2) },
        table: makeTable(rng, rules, roundWind),
        winContext: makeCtx(rng),
      };
    },
  },
  chinitsu: {
    band: 'medium',
    build: (rng, rules, roundWind) => {
      const s = pick(rng, SUITS3);
      const melds: SetSpec[] = [sh(s, 1 + randInt(rng, 7)), sh(s, 1 + randInt(rng, 7)), sh(s, 1 + randInt(rng, 7)), ko(num(s, 1 + randInt(rng, 9))), pr(num(s, 1 + randInt(rng, 9)))];
      const m0 = melds[0]!;
      return {
        seed: 'chinitsu',
        melds,
        winning: { meldIndex: 0, kind: m0.kinds[2]! },
        table: makeTable(rng, rules, roundWind),
        winContext: makeCtx(rng),
      };
    },
  },
  iipeikou: {
    band: 'medium',
    build: (rng, rules, roundWind) => {
      const s = pick(rng, SUITS3);
      const r = 1 + randInt(rng, 7);
      const hs = shuffle(rng, HONORS.map(honKind));
      const melds: SetSpec[] = [sh(s, r), sh(s, r), ko(hs[0]!), ko(hs[1]!), pr(hs[2]!)];
      return {
        seed: 'iipeikou',
        melds,
        winning: { meldIndex: 2, kind: hs[0]! },
        table: makeTable(rng, rules, roundWind),
        winContext: makeCtx(rng),
      };
    },
  },

  shousangen: {
    band: 'medium',
    build: (rng, rules, roundWind) => {
      // 三元牌のうち2種が刻子＋残り1種が雀頭。役牌2つと必ず複合（実質4翻）が学習ポイント。
      // 自由部分は順子2つ（刻子を足すと三暗刻・対々和へ流れて主役がぼやける）
      const [d1, d2, dp] = shuffle(rng, [...DRAGONS]);
      const s3 = randShuntsu(rng);
      const melds: SetSpec[] = [ko(honKind(d1!)), ko(honKind(d2!)), s3, randShuntsu(rng), pr(honKind(dp!))];
      return {
        seed: 'shousangen',
        melds,
        winning: { meldIndex: 2, kind: s3.kinds[2]! },
        table: makeTable(rng, rules, roundWind),
        winContext: makeCtx(rng),
      };
    },
  },
  honroutou: {
    band: 'medium',
    build: (rng, rules, roundWind) => {
      // 么九牌のみの刻子4＋雀頭（対々和と必ず複合）。刻子は老頭2＋字2の固定比で混ぜる：
      // 老頭のみ＝清老頭／字のみ＝字一色に加え、字刻子3つを許すと大三元（三元3刻子）や
      // 小四喜（風3刻子＋風雀頭）の役満にも倒れるため、字刻子は2つまでに抑える。
      // 1組副露で四暗刻化も避ける。上がりは雀頭（単騎）＝toitoi と同じ
      const terms = shuffle(rng, SUITS3.flatMap((s) => [num(s, 1), num(s, 9)]));
      const hons = shuffle(rng, HONORS.map(honKind));
      const pairKind = pick(rng, [...terms.slice(2), ...hons.slice(2)]);
      const melds: SetSpec[] = [
        { ...ko(terms[0]!), open: true },
        ko(terms[1]!),
        ko(hons[0]!),
        ko(hons[1]!),
        pr(pairKind),
      ];
      return {
        seed: 'honroutou',
        melds,
        winning: { meldIndex: 4, kind: pairKind },
        table: makeTable(rng, rules, roundWind),
        winContext: makeCtx(rng),
      };
    },
  },

  // ── 難 ──
  pinfu: {
    band: 'hard',
    build: (rng, rules, roundWind) => {
      const s0 = pick(rng, SUITS3);
      const start = 2 + randInt(rng, 5); // 2–6 始まり＝両面が成立する位置
      const melds: SetSpec[] = [sh(s0, start), randShuntsu(rng), randShuntsu(rng), randShuntsu(rng), pr(num(pick(rng, SUITS3), 2 + randInt(rng, 7)))];
      return {
        seed: 'pinfu',
        melds,
        winning: { meldIndex: 0, kind: num(s0, start + 2) }, // 両面の上端で和了
        table: makeTable(rng, rules, roundWind),
        winContext: makeCtx(rng),
      };
    },
  },
  chanta: {
    band: 'hard',
    build: (rng, rules, roundWind) => {
      const term = () => pick(rng, [1, 7] as const); // 123 or 789（端を含む順子）
      const melds: SetSpec[] = [
        sh(pick(rng, SUITS3), term()),
        sh(pick(rng, SUITS3), term()),
        ko(honKind(pick(rng, [...WINDS, ...DRAGONS]))), // 字牌刻子（混＝chanta 条件）
        ko(num(pick(rng, SUITS3), pick(rng, [1, 9] as const))),
        pr(honKind(pick(rng, [...WINDS, ...DRAGONS]))),
      ];
      const m0 = melds[0]!;
      return {
        seed: 'chanta',
        melds,
        winning: { meldIndex: 0, kind: m0.kinds[1]! }, // 嵌張でも端牌は手に残る
        table: makeTable(rng, rules, roundWind),
        winContext: makeCtx(rng),
      };
    },
  },
  junchan: {
    band: 'hard',
    build: (rng, rules, roundWind) => {
      // チャンタの字牌なし版＝全面子・雀頭が老頭牌（1/9）を含む。順子3つで清老頭（刻子のみ＝役満）に倒さない
      const term = () => pick(rng, [1, 7] as const); // 123 or 789（端を含む順子）
      const one9 = () => pick(rng, [1, 9] as const);
      const melds: SetSpec[] = [
        sh(pick(rng, SUITS3), term()),
        sh(pick(rng, SUITS3), term()),
        sh(pick(rng, SUITS3), term()),
        ko(num(pick(rng, SUITS3), one9())),
        pr(num(pick(rng, SUITS3), one9())),
      ];
      const m0 = melds[0]!;
      return {
        seed: 'junchan',
        melds,
        winning: { meldIndex: 0, kind: m0.kinds[1]! }, // 嵌張でも端牌は手に残る（chanta と同じ）
        table: makeTable(rng, rules, roundWind),
        winContext: makeCtx(rng),
      };
    },
  },
  sanankou: {
    band: 'hard',
    build: (rng, rules, roundWind) => {
      // 3暗刻＋順子＋雀頭。上がりは順子側にして3刻子を暗刻のまま保つ
      const melds: SetSpec[] = [
        ko(num('man', 2 + randInt(rng, 7))),
        ko(num('pin', 2 + randInt(rng, 7))),
        ko(num('sou', 2 + randInt(rng, 7))),
        sh(pick(rng, SUITS3), 2 + randInt(rng, 5)),
        pr(honKind(pick(rng, [...WINDS, ...DRAGONS]))),
      ];
      const sset = melds[3]!;
      return {
        seed: 'sanankou',
        melds,
        winning: { meldIndex: 3, kind: sset.kinds[2]! },
        table: makeTable(rng, rules, roundWind),
        winContext: makeCtx(rng),
      };
    },
  },
  ryanpeikou: {
    band: 'hard',
    build: (rng, rules, roundWind) => {
      const [s1, s2] = shuffle(rng, [...SUITS3]);
      const r1 = 1 + randInt(rng, 7);
      const r2 = 1 + randInt(rng, 7);
      const melds: SetSpec[] = [sh(s1!, r1), sh(s1!, r1), sh(s2!, r2), sh(s2!, r2), pr(honKind(pick(rng, HONORS)))];
      return {
        seed: 'ryanpeikou',
        melds,
        winning: { meldIndex: 0, kind: num(s1!, r1 + 2) },
        table: makeTable(rng, rules, roundWind),
        winContext: makeCtx(rng),
      };
    },
  },
};

/** 役牌（三元牌）の構築器を作る小ヘルパ */
function yakuhaiDragon(seed: YakuId, dragon: Honor): Partial<Record<YakuId, SeedDef>> {
  return {
    [seed]: {
      band: 'easy',
      build: (rng: Rng, rules: RuleSettings, roundWind: Wind | undefined): BuildPlan => {
        const melds: SetSpec[] = [
          ko(honKind(dragon)),
          randSet(rng),
          randSet(rng),
          randSet(rng),
          pr(num(pick(rng, SUITS3), 2 + randInt(rng, 7))),
        ];
        return {
          seed,
          melds,
          winning: { meldIndex: 0, kind: honKind(dragon) },
          table: makeTable(rng, rules, roundWind),
          winContext: makeCtx(rng),
        };
      },
    },
  };
}

function randShuntsu(rng: Rng): SetSpec {
  return sh(pick(rng, SUITS3), 1 + randInt(rng, 7));
}
function range(n: number): number[] {
  return Array.from({ length: n }, (_unused, i) => i);
}
