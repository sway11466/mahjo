import { YAKU_TABLE, yakuDisplayName, type ScoredYakuId } from '../../../engine/yaku-table.ts';
import type { Tile, Yaku } from '../../../types/index.ts';
import { suited, honorTile } from '../../../engine/tiles.ts';

/**
 * 役一覧（feature-3）の表示用データ。役名・読み・翻は YAKU_TABLE が正なのでここには持たず、
 * 「成立条件の説明文」と「難易度フィルタの区分」だけを持つ（用途は役一覧のみ＝ソース埋め込み）。
 *
 * 難易度（初級/中級/上級）は「理解（見抜き）の難易度」軸で割り当てる＝採点の難しさ・翻の高さとは別軸。
 * 正は [generation.md](../../../../docs/spec/generation.md) §3 の難易度帯（易=初級／中=中級／難=上級）で、
 * そこに載る役は同じ帯に合わせる（例：清一色＝中級、平和＝上級、七対子・対々和＝初級）。表に無い役も
 * 同じ軸で追補した目安なので、出題進行（generate.ts の band）と齟齬が出たら generation.md §3 を正に直す。
 * 条件文の正は [scoring-rules.md](../../../../docs/spec/scoring-rules.md) §1。
 */
export type YakuDifficulty = '初級' | '中級' | '上級' | '役満' | 'レア';

export interface YakuReference {
  difficulty: Exclude<YakuDifficulty, 'レア'>; // レアは YAKU_TABLE 外＝RARE_YAKU 側で扱う
  /** 成立条件の説明文（初心者向け。難読語にはカナの読みを括弧で添える） */
  condition: string;
}

