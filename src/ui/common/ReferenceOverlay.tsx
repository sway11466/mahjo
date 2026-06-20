import { useEffect, type ReactNode } from 'react';
import { useMediaQuery } from './useMediaQuery.ts';
import './ReferenceOverlay.css';

interface ReferenceOverlayProps {
  /** ヘッダのタイトル（＝dialog のラベル）。 */
  title: string;
  onClose: () => void;
  children: ReactNode;
}

// この幅以下を「モバイル相当」とみなし全画面シート、それ以外は中央モーダルで出す。
const MOBILE_QUERY = '(max-width: 640px)';

/**
 * 参照系オーバーレイの共通の器（役一覧・符の数え方・点数表などで再利用）。
 * PC＝中央モーダル（バックドロップ＋×）／モバイル＝全画面シート（戻る矢印）。
 * MainScreen の中に重ねて出すのでクイズ進行は保持される（ルーター遷移しない）。
 * Escape／バックドロップ／戻る・×で閉じる。中身（children）は端末非依存。
 */
export function ReferenceOverlay({ title, onClose, children }: ReferenceOverlayProps) {
  const isMobile = useMediaQuery(MOBILE_QUERY);

  // Escape で閉じる＋開いている間は背後のスクロールを止める。
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      className={`ref-overlay ref-overlay--${isMobile ? 'sheet' : 'modal'}`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* PC はバックドロップのクリックで閉じる。モバイルは全画面なので置かない。 */}
      {!isMobile && (
        <div className="ref-overlay__backdrop" onClick={onClose} aria-hidden="true" />
      )}
      <div className="ref-overlay__panel">
        <header className="ref-overlay__header">
          {isMobile && (
            <button
              type="button"
              className="ref-overlay__back"
              aria-label="戻る"
              onClick={onClose}
            >
              ←
            </button>
          )}
          <h2 className="ref-overlay__title">{title}</h2>
          {!isMobile && (
            <button
              type="button"
              className="ref-overlay__close"
              aria-label="閉じる"
              onClick={onClose}
            >
              ×
            </button>
          )}
        </header>
        <div className="ref-overlay__body">{children}</div>
      </div>
    </div>
  );
}
