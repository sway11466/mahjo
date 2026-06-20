import type {
  Tile,
  Hand,
  Table,
  WinContext,
  RuleSettings,
  YakuId,
  Decomposition,
  ScoreResult,
  ScoreItem,
  ScoreRank,
  PaymentBreakdown,
  HighlightTarget,
  HintKey,
} from '../types/index.ts';
import { parse } from './parse.ts';
import { detectYaku } from './yaku.ts';
import { getYaku, yakuDisplayName } from './yaku-table.ts';
import { computeFu } from './fu.ts';
import { yakuHighlights } from './yaku-highlight.ts';
import { tileKind, kindOfSuited, kindOfHonor, HONORS } from './tiles.ts';

/**
 * 採点（score）。生成・出題に使う最小要約 summarize と、点数モードの完全な ScoreResult を提供する。
 * いずれも高点法（複数解釈から最大点を採用。scoring-rules §4）を共通コア evaluate で行う純関数。
 * 翻・符・点数・配分・満貫境界の正は [scoring-rules.md](../../docs/spec/scoring-rules.md) §1–3。
 */
export interface ScoredSummary {
  yaku: YakuId[]; // 成立役（採用した解釈）
  han: number; // 翻合計（役＋ドラ。役満は0）
  fu: number; // 符合計（符・点数クイズ用）
  doraHan: number; // うちドラ分
  points: number; // 移動点合計（点数クイズ用＝payments.total）
  yakuman: boolean; // 役満か
  menzen: boolean;
  win: 'tsumo' | 'ron';
  isDealer: boolean;
}

/** クイズ・出題用の最小要約 */
export function summarize(hand: Hand, table: Table, win: WinContext, rules: RuleSettings): ScoredSummary {
  const menzen = hand.calledMelds.every((m) => !m.open);
  const e = evaluate(hand, table, win, rules);
  if (!e) {
    return {
      yaku: [],
      han: 0,
      fu: 0,
      doraHan: 0,
      points: 0,
      yakuman: false,
      menzen,
      win: win.win,
      isDealer: win.seatWind === 'east',
    };
  }
  return {
    yaku: e.yaku,
    han: e.yakuman ? 0 : e.han,
    fu: e.fu,
    doraHan: e.dora.total,
    points: e.payments.total,
    yakuman: e.yakuman,
    menzen,
    win: win.win,
    isDealer: e.isDealer,
  };
}

/** 点数モードの完全な採点結果（解説パネル＝役/符/ドラの箇条書き＋点数）。 */
export function score(hand: Hand, table: Table, win: WinContext, rules: RuleSettings): ScoreResult {
  const e = evaluate(hand, table, win, rules);
  if (!e) {
    return {
      totalHan: 0,
      totalFu: 0,
      scoreText: '役なし',
      payments: { total: 0 },
      rank: 'normal',
      yakuman: false,
      items: [],
      hasYaku: false,
    };
  }
  // 解説の順は 役（翻）→ ドラ（翻）→ 符（screens.md §3）。翻の要素をまとめてから符に入る。
  const items: ScoreItem[] = [
    ...yakuItems(e.yaku, e.menzen, e.decomposition, hand, table, win),
    ...(e.yakuman ? [] : doraItems(e.dora, hand, table)),
    ...e.fuItems,
  ];
  return {
    totalHan: e.yakuman ? 0 : e.han,
    totalFu: e.fu,
    scoreText: e.scoreText,
    payments: e.payments,
    rank: e.rank,
    yakuman: e.yakuman,
    items,
    hasYaku: true,
  };
}

// ── 高点法コア ─────────────────────────────────────────────

interface Evaluation {
  yaku: YakuId[];
  decomposition: Decomposition;
  han: number; // 役＋ドラ（役満は0）
  fu: number;
  dora: DoraBreakdown;
  menzen: boolean;
  isDealer: boolean;
  yakuman: boolean;
  payments: PaymentBreakdown;
  rank: ScoreRank;
  scoreText: string;
  fuItems: ScoreItem[];
}

/** 1解釈を採点するための、和了ごとに不変の文脈（evaluate がループ前に1回組む）。 */
interface EvalContext {
  hand: Hand;
  table: Table;
  win: WinContext;
  rules: RuleSettings;
  menzen: boolean;
  isDealer: boolean;
  dora: DoraBreakdown;
}

/** 全分解を採点し、最終点数が最大の解釈を採用する（同点は翻→符で優先）。役なしは null。 */
function evaluate(hand: Hand, table: Table, win: WinContext, rules: RuleSettings): Evaluation | null {
  const ctx: EvalContext = {
    hand,
    table,
    win,
    rules,
    menzen: hand.calledMelds.every((m) => !m.open),
    isDealer: win.seatWind === 'east',
    dora: doraBreakdown(hand, table, win),
  };

  let best: Evaluation | null = null;
  for (const d of parse(hand)) {
    const yaku = detectYaku(d, hand, table, win, rules);
    if (yaku.length === 0) continue;
    const cand = scoreDecomposition(ctx, d, yaku);
    if (!best || better(cand, best)) best = cand;
  }
  return best;
}

