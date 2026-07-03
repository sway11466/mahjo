import { defaultThemeColor, themeColorOf } from './themeColor.ts';
import { mao } from '../../characters/index.ts';

describe('themeColorOf', () => {
  it('returns the character color when set', () => {
    expect(themeColorOf(mao)).toBe(mao.themeColor);
  });

  it('falls back to the default color when unset', () => {
    const { themeColor: _omit, ...noColor } = mao;
    expect(themeColorOf(noColor)).toBe(defaultThemeColor);
  });
});
