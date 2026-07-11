import type { Character } from '../types/index.ts';
import { mao } from './mao/index.ts';
import { rin } from './rin/index.ts';

// characters はデータのみ（architecture §2）。レジストリ（一覧・id 引き・既定キャラへの
// フォールバック）はデータ参照としてここが持つ。解決ロジックは持たない
// （場面→表情＝src/session/reaction.ts、テーマ色の既定＝src/ui/character/themeColor.ts）。

/** キャラのレジストリ（character-guide §4）。追加はここに足すだけ。 */
export const characters: Character[] = [mao, rin /*, …順次追加 */];
export const defaultCharacterId = 'mao';

/** id でキャラを引く。未知 id は既定キャラへフォールバック。 */
export function getCharacter(id: string): Character {
  return (
    characters.find((c) => c.id === id) ??
    characters.find((c) => c.id === defaultCharacterId)!
  );
}

export { mao, rin };
