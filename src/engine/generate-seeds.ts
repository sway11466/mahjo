import type { Wind, Honor, Table, WinContext, YakuId, MeldType } from '../types/index.ts';
import { kindOfSuited, kindOfHonor, HONORS, TILE_KINDS } from './tiles.ts';
import { type Rng, randInt, pick, shuffle } from './rng.ts';

/**
 * シード役の構築器テーブル（generation.md §1 の「構築器」）。役ごとに「その役を必ず含む
 * 合法和了形の構築計画（BuildPlan）」を返すレシピと、見抜きの難易度帯（band＝generation.md §3）
 * を持つ。データ性の強い部分なので、出題のオーケストレーション・和了状況の付与・実体化
 * （generate.ts）から分けて置く。構築器を足す＝このテーブルに1行足す（generate.ts は不変）。
 *
 * 計画は牌種別（kind 0–33）の並びで表し、実際の Tile への割当（各牌4枚以内・winningTile の分離）
 * は generate.ts の realize が行う。
 */
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface SetSpec {
  type: MeldType;
  kinds: number[]; // 牌種別（0–33）の並び
  open?: boolean; // 副露（明）か
}

export interface BuildPlan {
  seed: YakuId;
  melds: SetSpec[]; // 通常は4面子＋雀頭（七対子は7対子）
  winning: { meldIndex: number; kind: number }; // 上がり牌が完成させる面子（門前＝閉じた面子）
  table: Table;
  winContext: WinContext;
}

export interface SeedDef {
  band: Difficulty;
  build: (rng: Rng, roundWind: Wind | undefined) => BuildPlan;
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
/** 場風を決める：roundWind が渡されればそれ、なければ東・南からランダム（generation.md §2） */
function makeTable(rng: Rng, roundWind?: Wind): Table {
  return {
    roundWind: roundWind ?? pick(rng, ['east', 'south'] as const),
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

export const SEEDS: Partial<Record<YakuId, SeedDef>> = {
  // ── 易 ──
  tanyao: {
    band: 'easy',
    build: (rng, roundWind) => {
      const melds = [randSimpleSet(rng), randSimpleSet(rng), randSimpleSet(rng), randSimpleSet(rng)];
      melds.push(pr(num(pick(rng, SUITS3), 2 + randInt(rng, 7))));
      const m0 = melds[0]!;
      return {
        seed: 'tanyao',
        melds,
        winning: { meldIndex: 0, kind: m0.kinds[m0.kinds.length - 1]! },
        table: makeTable(rng, roundWind),
        winContext: makeCtx(rng),
      };
    },
  },
  chiitoitsu: {
    band: 'easy',
    build: (rng, roundWind) => {
      const kinds = shuffle(rng, range(TILE_KINDS)).slice(0, 7);
      return {
        seed: 'chiitoitsu',
        melds: kinds.map(pr),
        winning: { meldIndex: 0, kind: kinds[0]! },
        table: makeTable(rng, roundWind),
        winContext: makeCtx(rng),
      };
    },
  },
  toitoi: {
    band: 'easy',
    build: (rng, roundWind) => {
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
        table: makeTable(rng, roundWind),
        winContext: makeCtx(rng),
      };
    },
  },
  ...yakuhaiDragon('yakuhai-haku', 'haku'),
  ...yakuhaiDragon('yakuhai-hatsu', 'hatsu'),
  ...yakuhaiDragon('yakuhai-chun', 'chun'),
  'yakuhai-round': {
    band: 'easy',
    build: (rng, roundWind) => {
      // 場風牌の刻子。セッションから場風が来たらそれで構築（局に整合）
      const w = roundWind ?? pick(rng, WINDS);
      const other = pick(rng, WINDS.filter((x) => x !== w)); // 自風は場風と別（連風回避）
      const melds: SetSpec[] = [ko(honKind(w)), randShuntsu(rng), randShuntsu(rng), randShuntsu(rng), pr(num(pick(rng, SUITS3), 2 + randInt(rng, 7)))];
      return {
        seed: 'yakuhai-round',
        melds,
        winning: { meldIndex: 0, kind: honKind(w) },
        table: makeTable(rng, w),
        winContext: makeCtx(rng, { seatWind: other }),
      };
    },
  },
  'yakuhai-seat': {
    band: 'easy',
    build: (rng, roundWind) => {
      // 自風牌の刻子。自風は random、場風はセッション指定があればそれ（無ければ自風と別）
      const w = pick(rng, WINDS);
      const round = roundWind ?? pick(rng, WINDS.filter((x) => x !== w));
      const melds: SetSpec[] = [ko(honKind(w)), randShuntsu(rng), randShuntsu(rng), randShuntsu(rng), pr(num(pick(rng, SUITS3), 2 + randInt(rng, 7)))];
      return {
        seed: 'yakuhai-seat',
        melds,
        winning: { meldIndex: 0, kind: honKind(w) },
        table: makeTable(rng, round),
        winContext: makeCtx(rng, { seatWind: w }),
      };
    },
  },

  // ── 中 ──
  'sanshoku-doujun': {
    band: 'medium',
    build: (rng, roundWind) => {
      const r = 1 + randInt(rng, 7);
      const melds: SetSpec[] = [sh('man', r), sh('pin', r), sh('sou', r), randSet(rng), pr(honKind(pick(rng, [...WINDS, ...DRAGONS])))];
      return {
        seed: 'sanshoku-doujun',
        melds,
        winning: { meldIndex: 0, kind: num('man', r + 2) },
        table: makeTable(rng, roundWind),
        winContext: makeCtx(rng),
      };
    },
  },
  'sanshoku-doukou': {
    band: 'medium',
    build: (rng, roundWind) => {
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
        table: makeTable(rng, roundWind),
        winContext: makeCtx(rng),
      };
    },
  },
  ittsuu: {
    band: 'medium',
    build: (rng, roundWind) => {
      const s = pick(rng, SUITS3);
      const melds: SetSpec[] = [sh(s, 1), sh(s, 4), sh(s, 7), ko(honKind(pick(rng, DRAGONS))), pr(honKind(pick(rng, WINDS)))];
      return {
        seed: 'ittsuu',
        melds,
        winning: { meldIndex: 1, kind: num(s, 5) },
        table: makeTable(rng, roundWind),
        winContext: makeCtx(rng),
      };
    },
  },
  honitsu: {
    band: 'medium',
    build: (rng, roundWind) => {
      const s = pick(rng, SUITS3);
      // 2順子の開始ランク（各 1–7。独立なので一致しうる＝混一色に一盃口が乗ることもある）
      const a = 1 + randInt(rng, 7);
      const b = 1 + randInt(rng, 7);
      const melds: SetSpec[] = [sh(s, a), sh(s, b), ko(honKind(pick(rng, DRAGONS))), ko(honKind(pick(rng, WINDS))), pr(num(s, 1 + randInt(rng, 9)))];
      return {
        seed: 'honitsu',
        melds,
        winning: { meldIndex: 0, kind: num(s, a + 2) },
        table: makeTable(rng, roundWind),
        winContext: makeCtx(rng),
      };
    },
  },
  chinitsu: {
    band: 'medium',
    build: (rng, roundWind) => {
      const s = pick(rng, SUITS3);
      const melds: SetSpec[] = [sh(s, 1 + randInt(rng, 7)), sh(s, 1 + randInt(rng, 7)), sh(s, 1 + randInt(rng, 7)), ko(num(s, 1 + randInt(rng, 9))), pr(num(s, 1 + randInt(rng, 9)))];
      const m0 = melds[0]!;
      return {
        seed: 'chinitsu',
        melds,
        winning: { meldIndex: 0, kind: m0.kinds[2]! },
        table: makeTable(rng, roundWind),
        winContext: makeCtx(rng),
      };
    },
  },
  iipeikou: {
    band: 'medium',
    build: (rng, roundWind) => {
      const s = pick(rng, SUITS3);
      const r = 1 + randInt(rng, 7);
      const hs = shuffle(rng, HONORS.map(honKind));
      const melds: SetSpec[] = [sh(s, r), sh(s, r), ko(hs[0]!), ko(hs[1]!), pr(hs[2]!)];
      return {
        seed: 'iipeikou',
        melds,
        winning: { meldIndex: 2, kind: hs[0]! },
        table: makeTable(rng, roundWind),
        winContext: makeCtx(rng),
      };
    },
  },

  shousangen: {
    band: 'medium',
    build: (rng, roundWind) => {
      // 三元牌のうち2種が刻子＋残り1種が雀頭。役牌2つと必ず複合（実質4翻）が学習ポイント。
      // 自由部分は順子2つ（刻子を足すと三暗刻・対々和へ流れて主役がぼやける）
      const [d1, d2, dp] = shuffle(rng, [...DRAGONS]);
      const s3 = randShuntsu(rng);
      const melds: SetSpec[] = [ko(honKind(d1!)), ko(honKind(d2!)), s3, randShuntsu(rng), pr(honKind(dp!))];
      return {
        seed: 'shousangen',
        melds,
        winning: { meldIndex: 2, kind: s3.kinds[2]! },
        table: makeTable(rng, roundWind),
        winContext: makeCtx(rng),
      };
    },
  },
  honroutou: {
    band: 'medium',
    build: (rng, roundWind) => {
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
        table: makeTable(rng, roundWind),
        winContext: makeCtx(rng),
      };
    },
  },

