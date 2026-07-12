/**
 * BGM（背景音楽）の楽譜データ。方式＝コード生成（素の Web Audio 合成・音源ファイルなし）の2層構成
 * ＝主旋律（キャラ固有の決まった旋律・度数記法）＋即興音（合間を飾る毎回ちがう生成音）。
 * 正は docs/design/sound.md「BGM の実現方式」・docs/adr/ADR-0003。キャラ別の曲は character-<id>-sound.md。
 *
 * ここは「楽譜」に相当するデータ型だけ（characters 層が持つ）。度数記法のパース・音色合成・
 * スケジューリングは ui 層（src/ui/audio）＝architecture §2。
 */

/** 楽器（音色）。すべて Web Audio で合成（撥弦=Karplus-Strong／鐘=FM／木琴・笛・弓=OSC／揚琴=KS弦+金属アタック）。 */
export type Instrument = 'pluck' | 'bell' | 'mallet' | 'flute' | 'bowed' | 'yangqin';

/** モード（調＝音階の色合い）。宮＝明るい 〜 羽＝翳り。主音からの半音オフセットは notation.ts。 */
export type Mode = '宮' | '商' | '角' | '徵' | '羽';

/** 主旋律。度数記法の旋律文字列＋音色・調・テンポ等の設定。 */
export interface BgmMelody {
  instrument: Instrument;
  tonic: string; // 主音。音名＋オクターブ（例 'C5'）
  mode: Mode;
  tempo: number; // BPM
  brightness: number; // ローパス遮断 Hz（こもり↔きらびやか）
  sustain: number; // 余韻 0〜1
  /** 度数記法の旋律。度数 1〜5・オクターブ `'`/`,`・長さ `:拍`・休符 `0`・空白区切り。 */
  notes: string;
}

/**
 * 即興音の1セグメント。`start`〜`start+length` 小節の区間に、density 個/小節の音を生成する。
 * 同じ start に重ねると声部が重なる。音は8分グリッドに整列。各値の意味は sound.md「即興音」。
 */
export interface ImprovSegment {
  start: number; // 開始小節
  length: number; // 続く小節数
  instrument: Instrument;
  density: number; // その小節で鳴らす音数（0=休み）
  octave: number; // 主音から何オクターブ上
  offset: number; // 拍からのずらし（拍数。0=拍ぴったり／0.5=裏拍）
  volume: number; // 音量 0〜1
  brightness: number; // この即興音のローパス Hz
  sustain: number; // 余韻 0〜1
}

/** キャラ1体分の BGM 楽譜データ（主旋律＋即興音）。未指定キャラは無音（中立曲は持たない）。 */
export interface BgmData {
  melody: BgmMelody;
  improv: ImprovSegment[];
}
