# キャラクターガイド

サポートキャラの「位置づけ・構成アセット・作り方・データ管理」をまとめる。各キャラ固有の中身は doc＋配布アセット（パス・命名は §5「ファイル構成」）に置き、本ガイドは汎用の作り方に徹する。


## 1. 位置づけと役割

サポートキャラは学びの中身そのものではなく、伝え方と継続を担う：

- ヒントをキャラの口調で伝える（中身は中立、声だけキャラ依存）。
- 回答の正誤にリアクションする（表情＋セリフ）。
- 学習継続を後押しする（お祝い・アンロック等）。プレッシャーはかけない（product-concept）。
- 教える内容（ヒント本文）は中立で hints 側が管理。キャラは声・表情・見た目を被せるだけなので、キャラを足しても教える内容は不変。


## 2. キャラクターアセット

キャラを構成する部品の定義。1キャラ＝3ファイル（定義 doc・セリフ doc・画像プロンプト doc）＋配布アセットで構成する（全ファイルのパス・命名は §5「ファイル構成」が正本）。定義 doc は 基本情報・ペルソナ・ビジュアル・セリフ の4章。型は data-model §13。本節は定義 doc の各章に「何を定義するか」を対応させる（雛形＝character-mao.md）。作る手順は §4。

### 基本情報

キャラの素性。定義 doc「基本情報」章で定義する。

- id（レジストリ登録名・アセットパス `characters/<id>/`）・表示名・位置づけ（何者か）。
- 好きな役：個性フックの素（手にあるとき正解／解説で専用セリフを優先＝下記「セリフ」）。
- `unlock`：アンロック条件（任意・未対応。型は data-model §13）。

### ペルソナ

キャラの声の素。性格・人称・口調を 定義 doc「ペルソナ」章で定義する（具体のセリフはセリフ doc）。

場面→表情は**キャラごとに上書きできる**（決定）。土台は session §4 の既定マップ（場面 `ReactionTrigger` → 表情）で、各キャラは `Character.reactions` で場面ごとに上書きする（例 小悪魔キャラ `{ correct: 'mischievous', greeting: 'smug' }`）。上書きしない場面は既定どおり。`script`（セリフ doc §1）に表情を併記するのは**上書きするキャラだけでよい**（まおは上書き無し＝`reactions: {}` なので表情は書かず既定に従う）。

### ビジュアル

キャラの見た目の identity。各キャラは 定義 doc の「ビジュアル」章で次を定義する（雛形＝character-mao.md §3）。中身（何を描くか）はキャラ依存で、本節は「どの要素を定義するか」を共通化する。

- 外見コンセプト：一言で誰だと分かる説明＋核（髪型・衣装・配色）。生成プロンプトの土台。
- モチーフ：キャラの世界観を形にする視覚語彙。詳細は下記「モチーフ」。
- テーマ色：identity の主色（`Character.themeColor`）。詳細は下記「テーマ色」。
- 差し色：identity の従色（`Character.accentColor`）。テーマ色と対で、装飾の星・タイトル等の識別色。詳細は下記「差し色」。
- 使い魔：この世界のキャラは必ず使い魔（familiar）を1体持つ（世界設定）。動物・名前・見た目・性格は各キャラが定義（モチーフではなく独立要素）。**役割＝ヒントの担い手**で、アプリ内では声を出さない（authoring を1人分に保つため。「使い魔の示唆 → キャラのひらめき」語り口の正は hints §1・各キャラ script §2）。画像は `<id>-familiar.webp`（→ §5）。表示位置・サイズは ui が決め、ヒントボタンはこの絵をクロップ（トップ／キャラ選択にも出してよい）。未配置の間はテキスト「ヒント」ボタンにフォールバック。

#### モチーフ

キャラの世界観を形にする視覚語彙。どちらも `Character.motif`（型は data-model §13）に文字列キーを持ち、ui の resolver が key→SVG を解決する（データ駆動・二層分離。architecture §5・data-model §10）。キーは各キャラ＋resolver が持ち、汎用型 `Character` には特定キャラのキーを焼き込まない（未登録キーは適用なし）。役割で2種に分ける：

- 法具モチーフ（皮）：キャラ固有の道具を、機能UI要素に被せる差し替え。データは `Character.motif.ritual`（文字列キー）。中立データ（選択 index・正誤・`HighlightTarget`）には触れず、ui の resolver（`ui/character/selectionMark.tsx`）が key から皮を解決して適用する。適用先＝回答（4択）のホバー＋選択（同位置で「乗る→固定」）・スタート画面メニューのホバー・ハイライト演出・看板牌（1筒/1索）。皮の SVG は `ui/character/items/`。例 まお＝御札（符）＝`ritual: 'ofuda'`。
- 装飾モチーフ：背景の雰囲気レイヤ（採点に無関係・identity 表現）。2層構成 ── ①**共通の星・きらめき**（`StarField`）を全キャラ既定で敷く（魔女世界の夜空）、②その上に**キャラ固有モチーフ**（`Character.motif.decor` の文字列キー → 形）を重ねる。データは `Character.motif.decor`＋差し色 `Character.accentColor`。ui の resolver（`ui/character/decor/`）が key から固有SVGを解決し、`themeColor`・`accentColor` を CSS 変数で流す（同じ SVG でも色は各キャラに追従。星も `accentColor` 追従＝まお金／りん銀）。例 まお＝三日月＝`decor: 'moon'`／りん＝蝶＝`decor: 'butterfly'`（星は共通）。
- 共通：固有モチーフのキーが未指定／未登録なら**星だけ**（固有の形は無し）。`decor: 'none'` で装飾を完全オフ（星も固有も出さない＝夜空が合わないキャラ向け）。新しい固有モチーフは SVG 1枚＋resolver に1行で足す（ロジック不変・星は共通なので描き直し不要）。装飾の適用範囲は当面スタート画面（screens §2）、将来メイン背景・サブ画面へ流用可。状況では変えない（テーマ色と同じ）。

