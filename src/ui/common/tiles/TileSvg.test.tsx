import { render, screen } from '@testing-library/react';
import { TileSvg } from './TileSvg.tsx';
import { suited, honorTile } from '../../../engine/tiles.ts';

describe('TileSvg', () => {
  it('renders a suited tile labelled by its name', () => {
    render(<TileSvg tile={suited('man', 1)} />);
    expect(screen.getByRole('img', { name: '1萬' })).toBeInTheDocument();
  });

  it('renders an honor tile labelled by its kanji', () => {
    render(<TileSvg tile={honorTile('east')} />);
    expect(screen.getByRole('img', { name: '東' })).toBeInTheDocument();
  });

  it('marks a red-dora tile by its 赤 name', () => {
    const base = suited('pin', 5);
    const red = base.kind === 'suited' ? { ...base, red: true } : base;
    render(<TileSvg tile={red} />);
    expect(screen.getByRole('img', { name: '赤5筒' })).toBeInTheDocument();
  });
});
