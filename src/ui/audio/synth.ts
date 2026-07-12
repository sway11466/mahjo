/**
 * BGM の音色合成（Web Audio）。6楽器＝撥弦(Karplus-Strong)／鐘(FM)／木琴／笛／弓／揚琴(KS弦+金属アタック)。
 * 移植元は tools/melody-authoring（ADR-0003：ツールとは当面コピー二重）。IO 層＝人手で音を確認する
 * （testing.md §6）。純ロジック（音高・配置）は notation.ts／improv.ts に分離済み。
 */
import type { Instrument } from '../../types/index.ts';

export interface VoiceOptions {
  bus: AudioNode; // 出力先ノード
  vel: number; // 音量（0〜1）
  len: number; // 余韻パラメータ（0〜1）
  hold: number; // 音を保持する秒数（持続系＝笛・弓が使う）
}

export type InstrumentVoice = (
  ctx: AudioContext,
  freq: number,
  when: number,
  opts: VoiceOptions,
) => void;

/** 撥弦（琴）＝Karplus-Strong。 */
const pluck: InstrumentVoice = (ctx, freq, when, { bus, vel, len }) => {
  const damping = 0.985 + len * 0.0142;
  const dur = 2.2 + len * 3.0;
  const N = Math.max(2, Math.round(ctx.sampleRate / freq));
  const L = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, L, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < N; i++) d[i] = Math.random() * 2 - 1;
  for (let i = N; i < L; i++) d[i] = damping * 0.5 * (d[i - N]! + d[i - N + 1]!);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(vel, when + 0.005);
  src.connect(g).connect(bus);
  src.start(when);
  src.stop(when + dur);
};

/** 鐘（ベル）＝FM 合成。 */
const bell: InstrumentVoice = (ctx, freq, when, { bus, vel, len }) => {
  const dur = 1.2 + len * 3.5;
  const car = ctx.createOscillator();
  car.type = 'sine';
  car.frequency.value = freq;
  const mod = ctx.createOscillator();
  mod.type = 'sine';
  mod.frequency.value = freq * 1.41;
  const mg = ctx.createGain();
  mg.gain.setValueAtTime(freq * 4, when);
  mg.gain.exponentialRampToValueAtTime(freq * 0.02, when + dur * 0.6);
  mod.connect(mg).connect(car.frequency);
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0.0001, when);
  amp.gain.linearRampToValueAtTime(vel, when + 0.004);
  amp.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  car.connect(amp).connect(bus);
  car.start(when);
  mod.start(when);
  car.stop(when + dur + 0.05);
  mod.stop(when + dur + 0.05);
};

/** 木琴。 */
const mallet: InstrumentVoice = (ctx, freq, when, { bus, vel, len }) => {
  const dur = 0.3 + len * 1.3;
  (
    [
      [1, vel, dur],
      [4, vel * 0.35, dur * 0.5],
    ] as const
  ).forEach(([mult, v, dd]) => {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = freq * mult;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(v, when + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dd);
    o.connect(g).connect(bus);
    o.start(when);
    o.stop(when + dd + 0.05);
  });
};

/** 笛。 */
const flute: InstrumentVoice = (ctx, freq, when, { bus, vel, len, hold }) => {
  const rel = 0.15 + len * 0.6;
  const atk = 0.06;
  const o = ctx.createOscillator();
  o.type = 'triangle';
  o.frequency.value = freq;
  const vib = ctx.createOscillator();
  vib.frequency.value = 5;
  const vg = ctx.createGain();
  vg.gain.value = freq * 0.006;
  vib.connect(vg).connect(o.frequency);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, when);
  g.gain.linearRampToValueAtTime(vel * 0.55, when + atk);
  g.gain.setValueAtTime(vel * 0.55, when + atk + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, when + atk + hold + rel);
  o.connect(g).connect(bus);
  const end = when + atk + hold + rel + 0.05;
  o.start(when);
  vib.start(when);
  o.stop(end);
  vib.stop(end);
};

/** 弓（胡弓ふう）。 */
const bowed: InstrumentVoice = (ctx, freq, when, { bus, vel, len, hold }) => {
  const rel = 0.2 + len * 0.5;
  const atk = 0.12;
  const o = ctx.createOscillator();
  o.type = 'sawtooth';
  o.frequency.value = freq;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = freq * 5;
  const vib = ctx.createOscillator();
  vib.frequency.value = 5.5;
  const vg = ctx.createGain();
  vg.gain.value = freq * 0.008;
  vib.connect(vg).connect(o.frequency);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, when);
  g.gain.linearRampToValueAtTime(vel * 0.4, when + atk);
  g.gain.setValueAtTime(vel * 0.4, when + atk + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, when + atk + hold + rel);
  o.connect(lp).connect(g).connect(bus);
  const end = when + atk + hold + rel + 0.05;
  o.start(when);
  vib.start(when);
  o.stop(end);
  vib.stop(end);
};

/** 揚琴（ヤンチン）＝竹のばちで叩く金属弦。撥弦（爪弾く琴）との差は「叩いた立ち上がり」。 */
const yangqin: InstrumentVoice = (ctx, freq, when, { bus, vel, len }) => {
  const damping = 0.99 + len * 0.008;
  const dur = 2.6 + len * 3.4;
  // ① 弦の胴＝Karplus-Strong を course で3本、微妙にずらして重ね、伸びと煌めき（シャン…）を出す。
  // ループフィルタを明るめ（0.8/0.2）にして金属的に伸ばす。
  (
    [
      [1, 0.42],
      [1.0012, 0.34],
      [0.9991, 0.3],
    ] as const
  ).forEach(([dt, amp]) => {
    const f = freq * dt;
    const N = Math.max(2, Math.round(ctx.sampleRate / f));
    const L = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, L, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < N; i++) d[i] = Math.random() * 2 - 1;
    for (let i = N; i < L; i++) d[i] = damping * (0.8 * d[i - N]! + 0.2 * d[i - N + 1]!);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(vel * amp, when + 0.002);
    src.connect(g).connect(bus);
    src.start(when);
    src.stop(when + dur);
  });
  // ② 打撃の金属アタック（ばちが弦を叩くチン）。非整数倍音を短い減衰で重ね、撥弦との差を出す。
  (
    [
      [4.1, 0.12, 0.14],
      [6.7, 0.07, 0.1],
    ] as const
  ).forEach(([mult, v, dd]) => {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = freq * mult;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(vel * v, when + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dd);
    o.connect(g).connect(bus);
    o.start(when);
    o.stop(when + dd + 0.05);
  });
};

const INSTRUMENTS: Record<Instrument, InstrumentVoice> = {
  pluck,
  bell,
  mallet,
  flute,
  bowed,
  yangqin,
};

/** 楽器名 → 合成関数（未知は撥弦にフォールバック）。 */
export function voiceFor(instrument: Instrument): InstrumentVoice {
  return INSTRUMENTS[instrument] ?? pluck;
}

/** 残響用インパルス応答（ノイズ指数減衰）を作る。 */
export function reverbIR(ctx: AudioContext, sec: number, decay: number): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * sec);
  const ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  return ir;
}