#### テーマ色

キャラの identity を表す中立な1色（`Character.themeColor`。型は data-model §13）。各キャラの定義 doc に固有値を1つ持たせる（キャラのビジュアル配色から代表色を選ぶ）。

- 用途：ui の装飾。当面は背景ステージの淡いグロー（立ち絵の背後）に使い、「いま誰と学んでいるか」の空気を映す（背骨：キャラ駆動）。採点には無関係。見た目の指針は uxui §4。
- フォールバック：未指定キャラは既定色（`defaultThemeColor`）になる。MVP では必須ではない（無指定でも動く）。
- 状況では変えない：テーマ色は常に一定。正誤など状況で背景色を変える（誤答で赤くする等）はしない＝プレッシャーをかけない（product-concept §3）。

#### 差し色

キャラの identity の従色（`Character.accentColor`。型は data-model §13）。テーマ色（主色）と対で、装飾の星・きらめき・タイトル等の識別色に使う（採点外）。各キャラの定義 doc に1色持たせる（ビジュアル配色の差し色＝金・朱 等から選ぶ）。

- 用途：ui の装飾。装飾モチーフSVG（architecture §5）の色として ui が `--char-accent` で流す（同じ SVG でも色はキャラに追従）。
- フォールバック：未指定なら装飾はテーマ色側の発光だけで成立（必須ではない）。
- 状況では変えない：テーマ色と同じ。

### セリフ

セリフ本体はセリフ doc：場面別セリフ（§1）＋着目ポイント別ヒントセリフ（§2）＋成立役の解説セリフ（§3）＋誤答の諭しセリフ（§4）を全量。ヒント・解説は hint-base の役/ドラ キー、誤答は全 `MistakeKind` を網羅（突き合わせ＝バリデーション）。設計は hints、解説・誤答の流れは screens §3。解説・誤答は回答後なので役名を出してよい（ヒントは言わない）。誤答の基準は hint-base「誤答の諭し素」。

各キャラはアプリの場面（`ReactionTrigger`）にセリフを用意する。場面の正準一覧・発火タイミング・必須度は session §4 場面（リアクション）の正準（アプリの定義）。本節はそこを埋める**セリフ側**の共通規則（ヒントセリフの規則は hints）：

- 必須場面（`greeting`/`dealing`/`correct`/`wrong`/`finished`）は `Persona` のプールに**最低2本**（ランダム表示＝飽き対策）。
- 答え（役名・点数の確定値）はどの場面セリフにも**入れない**。確定値は4択・解説パネルが開示する（キャラは確定値を言わない）。
- `hinting`／`explaining` は場面セリフのプールを持たない（プールが無いので各キャラ script の §1 場面別セリフにも載せない）。`hinting` のセリフは §2 ヒント文を表示し、`explaining` の文言は §3 解説セリフ（`ExplainScript`＝`Character.explain`）が1役ずつ出す（セリフ doc §3）。表情は既定マップ（`hinting`=thinking／`explaining`=smile）に従い、`reactions` で上書き可。これらに別途「場面の一言」を足したいなら `Persona` 拡張が要る（別途・型変更。当面は不要）。
- 個性フック（好きな役の特別セリフ）：手に好きな役があるとき、`correct` は通常プールより優先して専用ひとことを出してよい。`explaining` は §3 解説文にその役の一言を織り込む（例 まお＝一気通貫の解説に「…わたしの好きな役なんです」）。ヒント中は役名を言わず嬉しさだけ滲ませる。一般機構（型・選択ルール）への格上げは別途。
- 難しい漢字語にはカナの読みを括弧で添える（初心者が読めるように）：プレイヤーに見える authored 文（解説 `explain`・誤答の諭し `mistakes`・`Persona` セリフ・ヒントセリフ `script`・クイズの設問文・**役一覧などの参照テキスト**）で、役名や難読の麻雀用語が出るとき、`七対子（チートイツ）` のように括弧カナを書く。付ける頻度は **ユーザーが認識する「ひとまとまり」（連続して読む単位）での初出に1回**（同じまとまりの2回目以降は任意）。まとまりは文脈で決まる：
  - **解説ウォークスルー**（回答後の連続した説明）＝ウォークスルー全体で初出1回（＝最初に出る行で付ければ以降は任意）。
  - **役一覧**＝各行が独立した参照単位（フィルタで出入りし、どの行にも飛べる）なので **行ごと初出**（＝実質どの行にも付く）。
  - **1画面の静的テキスト**＝その画面で初出1回。**1つのセリフ・設問文**＝その吹き出し内で初出1回。
  - 役名の読みは scoring-rules §1 役テーブルの「読み」列に合わせ、役名がすでにカナ（リーチ等）なら不要。用語の読みは下記「麻雀用語の読み」に統一する。ネスト括弧（`牌（…（カナ））`）になるときは言い回しを変えて避ける。ヒントセリフでも用語の読みは添えてよいが、答え（役名・確定値）は出さない原則は維持する。採点パネルの役名ラベル等の構造化表示は ui ヘルパが `Yaku.reading` から読みを付けるので、authored 文では二重に書かない。
