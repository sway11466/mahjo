import { render, screen, within } from '@testing-library/react';
import { FuCounting } from './FuCounting.tsx';

describe('FuCounting', () => {
  it('3つのセクション見出しを出す', () => {
    render(<FuCounting />);
    expect(screen.getByRole('heading', { name: '符の発生源' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '面子の符' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '特例' })).toBeInTheDocument();
  });

  it('発生源（副底20符）と特例（七対子25符）を出す', () => {
    render(<FuCounting />);
    expect(screen.getByText('副底（フーテイ）')).toBeInTheDocument();
    const futei = screen.getByText('副底（フーテイ）').closest('li')!;
    expect(within(futei).getByText('20符')).toBeInTheDocument();
    expect(screen.getByText('七対子（チートイツ）')).toBeInTheDocument();
  });

  it('面子の符の表：么九の暗刻=8符・暗槓=32符', () => {
    render(<FuCounting />);
    const table = screen.getByRole('table');
    const kotsu = within(table).getByRole('rowheader', { name: '刻子（コーツ）' }).closest('tr')!;
    expect(within(kotsu).getByText('8符')).toBeInTheDocument(); // 么九 暗（末列）
    const kantsu = within(table).getByRole('rowheader', { name: '槓子（カンツ）' }).closest('tr')!;
    expect(within(kantsu).getByText('32符')).toBeInTheDocument();
  });
});
