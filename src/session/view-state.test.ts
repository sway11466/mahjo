import {
  sceneOf,
  buildCharacterView,
  buildHintSteps,
  buildExplainSteps,
  buildViewState,
  type CharacterView,
  type ViewUiState,
} from './view-state.ts';
import { mao } from '../characters/index.ts';
import { defaultReactions, expressionFor } from './reaction.ts';
import { mulberry32 } from '../engine/rng.ts';
import { score } from '../engine/score.ts';
import { mk, hand, ctx, tbl, rules } from '../engine/__tests__/hands.ts';
import type { QuizSession, SessionAnswer } from './types.ts';
import type { ScoreResult, QuizQuestion } from '../types/index.ts';

// sceneOf / buildCharacterView は純関数。最小限のダミー session で状態だけ作って検証する
// （hand/table/winContext/question は scene 判定に無関係なので空オブジェクトで足りる）。
function fakeSession(
  partial: Partial<QuizSession> & Pick<QuizSession, 'index' | 'answers' | 'status'>,
): QuizSession {
  return {
    mode: 'yaku',
    hand: {} as QuizSession['hand'],
    table: {} as QuizSession['table'],
    winContext: {} as QuizSession['winContext'],
    question: {} as QuizSession['question'],
    result: emptyResult,
    correctCount: 0,
    ...partial,
  };
}

const emptyResult: ScoreResult = {
  totalHan: 0,
  totalFu: 0,
  scoreText: '',
  payments: { total: 0 },
  rank: 'normal',
  yakuman: false,
  items: [],
  hasYaku: false,
};

const answer = (correct: boolean): SessionAnswer => ({ selectedIndex: 0, correct });

describe('sceneOf', () => {
  it('greeting while the session is in the greeting status (開始前)', () => {
    const s = fakeSession({ index: 0, answers: [], status: 'greeting' });
    expect(sceneOf(s)).toBe('greeting');
  });

  it('dealing while a problem is unanswered (出題中)', () => {
    const s = fakeSession({ index: 0, answers: [], status: 'playing' });
    expect(sceneOf(s)).toBe('dealing');
  });

  it('dealing for a later problem too (2問目以降)', () => {
    const s = fakeSession({ index: 1, answers: [answer(true)], status: 'playing' });
    expect(sceneOf(s)).toBe('dealing');
  });

  it('correct after a correct answer', () => {
    const s = fakeSession({ index: 0, answers: [answer(true)], status: 'playing' });
    expect(sceneOf(s)).toBe('correct');
  });

  it('wrong after a wrong answer', () => {
    const s = fakeSession({ index: 0, answers: [answer(false)], status: 'playing' });
    expect(sceneOf(s)).toBe('wrong');
  });

  it('uses finished for the session-end celebration (session.md §4)', () => {
    const s = fakeSession({ index: 7, answers: [], status: 'finished' });
    expect(sceneOf(s)).toBe('finished');
  });
});

