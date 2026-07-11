/**
 * BGM 主旋律：度数記法のパースと音高（MIDI）解決（純ロジック・テスト対象）。
 * 記法・モードの正は docs/design/sound.md「BGM の実現方式」。合成ロジックはオーサリングツール
 * （tools/melody-authoring）から移植。ツールはビルドなしの独立物なので当面コピーが二重に存在する
 * （ADR-0003。共通化はしない）。DOM・Web Audio に触れない（engine ではなく ui 層の純部分）。
 */
import type { Mode } from '../../types/index.ts';

/** 1小節の拍数（4/4 固定）。 */
export const BEATS_PER_BAR = 4;

/** モード（調）→ 主音からの半音オフセット（ペンタトニック5音）。宮＝明るい 〜 羽＝翳り。 */
export const MODES: Record<Mode, number[]> = {
  宮: [0, 2, 4, 7, 9],
  商: [0, 2, 5, 7, 10],
  角: [0, 3, 5, 8, 10],
  徵: [0, 2, 5, 7, 9],
  羽: [0, 3, 5, 7, 10],
};

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** 度数記法の1音（deg 0 = 休符）。 */
export interface MelodyNote {
  deg: number; // 0（休符）または 1〜5
  oct: number; // オクターブ移動（' で +1 / , で −1）
  beats: number; // 長さ（拍）
}

/** MIDI ノート番号 → 周波数(Hz)。 */
export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** 主音の音名＋オクターブ（例 'C5'）→ MIDI ノート番号。不正なら null。 */
export function tonicToMidi(tonic: string): number | null {
  const m = tonic.trim().match(/^([A-Ga-g]#?)(-?\d+)$/);
  if (!m || m[1] === undefined || m[2] === undefined) return null;
  const g1 = m[1];
  const name = g1[0]!.toUpperCase() + g1.slice(1);
  const idx = NOTE_NAMES.indexOf(name);
  if (idx < 0) return null;
  return (parseInt(m[2], 10) + 1) * 12 + idx;
}

/**
 * 度数記法の旋律文字列 → 音符列。度数 `1`〜`5`（`0`=休符）／オクターブ `'`（上）`,`（下）／
 * 長さ `:拍`（省略で1拍）／空白区切り。不正トークンは黙って捨てる（authored データ前提の防御）。
 */
export function parseMelody(text: string): MelodyNote[] {
  return String(text)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((tok): MelodyNote | null => {
      const m = tok.match(/^([0-5])(['’,，]*)(?::(\d+(?:\.\d+)?))?$/);
      if (!m || m[1] === undefined) return null;
      let oct = 0;
      for (const ch of m[2] ?? '') oct += ch === "'" || ch === '’' ? 1 : -1;
      return { deg: +m[1], oct, beats: m[3] ? +m[3] : 1 };
    })
    .filter((n): n is MelodyNote => n !== null);
}

/** 度数（1〜5）＋オクターブ移動 → MIDI ノート番号（主音 tonicMidi・モード mode を基準）。 */
export function degreeToMidi(
  tonicMidi: number,
  mode: Mode,
  deg: number,
  oct: number,
): number {
  return tonicMidi + (MODES[mode][deg - 1] ?? 0) + 12 * oct;
}

/** 旋律の総拍数（休符も含む）。 */
export function totalBeats(notes: MelodyNote[]): number {
  return notes.reduce((a, n) => a + n.beats, 0);
}

/** 旋律の小節数（総拍 ÷ 1小節の拍、四捨五入）。即興音の配置範囲の基準。 */
export function totalBars(notes: MelodyNote[]): number {
  return Math.round(totalBeats(notes) / BEATS_PER_BAR);
}
