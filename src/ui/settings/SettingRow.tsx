import type { ReactNode } from 'react';

interface SettingRowProps {
  title: string;
  description?: string;
  /** 右側のコントロール（トグル・セレクト等）。 */
  control: ReactNode;
  /** 未実装で操作できない項目（控えめ表示＋「機能追加予定」バッジ）。値は保存される。 */
  soon?: boolean;
}

/**
 * 設定の1行：左に項目名＋説明、右にコントロール。未実装項目（soon）は控えめにし、
 * 「機能追加予定」を添える（編集はできないが現在値は保存・復元される＝feature-2 の方針）。
 */
export function SettingRow({ title, description, control, soon }: SettingRowProps) {
  return (
    <div className={`setting-row${soon ? ' setting-row--soon' : ''}`}>
      <div className="setting-row__text">
        <div className="setting-row__title">
          {title}
          {soon && <span className="setting-row__soon-badge">機能追加予定</span>}
        </div>
        {description && <p className="setting-row__desc">{description}</p>}
      </div>
      <div className="setting-row__control">{control}</div>
    </div>
  );
}
