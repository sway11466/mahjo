# セッション

セッション＝学習の「ひとまとまり」を進め、1ターンに ui が描く view-state を組み立てる提示層（`session`）の仕様。挙動の正は本書。型は [data-model.md](../design/data-model.md) §12、画面・遷移は [screens.md](../design/screens.md) §3、出題生成は [generation.md](./generation.md)、採点は [scoring-rules.md](./scoring-rules.md)。

`session` は engine と同列の純TS層（React 非依存。[architecture.md](../design/architecture.md) §2）。engine（生成・採点・誤答）・hints・characters を束ね、セッションの進行・正誤判定・進捗更新に加えて、1ターンの view-state を組み立てる。ui はその view-state を描画し、操作を session に投げ返すだけ（「何を見せるか」は決めない）。状態の保持は ui、永続化（`Progress`・`AppSettings` の localStorage）の IO は storage 層、その配線は ui（[storage.md](../design/storage.md)）。session は永続データを引数で受け返り値で返すだけで storage を知らない。

当面は「クイズ」のセッションを持つ。解説（見て学ぶ）の単独モードは別途設計（単発・役指定の見込み。本書のスコープ外）。なお、クイズ内で回答後に役/採点を見せる「解説シーン」はクイズ session の一部であり、上記の解説モードとは別物。

## 1. 位置づけ

- ui を描画専任にするための提示層。リアクション選択・ヒント組み立て・進行判定といった「何を見せるか」のロジックを session（純TS）に集約し、ui は view-state を描く。
- 遊び方のモードはセッション単位（当面はクイズ）。学ぶ対象は StudyMode（役 or 点数）。回答値は 役モード＝翻、点数モード＝翻/符/点数（[screens.md](../design/screens.md) §3）。
- プレッシャーをかけない（[product-concept.md](../product-concept.md) §3）。やり直し強制・減点・競争要素を持たない。

## 2. 構成（クイズ session）

- 1セッション＝8問（東南戦：東1局〜南4局）。盤面に現在の局を表示し、進捗（n/8）を兼ねる。
- 局が場風を決める（東1〜4局＝東場／南1〜4局＝南場）。各問はその局の場風で生成する（generate に場風を渡す。[generation.md](./generation.md) §2）。
- 自風・親子は問題ごとにランダム（局による親のローテーションは持たない）。
- 出題は1問ずつ遅延生成（8問を先に全部作らない）。

## 3. ライフサイクル

開始（あいさつ）→ はじめる →〔出題 → 回答 → 解説シーン → 次〕×8 → 結果。

| 段階 | 内容 |
|---|---|
| 開始（あいさつ） | StudyMode・現在の `Progress`・`RuleSettings`・rng から最初の局の問題を用意しつつ、状態＝あいさつ（`status: 'greeting'`）で作る（局index=0、正解数0）。盤面は出さず、キャラがあいさつし「はじめる」を待つ（greeting 中に1問目を見せない）。 |
| はじめる | あいさつ → 出題へ（`status: 'greeting' → 'playing'`）。最初の問題は開始時に生成済みなので、ここで盤面を見せる。 |
| 出題 | その局の場風で1問生成（手・場・和了状況）＋ 4択（正解1＋誤答3。誤答は `mistakes`）。view-state に盤面・4択・キャラ（出題のセリフ）・ヒント余地を載せる。 |
| 回答 | 選んだ選択肢で正誤判定。回答は1回のみ（やり直しなし）。view-state に正誤・キャラのリアクションを反映。 |
| 解説シーン | キャラが成立役（→ドラ→〔点数モードは符〕）を1つずつ説明＋該当要素をハイライト（[screens.md](../design/screens.md) §3）。正誤を見せた段で「解説を見る／次の設問へ」を選べる（毎回提示するが強制しない＝プレッシャーをかけない）。誤答は取り違えの理由も。 |
| 次 | 局indexを1進める。8問終えたら結果へ。 |
| 結果 | 正解数 n/8。お祝い（節目）・アンロック通知（難易度帯が解放されたら）・「もう1セッション／ホームへ」。 |

状態は値（データ）として持ち、各遷移は純関数（state＋入力 → state）。rng 注入で決定的（[testing.md](../dev/testing.md) §7）。

## 4. view-state（ui が描く提示モデル）

session は1ターンごとに、ui が描くために必要な情報を抽象レベルで組み立てる。ui は「どう描くか」（牌SVG・画像・音・アニメ）だけを担当する。

| 要素 | 中身（抽象） | ui の描画（具体） |
|---|---|---|
| 盤面 | 手牌・上がり牌・場の情報（局/自風/ドラ/ツモ・ロン/リーチ）・ハイライト対象（`HighlightTarget`） | 牌SVG・配置・ハイライト演出 |
| 4択 | 選択肢の値（翻 等）・選択済み/正誤の開示状態 | ボタン描画・操作 |
| キャラ | 抽象キャラ（characterId＋expression＋line）。場面→表情は `Character.reactions`、セリフは persona プールから rng で選ぶ | 表情→アバター画像の解決・描画、立ち絵、効果音/BGM |
| ヒント | 段階ヒント（`HintProvider`＋`HintRenderer` で現在キャラの文言まで差し込んだ表示用の段。開いた段数も） | 文字描画・段送り |
| 解説 | 成立役／採点の項目を1つずつ案内するウォークスルー：現在ステップのキャラ説明文（`character-<id>-script.md` §3 解説 script・回答後なので役名OK）＋そのステップの `highlightTargets`。進行（何番目／全何ステップ）と「解説を見る／次の設問へ」の分岐も | キャラ説明の描画・該当要素のハイライト演出・段送り |
| 進捗 | 現在の局（n/8）・正解数・状態（あいさつ/出題中/終了） | 進捗表示・結果画面 |

