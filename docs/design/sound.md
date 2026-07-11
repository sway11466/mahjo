# 効果音・音楽（音まわり）

SE（効果音）と BGM（音楽）の方針。設定の型は [data-model](./data-model.md) §15 `AppSettings`、実装は parking lot（[backlog](../backlog.md)）。MVP は無音で成立し、設定トグルだけ先に用意してよい。

## 設定

- SE と BGM を分離（`AppSettings.se` / `bgm`）。音量スライダーは持たず on/off のみ（音量は後からスライダーを足しても互換に拡張できる）。
- 既定：BGM オフ・SE オン（BGM は学習中ずっと鳴るため既定オフ）。

## 方針（プレッシャーをかけない）

- 「プレッシャーをかけない」（[product-concept](../product-concept.md)）を音にも適用する。
- 不正解音は“罰”にせず、やわらかい気づき音に。
- BGM は集中を妨げない環境音的ループに。

## BGM の実現方式（コード生成・2層）

BGM は**素の Web Audio API によるコード生成**で鳴らす。音源ファイルも音楽ライブラリ（Tone.js 等）も使わない（サイズ・権利・PWAオフライン・「キャラ追加＝データだけ」の都合。判断の記録は [ADR-0003](../adr/ADR-0003-bgm-code-generation.md)）。曲は**2層構成**で持つ。

- **主旋律（しゅせんりつ）** … キャラごとの決まった旋律。度数記法で1本の文字列として書く（下記）。
- **即興音（そっきょうおん）** … 主旋律の合間を飾る、毎回ちがう生成音。セグメント配列で区間・楽器・密度だけを指定し、実音は再生時に生成する（下記）。

層の分担は [architecture.md](./architecture.md) §2 に従う（SE と同じ音 IO）：**データ（何を鳴らすか）は characters 層**（キャラ固有の主旋律・即興音を `Character` のデータとして持つ）、**合成・スケジューリング（どう鳴らすか）は ui 層**（度数記法のパース・音色合成・小節スケジューリング・再生/停止）。engine（麻雀計算）には入れない。キャラ別データの正は各 `character-<id>-sound.md`（[character-guide.md](../characters/character-guide.md) §5「ファイル構成」）。

作曲・試聴は開発ツール [tools/melody-authoring](../../tools/melody-authoring/) で行う（アプリ本体・公開サイトには同梱しない独立物）。各パラメータの意味・取り得る値の詳細はツールに集約する（本節は語彙の正だけを置く）。

### 主旋律：度数記法

音階は半音を含まない5音（ペンタトニック）なので、度数 `1`〜`5`（音階の低い方から・主音＝`1`）だけで書ける。

- 音符：度数 `1`〜`5`。
- オクターブ：`'` で1つ上、`,` で1つ下（重ねると複数）。例 `1'`＝主音の1オクターブ上、`5,`＝5度の1オクターブ下。
- 長さ：`:拍数`（省略で1拍）。例 `3:2`＝度数3を2拍。
- 休符：`0`（`0:2` で2拍の休み）。
- 区切り：空白。

主旋律はこの旋律文字列に、次の設定を添えて持つ：楽器（`instrument`）・主音（`tonic`）・モード（`mode`＝調）・テンポ（`tempo`・BPM）・明るさ（`brightness`・ローパス Hz）・余韻（`sustain`・0〜1）。

- **楽器（5種）**：撥弦（琴）`pluck` / 鐘 `bell` / 木琴 `mallet` / 笛 `flute` / 弓 `bowed`。すべて合成（撥弦＝Karplus-Strong、鐘＝FM合成、木琴・笛・弓＝オシレーター＋エンベロープ）。
- **モード（調・5種）**：宮 / 商 / 角 / 徵 / 羽（宮＝明るい 〜 羽＝翳り）。同じ度数でも実音程が変わり、旋律の形はそのままに明暗の色だけを変えられる（半音オフセット＝宮 `0,2,4,7,9` / 商 `0,2,5,7,10` / 角 `0,3,5,8,10` / 徵 `0,2,5,7,9` / 羽 `0,3,5,7,10`）。

### 即興音：セグメント配列

即興音は `{ start, length, instrument, density, octave, offset, volume, brightness, sustain }` のセグメントを並べた配列。同じ `start` に重ねると声部が重なる。音は8分グリッドに整列する。

| フィールド | 意味 |
|---|---|
| `start` / `length` | 開始小節 / 続く小節数（`start`〜`start+length` に配置） |
| `instrument` | 楽器（上の5種。主旋律と別に選べる） |
| `density` | その小節で鳴らす音数。`0`＝休み（目安 0〜6） |
| `octave` | オクターブ移動 |
| `offset` | 拍からのずらし（拍数。`0`＝拍ぴったり／`0.5`＝裏拍） |
| `volume` | 音量 |
| `brightness` | 明るさ（この即興音のローパス Hz） |
| `sustain` | 余韻（0〜1） |

