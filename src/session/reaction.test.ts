import { defaultReactions, expressionFor } from './reaction.ts';
import { mao } from '../characters/index.ts';
import type { ReactionTrigger } from '../types/index.ts';

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
    // まおは reactions 上書き無し＝あいさつは既定 neutral（character-mao.md）。
    expect(expressionFor(mao, 'greeting')).toBe('neutral');
  });

  it('prefers a character-specific override', () => {
    const custom = { ...mao, reactions: { correct: 'mischievous' as const } };
    expect(expressionFor(custom, 'correct')).toBe('mischievous');
    expect(expressionFor(custom, 'wrong')).toBe(defaultReactions.wrong);
  });
});