キャラは抽象（characterId＋expression＋line）で持ち、表情→画像の解決は ui（characters のアセット参照）。これにより ui は「判断しない、描くだけ」を保つ。

### 場面（リアクション）の正準

session が view-state のキャラ（expression＋line）を組み立てるときの「場面」の正準一覧。場面の識別子は `ReactionTrigger`（型は [data-model.md](../design/data-model.md) §13）。発火タイミングはアプリ（session）の定義。各キャラはこの**必須**場面にセリフを用意する（中身＝アセット側。文言ルールは [character-guide.md](../characters/character-guide.md) §2「セリフ」）。場面→表情は `Character.reactions`＋既定マップ。

| 場面（`ReactionTrigger`） | 日本語名 | 発火タイミング | 既定表情 | セリフ要否 |
|---|---|---|---|---|
| `greeting` | あいさつ（開始） | セッション開始の1回 | neutral（汎用既定。キャラが上書き可） | 必須 |
| `dealing` | 出題（各問） | 各問の提示〜回答前（毎問・出題中） | thinking | 必須 |
| `correct` | 正解 | 回答が正解 | happy | 必須 |
| `wrong` | ミス | 回答が誤答 | troubled | 必須 |
| `finished` | 終了（結果） | 全8問を終えた結果画面（セッション終わりの1回） | happy | 必須 |
| `hinting` | ヒント表示中 | ヒントを開いている間（表情のみ＝insight＝ひらめきを促す。専用セリフは持たない・出すのは §2 ヒント文） | insight | 表情のみ |
| `explaining` | 解説 | 解説シーン（役表示・採点説明） | smile | 任意 |

`greeting`（開始の1回）と `dealing`（毎問の出題中）は発火タイミングが別なので場面を分ける（あいさつ文と出題文を別プールで書けるように）。表情は greeting＝迎える顔（汎用既定 neutral。`reactions` で上書き可）／dealing=thinking（出題を一緒に考える姿勢）で分け、セリフはそれぞれのプールが担う。

**セッション終了のお祝い**（§3 結果）は専用場面 `finished`（既定表情 happy）。`correct` 流用はやめ、結果用のセリフを別プールで持つ。

## 5. 正誤判定と進捗

- 判定：選んだ値＝正解値か（役モード＝翻、点数モード＝総合の点数）。正解値はエンジンの採点結果から取る（表示する採点はエンジンが実際に検出した内容が正。[generation.md](./generation.md) §1）。
- 進捗：正解1問ごとに `Progress.correctByMode[mode]` を +1（誤答は加算しない）。問単位なので、セッション途中で離脱してもその問までの正解は加算済み。`correctTotal` も併せて更新。
- 難易度：`correctByMode[mode]` が生成の難易度帯解放を駆動（[generation.md](./generation.md) §3。中=10・難=30）。セッション中に閾値を跨いだら、以降の問の生成プールに反映（増える方向のみ・逆戻りなし）。
- 苦手の把握：回答1問ごとに、その問の `QuizTarget` の `Progress.byTarget[target]` を更新する＝`seen` を +1、正解なら `correct` も +1（[data-model.md §16](../design/data-model.md)）。`correctByMode` が「正解だけ・モード別」なのに対し、`byTarget` は**挑戦と正解の両方・出題種類別**を持つ（率＝苦手を測れるように）。寄り添いアドバイスの素で、出口の活用は未対応（backlog feature-14）。誤り方は集計（`byMistake`）でなく**間違い履歴**＝失敗した出題の生データとして貯める方針（backlog feature-19。`MistakeKind` は永続化せず諭し表示専用）。
  - 思想：苦手データは**内部で失敗を数える**ことを含むが、`プレッシャーをかけない`（§6・[product-concept.md](../product-concept.md) §3）は**提示の原則**であって保存の制約ではない。集計は寄り添い（やわらかいアドバイス）の素にのみ使い、失敗の採点表として突きつけない。とくに誤り方は、間違い履歴（事実）から表示時に推測する＝真因の**診断でなくヒント**として扱う（backlog feature-19）。
- ヒント：使用してもペナルティ・記録上の不利益なし。使用有無を状態に持つかは任意（当面持たない）。

## 6. プレッシャーをかけない原則の適用

- 誤答でも解説を見て次へ進める。やり直しの強制・減点はしない。
- 連続正解・制限時間などの競争要素はセッションに持たない（parking lot で任意に検討）。
- 結果はお祝い止まり。アンロックは「増える方向のみ」で、キャラの表情/衣装アンロックと同じ思想（[character-guide.md](../characters/character-guide.md)）。

## 7. テスト（要点）

`session` は純TSなので Small テストで厚く守る（[testing.md](../dev/testing.md)）。内部は「セッション状態機械（characters 非依存・純）」と「view-state 組み立て（characters/hints/engine を使う）」に分けると、コアな進行ロジックを characters 抜きでテストできる。

- 状態機械：あいさつ（greeting）で開始し、はじめる（beginQuiz）で出題（playing）へ。正解／誤答の判定が値どおり。正解で `correctByMode` +1、誤答で不変。回答ごとに局が進み、8問目の後に状態＝終了。誤答でも次に進める。
- 生成：問は1問ずつ生成され、各問はその局の場風で生成される（場風を渡す。生成器の場風引数が入るまでは代替）。途中で閾値を跨ぐと以降の出題プールが広がる（決定的 rng で再現）。
- view-state 組み立て：場面に応じたキャラ表情の選択（`reactions` どおり）、ヒントが現在キャラ文言で差し込まれ答えを直接言わない、解説項目が `highlightTargets` を持つ。
