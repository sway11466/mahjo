import { render, screen, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { YakuListOverlay } from './YakuListOverlay.tsx';

// オーバーレイは YakuList（全48行＝数百枚の牌SVG）を内包し jsdom では描画が重い。
// 並列実行でのタイムアウトを避けるためテスト時間を延ばす（描画コストは正常）。
vi.setConfig({ testTimeout: 20000 });

// jsdom は matchMedia 未実装。max-width:640px に対する一致を差し替えてモバイル/PCを切り替える。
function mockMatchMedia(isMobile: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: isMobile, // テストでは MOBILE_QUERY 一本だけ見るので isMobile をそのまま返す
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

afterEach(() => {
  // body の overflow ロックを残さない
  document.body.style.overflow = '';
});

describe('YakuListOverlay — PC（モーダル）', () => {
  beforeEach(() => mockMatchMedia(false));

  it('×ボタンで閉じる（戻る矢印は出ない）', () => {
    const onClose = vi.fn();
    render(<YakuListOverlay onClose={onClose} />);
    expect(screen.getByRole('dialog', { name: '役一覧' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '戻る' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '閉じる' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Escape で閉じる', () => {
    const onClose = vi.fn();
    render(<YakuListOverlay onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('中身（YakuList）を表示する', () => {
    render(<YakuListOverlay onClose={() => {}} />);
    expect(screen.getByRole('tab', { name: '役満' })).toBeInTheDocument();
    expect(screen.getByText('平和（ピンフ）')).toBeInTheDocument();
  });
});

describe('YakuListOverlay — モバイル（全画面シート）', () => {
  beforeEach(() => mockMatchMedia(true));

  it('戻る矢印で閉じる（×は出ない）', () => {
    const onClose = vi.fn();
    render(<YakuListOverlay onClose={onClose} />);
    expect(screen.queryByRole('button', { name: '閉じる' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '戻る' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
