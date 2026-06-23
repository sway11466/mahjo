# 計測（GTM / GA4 学習イベント）

SPA 内の学習行動を GTM 経由で GA4 へ送るための、イベント契約（名前・パラメータ・発火条件）の正。実装は `src/ui/analytics/track.ts`（`track()` ラッパ）＋発火配線（`src/ui/main/MainScreen.tsx`）。土台（GTM コンテナ・スニペット）は backlog feature-17、本書のイベントは feature-18。

## 1. 方針

- 発火は ui 層に閉じる（副作用＝[architecture](../design/architecture.md) §2。engine/session/hints は純 TS のまま）。`track(event, params)` は `dataLayer.push` するだけの薄いラッパ。
- 発火は render 本文・useEffect ではなく、ユーザー操作ハンドラから送る（再レンダー・React StrictMode による多重発火を避ける）。
- `character_id` を全イベント共通パラメータにする（キャラ駆動＝[product-concept](../product-concept.md) の背骨。どの指標もキャラ別に切れる）。
- プライバシー：個人特定情報を送らない。`AppSettings.playerName` は送らない（[data-model](../design/data-model.md) §16）。「ミスを数える」のは集計の話で、プレッシャーをかけない（提示の原則）と両立する。
- 命名：GA4 慣習の snake_case・低カーディナリティ。`character_id` はイベントパラメータ（ユーザープロパティにしない＝キャラはセッションごとに変わる）。

## 2. イベント（フェーズ1）

発火点はすべて [MainScreen.tsx](../../src/ui/main/MainScreen.tsx) のハンドラ。場面は [session.md](./session.md) §4 に対応する。

| イベント | 発火（ハンドラ） | パラメータ | 取得意図 |
|---|---|---|---|
| `mode_start` | `onBegin`（「はじめる」押下＝playing 遷移） | `character_id`, `mode` | 開始数・キャラ別/モード別の内訳（役→点数の検証） |
| `question_view` | `onBegin`（問1）＋`onNext`（問2〜8） | `character_id`, `target` | 出題数・どこで離脱するか |
| `quiz_answer` | `onSelect` の reveal 後（回答確定） | `character_id`, `correct`, `target` | 回答数・正答率（主指標） |
| `hint_open` | `onHint`（段を開く） | `character_id`, `level` | ヒント使用数・どこまで掘るか（段階ヒントの検証） |
| `explain_view` | `onShowExplain`（解説に入る） | `character_id` | 解説到達数 |
| `session_complete` | `onNext` の最終問（finished 遷移） | `character_id`, `mode`, `correct_count` | 完走率（`mode_start` の対） |

パラメータの値：
- `character_id`：`Character.id`（例 `mao` / `rin`）。
- `mode`：`StudyMode`（`yaku` / `score`）。
- `target`：`QuizTarget`。役モードは `han`、点数モードは `score`（出題の問う対象＝`session.problem.targetFor`）。
- `correct`：boolean（4択の正誤）。
- `level`：ヒント段の具体度（0=ぼんやり…大きいほど具体）。
- `correct_count`：8問中の正解数（0–8）。

`mode_start` を「はじめる」押下（playing 遷移）にする理由：あいさつ画面で離脱したセッションを分母に入れないため。これにより `session_complete` との比（完走率）が「実際に遊び始めたセッション」を母数にできる。

## 3. GA4 / GTM 側の設定（リポジトリ外・管理画面作業）

コード（dataLayer 送出）はリポジトリで持つが、以下は GTM/GA4 の管理画面で行う：

1. GTM 2コンテナ（preview＝`GTM-KKL34BJJ` / 本番＝`GTM-5PKT73H6`）で、各 dataLayer イベント（§2 の `event` 名）を GA4 イベントへマップして公開。
2. GA4 2プロパティ（preview＝mahjo-preview / 本番＝mahjo-prd）でカスタムディメンション登録（管理→カスタム定義、スコープ＝イベント）：`character_id`・`mode`・`correct`（`character_id` は1つ登録すれば全イベントで切れる）。`target`・`level`・`correct_count` は必要に応じ追加。
3. preview の DebugView で発火を確認 → 本番へ昇格。

## 4. フェーズ2（任意・未実装）

行動の質を測る拡張。今回は入れない。`highlight_click`・`character_select`・`setting_change`（`playerName` 除外）・画面遷移の仮想ページビュー・PWA インストール／`display-mode: standalone` 判定・不正解時の `mistake_kind`（[backlog](../backlog.md) refactoring-13 の `MistakeKind` 精査後）。詳細は backlog feature-18。
