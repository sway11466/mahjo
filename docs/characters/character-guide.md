# キャラクターガイド

サポートキャラの「位置づけ（§1）・構成要素（§2）・画像アセットの仕様（§3）・作り方（§4）・ファイル構成とデータ管理（§5）」をまとめる。各キャラ固有の中身は各キャラの doc＋配布アセット（パス・命名は §5「ファイル構成」）に置き、本ガイドは汎用の規則と手順に徹する。新キャラを作るときは §4「追加手順」から読み始め、必要な節へ飛ぶ。


## 1. 位置づけと役割

サポートキャラは学びの中身そのものではなく、伝え方と継続を担う：

- ヒントをキャラの口調で伝える（中身は中立、声だけキャラ依存）。
- 回答の正誤にリアクションする（表情＋セリフ）。
- 学習継続を後押しする（お祝い・アンロック等）。プレッシャーはかけない（product-concept §3）。
- 教える中身（どの着目ポイントを・どの順で・どの具体度で気づかせるか＝hint-base・HintProvider）は中立で hints 側が管理し、キャラを足しても書き換えない。ただし「中身が不変」は「authoring が不要」ではない：各キャラは hint-base の全キー分のヒント文・成立役の解説文・誤答の諭し文を自分の声で新規に書く（§2「セリフ」）。キャラ追加で変えないのはロジックと中立データで、足すのはそのキャラのデータ（doc・セリフ・画像・任意の BGM）。


## 2. キャラクターの構成要素

キャラ1体は 定義 doc・セリフ doc・サウンド doc・画像プロンプト doc の4 doc＋配布アセットで構成する（全ファイルのパス・命名は §5「ファイル構成」が正本）。定義 doc は 基本情報・ペルソナ・ビジュアル・セリフ・音楽（BGM） の5章（雛形＝まおの定義 doc）。型は data-model §13。本節は定義 doc の各章に「何を定義するか」を対応させる。作る手順は §4。

### 基本情報

キャラの素性。定義 doc「基本情報」章で定義する。

- id（レジストリ登録名・アセットパス `characters/<id>/`）・表示名・位置づけ（何者か。世界・人物相関の正は world.md）。
- 好きな役：個性フックの素（手にあるとき正解／解説で専用セリフを優先＝下記「セリフ」）。登場予定キャラ間で被らせない割り当て表は decisions.md（2026-06-21）。
- `unlock`：アンロック条件（任意・未対応。型は data-model §13。思想は §4「バリエーションと飽き対策」）。

### ペルソナ

キャラの声の素。性格・人称・口調を 定義 doc「ペルソナ」章で定義する（具体のセリフはセリフ doc）。

場面→表情はキャラごとに上書きできる（決定）。土台は session §4 の既定マップ（場面 `ReactionTrigger` → 表情：greeting=neutral／dealing=thinking／hinting=insight／explaining=smile／correct=happy／wrong=troubled／finished=happy）で、各キャラは `Character.reactions` で場面ごとに上書きする（例 小悪魔キャラ `{ correct: 'mischievous', greeting: 'smug' }`）。上書きしない場面は既定どおり。上書きする場面は定義 doc「ペルソナ」章とセリフ doc §1 の見出しに表情を書く（既定どおりの場面の併記は任意）。

### ビジュアル

キャラの見た目の identity。各キャラは 定義 doc の「ビジュアル」章で次を定義する（雛形＝まおの定義 doc §3）。中身（何を描くか）はキャラ依存で、本節は「どの要素を定義するか」を共通化する。

- 外見コンセプト：一言で誰だと分かる説明＋核（髪型・衣装・配色）。生成プロンプトの土台。
- 衣装の模様：地色・要素・ゾーン配置を確定値として持つ（生成・表情差分で維持する正。指定のコツは §4「コツ」）。
- モチーフ：キャラの世界観を形にする視覚語彙。詳細は下記「モチーフ」。
- テーマ色：identity の主色（`Character.themeColor`）。詳細は下記「テーマ色」。
- 差し色：identity の従色（`Character.accentColor`）。テーマ色と対で、装飾の星・タイトル等の識別色。詳細は下記「差し色」。
- 使い魔：この世界のキャラは必ず使い魔（familiar）を1体持つ（世界設定）。動物・名前・見た目・性格は各キャラが定義（モチーフではなく独立要素）。役割＝ヒントの担い手で、アプリ内では声を出さない（authoring を1人分に保つため。「使い魔の示唆 → キャラのひらめき」語り口の正は hints §1・各キャラのセリフ doc §2）。画像は `<id>-familiar.webp`（→ §5）。ヒントボタンがこの絵を使う配線は実装済み（表示位置・サイズは ui が決める）で、未配置の間はテキスト「ヒント」ボタンにフォールバックする。トップ／キャラ選択画面への表示は将来の余地。

#### モチーフ

キャラの世界観を形にする視覚語彙。どちらも `Character.motif`（型は data-model §13）に文字列キーを持ち、ui の resolver が key→SVG を解決する（データ駆動・二層分離。architecture §5・data-model §10）。キーは各キャラ＋resolver が持ち、汎用型 `Character` には特定キャラのキーを焼き込まない（未登録キーは適用なし）。役割で2種に分ける：

- 法具モチーフ（皮）：キャラ固有の道具を、機能UI要素に被せる差し替え。データは `Character.motif.ritual`（文字列キー）。中立データ（選択 index・正誤・`HighlightTarget`）には触れず、ui の resolver `selectionMark.tsx` が key から皮を解決する。皮の SVG は `ui/character/items/`。例 まお＝御札（符）＝`ritual: 'ofuda'`／りん＝銀鈴＝`ritual: 'suzu'`。
  - 実装済みの適用先：回答（4択）で自分が選んだ選択肢に乗せる選択マーク（メイン画面）、スタート画面メニューのホバー（`RitualHoverMark`）。
  - 将来の余地（未実装）：解説ハイライト演出（該当牌に符を貼る等）、看板牌（1筒/1索）のキャラ別絵（§3「看板牌」）。
