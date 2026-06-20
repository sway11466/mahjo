import './BackButton.css';

interface BackButtonProps {
  onClick: () => void;
  /** 既定は「← もどる」。 */
  label?: string;
}

/**
 * 画面右下に固定する共通の戻るボタン（スタート・キャラクター選択・設定で統一）。
 * メイン画面（クイズ）は会話窓に操作を集約するため、これは使わず別扱い。
 */
export function BackButton({ onClick, label = '← もどる' }: BackButtonProps) {
  return (
    <button type="button" className="back-btn" onClick={onClick}>
      {label}
    </button>
  );
}