/** 1解釈を採点して Evaluation にする */
function scoreDecomposition(ctx: EvalContext, d: Decomposition, yaku: YakuId[]): Evaluation {
  const { hand, table, win, rules, menzen, isDealer, dora } = ctx;
  const yakumanYaku = yaku.filter((id) => getYaku(id)?.yakuman);
  if (yakumanYaku.length > 0) {
    const mult = rules.doubleYakuman
      ? yakumanYaku.reduce((s, id) => s + (isDoubleYakuman(id) ? 2 : 1), 0)
      : 1;
    const p = fixedPay('yakuman', isDealer, win.win, mult);
    return { yaku, decomposition: d, han: 0, fu: 0, dora, menzen, isDealer, yakuman: true, fuItems: [], ...p };
  }
  const han = sumYakuHan(yaku, menzen) + dora.total;
  const fuRes = computeFu(d, hand, table, win, yaku);
  const p = pointsFor(han, fuRes.fu, isDealer, win.win, rules);
  return { yaku, decomposition: d, han, fu: fuRes.fu, dora, menzen, isDealer, yakuman: false, fuItems: fuRes.items, ...p };
}

/** a がより高得点か（合計点→翻→符の順） */
function better(a: Evaluation, b: Evaluation): boolean {
  if (a.payments.total !== b.payments.total) return a.payments.total > b.payments.total;
  if (a.han !== b.han) return a.han > b.han;
  return a.fu > b.fu;
}

function sumYakuHan(yaku: YakuId[], menzen: boolean): number {
  let h = 0;
  for (const id of yaku) {
    const y = getYaku(id);
    if (!y || y.yakuman) continue;
    h += menzen ? y.hanClosed : (y.hanOpen ?? 0);
  }
  return h;
}

function isDoubleYakuman(id: YakuId): boolean {
  const y = getYaku(id);
  return !!y && y.yakuman && y.double;
}

// ── 点数・配分・満貫境界（scoring-rules §3） ────────────────

interface Scored {
  payments: PaymentBreakdown;
  rank: ScoreRank;
  scoreText: string;
}

const round100 = (x: number): number => Math.ceil(x / 100) * 100;

/** 通常役の点数を翻・符から直接求める（境界テスト用の公開 API）。役満は score() 経由。 */
export function scorePoints(
  han: number,
  fu: number,
  isDealer: boolean,
  win: 'tsumo' | 'ron',
  rules: RuleSettings,
): { payments: PaymentBreakdown; rank: ScoreRank; scoreText: string } {
  return pointsFor(han, fu, isDealer, win, rules);
}

/** 満貫以上の固定値 [子総計, 親総計]（§3.1） */
const FIXED_TOTAL: Record<Exclude<ScoreRank, 'normal'>, [number, number]> = {
  mangan: [8000, 12000],
  haneman: [12000, 18000],
  baiman: [16000, 24000],
  sanbaiman: [24000, 36000],
  'kazoe-yakuman': [32000, 48000],
  yakuman: [32000, 48000],
};

/** 通常役の点数（基本点→満貫境界→配分） */
function pointsFor(han: number, fu: number, isDealer: boolean, win: 'tsumo' | 'ron', rules: RuleSettings): Scored {
  const a = fu * 2 ** (2 + han);
  const rank = rankFor(han, a, rules);
  return rank === 'normal' ? normalPay(a, isDealer, win) : fixedPay(rank, isDealer, win, 1);
}

/** 満貫境界の判定（§3.2） */
function rankFor(han: number, a: number, rules: RuleSettings): ScoreRank {
  if (han >= 13) return rules.kazoeYakuman ? 'kazoe-yakuman' : 'sanbaiman';
  if (han >= 11) return 'sanbaiman';
  if (han >= 8) return 'baiman';
  if (han >= 6) return 'haneman';
  if (han === 5) return 'mangan';
  if (han >= 3) {
    if (a >= 2000) return 'mangan'; // 4翻40符=2560 / 3翻70符=2240 等
    if (rules.kiriageMangan && a === 1920) return 'mangan'; // 4翻30符 / 3翻60符
  }
  return 'normal';
}

/** 通常計算（基本点 a から各支払いを100点切り上げ） */
function normalPay(a: number, isDealer: boolean, win: 'tsumo' | 'ron'): Scored {
  if (win === 'ron') {
    const ron = round100(a * (isDealer ? 6 : 4));
    return { payments: { ron, total: ron }, rank: 'normal', scoreText: `${who(isDealer)}ロン ${ron}点` };
  }
  if (isDealer) {
    const each = round100(a * 2);
    return { payments: { fromEach: each, total: each * 3 }, rank: 'normal', scoreText: `親ツモ ${each}オール` };
  }
  const fromDealer = round100(a * 2);
  const fromNonDealer = round100(a);
  return {
    payments: { fromDealer, fromNonDealer, total: fromDealer + fromNonDealer * 2 },
    rank: 'normal',
    scoreText: `子ツモ ${fromNonDealer}/${fromDealer}`,
  };
}