describe('buildCharacterView', () => {
  it('uses the scene expression (default map) and a line from that pool', () => {
    const s = fakeSession({ index: 0, answers: [], status: 'greeting' });
    const v = buildCharacterView(s, mao, mulberry32(1));
    expect(v.id).toBe('mao');
    expect(v.expression).toBe(expressionFor(mao, 'greeting')); // まおは greeting=neutral（既定）
    expect(mao.persona.greeting).toContain(v.line);
  });

  it('picks a wrong-pool line with troubled expression after a wrong answer', () => {
    const s = fakeSession({ index: 0, answers: [answer(false)], status: 'playing' });
    const v = buildCharacterView(s, mao, mulberry32(2));
    expect(v.expression).toBe(defaultReactions.wrong); // troubled
    expect(mao.persona.wrong).toContain(v.line);
  });

  it('combines a warm wrong-pool opener with the mistake-specific nudge', () => {
    const s = fakeSession({
      index: 0,
      answers: [{ selectedIndex: 1, correct: false }],
      status: 'playing',
      question: {
        target: 'han',
        prompt: '',
        choices: [
          { value: '3翻', correct: true, explanation: '' },
          { value: '1翻', correct: false, explanation: '', mistakeKind: 'dora-miss' },
        ],
      },
    });
    const v = buildCharacterView(s, mao, mulberry32(1));
    expect(v.expression).toBe(defaultReactions.wrong);
    // 寄り添い（wrong プールのどれか）で始まり、具体の諭しを含む。
    expect(mao.persona.wrong.some((w) => v.line.startsWith(w))).toBe(true);
    expect(v.line).toContain(mao.mistakes['dora-miss']);
  });

  it('falls back to the wrong pool when the chosen wrong answer has no mistakeKind', () => {
    const s = fakeSession({
      index: 0,
      answers: [{ selectedIndex: 1, correct: false }],
      status: 'playing',
      question: {
        target: 'han',
        prompt: '',
        choices: [
          { value: '3翻', correct: true, explanation: '' },
          { value: '1翻', correct: false, explanation: '' },
        ],
      },
    });
    const v = buildCharacterView(s, mao, mulberry32(2));
    expect(mao.persona.wrong).toContain(v.line);
  });

  it('is deterministic for the same seed (rng injection)', () => {
    const s = fakeSession({ index: 0, answers: [answer(true)], status: 'playing' });
    const a = buildCharacterView(s, mao, mulberry32(42));
    const b = buildCharacterView(s, mao, mulberry32(42));
    expect(a).toEqual(b);
  });

  it('carries a variantSeed in [0,1) for picking an expression-image variant', () => {
    const s = fakeSession({ index: 0, answers: [], status: 'greeting' });
    const v = buildCharacterView(s, mao, mulberry32(7));
    expect(v.variantSeed).toBeGreaterThanOrEqual(0);
    expect(v.variantSeed).toBeLessThan(1);
  });
});

describe('buildHintSteps', () => {
  const resultWithYaku = (yakuId: string): ScoreResult => ({
    ...emptyResult,
    items: [
      {
        id: `yaku-${yakuId}`,
        explainKey: `yaku:${yakuId}`,
        category: 'yaku',
        label: yakuId,
        value: 3,
        description: '',
        highlightTargets: [],
      },
    ],
  });

  it('renders the character script line for the detected yaku key', () => {
    const s = fakeSession({
      index: 0,
      answers: [],
      status: 'playing',
      result: resultWithYaku('honitsu'),
    });
    const steps = buildHintSteps(s, mao);
    expect(steps[0]?.text).toBe(mao.script['yaku:honitsu']![0]);
  });

  it('returns no steps when the character has no script for the key (button hidden)', () => {
    // script を持たないキャラ → renderer がスキップ → 空（ヒントが無ければボタンを出さない）。
    const noScript = { ...mao, script: {} };
    const s = fakeSession({
      index: 0,
      answers: [],
      status: 'playing',
      result: resultWithYaku('honitsu'),
    });
    expect(buildHintSteps(s, noScript)).toHaveLength(0);
  });
});

