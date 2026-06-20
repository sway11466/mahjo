import type { HintStep, HintRenderer } from '../types/index.ts';

/**
 * 第2層 HintRenderer（キャラ依存はここだけ）。第1層の骨組み HintStepPlan[] に、現在キャラの
 * script（`HintScript`＝キー→段ごとの文言）から手書きセリフを差し込み、表示用 HintStep[] を作る。
 * 文言は生成せず引くだけ。script は引数で注入されるため hints 層は characters に依存しない
 * （依存性注入。architecture.md §2・hints.md §4）。
 *
 * script は hint-base の全キーを網羅する前提（突き合わせはテストで担保）。万一キー/段が欠けた
 * 場合はその段を飛ばす（UI を壊さないための防御。正は別途バリデーション）。
 */
export const hintRenderer: HintRenderer = (plan, script): HintStep[] => {
  const steps: HintStep[] = [];
  for (const p of plan) {
    const text = script[p.key]?.[p.level];
    if (text === undefined) continue; // script 未整備のキー/段は飛ばす
    steps.push({ text, level: p.level });
  }
  return steps;
};
