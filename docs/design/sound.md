# 効果音・音楽（音まわり）

SE（効果音）と BGM（音楽）の方針。設定の型は [data-model](./data-model.md) §15 `AppSettings`。**BGM は音源ファイル方式**（MuseScore で自作アレンジした AAC を再生＝下記「BGM の実現方式」「BGM の制作」・[ADR-0004](../adr/ADR-0004-bgm-audio-files.md)）。実装は旧方式（コード生成＝[ADR-0003](../adr/ADR-0003-bgm-code-generation.md)・Superseded）が `src/ui/audio` に残っており、置き換えは [backlog](../backlog.md) feature-21。**SE は未実装**（素材収集＝[backlog](../backlog.md) feature-9・再生配線＝parking lot「音の実装」）で、SE 無しでもアプリは成立する。

## 設定

- SE と BGM を分離（`AppSettings.se` / `bgm`）。音量スライダーは持たず on/off のみ（音量は後からスライダーを足しても互換に拡張できる）。
- 既定：BGM オフ・SE オン（BGM は学習中ずっと鳴るため既定オフ）。

## 方針（プレッシャーをかけない）

- 「プレッシャーをかけない」（[product-concept](../product-concept.md)）を音にも適用する。
- 不正解音は“罰”にせず、やわらかい気づき音に。
- BGM は集中を妨げない環境音的ループに。

## BGM の実現方式（音源ファイル・キャラ別1曲）

BGM は **MuseScore で自作アレンジした音源ファイル**を鳴らす。音楽ライブラリ（Tone.js 等）は使わず、再生は素の Web Audio API。制作方式は Senaris（オーナーの別プロダクト）と同じで、Web 向けに形式と配布だけ変えている（判断の記録は [ADR-0004](../adr/ADR-0004-bgm-audio-files.md)）。

- **曲の単位** … キャラ別に1曲。`Character.bgm` が音源のアセットパス（例 `characters/mao/mao-bgm.m4a`）を指す（型は [data-model](./data-model.md) §13）。未指定のキャラは無音（中立曲は持たない）。
- **形式** … AAC（`.m4a`）・96 kbps・44.1 kHz・ステレオ。全ブラウザ（Safari 含む）で再生でき、60〜90秒のループ1曲が 1 MB 前後。Ogg Vorbis は Safari で鳴らないため採らない。
- **配布（precache に入れない）** … BGM は既定オフなので PWA のオフライン初回容量に乗せない。`vite-plugin-pwa` の `workbox.globIgnores` で `**/*.m4a` を precache から外し、`runtimeCaching`（CacheFirst）で「オンにして取得したら以後はオフラインでも鳴る」にする。
- **再生** … `fetch → decodeAudioData → AudioBufferSourceNode`（`loop=true`）。継ぎ目なしでループし、下記の「ループ加工」をした音源がそのまま活きる。`loopEnd` には楽譜から求めたループ長 L（下記）を入れ、コーデックの末尾パディングに左右されないようにする。autoplay 解禁は最初のユーザー操作（AudioContext を resume）、キャラ切替は旧→新のクロスフェード、トグルオフ／曲なしキャラで停止。アプリ全体で1本（App ルートのコントローラ）。
- **層の分担** … [architecture.md](./architecture.md) §2 のまま。**characters 層はアセットパス（データ）だけ**、**取得・デコード・再生の IO は ui 層**（`src/ui/audio`）。engine（麻雀計算）には入れない。アセットパス→実 URL の解決は画像と同じ `assetUrl`（`import.meta.glob` の対象に `m4a` を加える）。

キャラ別の制作ノート（曲の狙い・調・テンポ・小節数・ループ長・ラウドネス）は各 `character-<id>-sound.md`（[character-guide.md](../characters/character-guide.md) §5「ファイル構成」）。

## BGM の制作（Senaris と同じ手順）

ゼロから作曲はせず、AI 支援で出した旋律のたたき台を土台に MuseScore で編曲・仕上げをする。良し悪しの判断と仕上げは制作者が行う。

### ツール

- Muse Hub — Muse 社の配布・更新ランチャー。下記を入れる入口。
- MuseScore Studio — 楽譜作成ソフト本体。制作・編集はこれ。
- Muse Sounds — 高品質音源。Muse Hub 経由で入れる。
- ffmpeg — WAV のループ加工と AAC への変換・ラウドネス測定。

### データ形式と置き場

| 形式 | 拡張子 | 役割 | 置き場 | 扱い |
|---|---|---|---|---|
| MuseScore 原本 | `.mscz` | 編曲の原本 | `docs/characters/<id>/<id>-bgm.mscz` | **必ず残す**（後で直せる）。ビルド非搭載 |
| MusicXML / MIDI | `.musicxml` / `.mid` | たたき台の受け渡し | `docs/characters/<id>/original/` | 任意 |
| WAV | `.wav` | 書き出し中間物（44.1 kHz／16 bit／ステレオ） | — | コミットしない（`.mscz` から再生成できる） |
| AAC | `.m4a` | 最終成果物 | `src/assets/characters/<id>/<id>-bgm.m4a` | 生成物だが画像と同じくコミットする（置けば鳴る運用） |

