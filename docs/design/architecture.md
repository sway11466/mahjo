# アーキテクチャ

## 設計の指針（最優先）

保守性とは **意図の読み取りやすさ・シンプルさ** を指す。レイヤ分離・API・リファクタの良し悪しはこの軸で判断し、処理効率・実装コストは設計判断の材料にしない。とくに「無駄な処理を削る」だけを目的にしたリファクタはしない（公開APIや抽象が増えて意図がぼやけるなら、重複処理が消えても不採用）。パフォーマンスは正確性・学習体験に実害が出てから測って対処する別問題として扱う。

## 1. 技術スタック

バックエンドを持たない完全静的クライアント。採用技術:

- TypeScript — 採点ロジックの安全性・保守性のため全面採用。
- Vite — ビルドツール。`dist/` に静的ファイル一式を出力。
- React — UI。
- Vitest — テスト（テスト戦略は [testing.md](../dev/testing.md)、ビルド/実行手順は [development.md](../dev/development.md)）。
- vite-plugin-pwa — Service Worker でアセットを precache。初回読込後はオフライン動作（PWA）。
- 牌は SVG で描画する。Unicode の麻雀牌文字は環境で表示が崩れるため使わない（アバターは AI 生成のラスター画像）。

## 2. レイヤ分離と依存方向

依存は UI → 下位レイヤの一方向。session / engine / hints / characters(データ) は UI 非依存（フレームワーク非依存の純 TS）。中核は session が「1ターンの view-state（ui が描く提示モデル）」を組み立て、ui はそれを描画して操作を session に投げ返すだけ、という構造。

```
        ┌───────────────────────────────┐
        │           ui (React)          │  ← 唯一 React。view-state 描画＋操作 dispatch＋永続化の配線
        │   牌SVG描画・画像・音・入力・配線    │
        └──────┬─────────────────┬──────┘
  view-state ↑ │ actions ↓        │ load ↓ / save ↑
        ┌──────▼─────────────┐ ┌──▼─────────────┐
        │ session（提示層・純TS）│ │    storage     │  ← localStorage への永続化（IO）
        └──┬───────┬───────┬─┘ └───────┬────────┘
           │       │       │           │
    ┌──────▼─┐ ┌───▼──┐ ┌──▼─────────┐ │
    │ engine │ │hints │ │ characters │ │
    │採点+生成 │ │HintP.│ │ペルソナ(データ)│ │
    └──────┬─┘ └───┬──┘ └─────┬──────┘ │
           └───────┴──────────┴─────────┘
                  types (共有型)
```

※ session は engine・hints・characters・types に依存。hints も engine の出力型（ScoreResult 等）に依存。storage は types のみに依存し session を知らない（被駆動アダプタ。ui が session の純関数と storage の IO を配線する）。ui は描画のため characters のアセット（表情→画像・キャラ一覧）と types を直接参照してよい（最小依存）。

依存ルール（厳守）:

- engine は他のどのアプリ層にも依存しない（types のみ参照）。React/DOM を import しない。1手の素材（生成・採点・誤答）までで状態を持たない。
- hints は engine の出力型（ScoreResult 等）と types に依存してよいが、UI・characters・session には依存しない。キャラ非依存（8.1 の二層分離）。
- characters はペルソナ（場面別セリフプール＋着目ポイント別ヒント文言＝script）・`reactions`・アバター参照のデータ。ロジックを持たない（文言・参照データのみ）。
- session は engine・hints・characters・types に依存してよいが、UI には依存しない。クイズの「セッション（8問のひとまとまり）」の進行・正誤判定・進捗更新に加え、1ターンの view-state を組み立てる（出題＝手/場/4択、キャラのリアクション選択＝場面→表情＋セリフを characters データと rng から、ヒントの段組み＋文言差し込み＝HintProvider＋HintRenderer）。すべて純関数（state＋入力 → state、rng 注入）。状態の保持は ui、永続化の IO は storage（ui が配線）。永続データ（設定・進捗）は session にとって引数で入り返り値で出るだけ＝session は storage を知らない。仕様は [session.md](../spec/session.md)。当面はクイズ session を持つ（解説の単独モードは別途）。
- storage は localStorage への永続化（IO）を一点集約する被駆動アダプタ。types のみに依存し、session・engine・hints・characters・React/DOM には依存しない（localStorage は注入可能にしてテストする）。キー設計・version／マイグレーション・読込時の防御的フォールバックを持つ。仕様は [storage.md](./storage.md)。
- ui は session の view-state を描画し、操作を session に dispatch するだけ（「何を見せるか」は決めない）。担当は 牌SVG描画・アバター画像の描画・効果音/BGM・アニメ・レイアウト・入力・永続化の配線（IO は storage に集約。画面コンポーネントは storage を直接 import せず合成点のフック越しに使う＝[storage.md](./storage.md) §7）。view-state は抽象キャラ（characterId＋expression＋line）を持ち、表情→画像の解決は ui（characters のアセット参照）。