- 装飾モチーフ：背景の雰囲気レイヤ（採点に無関係・identity 表現）。2層構成 ── ①共通の星・きらめき（`StarField`）を全キャラ既定で敷く（魔女世界の夜空）、②その上にキャラ固有モチーフ（`Character.motif.decor` の文字列キー → 形）を重ねる。データは `Character.motif.decor`＋差し色 `Character.accentColor`。ui の resolver（`ui/character/decor/`）が key から固有SVGを解決し、`themeColor`・`accentColor` を CSS 変数で流す（同じ SVG でも色は各キャラに追従。星も `accentColor` 追従＝まお金／りん銀）。例 まお＝三日月＝`decor: 'moon'`／りん＝蝶＝`decor: 'butterfly'`（星は共通）。
  - 適用範囲：キャラの立ち絵を置く画面枠（`CharacterScreenFrame`＝スタート画面とサブ画面〔設定・キャラクター〕）。メイン画面の背景への流用は将来の余地。
- 共通：固有モチーフのキーが未指定／未登録なら星だけ（固有の形は無し）。`decor: 'none'` で装飾を完全オフ（星も固有も出さない＝夜空が合わないキャラ向け）。新しい固有モチーフは SVG 1枚＋resolver に1行で足す（ロジック不変・星は共通なので描き直し不要）。状況では変えない（テーマ色と同じ）。

#### テーマ色

キャラの identity を表す中立な1色（`Character.themeColor`。型は data-model §13）。各キャラの定義 doc に固有値を1つ持たせる（キャラのビジュアル配色から代表色を選ぶ）。

- 用途：ui の装飾。立ち絵の背後の淡いグローを主用途に、「いま誰と学んでいるか」の空気を映す（背骨：キャラ駆動）。ui は `--char-glow` で流し、選択中バッジ・枠線・ボタンの強調色にも同じ変数を使う。採点には無関係。見た目の指針は uxui §3.4。
- フォールバック：未指定キャラは既定色（`defaultThemeColor`。resolver は `ui/character/themeColor.ts`）になる。必須ではない（無指定でも動く）。
- 状況では変えない：テーマ色は常に一定。正誤など状況で背景色を変える（誤答で赤くする等）はしない＝プレッシャーをかけない（product-concept §3）。

#### 差し色

キャラの identity の従色（`Character.accentColor`。型は data-model §13）。テーマ色（主色）と対で、装飾の星・きらめき・タイトル等の識別色に使う（採点外）。各キャラの定義 doc に1色持たせる（ビジュアル配色の差し色＝金・銀・朱 等から選ぶ）。

- 用途：ui の装飾。装飾モチーフSVG（architecture §5）の色として ui が `--char-accent` で流す（同じ SVG でも色はキャラに追従）。
- フォールバック：未指定なら装飾はハイライト色（金）で描かれ、テーマ色側の発光だけで成立（必須ではない）。
- 状況では変えない：テーマ色と同じ。

### セリフ

セリフ本体はセリフ doc：場面別セリフ（§1）＋着目ポイント別ヒントセリフ（§2）＋成立役の解説セリフ（§3）＋誤答の諭しセリフ（§4）を全量。ヒント・解説は hint-base の役/ドラ キー、誤答は全 `MistakeKind` を網羅（突き合わせはテスト `src/characters/characters.test.ts` が機械検証）。設計は hints、解説・誤答の流れは screens §3。解説・誤答は回答後なので役名を出してよい（ヒントは言わない）。誤答の基準は hint-base「誤答の諭し素」。

各キャラはアプリの場面（`ReactionTrigger`）にセリフを用意する。場面の正準一覧・発火タイミング・必須度は session §4 場面（リアクション）の正準（アプリの定義）。本節はそこを埋めるセリフ側の共通規則（ヒントセリフの規則は hints）：

- 必須場面（`greeting`/`dealing`/`correct`/`wrong`/`finished`）は `Persona` のプールに最低2本（ランダム表示＝飽き対策）。
- 答え（役名・点数の確定値）はどの場面セリフにも入れない。確定値は4択・解説パネルが開示する（キャラは確定値を言わない）。
- `hinting`／`explaining` は場面セリフのプールを持たない（プールが無いので各キャラのセリフ doc §1 場面別セリフにも載せない）。`hinting` のセリフは §2 ヒント文を表示し、`explaining` の文言は §3 解説セリフ（`ExplainScript`＝`Character.explain`）が1役ずつ出す。表情は既定マップ（`hinting`=insight／`explaining`=smile）に従い、`reactions` で上書き可。これらに別途「場面の一言」を足したいなら `Persona` 拡張が要る（別途・型変更。当面は不要）。
- 個性フック（好きな役の特別セリフ）：手に好きな役があるとき、`correct` は通常プールより優先して専用ひとことを出してよい。`explaining` は §3 解説文にその役の一言を織り込む（例 まお＝一気通貫の解説に「…わたしの好きな役なんです」）。ヒント中は役名を言わず嬉しさだけ滲ませる。一般機構（型・選択ルール）への格上げは別途。

### 表記規則（カナ読み）

難しい漢字語にはカナの読みを括弧で添える（初心者が読めるように）。この規則はキャラのセリフに限らず、プレイヤーに見える authored 文すべて（解説 `explain`・誤答の諭し `mistakes`・`Persona` セリフ・ヒントセリフ `script`・クイズの設問文・役一覧などの参照テキスト）に効く。置き場は当面ここ（キャラ作りで最も多く参照するため）。

- 役名や難読の麻雀用語が出るとき、`七対子（チートイツ）` のように括弧カナを書く。付ける頻度はユーザーが認識する「ひとまとまり」（連続して読む単位）での初出に1回（同じまとまりの2回目以降は任意）。まとまりは文脈で決まる：
  - 解説ウォークスルー（回答後の連続した説明）＝ウォークスルー全体で初出1回（＝最初に出る行で付ければ以降は任意）。
  - 役一覧＝各行が独立した参照単位（フィルタで出入りし、どの行にも飛べる）なので行ごと初出（＝実質どの行にも付く）。
  - 1画面の静的テキスト＝その画面で初出1回。1つのセリフ・設問文＝その吹き出し内で初出1回。