/** 満貫以上の固定値の配分。mult は役満の複合倍率（通常役は1） */
function fixedPay(rank: Exclude<ScoreRank, 'normal'>, isDealer: boolean, win: 'tsumo' | 'ron', mult: number): Scored {
  const [child, dealer] = FIXED_TOTAL[rank];
  const cd = (isDealer ? dealer : child) * mult;
  if (win === 'ron') {
    return { payments: { ron: cd, total: cd }, rank, scoreText: `${who(isDealer)}ロン ${cd}点` };
  }
  if (isDealer) {
    return { payments: { fromEach: cd / 3, total: cd }, rank, scoreText: `親ツモ ${cd / 3}オール` };
  }
  return {
    payments: { fromDealer: cd / 2, fromNonDealer: cd / 4, total: cd },
    rank,
    scoreText: `子ツモ ${cd / 4}/${cd / 2}`,
  };
}

function who(isDealer: boolean): string {
  return isDealer ? '親' : '子';
}

// ── ドラ（scoring-rules §1.4） ─────────────────────────────

interface DoraBreakdown {
  dora: number;
  aka: number;
  ura: number;
  total: number;
}

function allHandTiles(hand: Hand): Tile[] {
  return [...hand.concealed, hand.winningTile, ...hand.calledMelds.flatMap((m) => m.tiles)];
}

function doraBreakdown(hand: Hand, table: Table, win: WinContext): DoraBreakdown {
  const tiles = allHandTiles(hand);
  let aka = 0;
  for (const t of tiles) if (t.kind === 'suited' && t.red) aka++;
  const dora = countByIndicators(tiles, table.doraIndicators);
  const ura = win.riichi && table.uraDoraIndicators ? countByIndicators(tiles, table.uraDoraIndicators) : 0;
  return { dora, aka, ura, total: dora + aka + ura };
}

function countByIndicators(tiles: Tile[], indicators: Tile[]): number {
  let n = 0;
  for (const ind of indicators) {
    const dk = doraKind(ind);
    n += tiles.filter((t) => tileKind(t) === dk).length;
  }
  return n;
}

const WINDS = HONORS.slice(0, 4); // 東 南 西 北
const DRAGONS = HONORS.slice(4); // 白 發 中

/** ドラ表示牌 → ドラの牌種別（0–33）。数牌は次のランク、風・三元は表示牌の次へ循環。 */
function doraKind(indicator: Tile): number {
  if (indicator.kind === 'suited') {
    const rank = indicator.rank === 9 ? 1 : indicator.rank + 1;
    return kindOfSuited(indicator.suit, rank);
  }
  const wi = WINDS.indexOf(indicator.honor);
  if (wi >= 0) return kindOfHonor(WINDS[(wi + 1) % WINDS.length]!);
  const di = DRAGONS.indexOf(indicator.honor);
  return kindOfHonor(DRAGONS[(di + 1) % DRAGONS.length]!);
}

// ── ScoreItem 組み立て ─────────────────────────────────────

function yakuItems(
  yaku: YakuId[],
  menzen: boolean,
  d: Decomposition,
  hand: Hand,
  table: Table,
  win: WinContext,
): ScoreItem[] {
  return yaku.map((id) => {
    const y = getYaku(id);
    const value = !y || y.yakuman ? 0 : menzen ? y.hanClosed : (y.hanOpen ?? 0);
    return {
      id: `yaku-${id}`,
      explainKey: `yaku:${id}`,
      category: 'yaku',
      label: y ? yakuDisplayName(y) : id,
      value,
      description: '',
      highlightTargets: yakuHighlights(id, d, hand, table, win),
    };
  });
}

function doraItems(dora: DoraBreakdown, hand: Hand, table: Table): ScoreItem[] {
  const items: ScoreItem[] = [];
  if (dora.dora > 0) {
    items.push(doraItem('dora', 'dora', 'ドラ', dora.dora, doraTileTargets(hand, table.doraIndicators)));
  }
  if (dora.aka > 0) items.push(doraItem('aka', 'aka-dora', '赤ドラ', dora.aka, redTargets(hand)));
  if (dora.ura > 0) {
    items.push(doraItem('ura', 'ura-dora', '裏ドラ', dora.ura, doraTileTargets(hand, table.uraDoraIndicators ?? [])));
  }
  return items;
}

function doraItem(
  id: string,
  explainKey: HintKey,
  label: string,
  value: number,
  highlightTargets: HighlightTarget[],
): ScoreItem {
  return { id, explainKey, category: 'dora', label, value, description: '', highlightTargets };
}

/** ドラ表示牌が指すドラ牌を手牌中から拾い、その牌へのハイライト対象を返す */
function doraTileTargets(hand: Hand, indicators: Tile[]): HighlightTarget[] {
  const kinds = new Set(indicators.map(doraKind));
  return allHandTiles(hand)
    .filter((t) => kinds.has(tileKind(t)))
    .map((t) => ({ kind: 'tile', tileId: t.id }));
}

function redTargets(hand: Hand): HighlightTarget[] {
  return allHandTiles(hand)
    .filter((t) => t.kind === 'suited' && t.red)
    .map((t) => ({ kind: 'tile', tileId: t.id }));
}
