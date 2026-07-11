import type { Character } from '../../types/index.ts';

// テーマ色の resolver（ui の装飾。character-guide §2「テーマ色」）。
// characters はデータのみを持つ規約（architecture §2）のため、既定色フォールバックは ui が持つ。

/** themeColor 未指定キャラのフォールバック色。 */
export const defaultThemeColor = '#6a4fb0';

/** キャラのテーマ色（未指定は既定色）。背景グロー等の装飾（--char-glow）に使う。 */
export function themeColorOf(character: Character): string {
  return character.themeColor ?? defaultThemeColor;
}