  // ── 難 ──
  pinfu: {
    band: 'hard',
    build: (rng, roundWind) => {
      const s0 = pick(rng, SUITS3);
      const start = 2 + randInt(rng, 5); // 2–6 始まり＝両面が成立する位置
      const melds: SetSpec[] = [sh(s0, start), randShuntsu(rng), randShuntsu(rng), randShuntsu(rng), pr(num(pick(rng, SUITS3), 2 + randInt(rng, 7)))];
      return {
        seed: 'pinfu',
        melds,
        winning: { meldIndex: 0, kind: num(s0, start + 2) }, // 両面の上端で和了
        table: makeTable(rng, roundWind),
        winContext: makeCtx(rng),
      };
    },
  },
  chanta: {
    band: 'hard',
    build: (rng, roundWind) => {
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
        table: makeTable(rng, roundWind),
        winContext: makeCtx(rng),
      };
    },
  },
  junchan: {
    band: 'hard',
    build: (rng, roundWind) => {
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
        table: makeTable(rng, roundWind),
        winContext: makeCtx(rng),
      };
    },
  },
  sanankou: {
    band: 'hard',
    build: (rng, roundWind) => {
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
        table: makeTable(rng, roundWind),
        winContext: makeCtx(rng),
      };
    },
  },
  ryanpeikou: {
    band: 'hard',
    build: (rng, roundWind) => {
      const [s1, s2] = shuffle(rng, [...SUITS3]);
      const r1 = 1 + randInt(rng, 7);
      const r2 = 1 + randInt(rng, 7);
      const melds: SetSpec[] = [sh(s1!, r1), sh(s1!, r1), sh(s2!, r2), sh(s2!, r2), pr(honKind(pick(rng, HONORS)))];
      return {
        seed: 'ryanpeikou',
        melds,
        winning: { meldIndex: 0, kind: num(s1!, r1 + 2) },
        table: makeTable(rng, roundWind),
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
      build: (rng: Rng, roundWind: Wind | undefined): BuildPlan => {
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
          table: makeTable(rng, roundWind),
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
