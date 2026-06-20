import { render, screen, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { ScoreTableOverlay } from './ScoreTableOverlay.tsx';

// jsdom は matchMedia 未実装。PC（モーダル）として描画する。
function mockMatchMedia(isMobile: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: isMobile,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

beforeEach(() => mockMatchMedia(false));
afterEach(() => {
  document.body.style.overflow = '';
});

describe('ScoreTableOverlay', () => {
  it('「点数表」ダイアログに中身を出し、×で閉じる', () => {
    const onClose = vi.fn();
    render(<ScoreTableOverlay onClose={onClose} />);
    expect(screen.getByRole('dialog', { name: '点数表' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '子' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '閉じる' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
