import { render, screen, fireEvent } from '@testing-library/react';
import { BgmToggle } from './BgmToggle.tsx';

describe('BgmToggle', () => {
  it('オフは押されていない状態で、押すと onToggle を呼ぶ', () => {
    const onToggle = vi.fn();
    render(<BgmToggle on={false} onToggle={onToggle} />);
    const button = screen.getByRole('button', { name: '音楽' });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(button);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('オンは押された状態で表示する', () => {
    render(<BgmToggle on onToggle={() => {}} />);
    expect(screen.getByRole('button', { name: '音楽' })).toHaveAttribute('aria-pressed', 'true');
  });
});
