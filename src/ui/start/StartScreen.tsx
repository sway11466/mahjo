import { useState } from 'react';
import type { Character, StudyMode } from '../../types/index.ts';
import { BackButton } from '../common/BackButton.tsx';
import { CharacterScreenFrame } from '../character/CharacterScreenFrame.tsx';
import { RitualHoverMark } from '../character/RitualHoverMark.tsx';
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
 * 立ち絵・装飾・グロー・2カラム土台は CharacterScreenFrame が持つ（設定画面と共通）。
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

  // メニュー項目：ホバーで法具モチーフ（まお＝御札）が左端に乗る（RitualHoverMark）。
  const item = (label: string, onClick: () => void) => (
    <button type="button" className="start__item" onClick={onClick}>
      {label}
      <RitualHoverMark ritual={character.motif?.ritual} />
    </button>
  );

  return (
    <CharacterScreenFrame
      character={character}
      align="center"
      mode="grow"
      back={picking ? <BackButton onClick={() => setPicking(false)} /> : undefined}
    >
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
    </CharacterScreenFrame>
  );
}
