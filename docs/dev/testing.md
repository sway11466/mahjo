# テスト方針（全体）

テストの全体方針 — 目的・考え方（SML）・ツール・サイズ別の方針・人手領域・実行。採点ルールの必須ケースは [testing-scoring-rule.md](./testing-scoring-rule.md)、その他の細かいテスト指示は領域ごとに別途。

## 1. 目的と考え方

- 目的：正確性を作り込み、変更を恐れないための回帰の安全網にする。学習アプリで誤った点数を教えるのは致命的なので、エンジンの正確性を最優先で守る。
- カバレッジは目標でなく結果（特に採点の数値網羅が主目的、率自体は目安）。
- テスタビリティの高い設計（純粋関数・依存注入＝rng 注入 等）でテストを楽にする。
- レイヤ（unit/integration/e2e）より「テストサイズ（SML）」で整理する：

| サイズ | 範囲 | Mahjo では | 量 |
|---|---|---|---|
| Small | 1プロセス・IO/網/DOMなし・高速決定的 | engine（parse/yaku/fu/score/generate/mistakes）・hints | 最厚（正確性の本丸） |
| Small〜Medium | jsdom＋Testing Library（実ブラウザ不要） | UIコンポーネント単体（描画・操作・条件分岐・状態反映） | 厚め |
| Large/E2E | ブラウザで実アプリ通し | 主要ユーザーフロー数本＋PWA | 少数（安定重視） |

軽量アーキ（バックエンド/DB/ネットワーク無し）なので「外部システム結合」の Medium 層がほぼ不要。Small を厚く＋E2E を薄く、中間が痩せた形でよい（普通の Web アプリより省力）。

## 2. ツールと配置

- Vitest（Small・UI単体）、@testing-library/react ＋ jsdom（UI単体）、Playwright（E2E。未導入＝[backlog](../backlog.md) feature-20）。
- テストは実装ファイルの隣（`*.test.ts`）またはレイヤ直下の `__tests__/`。
- 領域別の重み：

| 層 | 密度 | 内容 |
|---|---|---|
| engine/yaku（役判定） | 厚い（最優先） | 全網羅役の成立/不成立、喰い下がり、門前限定、複合、上位役吸収。 |
| engine/fu・engine/score | 厚い | 既知点数例。符・翻・点数・配分・満貫境界・トグル差分（→ [testing-scoring-rule.md](./testing-scoring-rule.md)）。 |
| engine/generate（生成） | 中 | シード役が必ず含まれる・合法・各牌4枚以内・門前役は門前構築。 |
| engine/mistakes（誤答生成） | 中 | ミス変換が意図通り・正解と重複しない・理由ラベル付与。 |
| hints（HintProvider/Renderer） | 中 | 第1層＝段階順・該当キー選択（キャラ非依存）／第2層＋script＝答えを直接言わない・キー突き合わせ。 |
| session（セッション提示層） | 厚め | 純TS（[session.md](../spec/session.md)）。状態機械＝開始/正誤判定/進捗加算（正解のみ）/8問で終了/誤答でも進む。view-state 組み立て＝場面→表情の選択・ヒント差し込み・解説項目の highlightTargets。rng 注入で決定的。 |
| ui（コンポーネント） | 厚め | §4。view-state の描画・操作 dispatch・ハイライト連携・牌SVG/画像/音。 |

## 3. 採点ルールのテスト（最重要）

採点（役・符・点数）の必須ケースは最優先。詳細は [testing-scoring-rule.md](./testing-scoring-rule.md)（符の特例・待ち符・雀頭符・点数配分・満貫境界・役満・高点法）。各ケースは `score()` の入力一式 → 期待値で固定する回帰スイート。

## 4. UI 単体テスト（jsdom＋Testing Library）

実ブラウザ不要でコンポーネントを単体検証。engine 出力はモックして渡す。

