# バックログ

未完了の作業（バグ・機能追加・リファクタリング）を追跡する統合リスト。学習順（役→点数）に合わせ、エンジンは「役判定 → 符・点数」の順に積んである（役モードは役判定と生成まで、点数モードで符・点数を使う）。

## index

次回採番: bug=9 / feature=23 / refactoring=20

項目（バグ bug / 機能追加 feature / リファクタリング refactoring）を追加するときは、該当カテゴリの採番を +1 して ID を継ぐ。完了した項目は本書から削除し、番号は再利用しない（過去の使用済み番号は `git log -p -- docs/backlog.md | grep -oE '(feature|refactoring)-[0-9]+' | sort -u` で確認できる）。状態は「本書に載っていれば未完了／消えていれば完了」で表す（状態列は持たない）。優先度は各エントリ見出しに 高（設計の背骨に関わる）／中／低（飾り・潜在）で記す。

## バグ

判明済みの不具合。採番は本書冒頭「index」。各エントリは 背景／対応／該当 で記す（優先度順）。

（現在、判明済みの不具合はなし）

## 機能追加

実装済みコードに足す機能。採番は本書冒頭「index」。各エントリは 背景／対応／該当 で記す。

### feature-9

**効果音（SE）素材の収集・整備**（優先度：低）

- 背景：[sound](./design/sound.md) は SE の方針・効果音一覧を定めたが、素材ファイルが未収集。ライセンスは表記不要に統一する方針（CC0／自作 AI 生成。public リポ＋静的配信での再配布グレーを回避）。音の実装（再生配線・BGM）は parking lot「音（SE/BGM）の実装」だが、SE 素材はその前提として先に揃える必要がある。
- 対応：[sound](./design/sound.md)「効果音一覧」の MVP 分（牌を置く・選択肢・正解・不正解・終了）から着手。Kenney（UI 系まとめ取り）・Pixabay（牌音・正解・不正解・ファンファーレ）等の表記不要ソースで候補を集めて選定 → 静的アセット化（[character-guide](./characters/character-guide.md) §3 の WebP/最適化に準じる）→ ライセンス台帳（ファイル名／出所URL／ライセンス種別）を作成（置き場は着手時に決定）。選定は人手の感性領域（[testing](./dev/testing.md) §6）。次・後の優先度分（ヒント・解説ハイライト・メニュー・あいさつ）は順次。
- 該当：新規（資産。`src/assets/` 配下＋台帳）。方針の正は [sound](./design/sound.md)「制作」。再生実装は parking lot「音（SE/BGM）の実装」。

### feature-12

**設定画面に並べただけで未実装の項目を、実際に動くよう配線する**（優先度：低）

