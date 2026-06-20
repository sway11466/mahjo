import type { ReactNode, CSSProperties } from 'react';
import type { Character } from '../../types/index.ts';
import { themeColorOf, expressionFor } from '../../characters/index.ts';
import { standeeUrl } from '../character/avatarAssets.ts';
import { BackButton } from '../common/BackButton.tsx';
import './settings.css';

interface SettingsLayoutProps {
  title: string;
  /** 左に立ち続ける選択中キャラ（背骨＝キャラ駆動）。 */
  character: Character;
  onBack: () => void;
  children: ReactNode;
}

/**
 * 設定画面の2カラム土台（ルール設定／アプリ設定で共有）。左にキャラの立ち絵（固定）、
 * 右にタイトル（中央）＋設定一覧。スクロールは右の一覧だけ（外周は overflow:hidden で二重バーを防ぐ）。
 * 立ち絵の解決は StartScreen と同じ（あいさつ表情→全身→アバターのフォールバック）。
 */
export function SettingsLayout({ title, character, onBack, children }: SettingsLayoutProps) {
  const baselineExpr = expressionFor(character, 'greeting');
  const baselineSrc = character.expressions.find(
    (e) => e.expression === baselineExpr,
  )?.srcs[0];
  const standee = standeeUrl(character.id, baselineSrc, character.avatar);

  const style = { '--char-glow': themeColorOf(character) } as CSSProperties;

  return (
    <div className="settings-screen" style={style}>
      <div className="settings-screen__figure">
        {standee ? (
          <img
            className="settings-screen__standee"
            src={standee}
            alt={character.displayName}
          />
        ) : (
          <div className="settings-screen__standee-ph" aria-hidden="true">
            立ち絵
          </div>
        )}
      </div>

      <div className="settings-screen__panel">
        <h1 className="settings-screen__title">{title}</h1>
        <div className="settings-screen__scroll">{children}</div>
      </div>

      <BackButton onClick={onBack} />
    </div>
  );
}
