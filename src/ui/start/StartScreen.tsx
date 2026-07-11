import { useState, type CSSProperties } from 'react';
import type { Character, StudyMode } from '../../types/index.ts';
import { expressionFor } from '../../session/index.ts';
import { themeColorOf } from '../character/themeColor.ts';
import { BackButton } from '../common/BackButton.tsx';
import { CharacterDecor } from '../character/decor/CharacterDecor.tsx';
import { RitualHoverMark } from '../character/RitualHoverMark.tsx';
import { standeeUrl } from '../character/avatarAssets.ts';
import './StartScreen.css';

interface StartScreenProps {
  character: Character;
  /** 練習開始でモードを選んだ → メイン画面へ */
  onStart: (mode: StudyMode) => void;
  onCharacter: () => void;
  onRuleSettings: () => void;
  onAppSettings: () => void;
}

/**
 * スタート画面（screens.md §2）。選択中キャラの立ち絵で「いま誰と学ぶか」を見せ、
 * 右にタイトル＋メニューを並べる。練習開始はその場でモード選択（役/点数）にインライン展開する。
 */
export function StartScreen({
  character,
  onStart,
  onCharacter,
  onRuleSettings,
  onAppSettings,
}: StartScreenProps) {
  // 練習開始を押したらメニューをモード選択に差し替える（別画面に飛ばさない）。
  const [picking, setPicking] = useState(false);

  // 立ち絵のベース表情＝あいさつ（greeting）の表情（まおは既定の neutral）。
  const baselineExpr = expressionFor(character, 'greeting');
  const baselineSrc = character.expressions.find(
    (e) => e.expression === baselineExpr,
  )?.srcs[0];
  const standee = standeeUrl(character.id, baselineSrc, character.avatar);

  // テーマ色＝背景グロー、差し色＝タイトルのグラデ（キャラの個性を「Mahjo」に映す）。
  const screenStyle = {
    '--char-glow': themeColorOf(character),
    ...(character.accentColor ? { '--char-accent': character.accentColor } : {}),
  } as CSSProperties;

  // メニュー項目：ホバーで法具モチーフ（まお＝御札）が左端に乗る（RitualHoverMark）。
  const item = (label: string, onClick: () => void) => (
    <button type="button" className="start__item" onClick={onClick}>
      {label}
      <RitualHoverMark ritual={character.motif?.ritual} />
    </button>
  );

  return (
    <div className="start" style={screenStyle}>
      <CharacterDecor character={character} />
      <div className="start__body">
        <div className="start__figure">
          {standee ? (
            <img
              className="start__standee"
              src={standee}
              alt={character.displayName}
            />
          ) : (
            <div className="start__standee-ph" aria-hidden="true">
              立ち絵
            </div>
          )}
        </div>

        <div className="start__panel">
          <h1 className="start__title">Mahjo</h1>

          <nav className="start__menu" aria-label="メニュー">
            {!picking ? (
              <>
                {item('練習開始', () => setPicking(true))}
                {item('キャラクター選択', onCharacter)}
                {item('ルール設定', onRuleSettings)}
                {item('アプリ設定', onAppSettings)}
              </>
            ) : (
              <>
                {item('役モード', () => onStart('yaku'))}
                {item('点数モード', () => onStart('score'))}
              </>
            )}
          </nav>
        </div>
      </div>

      {picking && <BackButton onClick={() => setPicking(false)} />}
    </div>
  );
}
