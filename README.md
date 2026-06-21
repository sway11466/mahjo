# Mahjo（マージョ）

麻雀の役と点数の基礎が、魅力的なキャラクターと一緒に身につく、ブラウザだけで遊べる学習Webアプリです。

ランダムな和了形（あがりの形）を出題し、「どんな役が成立するか」「点数をどう数えるか」をビジュアルに見せて学べます。

<!-- TODO: プレイ画面のスクリーンショットをここに差し込む（例）
![プレイ画面](docs/screenshot.png)
-->

## 魅力的なキャラクター

あなたの学習をそっとサポートします。ヒントや解説、正解へのリアクションを、それぞれの声と表情で添えてくれます。

<table>
  <tr>
    <td align="center" width="50%"><img src="public/img/mao-bust.webp" alt="まお" width="200"><br>まお<br><sub>まっすぐで素直</sub></td>
    <td align="center" width="50%"><img src="public/img/rin-bust.webp" alt="りん" width="200"><br>りん<br><sub>強気でからかい上手</sub></td>
  </tr>
</table>

## 特徴

- 役 → 点数の順で学ぶ ── 役が分からないと点数は数えられない。エンジンもUIもこの順で積み上げます。
- 答えを言わないヒント ── 「ぼんやり → 具体」へ段階的に小出し。最終段でも気づきを促す止まりで、自力で辿り着く体験を大事にします。
- プレッシャーをかけない ── 連続記録の強制や“サボると咎める”系はなし。学習を続けることそのものを後押しします。
- 正しさを妥協しない ── 役・符・翻・点数は常に正確に。採点ロジックは網羅的なテストで担保しています。
- キャラと一緒に学ぶ ── サポートキャラ（まお・りん）がヒントや解説を声で添えてくれます。

## 学べること

- 役モード ── 出題された手牌に対し、成立する役を当てる練習。
- 点数モード ── 符・翻・点数までを段階的に計算。計算過程をビジュアルでハイライト表示します。

対局（実戦の打牌・進行）はしません。和了形に対する「役・点数の学習」に専念したアプリです。

## 技術スタック

バックエンドを持たない完全静的なクライアントアプリです。

- TypeScript ── 採点ロジックの正確性・保守性のため全面採用
- React ── UI
- Vite ── ビルド
- Vitest ── テスト（採点エンジンを重点的に網羅）
- vite-plugin-pwa ── Service Worker でアセットを precache、初回読込後はオフライン動作（PWA）
- 牌はすべて SVG で描画（Unicodeの麻雀牌文字は環境で崩れるため不使用）

## 開発

```bash
npm install
npm run dev        # 開発サーバ（HMR）
npm run build      # dist/ に静的ファイル一式を出力
npm run preview    # ビルド成果物のローカル確認
npm test           # テスト（watch）
npm run test:run   # テスト（1回実行）
```

## ドキュメント

設計・仕様の正は [`docs/`](docs/) にあります。

- コンセプト: [docs/product-concept.md](docs/product-concept.md)
- アーキテクチャ: [docs/design/architecture.md](docs/design/architecture.md)
- 採点ルール定義: [docs/spec/scoring-rules.md](docs/spec/scoring-rules.md)
- キャラクターガイド: [docs/characters/character-guide.md](docs/characters/character-guide.md)

## ライセンス

- コード: [MIT License](LICENSE)
- コンテンツ（キャラクター画像・世界観・セリフ等の創作物）: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.ja)（対象範囲は [LICENSE-ASSETS.md](LICENSE-ASSETS.md)）

いずれも利用時はクレジット表示が必要です（著作権は放棄していません）。
