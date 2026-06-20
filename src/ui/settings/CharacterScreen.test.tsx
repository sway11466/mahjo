import { render, screen, fireEvent } from '@testing-library/react';
import { CharacterScreen } from './CharacterScreen.tsx';
import { getCharacter } from '../../characters/index.ts';
import type { Progress } from '../../types/index.ts';

const mao = getCharacter('mao');
const noProgress: Progress = { correctTotal: 0, correctByMode: {} };

describe('CharacterScreen', () => {
  it('lists every registered character as a selectable card', () => {
    render(
      <CharacterScreen
        character={mao}
        progress={noProgress}
        onSelectCharacter={() => {}}
        onBack={() => {}}
      />,
    );
    // レジストリのキャラぶん並ぶ（まお・りん）。
    expect(screen.getByRole('button', { name: /まお/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /りん/ })).toBeInTheDocument();
  });

  it('marks the current character as pressed', () => {
    render(
      <CharacterScreen
        character={mao}
        progress={noProgress}
        onSelectCharacter={() => {}}
        onBack={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: /まお/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: /りん/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('calls onSelectCharacter with the picked id', () => {
    const onSelect = vi.fn();
    render(
      <CharacterScreen
        character={mao}
        progress={noProgress}
        onSelectCharacter={onSelect}
        onBack={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /りん/ }));
    expect(onSelect).toHaveBeenCalledWith('rin');
  });

  it('shows the rapport rating without a raw correct count', () => {
    render(
      <CharacterScreen
        character={mao}
        progress={{ correctTotal: 23, correctByMode: {} }}
        onSelectCharacter={() => {}}
        onBack={() => {}}
      />,
    );
    expect(screen.getByText('好感度')).toBeInTheDocument();
    // 累計正解数は出さない（好感度のハートだけで見せる）。
    expect(screen.queryByText(/問正解/)).not.toBeInTheDocument();
  });
});