理由（session を独立層にし、ui を描画専任にする）：セッションは麻雀の真実ではなく学習の進行・提示。engine（純・麻雀計算）に混ぜると engine の自己像（1手の価値・合法形）が崩れ、ui に置くと提示ロジック（リアクション選択・ヒント組み立て・進行判定）が React に混ざってテストしづらい。hints（「教え方」の純ロジックを engine から分けた層）と同じ発想で、「学習者の進行・提示」を独立した純ロジック層にし、ui は view-state の描画に徹する。これにより提示ロジックを Small テストで厚く守れる。

## 3. 中核：採点エンジン

- 入力：`Hand`（手＋上がり牌）＋ `Table`（卓）＋ `WinContext`（和了状況）＋ `RuleSettings`（ルール）を個別に渡す：`score(hand, table, winContext, rules)`。出力：`ScoreResult`（翻・符・点数＋計算過程 `items[]`）。
- 純粋関数。同じ入力に同じ出力。副作用・乱数・DOM なし（生成器の乱数は engine 内の別モジュールに隔離し、シードを注入可能にしてテストする）。
- 積み増し順：役判定 → 符・点数。役モードは役判定までで成立する。
- 内部は parse（面子分解）・yaku（役判定）・generate（役シード生成）・mistakes（誤答のミス変換）にモジュール分割し、符・点数（fu・score）も同様に分割する。
- 各 `items[]` は `highlightTargets`（光らせる対象ID配列）を保持し、UI のクリックハイライトと連携（7.3）。
- 重要原則：シード役は「生成のきっかけ」にすぎない。表示する採点結果は エンジンが実際に検出した内容を正とする（シード以外の役が複合してよいし、シードが上位役に吸収されてもよい：例 一盃口→二盃口）。
- 範囲：engine は1問の素材（生成・採点・誤答）までで状態を持たない。クイズのセッション（8問の進行・正誤判定・進捗更新）と1ターンの view-state 組み立ては engine ではなく session 層が持つ（[session.md](../spec/session.md)）。

## 4. ディレクトリ構成（配置方針）

```
mahjo/
  docs/                     設計ドキュメント
  public/                   公開静的サイト＋固定アセット（バンドラを通さず dist ルートへ素通し）
    index.html              LP（/）— 素 HTML・SEO 用
    characters/             キャラ紹介ページ（公開・SEO 用。アプリ内のキャラ選択画面とは別物）
      index.html            一覧（/characters/）
      mao/index.html        まお紹介（/characters/mao/）
    img/                    サイト用画像（master から web/OG サイズで書き出し）
    site.css                素 HTML ページ共有 CSS
    robots.txt sitemap.xml favicon pwa-*.png  SEO/PWA の固定パス資産
  src/
    types/                  共有型
    engine/                 採点エンジン＋生成
    session/                セッション提示層（進行・判定・進捗＋view-state組み立て。純TS）
    hints/                  ヒント骨組み（HintProvider）＋文言差し込み（HintRenderer）
    characters/             キャラのレジストリ＋ペルソナ
    storage/                localStorage 永続化（キー・version・防御的読込。純TSのIO境界）
    ui/                     画面・React コンポーネント・牌SVG・永続化の配線
    assets/                 牌=SVG / 看板牌(1筒/1索)デフォルト=ラスター(tiles/) / キャラのアバター=ラスター画像
  app.html                  React アプリの唯一のエントリ（/app.html）。ルート index.html は持たず vite input は app.html のみ
  vite.config.ts
  vitest.config.ts (または vite.config 内)
  tsconfig.json
  package.json
```

公開サイト（LP・キャラ紹介）は React アプリ（`app.html`）と分離した素 HTML で、`public/` に置き dist ルートへ素通しコピーする（ファイルパス＝URL）。SEO を狙うため・初見の入口を軽く保つための分離。組み立ての機構：

