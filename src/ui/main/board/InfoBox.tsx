import type { ReactNode } from 'react';
import './InfoBox.css';

interface InfoBoxProps {
  /** 見出し（場風・自風・ドラ など）。省略すると値だけの枠チップ */
  label?: string;
  /** 値（文字・牌SVG など） */
  children: ReactNode;
  className?: string;
}

/** 枠で括った情報チップ。会話窓のように局・自風・ドラなどを囲う。 */
export function InfoBox({ label, children, className }: InfoBoxProps) {
  return (
    <div className={className ? `info-box ${className}` : 'info-box'}>
      {label && <span className="info-box__label">{label}</span>}
      <span className="info-box__value">{children}</span>
    </div>
  );
}
