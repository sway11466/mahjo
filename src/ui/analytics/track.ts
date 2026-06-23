import type { StudyMode, QuizTarget } from '../../types/index.ts';

// SPA 学習イベントの計測（backlog feature-18）。発火は ui 層に閉じ（副作用＝architecture.md §2、
// engine/session/hints は純 TS のまま）、ここは薄く dataLayer.push するだけ。GTM 側で
// dataLayer イベント → GA4 イベントへマップする（命名は GA4 慣習の snake_case・低カーディナリティ）。
//
// プライバシー：個人特定情報は送らない。とくに AppSettings.playerName は送らない
// （product-concept §3 の個人学習思想・data-model §16）。各イベントの型を狭く定義し、
// playerName が紛れ込む経路を作らない。

// GTM スニペットが生成する dataLayer。GTM 無効環境（ローカル＝空コンテナID）や
// jsdom テストでは未定義のことがあるため、push 前に防御的に初期化する。
declare global {
  interface Window {
    // GTM の dataLayer は異種オブジェクトの配列（gtm.js 制御メッセージ＋本イベント）。
    dataLayer?: unknown[];
  }
}

// 全イベント共通：character_id をどの指標もキャラ別に切れるよう常に載せる
// （キャラ駆動＝product-concept の背骨）。
interface BaseParams {
  character_id: string;
}

// フェーズ1の6イベント（backlog feature-18）。低カーディナリティのみ。
type TrackEvent =
  | { event: 'mode_start'; mode: StudyMode }
  | { event: 'question_view'; target?: QuizTarget }
  | { event: 'quiz_answer'; correct: boolean; target?: QuizTarget }
  | { event: 'hint_open'; level: number }
  | { event: 'explain_view' }
  | { event: 'session_complete'; mode: StudyMode; correct_count: number };

/**
 * 学習イベントを dataLayer へ送る。GTM が消費する（無効環境では push されるだけで無害）。
 * window 不在（SSR 等）・dataLayer 未生成でも落ちないよう防御する。
 */
export function track(payload: TrackEvent & BaseParams): void {
  if (typeof window === 'undefined') return;
  (window.dataLayer ??= []).push(payload);
}
