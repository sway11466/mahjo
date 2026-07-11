# バックログ

未完了の作業（バグ・機能追加・リファクタリング）を追跡する統合リスト。学習順（役→点数）に合わせ、エンジンは「役判定 → 符・点数」の順に積んである（役モードは役判定と生成まで、点数モードで符・点数を使う）。

## index

次回採番: bug=9 / feature=21 / refactoring=19

項目（バグ bug / 機能追加 feature / リファクタリング refactoring）を追加するときは、該当カテゴリの採番を +1 して ID を継ぐ。完了した項目は本書から削除し、番号は再利用しない（過去の使用済み番号は `git log -p -- docs/backlog.md | grep -oE '(feature|refactoring)-[0-9]+' | sort -u` で確認できる）。状態は「本書に載っていれば未完了／消えていれば完了」で表す（状態列は持たない）。優先度は各エントリ見出しに 高（設計の背骨に関わる）／中／低（飾り・潜在）で記す。

## バグ

判明済みの不具合。採番は本書冒頭「index」。各エントリは 背景／対応／該当 で記す（優先度順）。

（現在、判明済みの不具合はなし）

## 機能追加

実装済みコードに足す機能。採番は本書冒頭「index」。各エントリは 背景／対応／該当 で記す。

### feature-20

**E2E テスト（Large）の導入**（優先度：中）

- 背景：[testing](./dev/testing.md) §5 は E2E 層（ブラウザで実アプリ通し・少数・安定重視）を定義するが、ランナー未導入・テスト未作成（`package.json` に E2E コマンドなし＝仕様にだけ存在する状態）。現状の回帰は Small＋UI単体（jsdom）と人手確認（§6）が担っており、「主要フローがブラウザで繋がる」ことと PWA のオフライン起動は実ブラウザでしか検証できない。
- 対応：Playwright を導入し、シナリオは [testing](./dev/testing.md) §5 の5本（役モード通し／クイズ 回答→リアクション→解説／点数モードのハイライト連携／設定の反映と localStorage 永続／PWA オフライン起動）。実行は別コマンド（例 `npm run test:e2e`。コマンド名・CI 組み込みは導入時に確定し testing.md §2/§5/§10 へ反映）。少数・安定重視＝Small で守れるものは E2E に足さない（§1 の SML 方針）。
- 該当：新規（`e2e/` 等の置き場＋ Playwright 設定）・`package.json`（devDependencies・スクリプト）・[testing](./dev/testing.md) §2/§5/§10（確定内容の反映）。

### feature-9

**効果音（SE）素材の収集・整備**（優先度：低）

- 背景：[sound](./design/sound.md) は SE の方針・効果音一覧を定めたが、素材ファイルが未収集。ライセンスは表記不要に統一する方針（CC0／自作 AI 生成。public リポ＋静的配信での再配布グレーを回避）。音の実装（再生配線・BGM）は parking lot「音（SE/BGM）の実装」だが、SE 素材はその前提として先に揃える必要がある。
- 対応：[sound](./design/sound.md)「効果音一覧」の MVP 分（牌を置く・選択肢・正解・不正解・終了）から着手。Kenney（UI 系まとめ取り）・Pixabay（牌音・正解・不正解・ファンファーレ）等の表記不要ソースで候補を集めて選定 → 静的アセット化（[character-guide](./characters/character-guide.md) §3 の WebP/最適化に準じる）→ ライセンス台帳（ファイル名／出所URL／ライセンス種別）を作成（置き場は着手時に決定）。選定は人手の感性領域（[testing](./dev/testing.md) §6）。次・後の優先度分（ヒント・解説ハイライト・メニュー・あいさつ）は順次。
- 該当：新規（資産。`src/assets/` 配下＋台帳）。方針の正は [sound](./design/sound.md)「制作」。再生実装は parking lot「音（SE/BGM）の実装」。

### feature-12

**設定画面に並べただけで未実装の項目を、実際に動くよう配線する**（優先度：低）