- 麻雀用語の読み（authored 文で統一。新出はここに追記）：門前（メンゼン）・聴牌（テンパイ）・順子（ジュンツ）・刻子（コーツ）・槓子（カンツ）・槓（カン）・雀頭（ジャントウ）・面子（メンツ）・数牌（シューパイ）・字牌（ジハイ）・么九（ヤオチュー）・暗刻（アンコー）・暗槓（アンカン）・対子（トイツ）・副露（フーロ）・加槓（カカン）・単騎（タンキ）・両面（リャンメン）・双碰（シャンポン）・嵌張（カンチャン）・辺張（ペンチャン）・嶺上牌（リンシャンパイ）・九面（キューメン）・三元牌（サンゲンパイ）・風牌（フォンパイ）・場風（バカゼ）・自風（ジカゼ）・他家（ターチャ）・配牌（ハイパイ）・筒子（ピンズ）・索子（ソーズ）。


## 3. 画像アセット

§2 のキャラ（identity）を実体化する画像ファイルの仕様（成果物）。作り方の手順は §4。

アプリ内でキャラが出る場所（ヒント表示・キャラ切替・正誤リアクション）から逆算。

| 用途 | 画像 | 必須度 |
|---|---|---|
| ヒント表示・リアクションの基本 | ポートレート（バストアップ）＋表情差分 | MVP必須はベース顔1枚（あいさつ＝greeting の表情。既定は neutral、別表情で迎えるキャラはその表情） |
| キャラ切替UI | セレクト用サムネ（小・正方形。ポートレートのトリミング可） | MVP必須 |
| キャラ選択画面・初回紹介 | 全身 | 任意 |

表情差分（`Expression`）。既定マップに紐づく表情（場面 `ReactionTrigger` → 表情）：

- `neutral`（待機・あいさつ｜greeting の汎用既定。MVP必須／別表情で迎えるキャラは持たない＝表の必須度を参照）
- `thinking`（考え中・出題中｜dealing）
- `insight`（ひらめき・ヒント表示中｜hinting）
- `smile`（穏やかな笑み・説明/解説中｜explaining）
- `happy`（正解の喜び・終了のお祝い｜correct/finished）
- `troubled`（困り顔・ミス｜wrong）

飾り表情（既定トリガーなし。`reactions` で割り当てたキャラだけ用意・任意）：`flustered`（焦り）／`smug`（得意げ）／`mischievous`（いたずら）／`grateful`（謝意）／`crying`（泣き顔）。

ストーリーモードの表情（リアクションとは別系統）：上の `Expression` パレットは練習ループのリアクション（`ReactionTrigger`→表情）で使う。一方ストーリーモード（[backlog](../backlog.md) parking lot・世界観は [world.md](./world.md)）は、場面ごとにオーサリングした台本で表情を当てるため、パレット外の表情トークンを使う（例 `confused`／`determined`／`surprised`／`relieved`／`bashful`／`pained`）。これらは `Expression` 型や各キャラ `expressions[]` には載せず、ストーリー機構がパス参照（`assetUrl('characters/<id>/<id>-portrait-<token>-a.webp')`＝avatar/full と同じ経路）で使う。アセット（画像）としての管理は共通＝同じ `original/` に同じ `<id>-portrait-<token>-a` 命名で置き、同じ加工（WebP化→`src/assets`）に通す。区別はソース上だけ（リアクション＝パレット駆動／ストーリー＝パス参照）。トークンは物語ごとに増える（具体の割当は各ストーリー doc、例 [story/episode-01.md](../story/episode-01.md)）。各キャラが実際に持つ表情の一覧は character-`<id>`.md。

共通仕様（厳守）：

- 形式：PNG または WebP・背景透過。配布最適化のため WebP 推奨（PWAオフライン）。
- 表情差分はフレーミングを固定（顔位置・スケール・ライティングを同一キャンバスで揃える）。差し替えてもズレないこと。
- 解像度は表示サイズの 2x 目安（表示256pxなら512pxで書き出し）。容量は最適化。
- 命名規則：id 接頭辞を全アセットに付け、区切りはすべてハイフン（kebab-case）。ポートレート＋表情 `characters/<id>/<id>-portrait-<expr>-<variant>.webp`（variant は a,b,c…）／サムネ `characters/<id>/<id>-avatar.webp`／立ち絵 `characters/<id>/<id>-full-<kind>-<variant>.webp`（kind＝立ち絵の種類。既定立ち絵は `stand`＝`<id>-full-stand-a.webp`、将来ストーリーのスプラッシュは kind をシーン名に）。

推奨書き出しサイズ（WebP）。表示サイズの 2x を基本とし、AI 生成素材は長辺 1024px 前後が上限なので書き出しもそこを超えない（引き伸ばし＝画質劣化を避ける）。表示寸の最終確定は UI 実装時（uxui §4）だが、書き出しはこの目標で進めてよい。

| 用途 | ファイル | 比率 | 表示目安 | 書き出し（2x） |
|---|---|---|---|---|
| 立ち絵（全身） | `<id>-full-<kind>-<variant>.webp`（既定 `<id>-full-stand-a.webp`） | 3:4 縦 | 高さ〜512px | 768×1024 |
| バストアップ＋表情差分 | `<id>-portrait-<expr>-<variant>.webp` | 5:6 縦 | 幅〜256px | 640×768 |
| セレクト用サムネ | `<id>-avatar.webp` | 1:1 | 〜96px | 192×192 |
| 看板牌（1筒/1索） | `<id>-tile-pin1.webp` / `<id>-tile-sou1.webp` | 74:100 | 小 | 296×400 |