## ボイス（キャラ音声）

- 当面なし。理由：セリフプール×キャラ分のクリップ生成・管理が要り、「キャラ追加＝データ＋画像だけ」の軽量運用（[character-guide](../characters/character-guide.md)）を崩すため。
- 将来やる場合も「短い掛け声のみ」等の限定運用から検討する。

## 効果音一覧（SE）

必要な SE を場面（`ReactionTrigger`＝[data-model](./data-model.md) §13・[session.md](../spec/session.md) §4）と画面操作から洗い出した一覧。優先度＝MVP（最初に要る最小セット）／次／後。音の方向性は上記「方針（プレッシャーをかけない）」に従う（不正解は罰でなく気づき音）。

| 用途 | 場面/操作 | 音のイメージ | 優先 |
|---|---|---|---|
| 牌を置く | `dealing`（出題表示） | 「カチッ／パチン」牌が並ぶ | MVP |
| 選択肢タップ | 4択を選ぶ | 軽い「コッ／ポッ」 | MVP |
| 正解 | `correct` | 明るく短い「チャラン♪」（やわらか） | MVP |
| 不正解 | `wrong` | 罰にしない「ポフッ／ことん」 | MVP |
| セッション終了 | `finished` | 短いお祝いファンファーレ | MVP |
| ヒント | `hinting`（使い魔の示唆） | 「ふわっ／きらん」気づき音 | 次 |
| 解説ハイライト | 解説項目クリック→牌が光る | ごく軽い「ぴこ」 | 次 |
| ボタン/メニュー | ハンバーガー等の開閉 | 「コトッ」 | 次 |
| あいさつ | `greeting` | 鈴の音など登場音（任意） | 後 |

- `explaining` は連続した説明のため専用音を持たない（解説項目クリック＝「解説ハイライト」で代用）。
- 将来キャラ連動で音を差し替える余地はあるが、当面は中立 SE 一式で成立させる（`Character.sounds` は未導入）。

## 制作

### ライセンス方針（権利表記をしない）

SE は**権利表記が不要なライセンスに統一**する。理由：本アプリは public リポジトリ＋静的ホスティング配信があり得るため、「ファイルそのものの再配布」に文言上ふれうる素材（CC BY や独自規約＝表記必要／再配布制限あり）は避け、表記・再配布の判断を持ち込まない方がシンプル（[architecture](./design/architecture.md) 冒頭＝意図の読みやすさ優先）。

採用するのは次のどちらか：

- **CC0（パブリックドメイン相当）** … 表記不要・再配布も自由。public リポでも気にしなくてよい。
- **自分で AI 生成した音**（ElevenLabs Sound Effects 等。有料プラン出力は商用可・帰属不要） … 自前素材になるので権利の問い自体が消える。

避けるもの：CC BY（表記必要）、効果音ラボ等の独自規約（表記は不要だが「ファイル再配布禁止」が残り、public リポで生ファイルが裸で取れる状態がグレーになる）。

### 調達先（表記不要・商用OK）

- [Kenney – Audio packs（CC0）](https://kenney.nl/assets?q=audio) … UI Audio / Interface Sounds。クリック・ぴこ・コトッ等の UI 系をまとめ取りできる第一候補。
- [Pixabay 効果音（表記不要）](https://pixabay.com/sound-effects/search/cc0/) … 牌音・正解音・ファンファーレ向き（[mahjong tiles](https://pixabay.com/sound-effects/search/mahjong%20tiles/) に牌音あり）。
- 補助：[OpenGameArt CC0](https://opengameart.org/content/cc0-sound-effects)／[itch.io CC0 SFX](https://itch.io/c/4003879/cc0-sfx-and-voices)／[ZapSplat CC0 1.0](https://www.zapsplat.com/license-type/cc0-1-0-universal/)。

集め方の目安：UI 系（選択肢・ぴこ・メニュー）は Kenney で一括、牌音・正解・不正解・ファンファーレは Pixabay で個別に拾う。これで全て表記不要に揃う。生成物・取得物は静的アセット化でき、バックエンド無し・PWAオフラインと両立する。

### ライセンス台帳（表記不要でも記録は残す）

表記が不要でも、後で「これ表記要るんだっけ？」と悩まないため、SE ごとに **ファイル名／出所URL／ライセンス種別** を1枚の台帳に残す（アバター画像の master 管理と同じ発想＝[character-guide](../characters/character-guide.md)）。置き場は収集着手時に決める（候補：`docs/dev/` か `src/assets/` 同梱の `CREDITS`）。収集作業のバックログは [backlog](../backlog.md) feature-9。

## 技術詳細（UI/audio 着手時に詰める）

- autoplay 制限・precache・キャラ連動（将来 `Character.sounds`）等は実装時に確定。