describe('buildExplainSteps', () => {
  const yakuItem = (yakuId: string) => ({
    id: `yaku-${yakuId}`,
    explainKey: `yaku:${yakuId}`,
    category: 'yaku' as const,
    label: yakuId,
    value: 3,
    description: '',
    highlightTargets: [{ kind: 'tile' as const, tileId: 5 }],
  });

  it('maps score items to character explanations, keeping highlights and order', () => {
    const s = fakeSession({
      index: 0,
      answers: [],
      status: 'playing',
      result: {
        ...emptyResult,
        items: [
          yakuItem('honitsu'),
          { id: 'dora', explainKey: 'dora' as const, category: 'dora' as const, label: 'ドラ', value: 2, description: '', highlightTargets: [] },
        ],
      },
    });
    const steps = buildExplainSteps(s, mao);
    expect(steps).toHaveLength(2);
    expect(steps[0]!.text).toBe(mao.explain['yaku:honitsu']);
    expect(steps[0]!.highlightTargets).toEqual([{ kind: 'tile', tileId: 5 }]);
    expect(steps[1]!.text).toBe(mao.explain['dora']);
  });

  it('skips items whose explanation is not authored (e.g. yakuman)', () => {
    const s = fakeSession({
      index: 0,
      answers: [],
      status: 'playing',
      result: { ...emptyResult, items: [yakuItem('kokushi')] }, // 役満＝未整備
    });
    expect(buildExplainSteps(s, mao)).toHaveLength(0);
  });

  it('点数モードの符 item も解説ステップになる（fu-meld-* / fu-total を含む）', () => {
    const fuItem = (id: string, explainKey: string, label: string, value: number, targets: number[] = []) => ({
      id,
      explainKey,
      category: 'fu' as const,
      label,
      value,
      description: '',
      highlightTargets: targets.map((tileId) => ({ kind: 'tile' as const, tileId })),
    });
    const s = fakeSession({
      index: 0,
      answers: [],
      status: 'playing',
      mode: 'score',
      result: {
        ...emptyResult,
        items: [
          fuItem('fu-base', 'fu:base', '副底', 20, [1, 2, 3]),
          fuItem('fu-tsumo', 'fu:tsumo', 'ツモ', 2),
          // id は面子ごとに一意（連番）でも、解説キーは共有の fu:meld。
          fuItem('fu-meld-0', 'fu:meld', '暗刻(么九) 8符', 8, [4, 5, 6]),
          fuItem('fu-total', 'fu:total', '合計 40符', 40),
        ],
      },
    });
    const steps = buildExplainSteps(s, mao);
    // explainKey（fu:base / fu:tsumo / fu:meld / fu:total）で文言が引ける
    expect(steps.map((x) => x.text)).toEqual([
      mao.explain['fu:base'],
      mao.explain['fu:tsumo'],
      mao.explain['fu:meld'],
      mao.explain['fu:total'],
    ]);
    // category を保持（UI が値の単位＝符/翻を出し分ける根拠）
    expect(steps.every((x) => x.category === 'fu')).toBe(true);
    // ハイライトは item のものを保持（ハンと同じ流儀で要素が光る）
    expect(steps[0]!.highlightTargets).toEqual([
      { kind: 'tile', tileId: 1 },
      { kind: 'tile', tileId: 2 },
      { kind: 'tile', tileId: 3 },
    ]);
    expect(steps[2]!.highlightTargets).toEqual([
      { kind: 'tile', tileId: 4 },
      { kind: 'tile', tileId: 5 },
      { kind: 'tile', tileId: 6 },
    ]);
  });

  it('役モードは符 item を解説に出さない（成立役＋ドラまで・screens.md §3）', () => {
    const fuItem = (id: string, explainKey: string, label: string, value: number) => ({
      id,
      explainKey,
      category: 'fu' as const,
      label,
      value,
      description: '',
      highlightTargets: [],
    });
    const s = fakeSession({
      index: 0,
      answers: [],
      status: 'playing',
      mode: 'yaku',
      result: {
        ...emptyResult,
        items: [
          yakuItem('honitsu'),
          { id: 'dora', explainKey: 'dora' as const, category: 'dora' as const, label: 'ドラ', value: 2, description: '', highlightTargets: [] },
          fuItem('fu-base', 'fu:base', '副底', 20),
          fuItem('fu-total', 'fu:total', '合計 40符', 40),
        ],
      },
    });
    const steps = buildExplainSteps(s, mao);
    // 符は落ち、役・ドラだけが残る。
    expect(steps.map((x) => x.category)).toEqual(['yaku', 'dora']);
    expect(steps.some((x) => x.category === 'fu')).toBe(false);
  });
});