- 役名の読みは scoring-rules §1 役テーブルの「読み」列に合わせ、役名がすでにカナ（リーチ等）なら不要。用語の読みは下記「麻雀用語の読み」に統一する。ネスト括弧（`牌（…（カナ））`）になるときは言い回しを変えて避ける。ヒントセリフでも用語の読みは添えてよいが、答え（役名・確定値）は出さない原則は維持する。採点パネルの役名ラベル等の構造化表示は ui ヘルパが `Yaku.reading` から読みを付けるので、authored 文では二重に書かない。
- 麻雀用語の読み（authored 文で統一。新出はここに追記）：門前（メンゼン）・聴牌（テンパイ）・順子（ジュンツ）・刻子（コーツ）・槓子（カンツ）・槓（カン）・雀頭（ジャントウ）・面子（メンツ）・数牌（シューパイ）・字牌（ジハイ）・么九（ヤオチュー）・暗刻（アンコー）・暗槓（アンカン）・対子（トイツ）・副露（フーロ）・加槓（カカン）・単騎（タンキ）・両面（リャンメン）・双碰（シャンポン）・嵌張（カンチャン）・辺張（ペンチャン）・嶺上牌（リンシャンパイ）・九面（キューメン）・三元牌（サンゲンパイ）・風牌（フォンパイ）・場風（バカゼ）・自風（ジカゼ）・他家（ターチャ）・配牌（ハイパイ）・筒子（ピンズ）・索子（ソーズ）。

### 音楽（BGM）

キャラ別に1曲（任意。無いキャラは無音で成立する）。定義 doc §5 はサウンド doc へのポインタで、曲の狙い・調・テンポ・小節数・ループ長・ラウドネス・たたき台の出所はサウンド doc が持つ。方式（音源ファイル・ランタイムキャッシュ）と制作の流れ（たたき台 → MuseScore → `make-bgm.ps1`）の正は sound.md「BGM の実現方式」「BGM の制作」・ADR-0004。データは `Character.bgm`（音源パス＋`loopStart`/`loopEnd`。型は data-model §13）で、取得・再生は ui（`src/ui/audio`）。


## 3. 画像アセット

§2 のキャラ（identity）を実体化する画像ファイルの仕様（成果物）。作り方の手順は §4。

アプリ内でキャラが出る場所（ヒント表示・キャラ切替・正誤リアクション・立ち絵）から逆算：

| 用途 | 画像 | 必須度 |
|---|---|---|
| ヒント表示・リアクションの基本 | ポートレート（バストアップ）＋表情差分 | 必須はベース顔1枚（neutral。ui の最終フォールバック先なので、別表情で迎えるキャラも neutral を持つ） |
| キャラ切替UI | セレクト用サムネ（小・正方形。ポートレートのトリミング可） | 必須（無ければ立ち絵にフォールバック） |
| スタート画面・キャラクター画面 | 立ち絵（全身） | 任意（無ければベース顔→サムネにフォールバック） |
| ヒントボタン | 使い魔 | 任意（無ければテキスト「ヒント」） |

表情差分（`Expression`）。既定マップに紐づく表情（場面 `ReactionTrigger` → 表情）：

- `neutral`（待機・あいさつ｜greeting の汎用既定。必須）
- `thinking`（考え中・出題中｜dealing）
- `insight`（ひらめき・ヒント表示中｜hinting）
- `smile`（穏やかな笑み・説明/解説中｜explaining）
- `happy`（正解の喜び・終了のお祝い｜correct/finished）
- `troubled`（困り顔・ミス｜wrong）

飾り表情（既定トリガーなし。`reactions` で割り当てたキャラだけ用意・任意）：`flustered`（焦り）／`smug`（得意げ）／`mischievous`（いたずら）／`grateful`（謝意）／`crying`（泣き顔）。

未配置の表情は ui がフォールバックする（その表情が無ければ あいさつの表情 → neutral の順。`ui/character/avatarAssets.ts`）ので、表情差分は揃っていなくても動く。

ストーリーモードの表情（リアクションとは別系統）：上の `Expression` パレットは練習ループのリアクション（`ReactionTrigger`→表情）で使う。一方ストーリーモード（backlog parking lot・世界観は world.md）は、場面ごとにオーサリングした台本で表情を当てるため、パレット外の表情トークンを使う（例 `confused`／`determined`／`surprised`／`relieved`／`bashful`／`pained`）。これらは `Expression` 型や各キャラ `expressions[]` には載せず、ストーリー機構がパス参照（`assetUrl('characters/<id>/<id>-portrait-<token>-a.webp')`＝avatar/full と同じ経路）で使う。アセット（画像）としての管理は共通＝同じ場所に同じ `<id>-portrait-<token>-a` 命名で置き、同じ加工（§4）を通して配布 WebP まで作る（まお／りんは第一話分を配布済み）。区別はソース上だけ（リアクション＝パレット駆動／ストーリー＝パス参照）。トークンは物語ごとに増える（具体の割当は各ストーリー doc、例 story/episode-01.md）。各キャラが実際に持つ表情の一覧は定義 doc §3「表情アセット」。

共通仕様（厳守）：

- 形式：WebP・背景透過（制作ソースは PNG）。
- 表情差分はフレーミングを固定（顔位置・スケール・ライティングを同一キャンバスで揃える）。差し替えてもズレないこと。
- 解像度は表示サイズの 2x 目安。AI 生成素材は長辺 1024px 前後が上限なので書き出しもそこを超えない（引き伸ばし＝画質劣化を避ける）。容量は最適化。
- 命名規則：id 接頭辞を全アセットに付け、区切りはすべてハイフン（kebab-case）。ポートレート＋表情 `<id>-portrait-<expr>-<variant>.webp`（variant は a,b,c…）／サムネ `<id>-avatar.webp`／立ち絵 `<id>-full-<kind>-<variant>.webp`（kind＝立ち絵の種類。既定立ち絵は `stand`＝`<id>-full-stand-a.webp`、将来ストーリーのスプラッシュは kind をシーン名に）／使い魔 `<id>-familiar.webp`。置き場は §5。

