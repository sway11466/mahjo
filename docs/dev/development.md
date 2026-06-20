# 開発・ビルド・配布

ローカル開発・ビルド・配布の手順。技術選定は [architecture.md](../design/architecture.md) §1、テストの方針・実行は [testing.md](./testing.md)。

## セットアップ

```
npm install
```

## 開発（ローカル）

```
npm run dev       # Vite 開発サーバ（HMR）
```

## ビルド

```
npm run build     # dist/ に静的ファイル一式を出力
npm run preview   # ビルド成果物のローカル確認
```

## 配布

- `dist/` を任意の静的ホスティング（任意の Web サーバ）に置くだけ。アプリ用バックエンドは不要。
- サイト構成（公開サイト＝`public/` の素 HTML ＋アプリ＝`app.html`・URL・PWA `start_url`）は [architecture.md](../design/architecture.md) §4・[screens.md](../design/screens.md) §6 を参照。base の扱いは下記「デプロイ／ブランチ戦略」。
- 初回読込後はオフライン動作（PWA。Service Worker はビルド時に生成。詳細は [architecture.md](../design/architecture.md) §1）。
- 当面の配信先は GitHub Pages（下記「デプロイ／ブランチ戦略」）。完全静的なので Pages と相性がよい。

## デプロイ／ブランチ戦略

配信先は GitHub Pages。本番の手前に「本番前の動作確認」用のサブパスを設け、ブランチで本番／確認版を出し分ける。当面は github.io ドメイン、将来は独自ドメイン `mahjo.link`（[backlog](../backlog.md) feature-6）へ移行する前提で組む。

### ブランチ → デプロイ先

| ブランチ | 役割 | デプロイ先 |
|---|---|---|
| `main` | 開発・統合 | デプロイしない（ローカル確認＝`npm run dev` / `npm run preview`） |
| `preview` | 本番前の動作確認 | サブパス `/preview/` |
| `production` | 本番リリース | ルート `/` |

昇格は一方向（未検証コードが本番へ入らないように）：

```
feature → main          開発・統合（ローカル確認）
   main → preview        push で確認版を公開 → ネットで動作確認
preview → production     push で本番を公開
```

- `production` には必ず `preview` を通った状態だけが来る。
- preview と production は同じコミット（違いは `base` だけ）。`/preview/` で確認したものと本番のロジックは同一で、パスが違うだけ＝本番前確認として信頼できる。

### URL と base（ドメイン移行で変わるのは base のみ）

| 時期 | production | preview |
|---|---|---|
| 当面（github.io） | `https://<user>.github.io/mahjo/`（base `/mahjo/`） | `…/mahjo/preview/`（base `/mahjo/preview/`） |
| 独自ドメイン後 | `https://mahjo.link/`（base `/`） | `https://mahjo.link/preview/`（base `/preview/`） |

- `base` は **CI のビルド引数で渡す**（`vite build --base=…`）。`vite.config.ts` には焼き込まず、CI 変数（例 `BASE_PROD` / `BASE_PREVIEW`）にしておく。ドメイン移行時はこの2変数を `/`・`/preview/` に書き換える1行で済み、コード・ブランチ戦略は無変更。
- PWA の Service Worker スコープ・manifest の `start_url` は `base` から自動で決まるため、確認版（`/preview/`）と本番のキャッシュは `base` 分離で自動的に分かれる。確認時はキャッシュ無効化（DevTools の "Update on reload"）で本番アセットの混入を避ける。

### デプロイ機構

- 公開元は `gh-pages` ブランチ（出力が積み上がり、サブパスを共存させられる）。
- どちらのブランチへ push しても、`production`→ルート・`preview`→`/preview/` を**両方ビルドして一括デプロイ**する（GitHub Actions）。冗長だが出力が常に2ブランチの最新と一致してズレない。意図の読み取りやすさ・シンプルさ優先（[architecture.md](../design/architecture.md) 冒頭）。小さな静的アプリなのでビルド時間は問題にならない。

### 独自ドメインへの移行（将来・feature-6）

1. `BASE_PROD` / `BASE_PREVIEW` を `/`・`/preview/` に変更。
2. リポジトリの Pages 設定に `mahjo.link` を登録（公開出力に `CNAME` が生成される）。
3. DNS を GitHub Pages へ向ける（apex の A レコード等）＋ "Enforce HTTPS" を ON。

旧 `…/mahjo/` へのアクセスは GitHub が新ドメインへ自動リダイレクトする。手順詳細は feature-6 を正とする。

## テスト

実行コマンド・方針は [testing.md](./testing.md) を参照。
