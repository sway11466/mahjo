import type { HintKey, Yaku } from '../types/index.ts';
import { YAKU_TABLE } from '../engine/yaku-table.ts';

/**
 * ヒントキーの正本（コード側）。hint-base.md の語彙をコードに落としたもの。
 * script（キャラ別セリフ）が全キーを網羅しているか等の機械検証・provider 出力の妥当性確認に使う。
 * 語彙（案2）：役＝`yaku:<YakuId>` ／ 符＝`fu:<source>` ／ ドラ＝`dora`・`aka-dora`・`ura-dora`
 * ／ 汎用＝`generic`（hints.md §2-3）。
 */
export const GENERIC_KEY: HintKey = 'generic';

/**
 * 役キー：yaku-table の非役満役（対象30役）。役満15キーは未対応（将来追加）
 * （hint-base.md 冒頭の方針。文言オーサリングと歩調を合わせ、当面はキーからも除外）。
 */
export const YAKU_KEYS: HintKey[] = (Object.values(YAKU_TABLE) as Yaku[])
  .filter((y) => !y.yakuman)
  .map((y) => `yaku:${y.id}`);

/**
 * 符キー：computeFu が出す発生源（門前ロン・ツモ・待ち・雀頭・面子・喰い平和繰上・七対子）。
 * 副底（`fu:base`・20符固定）は気づきの対象にならないためヒント素を持たない（hint-base.md）。
 */
export const FU_KEYS: HintKey[] = [
  'fu:menzen-ron',
  'fu:tsumo',
  'fu:wait',
  'fu:pair',
  'fu:meld',
  'fu:kuipinfu',
  'fu:chiitoi',
];

export const DORA_KEYS: HintKey[] = ['dora', 'aka-dora', 'ura-dora'];

/** 全ヒントキー（正本） */
export const HINT_KEYS: HintKey[] = [GENERIC_KEY, ...YAKU_KEYS, ...FU_KEYS, ...DORA_KEYS];
export const HINT_KEY_SET: ReadonlySet<HintKey> = new Set(HINT_KEYS);
