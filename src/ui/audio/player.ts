/**
 * BGM プレイヤー（Web Audio・IO 層）。楽譜データ（主旋律＋即興音）を先読みスケジューリングで鳴らす。
 * 音高・配置の純ロジックは notation.ts／improv.ts、音色は synth.ts。ここは AudioContext 上の
 * グラフ構築・ループ・クロスフェード用ゲインを持つ。移植元は tools/melody-authoring（ADR-0003）。
 */
import type { BgmData } from '../../types/index.ts';
import {
  BEATS_PER_BAR,
  degreeToMidi,
  midiToFreq,
  parseMelody,
  tonicToMidi,
  totalBars,
} from './notation.ts';
import { SLOTS, improvSlots, nextWalkMidi } from './improv.ts';
import { reverbIR, voiceFor } from './synth.ts';

/** 先読み窓（秒）とスケジューラの起動間隔（ms）。 */
const LOOKAHEAD = 0.2;
const TICK_MS = 25;
const DEFAULT_TONIC_MIDI = 72; // C5（tonic 解決に失敗したときの保険）

export interface Player {
  /** クロスフェード：ゲインを target（0〜1）へ dur 秒で寄せる。 */
  fadeTo: (target: number, dur: number) => void;
  /** 停止：フェードアウトしてからノードを解放する。 */
  stop: (fadeSec?: number) => void;
}

/**
 * 楽譜データを鳴らすプレイヤーを起動する。出力は専用のクロスフェード用ゲイン→destination。
 * rng は即興音のランダムウォーク用（既定 Math.random）。同じ ctx に複数プレイヤーを重ねられる
 * （キャラ切替のクロスフェード）。有効な音符が無ければ無音のプレイヤーを返す。
 */
export function createPlayer(
  ctx: AudioContext,
  bgm: BgmData,
  rng: () => number = Math.random,
): Player {
  const { melody, improv } = bgm;
  const notes = parseMelody(melody.notes);
  const tonicMidi = tonicToMidi(melody.tonic) ?? DEFAULT_TONIC_MIDI;
  const bars = totalBars(notes);

  // クロスフェード用の最終ゲイン（0 から始めて fadeTo で上げる）。
  const out = ctx.createGain();
  out.gain.value = 0;
  out.connect(ctx.destination);

  const fadeTo = (target: number, dur: number) => {
    const now = ctx.currentTime;
    const cur = out.gain.value;
    out.gain.cancelScheduledValues(now);
    out.gain.setValueAtTime(cur, now);
    out.gain.linearRampToValueAtTime(target, now + Math.max(0.001, dur));
  };

  // 音符が無ければ鳴らさない（グラフだけ返す）。
  if (!notes.some((n) => n.deg !== 0)) {
    return { fadeTo, stop: () => out.disconnect() };
  }

  // オーディオグラフ（tools/melody-authoring の buildGraph 相当。master は out）。
  const master = ctx.createGain();
  master.gain.value = 0.9;
  master.connect(out);
  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = melody.brightness;
  const dryG = ctx.createGain();
  dryG.gain.value = 0.85;
  const wetG = ctx.createGain();
  wetG.gain.value = 0.4;
  const conv = ctx.createConvolver();
  conv.buffer = reverbIR(ctx, 3.5, 2.6);
  const melBus = ctx.createGain();
  melBus.gain.value = 0.9;
  melBus.connect(lowpass);
  lowpass.connect(dryG).connect(master);
  lowpass.connect(conv).connect(wetG).connect(master);

  const playImprovNote = (
    midi: number,
    when: number,
    seg: (typeof improv)[number],
  ) => {
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = seg.brightness;
    const pan = ctx.createStereoPanner();
    pan.pan.value = (Math.random() * 2 - 1) * 0.6;
    lp.connect(pan);
    pan.connect(dryG);
    pan.connect(conv);
    voiceFor(seg.instrument)(ctx, midiToFreq(midi), when, {
      bus: lp,
      vel: seg.volume,
      len: seg.sustain,
      hold: 0.5,
    });
  };

  const beat = 60 / melody.tempo;
  const barDur = beat * BEATS_PER_BAR;
  const t0 = ctx.currentTime + 0.12;
  const mel = { next: t0, step: 0 };
  const imp = { next: t0, bar: 0 };
  const walks: Record<number, { idx: number }> = {};

  const tick = () => {
    const limit = ctx.currentTime + LOOKAHEAD;
    // 主旋律（無限ループ）。
    while (mel.next < limit) {
      const n = notes[mel.step % notes.length]!;
      if (n.deg !== 0) {
        voiceFor(melody.instrument)(
          ctx,
          midiToFreq(degreeToMidi(tonicMidi, melody.mode, n.deg, n.oct)),
          mel.next,
          { bus: melBus, vel: 0.6, len: melody.sustain, hold: n.beats * beat },
        );
      }
      mel.next += n.beats * beat;
      mel.step++;
    }
    // 即興音（主旋律の小節範囲に整列してループ）。
    if (bars > 0) {
      while (imp.next < limit) {
        const bi = imp.bar % bars;
        improv.forEach((seg, si) => {
          if (bi < seg.start || bi >= seg.start + seg.length) return;
          const walk = walks[si] ?? (walks[si] = { idx: 2 });
          for (const slot of improvSlots(seg.density, seg.offset)) {
            const r = nextWalkMidi(walk.idx, tonicMidi, melody.mode, seg.octave, rng);
            walk.idx = r.idx;
            playImprovNote(r.midi, imp.next + (slot / SLOTS) * barDur, seg);
          }
        });
        imp.next += barDur;
        imp.bar++;
      }
    }
  };

  tick();
  const timer = setInterval(tick, TICK_MS);

  return {
    fadeTo,
    stop: (fadeSec = 0.3) => {
      clearInterval(timer);
      fadeTo(0, fadeSec);
      // フェード後にグラフを解放（残響の尾は無音なので切ってよい）。
      setTimeout(() => out.disconnect(), Math.ceil((fadeSec + 0.1) * 1000));
    },
  };
}