- 背景：設定画面とその保存（`src/storage/`）は実装済みで、設定項目は2種類ある。**すでに採点エンジンに効くもの**（`kuitan`・`kiriageMangan`・`kazoeYakuman`・`doubleYakuman`・`enabledYaku`）は動作する。一方**挙動が未実装のもの**は、設定画面に項目だけ並べて「機能追加予定」表示でグレーアウトし（コード上は `RuleSettingsScreen.tsx`・`AppSettingsScreen.tsx` の `soon` 行）、値の保存だけ通している＝操作しても何も起きない。この「保存はされるが挙動が無い」項目を1つずつ「設定 → 実際の挙動」に繋ぐのが本項。配線できた項目から `soon` を外して編集可へ昇格する。
- 対応：項目ごとに独立して着手できる（赤ドラ〔`akaDoraCount`〕は対応済み＝生成・表示・設定UI とも稼働）。
  - 呼び方（`playerName`）：プレイヤーの呼び名を Persona のセリフに差し込む（[character-guide](./characters/character-guide.md) §2）。差し込みの仕組み（テンプレート）自体が未実装なので機構ごと用意する。
  - 牌のランダム並び（`randomTileOrder`）：手牌を正準順でなくシャッフルして描画する（Tile データは不変・表示側だけ＝[data-model](./design/data-model.md) §1）。
  - 後付け（`atozuke`）：生成・和了可否の判定に反映する（採点には影響しない。[scoring-rules](./spec/scoring-rules.md) §5）。
  - 対象外（別項目で追跡）：効果音・音楽（`se`/`bgm`）＝parking lot「音（SE/BGM）の実装」＋[feature-9](#feature-9)／レア役（`rareYaku`）＝parking lot・[scoring-rules](./spec/scoring-rules.md) §1.3（未対応）。
- 該当：`src/ui/settings/RuleSettingsScreen.tsx`・`src/ui/settings/AppSettingsScreen.tsx`（`soon` 行の解除）・`src/engine/generate.ts`（後付け）・`src/characters/`＋`src/session/`（呼び方差し込み）・`src/ui/main/`（牌並び表示）。

### feature-14

**苦手データをキャラの寄り添いアドバイスに活かす**（優先度：低。だいぶ先）

- 背景：`Progress` に苦手集計（`byTarget`＝出題種類ごとの `{seen, correct}`）を貯める土台ができた（[data-model.md §16](./design/data-model.md)・[session.md](./spec/session.md) §5）。これは「苦手な問題に寄り添ったアドバイスをする」ための素材で、貯めるところまでが実装済み・**活用は未着手**。誤り方の素材は間違い履歴（実装済み＝[data-model.md §16](./design/data-model.md) `MissHistory`）が担う。本項は貯まったデータをキャラのセリフに反映する出口。
- 対応：苦手（率が一定以下かつ `seen` が閾値以上の出題種類／間違い履歴に見える傾向）を検出し、キャラがやわらかく寄り添う文言を出す。`プレッシャーをかけない`（[product-concept.md](./product-concept.md) §3・session.md §6）を厳守＝失敗の採点表として突きつけず、誤り方の推測は真因の診断でなくヒント扱い（断定しない。履歴＝事実から表示時に都度計算する）。実現には characters に**新カテゴリ（苦手寄り添い script）**が要る見込み（型・authoring がキャラ人数分ファンアウト）。検出ロジックは session 寄りの純関数に置きテスト対象。
- 関連（出口は2系統で別物・素材は共有）：もう一方の出口＝**苦手を多めに再出題**は parking lot「間違い復習、出題範囲の細かな調整」。好感度アンロック（parking lot）とも素材を共有しうる。前提＝苦手データが貯まっていること（`byTarget`・間違い履歴とも保存は稼働済み＝出口はいつでも作れる）。
- 該当：新規（`src/session/` の苦手検出＋`src/characters/`＋各 `character-<id>-script.md` の寄り添い文言）。型は data-model §16、思想は session.md §5/§6。

## リファクタリング

メイン画面（役モード）実装後のレビューで挙がった改善項目。採番は本書冒頭「index」。各エントリは 背景／対応／該当 で記す（優先度順）。

### refactoring-12

**キャラクターガイドの見直し**（優先度：中）

- 背景：[character-guide.md](./characters/character-guide.md) は キャラの位置づけ・アセット・作り方（AI 生成の知見含む）・データ管理を一手に抱えて肥大化しており、まお／りんの実制作で得た知見（同一セッション t2i・セッション再構築・画質と一貫性のトレードオフ等）が §4 に積み増しで足されてきた。記述の重複・粒度のばらつき・他 doc（[data-model](./design/data-model.md) §13・[architecture](./design/architecture.md) §5・[hints](./spec/hints.md)・各 `character-<id>.md`）との境界の曖昧さがあり、新キャラ追加時に「どこを読めば作れるか」が辿りにくい。あわせて**記述が決定事項（[decisions.md](./decisions.md)）や実装・実態と乖離している箇所**が疑われる。概要説明と実態のズレの例（旧例「1キャラ＝1doc」は解消済み。冒頭は「doc＋配布アセット」、§2 は「1キャラ＝4ファイル」に更新されている）：
  - §2 冒頭の「定義 doc は 基本情報・ペルソナ・ビジュアル・セリフ の**4章**」が実態と食い違う——サウンド doc の追加で定義 doc には §5 音楽（BGM）が増えており（`character-mao.md`）、§5 ファイル構成表のサウンド doc 行自身も「定義 doc §5 はここへのポインタ」と書いていて、同一 doc 内で矛盾する。
  - 「キャラを追加してもヒント内容（教える中身）は書き換え不要」も誤解を招く——書き換え不要なのは中立の教える中身（hint-base・HintProvider）だけで、各キャラは全ヒントキー分の **script（キャラの声のヒント文）を新規に authoring** する必要がある（§2・`character-<id>-script.md` §2、hint-base 全キー網羅）。「ヒントの authoring が不要」とは読めない言い回しに直す。

  この種の先頭サマリと本文・実態のズレを洗い出して直す。
- 対応：(1) 構成と記述を見直す——重複の統合、章立て・粒度の整理、他 doc と重複する説明はリンクに寄せて正本を一本化、実制作知見（§4）の要点抽出。(2) **決定事項・実装/実態との乖離を調査**し、ガイドの記述を実態（または最新の決定）に合わせる（どちらが正かは個別判断。実態が正ならガイドを直す／ガイドが正なら実装側の課題として別エントリに切り出す）。記述だけの整理で設計判断の変更は含まない（変更を伴う見直しが出たら別エントリ／ADR に切り出す）。具体の見直し・乖離の洗い出し範囲は着手時に確定する。
- 該当：`docs/characters/character-guide.md`（＋必要に応じ参照先 `docs/characters/<id>/*` への振り分け）。重複の正本一本化で参照先 doc 側を直す場合はそこも含む（例 看板牌仕様の一本化で [architecture.md](./design/architecture.md) §5、テーマ色/差し色/モチーフの型コメント整理で [data-model.md](./design/data-model.md) §13 を編集）。乖離調査の突き合わせ先＝[decisions.md](./decisions.md)・[session.md](./spec/session.md) §4・各 `character-<id>-script.md`・`src/characters/`。

### refactoring-11

**CSS の共通化（デザイントークン集約・繰り返しパターンの共有）**（優先度：中）

- 背景：[architecture](./design/architecture.md) §5 は「色など装飾値は直値でなく CSS カスタムプロパティ（デザイントークン）に集約し意味のある名前で参照する」と定めるが、`src/ui/index.css` の `:root` トークンは少数（`--color-bg`・`--color-text`・`--char-glow`・`--color-highlight` 等）で、多くの装飾値が各コンポーネント CSS に直値でハードコードされ重複している。例：パネル枠 `#3b3f4d`（ScoreTable/YakuList/FuCounting/ReferenceOverlay/ChoicePanel 等で多数）・くすみ文字 `#9aa3b2`／`#8a93a3`／`#c8ccd6`・本文色 `#f2f2f2`・カード背景 `linear-gradient(160deg, #3a3550, #211f2e)`（StartScreen/settings/CharacterStage で同一）・バッジ `#1a1a1a`＋`#e2c44e`（YakuList/MainScreen）・ボタン枠 `#5a6172`→`#79808f`（BackButton/StartScreen/ChoicePanel）。値が散っているため一括テーマ変更・ダーク/キャラ別テーマ拡張（§5 が掲げる狙い）ができず、配色の意図も読み取りにくい。
- 対応：(1) 繰り返し使われる装飾値を `index.css` の `:root` にセマンティックなトークンとして集約（例 `--panel-border`・`--text-muted`・`--card-bg`・`--badge-bg`/`--badge-text`・`--btn-border`/`--btn-border-hover`）し、各 CSS は直値をやめてトークン参照に置換する。(2) 同型の繰り返しパターン（カード／パネル枠・サブ画面のメニューボタン・くすみ見出し等）が複数画面で重複しているものは、`.subscreen` と同じ発想で共有クラス化できるか検討（ただし「無駄を消すだけのために公開クラス/抽象を増やして意図がぼやけるなら不採用」＝[architecture](./design/architecture.md) 冒頭の指針に従う。トークン集約を主、クラス共有は意図が明確になる範囲に留める）。スート色（`--color-man` 等の意味づけ＝§5）は壊さない。見た目は不変（リファクタなので回帰なし＝目視確認）。
  - **キャラクター固有のスタイル定義は、アプリ共通トークンに混ぜず、キャラクターごとに持つ**（キャラ追加＝データ＋そのキャラのアセット／スタイルで完結し、共通 `:root` の編集を要しない＝[character-guide](./characters/character-guide.md)「キャラを足してもロジック不変」の精神）。キャラの世界観に属する装飾値（御札の朱 `#c0392b`・墨 `#2a2320`＝`character/items/Ofuda.css`、月・装飾モチーフ＝`character/decor/`、法具ホバー＝`character/RitualHoverMark.css`、立ち絵ステージ＝`character/CharacterStage.css` のキャラ寄り装飾）は、共通トークンへ吸い上げず各キャラのスコープ（当面は当該 `ui/character/**` CSS、将来はキャラ別テーマ）に閉じる。テーマ色・差し色は既存どおり `--char-glow`/`--char-accent` 等の CSS 変数で App がキャラ値を流す（[architecture](./design/architecture.md) §5・[character-guide](./characters/character-guide.md) §2「テーマ色／差し色」）＝共通トークンは「中立な器」、具体色は「キャラが注ぐ」分担を保つ。
- 該当：`src/ui/index.css`（中立トークン追加）・`src/ui/**/*.css` 全般（直値→トークン置換。とくに `main/score-table`・`main/yaku-list`・`main/fu-counting`・`common/ReferenceOverlay`・`common/BackButton`・`start`・`settings`・`main/quiz/ChoicePanel`）。キャラ固有スタイルは `src/ui/character/**`（`items/Ofuda.css`・`decor/`・`RitualHoverMark.css`・`CharacterStage.css`）にキャラ単位で保持（共通トークンへ移さない）。指針は [architecture](./design/architecture.md) §5・[character-guide](./characters/character-guide.md)。

## parking lot

後回し・いつかやる候補の置き場（特定の作業に紐付かない将来アイデア）。着手が決まった段で機能追加・リファクタリングへ引き上げる。

- 学習イベント計測のフェーズ2（行動の質）：旧 feature-18 フェーズ1（6イベント＝`track()` ラッパ＋GTM/GA4 配信）は実装・本番稼働済み（契約は [analytics.md](./spec/analytics.md)）。任意の追加計測＝`highlight_click`（クリック内訳ハイライトの利用・`category`）・`character_select`（キャラ選択画面の探索）・`setting_change`（どのルールで遊ぶか・`key`/`value`。`playerName` 除外）・画面遷移の仮想ページビュー・PWA インストール／`display-mode: standalone` 判定（リピーター把握、下記「オフライン計測（GA4）」の前段）・不正解時の `mistake_kind`（`MistakeKind` は諭し表示専用の語彙＝永続化しない〔[data-model.md §16](./design/data-model.md)〕。罠ラベルとして計測に載せる意味があるかは要判断）。発火点（`track()` 呼び出し）を足すだけで取れる（土台は不変）。
- 役満シード生成、手続き的な任意合法和了形の生成。
- 間違い復習、出題範囲の細かな調整。
- サポートキャラの追加（順次）。
- LP／キャラ紹介ページからアプリへのキャラ指定ディープリンク（URL でキャラを選択状態にして起動）。ルーティング未整備（[screens.md](./design/screens.md) §6。旧 feature-1／feature-5 から引き継ぐ将来分）。
- オフライン計測（GA4）：オフライン起動分は素の GTM/GA だと取りこぼす（`gtm.js` 未キャッシュで GTM 自体が起動しない）。取るなら Workbox の offline-google-analytics（`workbox-google-analytics`）で収集リクエストを横取りし Background Sync キュー→再接続時に元タイムスタンプで再送（GA4 のタイムスタンプ補正ウィンドウ〔約72h〕超過は破棄・再接続しない端末は不可）。precache 込みで導入するか判断。GTM の素の導入・オンライン計測は稼働済み。
- 累計正答数による表情/衣装/特別セリフのアンロック・節目演出（好感度）。
- 音の実装（[sound](./design/sound.md)）。**BGM は実装済み**＝コード生成（Web Audio・2層）を App ルートの1本のコントローラ（`src/ui/audio`：notation/improv/synth/player/useBgm）で鳴らす（`AppSettings.bgm`＋選択キャラの `Character.bgm` を見る／autoplay 解禁は初回操作／キャラ切替でクロスフェード）。まおの曲は投入済み。**残り**：(1) SE の再生配線（`AppSettings.se`／autoplay／precache。SE 素材の収集は [feature-9](#feature-9) が先）、(2) 他キャラの `bgm` データ（りん等＝各 `character-<id>-sound.md` 作成後）、(3) 音量スライダー等の拡張（任意）。
- 連続正解などのゲーム要素。
- **ストーリーモード（兼ハードモード｜将来・新ゲームモード）**：世界に厄災（＝人間の悪意を増幅する思念体。[characters/world.md](./characters/world.md) §3）が起こりかけるが、麻雀の和了を正しく読むと防げる物語モード。**通常の「プレッシャーをかけない」方針からの唯一の意図的な例外**＝ハードたるゆえん（[product-concept](./product-concept.md) §3 と緊張するが、下記の失敗演出で優しさを保つ）。舞台＝[characters/world.md](./characters/world.md)。
  - **システム（構想）**：練習と同じ手牌が出る→役/点数を当てる**タイムアタック**。**1ラン＝1ステージ**（タイマー全体一本・単位/閾値はステージ内固定）。
    - **得点**：正解＝その手の配点ぶん加点／誤答＝失点。**速く回すほど大量得点**＝習熟→速い判断→報酬の好循環。
    - **当てる単位はステージで進化**。序盤は易しい役のみ＝**役だけ当てればOK**、目標も点数でなく「XX役を目指せ」。後半（点数へ上がる先・ボス構成）は **TBD**（練習モードの `QuizTarget` は翻/点数の2値＝[data-model](./design/data-model.md) §12。ステージ用の単位が要るならその設計時に別途定める）。
    - **ブタ（役無し手）**：正解しても0点・誤答は失点＝厄災の惑わし（「正しい読みが鎮め、誤り・悪意が太らせる」§3 と一致）。
    - **失点はストーリーで重くなる**：序盤ほぼ無害→最終＝厄災本体（ラスボス）で大量失点。緊張を段階的にしか出さない。
    - **好感度ボーナス**：そのストーリーに登場するキャラとの好感度が高いと得点にボーナス（好感度＝[data-model](./design/data-model.md) §16 Progress 由来。細部 **TBD**）。
    - **固定ルール**：`RuleSettings` 設定不可＝ステージごとに難度帯をオーサリングで固定。
    - **スキップなし・解説なし**（テンポ優先。学ぶ場は練習モード＝「もっと勉強しなきゃ」で送り返す導線）。
    - **失敗演出（人を責めない枠）**：救済者が現れ役満で締め、「もっと勉強しなきゃ！」で終わる＝罰でなく自発の動機づけ＋役満を拝めるご褒美。**救済者は話で変わる**（第1話＝ひすい姉さん。当初案のロウシ等も話次第）。リトライでステージを進める想定。
  - **第1話（構想）**：まおとりんが**食事の支度（見習いの役目）で市場へ**出かけ、町でばったり出くわす。そこで**厄災の瘴気にやられた人**が騒ぎを起こすが、その場の占い師は二人だけ＝**まお・りんが協力して祓う**（りんの一方的ライバル心とまおの素直な慕いが交差する初手＝[characters/world.md](./characters/world.md) §5）。**失敗＝ひすい姉さんが登場して救済／成功＝ひすいが登場して二人を褒める**（ひすい＝両世代の橋渡し・慕われる姉＝§5 と整合）。詳細な台本（あらすじ＋セリフ＋必要アセット）は [story/episode-01.md](./story/episode-01.md)。
  - **実装の新規**：(1) **ブタ（役無し）生成**＝今の生成器は常に役ありを保証（[architecture](./design/architecture.md) §3・[scoring-rules](./spec/scoring-rules.md) §1.4）なので役無しを意図的に作るモードが要る。(2) **ステージ定義データ**＝単位/難度帯/ブタ率/制限時間/閾値/失点スケール/物語ビート/登場キャラ/救済者 を持つオーサリングデータ（「ロジック不変・データで足す」枠）。
  - **物語の骨格**：厄災が増幅した悪意の小さな危機（町のケンカ等）→厄災本体へ。**四方＝四風の拠点**（[characters/world.md](./characters/world.md) §2）をステージの幕に対応づけ可（世界地図＝難易度カーブ）。着手時に product-concept §3 との整合を最終確認＋専用のストーリー doc を新設。
- キャラ固有のシグネチャ牌（低優先・飾り）：1ピンや字牌など一部の牌に、選択中キャラの固有絵を見せる。牌SVG（下層）はそのまま描き、その上にキャラのラスター画像をオーバーレイで重ねる方式（ハイライト・赤ドラ・上がり牌マーカーは下層SVGで従来どおり効く）。`Tile`・engine は不変、ui に「キャラ→牌識別→差し替え素材」の解決を足すのみ。字牌は嘘字回避のため正字SVGベース＋装飾どまり（[character-guide](./characters/character-guide.md) §4）。アンロック報酬として解放（お祝い止まり）。
- 使い魔アイコン `<id>-familiar.webp` の制作・配置（ヒントボタン＝使い魔。UI の枠は実装済みで、素材未配置の間はテキスト「ヒント」にフォールバック中。[character-guide](./characters/character-guide.md) §2・[hints](./spec/hints.md) §1）。
- 頻出表情の差分バリアント（`<id>-portrait-<expr>-b.webp` 等）の用意（`srcs` ローテーションは配線済み＝旧 refactoring-8・素材待ちで休眠。各キャラ `expressions[].srcs` に追記すれば有効化。[character-guide](./characters/character-guide.md) §4）。
- りんの「照れ隠し」表情：ストーリー用 `bashful` を作成済み（[story/episode-01.md](./story/episode-01.md)・素材は `original/`）。リアクション系でも 照れ隠し が要るかは rin 実装時に判断（既存 `flustered` 兼用か、専用キー追加か。[character-rin](./characters/rin/character-rin.md)）。
- 実機での感性チェック（hinting=insight の強さ・ヒントの“気づきビート”（「…あ。」等）の単調さ・smile↔happy の見分け）。[testing](./dev/testing.md) §6 のチェックリストで回す。
- Error Boundary の導入（`src/ui/App.tsx`）：予期しない throw で白画面にせず復旧導線を出す一般防御。既知のクラッシュ経路（enabledYaku 全オフ＝旧 bug-7）は出題入口の無害化（`sanitizeForGeneration`）で塞ぎ済みで、残りは未知の例外への保険。
- decisions.md 2026-06-10 エントリの整理（内容は hints / character-guide / character-mao-script へ移行済み。使い魔素材が入って未決が無くなったらエントリを削除）。
