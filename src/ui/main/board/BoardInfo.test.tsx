import { render, screen } from '@testing-library/react';
import { BoardInfo } from './BoardInfo.tsx';
import { suited } from '../../../engine/tiles.ts';

describe('BoardInfo', () => {
  it('always shows dora and ura-dora; ura is face-down without riichi', () => {
    render(
      <BoardInfo
        roundWind="east"
        roundIndex={0}
        doraIndicators={[suited('pin', 3)]}
        uraDoraIndicators={[]}
      />,
    );
    expect(screen.getByText('東1局')).toBeInTheDocument();
    expect(screen.getByText('ドラ')).toBeInTheDocument();
    expect(screen.getByText('裏ドラ')).toBeInTheDocument();
    // 未公開の裏ドラは裏向きの牌
    expect(screen.getByRole('img', { name: '裏向きの牌' })).toBeInTheDocument();
  });

  it('reveals the ura-dora tile on riichi (no face-down tile)', () => {
    render(
      <BoardInfo
        roundWind="south"
        roundIndex={5}
        doraIndicators={[suited('sou', 2)]}
        uraDoraIndicators={[suited('pin', 7)]}
      />,
    );
    expect(screen.getByText('南2局')).toBeInTheDocument();
    expect(screen.getByText('裏ドラ')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: '裏向きの牌' })).toBeNull();
  });
});