// MainScreen の最終合成（line/expression/highlights/選択/開示の組み立て）を session 側へ移す
// 前提として、現挙動を凍結する特性化テスト（refactoring-1 手順1）。実セッション（engine 採点）で
// ヒント段・解説段が実在する状態を作り、提示の優先（解説＞ヒント＞場面）と各欄の開閉を固定する。
describe('buildViewState — 最終合成の特性化（現挙動の凍結）', () => {
  // 断幺九＋三色同順＋平和（門前ロン）。ヒント3段・解説3役が実在する手。
  const t = mk();
  const winHand = hand(
    [t.m(2), t.m(3), t.m(4), t.p(2), t.p(3), t.p(4), t.s(2), t.s(3), t.s(4), t.m(5), t.m(6), t.s(5), t.s(5)],
    t.m(7),
  );
  const table = tbl();
  const winCtx = ctx({ win: 'ron', seatWind: 'south' });
  const result = score(winHand, table, winCtx, rules());
  const choices: QuizQuestion['choices'] = [
    { value: '2翻', correct: true, explanation: '' },
    { value: '1翻', correct: false, explanation: '' },
    { value: '3翻', correct: false, explanation: '' },
    { value: '4翻', correct: false, explanation: '' },
  ];
  // 場面提示（charView）は ui が遷移時に1回引いて保持する入力。識別用の番兵セリフを置く。
  const SCENE_LINE = '＜場面セリフ＞';
  const charView: CharacterView = { id: 'mao', expression: 'thinking', line: SCENE_LINE, variantSeed: 0.42 };

  const session = (over: Partial<QuizSession>): QuizSession => ({
    mode: 'yaku',
    index: 0,
    hand: winHand,
    table,
    winContext: winCtx,
    question: { target: 'han', prompt: '', choices } as QuizQuestion,
    result,
    answers: [],
    correctCount: 0,
    status: 'playing',
    ...over,
  });
  const uiState = (over: Partial<ViewUiState> = {}): ViewUiState => ({
    hintOpenCount: 0,
    explainIndex: null,
    pendingIndex: null,
    ...over,
  });

  // 実在を前提に置いている素材（崩れたら手を作り直す）。
  it('前提：この手はヒント3段・解説3役を生む', () => {
    expect(buildHintSteps(session({}), mao).length).toBe(3);
    expect(buildExplainSteps(session({}), mao).length).toBe(3);
  });

  it('場面（出題中・ヒント未開示）：場面のセリフ/表情、ハイライト無し、未開示', () => {
    const vs = buildViewState(session({}), mao, charView, uiState());
    expect(vs.character.line).toBe(SCENE_LINE);
    expect(vs.character.expression).toBe('thinking'); // charView の場面表情をそのまま
    expect(vs.character.variantSeed).toBe(0.42);
    expect(vs.highlights).toEqual([]);
    expect(vs.selectedIndex).toBeNull();
    expect(vs.revealed).toBe(false);
    expect(vs.result).toBeNull(); // 回答後のみ
    expect(vs.hintSteps).toEqual([]); // 0段開示
    expect(vs.choices).toBe(choices);
    expect(vs.roundIndex).toBe(0);
    expect(vs.status).toBe('playing');
  });

  it('保留選択（答え合わせ前）：selectedIndex は保留値、まだ未開示', () => {
    const vs = buildViewState(session({}), mao, charView, uiState({ pendingIndex: 2 }));
    expect(vs.selectedIndex).toBe(2);
    expect(vs.revealed).toBe(false);
    expect(vs.result).toBeNull();
  });

  it('ヒント中：開いた最後の段の文言＋ヒント表情、開いた段だけを載せる', () => {
    const s = session({});
    const allHints = buildHintSteps(s, mao);
    const vs = buildViewState(s, mao, charView, uiState({ hintOpenCount: 2 }));
    expect(vs.character.line).toBe(allHints[1]!.text); // 2段目（最後に開いた段）
    expect(vs.character.expression).toBe(expressionFor(mao, 'hinting'));
    expect(vs.hintSteps).toEqual(allHints.slice(0, 2)); // 開いた2段
    expect(vs.highlights).toEqual([]); // 解説中ではない
  });

  it('解説中：解説ステップの文言＋解説表情＋そのハイライト、回答後として開示', () => {
    const s = session({ answers: [{ selectedIndex: 1, correct: true }] });
    const steps = buildExplainSteps(s, mao);
    const vs = buildViewState(s, mao, charView, uiState({ explainIndex: 0 }));
    expect(vs.character.line).toBe(steps[0]!.text);
    expect(vs.character.expression).toBe(expressionFor(mao, 'explaining'));
    expect(vs.highlights).toBe(steps[0]!.highlightTargets);
    expect(vs.revealed).toBe(true);
    expect(vs.result).toBe(result); // 回答後は採点結果を載せる
    expect(vs.selectedIndex).toBe(1); // 回答の選択
  });

  it('解説 index が範囲外：表情は解説のまま・文言は場面に戻る・ハイライト無し（現挙動の非対称）', () => {
    const s = session({ answers: [{ selectedIndex: 0, correct: false }] });
    const vs = buildViewState(s, mao, charView, uiState({ explainIndex: 99 }));
    expect(vs.character.expression).toBe(expressionFor(mao, 'explaining')); // explaining フラグで切る
    expect(vs.character.line).toBe(SCENE_LINE); // explainStep が無いので場面へ
    expect(vs.highlights).toEqual([]);
  });
});