export const YAKU_REFERENCE: Record<ScoredYakuId, YakuReference> = {
  // ── 初級（易＝見抜きやすい・基本） ──
  riichi: { difficulty: '初級', condition: '門前（メンゼン）でテンパイし、リーチを宣言する。' },
  ippatsu: { difficulty: '初級', condition: 'リーチ後、1巡以内に副露（フーロ）されず和了する。' },
  'menzen-tsumo': { difficulty: '初級', condition: '門前（メンゼン）のままツモで和了する。' },
  tanyao: {
    difficulty: '初級',
    condition: '2〜8の数牌（シューパイ）だけで作り、1・9・字牌（ジハイ）は使わない。',
  },
  'yakuhai-haku': { difficulty: '初級', condition: '白の刻子（コーツ）または槓子（カンツ）。' },
  'yakuhai-hatsu': { difficulty: '初級', condition: '發の刻子（コーツ）または槓子（カンツ）。' },
  'yakuhai-chun': { difficulty: '初級', condition: '中の刻子（コーツ）または槓子（カンツ）。' },
  'yakuhai-round': {
    difficulty: '初級',
    condition: '場風（バカゼ）牌の刻子（コーツ）または槓子（カンツ）。',
  },
  'yakuhai-seat': {
    difficulty: '初級',
    condition:
      '自風（ジカゼ）牌の刻子（コーツ）または槓子（カンツ）。場風（バカゼ）と自風が同じなら2翻。',
  },
  chiitoitsu: {
    difficulty: '初級',
    condition: '異なる対子（トイツ）を7組そろえる。門前（メンゼン）のみ・25符固定。',
  },
  toitoi: {
    difficulty: '初級',
    condition: '刻子（コーツ）または槓子（カンツ）を4つ＋雀頭（ジャントウ）で作る。',
  },

  // ── 中級（中） ──
  'double-riichi': { difficulty: '中級', condition: '第一打（ダイイチダ＝最初の捨て牌）でリーチをかける。' },
  iipeikou: {
    difficulty: '中級',
    condition: '同じ種類・同じ並びの順子（ジュンツ）を2組そろえる。門前（メンゼン）のみ。',
  },
  'sanshoku-doujun': {
    difficulty: '中級',
    condition: '同じ並びの順子（ジュンツ）を3色（萬・筒・索）でそろえる。',
  },
  ittsuu: { difficulty: '中級', condition: '同じ色で 123・456・789 を1組ずつそろえる。' },
  honitsu: { difficulty: '中級', condition: '1色の数牌（シューパイ）＋字牌（ジハイ）だけで作る。' },
  chinitsu: {
    difficulty: '中級',
    condition: '1色の数牌（シューパイ）だけで作り、字牌（ジハイ）は使わない。',
  },
  sankantsu: { difficulty: '中級', condition: '槓子（カンツ）を3つそろえる（明暗問わず）。' },
  honroutou: {
    difficulty: '中級',
    condition: '1・9・字牌（ジハイ）だけで作る（対々和または七対子と複合）。',
  },
  haitei: { difficulty: '中級', condition: '最後のツモ牌（海底）で和了する。' },
  houtei: { difficulty: '中級', condition: '最後の捨て牌（河底）でロンする。' },
  rinshan: {
    difficulty: '中級',
    condition: '槓（カン）をした後の嶺上牌（リンシャンパイ）でツモ和了する。',
  },
  chankan: { difficulty: '中級', condition: '他家（ターチャ）の加槓（カカン）牌をロンする。' },

  // ── 上級（難＝複合条件を見抜く） ──
  pinfu: {
    difficulty: '上級',
    condition: '4つの順子（ジュンツ）＋役のない雀頭（ジャントウ）＋両面（リャンメン）待ち。符のつかない形。',
  },
  'sanshoku-doukou': { difficulty: '上級', condition: '同じ数字の刻子（コーツ）を3色でそろえる。' },
  chanta: {
    difficulty: '上級',
    condition: 'すべての面子（メンツ）と雀頭（ジャントウ）に、1・9・字牌（ジハイ）などの么九（ヤオチュー）牌を含む。',
  },
  junchan: {
    difficulty: '上級',
    condition: 'チャンタの字牌（ジハイ）なし版。すべての面子（メンツ）・雀頭（ジャントウ）に1・9を含む。',
  },
  sanankou: { difficulty: '上級', condition: '暗刻（アンコー）を3つそろえる（暗槓も可）。' },
  shousangen: {
    difficulty: '上級',
    condition: '三元牌（サンゲンパイ）のうち2種が刻子（コーツ）＋残り1種が雀頭（ジャントウ）。',
  },
  ryanpeikou: {
    difficulty: '上級',
    condition: '一盃口（イーペーコー）を2組そろえる。門前（メンゼン）のみ。',
  },

  // ── 役満（§1.2） ──
  kokushi: {
    difficulty: '役満',
    condition: '1・9・字牌（ジハイ）の13種を1枚ずつ＋いずれか1枚。門前（メンゼン）のみ。',
  },
  'kokushi-13': {
    difficulty: '役満',
    condition: '国士無双で13種そろい、最後の1枚を単騎（タンキ）待ちで和了。',
  },
  suuankou: { difficulty: '役満', condition: '暗刻（アンコー）を4つそろえる。ロン和了では成立しない。' },
  'suuankou-tanki': {
    difficulty: '役満',
    condition: '四暗刻を雀頭（ジャントウ）の単騎（タンキ）待ちで和了（ロンでも成立）。',
  },
  daisangen: {
    difficulty: '役満',
    condition: '三元牌（サンゲンパイ）すべて（白・發・中）を刻子（コーツ）または槓子（カンツ）でそろえる。',
  },
  tsuuiisou: { difficulty: '役満', condition: '字牌（ジハイ）だけで作る。' },
  ryuuiisou: {
    difficulty: '役満',
    condition: '索子（ソーズ）の2・3・4・6・8と發（すべて緑の牌）だけで作る。',
  },
  chinroutou: { difficulty: '役満', condition: '1・9の牌だけで作る。' },
  chuuren: {
    difficulty: '役満',
    condition: '同じ色で 1112345678999 ＋同色をもう1枚。門前（メンゼン）のみ。',
  },
  'chuuren-junsei': {
    difficulty: '役満',
    condition: '九蓮宝燈の九面（キューメン）待ち。',
  },
  suukantsu: { difficulty: '役満', condition: '槓子（カンツ）を4つそろえる。' },
  shousuushi: {
    difficulty: '役満',
    condition: '風牌（フォンパイ）のうち3種が刻子（コーツ）＋残り1種が雀頭（ジャントウ）。',
  },
  daisuushi: {
    difficulty: '役満',
    condition: '風牌（フォンパイ）すべて（東南西北）を刻子（コーツ）または槓子（カンツ）でそろえる。',
  },
  tenho: { difficulty: '役満', condition: '親が配牌（ハイパイ）だけで和了（最初のツモ前）。' },
  chiho: { difficulty: '役満', condition: '子が最初のツモで和了する。' },
};

