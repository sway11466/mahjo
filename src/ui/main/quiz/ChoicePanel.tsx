import type { ReactNode } from 'react';
import type { QuizChoice } from '../../../types/index.ts';
import './ChoicePanel.css';

interface ChoicePanelProps {
  /** 選択肢（正解1＋誤答3） */
  choices: QuizChoice[];
  /** 選んだ選択肢の index（未回答=null） */
  selectedIndex: number | null;
  /** 回答後（正誤を開示する） */
  revealed: boolean;
  /** 選択時のコールバック */
  onSelect: (index: number) => void;
  /** 自分の選択に重ねるキャラ固有マーク（皮。中立データには無関係）。無ければ ○/✗ のみ */
  selectionMark?: ReactNode;
}

// ○/✗ は筆書き風＝先細りの「塗り」パスで描く（細い線より印象を強く）。色は文字色を継承。

/** ○（正解）。太さが一周で変化する塗りのリング（筆で書いた丸の感じ）。 */
function MaruIcon() {
  return (
    <svg viewBox="0 0 100 100" className="choices__mark-svg" aria-hidden="true">
      {/* 外円と、中心をずらした内円（穴）を evenodd でくり抜く＝線幅が偏って筆っぽくなる */}
      <path
        className="choices__brush"
        fillRule="evenodd"
        d="M50 9 a41 41 0 1 0 0 82 a41 41 0 1 0 0 -82 Z
           M54 26 a28 28 0 1 0 0 56 a28 28 0 1 0 0 -56 Z"
      />
    </svg>
  );
}

/** ✗（誤答）。先細りの2本の筆ストローク（中央が太く端が尖る塗りパス）。 */
function BatsuIcon() {
  return (
    <svg viewBox="0 0 100 100" className="choices__mark-svg" aria-hidden="true">
      <path className="choices__brush" d="M22 20 L44 58 L80 82 L58 44 Z" />
      <path className="choices__brush" d="M80 18 L43 43 L20 82 L57 57 Z" />
    </svg>
  );
}

/**
 * 回答の4択バー。手牌と会話パネルの間に置く（screens.md §3）。
 * 回答後は正解を緑＋○、選んだ誤答を赤＋✗で示し、ボタンを無効化する
 * （正誤は4択の中で示し、別行を増やさない＝手牌の位置を動かさない）。
 */
export function ChoicePanel({
  choices,
  selectedIndex,
  revealed,
  onSelect,
  selectionMark,
}: ChoicePanelProps) {
  // 選択済み（保留中 or 回答後）は操作不可。回答後は正誤を開示。
  const locked = revealed || selectedIndex !== null;
  return (
    <div className="choices" role="group" aria-label="回答の選択肢">
      {choices.map((c, i) => {
        const isSelected = i === selectedIndex;
        const isCorrect = revealed && c.correct;
        const isWrongPick = revealed && isSelected && !c.correct;
        const classes = ['choices__btn'];
        if (isCorrect) classes.push('choices__btn--correct');
        if (isWrongPick) classes.push('choices__btn--wrong');
        const ariaLabel = isCorrect
          ? `${c.value}（正解）`
          : isWrongPick
            ? `${c.value}（あなたの回答・不正解）`
            : undefined;
        return (
          <button
            type="button"
            className={classes.join(' ')}
            key={i}
            disabled={locked}
            aria-pressed={isSelected}
            aria-label={ariaLabel}
            onClick={() => onSelect(i)}
          >
            {(isCorrect || isWrongPick) && (
              <span className="choices__mark">
                {isCorrect ? <MaruIcon /> : <BatsuIcon />}
              </span>
            )}
            {/* 御札（法具モチーフ）：回答前はホバーで乗り、選択で同じ位置に固定される
                （ユーザーには「ホバーで乗る→回答で固定」と見える）。位置は hover/選択で共通。 */}
            {selectionMark && (isSelected || !locked) && (
              <span
                className={
                  isSelected
                    ? 'choices__select-mark choices__select-mark--fixed'
                    : 'choices__select-mark choices__select-mark--hover'
                }
                aria-hidden="true"
              >
                {selectionMark}
              </span>
            )}
            <span className="choices__value">{c.value}</span>
          </button>
        );
      })}
    </div>
  );
}