書き出しサイズ（WebP）：

| 用途 | ファイル | 比率 | 表示目安 | 書き出し（2x） |
|---|---|---|---|---|
| 立ち絵（全身） | `<id>-full-<kind>-<variant>.webp` | 3:4 縦 | 高さ〜512px | 768×1024 |
| バストアップ＋表情差分 | `<id>-portrait-<expr>-<variant>.webp` | 5:6 縦 | 幅〜256px | 640×768 |
| セレクト用サムネ | `<id>-avatar.webp` | 1:1 | 〜96px | 192×192 |
| 使い魔 | `<id>-familiar.webp` | 1:1 | 小（ヒントボタン） | 512×512 の生成を ui 表示寸でクロップ |
| 看板牌（1筒/1索） | `<id>-tile-pin1.webp` / `<id>-tile-sou1.webp` | 74:100 | 小 | 296×400 |

サムネはポートレートのトリミングで作れる（個別生成不要）。

最小構成：ベース顔（neutral）＋セレクト用サムネ＋必須場面のセリフで開始でき、表情差分・立ち絵・使い魔・BGM は順次足せる（ui は欠けた画像をフォールバックで埋める）。

### 等身（プロポーション）— レビュー観点

立ち絵（全身）の等身（頭身＝頭頂〜あご ÷ 全身高）はキャラごとに違ってよい（個性・世代を映す）。並んだときの一体感はバストアップの顔 scale で作る（§4 の制作フロー 3「クロップ」＝既存キャラ neutral と並べて合わせる）ので、全身の等身は無理に一致させない。ただし完全に自由ではなく世代で帯がある＝採用前に次をレビューする：

- 世代で段が付くのが正：弟子世代（10代）より師匠世代（大人）が高等身。格・年齢が等身で読めるのが望ましい（decisions.md の「格が上がるほど役も大きい」グラデーションの等身版）。目安帯（確定キャラ基準）：
  - 弟子世代（10代）＝約 6.5〜7.5頭身。同年齢帯でも絵の見せ方で幅を持たせてよい（例：まお＝低め＝3人で一番幼い演出／りん・しん＝高め＝スラッと。3人とも設定上は同年齢帯）。
  - 師匠世代（大人）＝約 7.5〜8頭身（例：ひすい）。弟子より一段高く、世代差が等身で読める。
- レビューで見る点：(1) 同世代の既存キャラと並べ、等身帯から外れていないか（弟子なのに大人8頭身／師匠なのに幼い等）。(2) 大人に倒れすぎ・幼くなりすぎていないか。(3) ポーズ（膝曲げ等）や床丈の衣装で見かけの高さが変わるので、身長でなく頭/身の比率で判定する。
- 顔サイズは別軸：全身の等身と顔 scale は別問題。顔の大きさは全身でなくバストアップのクロップ時に既存キャラ neutral と並べて合わせる。

### 看板牌（1筒/1索）のキャラ別絵（任意・未対応）

牌の中でいちばん絵画的な 1筒・1索 は、キャラごとに絵を差し替えられる「看板牌」にできる。差し替え機構・置き場所・命名の正は architecture §5（現状の resolver はキャラ非依存のデフォルト画像のみで、キャラ別の解決は未実装。未指定なら中立SVGにフォールバックするので用意しなくても動く）。本項はその画像の制作仕様：

- 形式：WebP（不透明・背景込み）。透過は不要（牌面は不透明な生成り）。
- 背景色：牌面と同じ生成り `#f7f4ea`（`--tile-face`）。縁・影・ハイライト発光は SVG 側が描くので、画像には絵柄だけを乗せ、縁や影は焼き込まない。
- 比率・解像度：牌の比率 74:100。表示は小さいが余裕をもって 3〜4x で書き出し（上の表の看板牌行＝296×400px）。容量は最適化。
- 嘘字対策：牌の絵柄を描くので判読不能な装飾文字はOK、漢字入り雀牌の焼き込みは不可（§4「制作フロー」1）。


## 4. 作り方

### 追加手順（作る順）

1. ペルソナを考える：性格・人称・口調・好きな役（→ 定義 doc §1・§2）。
2. ビジュアルの identity を決め、master を1枚作る（→ 定義 doc §3・画像プロンプト doc・下記「制作フロー」1）。
3. master を見てペルソナを調整する：絵から受ける印象に性格・口調を擦り合わせる。
4. セリフを作る：場面別＋ヒント＋解説＋誤答を全量（hint-base 網羅）（→ セリフ doc）。
5. 画像をフルセットで揃える：master から立ち絵・バストアップ・表情差分・サムネ・使い魔を派生（→ 下記「制作フロー」2〜6）。
6. データとして登録・配置する：`Character` 定義（ペルソナ・`reactions`〔既定と違う場面だけ〕・script・explain・mistakes・色・motif）をキャラデータに書き、レジストリに足す（→ §5）。テスト（`src/characters/characters.test.ts`）がセリフの網羅・本数・neutral の有無を検証する。
7. 任意：BGM を作って `Character.bgm` に配線する（→ §2「音楽」・sound.md）。

ロジック変更は不要、追加はデータ＋画像のみ。新キャラはまお一式（定義 doc＋セリフ doc＋サウンド doc＋画像プロンプト doc＋配布アセット＋キャラデータ）に倣う。

### 制作フロー（画像）

キャラの画像は AI 生成（Gemini 等の t2i）のラスター画像。正の手順は次の一本（1〜6）。各キャラ固有の生成プロンプトと確定値（クロップ枠）は画像プロンプト doc に、採用画像と経緯も同 doc に追記して再現可能にする。

