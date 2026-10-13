import { render, screen, fireEvent } from '@testing-library/react';
import { AppSettingsScreen } from './AppSettingsScreen.tsx';
import { defaultAppSettings } from '../../storage/index.ts';
import { getCharacter } from '../../characters/index.ts';
import type { AppSettings } from '../../types/index.ts';

const mao = getCharacter('mao');

function renderScreen(
  appSettings: AppSettings,
  onChange: (next: AppSettings) => void = () => {},
  bgm: { on: boolean; onChange: (on: boolean) => void } = { on: false, onChange: () => {} },
) {
  render(
    <AppSettingsScreen
      appSettings={appSettings}
      onChange={onChange}
      bgmOn={bgm.on}
      onBgmChange={bgm.onChange}
      character={mao}
      onBack={() => {}}
    />,
  );
}

describe('AppSettingsScreen', () => {
  it('BGM トグルは編集可で、保存する設定でなく BGM の状態を反転して返す', () => {
    let changed: AppSettings | null = null;
    let bgm: boolean | null = null;
    renderScreen(defaultAppSettings(), (a) => (changed = a), {
      on: false,
      onChange: (on) => (bgm = on),
    });
    const toggle = screen.getByRole('switch', { name: '音楽' });
    expect(toggle).not.toBeDisabled();
    fireEvent.click(toggle);
    expect(bgm).toBe(true);
    expect(changed).toBeNull();
  });

  it('牌のランダム並びトグルは編集可で、反転値で onChange する', () => {
    let next: AppSettings | null = null;
    renderScreen({ ...defaultAppSettings(), randomTileOrder: false }, (a) => (next = a));
    const toggle = screen.getByRole('switch', { name: '牌のランダム並び' });
    expect(toggle).not.toBeDisabled();
    fireEvent.click(toggle);
    expect(next!.randomTileOrder).toBe(true);
  });

  it('未実装項目（効果音）は操作不可（disabled）', () => {
    renderScreen(defaultAppSettings());
    expect(screen.getByRole('switch', { name: '効果音' })).toBeDisabled();
  });
});
