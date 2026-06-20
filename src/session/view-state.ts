import type {
  Character,
  Expression,
  HintStep,
  HighlightTarget,
  MistakeKind,
  ReactionTrigger,
  ScoreItem,
} from '../types/index.ts';
import { expressionFor } from '../characters/index.ts';
import { hintProvider, hintRenderer } from '../hints/index.ts';
import { pick, type Rng } from '../engine/rng.ts';
import type { QuizSession, SessionViewState } from './types.ts';

// session が組み立てる view-state のうち「キャラ」部（抽象キャラ＝id＋expression＋line）。
// 表情→画像の解決は ui。場面→表情は characters（reactions＋既定マップ）、セリフは persona から rng で選ぶ。
// 仕様：[session.md](../../docs/spec/session.md) §4。

/** SessionViewState.character と同じ形（1ターン分のキャラ提示）。 */
export interface CharacterView {
  id: string;
  expression: Expression;
  line: string;
  /** 表情差分プール（ExpressionAsset.srcs）からどの1枚を使うかの種（[0,1)）。
   *  1ターンに1回引く（飽き対策。character-guide §4）。実 src への解決は ui（表情→画像は ui の責務）。 */
  variantSeed: number;
}

/**
 * 現在のセッション状態 → 場面（ReactionTrigger）。
 * greeting＝開始のあいさつ（status 駆動・「はじめる」前）、finished＝全クイズ終了。
 * playing 中は、未回答＝dealing（出題中）、回答後＝correct/wrong。（session.md §4）
 */
export function sceneOf(session: QuizSession): ReactionTrigger {
  if (session.status === 'greeting') return 'greeting';
  if (session.status === 'finished') return 'finished';
  const answered = session.answers.length > session.index;
  if (!answered) return 'dealing';
  return session.answers[session.index]!.correct ? 'correct' : 'wrong';
}

/** ReactionTrigger → そのキャラのセリフプール。場面プールを持たない場面（hinting/explaining）は空
 *  （explaining の文言は §3 Character.explain が出す＝buildExplainSteps。ここは場面セリフのみ）。 */
function poolFor(character: Character, trigger: ReactionTrigger): string[] {
  switch (trigger) {
    case 'greeting':
      return character.persona.greeting;
    case 'dealing':
      return character.persona.dealing;
    case 'correct':
      return character.persona.correct;
    case 'wrong':
      return character.persona.wrong;
    case 'finished':
      return character.persona.finished;
    default:
      return []; // hinting/explaining は Persona 未対応（session.md §4）
  }
}

/**
 * 現在のターンのキャラ提示（expression＋line）を組み立てる。1ターンに1回だけ呼ぶ
 * （rng を1回引く＝再レンダーでブレないよう、呼び出し側は遷移時に呼んで結果を保持する）。
 */
export function buildCharacterView(
  session: QuizSession,
  character: Character,
  rng: Rng,
): CharacterView {
  const trigger = sceneOf(session);
  const expression = expressionFor(character, trigger);
  let line: string;
  if (trigger === 'wrong') {
    // 誤答は「寄り添い（wrong プール・rng）＋ 具体の諭し（mistakeKind）」を結合（screens.md §3）。
    // 種類が取れないときは寄り添いだけ（諭しは空でスキップ）。
    const warm = pickFrom(rng, character.persona.wrong);
    const kind = selectedMistakeKind(session);
    const nudge = kind ? character.mistakes[kind] : '';
    line = [warm, nudge].filter(Boolean).join(' ');
  } else {
    line = pickFrom(rng, poolFor(character, trigger));
  }
  // 表情差分プールから使う1枚を選ぶ種。ここで1回だけ引き、再レンダーでブレないよう charView に保持する。
  const variantSeed = rng();
  return { id: character.id, expression, line, variantSeed };
}

/** プールから1つ選ぶ（空なら空文字）。 */
function pickFrom(rng: Rng, pool: string[]): string {
  return pool.length ? pick(rng, pool) : '';
}

/** 現在の局が誤答のとき、選んだ誤答の mistakeKind（無ければ undefined）。 */
function selectedMistakeKind(session: QuizSession): MistakeKind | undefined {
  const answered = session.answers.length > session.index;
  if (!answered) return undefined;
  const ans = session.answers[session.index]!;
  if (ans.correct) return undefined;
  return session.question.choices?.[ans.selectedIndex]?.mistakeKind;
}

/**
 * 現在の局のヒント段（表示用 HintStep[]・全段）を組み立てる。第1層 hintProvider が
 * 採点結果（result.items）から骨組みを作り、第2層 hintRenderer が現在キャラの script で
 * 文言を差し込む（hints.md §4）。未整備キーの段は renderer がスキップ＝空配列もありうる。
 * UI は「ボタンで1段ずつ開く」開示数だけ別に持つ（純粋な全段リストはここで決まる）。
 */
