import { render, screen } from '@testing-library/react';
import type { Hand as HandModel } from '../../types/index.ts';
import { Hand } from './Hand.tsx';
import { suited } from '../../engine/tiles.ts';

function makeHand(over: Partial<HandModel> = {}): HandModel {
  return {
    concealed: [suited('man', 1), suited('man', 2)],
    calledMelds: [],
    winningTile: suited('man', 3),
    ...over,
  };
}

describe('Hand', () => {
  it('renders concealed tiles plus a separated winning tile', () => {
    const { container } = render(<Hand hand={makeHand()} />);
    // 門前2枚＋あがり牌1枚
    expect(container.querySelectorAll('.hand__tile')).toHaveLength(3);
    expect(container.querySelector('.hand__gap')).not.toBeNull();
    expect(container.querySelector('.hand__tile--winning')).not.toBeNull();
  });

  it('marks the winning tile as ron (lifted/flipped) and labels it', () => {
    render(<Hand hand={makeHand()} win="ron" />);
    const winning = document.querySelector('.hand__tile--winning');
    expect(winning).toBeVisible();
    expect(winning).toHaveClass('hand__tile--ron');
    expect(screen.getByText('ロン')).toBeInTheDocument();
  });

  it('labels the winning tile as tsumo without the ron transform', () => {
    render(<Hand hand={makeHand()} win="tsumo" />);
    expect(screen.getByText('ツモ')).toBeInTheDocument();
    expect(document.querySelector('.hand__tile--ron')).toBeNull();
  });

  it('shows called melds as a separated group', () => {
    const meld = {
      type: 'kotsu' as const,
      tiles: [suited('sou', 2, 0), suited('sou', 2, 1), suited('sou', 2, 2)],
      open: true,
    };
    const { container } = render(
      <Hand hand={makeHand({ calledMelds: [meld] })} />,
    );
    expect(container.querySelector('.hand__meld')).not.toBeNull();
    expect(container.querySelectorAll('.hand__tile--called')).toHaveLength(3);
    // 刻子の副露は「ポン」と添える
    expect(screen.getByText('ポン')).toBeInTheDocument();
  });
});
