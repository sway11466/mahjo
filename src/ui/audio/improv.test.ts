import { improvSlots, nextWalkMidi } from './improv.ts';

describe('improv — 小節内の音配置（8分グリッド）', () => {
  it('density 0 は空、density で等間隔に並ぶ', () => {
    expect(improvSlots(0, 0)).toEqual([]);
    expect(improvSlots(1, 0)).toEqual([0]);
    expect(improvSlots(2, 0)).toEqual([0, 4]);
    expect(improvSlots(4, 0)).toEqual([0, 2, 4, 6]);
  });

  it('offset は拍単位でスロットをずらす（0.5=裏拍=1スロット）', () => {
    expect(improvSlots(2, 0.5)).toEqual([1, 5]);
    expect(improvSlots(1, 1)).toEqual([2]); // 1拍 = 2スロット
  });

  it('端は 8 で巻き戻る', () => {
    // offset 4拍 = 8スロット → 一周して元に戻る
    expect(improvSlots(2, 4)).toEqual([0, 4]);
  });
});

describe('improv — 音階ランダムウォーク（rng 注入で決定的）', () => {
  it('rng でウォーク方向が決まる（宮・tonic 72）', () => {
    // rng=0.9 → round(1.8)=2 → +1。0.9<0.15=false → オクターブ跳ねなし。
    const up = nextWalkMidi(2, 72, '宮', 0, () => 0.9);
    expect(up.idx).toBe(3);
    expect(up.midi).toBe(72 + 7); // 宮[3]=7
  });

  it('インデックスは [0, scale.length-1] に clamp', () => {
    // 上端：idx 4 で +1 しても 4 のまま。
    const high = nextWalkMidi(4, 72, '宮', 0, () => 0.9);
    expect(high.idx).toBe(4);
    expect(high.midi).toBe(72 + 9); // 宮[4]=9
    // 下端：idx 0 で −1 しても 0 のまま（rng=0 → round(0)-1=-1）。
    const low = nextWalkMidi(0, 72, '宮', 0, () => 0);
    expect(low.idx).toBe(0);
  });

  it('octave 引数でオクターブを上げる', () => {
    const r = nextWalkMidi(2, 72, '宮', 1, () => 0.9);
    expect(r.midi).toBe(72 + 12 + 7);
  });
});
