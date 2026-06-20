import { render, screen, within, fireEvent } from '@testing-library/react';
import { App } from './App.tsx';

describe('App', () => {
  it('starts on the start screen with the character and menu', () => {
    render(<App />);
    expect(screen.getByText('Mahjo')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '練習開始' }),
    ).toBeInTheDocument();
    // 立ち絵（全身）がキャラ名の alt で出る
    expect(screen.getByAltText('まお')).toBeInTheDocument();
  });

  it('練習開始 → モード選択 → あいさつ → はじめる で和了形が出る', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '練習開始' }));
    // 役/点数のモード選択にインライン展開する
    fireEvent.click(screen.getByRole('button', { name: '役モード' }));
    // あいさつ中は盤面（手牌）を出さない。「はじめる」で1問目へ。
    expect(screen.queryByRole('list', { name: '手牌' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'はじめる' }));
    // メイン画面：生成された和了形の牌が並び、キャラの会話窓が出る
    const hand = screen.getByRole('list', { name: '手牌' });
    expect(within(hand).getAllByRole('listitem').length).toBeGreaterThan(0);
    expect(screen.getByText('まお')).toBeInTheDocument();
  });

  it('ヒントを開くと会話が場面セリフからヒント文へ変わる（view-state 配線の通し確認）', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '練習開始' }));
    fireEvent.click(screen.getByRole('button', { name: '役モード' }));
    fireEvent.click(screen.getByRole('button', { name: 'はじめる' }));

    const stage = screen.getByRole('region', { name: 'キャラクター' });
    const lineText = () => stage.querySelector('.stage__line')?.textContent ?? '';
    const sceneLine = lineText(); // 出題中の場面セリフ（charView.line）

    // 生成手は必ず役ありなのでヒント段が1つ以上ある＝出題中はヒントを開ける。
    const hintBtn = screen.getByRole('button', { name: 'ヒント' });
    expect(hintBtn).toBeEnabled();
    fireEvent.click(hintBtn);

    // 会話枠のセリフが場面→ヒント文に切り替わる（line が buildViewState の hinting 分岐を通る）。
    const hintLine = lineText();
    expect(hintLine).not.toBe(sceneLine);
    expect(hintLine).toBeTruthy();
  });
});
