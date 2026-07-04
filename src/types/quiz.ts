/**
 * クイズが問う対象。役モードは複合役がありうるため役名でなく翻で答える＝'han'、
 * 点数モードは総合（X翻Y符ZZZZ点）で答える＝'score'（screens.md §3「選択肢の値の表示」）。
 * 役名そのものの確認はクイズでなく解説・ヒント側の役割。
 */
export type QuizTarget = 'han' | 'score';

/** 誤答の由来（学習者がやりがちなミスの種類） */
export type MistakeKind =
  | 'dealer-swap' // 親子の取り違え
  | 'dora-miss' // ドラ(赤・裏含む)見落とし
  | 'tsumo-ron-swap' // ツモ/ロンの取り違え（符・支払い配分）
  | 'fu-miscount' // 符の数え違い（待ち符・明暗刻・么九/中張・切り上げ忘れ）
  | 'han-miscount'; // 翻の数え違い（役見落とし・喰い下がり無視・満貫境界）

/**
 * 誤答の諭し script：MistakeKind → キャラの諭し文（1種＝1文）。
 * 回答が誤答のとき、選んだ誤答の mistakeKind でキャラがそっと諭す（screens.md §3）。
 * 答え（正解値）は言わない。全 MistakeKind を網羅（Record で型が強制）。
 * 中立の基準は hint-base.md「誤答の諭し素」、文言は character-<id>-script.md §4。
 */
export type MistakeScript = Record<MistakeKind, string>;

export interface QuizChoice {
  value: string; // 表示値（"3翻", "3翻 40符 5200点" 等）
  correct: boolean;
  mistakeKind?: MistakeKind; // 誤答のとき：どのミスか
  explanation: string; // 「この値は◯◯と取り違えた場合」等の理由・解説
}

export interface QuizQuestion {
  target: QuizTarget;
  prompt: string; // 例 "翻数（ハンスウ）は？" "点数は？"
  choices: QuizChoice[]; // 正解1＋誤答3（ミス変換で生成）
}
