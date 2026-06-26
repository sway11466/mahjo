import {
  characters,
  defaultCharacterId,
  getCharacter,
  defaultReactions,
  defaultThemeColor,
  expressionFor,
  themeColorOf,
  mao,
} from './index.ts';
import type { ReactionTrigger } from '../types/index.ts';
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

describe('mao persona data', () => {
  it('has at least 2 lines in each required pool (character-guide §2)', () => {
    // 必須5場面（greeting/dealing/correct/wrong/finished）は飽き対策で最低2本。
    expect(mao.persona.greeting.length).toBeGreaterThanOrEqual(2);
    expect(mao.persona.dealing.length).toBeGreaterThanOrEqual(2);
    expect(mao.persona.correct.length).toBeGreaterThanOrEqual(2);
    expect(mao.persona.wrong.length).toBeGreaterThanOrEqual(2);
    expect(mao.persona.finished.length).toBeGreaterThanOrEqual(2);
  });

  it('places the neutral base face that other triggers fall back to', () => {
    // 練習モードのリアクション6種を配置済み（neutral/thinking/insight/smile/happy/troubled）。
    // 未配置の場面（飾り表情など）は ui が neutral ベース顔へフォールバックする
    // （avatarAssets ②・character-guide §3）。neutral は必ず在ること＝フォールバック先。
    const provided = new Set(mao.expressions.map((e) => e.expression));
    expect(provided.has('neutral')).toBe(true);
    expect(expressionFor(mao, 'greeting')).toBe('neutral');
  });

  it('every expression asset has at least one src', () => {
    for (const e of mao.expressions) {
      expect(e.srcs.length).toBeGreaterThan(0);
      expect(e.srcs[0]).toMatch(/^characters\/mao\//);
    }
  });

  it('has a theme color (hex)', () => {
    expect(mao.themeColor).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it('has a non-empty mistake line for every MistakeKind', () => {
    // 全 MistakeKind を網羅（Record で型は強制。中身が空でないことを確認）。
    const lines = Object.values(mao.mistakes);
    expect(lines.length).toBeGreaterThanOrEqual(5);
    for (const text of lines) expect(text.trim().length).toBeGreaterThan(0);
  });
});

describe('mao hint script — hint-base 突き合わせ', () => {
  it('script のキー集合が HINT_KEYS と過不足なく一致（hints.md §2）', () => {
    const keys = Object.keys(mao.script);
    expect(new Set(keys)).toEqual(HINT_KEY_SET); // 余剰なし
    for (const k of HINT_KEYS) {
      expect(mao.script[k], `missing hint key: ${k}`).toBeDefined(); // 書き漏れなし
    }
  });

  it('各キーは最低1段の文言を持ち、空文字を含まない', () => {
    for (const [key, steps] of Object.entries(mao.script)) {
      expect(steps.length, `empty steps: ${key}`).toBeGreaterThan(0);
      for (const text of steps) {
        expect(text.trim().length, `blank step in: ${key}`).toBeGreaterThan(0);
      }
    }
  });
});

describe('themeColorOf', () => {
  it('returns the character color when set', () => {
    expect(themeColorOf(mao)).toBe(mao.themeColor);
  });

  it('falls back to the default color when unset', () => {
    const { themeColor: _omit, ...noColor } = mao;
    expect(themeColorOf(noColor)).toBe(defaultThemeColor);
  });
});

describe('expressionFor', () => {
  const triggers: ReactionTrigger[] = [
    'greeting',
    'dealing',
    'hinting',
    'explaining',
    'correct',
    'wrong',
    'finished',
  ];

  it('falls back to the default map for triggers without an override', () => {
    const noOverride = { ...mao, reactions: {} };
    for (const t of triggers) {
      expect(expressionFor(noOverride, t)).toBe(defaultReactions[t]);
    }
  });

  it('mao greets with the default neutral (no override)', () => {
    expect(expressionFor(mao, 'greeting')).toBe('neutral');
  });

  it('prefers a character-specific override', () => {
    const custom = { ...mao, reactions: { correct: 'mischievous' as const } };
    expect(expressionFor(custom, 'correct')).toBe('mischievous');
    expect(expressionFor(custom, 'wrong')).toBe(defaultReactions.wrong);
  });
});