1. master（素体）を t2i で作る。
   - 嘘字対策（厳守）：衣装に漢字入りの雀牌の絵柄を焼き込まない。AIは牌の正しい字を描けず、麻雀が分かる人ほど嘘字に見えて安っぽくなる。判読不能な装飾文字（呪符・紋様等）はOK。麻雀感を出したい場合は字のない絵柄（筒子の丸・索子の竹）に留めるか、正しい牌が要る箇所はアプリ側の SVG で重ねる。実在の版権キャラの直接模倣も避ける（特徴を記述して寄せる）。
   - 素体で作る（厳守）：腕を下ろし・法具（御札／鈴 等）を持たせず・衣装の全体が隠れず見える正面全身。前に組んだ腕や法具は衣装を隠し、派生の参照として使いづらい。プロンプトに「両腕を脇に下ろす（`arms relaxed and hanging down at her sides, hands lowered`）／法具は持たせず髪飾り等に留める／衣装の全体が見える」を明記する。
   - 1体だけ出す：横長キャンバスや `consistent character design`／`character sheet` 的な語は複数アングルの設定シートを呼ぶ。縦長（3:4）で出し、`single full-body illustration, one girl only, single front view` を positive に、`character sheet, model sheet, turnaround, multiple views, multiple poses, side view, back view, duplicate character` を negative に積む。
   - 縦長の白紙キャンバスを種にする：比率設定が無い／効かないツール（nanobanana 等）では、白紙 PNG（§5 の `character-white-space.png`＝768×1024、使い魔用 `familier-white-space.png`＝512×512）を参照に添付して t2i する。プロンプト冒頭に「この白紙はキャンバスと比率としてのみ使う＝白を背景に、1体を頭から足先まで枠いっぱいに描く」を1行入れる（例：`Use the attached blank vertical image only as the canvas and aspect ratio; treat the white as a plain white background and draw one single full-body character filling the frame head-to-toe.`）。白紙の上の新規生成なので i2i の劣化は起きない。白紙は初回 master 用で、派生（2）では添付しない。
   - 気に入った構図・顔が出るまで回し、1枚を master に選ぶ。等身は §3「等身」でレビューする。
2. 派生（立ち絵・バストアップ・表情差分・使い魔）を master と同一セッションの t2i で作る。
   - 作る順：(a) 道具付きの立ち絵＝法具を持たせ、動きのあるポーズ（体を斜め・脚を開く 等）。スタート画面・キャラクター画面の見せ場で、表情はベースと変えて個性を前に出してよい（例：しん＝鋭い不敵なクール）。手・道具が大きく出るので表情差分用ではなく単体イラスト扱い。(b) バストアップ＝道具なし・neutral・正面・手は枠外。portrait（表情差分）のベース顔（参考プロンプトは下記）。(c) 表情差分＝(b) を基準に「表情だけ変える」短い差分指示で1種ずつ。(d) 使い魔＝単独キャンバスで全身。
   - 同一セッション t2i が第一選択（下記「コツ」）。セッションが切れた／濁ったら「セッションを master から再構築する」のテンプレで新セッションを立て直す。i2i（画像を渡して編集）は「ごく小さな表情差分だけ」の補助手段（下記「補助：i2i」）。
   - 出番の多い表情だけ複数バリアント（`-b`,`-c`…）。
3. クロップする（白背景のまま・リサイズしない）。
   - portrait：生成したバストアップの中身をトリム測定（`magick in.png -fuzz 5% -format "%@" info:` → `WxH+X+Y`）し、頭頂から頭が約45%・頭〜胸まで入る 5:6 の枠を決める（`-crop WxH+X+Y +repage`）。枠は表情差分すべてで固定（差し替えてもズレない）。既存キャラの neutral（基準＝りん `rin-portrait-neutral-a`）と並べて顔・頭のサイズ感を合わせて採用判断する（頭身がキャラごとに違っても顔 scale を合わせれば並べたとき一体感が出る）。確定した枠は画像プロンプト doc「確定枠」に記録する（まお・りんは記録済み）。
   - avatar：portrait を 1:1 に。立ち絵：生成が 3:4 ならそのまま。
   - 出力は `docs/characters/<id>/<id>-portrait-<expr>-a-cropped.png`（中間物）。
4. 透過する（スキル anime-cutout-defringe）。白背景のクロップ PNG から、縁の帯の α を背景色から逆算して白フチを出さずに抜く（α を収縮しないので線の太さも保たれる）。リポジトリ直下で：

   ```
   uv run --no-project .claude/skills/anime-cutout-defringe/scripts/defringe.py docs/characters/<id>/<id>-portrait-<expr>-a-cropped.png <出力.png> --preview
   ```

   - 参照は自動検出（同フォルダの完成済み `<id>-portrait-neutral-a.png`・同フレーミング）。参照があると、囲まれた白（髪の隙間＝抜く／歯・白目・汗＝残す）と髪の房の根元の細い筋を自動判定する。標準出力に穴の一覧（番号付き・cut/keep）と「残った白の疑い」が出る。
   - 確認：`<出力>_preview.png`（黄＝抜いた穴、橙＝不確かで残した穴、水色＝筋として抜いた所、マゼンタ＝残った白の疑い、赤＝参照との差）と、結果を黒背景に重ねた拡大（白フチ・白い筋が一番目立つ）を見る。問題があれば `--cut N`／`--keep N`（穴の上書き）、`--seed x,y`（残った筋を指して抜く）、`--protect x,y,w,h`（抜かれて困る所）を付けて再実行。オプションの正はスキルの `SKILL.md`。
   - 参照が無い初回（新キャラの neutral）は、縁の白フチ除去は自動だが囲まれた白は一覧されるだけなので、プレビューを見て `--cut N` で指定する（細い筋は `--seed`）。立ち絵・サムネ・使い魔も同じスキルで抜ける（参照なし）。
   - 確定した出力を `docs/characters/<id>/<id>-portrait-<expr>-a.png`（透過済み・リサイズ前）に置き、`-cropped.png` は消す。
   - 代替：Photopea（ブラウザ内処理・サーバーに送らない）で手作業（外周抜き → Anti-alias 維持＋`Contract 1px`＋`Defringe`）。スキル導入前の手順で、いまは使わない。
