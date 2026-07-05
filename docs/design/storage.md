# ストレージ（永続化層）

設定・進捗をブラウザの `localStorage` に保存／復元する層。永続化の「キー・形・version・防御的読込」をここ1枚に集約する。状態の保持ロジックそのものは持たず、IO の口に徹する。レイヤ全体像は [architecture.md](./architecture.md) §2、永続化を薄いラッパで行う方針は [ADR-0001](../adr/ADR-0001-no-state-management-library.md)。

## 1. 位置づけと依存方向

storage は外部世界（`localStorage`）へ状態を投射する被駆動アダプタ。画面へ状態を投射する ui と同じ外周の兄弟で、どちらかが上位ではない。

- 依存は types のみ。session・engine・hints・characters・React/DOM には依存しない（`localStorage` という Web API だけを使い、それも注入可能にする → §6）。
- session には依存しない（重要）。session は純関数（`(state＋入力)→state`、rng 注入）に保つと決めた（[architecture.md](./architecture.md) §2・[ADR-0001](../adr/ADR-0001-no-state-management-library.md)）。純粋な session は内部で保存を呼べないので、永続データは session にとって「引数で入り・返り値で出る」ただのデータ。よって storage が触るのは types の共有型だけで、session への辺は張らない。
- 配線は ui。「起動時 load → state へ → session の純関数で遷移 → 変化したら save」を ui の合成点（§7）が束ねる。

依存ルール（厳守）:

```
ui ──calls──→ session ──→ engine / hints / characters
 │                              │
 └──calls──→ storage            │
                  │             │
                  └──→ types ←──┘
```

- ui → session は呼び出し依存（駆動側）。ui → storage も呼び出し依存だが、storage は session を知らない（被駆動側はデータ／型でしか core と関わらない）。この非対称は設計ミスではなく、session を純粋にした帰結。
- storage は `src/storage/` に置く。React import 禁止。例外を投げてアプリを止めない（§5）。

## 2. 永続化対象

当面の保存対象は4つ。いずれも JSON シリアライズ可能な素のデータ。

| 対象 | 型 | 型の正 | 既定値の正 |
|---|---|---|---|
| ルール設定 | `RuleSettings` | [data-model.md](./data-model.md) §14 | [scoring-rules.md](../spec/scoring-rules.md) §5 |
| アプリ設定 | `AppSettings` | [data-model.md](./data-model.md) §15 | [data-model.md](./data-model.md) §15 |
| 進捗・成績 | `ProgressByCharacter` | [data-model.md](./data-model.md) §16 | 空 `{}`（キャラ初出時に `{ correctTotal: 0, correctByMode: {} }`） |
| 間違い履歴 | `MissHistory` | [data-model.md](./data-model.md) §16 | 空 `{}` |

- 既定値は1箇所の既定値ファクトリから供給し、ここと読込フォールバック（§5）で共有する。値の出所は上表の「既定値の正」。
- `Progress` は累計成績に加え**苦手集計**（`byTarget` ＝出題種類ごとの `{seen, correct}`）を持つ（[data-model.md §16](./data-model.md)）。**任意フィールド**で、欠落は §5 の防御的読込が既定（空マップ）で補完する＝**スキーマ version は上げずマイグレーション不要**（既存の保存データと共存し、未知フィールドは無視）。- 間違い履歴（`MissHistory`）は誤り方の生データ（失敗した出題そのもの。[data-model.md §16](./data-model.md)）。既存キーとは独立した新キー（§3）＝既存の保存データには一切触れない（マイグレーション不要）。キャラ別×モード別・直近50件のリングバッファで、読込は**レコード単位**で形を検証し、合わないレコードだけ捨てる（§5。上限超過分も読込時に直近へ丸める）。
- セッションの途中保存（`QuizSession` の中断・再開）は当面スコープ外。やるなら、永続化する型は `src/types/` に置く（storage → session の逆流を避ける。現在 `QuizSession` は `src/session/` にあるため、永続化対象に格上げする時点で types/ へ移す）。

## 3. キー設計とエンベロープ

- 名前空間接頭辞 `mahjo:` を全キーに付ける（他アプリ・将来の別データと衝突させない）。
- キー: `mahjo:rules` / `mahjo:app` / `mahjo:progress` / `mahjo:misses`。
- 値は version 付きエンベロープで包む（キー名に version を埋めない＝移行時に旧キーが孤児化しない）:

