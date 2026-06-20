# 効果音・音楽（音まわり）

SE（効果音）と BGM（音楽）の方針。設定の型は [data-model](./data-model.md) §15 `AppSettings`、実装は parking lot（[backlog](../backlog.md)）。MVP は無音で成立し、設定トグルだけ先に用意してよい。

## 設定

- SE と BGM を分離（`AppSettings.se` / `bgm`）。音量スライダーは持たず on/off のみ（音量は後からスライダーを足しても互換に拡張できる）。
- 既定：BGM オフ・SE オン（BGM は学習中ずっと鳴るため既定オフ）。

## 方針（プレッシャーをかけない）

- 「プレッシャーをかけない」（[product-concept](../product-concept.md)）を音にも適用する。
- 不正解音は“罰”にせず、やわらかい気づき音に。
- BGM は集中を妨げない環境音的ループに。

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
