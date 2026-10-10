import { render, screen, fireEvent } from '@testing-library/react';
import { AppSettingsScreen } from './AppSettingsScreen.tsx';
import { defaultAppSettings } from '../../storage/index.ts';
import { getCharacter } from '../../characters/index.ts';
import type { AppSettings } from '../../types/index.ts';

const mao = getCharacter('mao');

function renderScreen(
  appSettings: AppSettings,
  onChange: (next: AppSettings) => void = () => {},
) {
  render(
    <AppSettingsScreen
      appSettings={appSettings}
      onChange={onChange}
      character={mao}
      onBack={() => {}}
    />,
  );
}

describe('AppSettingsScreen', () => {
  it('BGM トグルは編集可で、反転値で onChange する', () => {
    let next: AppSettings | null = null;
    renderScreen({ ...defaultAppSettings(), bgm: false }, (a) => (next = a));
    const toggle = screen.getByRole('switch', { name: '音楽' });
    expect(toggle).not.toBeDisabled();
    fireEvent.click(toggle);
    expect(next).not.toBeNull();
    expect(next!.bgm).toBe(true);
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
