import type {
  Hand,
  Table,
  WinContext,
  ScoreResult,
  ScoreItem,
  StudyMode,
  YakuId,
  HintKey,
  HintStepPlan,
  HintProvider,
} from '../types/index.ts';

/**
 * 第1層 HintProvider（キャラ非依存・テスト対象）。エンジンの採点結果（ScoreResult.items）から
 * 「どの着目ポイントを・どの順で」の骨組み HintStepPlan[] を返す。文言は持たない
 * （第2層 HintRenderer がキャラ script から差し込む）。設計は hints.md §4。
 *
 * 役モードの順序ポリシー（手書き＝学びの体感優先）：
 *   状況役 → ひと目で分かる役 → 易 → 中 → 難 → ドラ（最後）。1着目ポイント＝1段（level 0）。
 *   答え（役名・確定値）は持たない（文言側の責務）。ヒントは牌を指し示さない（答えを与えない）。
 */
export const hintProvider: HintProvider = (
  _hand: Hand,
  _table: Table,
  _win: WinContext,
  result: ScoreResult,
  mode: StudyMode,
): HintStepPlan[] => {
  return mode === 'yaku' ? yakuModePlan(result) : scoreModePlan(result);
};

// ── 役モード：見つけやすい役 → ドラ ─────────────────────────

function yakuModePlan(result: ScoreResult): HintStepPlan[] {
  const yaku = byCategory(result, 'yaku')
    .slice()
    .sort((a, b) => spotRank(yakuIdOf(a)) - spotRank(yakuIdOf(b)))
    .map((item) => plan(item.explainKey));
  return [...yaku, ...doraPlans(result)];
}

// ── 点数モード：役 → 符（副底→…の数え順）→ ドラ（暫定。順序は今後精査） ──

function scoreModePlan(result: ScoreResult): HintStepPlan[] {
  const yaku = byCategory(result, 'yaku')
    .slice()
    .sort((a, b) => spotRank(yakuIdOf(a)) - spotRank(yakuIdOf(b)))
    .map((item) => plan(item.explainKey));
  // 符は computeFu が既に「副底→門前ロン/ツモ→待ち→雀頭→面子」の順で積んでいるのでそのまま。
  // 副底（fu:base・20符固定）と合計（fu:total・総和の表示）は気づきの対象でないためヒント素を
  // 持たず、段にしない（keys.ts の FU_KEYS は base/total を含まない）。
  const fu = byCategory(result, 'fu')
    .filter((item) => item.explainKey !== 'fu:base' && item.explainKey !== 'fu:total')
    .map((item) => plan(item.explainKey));
  return [...yaku, ...fu, ...doraPlans(result)];
}

// ── 補助 ───────────────────────────────────────────────────

function byCategory(result: ScoreResult, category: ScoreItem['category']): ScoreItem[] {
  return result.items.filter((i) => i.category === category);
}

function doraPlans(result: ScoreResult): HintStepPlan[] {
  return byCategory(result, 'dora').map((item) => plan(item.explainKey));
}

/** 着目ポイントキー → 1段の骨組み（level 0）。ヒントは牌を指し示さない（答えを与えない）。 */
function plan(key: HintKey): HintStepPlan {
  return { key, level: 0 };
}

/** 役 ScoreItem から YakuId を取り出す（見つけやすさ順 spotRank の並べ替え用）。
 *  キー（`yaku:<id>`）は item.explainKey が持つので、ここは並べ替えのための YakuId 抽出のみ。 */
function yakuIdOf(item: ScoreItem): YakuId {
  return (item.id.startsWith('yaku-') ? item.id.slice('yaku-'.length) : item.id) as YakuId;
}

/**
 * 役の「見つけやすさ」順位（小さいほど先にヒント）。手書きの優先度（hints.md の順序ポリシー）。
 * 0=状況役 / 1=ひと目で分かる役 / 2=易 / 3=中 / 4=難。未登録は 4 扱い。
 */
const SPOT_RANK: Partial<Record<YakuId, number>> = {
  // 0: 状況役（卓の状況。初心者がまず確認）
  riichi: 0, 'double-riichi': 0, ippatsu: 0, 'menzen-tsumo': 0,
  haitei: 0, houtei: 0, rinshan: 0, chankan: 0, tenho: 0, chiho: 0,
  // 1: ひと目で分かる役（見た目で即わかる構成）
  chiitoitsu: 1, chinitsu: 1, honitsu: 1, toitoi: 1, honroutou: 1,
  tsuuiisou: 1, ryuuiisou: 1, chinroutou: 1, kokushi: 1, 'kokushi-13': 1,
  chuuren: 1, 'chuuren-junsei': 1, daisharin: 1,
  // 2: 易
  tanyao: 2,
  'yakuhai-haku': 2, 'yakuhai-hatsu': 2, 'yakuhai-chun': 2, 'yakuhai-round': 2, 'yakuhai-seat': 2,
  // 3: 中
  'sanshoku-doujun': 3, ittsuu: 3, iipeikou: 3, 'sanshoku-doukou': 3,
  // 4: 難（複合・見抜きにくい）
  pinfu: 4, chanta: 4, junchan: 4, sanankou: 4, sankantsu: 4, ryanpeikou: 4,
  shousangen: 4, shousuushi: 4, daisuushi: 4, daisangen: 4,
  suuankou: 4, 'suuankou-tanki': 4, suukantsu: 4, 'nagashi-mangan': 4, renho: 4,
};

function spotRank(id: YakuId): number {
  return SPOT_RANK[id] ?? 4;
}
