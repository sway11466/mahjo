import { render, screen, fireEvent } from '@testing-library/react';
import { CharacterStage } from './CharacterStage.tsx';

describe('CharacterStage', () => {
  it('shows the character name and line', () => {
    render(<CharacterStage name="まお" line="やっほー、始めよう。" />);
    expect(screen.getByText('まお')).toBeInTheDocument();
    expect(screen.getByText('やっほー、始めよう。')).toBeInTheDocument();
  });

  it('shows the hint button only when showHint and calls onHint', () => {
    let hints = 0;
    const { rerender } = render(<CharacterStage name="まお" line="x" />);
    expect(screen.queryByRole('button', { name: 'ヒント' })).not.toBeInTheDocument();

    rerender(
      <CharacterStage name="まお" line="x" showHint onHint={() => (hints += 1)} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'ヒント' }));
    expect(hints).toBe(1);
  });

  it('renders the avatar image when a src is given', () => {
    render(<CharacterStage name="まお" line="x" avatarSrc="/mao.webp" />);
    expect(screen.getByRole('img', { name: 'まお' })).toHaveAttribute(
      'src',
      '/mao.webp',
    );
  });

  it('renders the given actions and calls their handlers', () => {
    let next = 0;
    const { rerender } = render(<CharacterStage name="まお" line="x" />);
    expect(screen.queryByRole('button', { name: '次へ' })).not.toBeInTheDocument();

    rerender(
      <CharacterStage
        name="まお"
        line="x"
        actions={[{ label: '次へ', onClick: () => (next += 1) }]}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: '次へ' }));
    expect(next).toBe(1);
  });

  it('renders accumulated breakdown badges and emphasizes the current one', () => {
    render(
      <CharacterStage
        name="まお"
        line="x"
        badges={[
          { text: '平和 1翻', unit: 'han', current: false },
          { text: 'ドラ 1翻', unit: 'han', current: false },
          { text: '副底 20符', unit: 'fu', current: true },
        ]}
      />,
    );
    expect(screen.getByText('平和 1翻')).toBeInTheDocument();
    expect(screen.getByText('ドラ 1翻')).toHaveClass('stage__badge--han');
    const current = screen.getByText('副底 20符');
    expect(current).toHaveClass('stage__badge--fu');
    expect(current).toHaveClass('stage__badge--current');
  });

  it('renders no badge row when there are no badges', () => {
    const { container } = render(<CharacterStage name="まお" line="x" />);
    expect(container.querySelector('.stage__badges')).toBeNull();
  });
});