- `vite.config.ts` の `build.rollupOptions.input` は **`app.html` のみ**（ルート `index.html` を持たない）。アプリの全画面はこの SPA 内（[screens.md](./screens.md) §1〜§5）。
- `public/` はバンドラを通さず dist ルートへ素通しコピー＝ファイルパスがそのまま URL（素 HTML の LP・キャラ紹介・`site.css`・`img/`・`robots.txt`/`sitemap.xml`・`favicon`/`pwa-*.png`）。
- PWA `start_url` は **`app.html`**。インストール起動・リピーターはアプリへ直行し、`/` 直アクセスだけが LP になる（LP も workbox 既定 glob で precache）。

各ページの構成・URL・画像方針・SEO の正は [screens.md](./screens.md) §6、デプロイ・base の扱いは [development.md](../dev/development.md)「デプロイ／ブランチ戦略」。

## 5. UI 層のスタイル方針

ui レイヤ内のスタイルは責務で2層に分ける（見た目の指針＝配色・演出は [uxui.md](./uxui.md)、本節は「コードでどう分けるか」）。

- レイアウト・構造は TSX に持つ：コンポーネントの組み方・配置、flex/グリッド・サイズ、SVG の幾何（viewBox・座標・どの要素を置くか）。牌の幾何は「牌の組み立て」なのでここに残す。
- 装飾・見た目は CSS に持つ：色・フォント・影・角丸・スート色・状態色（ハイライト等）。値はハードコードせず CSS カスタムプロパティ（デザイントークン）に集約し、意味のある名前で参照する（例 `--color-man`）。
- SVG の presentation 属性（`fill`/`stroke`/`font-*`）は CSS プロパティとして効くので、属性で焼き込まず CSS クラスで当てる（例 `.tile--man { fill: var(--color-man) }`）。

SVG コンポーネントの分類：

- 中立SVG（アプリ共通）：牌（`ui/common/tiles`）・千点棒（`ui/main/board`）・正誤の ○/✗ 等。誰が使っても同じ。牌面は本物寄せの幾何で描く（萬子＝漢数字＋萬／筒子＝青赤のドーナツ／索子＝竹／白＝無地）。幾何は `ui/common/tiles/faces.tsx`、色・フォントは `TileSvg.css`。
- キャラ固有アイテムSVG（皮）：特定キャラの世界観に属する装飾（例 まおの御札 `ui/character/items/Ofuda.tsx`）。characters データ層は DOM を持てないため ui に置く。中立データ（`HighlightTarget`・選択 index・正誤）には触れず、どこに適用するかは ui の resolver がキャラで切り替える（二層分離：[data-model.md](./data-model.md) §10）。

看板牌（1筒/1索）：牌の中でいちばん絵画的な部品。中立牌に対しキャラの絵を被せられる差し替え枠とし、御札と同じ二層分離で扱う。

- 解決は ui の resolver（`ui/common/tiles/heroTiles.ts`）：`(牌種)→デフォルト画像URL`、将来 `(characterId,牌種)→キャラ画像URL`。該当が無ければ中立SVG（`PinOne`/`SouOne`）にフォールバック。`TileSvg` は 1筒/1索 のとき、面の角丸（`rx=10`）でクリップした `<image>` を viewBox `0 0 74 100` にフィットさせて描く（歪み防止に `preserveAspectRatio="xMidYMid meet"`）。
- 画像の置き場所：キャラ非依存のデフォルトは `src/assets/tiles/`（命名 `sou1.webp` / `pin1.webp`）。キャラ別は `src/assets/characters/<id>/`（命名 `tile_sou1.webp` 等）。`src/ui/common/tiles` はコード（SVG/リゾルバ）置き場で画像は置かない。
- 画像仕様：縁・影・ハイライトは SVG 側が描くので画像に焼かず、不透明な牌面の絵柄だけを乗せる（形式・背景色・比率・書き出しサイズ等の制作仕様の正は [character-guide.md](../characters/character-guide.md) §3「画像アセット」）。

理由：装飾の一元管理、テーマ化（ダーク／キャラ別）への拡張余地、牌SVGの色の意味づけ（man/pin/sou）を保つため。ユーティリティCSS（Tailwind 等）は現時点で未導入（判断と再評価条件は [decisions.md](../decisions.md)）。
