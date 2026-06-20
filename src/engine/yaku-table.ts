import type { Yaku, YakuId } from '../types/index.ts';

/**
 * 役定義テーブル（scoring-rules.md §1 をデータ化）。判定関数はこの表を引いて翻・役満を決め、
 * マジックナンバーを散らさない。通常役は門前翻 hanClosed / 喰い下がり hanOpen
 * （null＝門前のみ＝副露で不成立）。役満は double（もとからダブル役満か。doubleYakuman 設定時に2倍）。
 *
 * レア役（nagashi-mangan / renho / daisharin）は満貫扱い等で Yaku 型（翻 or 役満）に
 * 素直に収まらず、生成・判定とも未対応。ここでは扱わないため型から除外し、
 * 実装済みの全役を網羅していることを型でも保証する。
 */
export type RareYakuId = 'nagashi-mangan' | 'renho' | 'daisharin';
export type ScoredYakuId = Exclude<YakuId, RareYakuId>;

export const YAKU_TABLE: Record<ScoredYakuId, Yaku> = {
  // ── 通常役（§1.1） ──
  // reading＝カナ読み（初心者向けふりがな。値の正は scoring-rules.md §1）。役名がすでにカナの役は省略。
  riichi: { id: 'riichi', name: 'リーチ', yakuman: false, hanClosed: 1, hanOpen: null },
  'double-riichi': { id: 'double-riichi', name: 'ダブルリーチ', yakuman: false, hanClosed: 2, hanOpen: null },
  ippatsu: { id: 'ippatsu', name: '一発', reading: 'イッパツ', yakuman: false, hanClosed: 1, hanOpen: null },
  'menzen-tsumo': { id: 'menzen-tsumo', name: '門前清自摸和', reading: 'メンゼンツモ', yakuman: false, hanClosed: 1, hanOpen: null },
  pinfu: { id: 'pinfu', name: '平和', reading: 'ピンフ', yakuman: false, hanClosed: 1, hanOpen: null },
  tanyao: { id: 'tanyao', name: '断幺九', reading: 'タンヤオ', yakuman: false, hanClosed: 1, hanOpen: 1 },
  iipeikou: { id: 'iipeikou', name: '一盃口', reading: 'イーペーコー', yakuman: false, hanClosed: 1, hanOpen: null },
  'yakuhai-haku': { id: 'yakuhai-haku', name: '役牌 白', reading: 'ヤクハイ ハク', yakuman: false, hanClosed: 1, hanOpen: 1 },
  'yakuhai-hatsu': { id: 'yakuhai-hatsu', name: '役牌 發', reading: 'ヤクハイ ハツ', yakuman: false, hanClosed: 1, hanOpen: 1 },
  'yakuhai-chun': { id: 'yakuhai-chun', name: '役牌 中', reading: 'ヤクハイ チュン', yakuman: false, hanClosed: 1, hanOpen: 1 },
  'yakuhai-round': { id: 'yakuhai-round', name: '場風', reading: 'バカゼ', yakuman: false, hanClosed: 1, hanOpen: 1 },
  'yakuhai-seat': { id: 'yakuhai-seat', name: '自風', reading: 'ジカゼ', yakuman: false, hanClosed: 1, hanOpen: 1 },
  'sanshoku-doujun': { id: 'sanshoku-doujun', name: '三色同順', reading: 'サンショクドウジュン', yakuman: false, hanClosed: 2, hanOpen: 1 },
  'sanshoku-doukou': { id: 'sanshoku-doukou', name: '三色同刻', reading: 'サンショクドウコー', yakuman: false, hanClosed: 2, hanOpen: 2 },
  ittsuu: { id: 'ittsuu', name: '一気通貫', reading: 'イッキツウカン', yakuman: false, hanClosed: 2, hanOpen: 1 },
  chanta: { id: 'chanta', name: '混全帯幺九', reading: 'チャンタ', yakuman: false, hanClosed: 2, hanOpen: 1 },
  junchan: { id: 'junchan', name: '純全帯幺九', reading: 'ジュンチャン', yakuman: false, hanClosed: 3, hanOpen: 2 },
  chiitoitsu: { id: 'chiitoitsu', name: '七対子', reading: 'チートイツ', yakuman: false, hanClosed: 2, hanOpen: null },
  toitoi: { id: 'toitoi', name: '対々和', reading: 'トイトイ', yakuman: false, hanClosed: 2, hanOpen: 2 },
  sanankou: { id: 'sanankou', name: '三暗刻', reading: 'サンアンコー', yakuman: false, hanClosed: 2, hanOpen: 2 },
  sankantsu: { id: 'sankantsu', name: '三槓子', reading: 'サンカンツ', yakuman: false, hanClosed: 2, hanOpen: 2 },
  honroutou: { id: 'honroutou', name: '混老頭', reading: 'ホンロウトウ', yakuman: false, hanClosed: 2, hanOpen: 2 },
  shousangen: { id: 'shousangen', name: '小三元', reading: 'ショウサンゲン', yakuman: false, hanClosed: 2, hanOpen: 2 },
  honitsu: { id: 'honitsu', name: '混一色', reading: 'ホンイツ', yakuman: false, hanClosed: 3, hanOpen: 2 },
  ryanpeikou: { id: 'ryanpeikou', name: '二盃口', reading: 'リャンペーコー', yakuman: false, hanClosed: 3, hanOpen: null },
  chinitsu: { id: 'chinitsu', name: '清一色', reading: 'チンイツ', yakuman: false, hanClosed: 6, hanOpen: 5 },
  haitei: { id: 'haitei', name: '海底摸月', reading: 'ハイテイ', yakuman: false, hanClosed: 1, hanOpen: 1 },
  houtei: { id: 'houtei', name: '河底撈魚', reading: 'ホウテイ', yakuman: false, hanClosed: 1, hanOpen: 1 },
  rinshan: { id: 'rinshan', name: '嶺上開花', reading: 'リンシャンカイホー', yakuman: false, hanClosed: 1, hanOpen: 1 },
  chankan: { id: 'chankan', name: '槍槓', reading: 'チャンカン', yakuman: false, hanClosed: 1, hanOpen: 1 },

  // ── 役満（§1.2） ──
  kokushi: { id: 'kokushi', name: '国士無双', reading: 'コクシムソウ', yakuman: true, double: false },
  'kokushi-13': { id: 'kokushi-13', name: '国士無双十三面', reading: 'コクシムソウ ジュウサンメン', yakuman: true, double: true },
  suuankou: { id: 'suuankou', name: '四暗刻', reading: 'スーアンコー', yakuman: true, double: false },
  'suuankou-tanki': { id: 'suuankou-tanki', name: '四暗刻単騎', reading: 'スーアンコー タンキ', yakuman: true, double: true },
  daisangen: { id: 'daisangen', name: '大三元', reading: 'ダイサンゲン', yakuman: true, double: false },
  tsuuiisou: { id: 'tsuuiisou', name: '字一色', reading: 'ツーイーソー', yakuman: true, double: false },
  ryuuiisou: { id: 'ryuuiisou', name: '緑一色', reading: 'リューイーソー', yakuman: true, double: false },
  chinroutou: { id: 'chinroutou', name: '清老頭', reading: 'チンロウトウ', yakuman: true, double: false },
  chuuren: { id: 'chuuren', name: '九蓮宝燈', reading: 'チューレンポートー', yakuman: true, double: false },
  'chuuren-junsei': { id: 'chuuren-junsei', name: '純正九蓮宝燈', reading: 'ジュンセイチューレンポートー', yakuman: true, double: true },
  suukantsu: { id: 'suukantsu', name: '四槓子', reading: 'スーカンツ', yakuman: true, double: false },
  shousuushi: { id: 'shousuushi', name: '小四喜', reading: 'ショウスーシー', yakuman: true, double: false },
  daisuushi: { id: 'daisuushi', name: '大四喜', reading: 'ダイスーシー', yakuman: true, double: true },
  tenho: { id: 'tenho', name: '天和', reading: 'テンホー', yakuman: true, double: false },
  chiho: { id: 'chiho', name: '地和', reading: 'チーホー', yakuman: true, double: false },
};

/** 役定義の取得（レア役は未実装＝undefined） */
export function getYaku(id: YakuId): Yaku | undefined {
  return (YAKU_TABLE as Partial<Record<YakuId, Yaku>>)[id];
}

/**
 * 役名の表示文字列を組み立てる純関数。初心者向けに読みを括弧で添える（`七対子（チートイツ）`）。
 * reading が無い／name と同じ（リーチ等カナ役）のときは括弧を付けず name のみ返す。
 * engine が ScoreItem.label / QuizChoice.value を作る際に使う（data-model.md §8）。
 */
export function yakuDisplayName(yaku: Yaku): string {
  if (!yaku.reading || yaku.reading === yaku.name) return yaku.name;
  return `${yaku.name}（${yaku.reading}）`;
}
