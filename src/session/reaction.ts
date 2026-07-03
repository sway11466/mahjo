import type {
  Character,
  Expression,
  ReactionTrigger,
} from '../types/index.ts';

// 場面→表情の解決（キャラのリアクション選択の一部）。characters はデータのみを持つ
// 規約（architecture §2）のため、既定マップと解決ロジックは session が持つ。
// 仕様の正：[session.md](../../docs/spec/session.md) §4「場面（リアクション）の正準」。

/**
 * 場面（ReactionTrigger）→ 表情の既定マップ（session.md §4 / data-model §13）。
 * キャラが reactions で上書きしない場面はここへフォールバックする。
 */
export const defaultReactions: Record<ReactionTrigger, Expression> = {
  greeting: 'neutral',
  dealing: 'thinking', // 出題中は一緒に考える姿勢（session.md §4）
  hinting: 'insight', // ヒント表示中はひらめきを促す（session.md §4）
  explaining: 'smile',
  correct: 'happy',
  wrong: 'troubled',
  finished: 'happy', // 終了のお祝い（晴れやかに）
};

/** 場面 → そのキャラの表情。キャラ固有 reactions を優先し、無ければ既定マップ。 */
export function expressionFor(
  character: Character,
  trigger: ReactionTrigger,
): Expression {
  return character.reactions[trigger] ?? defaultReactions[trigger];
}
