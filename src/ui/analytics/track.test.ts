import { describe, it, expect, beforeEach } from 'vitest';
import { track } from './track.ts';

describe('track', () => {
  beforeEach(() => {
    delete window.dataLayer;
  });

  it('dataLayer 未生成でも初期化して push する', () => {
    track({ event: 'mode_start', character_id: 'mao', mode: 'yaku' });
    expect(window.dataLayer).toEqual([
      { event: 'mode_start', character_id: 'mao', mode: 'yaku' },
    ]);
  });

  it('既存の dataLayer に追記する（GTM スニペット生成分を壊さない）', () => {
    window.dataLayer = [{ event: 'gtm.js' }];
    track({ event: 'quiz_answer', character_id: 'rin', correct: true, target: 'han' });
    expect(window.dataLayer).toEqual([
      { event: 'gtm.js' },
      { event: 'quiz_answer', character_id: 'rin', correct: true, target: 'han' },
    ]);
  });

  it('渡したパラメータだけを送る（playerName 等の混入経路を持たない）', () => {
    track({ event: 'hint_open', character_id: 'mao', level: 0 });
    expect(window.dataLayer![0]).toEqual({
      event: 'hint_open',
      character_id: 'mao',
      level: 0,
    });
  });
});
