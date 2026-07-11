import type { Hand } from './hand.ts';
import type { Table } from './table.ts';
import type { WinContext } from './win-context.ts';
import type { StudyMode } from './hint.ts';

/**
 * 間違い履歴（data-model §16）。失敗した出題の生データ＝事実だけを保存し、
 * 解釈（MistakeKind 等の分類）は保存しない。集計・分類は表示時に都度行う
 * （真因の診断でなくヒント＝断定しない）。出口は キャラの寄り添いアドバイス
 * （backlog feature-14）と間違い復習（parking lot）。
 */
export interface MissRecord {
  at: string; // 保存時刻（ISO 8601。直近重視の集計・表示用）
  hand: Hand;
  table: Table;
  winContext: WinContext;
  selectedValue: string; // 選んだ誤答の表示値（QuizChoice.value）
  correctValue: string; // 正解の表示値
}

/** キャラ別×モード別のリングバッファ（新しいものが末尾）。localStorage 保存（storage.md）。 */
export type MissHistory = Record<
  string /* characterId */,
  Partial<Record<StudyMode, MissRecord[]>>
>;

/** 1バッファ（キャラ×モード）の保持件数上限。追記（session）と防御的読込（storage）で共有する。 */
export const MISS_HISTORY_CAP = 50;
