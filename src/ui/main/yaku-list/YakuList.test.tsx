import { render, screen, fireEvent, within } from '@testing-library/react';
import { vi } from 'vitest';
import { YakuList } from './YakuList.tsx';

// 全48行＝多数の例示手（数百枚の牌SVG）を描画するため jsdom では重い。並列実行での
// タイムアウトを避けるためテスト時間を延ばす（描画コストは正常・ロジックの問題ではない）。
vi.setConfig({ testTimeout: 20000 });

describe('YakuList', () => {
  it('既定（すべて）で全役＋レア役を一覧する（45＋3）', () => {
    render(<YakuList />);
    expect(screen.getAllByRole('listitem')).toHaveLength(48);
    expect(screen.getByText('平和（ピンフ）')).toBeInTheDocument();
    expect(screen.getByText('国士無双（コクシムソウ）')).toBeInTheDocument();
    expect(screen.getByText('流し満貫（ナガシマンガン）')).toBeInTheDocument();
  });

  it('役満フィルタは役満だけに絞る（15件）', () => {
    render(<YakuList />);
    fireEvent.click(screen.getByRole('tab', { name: '役満' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(15);
    expect(screen.getByText('国士無双（コクシムソウ）')).toBeInTheDocument();
    expect(screen.queryByText('リーチ')).toBeNull();
  });

  it('レアフィルタはレア役だけに絞る（3件）', () => {
    render(<YakuList />);
    fireEvent.click(screen.getByRole('tab', { name: 'レア' }));
    const rows = screen.getAllByRole('listitem');
    expect(rows).toHaveLength(3);
    expect(screen.getByText('大車輪（ダイシャリン）')).toBeInTheDocument();
    expect(screen.queryByText('国士無双（コクシムソウ）')).toBeNull();
  });

  it('難易度は見抜き難易度の軸（generation.md §3）に一致する', () => {
    render(<YakuList />);
    // 平和＝上級、清一色＝中級、七対子・対々和＝初級（翻でなく見抜きの難易度）
    fireEvent.click(screen.getByRole('tab', { name: '上級' }));
    expect(screen.getByText('平和（ピンフ）')).toBeInTheDocument();
    expect(screen.queryByText('清一色（チンイツ）')).toBeNull();

    fireEvent.click(screen.getByRole('tab', { name: '中級' }));
    expect(screen.getByText('清一色（チンイツ）')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: '初級' }));
    expect(screen.getByText('七対子（チートイツ）')).toBeInTheDocument();
    expect(screen.getByText('対々和（トイトイ）')).toBeInTheDocument();
    expect(screen.queryByText('平和（ピンフ）')).toBeNull();
  });

  it('形で決まる役には参考手牌、状況で決まる役には付かない', () => {
    render(<YakuList />);
    // 形役（通常・役満・レア大車輪）＝参考手牌あり
    const pinfu = screen.getByText('平和（ピンフ）').closest('li')!;
    expect(within(pinfu).getByLabelText('参考手牌')).toBeInTheDocument();
    expect(within(pinfu).getAllByRole('img')).toHaveLength(14);
    const tsuuiisou = screen.getByText('字一色（ツーイーソー）').closest('li')!;
    expect(within(tsuuiisou).getByLabelText('参考手牌')).toBeInTheDocument();
    const daisharin = screen.getByText('大車輪（ダイシャリン）').closest('li')!;
    expect(within(daisharin).getByLabelText('参考手牌')).toBeInTheDocument();
    // 状況役・和了形を持たないレア＝参考手牌なし
    const riichi = screen.getByText('リーチ').closest('li')!;
    expect(within(riichi).queryByLabelText('参考手牌')).toBeNull();
    const nagashi = screen.getByText('流し満貫（ナガシマンガン）').closest('li')!;
    expect(within(nagashi).queryByLabelText('参考手牌')).toBeNull();
  });

  it('リーチ系は参考手牌の代わりにリーチ棒を出す', () => {
    render(<YakuList />);
    // リーチ・ダブルリーチ・一発はリーチ棒（千点棒）
    for (const name of ['リーチ', 'ダブルリーチ', '一発（イッパツ）']) {
      const row = screen.getByText(name).closest('li')!;
      expect(within(row).getByRole('img', { name: 'リーチ（千点棒）' })).toBeInTheDocument();
    }
    // 一発はリーチ棒の横に「一発」バッジ（アプリの表記に合わせる）
    const ippatsu = screen.getByText('一発（イッパツ）').closest('li')!;
    expect(within(ippatsu).getByText('一発')).toBeInTheDocument(); // 見出しは「一発（イッパツ）」、バッジは「一発」
    // ダブルリーチはリーチ棒の横に「第一打」バッジ（盤面のリーチ脇表記の鏡写し。feature-8）
    const doubleRiichi = screen.getByText('ダブルリーチ').closest('li')!;
    expect(within(doubleRiichi).getByText('第一打')).toBeInTheDocument();
    // 素のリーチにはバッジなし
    const riichiRow = screen.getByText('リーチ').closest('li')!;
    expect(within(riichiRow).queryByText('第一打')).toBeNull();
    expect(within(riichiRow).queryByText('一発')).toBeNull();
    // 同じ状況役でもリーチ以外（海底摸月）は手牌もリーチ棒も出さない
    const haitei = screen.getByText('海底摸月（ハイテイ）').closest('li')!;
    expect(within(haitei).queryByRole('img')).toBeNull();
  });

  it('翻の表示：門前のみ役は注記、喰い下がりは併記、レア役は扱いラベル', () => {
    render(<YakuList />);
    const riichi = screen.getByText('リーチ').closest('li')!;
    expect(within(riichi).getByText('1翻（門前のみ）')).toBeInTheDocument();
    const sanshoku = screen.getByText('三色同順（サンショクドウジュン）').closest('li')!;
    expect(within(sanshoku).getByText('2翻 / 喰い下がり1翻')).toBeInTheDocument();
    const nagashi = screen.getByText('流し満貫（ナガシマンガン）').closest('li')!;
    expect(within(nagashi).getByText('満貫扱い')).toBeInTheDocument();
  });
});
