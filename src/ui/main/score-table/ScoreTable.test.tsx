import { render, screen, fireEvent, within } from '@testing-library/react';
import { ScoreTable } from './ScoreTable.tsx';

// 行内のセル（td＝role 'cell'）を翻インデックスで取る（th 行頭は除く）。
function cellOf(rowName: string, hanIndex: number): HTMLElement {
  const row = screen.getByRole('rowheader', { name: rowName }).closest('tr')!;
  return within(row).getAllByRole('cell')[hanIndex]!;
}

describe('ScoreTable', () => {
  it('既定は子。子30符3翻＝ロン3900／ツモ子1000・ツモ親2000', () => {
    render(<ScoreTable />);
    expect(screen.getByRole('tab', { name: '子' })).toHaveAttribute('aria-selected', 'true');
    const cell = cellOf('30符', 2); // 0=1翻 … 2=3翻
    expect(within(cell).getByText('3900')).toBeInTheDocument(); // ロン
    expect(within(cell).getByText('1000')).toBeInTheDocument(); // ツモ子
    expect(within(cell).getByText('2000')).toBeInTheDocument(); // ツモ親
  });

  it('成立しない欄は「—」（20符1翻）', () => {
    render(<ScoreTable />);
    expect(within(cellOf('20符', 0)).getByText('—')).toBeInTheDocument();
  });

  it('満貫以上は子・親を併記（タブ非依存）：満貫は子ロン8000・親ロン12000', () => {
    render(<ScoreTable />);
    const cells = within(
      screen.getByRole('rowheader', { name: '満貫' }).closest('tr')!,
    ).getAllByRole('cell'); // [子, 親]
    expect(within(cells[0]!).getByText('8000')).toBeInTheDocument(); // 子ロン
    expect(within(cells[0]!).getByText('2000')).toBeInTheDocument(); // 子ツモ（子払）
    expect(within(cells[1]!).getByText('12000')).toBeInTheDocument(); // 親ロン
  });

  it('親へ切替えると4翻以下の値が変わる（30符4翻ロン11600・ツモ子払3900）', () => {
    render(<ScoreTable />);
    fireEvent.click(screen.getByRole('tab', { name: '親' }));
    expect(within(cellOf('30符', 3)).getByText('11600')).toBeInTheDocument();
    expect(within(cellOf('30符', 3)).getByText('3900')).toBeInTheDocument();
  });

  it('計算手順の見出しを出す', () => {
    render(<ScoreTable />);
    expect(screen.getByRole('heading', { name: '点数の出し方' })).toBeInTheDocument();
  });
});