- 背景：設定画面とその保存（`src/storage/`）は実装済みで、設定項目は2種類ある。**すでに採点エンジンに効くもの**（`kuitan`・`kiriageMangan`・`kazoeYakuman`・`doubleYakuman`・`enabledYaku`）は動作する。一方**挙動が未実装のもの**は、設定画面に項目だけ並べて「機能追加予定」表示でグレーアウトし（コード上は `RuleSettingsScreen.tsx`・`AppSettingsScreen.tsx` の `soon` 行）、値の保存だけ通している＝操作しても何も起きない。この「保存はされるが挙動が無い」項目を1つずつ「設定 → 実際の挙動」に繋ぐのが本項。配線できた項目から `soon` を外して編集可へ昇格する。
- 対応：項目ごとに独立して着手できる（赤ドラ〔`akaDoraCount`〕・牌のランダム並び〔`randomTileOrder`〕は対応済み）。
  - 呼び方（`playerName`）：プレイヤーの呼び名を Persona のセリフに差し込む（[character-guide](./characters/character-guide.md) §2）。差し込みの仕組み（テンプレート）自体が未実装なので機構ごと用意する。
  - 後付け（`atozuke`）：生成・和了可否の判定に反映する（採点には影響しない。[scoring-rules](./spec/scoring-rules.md) §5）。
  - 対象外（別項目で追跡）：効果音・音楽（`se`/`bgm`）＝parking lot「音（SE/BGM）の実装」＋[feature-9](#feature-9)／レア役（`rareYaku`）＝parking lot・[scoring-rules](./spec/scoring-rules.md) §1.3（未対応）。
- 該当：`src/ui/settings/RuleSettingsScreen.tsx`・`src/ui/settings/AppSettingsScreen.tsx`（`soon` 行の解除）・`src/engine/generate.ts`（後付け）・`src/characters/`＋`src/session/`（呼び方差し込み）。

### feature-14

**苦手データをキャラの寄り添いアドバイスに活かす**（優先度：低。だいぶ先）

- 背景：`Progress` に苦手集計（`byTarget`＝出題種類ごとの `{seen, correct}`）を貯める土台ができた（[data-model.md §16](./design/data-model.md)・[session.md](./spec/session.md) §5）。これは「苦手な問題に寄り添ったアドバイスをする」ための素材で、貯めるところまでが実装済み・**活用は未着手**。誤り方の素材は間違い履歴（実装済み＝[data-model.md §16](./design/data-model.md) `MissHistory`）が担う。本項は貯まったデータをキャラのセリフに反映する出口。
- 対応：苦手（率が一定以下かつ `seen` が閾値以上の出題種類／間違い履歴に見える傾向）を検出し、キャラがやわらかく寄り添う文言を出す。`プレッシャーをかけない`（[product-concept.md](./product-concept.md) §3・session.md §6）を厳守＝失敗の採点表として突きつけず、誤り方の推測は真因の診断でなくヒント扱い（断定しない。履歴＝事実から表示時に都度計算する）。実現には characters に**新カテゴリ（苦手寄り添い script）**が要る見込み（型・authoring がキャラ人数分ファンアウト）。検出ロジックは session 寄りの純関数に置きテスト対象。
- 関連（出口は2系統で別物・素材は共有）：もう一方の出口＝**苦手を多めに再出題**は parking lot「間違い復習、出題範囲の細かな調整」。好感度アンロック（parking lot）とも素材を共有しうる。前提＝苦手データが貯まっていること（`byTarget`・間違い履歴とも保存は稼働済み＝出口はいつでも作れる）。
- 該当：新規（`src/session/` の苦手検出＋`src/characters/`＋各 `character-<id>-script.md` の寄り添い文言）。型は data-model §16、思想は session.md §5/§6。

### feature-22

**りんのリアクションに「照れ隠し」表情を入れるか決めて配線する**（優先度：低。飾り）

- 背景：りんの「照れ隠し」はストーリー用の表情トークン `bashful` として作成済み（[story/episode-01.md](./story/episode-01.md)・素材は `docs/characters/rin/original/`。パス参照の別系統＝[character-guide](./characters/character-guide.md) §3）。リアクション系（`Expression` パレット）でも照れ隠しを使うかは「rin 実装時に判断」としていたが、りんは実装済みで `reactions` は `{ greeting: 'smug', correct: 'mischievous' }` のまま＝判断が宙に浮いている（旧 parking lot 項目から格上げ）。
- 対応：(1) リアクションで照れ隠しを出す場面があるか決める（候補＝`finished` のお祝い等）。(2) 要るなら、既存の飾り表情 `flustered` を兼用して `bashful` の画像を当てるか、`Expression` に専用キーを足すかを決める（後者は型＝[data-model](./design/data-model.md) §13 の変更）。(3) 画像を WebP 化して配布に置き、`expressions[]`・`reactions` に登録する。要らないと決めたら本項を閉じる。
- 該当：`src/characters/rin/index.ts`・`src/assets/characters/rin/`・[character-rin.md](./characters/rin/character-rin.md) §3「表情アセット」（専用キーなら `src/types/` と data-model §13・character-guide §3 も）。

## リファクタリング

メイン画面（役モード）実装後のレビューで挙がった改善項目。採番は本書冒頭「index」。各エントリは 背景／対応／該当 で記す（優先度順）。

（現在、リファクタリング項目はなし）

## parking lot

後回し・いつかやる候補の置き場（特定の作業に紐付かない将来アイデア）。着手が決まった段で機能追加・リファクタリングへ引き上げる。テーマ別に並べる。

### 学習・出題

- 役満シード生成、手続き的な任意合法和了形の生成。
- 間違い復習、出題範囲の細かな調整（苦手を多めに再出題。苦手データのもう一方の出口＝寄り添いアドバイスは [feature-14](#feature-14)）。
- 実機での感性チェック（hinting=insight の強さ・ヒントの“気づきビート”（「…あ。」等）の単調さ・smile↔happy の見分け）。[testing](./dev/testing.md) §6 のチェックリストで回す。

### キャラ・演出

- サポートキャラの追加（順次）。好きな役は [decisions.md](./decisions.md) 2026-06-21 の予約表から引く。
- 使い魔アイコン `<id>-familiar.webp` の制作・配置（ヒントボタン＝使い魔。UI の枠は実装済みで、素材未配置の間はテキスト「ヒント」にフォールバック中。[character-guide](./characters/character-guide.md) §2・[hints](./spec/hints.md) §1）。配置して未決が無くなったら [decisions.md](./decisions.md) 2026-06-10 エントリを削除する。
- 頻出表情の差分バリアント（`<id>-portrait-<expr>-b.webp` 等）の用意（`srcs` ローテーションは配線済み＝旧 refactoring-8・素材待ちで休眠。各キャラ `expressions[].srcs` に追記すれば有効化。[character-guide](./characters/character-guide.md) §4）。
- 累計正答数による表情/衣装/特別セリフのアンロック・節目演出（好感度）。
- 連続正解などのゲーム要素。
- 看板牌以外の牌へのキャラ固有絵（低優先・飾り）：1筒/1索の看板牌はキャラ別画像の差し替え機構が実装済み（`src/ui/common/tiles/heroTiles.ts`・[architecture](./design/architecture.md) §5・[character-guide](./characters/character-guide.md) §3「看板牌」）。これを字牌など他の牌へ広げる案。牌SVG（下層）はそのまま描き、その上にキャラのラスター画像を重ねる（ハイライト・赤ドラ・上がり牌マーカーは下層SVGで従来どおり効く）。`Tile`・engine は不変。字牌は嘘字回避のため正字SVGベース＋装飾どまり（[character-guide](./characters/character-guide.md) §4）。アンロック報酬として解放（お祝い止まり）。

### 音

- 音の実装の残り（[sound](./design/sound.md)。BGM の再生部とまお／りんの第1版は実装・配置済み）：(1) SE の再生配線（`AppSettings.se`／autoplay／precache。SE 素材の収集は [feature-9](#feature-9) が先）、(2) 音量スライダー等の拡張（任意）、(3) BGM の音色・ミックスの仕上げ（まお／りんとも MuseScore 基本音源のたたき台のまま。仕上げたら同名上書きで差し替え＝[sound](./design/sound.md)「BGM の制作」）とアプリでの継ぎ目の実聴（任意・気になったら）。

### ストーリーモード

- ストーリーモード（兼ハードモード｜将来・新ゲームモード）：厄災を、麻雀の和了を正しく読んで防ぐタイムアタックの物語モード。「プレッシャーをかけない」方針からの唯一の意図的な例外。構想（システム・物語・実装で新しく要るもの）の正は [story/story-mode.md](./story/story-mode.md)、第1話の台本は [story/episode-01.md](./story/episode-01.md)。

### 計測

- 学習イベント計測のフェーズ2（行動の質）：旧 feature-18 フェーズ1（6イベント＝`track()` ラッパ＋GTM/GA4 配信）は実装・本番稼働済み（契約は [analytics.md](./spec/analytics.md)）。任意の追加計測＝`highlight_click`（クリック内訳ハイライトの利用・`category`）・`character_select`（キャラ選択画面の探索）・`setting_change`（どのルールで遊ぶか・`key`/`value`。`playerName` 除外）・画面遷移の仮想ページビュー・PWA インストール／`display-mode: standalone` 判定（リピーター把握、下記「オフライン計測（GA4）」の前段）・不正解時の `mistake_kind`（`MistakeKind` は諭し表示専用の語彙＝永続化しない〔[data-model.md §16](./design/data-model.md)〕。罠ラベルとして計測に載せる意味があるかは要判断）。発火点（`track()` 呼び出し）を足すだけで取れる（土台は不変）。
- オフライン計測（GA4）：オフライン起動分は素の GTM/GA だと取りこぼす（`gtm.js` 未キャッシュで GTM 自体が起動しない）。取るなら Workbox の offline-google-analytics（`workbox-google-analytics`）で収集リクエストを横取りし Background Sync キュー→再接続時に元タイムスタンプで再送（GA4 のタイムスタンプ補正ウィンドウ〔約72h〕超過は破棄・再接続しない端末は不可）。precache 込みで導入するか判断。GTM の素の導入・オンライン計測は稼働済み。

### 配信・基盤

- LP／キャラ紹介ページからアプリへのキャラ指定ディープリンク（URL でキャラを選択状態にして起動）。ルーティング未整備（[screens.md](./design/screens.md) §6。旧 feature-1／feature-5 から引き継ぐ将来分）。
- 多言語化（i18n）：日本語のみの割り切り（[architecture](./design/architecture.md)「対象環境・非機能の割り切り」）の再評価。機構より authored セリフ（キャラ script×言語数）と手書き静的サイトの再オーサリングが本体コスト。偶発的な海外閲覧はブラウザの機械翻訳で足りる（役名の誤訳・キャラの口調は保証外）ため、ユーザー要望が出たら検討。
- Error Boundary の導入（`src/ui/App.tsx`）：予期しない throw で白画面にせず復旧導線を出す一般防御。既知のクラッシュ経路（enabledYaku 全オフ＝旧 bug-7）は出題入口の無害化（`sanitizeForGeneration`）で塞ぎ済みで、残りは未知の例外への保険。
- Cloudflare への移行（DNS／配信／監視）：作者の他プロダクトを Cloudflare に寄せている流れに合わせ、管理を1か所にまとめる（配信費は GitHub Pages も無料で差はなく、削減は Route 53 の月額・クエリ課金＋登録移管できればドメイン更新費）。段階は (1) DNS を Route 53 → Cloudflare、(2) 配信を GitHub Pages → Cloudflare（Pages か Workers の静的アセット配信かは着手時に公式で確認。`production`→`mahjo.academy`・`preview`→`preview.mahjo.academy` のサブドメイン化で、`/preview/` サブパス＋base 出し分け＋両ブランチ束ねビルドが不要になり、PWA キャッシュも origin で分離）、(3) ドメイン登録の移管（Cloudflare Registrar が `.academy` に対応していれば）、(4) 死活監視＝Workers の Cron Triggers でプロダクト横断の監視スクリプト（落ちたら通知）。新配信先へ E2E のスモーク（`E2E_BASE_URL` で接続先を指定＝[testing](./dev/testing.md) §5）を流して確認してから DNS を切り替える。デプロイ直後に本番／preview へスモークを流す仕組みもこのとき合わせて検討。該当：[development](./dev/development.md)「配布」「デプロイ／ブランチ戦略」・`.github/workflows/deploy-pages.yml`・PWA の base 前提（[architecture](./design/architecture.md) §4）。

### 様子見

- 肥大化の様子見（2026-07-19 調査・起票せず。2026-10-15 に行数を更新。旧 refactoring-19＝generate.ts の SEEDS 切り出しは完了）：`src/ui/main/MainScreen.tsx`（約390行。進行ハンドラ・計測・提示組み立て・オーバーレイ開閉が同居＝画面責務の上限近く。次に状態・演出を足す時に進行系のフック切り出しを検討）／`src/engine/score.ts`（約400行。ドラ計算一式は `fu.ts` と同格の独立関心事＝伸びるなら `dora.ts` へ）。
