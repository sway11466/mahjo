import type {
  RuleSettings,
  AppSettings,
  Progress,
  ProgressByCharacter,
  StudyMode,
  QuizTarget,
  MissRecord,
  MissHistory,
} from '../types/index.ts';
import { MISS_HISTORY_CAP } from '../types/index.ts';
import {
  defaultRuleSettings,
  defaultAppSettings,
  defaultProgress,
} from './defaults.ts';

/**
 * 手書きの軽量バリデーション（storage.md §5）。未知フィールドは無視し、欠け・型違いは既定で補完する。
 * 既定値は defaults.ts の単一出所から取る。各 validate は常に妥当な完全形を返す（例外を投げない）。
 */

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
function bool(v: unknown, d: boolean): boolean {
  return typeof v === 'boolean' ? v : d;
}
function num(v: unknown, d: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : d;
}
function intInRange(v: unknown, min: number, max: number, d: number): number {
  return typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max ? v : d;
}
function str(v: unknown, d: string): string {
  return typeof v === 'string' ? v : d;
}

function validateEnabledYaku(raw: unknown): RuleSettings['enabledYaku'] {
  if (!isObject(raw)) return {};
  const out: RuleSettings['enabledYaku'] = {};
  // boolean 値のエントリのみ採用。未知の役 id は害がないので残す（エンジンは !== false で判定）。
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === 'boolean') {
      out[key as keyof RuleSettings['enabledYaku']] = value;
    }
  }
  return out;
}

export function validateRuleSettings(raw: unknown): RuleSettings {
  const d = defaultRuleSettings();
  if (!isObject(raw)) return d;
  return {
    kuitan: bool(raw.kuitan, d.kuitan),
    atozuke: bool(raw.atozuke, d.atozuke),
    // 0〜12 の整数（上限＝5の牌の物理枚数：各色4枚×3色）。範囲外は壊れた保存として既定へ。
    akaDoraCount: intInRange(raw.akaDoraCount, 0, 12, d.akaDoraCount),
    kiriageMangan: bool(raw.kiriageMangan, d.kiriageMangan),
    kazoeYakuman: bool(raw.kazoeYakuman, d.kazoeYakuman),
    doubleYakuman: bool(raw.doubleYakuman, d.doubleYakuman),
    rareYaku: bool(raw.rareYaku, d.rareYaku),
    round: raw.round === 'east-fixed' || raw.round === 'random' ? raw.round : d.round,
    enabledYaku: validateEnabledYaku(raw.enabledYaku),
  };
}

export function validateAppSettings(raw: unknown): AppSettings {
  const d = defaultAppSettings();
  if (!isObject(raw)) return d;
  return {
    // 空文字は無効（キャラ id は非空）なので既定へ。未知 id は読込側の getCharacter が既定へ落とす。
    selectedCharacterId: str(raw.selectedCharacterId, d.selectedCharacterId) || d.selectedCharacterId,
    playerName: str(raw.playerName, d.playerName),
    se: bool(raw.se, d.se),
    bgm: bool(raw.bgm, d.bgm),
    randomTileOrder: bool(raw.randomTileOrder, d.randomTileOrder),
  };
}

const STUDY_MODES: StudyMode[] = ['yaku', 'score'];
const QUIZ_TARGETS: QuizTarget[] = ['han', 'score'];

// 苦手集計（byTarget）の防御的読込。型の合う種類だけ採用し、空なら undefined（既定と同じく持たない）。
function validateByTarget(raw: unknown): Progress['byTarget'] | undefined {
  if (!isObject(raw)) return undefined;
  const out: NonNullable<Progress['byTarget']> = {};
  for (const t of QUIZ_TARGETS) {
    const s = raw[t];
    if (isObject(s) && typeof s.seen === 'number' && typeof s.correct === 'number') {
      out[t] = { seen: num(s.seen, 0), correct: num(s.correct, 0) };
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function validateProgress(raw: unknown): Progress {
  const d = defaultProgress();
  if (!isObject(raw)) return d;
  const cbm = isObject(raw.correctByMode) ? raw.correctByMode : {};
  const correctByMode: Progress['correctByMode'] = {};
  for (const m of STUDY_MODES) {
    if (typeof cbm[m] === 'number' && Number.isFinite(cbm[m])) {
      correctByMode[m] = cbm[m] as number;
    }
  }
  const byTarget = validateByTarget(raw.byTarget);
  return {
    correctTotal: num(raw.correctTotal, d.correctTotal),
    correctByMode,
    // 任意フィールド＝空のときはキーを付けない（既定 Progress と同形・無駄な {} を残さない）。
    ...(byTarget ? { byTarget } : {}),
  };
}

// 間違い履歴の防御的読込：レコード単位で形（キー・配列・牌らしさ）だけを確認し、合わないものだけ
// 捨てる（他レコードは生かす）。深い麻雀的整合（和了形か等）は書き込み側（engine/session）が担保
// する（storage は types のみ依存＝engine の検証は呼べない）。
function isTileLike(v: unknown): boolean {
  return isObject(v) && typeof v.id === 'number' && (v.kind === 'suited' || v.kind === 'honor');
}
function isMissRecord(v: unknown): v is MissRecord {
  if (!isObject(v)) return false;
  if (
    typeof v.at !== 'string' ||
    typeof v.selectedValue !== 'string' ||
    typeof v.correctValue !== 'string'
  ) {
    return false;
  }
  const h = v.hand;
  if (
    !isObject(h) ||
    !Array.isArray(h.concealed) ||
    !h.concealed.every(isTileLike) ||
    !isTileLike(h.winningTile) ||
    !Array.isArray(h.calledMelds) ||
    !h.calledMelds.every(
      (m) => isObject(m) && Array.isArray(m.tiles) && m.tiles.every(isTileLike),
    )
  ) {
    return false;
  }
  const t = v.table;
  if (!isObject(t) || !Array.isArray(t.doraIndicators) || !t.doraIndicators.every(isTileLike)) {
    return false;
  }
  const w = v.winContext;
  if (!isObject(w) || (w.win !== 'tsumo' && w.win !== 'ron') || typeof w.seatWind !== 'string') {
    return false;
  }
  return true;
}

export function validateMissHistory(raw: unknown): MissHistory {
  if (!isObject(raw)) return {};
  const out: MissHistory = {};
  for (const [id, modes] of Object.entries(raw)) {
    if (!isObject(modes)) continue;
    const perChar: Partial<Record<StudyMode, MissRecord[]>> = {};
    for (const m of STUDY_MODES) {
      const arr = modes[m];
      if (!Array.isArray(arr)) continue;
      // 上限も読込側で守る（手編集・旧上限のデータでも直近 CAP 件に丸める）
      const ok = arr.filter(isMissRecord).slice(-MISS_HISTORY_CAP);
      if (ok.length > 0) perChar[m] = ok;
    }
    if (Object.keys(perChar).length > 0) out[id] = perChar;
  }
  return out;
}

export function validateProgressByCharacter(raw: unknown): ProgressByCharacter {
  if (!isObject(raw)) return {};
  const out: ProgressByCharacter = {};
  for (const [id, p] of Object.entries(raw)) {
    out[id] = validateProgress(p);
  }
  return out;
}