5. リサイズ → WebP にする（透過してから。白地のままリサイズすると縁が白と混ざり、白フチが出て Defringe でも取れない）。

   ```
   magick <透過PNG> -resize 640x768 -background none -gravity center -extent 640x768 <id>-portrait-<expr>-a.png
   magick <id>-portrait-<expr>-a.png -strip -define webp:method=6 -quality 90 <id>-portrait-<expr>-a.webp
   ```

   - 寸法は §3 の表（portrait 640×768／avatar 192×192／立ち絵は 3:4 ならリサイズ不要でそのまま encode。まお 896×1200・61KB／りん 165KB が目安）。
   - 代替：Squoosh（ブラウザ内処理）でも同じことができる。
6. 配置する：WebP を `src/assets/characters/<id>/` へ、透過 PNG を `docs/characters/<id>/`、生 t2i と master を `original/` に（§5「制作→配布の流れ」）。同じファイル名で上書きすれば配線（キャラデータ）は変わらないので、仮素材で先に配線し、確定したらファイルだけ入れ替える運用が安全。

バストアップ（2-b）の参考プロンプト（顔・髪・衣装などキャラ固有の詳細は 定義 doc §3 から補う。キャンバス指定は不要＝後でクロップする）：

```
Same character as the master we just made — keep the SAME face, hairstyle, hair
ornaments, colors, outfit and art style. Now draw a WAIST-UP PORTRAIT.

NO held tool / items — she is NOT holding anything (any WORN charms stay). Hands
relaxed and lowered, out of frame.

waist-up portrait, framed from the top of the head down to about the waist, the
whole chest and upper torso visible (not cropped at the chest), front-facing,
centered, face clearly visible, calm neutral expression with a gentle closed-mouth
smile (greeting base face), plain solid white background, no watermark, no text.

<face / hair / design details from character-<id>.md §3>
```

### コツ（実制作で得た知見）

まお／りんの制作で確かめた、画質と一貫性・再現性の要点。手順（上）の「なぜ」にあたる：

- 同一セッション t2i が一貫性と鮮明さを両立する最善手。master を生成した会話を維持したまま「同じキャラを別ポーズで」と t2i で頼むと、セッション文脈で一貫性が保たれ、t2i なので線はくっきり出る（実例：まおの御札ポーズ立ち絵は別セッションからの i2i では輪郭が荒れ、同一セッションの t2i では一貫性を保ったまま鮮明になった）。master を作った生成セッションは捨てずに使い回す。
- セッションは master から再構築できる。切れても master さえ残っていれば、新セッション冒頭で master を添付し identity を箇条書きで固定して「新規 t2i で描け」と宣言すれば（下記テンプレ）、同じ一貫性＋鮮明さで描ける（実例：再構築セッションの困り顔が master と模様まで一致した）。
- 画質は t2i が上。i2i は1回ごとに画像全体を再生成するため、重ねるほど線が眠くなる（世代劣化）。i2i を使うなら master から1ホップだけ（崩れたら master を貼り直す）。「i2i でくっきりにして」は添付画像のソフトさに引っぱられて効きにくい。ツールでも差が出る：消費者向けアプリ（Gemini アプリ等）は後処理で線が甘くなることがあり、素の出力に近い経路（AI Studio の nanobanana 等）は線が立ちやすい。positive に `clean crisp anime lineart, sharp clean outlines`、negative に `blurry, soft focus, sketchy lineart` を積む。
- 抜き（透過）の綺麗さは元絵の品質が上限。手順が同じでも元がもやっとだと白フチ・ギザつきが残る。
- 柄は「形」と「位置」を具体指定する（ゾーン配置）。ランダムな全面散らしは生成ごとに配置が変わり再現性ゼロ。各モチーフを体のゾーン（肩・胸・腰・腿・裾 等）に固定し、実在の星座名など学習済みの形で指す。星は節点だけに絞り、ばら撒かない。
- 「指示外の柄は足すな」を明記する（閉じた集合）。`use ONLY the listed motifs — do NOT add any unspecified pattern`。放置するとモデルが余分な星座・月・雲を勝手に盛り、画像間で柄がズレる。再現性のいちばんの効き手。
- 塗りはセル影を必ず入れる。「フラット＝ベタ塗り」ではない。ハウススタイル＝くっきり線＋ハードエッジのセル影（しわ・体の陰）。`flat / matte / minimal gradient` を効かせすぎると陰影ごと消える。positive に `proper anime cel shading with fold shadows and body-contour shading`、negative に `flat shadeless single-color, sticker-like flat fill`。
- 重ね着（ケープ等）は別布と分かる手当てを。縁取り（金縁等）＋前開きで下の服が見える（`a SEPARATE cape … clear gold-trimmed edge … open at the front … NOT merged into the dress`）。
- 動きのある絵は、顔・上半身・下半身をひとつの斜めで揃える（positive `the ENTIRE figure on ONE three-quarter diagonal`／negative `front-facing face on a turned body`）。
- 色は medium-deep を芯に、`navy/blackish` と `too bright/pale` の両端を negative で挟むと安定する（柄が減ると同じ色相でも暗く見える。t2i はシェードが毎回揺れる）。
- 派生では白キャンバスを添付しない。添付すると画像条件つき生成（i2i 寄り）になり柄がドリフトする。添付しなければ純 t2i でセッションの視覚記憶に寄りかかり、衣装の柄が揃う。
- 等身の数値指定（`8 heads tall` 等）はほぼ無視される。効くのは全身ファッション図の語・年齢体型語・`cute/chibi` 系を減らすこと・狙った1枚を参照にすること（詳細はまおの画像プロンプト doc）。

