# ADR-0001: 状態管理ライブラリを導入しない（MVP は React 標準）

- ステータス: Accepted
- 日付: 2026-06-05
- 決定者: （プロジェクトオーナー）
- 関連: アーキテクチャ（[architecture.md](../design/architecture.md) のレイヤ分離）、[decisions.md](../decisions.md)

---

## Context（背景）

Mahjo は個人用の麻雀学習 Web アプリで、UI は React。バックエンドを持たず、サーバー同期や複雑な共有状態がない。

採点・生成ロジックは純 TS エンジンに分離済みで、UI はその入出力を扱うだけ。アプリが保持する状態は概ね次の程度に収まる:

- 現在の出題（`WinContext` / `ScoreResult`）
- モードと解説／クイズの遷移
- 設定（`RuleSettings` / `AppSettings`。選択キャラ・音・呼び方等は `AppSettings`）・進捗（`Progress`）＝ローカル永続化対象

つまり状態の大半は「エンジン入出力の受け渡し」と「localStorage への永続化」であり、横断的に共有・更新される複雑な状態は乏しい。

---

## Decision（決定）

状態管理ライブラリ（Redux / Zustand / Jotai 等）を導入しない。MVP は React 標準（`useState` / `useReducer` ＋ `Context`）で構成する。localStorage への永続化は薄いラッパ経由で行う ── このラッパを独立した storage 層（被駆動アダプタ。types のみ依存・session 非依存）に切り出し、キー設計・version／マイグレーション・防御的読込を集約する（[storage.md](../design/storage.md)）。localStorage の差し替え抽象（ポート＋依存性逆転）は単一バックエンドゆえ今は導入せず、必要が生じたら別 ADR で検討する。

---

## Consequences（結果・影響）

### 正の影響
- 追加依存・学習コスト・ボイラープレートを避けられる。アプリ規模に対して過剰な抽象化をしない（ミニマル方針に合致）。
- エンジンが純粋関数なので、UI 状態は「入力を組み立てる → エンジンを呼ぶ → 結果を保持・表示」という単純な形に収まる。

### 負の影響・トレードオフ
- 横断的な状態共有が増えると、`Context` の分割や再レンダリング設計に注意が要る。
- 将来、状態量や共有要求が増えた場合は軽量ライブラリ（Zustand / Jotai 等）の導入を改めて ADR で検討する。本決定は MVP を前提とする。

---

## Alternatives Considered（検討した代替案）

### Redux（Toolkit 含む）
- 現状の状態量に対して過剰。ボイラープレートと依存が見合わない。→ 不採用。

### Zustand / Jotai（軽量ストア）
- 軽量で有力だが、現状は React 標準で足り、依存を増やす積極的理由が弱い。必要が生じたら再検討する。→ 現時点では不採用。
