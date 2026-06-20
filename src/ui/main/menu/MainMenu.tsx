import { useEffect, useRef, useState } from 'react';
import './MainMenu.css';

/** メニュー1項目（ラベル＋操作）。 */
export interface MainMenuItem {
  label: string;
  onClick: () => void;
  /** この項目の前に区切り線を入れる（参照系とナビゲーションの区切り等）。 */
  dividerBefore?: boolean;
}

interface MainMenuProps {
  /** 表示する項目（当面「メニューに戻る」のみ）。 */
  items: MainMenuItem[];
}

/**
 * 画面左上のハンバーガーメニュー。クリックで項目リストを開閉し、外側クリック／Escape で閉じる。
 * 項目は呼び出し側が渡す（ここは開閉と描画だけ・構造は TSX／装飾は CSS：architecture.md §5）。
 */
export function MainMenu({ items }: MainMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // 開いている間だけ、外側クリック・Escape で閉じる配線を張る。
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="main-menu" ref={ref}>
      <button
        type="button"
        className="main-menu__button"
        aria-label="メニュー"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {/* ハンバーガー（3本線）。幾何は TSX・色は CSS（architecture.md §5） */}
        <svg className="main-menu__icon" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="5" width="18" height="2" rx="1" />
          <rect x="3" y="11" width="18" height="2" rx="1" />
          <rect x="3" y="17" width="18" height="2" rx="1" />
        </svg>
      </button>
      {open && (
        <ul className="main-menu__list" role="menu">
          {items.map((item, i) => (
            <li key={i} role="none">
              {item.dividerBefore && (
                <hr className="main-menu__divider" role="separator" />
              )}
              <button
                type="button"
                role="menuitem"
                className="main-menu__item"
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