### セッションを master から再構築する（宣言テンプレート）

セッションが切れた／濁ったとき、新セッションへ一貫性＋鮮明さを引き継ぐ初手。冒頭で master 画像を添付し、下記を貼る（identity の箇条書きは定義 doc §3 ビジュアルから埋める）。狙いは「i2i 塗り替えでなく、この画風で新規 t2i させる」こと。

```
This is my original character "<name>". The attached image is the CANONICAL REFERENCE
for her. Keep her design EXACTLY consistent with it for everything that follows.

Lock these traits (do not redesign):
- <key identity bullets: face shape & eyes, hair + ornaments, outfit, colors, motifs>
- art style: clean crisp anime lineart, sharp clean outlines, smooth cel shading,
  glossy lustrous rendering, warm healthy skin

How to draw from now on:
- Draw EACH request as a FRESH, CLEAN illustration in this exact style (high detail,
  crisp sharp lineart). Do NOT just repaint or blur the reference — redraw cleanly so
  the lines stay crisp.
- Always: single character, plain solid white background, no watermark, no logo, no text.

Confirm you've locked <name> as the reference, then wait for my next instruction.
```

成功の見極め：確定済みの表情/ポーズを1枚出し直し、手元の確定版と重ねて identity・模様・線の鮮明さが一致するか確認（一致すれば再構築OK）。以後は短い差分指示（pose / expression / framing）で回す。

### 補助：i2i で表情差分を作る

同一セッション t2i が使えない（セッションをまたぐ・小さな表情差分だけ変えたい）ときの手段。Gemini の i2i は数値（強度スライダー）を持たず、指示文で「何を保ち・何を変えるか」を言い分ける。master（バストアップ）を添付し、下の土台プロンプトで表情だけ変える。1度に1表情、「保つ」項目を毎回明記、同じスレッドで連続生成、ブレたら master を添付し直す。

```
Use the attached image as the exact character reference.
Keep the SAME face, hairstyle, hair ornaments, outfit, colors,
art style and framing — do not redesign the character.
Change ONLY the facial expression to: <表情>.
Keep the same pose and bust-up framing, front-facing,
plain solid white background.
```

`<表情>` に入れる語（`Expression` 型に対応）：

| Expression | `<表情>` 指定例 |
|---|---|
| neutral（待機/あいさつ） | `calm neutral expression, gentle closed-mouth smile` |
| thinking（考え中） | `thoughtful expression, looking slightly aside, finger near chin` |
| insight（ひらめき） | `bright surprised "aha!" expression, raised eyebrows, sparkling eyes` |
| smile（解説中の笑み） | `soft warm smile, calm and friendly` |
| happy（正解） | `big happy open-mouth smile, cheerful and lively` |
| troubled（ミス/困り） | `troubled worried expression, slightly furrowed brows, awkward smile` |

ポーズ／法具違いも同じ要領で「顔・髪・衣装・配色は master のまま、ポーズだけ変更」と言い分ける（例：`hold a cluster of silver bells in front of her with both hands`）。変えるのは1点ずつ（表情かポーズか）。

### バリエーションと飽き対策

- セリフの多様化（最優先・低コスト）：同じ表情でも声かけ文を複数用意しランダム表示（セリフプール）。
- 画像のバリエーション（頻出のみ）：出番の多い表情（正解・ミス・待機）だけ2〜3枚の差分プール（`srcs` のローテーションは配線済み。各キャラ `expressions[].srcs` に `-b` 等を足せば有効）。出番の少ない絵は1枚。差分は同一フレーミング・同一キャラ維持。
- アンロック（`unlock`・任意・未対応）：キャラ別の成績（`Progress`）が上がると好感度も上がり、その節目で新表情/衣装/ポーズ・特別セリフをプールに追加（や新キャラ）。リアクションを上書きせず選べる絵を増やす方向。お祝い止まり（プレッシャーをかけない）。

---

## 5. ファイル構成とデータ管理

キャラはデータ。レジストリにデータ＋画像を足すだけで追加でき、ロジックは変えない。型：`Character` / `Persona` / `Expression` / `ReactionTrigger` の定義は data-model §13。

### ファイル構成（キャラ1体分の全ファイル＝唯一の地図）

`<id>` はキャラの id（例 `mao`）。本表が全パスの正本で、他章はファイルを「定義 doc」「セリフ doc」「配布アバター」等の語で呼び、フルパスは引かない（パスはここに集約）。