サムネはポートレートのトリミングで作れる（個別生成不要）。看板牌の値は下記「看板牌」項・architecture §5 と一致。

画像の置き場所（制作ソース→配布の3段）・命名は §5「ファイル構成」。加工（クロップ・WebP化）の手順は §4 ステップ2。

MVPの最小構成：ベース顔＋セレクト用サムネ＋セリフ数種で開始可。表情差分・全身・アンロックは順次追加。

### 看板牌（1筒/1索）のキャラ別絵（任意・未対応）

牌の中でいちばん絵画的な 1筒・1索 は、キャラごとに絵を差し替えられる「看板牌」にできる（ui の差し替え機構は architecture §5）。キャラの世界観を映す見せ場。アバターと同じ AI 生成フローで作れる（嘘字対策：牌の絵柄を描くので、判読不能な装飾文字はOK・漢字入り雀牌の焼き込みは不可）。

- 形式：WebP（不透明・背景込み）。透過は不要（牌面は不透明な生成り）。
- 背景色：牌面と同じ生成り `#f7f4ea`（`--tile-face`）。縁・影・ハイライト発光は SVG 側が描くので、画像には絵柄だけを乗せ、縁や影は焼き込まない。
- 比率・解像度：牌の比率 74:100。表示は小さいが余裕をもって 3〜4x で書き出し（上の書き出しサイズ表の看板牌行＝296×400px）。容量は最適化。
- 置き場所・命名：`src/assets/characters/<id>/<id>-tile-pin1.webp` / `<id>-tile-sou1.webp`。キャラ非依存のデフォルトは `src/assets/tiles/pin1.webp` / `sou1.webp`（id 主体が無いので接頭辞なし）。
- 未指定なら中立SVG（`PinOne`/`SouOne`）にフォールバックするので、用意しなくても動く。


## 4. 作り方

### 追加手順（作る順）

1. ペルソナを考える：性格・人称・口調・好きな役（→ 定義 doc）。
2. 基準となるアバター画像（master）を1枚作る（→「AI生成（共通）」）。
3. master を見てペルソナを調整する：絵から受ける印象に性格・口調を擦り合わせる。
4. セリフを作る：場面別＋着目ポイント別ヒントを全量（hint-base 網羅）（→ セリフ doc）。
5. 画像をフルセットで揃える：master から表情差分・サムネ等を派生（→ §3「画像アセット」）。

できたらデータとして登録・配置する（`Character` 定義・レジストリ・`reactions`〔既定と違う場面だけ〕。置き場所は §5「ファイル構成」。`unlock` は任意・未対応）。ロジック変更は不要、追加はデータ＋画像のみ。

### AI生成（共通）

キャラのアバターは AI 生成のラスター画像。手順と制約はキャラ非依存（各キャラ固有の生成プロンプトは画像プロンプト doc）。

嘘字対策（厳守）：

- 衣装に漢字入りの雀牌の絵柄を焼き込まない。AIは牌の正しい字を描けず、麻雀が分かる人ほど嘘字に見えて安っぽくなる。判読不能な装飾文字（呪符・紋様等）はOK。
- 麻雀感を出したい場合は、字のない絵柄＝筒子（丸）・索子（竹）の模様に留めるか、正しい牌が要る箇所はアプリ側の SVG で重ねる（牌は SVG 描画）。

制作フロー（Gemini 等。キャラ非依存の作業順）は下記 ステップ1（t2i で master 候補生成）→ ステップ2（切り抜き・透過で master 確定）→ ステップ3（i2i で表情差分）。採用画像と派生手順は各キャラ doc に追記して再現可能にする。

#### 画質と一貫性の知見（実制作メモ）

画質と一貫性はトレードオフ（t2i＝画質が高いが顔・模様がブレる／i2i＝保てるが重ねると劣化）。まおの制作で得た要点：

