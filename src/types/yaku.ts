/**
 * 役の安定した識別子。enabledYaku・役定義テーブル・ハイライト・ヒントテンプレートのキーに使う。
 * 詳細な翻・喰い下がりは scoring-rules.md の役テーブルが正。
 */
export type YakuId =
  // 通常役
  | 'riichi'
  | 'double-riichi'
  | 'ippatsu'
  | 'menzen-tsumo'
  | 'pinfu'
  | 'tanyao'
  | 'iipeikou'
  | 'yakuhai-haku'
  | 'yakuhai-hatsu'
  | 'yakuhai-chun'
  | 'yakuhai-round' // 場風
  | 'yakuhai-seat' // 自風（連風は両方成立で 2 翻）
  | 'sanshoku-doujun'
  | 'sanshoku-doukou'
  | 'ittsuu'
  | 'chanta'
  | 'junchan'
  | 'chiitoitsu'
  | 'toitoi'
  | 'sanankou'
  | 'sankantsu'
  | 'honroutou'
  | 'shousangen'
  | 'honitsu'
  | 'ryanpeikou'
  | 'chinitsu'
  | 'haitei'
  | 'houtei'
  | 'rinshan'
  | 'chankan'
  // 役満
  | 'kokushi'
  | 'kokushi-13'
  | 'suuankou'
  | 'suuankou-tanki'
  | 'daisangen'
  | 'tsuuiisou'
  | 'ryuuiisou'
  | 'chinroutou'
  | 'chuuren'
  | 'chuuren-junsei'
  | 'suukantsu'
  | 'shousuushi'
  | 'daisuushi'
  | 'tenho'
  | 'chiho'
  // レア役（設定オン時のみ）
  | 'nagashi-mangan'
  | 'renho'
  | 'daisharin';

/**
 * 役定義レコード（役テーブルの1行）。翻・喰い下がり・成立条件の正は scoring-rules.md §1。
 * 役満と翻フィールドを判別共用体で分け、不正状態（役満なのに翻を持つ等）を型で排除する（ADR-0002）。
 *
 * name=漢字表記（正式名）、reading=カナ読み（初心者向けふりがな。値の正は scoring-rules.md §1 役テーブル「読み」列）。
 * 両者は別の事実なので分けて持ち、name に読みを焼き込まない。役名がすでにカナの役（リーチ等）は reading 省略。
 * 表示文字列「役名（読み）」は yakuDisplayName（yaku-table.ts）が組み立てる。
 */
export type Yaku =
  | {
      id: YakuId;
      name: string;
      reading?: string;
      yakuman: false;
      hanClosed: number;
      hanOpen: number | null; // hanOpen=null は門前のみ（副露で不成立）
    }
  | {
      id: YakuId;
      name: string;
      reading?: string;
      yakuman: true;
      double: boolean; // もとからダブル扱い（大四喜等。doubleYakuman 設定時に2倍）
    };
