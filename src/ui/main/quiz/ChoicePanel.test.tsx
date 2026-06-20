import { render, screen, fireEvent } from '@testing-library/react';
import type { QuizChoice } from '../../../types/index.ts';
import { ChoicePanel } from './ChoicePanel.tsx';

const choices: QuizChoice[] = [
  { value: '2翻', correct: false, explanation: '' },
  { value: '3翻', correct: true, explanation: '' },
  { value: '4翻', correct: false, explanation: '' },
  { value: '5翻', correct: false, explanation: '' },
];

describe('ChoicePanel', () => {
  it('renders the four choice buttons', () => {
    render(
      <ChoicePanel
        choices={choices}
        selectedIndex={null}
        revealed={false}
        onSelect={() => {}}
      />,
    );
    expect(screen.getAllByRole('button')).toHaveLength(4);
  });

  it('calls onSelect with the clicked index', () => {
    let picked = -1;
    render(
      <ChoicePanel
        choices={choices}
        selectedIndex={null}
        revealed={false}
        onSelect={(i) => {
          picked = i;
        }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: '4翻' }));
    expect(picked).toBe(2);
  });

  it('disables buttons once revealed', () => {
    render(
      <ChoicePanel
        choices={choices}
        selectedIndex={0}
        revealed
        onSelect={() => {}}
      />,
    );
    for (const btn of screen.getAllByRole('button')) {
      expect(btn).toBeDisabled();
    }
  });

  it('marks the correct choice and the selected wrong choice on reveal', () => {
    // selectedIndex=0（2翻）は誤答、正解は index1（3翻）。正誤は4択の中で示す。
    render(
      <ChoicePanel
        choices={choices}
        selectedIndex={0}
        revealed
        onSelect={() => {}}
      />,
    );
    expect(
      screen.getByRole('button', { name: '3翻（正解）' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '2翻（あなたの回答・不正解）' }),
    ).toBeInTheDocument();
  });

  it('shows the selection mark on hover, then fixes it on the chosen choice', () => {
    const mark = <span data-testid="mark" />;
    const { rerender } = render(
      <ChoicePanel
        choices={choices}
        selectedIndex={null}
        revealed={false}
        onSelect={() => {}}
        selectionMark={mark}
      />,
    );
    // 未選択：各選択肢にホバー用マークが入る（CSS で非表示）。固定マークはまだ無い。
    expect(screen.getAllByTestId('mark')).toHaveLength(choices.length);
    expect(document.querySelector('.choices__select-mark--fixed')).toBeNull();

    // 選択直後（答え合わせ前 revealed=false）：選んだ選択肢に1つだけ固定し、他には出さない。
    rerender(
      <ChoicePanel
        choices={choices}
        selectedIndex={0}
        revealed={false}
        onSelect={() => {}}
        selectionMark={mark}
      />,
    );
    const marks = screen.getAllByTestId('mark');
    expect(marks).toHaveLength(1);
    expect(marks[0]!.parentElement).toHaveClass('choices__select-mark--fixed');
    expect(screen.getByRole('button', { name: '2翻' })).toContainElement(
      marks[0]!,
    );
  });

  it('locks the buttons once a choice is selected (before reveal)', () => {
    render(
      <ChoicePanel
        choices={choices}
        selectedIndex={0}
        revealed={false}
        onSelect={() => {}}
      />,
    );
    for (const btn of screen.getAllByRole('button')) {
      expect(btn).toBeDisabled();
    }
  });
});
