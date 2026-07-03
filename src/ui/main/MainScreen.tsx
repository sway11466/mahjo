import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type {
  Character,
  Progress,
  RuleSettings,
  StudyMode,
  HighlightTarget,
} from '../../types/index.ts';
import type { Rng } from '../../engine/rng.ts';
import { riichiActive } from '../../engine/score.ts';
import {
  startQuiz,
  beginQuiz,
  answerCurrent,
  nextProblem,
  applyProgress,
  buildCharacterView,
  buildHintSteps,
  buildExplainSteps,
  buildViewState,
  SESSION_LENGTH,
  type QuizSession,
  type CharacterView,
} from '../../session/index.ts';
import { Hand } from './Hand.tsx';
import { BoardInfo } from './board/BoardInfo.tsx';
import { SeatInfo } from './board/SeatInfo.tsx';
import { RiichiStick } from './board/RiichiStick.tsx';
import { ChoicePanel } from './quiz/ChoicePanel.tsx';
import { MainMenu } from './menu/MainMenu.tsx';
import { YakuListOverlay } from './yaku-list/YakuListOverlay.tsx';
import { FuCountingOverlay } from './fu-counting/FuCountingOverlay.tsx';
import { ScoreTableOverlay } from './score-table/ScoreTableOverlay.tsx';
import { CharacterStage, type StageAction, type StageBadge } from '../character/CharacterStage.tsx';
import { assetUrl, portraitUrl } from '../character/avatarAssets.ts';
import { selectionMarkFor } from '../character/selectionMark.tsx';
import { themeColorOf } from '../../characters/index.ts';
import { track } from '../analytics/track.ts';
import './MainScreen.css';

// 選択 → 答え合わせの溜め（ms）。御札を置いてから少し置いて正誤を開示（演出＝ui の担当）。
// 短すぎるとテンポは良いが手応えが無く、長いとダレる。様子を見て調整。
const REVEAL_DELAY_MS = 550;

interface MainScreenProps {
  mode: StudyMode;
  character: Character;
  progress: Progress;
  setProgress: (p: Progress) => void;
  rng: Rng;
  rules: RuleSettings;
  /** スタート画面へ戻る */
  onExit: () => void;
}

/**
 * メイン画面（クイズ）。スタート画面で選んだ mode で起動する（役/点数）。
 * 進行・判定・view-state 組み立ては session、ここは描画＋dispatch（architecture.md §2）。
 */
