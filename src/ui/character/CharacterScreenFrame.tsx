import type { ReactNode, CSSProperties } from 'react';
import type { Character } from '../../types/index.ts';
import { expressionFor } from '../../session/index.ts';
import { themeColorOf } from './themeColor.ts';
import { standeeUrl } from './avatarAssets.ts';
import { CharacterDecor } from './decor/CharacterDecor.tsx';
import './CharacterScreenFrame.css';

interface CharacterScreenFrameProps {
  /** 左に立ち続ける選択中キャラ（背骨＝キャラ駆動）。立ち絵・テーマ色・装飾の出所。 */
  character: Character;
  /** 立ち絵カラム内の水平寄せ。'center'＝中央（メニュー）／'end'＝設定側へ寄せる。 */
  align?: 'center' | 'end';
  /** 本文の縦挙動。'grow'＝全体が伸びる（メニュー・横持ちでページごとスクロール）／
   *  'scroll'＝100dvh 固定で右カラム内だけスクロール（設定）。 */
  mode?: 'grow' | 'scroll';
  /** 右下に固定する戻るボタン等（出さないなら渡さない）。 */
  back?: ReactNode;
  /** 右カラム（.cscreen__panel）に足す画面固有クラス（例 縦積み時の幅制約）。 */
  panelClassName?: string;
  /** 右カラムの中身（タイトル＋メニュー／タイトル＋設定一覧）。 */
  children: ReactNode;
}

/**
 * キャラの立ち絵を左に据える画面の共通土台（メニュー画面・設定画面系で共有）。
 * 立ち絵の解決（あいさつ表情→全身→アバターのフォールバック）・外周グロー・背景装飾・
 * 2カラムのジオメトリ（カラム幅・padding・縦・レスポンシブ）を1箇所に集約し、
 * どの画面でも立ち絵が同じ位置に立つことを構造的に保証する（architecture.md §5・§2）。
 * 画面ごとに変わるのは右カラムの中身と align/mode/back だけ。
 */
export function CharacterScreenFrame({
  character,
  align = 'center',
  mode = 'grow',
  back,
  panelClassName,
  children,
}: CharacterScreenFrameProps) {
  // 立ち絵のベース表情＝あいさつ（greeting）の表情（まおは既定の neutral）。
  const baselineExpr = expressionFor(character, 'greeting');
  const baselineSrc = character.expressions.find(
    (e) => e.expression === baselineExpr,
  )?.srcs[0];
  const standee = standeeUrl(character.id, baselineSrc, character.avatar);

  // テーマ色＝背景グロー、差し色＝装飾（星・固有モチーフ）の色。キャラの個性を画面に映す。
  const style = {
    '--char-glow': themeColorOf(character),
    ...(character.accentColor ? { '--char-accent': character.accentColor } : {}),
  } as CSSProperties;

  return (
    <div className={`cscreen cscreen--${mode}`} style={style}>
      <CharacterDecor character={character} />
      <div className="cscreen__body">
        <div className={`cscreen__figure cscreen__figure--${align}`}>
          {standee ? (
            <img
              className="cscreen__standee"
              src={standee}
              alt={character.displayName}
            />
          ) : (
            <div className="cscreen__standee-ph" aria-hidden="true">
              立ち絵
            </div>
          )}
        </div>
        <div className={'cscreen__panel' + (panelClassName ? ' ' + panelClassName : '')}>
          {children}
        </div>
      </div>
      {back}
    </div>
  );
}
