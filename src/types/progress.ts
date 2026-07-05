import type { StudyMode } from './hint.ts';
import type { QuizTarget } from './quiz.ts';

/**
 * 出題種類（QuizTarget）ごとの定着度。率＝correct/seen で苦手を測る（session.md §5）。
 * seen（分母）を持つのが要点：正解数だけでは「苦手」と「未出題・露出不足」を区別できない。
 */
export interface SkillStat {
  seen: number; // 挑戦回数（分母）
  correct: number; // 正解数（分子）。wrong は seen − correct で導出＝別フィールドを持たない
}

/**
 * 1キャラ分の成績。難易度アンロック（出題範囲）・好感度・表情/衣装/特別セリフのアンロック・
 * 節目演出の駆動要素＋苦手の把握。お祝い止まり（プレッシャーをかけない）。
 * 苦手データはキャラ別＝接点が浅いキャラは得手不得手を「まだ知らない」のが妥当な状態。
 */
export interface Progress {
  correctTotal: number; // 累計正答数
  correctByMode: Partial<Record<StudyMode, number>>; // モード別（難易度アンロックの駆動）
  /** 何が弱いか（翻/点数の定着度＝率の真実）。任意＝既存データと共存し欠落は防御的読込が補完。
   *  寄り添いアドバイスの素（出口の活用は backlog feature-14）。誤り方は集計（byMistake）でなく
   *  間違い履歴＝失敗した出題の生データを貯める（./miss.ts の MissHistory。解釈でなく事実を保存）。 */
  byTarget?: Partial<Record<QuizTarget, SkillStat>>;
}

/**
 * 成績はキャラごとに別管理（characterId → 成績）。キャラを切り替えると、そのキャラの
 * 進捗・難易度帯で続く。localStorage 保存。
 */
export type ProgressByCharacter = Record<string /* characterId */, Progress>;