- 牌SVG：id/種別から正しい牌、赤ドラ区別、上がり牌の区別、副露の向き。
- 盤面：手牌・副露・上がり牌・ドラ表示牌の配置。
- 採点・解説の表示：`items` の各ステップで対応 `highlightTargets` の要素にハイライトが付く（解説の段送り連動＝[screens.md](../design/screens.md) §3。連携ロジックはここで担保。項目クリックでの個別ハイライトは将来の併用案）。
- ヒントUI：ボタンで段が1つずつ開く、最終段でも答えを出さない。
- クイズUI：4択表示・選択で正誤リアクション・解説へ遷移。
- 設定UI：トグルで RuleSettings/AppSettings 更新 → 表示反映（randomTileOrder で並び変化 等）。

## 5. E2E（Large）

ブラウザで実アプリを通し、主要フローが繋がることだけ確認（少数・安定重視）。**未導入**（Playwright の導入・シナリオ作成は [backlog](../backlog.md) feature-20。本節はその導入時のシナリオの正）。

- 役モード：出題 → ヒント段階表示 → 回答 → 解説（成立役のウォークスルー）。
- クイズ：回答 → キャラのリアクション → 解説へ。
- 点数モード：解説の符・点数ステップ → ハイライト連携（通し1本）。
- 設定：ルール変更が出題・採点に反映＋ localStorage 永続。
- PWA：オフライン起動（precache）。

## 6. 人手で確認する領域（感性・探索）

回帰の安全網は自動（Small 中心）、感性・探索は人、と割り切る。人手の方が圧倒的に効率が良いもの：

- 音（SE/BGM の有無・タイミング・心地よさ）。設定変更による音の確認はとくに人手向き。
- アバター・表情の見た目／場面との一致。
- セリフの自然さ・口調。
- 牌SVG・赤ドラ表示の見た目、演出/アニメの気持ちよさ、全体の学習 UX。

チェックリスト化して手で回す（自動化は後回し or やらない）。

## 7. 生成器のテスト（決定性）

- `rng` は注入可能にし、固定シードで決定的に再現できるようにする（`src/engine/rng.ts`）。
- 各役シードについて：(1) 生成手が合法（4面子1雀頭 or 特殊形）、(2) シード役が実際に成立（エンジンに通して確認）、(3) 各牌4枚以内、(4) 門前役は門前で構築、を property 的に多数回検証。

## 8. ヒント・クイズのテスト

- HintProvider（第1層・キャラ非依存）：骨組み `HintStepPlan[]` が `level` 昇順（ぼんやり→具体）／成立役・符内訳に対応する `key` が選ばれる（着目ポイントの選択・順序）。文言を持たないのでキャラ抜きでテストできる。
- HintRenderer＋script（第2層）：差し込んだ `HintStep.text` に答え（役名・点数の確定値）を含めない。これは authored セリフ側の内容検証（下のセリフ突き合わせと同列）。
- セリフ突き合わせ：各キャラ script（`character-<id>-script.md` 由来）のヒントキー集合が [hint-base.md](../spec/hint-base.md) のキー集合と過不足なく一致（書き漏れ・余剰を検出）。場面セリフは必須場面（[session.md](../spec/session.md) §4 の必須場面 greeting/dealing/correct/wrong/finished）を各 最低2本（[character-guide.md](../characters/character-guide.md) §2「セリフ」）網羅。
- mistakes：各 `MistakeKind` が期待通りの誤変換値を返す（例 dealer-swap=親子反転の点数）。正解と一致する誤答は捨てて別ミスで埋める。4択が重複しない。

## 9. テストデータの出所と回帰方針

- ケースは麻雀の標準ルール（[scoring-rules.md](../spec/scoring-rules.md)）に基づき手計算で確定した値を記述。出典・計算根拠をテスト内コメントに残す。
- 代表ケースは表形式のデータ駆動テスト（`test.each`）で大量に回す：`{ name, ctx, expected }` の配列。
- 仕様変更・バグ修正時はまず失敗するテストを追加してから直す（回帰防止）。
- バグを見つけたら最小再現ケースをスイートに永久追加。

## 10. 実行

- `npm test`（Vitest watch）／`npm run test:run`（CI/一回実行）。E2E は別コマンド（未導入＝[backlog](../backlog.md) feature-20。例 `npm run test:e2e`）。
- カバレッジは engine を重点的に確認（数値の網羅が主目的でカバレッジ率自体は目安）。