/**
 * レア役（流し満貫・人和・大車輪）。`RuleSettings.rareYaku` で有効化されるローカル寄りの役で、
 * YAKU_TABLE に無い（レア役＝未対応）ため、一覧表示用にここへ独立データとして持つ。
 * 翻は通常の門前/喰い下がりに収まらないので表示文字列（hanLabel）で持つ。正は scoring-rules.md §1.3。
 */
interface RareYakuEntry {
  id: string;
  name: string;
  reading: string;
  hanLabel: string;
  condition: string;
  /** 形で決まる役だけ参考手牌を持つ（流し満貫・人和は和了形が無いので持たない） */
  example?: Tile[];
}

const RARE_YAKU: RareYakuEntry[] = [
  {
    id: 'nagashi-mangan',
    name: '流し満貫',
    reading: 'ナガシマンガン',
    hanLabel: '満貫扱い',
    condition:
      '自分の捨て牌がすべて么九（ヤオチュー）牌で、他家（ターチャ）に1枚も鳴かれずに流局する。和了形を持たない特殊役。',
  },
  {
    id: 'renho',
    name: '人和',
    reading: 'レンホー',
    hanLabel: '満貫扱い',
    condition: '子が、最初のツモが来る前にロン和了する（ルールにより役満扱いのことも）。',
  },
  {
    id: 'daisharin',
    name: '大車輪',
    reading: 'ダイシャリン',
    hanLabel: '役満扱い',
    condition: '筒子（ピンズ）の2〜8を2枚ずつ集めた形（22334455667788）。ローカル役。',
    example: [
      suited('pin', 2), suited('pin', 2), suited('pin', 3), suited('pin', 3),
      suited('pin', 4), suited('pin', 4), suited('pin', 5), suited('pin', 5),
      suited('pin', 6), suited('pin', 6), suited('pin', 7), suited('pin', 7),
      suited('pin', 8), suited('pin', 8),
    ],
  },
];

/**
 * 参考手牌（固定）。一覧の「眺めて覚える」を視覚で助ける例示。
 * 基準＝「牌の並びそのものが役を示す（形で決まる）役」だけに付ける。状況・和了方法で決まる役
 * （リーチ・一発・門前ツモ・海底/河底/嶺上/槍槓・天和/地和、および場風/自風＝風が状況依存）は、
 * 静止画で示せないので付けない（テキストのみ）。和了形を持たない流し満貫・人和も同様。
 * 牌は表示専用（同一 id の重複は描画では index キーで扱うため問題ない）。槓子の役は4枚並べて示す。
 */
