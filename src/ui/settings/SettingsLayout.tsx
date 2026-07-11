import type { ReactNode } from 'react';
import type { Character } from '../../types/index.ts';
import { CharacterScreenFrame } from '../character/CharacterScreenFrame.tsx';
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
 * 設定画面の土台（ルール設定／アプリ設定／キャラクター選択で共有）。画面のジオメトリ・立ち絵・
 * 装飾・グローは CharacterScreenFrame（メニュー画面と共通）に委ね、ここは設定固有の中身＝
 * タイトル（中央・固定）＋一覧（ここだけスクロール）を右カラムに載せるだけ。
 * mode='scroll'＝外周は固定高、一覧だけ内部スクロール。立ち絵はメニュー画面と同じ中央寄せ。
 */
export function SettingsLayout({ title, character, onBack, children }: SettingsLayoutProps) {
  return (
    <CharacterScreenFrame
      character={character}
      align="center"
      mode="scroll"
      back={<BackButton onClick={onBack} />}
    >
      <h1 className="settings-screen__title">{title}</h1>
      <div className="settings-screen__scroll">{children}</div>
    </CharacterScreenFrame>
  );
}