| 区分 | パス | 命名 | 内容 | 詳細 |
|---|---|---|---|---|
| 定義 doc | `docs/characters/<id>/character-<id>.md` | — | 基本情報・ペルソナ・ビジュアル（identity・表情アセット一覧）・セリフ（セリフ doc へのポインタ＋個性フック）・音楽（サウンド doc へのポインタ） | §2 |
| セリフ doc | `docs/characters/<id>/character-<id>-script.md` | — | 場面別＋ヒント＋解説＋誤答の全セリフ（hint-base 全キー網羅） | §2「セリフ」 |
| サウンド doc | `docs/characters/<id>/character-<id>-sound.md` | — | キャラの BGM の制作ノート（曲の狙い・調・テンポ・小節数・ループ長・ラウドネス・たたき台の出所） | §2「音楽」・sound.md「BGM の制作」・[ADR-0004](../adr/ADR-0004-bgm-audio-files.md) |
| 画像プロンプト doc | `docs/characters/<id>/character-<id>-image-prompts.md` | — | master・派生・使い魔の生成プロンプト集＋クロップの確定枠 | §4 |
| 制作ソース | `docs/characters/<id>/`（加工後 PNG）／`original/`（生t2i＋master） | `<id>-portrait-<expr>-<variant>.png` 等。master は `<id>-master-bustup.png`・`<id>-master-full.png`（original 限定） | クロップ＋透過済み・リサイズ前の PNG（配布の元）。original は未加工の生成画像と master（再生成・i2i の種）。ビルド非搭載 | §3・§4 |
| 白紙キャンバス | `docs/characters/` | `character-white-space.png`（768×1024）・`familier-white-space.png`（512×512） | t2i の比率強制用の真っ白な種画像（キャラ共通） | §4 制作フロー 1 |
| BGM 原本 | `docs/characters/<id>/`（たたき台は `original/`） | `<id>-bgm.mscz`（たたき台 `<id>-bgm-draft.py`・`.mid` は original） | MuseScore の編曲原本（必ず残す）。WAV 中間物はコミットしない。ビルド非搭載 | sound.md「BGM の制作」 |
| 配布アバター | `src/assets/characters/<id>/` | `<id>-portrait-<expr>-<variant>.webp`・`<id>-avatar.webp`・`<id>-full-<kind>-<variant>.webp`・`<id>-familiar.webp` | アプリで使う表情差分・サムネ・立ち絵・使い魔 | §3 |
| 配布 看板牌 | `src/assets/characters/<id>/`（既定は `src/assets/tiles/`） | `<id>-tile-pin1.webp`・`<id>-tile-sou1.webp`（既定 `pin1.webp`・`sou1.webp`） | キャラ別/既定の看板牌（1筒/1索。キャラ別は未対応） | §3「看板牌」・architecture §5 |
| 配布 BGM | `src/assets/characters/<id>/` | `<id>-bgm.m4a` | キャラの BGM（AAC・ループ加工済み・-23 LUFS 目安）。precache 外＝ランタイムキャッシュ。`Character.bgm.src` がこのパスを指す | sound.md「BGM の実現方式」・[ADR-0004](../adr/ADR-0004-bgm-audio-files.md) |
| キャラデータ | `src/characters/<id>/index.ts` | — | `Character` 定義（ペルソナ・`reactions`・script・explain・mistakes・色・motif・bgm のデータ化） | data-model §13 |
| レジストリ・テスト | `src/characters/index.ts`・`src/characters/characters.test.ts` | — | 一覧・id 引き・既定キャラへのフォールバック／全キャラのセリフ網羅・本数・neutral の検証 | 下記「レジストリ」 |
| 中立ヒント | `src/hints/` | — | ヒント素（hint-base・HintProvider）＝キャラ非依存・全キャラ共有 | hint-base・hints |
| キャラ描画 | `src/ui/character/` | `selectionMark.tsx`・`RitualHoverMark.tsx`・`items/`（法具）／`decor/`（装飾）／`themeColor.ts`（テーマ色の既定）／`avatarAssets.ts`（抽象パス→URL・表情フォールバック）／`CharacterStage.tsx`・`CharacterScreenFrame.tsx`（立ち絵＋会話窓・画面枠） | モチーフの resolver・SVG（皮＝二層分離）と、キャラ画像・色の解決 | architecture §2・§5 |

制作→配布の流れ（3段）：① `docs/characters/<id>/original/`＝t2i の未加工（再生成・i2i の種）＋ master（`<id>-master-bustup.png`・`<id>-master-full.png`）。master はここにだけ置く（親や配布には置かない）→ ② `docs/characters/<id>/`＝クロップ＋背景透過まで済ませた PNG（リサイズはしない＝ネイティブのクロップ寸のまま。配布の元。クロップ途中の中間物は `...-cropped.png` で区別し、透過後に正式名へ）→ ③ `src/assets/characters/<id>/`＝②をリサイズ＋WebP 化して書き出した配布物。`docs/`（①②）はビルド非搭載＝配布物は太らない。加工手順は §4「制作フロー」3〜6（順序＝クロップ→透過→リサイズ→WebP）。

### レジストリ

```ts
// src/characters/index.ts
import { mao } from './mao/index.ts';
import { rin } from './rin/index.ts';
export const characters: Character[] = [mao, rin /*, …順次追加 */];
export const defaultCharacterId = 'mao';
/** id でキャラを引く。未知 id は既定キャラへフォールバック。 */
export function getCharacter(id: string): Character { /* … */ }
```

レジストリはデータ参照（一覧・id 引き・既定キャラへのフォールバック）だけを持ち、解決ロジック（場面→表情は session、テーマ色の既定は ui）は持たない（architecture §2）。新キャラはここに1行足す。テスト（`characters.test.ts`）はレジストリの全キャラを回すので、追加したキャラは自動で検証対象に入る。


## 6. 参考ドキュメント

本ガイドが参照する設計 doc と、それぞれが正本とする範囲。本文は名前＋節番号（例「data-model §13」）で呼び、パス（クリックして辿る）はここに集約する：

- [product-concept](../product-concept.md) … プロダクトの背骨（プレッシャーをかけない 等）
- [decisions](../decisions.md) … 一時置き場の決定（好きな役の予約表・使い魔のヒント方式 等）
- [world](./world.md) … 世界観・人物相関（キャラの位置づけ・系譜・呼称ルール）
- [data-model](../design/data-model.md) … 型定義（§13 Character・§10 HighlightTarget・§11 ヒント型 等）
- [architecture](../design/architecture.md) … レイヤ分離・描画機構（§2 依存方向・§5 牌SVG／看板牌／モチーフ resolver）
- [hints](../spec/hints.md) … ヒント設計（誰が・どう出すか）
- [hint-base](../spec/hint-base.md) … 中立ヒント素（全着目ポイント網羅・キャラ非依存の土台）
- [session](../spec/session.md) … セッション提示（§4 場面〔リアクション〕の正準・既定マップ）
- [screens](../design/screens.md) … 画面・解説の流れ（§3）
- [scoring-rules](../spec/scoring-rules.md) … 役テーブル（§1 読み 等）
- [uxui](../design/uxui.md) … 見た目の指針（トンマナ〜実装。キャラ色の受け方は §3.4）
- [sound](../design/sound.md) … BGM の方式・制作（「BGM の実現方式」「BGM の制作」）

雛形のまお（`docs/characters/mao/`）と各ファイルのパスは §5「ファイル構成」を参照。
