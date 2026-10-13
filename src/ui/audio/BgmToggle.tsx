import './BgmToggle.css';

interface BgmToggleProps {
  /** BGM がオンか（保存しない UI 状態。App が持つ＝sound.md「設定」）。 */
  on: boolean;
  onToggle: () => void;
}

/**
 * 画面右上の音符ボタン（全画面に常駐。screens.md §1）。押すと BGM が鳴り、もう一度押すと止まる。
 * 押した操作がそのまま autoplay の解禁を兼ねる（鳴り始めるきっかけはこのボタンか設定トグルだけ）。
 * オフは斜線入りの音符。幾何は TSX・色は CSS（architecture.md §5）。
 */
export function BgmToggle({ on, onToggle }: BgmToggleProps) {
  return (
    <button
      type="button"
      className={`bgm-toggle${on ? ' bgm-toggle--on' : ''}`}
      aria-label="音楽"
      aria-pressed={on}
      onClick={onToggle}
    >
      <svg className="bgm-toggle__icon" viewBox="0 0 24 24" aria-hidden="true">
        {/* 連桁の8分音符2つ（♫） */}
        <path d="M9 17.5V6.2l10-2.2v11.3" className="bgm-toggle__stem" />
        <path d="M9 6.2l10-2.2v2.6L9 8.8z" />
        <ellipse cx="6.6" cy="17.6" rx="2.6" ry="2" />
        <ellipse cx="16.6" cy="15.4" rx="2.6" ry="2" />
        {!on && <line x1="3.5" y1="3.5" x2="20.5" y2="20.5" className="bgm-toggle__slash" />}
      </svg>
    </button>
  );
}