MuseScore のバックアップ（`.mscbackup/`）はコミットしない。

### ワークフロー

```
たたき台（AI支援で出した .musicxml / .mid）
  → 編曲（MuseScore、原本 .mscz で保存）
  → 書き出し（.wav＝44.1 kHz / 16 bit / ステレオ）
  → ループ長 L の算出（小節数・拍子・テンポから）
  → ループ加工（L で切り、切った残響を先頭に足す）
  → 変換（ffmpeg で AAC → src/assets/characters/<id>/<id>-bgm.m4a）
```

ループ長は楽譜から求める：`L = 小節数 × 1小節の拍数 × 60 ÷ テンポ(♩)`（例：32小節・4/4・♩=96 → 80.000秒）。

MuseScore の書き出しは末尾に残響のしっぽが付く。ループ長ちょうどに切り（切らないと1周ごとに無音が入る）、切り落とした残響を先頭に足し込む（捨てると継ぎ目で不連続が聞こえる）。

```
ffmpeg -i in.wav -i in.wav -filter_complex \
  "[0]atrim=0:<L>,asetpts=PTS-STARTPTS[body];\
   [1]atrim=<L>,asetpts=PTS-STARTPTS,apad=whole_dur=<L>[tail];\
   [body][tail]amix=inputs=2:normalize=0:duration=first[out]" -map "[out]" looped.wav

ffmpeg -i looped.wav -c:a aac -b:a 96k src/assets/characters/<id>/<id>-bgm.m4a
```

`normalize=0` は必須（省略すると音量が半分になる）。確認すること：先頭に無音があれば加工前に落とす／加工後のピークが元と変わっていない（加算でクリップしていない）／ブラウザで継ぎ目を実聴し、ズレがあれば再生側の `loopStart`／`loopEnd` で合わせる。適用条件は 残響長 < ループ長（残響が長い曲は MuseScore で2周に複製して書き出し `[L, 2L]` を切り出す）。副作用として曲の頭に「前周の残響」が小さく入る（Senaris で実聴し違和感なしを確認済み）。

この一連はコマンド数本なので、Senaris の `gen_bgm.ps1` に相当するスクリプトを `tools/` に置く（feature-21 の実装時）。

### 音量 — 統合ラウドネス -23 LUFS 目安

曲どうしの聞こえの大きさは統合ラウドネス（LUFS。聴感上の大きさの指標。ピーク dBFS は歪みの有無しか測れない）でそろえる。目安は -23 LUFS（SE が上に乗る前提の、放送より静かめの位置）。

```
ffmpeg -i in.wav -af ebur128=peak=true -f null -     # I: が統合ラウドネス
```

MuseScore 側は、パート間のバランスを各トラックのフェーダーで作り、曲全体の音量は master 1本で決める（master は書き出しに 1:1 で反映される）。ブーストは出口の余裕を食うので、バランスは下げる方向で組む。

### 権利・台帳

全曲自作アレンジなので権利表記は不要。SE と同じ台帳（下記「ライセンス台帳」）に曲も1行ずつ記録する（曲名／用途＝キャラ／出自＝自作アレンジ・たたき台の出所／形式）。第三者素材を使うことになったら、表記が必要なものは指定文をそのまま載せる。

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
| 解説ハイライト | 解説の段送り→牌が光る | ごく軽い「ぴこ」 | 次 |
| ボタン/メニュー | ハンバーガー等の開閉 | 「コトッ」 | 次 |
| あいさつ | `greeting` | 鈴の音など登場音（任意） | 後 |

- `explaining` は連続した説明のため専用音を持たない（解説の段送り＝「解説ハイライト」で代用）。
- **SE のキャラ連動**（キャラ別の効果音差し替え）は未導入で、当面は中立 SE 一式で成立させる（BGM は `Character.bgm` でキャラ別。SE を将来キャラ連動にする場合も同様に `Character` のデータとして持たせる想定）。

## 制作

### ライセンス方針（権利表記をしない）

SE は**権利表記が不要なライセンスに統一**する。理由：本アプリは public リポジトリ＋静的ホスティング配信があり得るため、「ファイルそのものの再配布」に文言上ふれうる素材（CC BY や独自規約＝表記必要／再配布制限あり）は避け、表記・再配布の判断を持ち込まない方がシンプル（[architecture](./architecture.md) 冒頭＝意図の読みやすさ優先）。

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

表記が不要でも、後で「これ表記要るんだっけ？」と悩まないため、SE ごと・BGM の曲ごとに **ファイル名／出所URL／ライセンス種別** を1枚の台帳に残す（アバター画像の master 管理と同じ発想＝[character-guide](../characters/character-guide.md)）。置き場は収集着手時に決める（候補：`docs/dev/` か `src/assets/` 同梱の `CREDITS`）。収集作業のバックログは [backlog](../backlog.md) feature-9。

## 技術詳細（SE 実装時に詰める）

- SE の autoplay 制限・precache・キャラ連動等は実装時に確定（BGM の autoplay 解禁・再生制御は `src/ui/audio` の現行コードを引き継ぐ。音源ファイル方式への置き換えは feature-21）。
