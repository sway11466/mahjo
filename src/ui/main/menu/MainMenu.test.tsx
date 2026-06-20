import { render, screen, fireEvent } from '@testing-library/react';
import { MainMenu } from './MainMenu.tsx';

describe('MainMenu', () => {
  it('項目はボタンを開くまで隠れている', () => {
    render(<MainMenu items={[{ label: 'メニューに戻る', onClick: () => {} }]} />);
    expect(screen.getByRole('button', { name: 'メニュー' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.queryByRole('menuitem', { name: 'メニューに戻る' })).toBeNull();
  });

  it('ハンバーガーを押すと項目が開き、選ぶとハンドラが呼ばれる', () => {
    const onClick = vi.fn();
    render(<MainMenu items={[{ label: 'メニューに戻る', onClick }]} />);
    fireEvent.click(screen.getByRole('button', { name: 'メニュー' }));
    const item = screen.getByRole('menuitem', { name: 'メニューに戻る' });
    fireEvent.click(item);
    expect(onClick).toHaveBeenCalledTimes(1);
    // 選択後は閉じる
    expect(screen.queryByRole('menuitem', { name: 'メニューに戻る' })).toBeNull();
  });

  it('Escape で閉じる', () => {
    render(<MainMenu items={[{ label: 'メニューに戻る', onClick: () => {} }]} />);
    fireEvent.click(screen.getByRole('button', { name: 'メニュー' }));
    expect(screen.getByRole('menuitem', { name: 'メニューに戻る' })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menuitem', { name: 'メニューに戻る' })).toBeNull();
  });

  it('dividerBefore の項目の前に区切り線を出す', () => {
    render(
      <MainMenu
        items={[
          { label: '点数表', onClick: () => {} },
          { label: 'メニューに戻る', onClick: () => {}, dividerBefore: true },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'メニュー' }));
    expect(screen.getAllByRole('separator')).toHaveLength(1);
  });
});