export const YAKU_EXAMPLES: Partial<Record<ScoredYakuId, Tile[]>> = {
  // ── 通常役（形で決まるもの） ──
  // 断幺九：2〜8だけ
  tanyao: [
    suited('man', 2), suited('man', 3), suited('man', 4),
    suited('man', 6), suited('man', 7), suited('man', 8),
    suited('pin', 3), suited('pin', 4), suited('pin', 5),
    suited('sou', 4), suited('sou', 5), suited('sou', 6),
    suited('sou', 8), suited('sou', 8),
  ],
  // 一盃口：同じ順子2組（234m）
  iipeikou: [
    suited('man', 2), suited('man', 3), suited('man', 4),
    suited('man', 2), suited('man', 3), suited('man', 4),
    suited('pin', 5), suited('pin', 6), suited('pin', 7),
    suited('sou', 2), suited('sou', 3), suited('sou', 4),
    suited('sou', 9), suited('sou', 9),
  ],
  // 役牌 白：白の刻子
  'yakuhai-haku': [
    honorTile('haku'), honorTile('haku'), honorTile('haku'),
    suited('man', 2), suited('man', 3), suited('man', 4),
    suited('pin', 5), suited('pin', 6), suited('pin', 7),
    suited('sou', 2), suited('sou', 3), suited('sou', 4),
    suited('man', 9), suited('man', 9),
  ],
  // 役牌 發：發の刻子
  'yakuhai-hatsu': [
    honorTile('hatsu'), honorTile('hatsu'), honorTile('hatsu'),
    suited('man', 2), suited('man', 3), suited('man', 4),
    suited('pin', 5), suited('pin', 6), suited('pin', 7),
    suited('sou', 2), suited('sou', 3), suited('sou', 4),
    suited('man', 9), suited('man', 9),
  ],
  // 役牌 中：中の刻子
  'yakuhai-chun': [
    honorTile('chun'), honorTile('chun'), honorTile('chun'),
    suited('man', 2), suited('man', 3), suited('man', 4),
    suited('pin', 5), suited('pin', 6), suited('pin', 7),
    suited('sou', 2), suited('sou', 3), suited('sou', 4),
    suited('man', 9), suited('man', 9),
  ],
  // 平和：4順子＋役でない雀頭（両面待ちの形）
  pinfu: [
    suited('man', 2), suited('man', 3), suited('man', 4),
    suited('man', 5), suited('man', 6), suited('man', 7),
    suited('pin', 2), suited('pin', 3), suited('pin', 4),
    suited('sou', 6), suited('sou', 7), suited('sou', 8),
    suited('sou', 5), suited('sou', 5),
  ],
  // 三色同順：234 を萬・筒・索の3色でそろえる
  'sanshoku-doujun': [
    suited('man', 2), suited('man', 3), suited('man', 4),
    suited('pin', 2), suited('pin', 3), suited('pin', 4),
    suited('sou', 2), suited('sou', 3), suited('sou', 4),
    suited('man', 6), suited('man', 7), suited('man', 8),
    suited('sou', 9), suited('sou', 9),
  ],
  // 三色同刻：222 の刻子を3色
  'sanshoku-doukou': [
    suited('man', 2), suited('man', 2), suited('man', 2),
    suited('pin', 2), suited('pin', 2), suited('pin', 2),
    suited('sou', 2), suited('sou', 2), suited('sou', 2),
    suited('man', 3), suited('man', 4), suited('man', 5),
    suited('sou', 9), suited('sou', 9),
  ],
  // 一気通貫：同色 123 456 789
  ittsuu: [
    suited('pin', 1), suited('pin', 2), suited('pin', 3),
    suited('pin', 4), suited('pin', 5), suited('pin', 6),
    suited('pin', 7), suited('pin', 8), suited('pin', 9),
    suited('man', 2), suited('man', 3), suited('man', 4),
    suited('man', 5), suited('man', 5),
  ],
  // 混全帯幺九：全ての面子・雀頭に么九（字牌含む。東の刻子で字牌を示す）
  chanta: [
    suited('man', 1), suited('man', 2), suited('man', 3),
    suited('pin', 7), suited('pin', 8), suited('pin', 9),
    suited('sou', 1), suited('sou', 2), suited('sou', 3),
    honorTile('east'), honorTile('east'), honorTile('east'),
    suited('sou', 9), suited('sou', 9),
  ],
  // 純全帯幺九：チャンタの字牌なし版（全て1・9を含む）
  junchan: [
    suited('man', 1), suited('man', 2), suited('man', 3),
    suited('man', 7), suited('man', 8), suited('man', 9),
    suited('pin', 1), suited('pin', 2), suited('pin', 3),
    suited('sou', 7), suited('sou', 8), suited('sou', 9),
    suited('pin', 9), suited('pin', 9),
  ],
  // 七対子：異なる対子7組
  chiitoitsu: [
    suited('man', 1), suited('man', 1), suited('man', 4), suited('man', 4),
    suited('pin', 2), suited('pin', 2), suited('pin', 7), suited('pin', 7),
    suited('sou', 3), suited('sou', 3), suited('sou', 6), suited('sou', 6),
    suited('sou', 9), suited('sou', 9),
  ],
  // 対々和：刻子4＋雀頭
  toitoi: [
    suited('man', 2), suited('man', 2), suited('man', 2),
    suited('pin', 5), suited('pin', 5), suited('pin', 5),
    suited('sou', 8), suited('sou', 8), suited('sou', 8),
    honorTile('east'), honorTile('east'), honorTile('east'),
    suited('man', 9), suited('man', 9),
  ],
  // 三暗刻：暗刻3＋順子1＋雀頭
  sanankou: [
    suited('man', 2), suited('man', 2), suited('man', 2),
    suited('man', 5), suited('man', 5), suited('man', 5),
    suited('pin', 8), suited('pin', 8), suited('pin', 8),
    suited('sou', 3), suited('sou', 4), suited('sou', 5),
    suited('sou', 9), suited('sou', 9),
  ],
  // 三槓子：槓子3（4枚並べ）＋刻子1＋雀頭
  sankantsu: [
    suited('man', 1), suited('man', 1), suited('man', 1), suited('man', 1),
    suited('pin', 5), suited('pin', 5), suited('pin', 5), suited('pin', 5),
    suited('sou', 9), suited('sou', 9), suited('sou', 9), suited('sou', 9),
    suited('man', 2), suited('man', 2), suited('man', 2),
    suited('pin', 8), suited('pin', 8),
  ],
  // 混老頭：么九牌だけ（対々和の形）
  honroutou: [
    suited('man', 1), suited('man', 1), suited('man', 1),
    suited('pin', 9), suited('pin', 9), suited('pin', 9),
    honorTile('east'), honorTile('east'), honorTile('east'),
    honorTile('chun'), honorTile('chun'), honorTile('chun'),
    suited('sou', 9), suited('sou', 9),
  ],
  // 小三元：三元牌の2種が刻子＋1種が雀頭
  shousangen: [
    honorTile('haku'), honorTile('haku'), honorTile('haku'),
    honorTile('hatsu'), honorTile('hatsu'), honorTile('hatsu'),
    honorTile('chun'), honorTile('chun'),
    suited('man', 2), suited('man', 3), suited('man', 4),
    suited('pin', 5), suited('pin', 6), suited('pin', 7),
  ],
  // 混一色：1色の数牌＋字牌
  honitsu: [
    suited('pin', 1), suited('pin', 2), suited('pin', 3),
    suited('pin', 4), suited('pin', 5), suited('pin', 6),
    suited('pin', 7), suited('pin', 8), suited('pin', 9),
    honorTile('east'), honorTile('east'), honorTile('east'),
    suited('pin', 1), suited('pin', 1),
  ],
  // 二盃口：一盃口2組
  ryanpeikou: [
    suited('man', 2), suited('man', 3), suited('man', 4),
    suited('man', 2), suited('man', 3), suited('man', 4),
    suited('pin', 5), suited('pin', 6), suited('pin', 7),
    suited('pin', 5), suited('pin', 6), suited('pin', 7),
    suited('sou', 9), suited('sou', 9),
  ],
  // 清一色：筒子だけで作る
  chinitsu: [
    suited('pin', 1), suited('pin', 2), suited('pin', 3),
    suited('pin', 4), suited('pin', 5), suited('pin', 6),
    suited('pin', 7), suited('pin', 8), suited('pin', 9),
    suited('pin', 2), suited('pin', 3), suited('pin', 4),
    suited('pin', 5), suited('pin', 5),
  ],

  // ── 役満（形で決まるもの） ──
  // 国士無双：么九13種＋いずれか1枚（ここでは 1m を重ねる）
  kokushi: [
    suited('man', 1), suited('man', 9),
    suited('pin', 1), suited('pin', 9),
    suited('sou', 1), suited('sou', 9),
    honorTile('east'), honorTile('south'), honorTile('west'), honorTile('north'),
    honorTile('haku'), honorTile('hatsu'), honorTile('chun'),
    suited('man', 1),
  ],
  // 国士無双十三面：13種そろい踏み（待ちは13面）
  'kokushi-13': [
    suited('man', 1), suited('man', 9),
    suited('pin', 1), suited('pin', 9),
    suited('sou', 1), suited('sou', 9),
    honorTile('east'), honorTile('south'), honorTile('west'), honorTile('north'),
    honorTile('haku'), honorTile('hatsu'), honorTile('chun'),
    honorTile('east'),
  ],
  // 四暗刻：暗刻4＋雀頭
  suuankou: [
    suited('man', 2), suited('man', 2), suited('man', 2),
    suited('man', 5), suited('man', 5), suited('man', 5),
    suited('pin', 8), suited('pin', 8), suited('pin', 8),
    suited('sou', 3), suited('sou', 3), suited('sou', 3),
    suited('sou', 9), suited('sou', 9),
  ],
  // 四暗刻単騎：暗刻4＋単騎（雀頭）待ち
  'suuankou-tanki': [
    suited('man', 2), suited('man', 2), suited('man', 2),
    suited('pin', 5), suited('pin', 5), suited('pin', 5),
    suited('sou', 8), suited('sou', 8), suited('sou', 8),
    honorTile('east'), honorTile('east'), honorTile('east'),
    suited('man', 9), suited('man', 9),
  ],
  // 大三元：三元牌3種すべて刻子
  daisangen: [
    honorTile('haku'), honorTile('haku'), honorTile('haku'),
    honorTile('hatsu'), honorTile('hatsu'), honorTile('hatsu'),
    honorTile('chun'), honorTile('chun'), honorTile('chun'),
    suited('man', 2), suited('man', 3), suited('man', 4),
    suited('pin', 9), suited('pin', 9),
  ],
  // 字一色：字牌だけ
  tsuuiisou: [
    honorTile('east'), honorTile('east'), honorTile('east'),
    honorTile('south'), honorTile('south'), honorTile('south'),
    honorTile('west'), honorTile('west'), honorTile('west'),
    honorTile('north'), honorTile('north'), honorTile('north'),
    honorTile('haku'), honorTile('haku'),
  ],
  // 緑一色：索子の2/3/4/6/8と發だけ
  ryuuiisou: [
    suited('sou', 2), suited('sou', 3), suited('sou', 4),
    suited('sou', 2), suited('sou', 3), suited('sou', 4),
    suited('sou', 8), suited('sou', 8), suited('sou', 8),
    honorTile('hatsu'), honorTile('hatsu'), honorTile('hatsu'),
    suited('sou', 6), suited('sou', 6),
  ],
  // 清老頭：1・9の牌だけ
  chinroutou: [
    suited('man', 1), suited('man', 1), suited('man', 1),
    suited('man', 9), suited('man', 9), suited('man', 9),
    suited('pin', 1), suited('pin', 1), suited('pin', 1),
    suited('pin', 9), suited('pin', 9), suited('pin', 9),
    suited('sou', 1), suited('sou', 1),
  ],
  // 九蓮宝燈：同色 1112345678999＋同色1枚
  chuuren: [
    suited('pin', 1), suited('pin', 1), suited('pin', 1),
    suited('pin', 2), suited('pin', 3), suited('pin', 4),
    suited('pin', 5), suited('pin', 6), suited('pin', 7),
    suited('pin', 8), suited('pin', 9), suited('pin', 9),
    suited('pin', 9), suited('pin', 5),
  ],
  // 純正九蓮宝燈：九面待ちの九蓮（1112345678999＋待ち牌）
  'chuuren-junsei': [
    suited('pin', 1), suited('pin', 1), suited('pin', 1),
    suited('pin', 2), suited('pin', 3), suited('pin', 4),
    suited('pin', 5), suited('pin', 6), suited('pin', 7),
    suited('pin', 8), suited('pin', 9), suited('pin', 9),
    suited('pin', 9), suited('pin', 2),
  ],
  // 四槓子：槓子4（4枚並べ）＋雀頭
  suukantsu: [
    suited('man', 1), suited('man', 1), suited('man', 1), suited('man', 1),
    suited('pin', 2), suited('pin', 2), suited('pin', 2), suited('pin', 2),
    suited('sou', 3), suited('sou', 3), suited('sou', 3), suited('sou', 3),
    suited('man', 4), suited('man', 4), suited('man', 4), suited('man', 4),
    suited('pin', 9), suited('pin', 9),
  ],
  // 小四喜：風牌3種が刻子＋1種が雀頭
  shousuushi: [
    honorTile('east'), honorTile('east'), honorTile('east'),
    honorTile('south'), honorTile('south'), honorTile('south'),
    honorTile('west'), honorTile('west'), honorTile('west'),
    honorTile('north'), honorTile('north'),
    suited('man', 2), suited('man', 3), suited('man', 4),
  ],
  // 大四喜：風牌4種すべて刻子＋雀頭
  daisuushi: [
    honorTile('east'), honorTile('east'), honorTile('east'),
    honorTile('south'), honorTile('south'), honorTile('south'),
    honorTile('west'), honorTile('west'), honorTile('west'),
    honorTile('north'), honorTile('north'), honorTile('north'),
    suited('man', 9), suited('man', 9),
  ],
};

