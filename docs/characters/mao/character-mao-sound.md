# キャラクター音楽（BGM）：まお

> **注：旧方式のデータ。** BGM は音源ファイル方式へ移行した（[ADR-0004](../../adr/ADR-0004-bgm-audio-files.md)・[sound.md](../../design/sound.md)「BGM の制作」）。本書の度数記法・即興音は旧方式（コード生成・ADR-0003 Superseded）の楽譜で、新方式の曲（`.mscz` → `.m4a`）を作るときに制作ノート（曲の狙い・調・テンポ・小節数・ループ長・ラウドネス）へ書き直す。旋律の狙い（下記「方向性」）はたたき台として引き継ぐ。移行作業は [backlog](../../backlog.md) feature-21。

> まお個別の素性・ビジュアル・セリフは [character-mao.md](./character-mao.md)。本書はまおの BGM（主旋律・即興音）を持つ。

まおの BGM の旧楽譜（主旋律＝度数記法＋即興音＝セグメント配列）。旧方式のコードとオーサリングツール（tools/melody-authoring）は撤去済みで、本書の記法は読み物としてだけ残る。

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

即興音（主旋律の合間を飾る毎回ちがう音）。セグメント配列＝`{ start, length, instrument, density, octave, offset, volume, brightness, sustain }`（`start`＝開始小節・`start+length` で配置、同じ `start` に重ねると声部が重なる）。主旋律の起伏に合わせ、前半は疎（density 1）、中盤（8〜24小節）でやや密（density 2）、終盤で疎に戻す、控えめな撥弦（琴）。

```
即興音 = [
  { start: 0,  length: 8, instrument: pluck, density: 1, octave: 1, offset: 0, volume: 0.4, brightness: 3000, sustain: 0.40 },
  { start: 8,  length: 8, instrument: pluck, density: 2, octave: 1, offset: 0, volume: 0.4, brightness: 3000, sustain: 0.40 },
  { start: 16, length: 8, instrument: pluck, density: 2, octave: 1, offset: 0, volume: 0.4, brightness: 3000, sustain: 0.40 },
  { start: 24, length: 8, instrument: pluck, density: 1, octave: 1, offset: 0, volume: 0.4, brightness: 3000, sustain: 0.40 },
]
```
