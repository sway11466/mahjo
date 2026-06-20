interface ToggleSwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  /** スクリーンリーダー向けラベル（行のタイトルを渡す）。 */
  label: string;
}

/**
 * オン/オフのトグルスイッチ（設定の boolean 項目）。素のチェックボックスに見た目を被せる。
 * 幾何・構造は TSX、装飾は settings.css（architecture.md §5）。
 */
export function ToggleSwitch({ checked, onChange, disabled, label }: ToggleSwitchProps) {
  return (
    <label className="toggle" aria-disabled={disabled || undefined}>
      <input
        type="checkbox"
        className="toggle__input"
        role="switch"
        aria-label={label}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="toggle__track" aria-hidden="true">
        <span className="toggle__thumb" />
      </span>
    </label>
  );
}