export function MainScreen({
  mode,
  character,
  progress,
  setProgress,
  rng,
  rules,
  onExit,
}: MainScreenProps) {
  const [session, setSession] = useState<QuizSession>(() =>
    startQuiz(mode, progress, rng, rules),
  );
  // キャラ提示（expression＋line）は session が場面→表情＋rngセリフで組み立てる（session.md §4）。
  // 遷移時に1回だけ作って保持する（再レンダーでセリフがブレないよう）。
  const [charView, setCharView] = useState<CharacterView>(() =>
    buildCharacterView(session, character, rng),
  );
  // 選択直後〜答え合わせまでの「保留中の選択」。御札は出すが正誤はまだ伏せる。
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  // ヒントを何段開いたか（局ごとにリセット）。ボタンで1段ずつ開く（hints.md §4-5）。
  const [hintOpenCount, setHintOpenCount] = useState(0);
  // 解説ウォークスルーの現在ステップ。null＝未開始（正誤段）、0..n-1＝説明中（screens.md §3）。
  const [explainIndex, setExplainIndex] = useState<number | null>(null);
  // 参照オーバーレイの開閉（出題中も開ける。クイズは背後に保持）。役一覧／符の数え方。
  const [yakuListOpen, setYakuListOpen] = useState(false);
  const [fuCountingOpen, setFuCountingOpen] = useState(false);
  const [scoreTableOpen, setScoreTableOpen] = useState(false);
  const revealTimer = useRef<number | null>(null);
  // アンマウント時にタイマーを片付ける。
  useEffect(
    () => () => {
      if (revealTimer.current !== null) clearTimeout(revealTimer.current);
    },
    [],
  );

  const answered = session.answers.length > session.index;
  const current = answered ? session.answers[session.index]! : null;
  const finished = session.status === 'finished';
  // 開始のあいさつ中（盤面を出さず「はじめる」待ち）。session.md §3。
  const greeting = session.status === 'greeting';
  // 4択に渡す選択 index：回答後は確定値、保留中は仮選択、未選択は null。
  const selectedIndex = answered ? current!.selectedIndex : pendingIndex;

  // 場の状況フラグ・ドラは session の実データから（engine が生成）。
  const riichi = riichiActive(session.winContext); // リーチ棒はダブルリーチでも立つ
  const ippatsu = session.winContext.ippatsu;
  const doraIndicators = session.table.doraIndicators;
  const uraDoraIndicators = session.table.uraDoraIndicators ?? [];

  // 保留中のタイマーを片付ける（次へ・もう一度の前に念のため）。
  const clearPending = () => {
    if (revealTimer.current !== null) {
      clearTimeout(revealTimer.current);
      revealTimer.current = null;
    }
    setPendingIndex(null);
  };

  // 遷移したら新しい状態でキャラ提示を組み直す（rng はここで1回引く）。ヒント・解説もリセット。
  const advanceTo = (next: QuizSession) => {
    setSession(next);
    setCharView(buildCharacterView(next, character, rng));
    setHintOpenCount(0);
    setExplainIndex(null);
  };

  const onSelect = (i: number) => {
    if (answered || finished || pendingIndex !== null) return;
    // まず選択を見せ（御札を置く）、少し置いてから答え合わせ（正誤を開示）。
    setPendingIndex(i);
    revealTimer.current = window.setTimeout(() => {
      revealTimer.current = null;
      setPendingIndex(null);
      const next = answerCurrent(session, i);
      // 回答（4択選択）の計測。正答率＝学習アプリの主指標（feature-18 フェーズ1）。
      const answer = next.answers[next.index];
      const correct = answer?.correct ?? false;
      track({
        event: 'quiz_answer',
        character_id: character.id,
        correct,
        target: next.question.target,
      });
      // 進捗は回答確定と同時に反映する。「次へ」まで待つと、押さずにメニューへ戻った1問が
      // 消えて計測（quiz_answer）ともズレる。
      setProgress(applyProgress(progress, session.mode, session.question.target, correct));
      advanceTo(next);
    }, REVEAL_DELAY_MS);
  };
  const onNext = () => {
    if (!current) return;
    clearPending();
    // 進捗は回答時に反映済み（onSelect）。ここは次の出題／終了への遷移のみ。
    const next = nextProblem(session, progress, rng, rules);
    // 8問終了＝完走（mode_start の対）。途中は次の出題。
    if (next.status === 'finished') {
      track({
        event: 'session_complete',
        character_id: character.id,
        mode: next.mode,
        correct_count: next.correctCount,
      });
    } else {
      track({
        event: 'question_view',
        character_id: character.id,
        target: next.question.target,
      });
    }
    advanceTo(next);
  };
  const onRestart = () => {
    clearPending();
    advanceTo(startQuiz(mode, progress, rng, rules));
  };
  // あいさつ → 出題（1問目を表示）。盤面はここから出る。
  const onBegin = () => {
    const next = beginQuiz(session);
    // セッション開始（はじめる押下＝実際に遊び始めた1回）＋1問目の出題を計測。
    track({ event: 'mode_start', character_id: character.id, mode: next.mode });
    track({
      event: 'question_view',
      character_id: character.id,
      target: next.question.target,
    });
    advanceTo(next);
  };

  // 1ターンの提示モデル（何を見せるか）は session が組み立てる。ui は「どう見せるか」だけ：
  // line/expression/highlights/選択 は view-state を読むだけ。表情→画像の解決・操作（onClick）・
  // 解説バッジ・ヒントボタンの開閉は ui に残る（architecture.md §2・session.md §4）。
  const vs = buildViewState(session, character, charView, {
    hintOpenCount,
    explainIndex,
    pendingIndex,
  });
  const highlights: HighlightTarget[] = vs.highlights;

  // ヒントボタンの開閉は ui の affordance（全段リストから「あと何段あるか」で出し分ける）。
  const hintSteps = buildHintSteps(session, character);
  // reveal 遅延中（御札を置いてから答え合わせまで）はヒントを開けない（選択と同じくロック）。
  const hintsRemain =
    !answered &&
    !finished &&
    !greeting &&
    pendingIndex === null &&
    hintOpenCount < hintSteps.length;
  const onHint = () => {
    if (hintOpenCount >= hintSteps.length) return;
    // ヒント段を開く計測：どこまで掘るか＝段階ヒントの検証（feature-18 フェーズ1）。
    track({
      event: 'hint_open',
      character_id: character.id,
      level: hintSteps[hintOpenCount]!.level,
    });
    setHintOpenCount((c) => Math.min(c + 1, hintSteps.length));
  };

  // 解説ウォークスルー（回答後）。進行位置は ui（explainIndex）。バッジ・操作の素に使う。
  const explainSteps = buildExplainSteps(session, character);
  const explaining = answered && explainIndex !== null;
  const onShowExplain = () => {
    if (explainSteps.length > 0) {
      // 回答後の解説に入った計測（解説到達数）。
      track({ event: 'explain_view', character_id: character.id });
      setExplainIndex(0);
    }
  };
  const onExplainNext = () => {
    if (explainIndex === null) return;
    if (explainIndex + 1 < explainSteps.length) setExplainIndex(explainIndex + 1);
    else onNext(); // 最後のステップ → 次の設問へ
  };

  // 解説の内訳バッジ：これまで説明した翻/符を積み上げて表示（複雑な手でも積み上げを見失わない）。
  // 説明済み＝先頭〜現在ステップ。最新（現在）を強調。翻系（役・ドラ）と符系でトーンを分ける。
  const explainBadges: StageBadge[] = explaining
    ? explainSteps.slice(0, explainIndex! + 1).map((s, i, arr) => {
        const unit: StageBadge['unit'] = s.category === 'fu' ? 'fu' : 'han';
        return {
          text: `${s.label} ${s.value}${unit === 'fu' ? '符' : '翻'}`,
          unit,
          current: i === arr.length - 1,
        };
      })
    : [];

  // 表情→画像の解決は ui の責務（data-model §17）。session が選んだ抽象表情を、このキャラの
  // 差分プールから実 URL に解決する（欠落時はベース表情へ落とす保険は portraitUrl 側）。
  const avatarSrc = portraitUrl(
    character,
    vs.character.expression,
    vs.character.variantSeed,
  );

  // 会話窓の右下に出す操作（screens.md §3）。すべて会話窓に集約（盤面にはボタンを置かない）。
  // 正誤段：解説を見る／次の設問へ。解説中：次へ（最後は次の設問へ）。終了：もう一度／スタートへ。
  // 最終問（南4局）は次の設問が無く結果へ進むので、進むラベルを「結果を見る」にする。
  const isLastProblem = session.index === SESSION_LENGTH - 1;
  const advanceLabel = isLastProblem ? '結果を見る' : '次の設問へ';
  let actions: StageAction[] = [];
  if (greeting) {
    actions = [{ label: 'はじめる', onClick: onBegin }];
  } else if (finished) {
    actions = [
      { label: 'もう一度', onClick: onRestart },
      { label: 'スタートへ', onClick: onExit },
    ];
  } else if (answered) {
    if (!explaining) {
      actions =
        explainSteps.length > 0
          ? [
              { label: '解説を見る', onClick: onShowExplain },
              { label: advanceLabel, onClick: onNext },
            ]
          : [{ label: advanceLabel, onClick: onNext }];
    } else {
      const last = explainIndex! + 1 >= explainSteps.length;
      actions = [{ label: last ? advanceLabel : '次へ', onClick: onExplainNext }];
    }
  }

  // キャラのテーマ色を CSS 変数へ流す（装飾の値は CSS 側）。
  const screenStyle = { '--char-glow': themeColorOf(character) } as CSSProperties;

  return (
    <div className="screen" style={screenStyle}>
      {/* 左上のハンバーガーメニュー（全状態で常駐）。参照（出題中も開ける）＋メニューに戻る。 */}
      <MainMenu
        items={[
          { label: '役一覧', onClick: () => setYakuListOpen(true) },
          { label: '符の数え方', onClick: () => setFuCountingOpen(true) },
          { label: '点数表', onClick: () => setScoreTableOpen(true) },
          { label: 'メニューに戻る', onClick: onExit, dividerBefore: true },
        ]}
      />
      {yakuListOpen && <YakuListOverlay onClose={() => setYakuListOpen(false)} />}
      {fuCountingOpen && <FuCountingOverlay onClose={() => setFuCountingOpen(false)} />}
      {scoreTableOpen && <ScoreTableOverlay onClose={() => setScoreTableOpen(false)} />}
      <main className="screen__board">
        {/* あいさつ中・終了時は盤面（局・ドラ・手牌）を隠す（はじめる前／結果に集中） */}
        {!finished && !greeting && (
          <BoardInfo
            roundWind={session.table.roundWind}
            roundIndex={session.index}
            doraIndicators={doraIndicators}
            uraDoraIndicators={uraDoraIndicators}
            highlights={highlights}
          />
        )}
        {!finished && !greeting && (
          <div className="board-main">
            <div className="player">
              <div className="self-row">
                <SeatInfo
                  seatWind={session.winContext.seatWind}
                  highlights={highlights}
                />
                {/* リーチ枠は常に場所を確保し、リーチでないときは不可視に（手牌の位置を動かさない）。 */}
                <div
                  className="riichi"
                  aria-hidden={!riichi}
                  style={riichi ? undefined : { visibility: 'hidden' }}
                >
                  <div className="riichi__labels">
                    <span className="riichi__label">リーチ</span>
                    {ippatsu && <span className="riichi__ippatsu">一発</span>}
                  </div>
                  <div className="riichi__stick">
                    <RiichiStick />
                  </div>
                </div>
              </div>
              <div className="screen__board-inner">
                <Hand
                  hand={session.hand}
                  win={session.winContext.win}
                  highlights={highlights}
                />
              </div>
            </div>
          </div>
        )}

        {finished ? (
          // 結果は点数だけ盤面に。操作（もう一度／スタートへ）は会話窓のアクションに集約。
          <div className="quiz-result">
            <p className="quiz-result__score">
              {SESSION_LENGTH}問中 {session.correctCount}問正解
            </p>
          </div>
        ) : greeting ? null : (
          <ChoicePanel
            choices={session.question.choices}
            selectedIndex={selectedIndex}
            revealed={answered}
            onSelect={onSelect}
            selectionMark={selectionMarkFor(character.motif?.ritual)}
          />
        )}
      </main>

      <CharacterStage
        name={character.displayName}
        line={vs.character.line}
        avatarSrc={avatarSrc}
        showHint={hintsRemain}
        onHint={onHint}
        hintIconSrc={assetUrl(`characters/${character.id}/${character.id}-familiar.webp`)}
        actions={actions}
        badges={explainBadges}
      />
    </div>
  );
}