- **同一セッション t2i が、一貫性と鮮明さを両立する最善手（まおで確認）。** master を生成したのと**同じ生成セッション（同じ会話）を維持したまま**「同じキャラを別ポーズで」と t2i で頼むと、セッション文脈でキャラの一貫性が保たれつつ、t2i なので線はくっきり出る（i2i の世代劣化＝線が眠くなる、を回避できる）。実例：まおの御札ポーズ立ち絵を、別セッションで master から i2i すると輪郭が荒れたが、master を作ったセッション内で t2i し直すと一貫性を保ったまま鮮明になった。**ポーズ違い・立ち絵バリエーションは、可能なら master と同じセッションで t2i する**のが第一選択。＝**master を作った生成セッションは捨てずに大事に使い回す。**
- **セッションは master から「再構築」できる（まおで確認＝鍵）。** 生成セッションが切れた／長く回して品質が濁ったら、新セッション冒頭で **master 画像を添付し「これがキャラの正準リファレンス。以降この設計を厳密に維持」＋固定する identity を箇条書き（顔造形・髪・髪飾り・衣装・配色・画風＝crisp lineart）＋「塗り替え i2i ではなく毎回この画風で“新規に t2i”して（線をくっきり保つ）」** と宣言する（テンプレは下記「セッションを master から再構築する」）。これで新セッションが元と同じ一貫性＋鮮明さで描ける（実例：再構築セッションで出した困り顔が、master と**模様まで一致**した）。＝**master さえ残っていればセッションは作り直せる**ので、「master を作ったセッションを大事に」はベストだが切れても致命ではない。
- **画質は t2i が上。i2i を重ねると線が眠くなる。** i2i は1回ごとに画像全体を再生成するため、模様替え→ポーズ→鮮明化…と重ねるほど線が甘く（もやっと）なる＝世代劣化。**master は t2i で気合を入れて出す。** 表情差分・ポーズ違いも、上記のとおり**同一 or 再構築したセッションの t2i を優先**。i2i は「ごく小さな表情差分だけ」の局所手段に絞り、その場合も master から「1ホップだけ」（多ホップ厳禁。崩れたら master を貼り直して1ホップに戻す）。
- **くっきり線は新規生成（t2i）由来。ツールでも差が出る。** 消費者向けアプリ（例 Gemini アプリ）は後処理（アップスケール／スムージング／プロンプト自動増補）で線が甘くなることがあり、素の出力に近い経路（例 AI Studio の nanobanana）は線が立ちやすい。**「i2i で“くっきりにして”」は効きにくい**（添付画像のソフトさに引っぱられて相殺する）。positive に `clean crisp anime lineart, sharp clean outlines`、negative に `blurry, soft focus, sketchy lineart` を積む。
- **抜き（透過）の綺麗さは元絵の品質が上限。** Photopea の手順（Anti-alias 維持＋`Contract 1px`＋`Defringe`）が同じでも、元がもやっとだと白フチ・ギザつきが残る。きれいな抜けは「くっきりした元絵」からしか得られない。
- **同じファイル名で上書き → 配線変更不要。** 絵や画風を作り直しても、`<id>-portrait-<expr>-<variant>.webp` 等の命名・パスが同じなら、定義（`src/characters/<id>/index.ts`）は触らず差し替えできる。仮素材で先に配線し、確定したらファイルだけ入れ替える運用が安全。

#### 柄・塗り・ポーズの指定（再現性と見栄え）

まおの作り直しで、「衣装の柄が画像ごとにバラける／ベタ塗りでやぼったい／動きが不自然」を順に潰して得た指定のコツ。次キャラでも効く：

- **柄は「形」と「位置」を具体指定する（ゾーン配置）。** ランダムな全面散らしは生成ごとに配置が変わり**再現性ゼロ**（まおの旧・星撒きで露呈）。各モチーフを体のゾーン（肩・胸・腰・腿・裾 等）に**固定**する。**実在の星座名で指定**するとモデルが形を学習済みで安定し、向きも指せる（例：カシオペアを横向きの W）。星は**星座の節点だけ**に絞り、ばら撒かない（りんの柄が一致したのも「ゾーン配置の刺繍」だったから）。
- **「指示外の柄は足すな」を明記する（閉じた集合）。** 放置するとモデルが余分な星座・月・雲を勝手に盛り、画像間で柄がズレる。`use ONLY the listed motifs — do NOT add any unspecified pattern` を入れる。**再現性のいちばんの効き手**。
- **塗りは“セル影”を必ず入れる。「フラット＝ベタ塗り」ではない。** ハウススタイル＝くっきり線＋**ハードエッジのセル影（しわ・体の陰）**で立体感を出す（グロス／グラデは入れない）。`flat / matte / minimal gradient` を効かせすぎると陰影ごと消えてベタ塗り化＝やぼったくなる。positive に `proper anime cel shading with fold shadows and body-contour shading`、negative に `flat shadeless single-color, sticker-like flat fill`。
- **重ね着（ケープ等）は“別布”と分かる手当てを。** 同じ色・柄だと一枚布に見える。**縁取り（金縁等）＋前開きで下の服が見える**＝羽織りと読ませる（`a SEPARATE cape … clear gold-trimmed edge … open at the front … NOT merged into the dress`）。
- **動きのある絵は、顔・上半身・下半身を“ひとつの斜め”で揃える。** 脚だけ動かして顔と胴が正面だと捻れて不自然。顔・頭・肩・胴・腰・脚を**同じ 3/4 方向**にまとめる（positive `the ENTIRE figure on ONE three-quarter diagonal`／negative `front-facing face on a turned body`）。
- **色は「柄が減ると暗く見える」＋ t2i はシェードが毎回揺れる。** 金の柄が地を割らなくなると同じ色相でも暗く見える。色は **medium-deep を芯に、`navy/blackish` と `too bright/pale` の両端を negative で挟む**と安定する。
- **同一セッションの派生（ポーズ違い・バストアップ）では白キャンバスを添付しない方が柄が維持される（まおで確認）。** 白紙を添付すると画像条件つき生成（i2i 寄り）になり、白＝中身ゼロなので柄を自由に描き直してドリフトする。添付しなければ純 t2i で**セッションの視覚記憶（直前に描いた master/立ち絵）に寄りかかり、衣装の柄が揃う**。**白キャンバスは初回 master の比率強制用**で、派生では使わない（プロンプト本文に `Use the attached blank …` と書いてあっても、派生のときは添付しない）。

#### セッションを master から再構築する（宣言テンプレート）

セッションが切れた／濁ったとき、新セッションへ一貫性＋鮮明さを引き継ぐ初手。**冒頭で master 画像を添付**し、下記を貼る（identity の箇条書きは各キャラの定義 doc §3 ビジュアルから埋める）。狙いは「i2i 塗り替えでなく、この画風で**新規 t2i** させる」こと。

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