```ts
interface StoredEnvelope<T> {
  schemaVersion: number; // 現行 = 1
  data: T;
}
```

- 現行 `schemaVersion = 1`。形を変えたら version を上げ、§4 のマイグレーションを足す。

## 4. スキーマ version とマイグレーション

- 読込時、エンベロープの `schemaVersion` を見て現行未満なら順次アップグレード関数を適用する。
- マイグレーションは `from バージョン → 次バージョンの data` を返す関数の連なりで持つ（1→2→3 と段階適用）。
- 未知／現行より新しい version（新しいビルドで書いた後にダウングレードした等）や、移行できない壊れ方は、無理に解釈せず既定値へフォールバック（§5）し warning を残す。データ消失より誤った状態で動くほうが学習アプリとしては悪い。

## 5. 読込時の防御（defensive load）

正確性最優先のアプリなので、壊れた／古い／欠けたデータでアプリを落とさない。読込は常に妥当な値を返し、例外を ui へ漏らさない。

- キー無し・JSON パース失敗・エンベロープ不正・移行不能 → 既定値（§2）を返す。
- 形は検証する（手書きの軽量バリデーション）。未知フィールドは無視、欠けたフィールドは既定値で補完（`RuleSettings.enabledYaku`・`AppSettings` の各項のように部分的に欠けても既定で埋める）。
  - `enabledYaku` は疎マップ＝オフにした役だけ `false` を持つ。一度もトグルしなければ空 `{}`（＝全役オン。意味は [data-model.md §14](./data-model.md)）。空・キー無しでも全役が出題される。
- 既定値は §2 のファクトリ単一出所から。読込ごとに散らさない。
- 書込はベストエフォート: `try/catch` で囲み、容量超過・プライベートモード等で失敗してもアプリは続行（メモリ上の state は生きる）。失敗は warning に留める。

## 6. モジュール API

バックエンド（`Storage` 実体）を注入可能にし、既定で `globalThis.localStorage` を使う。これは rng 注入（[testing.md](../dev/testing.md) §7）と同じ思想で、storage を DOM 非依存の Small テストで回すための seam。

```ts
// src/storage/ のイメージ（細部は実装時に詰める）
type StorageBackend = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function createStorage(backend: StorageBackend = globalThis.localStorage) {
  return {
    loadRules(): RuleSettings; saveRules(r: RuleSettings): void;
    loadAppSettings(): AppSettings; saveAppSettings(s: AppSettings): void;
    loadProgress(): ProgressByCharacter; saveProgress(p: ProgressByCharacter): void;
  };
}
```

- 公開するのは load/save の素の関数だけ。`localStorage` の差し替え抽象（ポート＋依存性逆転）はやらない: バックエンドは `localStorage` 一択で差し替え需要がなく、ADR-0001 の「過剰抽象しない」に対して重い。必要が生じたら ADR で足す。
- 内部はキー別 load/save を薄い汎用ヘルパ（`read<T>(key, validate, fallback)` / `write<T>(key, data)`：エンベロープ詰め・version 判定・防御を共通化）で実装してよい。

## 7. ui との配線（合成点）

永続化を ui の薄い1箇所に閉じ込め、画面コンポーネントからは隠す。

- `usePersistentState` 的なフック（または Context プロバイダ）を ui に置き、「起動時 load → state、変化で save」の橋渡しだけを担わせる。
- 規約: 画面コンポーネントは storage を直接 import しない（このフック／プロバイダ越しに使う）。永続化の知識を ui 全体に散らさないため。
- 規約の解釈: ルーター（App）は永続化の合成点そのものであって「画面コンポーネント」ではない。App がフックの返すキャラ別進捗から現在キャラのスライスを導出する際の既定値ヘルパ（`defaultProgress` 等）を storage から直接 import するのは配線の一部として可。
- 即時反映（設定変更が即 state に反映され save される）は [screens.md](./screens.md) §5 のとおり。

## 8. テスト方針

storage は IO 境界なので、注入したインメモリ backend で Small テストする（[testing.md](../dev/testing.md)）。

- ラウンドトリップ: save → load で同値。
- 防御: キー無し／壊れた JSON／不正な形 → 既定値。
- 補完: 一部フィールド欠けのデータ → 既定で埋まる。
- マイグレーション: 旧 `schemaVersion` のデータ → 現行へ移行された値。未知 version → 既定値。
- 書込失敗: backend が投げても load/アプリが落ちない（warning 止まり）。
