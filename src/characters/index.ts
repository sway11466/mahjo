import type {
  Character,
  Expression,
  ReactionTrigger,
} from '../types/index.ts';
import { mao } from './mao/index.ts';
import { rin } from './rin/index.ts';

/** キャラのレジストリ（character-guide §4）。追加はここに足すだけ。 */
export const characters: Character[] = [mao, rin /*, …順次追加 */];
export const defaultCharacterId = 'mao';

/** themeColor 未指定キャラのフォールバック色。 */
export const defaultThemeColor = '#6a4fb0';

/** キャラのテーマ色（未指定は既定色）。 */
export function themeColorOf(character: Character): string {
  return character.themeColor ?? defaultThemeColor;
}

/** id でキャラを引く。未知 id は既定キャラへフォールバック。 */
export function getCharacter(id: string): Character {
  return (
    characters.find((c) => c.id === id) ??
    characters.find((c) => c.id === defaultCharacterId)!
  );
}

/**
 * 場面（ReactionTrigger）→ 表情の既定マップ（character-guide §2 / data-model §13）。
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

export { mao, rin };