成功の見極め：確定済みの表情/ポーズを1枚出し直し、手元の確定版と重ねて identity・**模様**・線の鮮明さが一致するか確認（一致すれば再構築OK）。以後は短い差分指示（pose / expression / framing）で回す。

#### ステップ1：マスター候補を生成（t2i）

文字プロンプトだけで全身1枚を出す。キャラ固有の生成プロンプトは画像プロンプト doc（identity の正は 定義 doc §3 ビジュアル）。気に入った構図・顔が出るまで回し、1枚を master 候補に選ぶ。衣装に漢字入り雀牌を焼き込まないことを毎回確認（上記 嘘字対策）。

**master は「素体」で作る（厳守）：** 腕を下ろし・法具（御札／鈴 等）を持たせず、衣装の全体が隠れず見える正面全身を master にする。理由は (1) 前に組んだ腕や持った法具は衣装を隠し、表情差分・ポーズ違いの参照（素体）として使いづらい（まおで腕が服を隠して苦労した）、(2) 隠れない素体ほど i2i の派生が安定する。プロンプト側に「両腕を脇に下ろす（`arms relaxed and hanging down at her sides, hands lowered`）／法具は持たせず腰の房・髪飾りに留める／衣装の全体が見える」を明記する。**法具を持った姿・ポーズ違い・バストアップは master を確定してから派生**させる（作る順序と参考プロンプトは下記「作る画像セットと順序」。派生は**同一セッション t2i 優先**＝「画質と一貫性の知見」）。

**1体だけ出す（モデルシート化を防ぐ）：** 横長キャンバスや `consistent character design`／`character sheet` 的な語は複数アングルの設定シートを呼ぶ。1体に収めるには ①縦長（3:4 等。`<id>-full-stand-a.webp` の書き出し比率と同じ）で出す、②`single full-body illustration, one girl only, single front view` を positive に置く、③`character sheet, model sheet, turnaround, multiple views, multiple poses, side view, back view, duplicate character` を negative に積む。

**縦長の白紙キャンバスを種にする（推奨・安定）：** 比率設定が見つからない／効かないツール（nanobanana 等）では、**縦長（3:4 等）の真っ白な画像を1枚用意し、それを参照に添付して t2i する**のが安定して効く。プロンプト冒頭に「この白紙はキャンバスと比率としてのみ使う＝白を背景に、1体を頭から足先まで枠いっぱいに描く」を1行入れる（例：`Use the attached blank vertical image only as the canvas and aspect ratio; treat the white as a plain white background and draw one single full-body character filling the frame head-to-toe.`）。**これは既存画を塗り替える i2i（線が眠くなる＝上記「画質と一貫性の知見」）ではなく、白紙の上の新規生成**なので、線はくっきりのまま縦長・1体が安定する。比率設定がある経路ならそれで縦長にし白紙は不要。

#### 作る画像セットと順序（立ち絵 → 道具付き立ち絵 → バストアップ）

master を起点に下記3枚を順に作る。**2・3 は master と同一セッションの t2i** で出す（一貫性＋鮮明。崩れたら上記「セッションを master から再構築する」）。各画像はステップ2で透過・WebP 化する。

1. **素体の全身立ち絵（master）** … 腕を下ろし・**道具を持たず**・衣装全体が見える正面全身（上記ステップ1）。正準リファレンス。`<id>-full-stand-a.webp` の素体にもなる。
2. **道具付きの立ち絵** … 法具（御札・鈴 等）を持たせ、**動きのあるポーズ**（体を斜め・脚を開く 等）。スタート画面・キャラ選択の見せ場。手・道具が大きく出るので**表情差分用ではなく単体イラスト扱い**。見せ場なので、**表情はベース（neutral）と意図的に変えてキャラの個性を前に出してよい**（例：しん＝鋭い不敵なクール）。＝portrait（3）は穏やかな neutral 土台、立ち絵（2）は個性強調、と住み分ける。
3. **バストアップ（道具を抜く）** … **道具なし・neutral・正面・手は枠外**。これが portrait（表情差分）のベース顔。出力を **640×768（5:6）に機械クロップ**して整える（バストアップは後でクロップするので**キャンバス指定は不要**）。以降の表情差分はこのバストアップを基準に同一セッション t2i（ステップ3）。

3 の参考プロンプト（顔・髪・衣装などキャラ固有の詳細は 定義 doc §3 から補う）：

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

> **バストアップ → portrait（640×768）は「クロップ→リサイズ＋他キャラと並べて scale 合わせ」（まおで確立）。** 全身をただリサイズすると顔が小さく寄りが合わない。手順：
> 1. 生成したバストアップ（白背景）の**中身をトリム測定**：`magick in.png -fuzz 5% -format "%@" info:` → `WxH+X+Y`（頭頂 Y・中身の幅/中心）。
> 2. 頭頂から**頭が約45%・頭〜胸（バスト）まで**入る **5:6 の region をクロップ**（`-crop WxH+X+Y +repage`、W:H=5:6）。**ここではリサイズしない**。
> 3. **透過（切り抜き）→ そのあと 640×768 にリサイズ**（`-resize 640x768`）。⚠️ **順序が肝**：白地のままリサイズすると縁が白と混ざって**フリンジ（白フチ）が出て Defringe でも取れない**。必ず **透過してから**リサイズする（リサイズはアルファ上で＝白フチが出ない）。
> 4. **既存キャラの neutral（例 りん `rin-portrait-neutral-a`）と並べて顔・頭のサイズ感を合わせて採用判断**。キャラごとに頭身が違うので“全身”は揃わなくても、**バストアップの顔 scale を合わせれば並べたとき一体感が出る**（リアクション/ポートレートは bustup なのでここが効く）。
>
> 調整レバー：クロップ範囲（ズーム）・上下位置（頭上余白／胸の見せ量）。**表情差分も同じ枠でクロップして揃える**（差し替えてもズレない）。

