import { render, screen, fireEvent, act } from '@testing-library/react';
import { MainScreen } from './MainScreen.tsx';
import { mulberry32 } from '../../engine/rng.ts';
import { getCharacter } from '../../characters/index.ts';
import { rules } from '../../engine/__tests__/hands.ts';
import type { Progress } from '../../types/index.ts';

describe('MainScreen — 進捗の反映タイミング', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  // bug-8 回帰：進捗は「次へ」でなく回答確定（答え合わせ）時に反映する。「次へ」まで待つと、
  // 押さずにメニューへ戻った1問の progress が消え、計測（quiz_answer＝回答時に発火）ともズレる。
  it('答え合わせの時点で setProgress が呼ばれる（「次へ」を押さなくても）', () => {
    vi.useFakeTimers();
    const saved: Progress[] = [];
    render(
      <MainScreen
        mode="yaku"
        character={getCharacter('mao')}
        progress={{ correctTotal: 0, correctByMode: {} }}
        setProgress={(p) => saved.push(p)}
        rng={mulberry32(1)}
        rules={rules()}
        onExit={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'はじめる' }));

    // 役モードの4択（「N翻」）から1つ選ぶ。御札を置いた直後（答え合わせ前）はまだ反映しない。
    fireEvent.click(screen.getAllByRole('button', { name: /翻$/ })[0]!);
    expect(saved).toHaveLength(0);

    // 答え合わせ（REVEAL_DELAY 経過）で反映される。「次へ」は押していない。
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(saved).toHaveLength(1);
    expect(saved[0]!.byTarget?.han?.seen).toBe(1);
  });
});

describe('MainScreen — リーチ脇の状況バッジ（feature-8）', () => {
  // シードは startQuiz の1問目の winContext を走査して確定（15＝ダブルリーチ／10＝素のリーチ）。
  // startQuiz が rng を最初に消費するので、MainScreen に同じシードを渡せば同じ出題になる。
  const renderWithSeed = (seed: number) =>
    render(
      <MainScreen
        mode="yaku"
        character={getCharacter('mao')}
        progress={{ correctTotal: 0, correctByMode: {} }}
        setProgress={() => {}}
        rng={mulberry32(seed)}
        rules={rules()}
        onExit={() => {}}
      />,
    );

  it('ダブルリーチの出題では「第一打」バッジが出る', () => {
    renderWithSeed(15);
    fireEvent.click(screen.getByRole('button', { name: 'はじめる' }));
    expect(screen.getByText('リーチ')).toBeInTheDocument();
    expect(screen.getByText('第一打')).toBeInTheDocument();
  });

  it('素のリーチでは「第一打」バッジは出ない', () => {
    renderWithSeed(10);
    fireEvent.click(screen.getByRole('button', { name: 'はじめる' }));
    expect(screen.getByText('リーチ')).toBeInTheDocument();
    expect(screen.queryByText('第一打')).toBeNull();
  });
});