/** 翻の表示文字列。役満は「役満」、通常役は門前翻＋喰い下がり（門前のみは注記）。 */
function hanLabel(yaku: Yaku): string {
  if (yaku.yakuman) return '役満';
  if (yaku.hanOpen === null) return `${yaku.hanClosed}翻（門前のみ）`;
  if (yaku.hanOpen === yaku.hanClosed) return `${yaku.hanClosed}翻`;
  return `${yaku.hanClosed}翻 / 喰い下がり${yaku.hanOpen}翻`;
}

/** 読みを括弧で添えた表示名（YAKU_TABLE 外のレア役用。yakuDisplayName と同じ流儀）。 */
function displayNameOf(name: string, reading: string): string {
  return reading && reading !== name ? `${name}（${reading}）` : name;
}

/**
 * リーチ系（リーチ・ダブルリーチ・一発）。和了形を持たないので参考手牌は付けないが、
 * 象徴的なリーチ棒（千点棒）を例示エリアに置く（形でなく「リーチしている状態」を視覚で示す）。
 * ダブルリーチ・一発は棒の横に小バッジを添える（盤面のリーチ脇表記の鏡写し＝RIICHI_BADGE）。
 */
const RIICHI_STICK_IDS = new Set<ScoredYakuId>(['riichi', 'double-riichi', 'ippatsu']);

