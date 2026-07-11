import {
  degreeToMidi,
  midiToFreq,
  parseMelody,
  tonicToMidi,
  totalBars,
  totalBeats,
} from './notation.ts';

describe('notation — 度数記法パース', () => {
  it('度数・拍・休符を読む', () => {
    expect(parseMelody('1 2 3')).toEqual([
      { deg: 1, oct: 0, beats: 1 },
      { deg: 2, oct: 0, beats: 1 },
      { deg: 3, oct: 0, beats: 1 },
    ]);
    expect(parseMelody('0 3:2 5')).toEqual([
      { deg: 0, oct: 0, beats: 1 },
      { deg: 3, oct: 0, beats: 2 },
      { deg: 5, oct: 0, beats: 1 },
    ]);
  });

  it('オクターブ記号 ` \' ` `,` を数える', () => {
    expect(parseMelody("1' 1'' 1,")).toEqual([
      { deg: 1, oct: 1, beats: 1 },
      { deg: 1, oct: 2, beats: 1 },
      { deg: 1, oct: -1, beats: 1 },
    ]);
  });

  it('不正トークンは黙って捨てる', () => {
    expect(parseMelody('1 x 9 2')).toEqual([
      { deg: 1, oct: 0, beats: 1 },
      { deg: 2, oct: 0, beats: 1 },
    ]);
    expect(parseMelody('   ')).toEqual([]);
  });
});

describe('notation — 音高解決', () => {
  it('tonicToMidi は音名＋オクターブを MIDI へ', () => {
    expect(tonicToMidi('C5')).toBe(72);
    expect(tonicToMidi('A4')).toBe(69);
    expect(tonicToMidi('F#3')).toBe(54);
    expect(tonicToMidi('bogus')).toBeNull();
  });

  it('degreeToMidi はモードの半音オフセットで解く', () => {
    // 宮 = [0,2,4,7,9]。deg は 1 始まり（index deg-1）。
    expect(degreeToMidi(72, '宮', 1, 0)).toBe(72);
    expect(degreeToMidi(72, '宮', 5, 0)).toBe(81);
    expect(degreeToMidi(72, '宮', 1, 1)).toBe(84); // 1 オクターブ上
    expect(degreeToMidi(72, '羽', 3, 0)).toBe(77); // 羽[2]=5
  });

  it('midiToFreq は A4=440Hz', () => {
    expect(midiToFreq(69)).toBeCloseTo(440, 5);
    expect(midiToFreq(81)).toBeCloseTo(880, 5);
  });
});

describe('notation — 小節換算', () => {
  it('総拍・小節数（4/4）', () => {
    const notes = parseMelody('1 2 3:2'); // 1+1+2 = 4 拍 = 1 小節
    expect(totalBeats(notes)).toBe(4);
    expect(totalBars(notes)).toBe(1);
    expect(totalBars(parseMelody('1 2 3 4 5 1 2 3'))).toBe(2); // 8 拍 = 2 小節
  });
});