export function buildHintSteps(
  session: QuizSession,
  character: Character,
): HintStep[] {
  const plan = hintProvider(
    session.hand,
    session.table,
    session.winContext,
    session.result,
    session.mode,
  );
  // 未整備キーの段は renderer がスキップ。具体ヒントが無ければ空＝ボタンを出さない（仕様）。
  // キャラのヒント文言は Character.script（character-<id>-script.md §2 由来）。
  return hintRenderer(plan, character.script);
}

/** 解説ウォークスルーの1ステップ（成立役/ドラ/符 1つぶん）。 */
export interface ExplainStep {
  label: string; // 役名・ドラ名・符の発生源（ScoreItem.label）
  value: number; // 翻（yaku/dora）または符（fu）。単位は category で決まる
  category: ScoreItem['category']; // 'yaku' | 'fu' | 'dora'（UI が値の単位＝翻/符を出し分ける）
  text: string; // キャラの解説文（Character.explain）
  highlightTargets: HighlightTarget[]; // このステップで光らせる対象
}

/**
 * 解説シーンのウォークスルー（全ステップ）を組み立てる。採点結果の各 item を
 * 「キャラの解説文＋その item の highlightTargets」に変換する（screens.md §3）。
 * 役モードは成立役（＋ドラ）まで、点数モードはそれに符も加える（screens.md §3・§53）。
 * キャラ解説が未整備（役満・レア等）の item はスキップ。順序は result.items のまま。
 * 何ステップ目まで進めたかは UI が持つ（ここは純粋な全ステップリスト）。
 */
export function buildExplainSteps(
  session: QuizSession,
  character: Character,
): ExplainStep[] {
  const steps: ExplainStep[] = [];
  for (const item of session.result.items) {
    if (session.mode === 'yaku' && item.category === 'fu') continue; // 役モードは符を出さない
    const text = character.explain[item.explainKey];
    if (text === undefined) continue; // 未整備キーはスキップ
    steps.push({
      label: item.label,
      value: item.value,
      category: item.category,
      text,
      highlightTargets: item.highlightTargets,
    });
  }
  return steps;
}

/** ui が保持する揮発的な進行状態（buildViewState の入力）。session の状態機械には載らない
 *  表示の進み具合：ヒントを何段開いたか／解説ウォークスルーの位置／答え合わせ前の保留選択。 */
export interface ViewUiState {
  hintOpenCount: number; // ヒントを何段開いたか（0=未開示）
  explainIndex: number | null; // 解説ウォークスルーの現在ステップ（null=未開始＝正誤段）
  pendingIndex: number | null; // 選択直後〜答え合わせまでの保留選択（null=未選択）
}

/**
 * 1ターンの SessionViewState（ui が描く提示モデル）を組み立てる。session の状態＋現在キャラ＋
 * 1ターンのキャラ提示（charView。rng は遷移時に1回引いて ui が保持）＋ui の揮発進行状態から、
 * 「何を見せるか」をすべて決める純関数（architecture.md §2・session.md §4）。
 * 表情→画像・操作（onClick）・CSS など「どう見せるか」は ui に残る（純データに焼かない）。
 *
 * 提示の優先（MainScreen の最終合成をそのまま移設）：
 *  - line：解説ステップ ＞ 開いているヒント段 ＞ 場面セリフ（charView.line）。
 *  - expression：解説中（explaining）＞ ヒント中（hintingNow）＞ 場面表情（charView.expression）。
 *    line は解説ステップの有無で、expression は explaining フラグで切る（解説 index が範囲外でも
 *    表情は explaining のまま・文言は場面に戻る、という現挙動の非対称をそのまま保つ）。
 *  - highlights：解説ステップ中だけ点灯（それ以外は無し）。
 */
export function buildViewState(
  session: QuizSession,
  character: Character,
  charView: CharacterView,
  ui: ViewUiState,
): SessionViewState {
  const answered = session.answers.length > session.index;
  const current = answered ? session.answers[session.index]! : null;
  const finished = session.status === 'finished';

  const allHintSteps = buildHintSteps(session, character);
  const hintingNow = !answered && !finished && ui.hintOpenCount > 0;

  const explainSteps = buildExplainSteps(session, character);
  const explaining = answered && ui.explainIndex !== null;
  const explainStep = explaining ? (explainSteps[ui.explainIndex!] ?? null) : null;

  const expression = explaining
    ? expressionFor(character, 'explaining')
    : hintingNow
      ? expressionFor(character, 'hinting')
      : charView.expression;
  const line = explainStep
    ? explainStep.text
    : hintingNow
      ? allHintSteps[ui.hintOpenCount - 1]!.text
      : charView.line;

  return {
    hand: session.hand,
    table: session.table,
    winContext: session.winContext,
    highlights: explainStep?.highlightTargets ?? [],
    choices: session.question.choices,
    selectedIndex: answered ? current!.selectedIndex : ui.pendingIndex,
    revealed: answered,
    character: { id: charView.id, expression, line, variantSeed: charView.variantSeed },
    hintSteps: allHintSteps.slice(0, ui.hintOpenCount), // 開いた段だけ（型 §17 の意味に合わせる）
    result: answered ? session.result : null,
    roundIndex: session.index,
    correctCount: session.correctCount,
    status: session.status,
  };
}
