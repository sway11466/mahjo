import { characters, defaultCharacterId, getCharacter } from './index.ts';
import { HINT_KEYS, HINT_KEY_SET } from '../hints/keys.ts';

describe('characters registry', () => {
  it('contains the default character', () => {
    expect(characters.some((c) => c.id === defaultCharacterId)).toBe(true);
  });

  it('getCharacter returns by id and falls back to default for unknown id', () => {
    expect(getCharacter('mao').id).toBe('mao');
    expect(getCharacter('does-not-exist').id).toBe(defaultCharacterId);
  });

  it('every character id is unique', () => {
    const ids = characters.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// レジストリの全キャラを回す（キャラ追加で自動的に検証対象へ入る＝testing.md §8「各キャラ」）。
// mao だけを見る形だと2人目以降のキー欠落・本数不足が回帰で検出されない。
const byId = characters.map((c) => [c.id, c] as const);

describe.each(byId)('%s persona data', (_id, c) => {
  it('has at least 2 lines in each required pool (character-guide §2)', () => {
    // 必須5場面（greeting/dealing/correct/wrong/finished）は飽き対策で最低2本。
    expect(c.persona.greeting.length).toBeGreaterThanOrEqual(2);
    expect(c.persona.dealing.length).toBeGreaterThanOrEqual(2);
    expect(c.persona.correct.length).toBeGreaterThanOrEqual(2);
    expect(c.persona.wrong.length).toBeGreaterThanOrEqual(2);
    expect(c.persona.finished.length).toBeGreaterThanOrEqual(2);
  });

  it('declares the neutral base face that portraits fall back to', () => {
    // 表情画像の最終フォールバック先は neutral ベース顔（avatarAssets.portraitUrl ②・
    // character-guide §3）。宣言が無いとフォールバックの網が消えるので必ず在ること。
    const provided = new Set(c.expressions.map((e) => e.expression));
    expect(provided.has('neutral')).toBe(true);
  });

  it('every expression asset has at least one src under the character dir', () => {
    for (const e of c.expressions) {
      expect(e.srcs.length).toBeGreaterThan(0);
      for (const src of e.srcs) {
        expect(src, `src of ${e.expression}`).toMatch(new RegExp(`^characters/${c.id}/`));
      }
    }
  });

  it('theme/accent colors are hex when set', () => {
    if (c.themeColor !== undefined) expect(c.themeColor).toMatch(/^#[0-9a-fA-F]{6}$/);
    if (c.accentColor !== undefined) expect(c.accentColor).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it('has a non-empty mistake line for every MistakeKind', () => {
    // 全 MistakeKind を網羅（Record で型は強制。中身が空でないことを確認）。
    const lines = Object.values(c.mistakes);
    expect(lines.length).toBeGreaterThanOrEqual(5);
    for (const text of lines) expect(text.trim().length).toBeGreaterThan(0);
  });
});

describe.each(byId)('%s hint script — hint-base 突き合わせ', (_id, c) => {
  it('script のキー集合が HINT_KEYS と過不足なく一致（hints.md §2）', () => {
    const keys = Object.keys(c.script);
    expect(new Set(keys)).toEqual(HINT_KEY_SET); // 余剰なし
    for (const k of HINT_KEYS) {
      expect(c.script[k], `missing hint key: ${k}`).toBeDefined(); // 書き漏れなし
    }
  });

  it('各キーは最低1段の文言を持ち、空文字を含まない', () => {
    for (const [key, steps] of Object.entries(c.script)) {
      expect(steps.length, `empty steps: ${key}`).toBeGreaterThan(0);
      for (const text of steps) {
        expect(text.trim().length, `blank step in: ${key}`).toBeGreaterThan(0);
      }
    }
  });
});