#### ステップ2：加工してマスターを確定（切り抜き・透過・WebP）

ツールは画像をサーバーに送らないローカル処理のものを使う（プライバシー・著作物保護のため）。下記2サイトで完結する。

- Photopea（ブラウザ内処理）… 白背景を透過にする・モデルシートから部位を切り出す・PNG で書き出す。
- Squoosh（ブラウザ内処理）… 表示サイズの2x へリサイズし WebP に書き出す（透過維持）。

流れ：Photopea で透過＆切り出し → 可逆ソースを `docs/characters/<id>/` に保管（i2i の種。切り抜き前の生成画像は同フォルダの `original/`）→ Squoosh で 2x・WebP 化 → 配布用を `src/assets/characters/<id>/` へ（命名は共通仕様）。共通仕様（透過・同一フレーミング・2x・WebP）は §3「画像アセット」を正とする。これで「マスター画像」が確定する。

WebP 化は Squoosh の代わりに ImageMagick でもよい（透過を維持・コマンドで再現可能）。透過済み PNG から `magick in.png -strip -define webp:method=6 -quality 90 out.webp`。立ち絵 `<id>-full-stand-a.webp`（全身）は元の透過 PNG が既に 3:4 ならリサイズ不要でそのまま encode（まおの `mao-full-stand-a.webp` ＝ 896×1200・61KB／りん 165KB が目安）。`<id>-portrait-<expr>` はクロップ→透過→`-resize 640x768`（上の手順ノート）まで済ませてから encode。`<id>-avatar.webp` はポートレートを 1:1 にクロップ→透過→`-resize 192x192` で encode。リサイズは必ず透過後（白地でリサイズすると白フチが出る）。

#### ステップ3：マスターから表情差分を生成（i2i・Gemini）

> 前提：**master を作った生成セッションがまだ生きているなら、まず「同一セッション t2i」を試す**（上記「画質と一貫性の知見」）。線がくっきりのまま一貫性も保てる。下記 i2i は、セッションをまたいだとき／小さな表情差分だけ変えたいときの手段。

Gemini の画像生成は「画像を渡して会話で編集する」i2i。Stable Diffusion のような数値（強度スライダー）は無く、**指示文で「何を保ち・何を変えるか」を言い分ける**のがコツ。t2i のキャラ固有プロンプト（画像プロンプト doc）とは別物で、ここでは「変える指示」だけを最小限に書く。

手順：

1. master 画像を Gemini に添付する。
2. 下の土台プロンプトで「顔・髪・衣装・配色・画風・構図は固定、表情だけ変更」を指示する。
3. 出てきた絵が master と別人になっていないか確認（崩れたら同じスレッドで「顔はmaster のまま」と再指示。会話を続けると文脈が保たれやすい）。
4. OK が出たら、ステップ2と同じ加工（透過・2x・WebP）でアセット化する。
5. 表情1種ごとに 1〜4 を繰り返す。出番の多い表情だけ複数バリアント。

土台プロンプト（i2i 編集指示・キャラ非依存。`<表情>` だけ差し替える）：

```
Use the attached image as the exact character reference.
Keep the SAME face, hairstyle, hair ornaments, outfit, colors,
art style and framing — do not redesign the character.
Change ONLY the facial expression to: <表情>.
Keep the same pose and bust-up framing, front-facing,
plain solid white background.
```

`<表情>` に入れる語（`Expression` 型に対応。§3 画像アセットの表情差分）：

| Expression（表情） | `<表情>` 指定例 |
|---|---|
| neutral（待機/あいさつ） | `calm neutral expression, gentle closed-mouth smile` |
| thinking（考え中） | `thoughtful expression, looking slightly aside, finger near chin` |
| insight（ひらめき） | `bright surprised "aha!" expression, raised eyebrows, sparkling eyes` |
| smile（解説中の笑み） | `soft warm smile, calm and friendly` |
| happy（正解） | `big happy open-mouth smile, cheerful and lively` |
| troubled（ミス/困り） | `troubled worried expression, slightly furrowed brows, awkward smile` |

崩れにくくするコツ：①一度に1表情だけ変える（複数同時指定は混ざる）、②「保つ」項目を毎回明記、③同じ会話スレッドで連続生成、④それでもブレたら master をもう一度添付し直す。

ポーズ／法具違いも同じ i2i で master から派生する（ステップ1「素体で master を作る」）。表情差分は「構図・ポーズは固定」で出すが、法具を持つ姿は逆に「顔・髪・衣装・配色は master のまま、ポーズだけ変更（例：`hold a cluster of silver bells in front of her with both hands`）」と言い分ける。変えるのは1点ずつ（表情かポーズか）に絞る。

### バリエーションと飽き対策

