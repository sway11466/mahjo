# キャラクター音楽（BGM）：まお

> まお個別の素性・ビジュアル・セリフは [character-mao.md](./character-mao.md)。本書はまおの BGM（主旋律・即興音）を持つ。

まおの BGM。コード生成方式（Web Audio 合成・音源ファイルなし）の二層構成＝主旋律（キャラごとの決まった旋律・度数記法）＋即興音（主旋律の合間を飾る毎回ちがう音・セグメント配列）。記法の編集・試聴は開発ツール [tools/melody-authoring](../../../tools/melody-authoring/) で行う（各設定値の意味・取り得る値もツールに集約）。

> BGM アーキテクチャの正式ドキュメント（ADR・sound.md 等）は未整備。主旋律／即興音の最終データ形式は検討中で、下記のフィールド名・構造は暫定（正式化時に変わりうる）。

## 主旋律

方向性＝優しいけど元気。前半16小節は落ち着いた素直な歌、中盤8小節で一気に駆け上がり、後半8小節でまた落ち着く（全32小節でループ）。駆け上がりには好きな役＝一気通貫のフック（まっすぐ上る `1 2 3 4 5`）を織り込み、まっすぐで前向きな性格を出す。明るい宮調・歯切れよい撥弦（琴）で元気さを、中庸すぎない起伏で優しさを両立させる。

```
instrument: pluck        // 撥弦（琴）
tonic:      C5           // 主音
mode:       宮           // 明るい（長音階ペンタ）。音程 0,2,4,7,9（主音からの半音）
tempo:      96           // BPM
brightness: 5300         // Hz（明るさ＝ローパス）
sustain:    0.25         // 余韻（歯切れ）
melody:     1 2 3 2 3 5 3:2 5 3 2 1 2 3 1:2 1 2 3 5 5 1' 5:2 3 5 3 2 1 2 1:2 5, 1 2 3 2 3 2:2 3 2 1 2 3 2 1:2 1 2 3 2 3 5 3:2 2 3 5 3 3 2 1:2 1 2 3 4 5 1' 2' 3' 2' 1' 5 3 5 1' 2' 5 1 2 3 4 5 1' 2' 3' 3' 2' 1' 5 1' 5 3 5 3' 2' 1' 5 3 5 3:2 5 3 2 1 2 3 2:2 1 2 3 2 3 2 1 2 2 3 2 1 3 2 1:2
```

度数記法：度数 `1`〜`5`（音階の低い方から・主音=1）／オクターブ `'` 上 `,` 下／長さ `:拍`（既定1）／休符 `0`／空白区切り。モード（調）は同じ度数でも実音程が変わる（宮＝明るい／羽＝翳り 等）。

## 即興音

即興音（主旋律の合間を飾る毎回ちがう音）。セグメント配列＝`{ start, length, instrument, density, octave, offset, volume, brightness, sustain }`（`start`＝開始小節・`start+length` で配置、同じ `start` に重ねると声部が重なる）。主旋律の起伏に合わせ、前半は疎（density 1）、中盤（8〜24小節）でやや密（density 2）、終盤で疎に戻す、控えめな撥弦（琴）。各項目の意味・取り得る値は開発ツール（冒頭リンク）に集約。

```
即興音 = [
  { start: 0,  length: 8, instrument: pluck, density: 1, octave: 1, offset: 0, volume: 0.4, brightness: 3000, sustain: 0.40 },
  { start: 8,  length: 8, instrument: pluck, density: 2, octave: 1, offset: 0, volume: 0.4, brightness: 3000, sustain: 0.40 },
  { start: 16, length: 8, instrument: pluck, density: 2, octave: 1, offset: 0, volume: 0.4, brightness: 3000, sustain: 0.40 },
  { start: 24, length: 8, instrument: pluck, density: 1, octave: 1, offset: 0, volume: 0.4, brightness: 3000, sustain: 0.40 },
]
```