/** リーチ棒の横の小バッジ。盤面（MainScreen のリーチ脇）と同じ文字列で対応を取る。 */
const RIICHI_BADGE: Partial<Record<ScoredYakuId, string>> = {
  'double-riichi': '第一打',
  ippatsu: '一発',
};

/** 一覧の1行（表示用に正規化）。通常役＝YAKU_TABLE＋YAKU_REFERENCE、レア役＝RARE_YAKU から作る。 */
export interface YakuRow {
  key: string;
  name: string; // 役名（読み）
  han: string; // 翻の表示文字列
  difficulty: YakuDifficulty;
  condition: string;
  example?: Tile[];
  /** 参考手牌の代わりにリーチ棒を出す（リーチ系）。 */
  riichiStick?: boolean;
  /** リーチ棒の横に出す小バッジ（アプリのリーチ脇表記に合わせる。ダブルリーチ・一発）。 */
  riichiBadge?: string;
}

/** 表示用の全行（通常役 → レア役の順）。難易度フィルタは呼び出し側（YakuList）が difficulty で行う。 */
export function buildYakuRows(): YakuRow[] {
  const scored: YakuRow[] = (Object.keys(YAKU_TABLE) as ScoredYakuId[]).map((id) => {
    const yaku = YAKU_TABLE[id];
    const ref = YAKU_REFERENCE[id];
    const example = YAKU_EXAMPLES[id];
    // exactOptionalPropertyTypes 下では任意プロパティに undefined を代入できないので、
    // 値が無いキーはスプレッドで省く（例示を持たない役・リーチ棒でない役は付けない）。
    return {
      key: id,
      name: yakuDisplayName(yaku),
      han: hanLabel(yaku),
      difficulty: ref.difficulty,
      condition: ref.condition,
      ...(example ? { example } : {}),
      ...(RIICHI_STICK_IDS.has(id) ? { riichiStick: true } : {}),
      ...(RIICHI_BADGE[id] ? { riichiBadge: RIICHI_BADGE[id] } : {}),
    };
  });
  const rare: YakuRow[] = RARE_YAKU.map((r) => ({
    key: r.id,
    name: displayNameOf(r.name, r.reading),
    han: r.hanLabel,
    difficulty: 'レア',
    condition: r.condition,
    ...(r.example ? { example: r.example } : {}),
  }));
  return [...scored, ...rare];
}
