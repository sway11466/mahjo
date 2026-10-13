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

// 門前牌の表示順（ラベル列）。あがり牌・副露は除く。
function concealedLabels(container: HTMLElement): string[] {
  return [...container.querySelectorAll('.hand > .hand__tile:not(.hand__tile--winning) svg')].map(
    (svg) => svg.getAttribute('aria-label') ?? '',
  );
}

describe('Hand', () => {
  it('並びは既定で正準順（id 昇順）', () => {
    const hand = makeHand({ concealed: [suited('man', 3), suited('man', 1), suited('man', 2)] });
    const sorted = render(<Hand hand={makeHand({ concealed: [suited('man', 1), suited('man', 2), suited('man', 3)] })} />);
    const expected = concealedLabels(sorted.container);
    sorted.unmount();
    const { container } = render(<Hand hand={hand} />);
    expect(concealedLabels(container)).toEqual(expected);
  });

  it('shuffleWith 指定時は rng でシャッフルした順に並べる（randomTileOrder）', () => {
    const tiles = [suited('man', 1), suited('man', 2), suited('man', 3)];
    const canonical = render(<Hand hand={makeHand({ concealed: tiles })} />);
    const [m1, m2, m3] = concealedLabels(canonical.container);
    canonical.unmount();
    // rng=0 の Fisher–Yates：[1,2,3] → [3,2,1] → [2,3,1]
    const { container } = render(<Hand hand={makeHand({ concealed: tiles })} shuffleWith={() => 0} />);
    expect(concealedLabels(container)).toEqual([m2, m3, m1]);
  });

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