- セリフの多様化（最優先・低コスト）：同じ表情でも声かけ文を複数用意しランダム表示（セリフプール）。
- 画像のバリエーション（頻出のみ）：出番の多い表情（正解・ミス・待機）だけ2〜3枚の差分プール。出番の少ない絵は1枚。差分は同一フレーミング・同一キャラ維持。
- アンロック（任意・未対応）：キャラ別の成績（`Progress`）が上がると好感度も上がり、その節目で新表情/衣装/ポーズ・特別セリフをプールに追加（や新キャラ）。リアクションを上書きせず選べる絵を増やす方向。お祝い止まり（プレッシャーをかけない）。

---

## 5. ファイル構成とデータ管理

キャラはデータ。レジストリにデータ＋画像を足すだけで追加でき、ロジックは変えない。型：`Character` / `Persona` / `Expression` / `ReactionTrigger` の定義は data-model §13。

### ファイル構成（キャラ1体分の全ファイル＝唯一の地図）

`<id>` はキャラの id（例 `mao`）。本表が**全パスの正本**で、他章はファイルを「定義 doc」「セリフ doc」「配布アバター」等の語で呼び、フルパスは引かない（パスはここに集約）。

| 区分 | パス | 命名 | 内容 | 詳細 |
|---|---|---|---|---|
| 定義 doc | `docs/characters/<id>/character-<id>.md` | — | 基本情報・ペルソナ・ビジュアル（identity）・好きな役 | §2 |
| セリフ doc | `docs/characters/<id>/character-<id>-script.md` | — | 場面別＋ヒント＋解説＋誤答の全セリフ（hint-base 全キー網羅） | §2「セリフ」 |
| 画像プロンプト doc | `docs/characters/<id>/character-<id>-image-prompts.md` | — | master・派生・使い魔の生成プロンプト集 | §4 |
| 制作ソース | `docs/characters/<id>/`（加工後 PNG）／`original/`（生t2i＋master のみ） | `<id>-portrait-<expr>-<variant>.png` 等。master は `<id>-master-bustup.png`・`<id>-master-full.png`（original 限定） | master・加工後 PNG（i2i の種。ビルド非搭載） | §3・§4 |
| 配布アバター | `src/assets/characters/<id>/` | `<id>-portrait-<expr>-<variant>.webp`・`<id>-avatar.webp`・`<id>-full-<kind>-<variant>.webp`・`<id>-familiar.webp` | アプリで使う表情差分・サムネ・立ち絵・使い魔 | §3 |
| 配布 看板牌 | `src/assets/characters/<id>/`（既定は `src/assets/tiles/`） | `<id>-tile-pin1.webp`・`<id>-tile-sou1.webp`（既定 `pin1.webp`・`sou1.webp`） | キャラ別/既定の看板牌（1筒/1索） | §3「看板牌」・architecture §5 |
| キャラデータ | `src/characters/<id>/index.ts` | — | `Character` 定義（ペルソナ・`reactions`・script 等のデータ化） | data-model §13 |
| 中立ヒント | `src/hints/` | — | ヒント素（hint-base・HintProvider）＝キャラ非依存・全キャラ共有 | hint-base・hints |
| キャラ描画 | `src/ui/character/`（`selectionMark.tsx`・`items/`・`decor/`） | — | 法具/装飾モチーフの resolver・SVG（皮＝二層分離） | architecture §5 |

**制作→配布の流れ（3段）**：① `docs/characters/<id>/original/`＝t2i の未加工（i2i・再生成の種）＋ master（`<id>-master-bustup.png`・`<id>-master-full.png`）。**master はここにだけ置く**（親や配布には置かない）→ ② `docs/characters/<id>/`＝加工後の最終 PNG（透過・クロップ・正規化済み＝配布の元。クロップ中間物は `...-cropped.png` で区別し、整理後に正式名へ）→ ③ `src/assets/characters/<id>/`＝配布 WebP（②から書き出し）。`docs/`（①②）はビルド非搭載＝配布物は太らない。加工手順は §4 ステップ2。

中立の土台 hint-base（ヒント素・全着目ポイント網羅）はキャラ非共有で、上表の `src/hints/` に対応する仕様 doc。

### レジストリ

```ts
// src/characters/index.ts
import { mao } from './mao';
export const characters: Character[] = [mao /*, …順次追加 */];
export const defaultCharacterId = 'mao';
```

新キャラは「まお」一式（定義 doc＋セリフ doc＋画像プロンプト doc＋配布アバター＋キャラデータ）に倣って作り、レジストリに足す。


## 6. 参考ドキュメント

本ガイドが参照する設計 doc と、それぞれが正本とする範囲。本文は名前＋節番号（例「data-model §13」）で呼び、パス（クリックして辿る）はここに集約する：

- [product-concept](../product-concept.md) … プロダクトの背骨（プレッシャーをかけない 等）
- [data-model](../design/data-model.md) … 型定義（§13 Character・§10 HighlightTarget・§11 ヒント型 等）
- [architecture](../design/architecture.md) … レイヤ分離・描画機構（§2 依存方向・§5 牌SVG／看板牌／モチーフ resolver）
- [hints](../spec/hints.md) … ヒント設計（誰が・どう出すか）
- [hint-base](../spec/hint-base.md) … 中立ヒント素（全着目ポイント網羅・キャラ非共有の土台）
- [session](../spec/session.md) … セッション提示（§4 場面〔リアクション〕の正準）
- [screens](../design/screens.md) … 画面・解説の流れ（§3）
- [scoring-rules](../spec/scoring-rules.md) … 役テーブル（§1 読み 等）
- [uxui](../design/uxui.md) … 見た目の指針（§4）

雛形のまお（`docs/characters/mao/`）と各ファイルのパスは §5「ファイル構成」を参照。
