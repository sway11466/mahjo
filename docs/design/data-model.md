# データモデル

> 型は現実の麻雀ドメインを忠実に写す（採点スコープ内）。方針は [adr/ADR-0002](../adr/ADR-0002-domain-faithful-types.md)。
> 並びは 基本要素 → 場（観測できる盤面）→ 点数計算 → 表示 → キャラ → 設定 の流れ。

## 型一覧

| § | 分類 | 主な型 | 役割 |
|---|---|---|---|
| 1 | 基本要素 | `Tile`（`Suit` / `Honor`） | 牌（物理1枚） |
| 2 | 基本要素 | `Meld`（`MeldType`） | 面子（順子/刻子/槓子/雀頭） |
| 3 | 基本要素 | `Wind` | 風（場風・自風で共用） |
| 4 | 場 | `Hand` | 手牌 |
| 5 | 場 | `Table` | 盤面（卓の状態：場風・ドラ表示） |
| 6 | 点数計算 | `WinContext` | 和了状況（手牌・場で不足する要素：ロン/ツモ・自風・リーチ等） |
| 7 | 点数計算 | `Decomposition`（`WaitType`） | 点数計算の解釈（面子分解＋待ち） |
| 8 | 点数計算 | `Yaku`（`YakuId`） | 役の定義レコード（＋識別子） |
| 9 | 点数計算 | `ScoreResult`（`ScoreItem` / `PaymentBreakdown` / `ScoreRank`） | 採点エンジンの出力 |
| 10 | 表示 | `HighlightTarget` | 光らせる対象（ハイライト連携） |
| 11 | 表示 | `HintStepPlan` / `HintStep` / `HintProvider` / `HintRenderer`（`StudyMode`） | 段階ヒント（骨組み→文言の二層） |
| 12 | 表示 | `QuizQuestion`（`QuizChoice` / `QuizTarget` / `MistakeKind`） | クイズの問題・誤答 |
| 13 | キャラ | `Character`（`Persona` / `Expression` / `ReactionTrigger`） | サポートキャラ |
| 14 | 設定 | `RuleSettings` | ルール設定（採点に影響） |
| 15 | 設定 | `AppSettings` | アプリ/UX 設定（音・呼び方・キャラ選択 等） |
| 16 | 設定 | `Progress`（`ProgressByCharacter`） | 進捗・成績（キャラ別。難易度の駆動要素） |
| 17 | セッション | `QuizSession`（`SessionAnswer` / `SessionStatus`）／`SessionViewState` | セッションの進行状態と、ui が描く提示モデル |

## 1. 牌 Tile

```ts
/** 数牌のスート */
export type Suit = 'man' | 'pin' | 'sou'; // 萬子 / 筒子 / 索子
/** 字牌 */
export type Honor = 'east' | 'south' | 'west' | 'north' | 'haku' | 'hatsu' | 'chun';
//                   東       南       西      北       白       發       中（三元牌）

// 牌＝kind による判別共用体。数牌は suit/rank、字牌は honor が必須（不正な状態を型で排除）。
// id ＝現実の雀牌セット（34種×4＝136枚）の正準順の通し番号。物理牌の識別・並び順・ハイライト参照を兼ねる。
// 模様(suit/rank/honor)は id から、赤ドラ(red)は設定から決まる。正準テーブル＋ファクトリ(tileFromId)を唯一の出所とし矛盾させない。
export type Tile = { id: number } & (
  | { kind: 'suited'; suit: Suit; rank: number; red: boolean } // 数牌 1–9。red=赤ドラか（true は赤5m/5p/5s）
  | { kind: 'honor'; honor: Honor }                            // 字牌
);
```

- 並び順（生成・表示）＝ id 昇順＝正準順（萬1–9 → 筒1–9 → 索1–9 → 東 南 西 北 白 發 中）。ランダム並びモードは表示側でシャッフル（データは不変）。

## 2. 面子 Meld

```ts
export type MeldType =
  | 'shuntsu'  // 順子（123 等）
  | 'kotsu'    // 刻子（111）
  | 'kantsu'   // 槓子（1111）
  | 'pair';    // 雀頭（対子）

export interface Meld {
  type: MeldType;
  tiles: Tile[];      // 構成牌（shuntsu/kotsu=3, kantsu=4, pair=2）
  open: boolean;      // 副露(明)=true / 門前(暗)=false（暗槓は open=false）
  /** 槓のとき：明槓 or 暗槓。刻子の暗/明は open で判別、ただしロン牌で完成した刻子は「明刻扱い」 */
  concealed?: boolean; // 符計算で暗刻/明刻・暗槓/明槓を厳密に区別するためのフラグ（fu.ts が決定）
}
```

- 符計算では「ロンで完成した刻子は明刻」「ツモ・元から手にあった刻子は暗刻」の区別が必要。これは和了牌（`Hand.winningTile`）とロン/ツモ（`WinContext.win`）から `fu.ts` が導出する（Meld 生成時に固定しない方が安全）。

## 3. 風 Wind

```ts
export type Wind = 'east' | 'south' | 'west' | 'north'; // 場風・自風で共通の概念
```

- 場風は `Table.roundWind`、自風は `WinContext.seatWind`。親/子は `seatWind==='east'` で導出する（`isDealer` は持たない）。

## 4. 手牌 Hand（場）

盤面に見える自分の手そのもの。観測できる事実だけを持つ（点数計算の解釈は §7 Decomposition）。

```ts
export interface Hand {
  concealed: Tile[];     // 門前の手持ち牌（あがり直前の素の牌。winningTile は含めない）
  calledMelds: Meld[];   // 副露（チー/ポン/明槓）＋暗槓。明/暗は Meld.open で区別
  winningTile: Tile;     // あがり牌（ツモ/ロンの別は WinContext.win）
}
```

- `winningTile` は `concealed` に**含めない**（別枠）。完全な手＝`concealed ++ [winningTile] ++ calledMelds`。`concealed` は「あがる直前の手」（門前のみなら13枚、副露1組ごとに −3）。
  - 理由：`winningTile` を唯一の出所にして二重表現を避ける（同じ物理牌が2箇所に出ると `winningTile.id ∈ concealed` の整合検証が常時必要になり、正確性最優先のエンジンに負担。`WinContext` を必須 boolean にしたのと同じ思想）。
  - 分解時は `parse/` が `concealed ++ [winningTile]` を結合してから面子に分解し、上がり牌が完成させた面子に `winningTile` の物理 id を置く（明刻/明槓を `fu/` が一意に判定できるように → §2 Meld）。

## 5. 盤面 Table（場）

卓の状態。全員で共有する観測要素だけを持つ。

```ts
export interface Table {
  roundWind: Wind;             // 場風（通常 east/south）
  doraIndicators: Tile[];      // ドラ表示牌（表向き。複数可）
  uraDoraIndicators?: Tile[];  // 裏ドラ表示牌（リーチ和了時のみ）
}
```

> ドラの枚数換算は点数計算側の仕事（Table は表示牌だけを持つ）。本場・供託は採点スコープ外のため持たない。

## 6. 和了状況 WinContext（点数計算）

手牌・場だけでは足りない、採点に要る要素（自分の席・この和了の事情）。観測できる盤面ではないので点数計算側に置く。

```ts
// フラグは必須 boolean（既定 false）。`?` で undefined を許すと false と二重表現になり、
// 正確性最優先のエンジンが毎回畳む必要が出るため。生成・テストの記述はデフォルト補完ファクトリで賄う。
export interface WinContext {
  seatWind: Wind;        // 自風（親/子は seatWind==='east' で導出）
  win: 'tsumo' | 'ron';  // ツモ / ロン
  riichi: boolean;
  doubleRiichi: boolean;
  ippatsu: boolean;
  haitei: boolean;       // 海底摸月
  houtei: boolean;       // 河底撈魚
  rinshan: boolean;      // 嶺上開花
  chankan: boolean;      // 槍槓
  tenho: boolean;        // 天和（親）
  chiho: boolean;        // 地和（子）
}
```

## 7. 点数計算の解釈 Decomposition

`Hand` を面子に分解した1つの形。1つの和了牌に対し複数の分解が成立しうる（高点法）ので、`parse/` が全分解を列挙し、`score()` が最高点になる解釈を採用する（→ [scoring-rules.md](../spec/scoring-rules.md)）。`Hand` から導出される。

```ts
export type WaitType =
  | 'tanki'    // 単騎（雀頭待ち）
  | 'kanchan'  // 嵌張（両端を持ち真ん中待ち 1_3）
  | 'penchan'  // 辺張（12 で3待ち / 89 で7待ち）
  | 'ryanmen'  // 両面
  | 'shanpon'; // 双碰（シャンポン）

export interface Decomposition {
  melds: Meld[];          // 4面子1雀頭（順子/刻子/槓子 ×4 ＋ pair）。副露分は Hand.calledMelds と一致
  wait: WaitType;         // 待ちの形（符・説明用）
  specialForm?: 'chiitoitsu' | 'kokushi'; // 七対子 / 国士無双（melds を使わない特殊形）
  specialTiles?: Tile[];  // 特殊形のときの牌一覧
}
```

## 8. 役 Yaku / YakuId

`YakuId` は役の安定した識別子。`enabledYaku`・役定義テーブル・ハイライト・ヒントテンプレートのキーに使う。詳細な翻・喰い下がりは [scoring-rules.md](../spec/scoring-rules.md) の役テーブルが正。

```ts
export type YakuId =
  // 通常役
  | 'riichi' | 'double-riichi' | 'ippatsu' | 'menzen-tsumo' | 'pinfu'
  | 'tanyao' | 'iipeikou'
  | 'yakuhai-haku' | 'yakuhai-hatsu' | 'yakuhai-chun'
  | 'yakuhai-round' | 'yakuhai-seat'   // 場風 / 自風（連風は両方成立で 2 翻）
  | 'sanshoku-doujun' | 'sanshoku-doukou' | 'ittsuu'
  | 'chanta' | 'junchan' | 'chiitoitsu' | 'toitoi' | 'sanankou'
  | 'honroutou' | 'shousangen' | 'honitsu' | 'ryanpeikou' | 'chinitsu'
  | 'haitei' | 'houtei' | 'rinshan' | 'chankan'
  // 役満
  | 'kokushi' | 'kokushi-13' | 'suuankou' | 'suuankou-tanki'
  | 'daisangen' | 'tsuuiisou' | 'ryuuiisou' | 'chinroutou'
  | 'chuuren' | 'chuuren-junsei' | 'suukantsu' | 'shousuushi' | 'daisuushi'
  | 'tenho' | 'chiho'
  // レア役（設定オン時のみ）
  | 'nagashi-mangan' | 'renho' | 'daisharin';

// 役定義レコード（役テーブルの1行）。翻・喰い下がり・成立条件の正は scoring-rules.md §1。
// 役満と翻フィールドを判別共用体で分け、不正状態（役満なのに翻を持つ等）を型で排除する（ADR-0002）。
// name=漢字表記（正式名）、reading=カナ読み（初心者向けふりがな）。両者は別の事実なので分けて持つ
//   （name に「七対子（チートイツ）」と焼き込まない）。表示文字列は純関数ヘルパが name と reading から
//    「七対子（チートイツ）」等を組み立てる（reading 省略 or name と同一なら括弧を付けない＝リーチ等）。
//    engine が ScoreItem.label / QuizChoice.value を作る際に使う。読みの値の正は scoring-rules.md §1 役テーブルの「読み」列。
export type Yaku =
  | { id: YakuId; name: string; reading?: string; yakuman: false;
      hanClosed: number; hanOpen: number | null } // 通常役。hanOpen=null は門前のみ（副露で不成立）
  | { id: YakuId; name: string; reading?: string; yakuman: true;
      double: boolean };                           // 役満（翻でなく固定点）。double=もとからダブル扱い（大四喜等。doubleYakuman 設定時に2倍）
```

## 9. 採点結果 ScoreResult（エンジン出力）

```ts
export type ScoreRank =
  | 'normal' | 'mangan' | 'haneman' | 'baiman' | 'sanbaiman'
  | 'kazoe-yakuman' | 'yakuman';

export interface PaymentBreakdown {
  // ロン: { ron: number }
  // 子ツモ: { fromDealer: number, fromNonDealer: number }
  // 親ツモ: { fromEach: number }  // 子全員から
  ron?: number;
  fromDealer?: number;
  fromNonDealer?: number;
  fromEach?: number;
  total: number;            // 合計移動点
}

export type ScoreItemCategory = 'yaku' | 'fu' | 'dora';

export interface ScoreItem {
  id: string;                  // 一意（クリック対象）
  category: ScoreItemCategory;
  // 解説・ヒント script を引くキー（hint-base 語彙＝§11）。役＝`yaku:<YakuId>`／符＝`fu:<source>`／
  // ドラ＝`dora`・`aka-dora`・`ura-dora`。生成側（engine）が確定し、消費側（session/hints）は
  // これを引くだけ＝id 文字列の逆解析をしない（暗黙の文字列契約を型で明示）。値の正は hints/keys.ts。
  explainKey: HintKey;
  label: string;               // 例 "三色同順", "暗刻(中張) 4符", "ドラ2"
  value: number;               // 翻数(yaku/dora) または 符数(fu)
  description: string;         // 学習用の説明文（キャラ非依存の中立テキスト）
  highlightTargets: HighlightTarget[]; // 光らせる対象（HighlightTarget。§10）
}

export interface ScoreResult {
  totalHan: number;
  totalFu: number;             // 符の合計（点数モードで使用。役モードでは表示しない）
  scoreText: string;           // 例 "子ロン 5200点" / "親ツモ 2000オール"
  payments: PaymentBreakdown;
  rank: ScoreRank;
  yakuman: boolean;            // 役満成立か（複合数は doubleYakuman 設定に従う）
  items: ScoreItem[];          // 加点要素（= 箇条書き1行ずつ）
  /** 役なし（ドラのみ等で和了不可）の場合の判定。生成は常に役ありを満たすが防御的に保持 */
  hasYaku: boolean;
}
```

役モードでは `items` の `category:'yaku'` と `totalHan` を主に使い、点数モードでは符・点数（fu/score）まで使う。型は最初から完全形で定義してあり、符・点数も実装済み。

## 10. ハイライト対象 HighlightTarget（§7.3）

```ts
export type HighlightTarget =
  | { kind: 'tile'; tileId: number }           // 特定の牌（Tile.id）
  | { kind: 'winningTile' }                    // 上がり牌マーカー
  | { kind: 'doraIndicator'; index: number }   // n 番目のドラ表示牌
  | { kind: 'uraDoraIndicator'; index: number }
  | { kind: 'roundWind' }                       // 場風表示
  | { kind: 'seatWind' }                        // 自風表示
  | { kind: 'menzenRon' }                       // 門前ロン表示
  | { kind: 'tsumo' }                           // ツモ表示
  | { kind: 'meld'; meldIndex: number };        // 副露面子

// UI 側は各描画要素に上記に対応する一意 ID を振り、ScoreItem.highlightTargets（解説のハイライト連携）から参照する。
```

データは中立（光らせる対象のみ）。魔女キャラの「符（お札）を貼る」演出はペルソナ側の描画表現で、この型は変えない（8.1 二層分離）。

## 11. ヒント HintStepPlan / HintStep / HintProvider（§8）

ヒントは二層で組み立てる（[hints.md](../spec/hints.md) §1,2,4）。第1層 `HintProvider` がキャラ非依存の骨組み（どの着目ポイントを・どの具体度で）を選び、第2層 `HintRenderer` が現在キャラの script から文言を差し込んで表示用の `HintStep` を作る。文言は生成せず authored セリフを引くだけ。キャラ依存は第2層に閉じる。ヒントは牌を指し示さない（答えを与えない）。ピンポイントのハイライトは回答後の解説側（§10・screens.md §3）。

```ts
// 着目ポイント識別子（hint-base / script 共通のキー）。エンジン語彙に対応：
//   役 = YakuId（'sanshoku-doujun' 等）、符 = 'fu:*'、ドラ = 'dora'、汎用 = 'generic'。
export type HintKey = string;

// 第1層の出力＝段の骨組み（キャラ非依存・テスト対象）。文言は持たず、
// 「どの着目ポイントを・どの具体度で」だけを表す（ヒントは牌を指し示さない＝答えを与えない）。
export interface HintStepPlan {
  key: HintKey;                        // script から文言を引くキー
  level: number;                       // 具体度（0=ぼんやり … 大きいほど具体）
}

// 表示用の完成した1段。文言は現在キャラの script 由来（キャラ依存）。
export interface HintStep {
  text: string;                        // キャラ script から引いた手書き文（答え＝役名・確定値は含めない）
  level: number;
}

export type StudyMode = 'yaku' | 'score';

// キャラ script：着目ポイントキー → 段ごとの文言（配列 index = level）。
// character-<id>-script.md §2 由来。hint-base の全キーを網羅（突き合わせ＝バリデーション）。
export type HintScript = Record<HintKey, string[]>;

// 解説 script：着目ポイントキー → 説明文（1キー＝1文。ヒントと違い段は持たない）。
// 回答後の解説シーン（screens.md §3）でキャラが1つずつ説明する文言。回答後なので役名を出してよい。
// キーは役＝`yaku:<YakuId>`／ドラ＝`dora`等（符は点数モード）。character-<id>-script.md §3 由来。
export type ExplainScript = Record<HintKey, string>;

/** 第1層：キャラ非依存・テスト対象。和了（hand＋table＋winContext）＋エンジン結果＋モード
 *  → 段の骨組み列（ぼんやり→具体）。文言は載せない（着目ポイントの選択・順序・level のみ）*/
export type HintProvider = (
  hand: Hand,
  table: Table,
  winContext: WinContext,
  result: ScoreResult,
  mode: StudyMode,
) => HintStepPlan[];

/** 第2層：骨組み＋現在キャラ script → 表示用の段列（文言を差し込む）。キャラ依存はこの層だけ */
export type HintRenderer = (plan: HintStepPlan[], script: HintScript) => HintStep[];
```

## 12. クイズ QuizQuestion（§3.7）

```ts
export type QuizTarget = 'yaku' | 'han' | 'fu' | 'score';

/** 誤答の由来（学習者がやりがちなミスの種類）*/
export type MistakeKind =
  | 'dealer-swap'      // 親子の取り違え
  | 'dora-miss'        // ドラ(赤・裏含む)見落とし
  | 'tsumo-ron-swap'   // ツモ/ロンの取り違え（符・支払い配分）
  | 'fu-miscount'      // 符の数え違い（待ち符・明暗刻・么九/中張・切り上げ忘れ）
  | 'han-miscount';    // 翻の数え違い（役見落とし・喰い下がり無視・満貫境界）

export interface QuizChoice {
  value: string;        // 表示値（"3翻", "40符", "5200点", "三色同順" 等）
  correct: boolean;
  mistakeKind?: MistakeKind; // 誤答のとき：どのミスか
  explanation: string;       // 「この値は◯◯と取り違えた場合」等の理由・解説
}

export interface QuizQuestion {
  target: QuizTarget;
  prompt: string;        // 例 "この手の役は？" "翻数は？"
  choices: QuizChoice[]; // 正解1＋誤答3（ミス変換で生成）
}

// 誤答の諭し script：MistakeKind → キャラの諭し文（1種＝1文）。誤答時に選んだ誤答の mistakeKind で
// キャラがそっと諭す（screens.md §3、中立の基準は hint-base.md「誤答の諭し素」）。答え（正解値）は言わない。
// 全 MistakeKind を網羅（Record で型が強制）。文言は character-<id>-script.md §4 由来。
export type MistakeScript = Record<MistakeKind, string>;
```

誤答生成（ミス変換）は engine 寄りの純ロジック（`src/engine/mistakes.ts`）に置きテスト対象（→ testing.md）。誤答の理由は中立テキストの併記でなく**キャラが諭す**（`MistakeScript`。一貫性＝文章は全てキャラの声／寄り添う）。

## 13. キャラクター Character（§8.3）

```ts
// 顔の全パレット（全キャラ合算。各キャラは持つ分だけ ExpressionAsset を用意する）。
// 場面→表情の対応はキャラ依存（Character.reactions）。表情そのものは中立な語彙。
export type Expression =
  | 'neutral'      // 待機・あいさつ（素の落ち着いた顔。あいさつの汎用既定。キャラは別表情で迎えてもよく、その場合 neutral を持たず reactions で greeting を上書きする）
  | 'thinking'     // 考え中・ヒントを出す前
  | 'insight'      // ひらめき（気づきを促す瞬間）
  | 'smile'        // 笑顔（説明・解説中の穏やかな笑み。正解の喜び happy とは別）
  | 'happy'        // 正解の喜び
  | 'troubled'     // 困り顔・ミス
  | 'flustered'    // 焦り（飾り。難問・心配 等に割当可）
  | 'smug'         // 得意げ（飾り）
  | 'mischievous'  // いたずら（飾り。小悪魔的キャラ向け）
  | 'grateful'     // 謝意（飾り。感謝・お礼。お祝い/アンロック 等に割当可）
  | 'crying';      // 泣き顔（飾り。感極まる・大げさな残念 等）

export interface ExpressionAsset {
  expression: Expression;
  /** 同一フレーミングの差分プール（出番の多い表情だけ複数枚）。先頭が既定 */
  srcs: string[]; // 例 ['characters/mao/mao-portrait-happy-a.webp', '...-b.webp']
}

// アプリが発火する中立な場面。キャラ非依存。どの表情を見せるかは Character.reactions が決める。
export type ReactionTrigger =
  | 'greeting'    // あいさつ（セッション開始の1回）
  | 'dealing'     // 出題中（各問・回答前）
  | 'hinting'     // ヒント表示中（表情 insight のみ＝ひらめきを促す。専用セリフは持たない）
  | 'explaining'  // 説明・解説中（役表示・採点説明）
  | 'correct'     // 正解
  | 'wrong'       // ミス
  | 'finished';   // 全クイズ終了（結果のお祝い・セッション終わりの1回）

export interface Persona {
  greeting: string[];          // あいさつ（開始）のセリフプール
  dealing: string[];           // 出題（各問）のセリフプール
  correct: string[];           // 正解時のセリフプール
  wrong: string[];             // ミス時のセリフプール
  finished: string[];          // 全クイズ終了（結果）のお祝いプール
}

export interface Character {
  id: string;                  // 例 'mao'
  displayName: string;         // 表示名
  avatar: string;              // セレクト用サムネ/アバター
  themeColor?: string;         // テーマ色（identity 主色）。ui 装飾に使う中立な1色。採点外。未指定は defaultThemeColor。用途・状況不変の正は character-guide §2「テーマ色」
  accentColor?: string;        // 差し色（identity 従色）。装飾の星・タイトル等の識別色。採点外。themeColor と対（正は character-guide §2「差し色」）
  /** モチーフのキー（identity 表現・採点外）。法具＝皮、装飾＝背景レイヤ。汎用型 Character に特定キャラの
   *  キーを焼き込まないため開いた string（未登録キーは適用なし）。ui の resolver が key→SVG を解決。
   *  設計・用途・適用先の正は character-guide §2「モチーフ」。例 まお `{ ritual: 'ofuda', decor: 'moon' }` */
  motif?: { ritual?: string; decor?: string };
  expressions: ExpressionAsset[]; // このキャラが持つ表情画像プール（パレットの部分集合）
  /** 場面→表情の割り当て（キャラ依存）。未指定の場面は既定マップへフォールバック：
   *  greeting:neutral, dealing:thinking, hinting:insight, explaining:smile, correct:happy, wrong:troubled, finished:happy。
   *  飾り表情（flustered/smug/mischievous/grateful/crying）を使うキャラはここで割り当てる（例 小悪魔キャラ {correct:'mischievous'}）。
   *  既定の neutral 等を持たないキャラは、その場面を持っている表情に上書きする（例 greeting を smile に）*/
  reactions: Partial<Record<ReactionTrigger, Expression>>;
  persona: Persona;
  /** 着目ポイント別ヒント文言（キャラの声）。HintScript＝キー(HintKey)→段ごとの文言（index=level）。
   *  hint-base の全キーを網羅（突き合わせはテストで担保＝§11・[hints.md](../spec/hints.md) §2）。character-<id>-script.md §2 が正。 */
  script: HintScript;
  /** 成立役の解説文言（キャラの声）。ExplainScript＝HintKey(役/ドラ)→1文。回答後なので役名OK（§11）。
   *  解説シーンで1役ずつ説明（screens.md §3）。通常役＋ドラ網羅（役満・レアは順次）。character-<id>-script.md §3 が正。 */
  explain: ExplainScript;
  /** 誤答の諭し文言（キャラの声）。MistakeScript＝MistakeKind→1文（§12）。誤答時にそっと諭す（screens.md §3）。
   *  答え（正解値）は言わない。全 MistakeKind を網羅（Record で強制）。中立基準は hint-base.md「誤答の諭し素」、文言は character-<id>-script.md §4 が正。 */
  mistakes: MistakeScript;
  unlock?: { kind: 'correctCount'; threshold: number }; // 任意・未対応
}
```

## 14. ルール設定 RuleSettings

採点・生成・出題に効くルール設定の型（構造）。**選択肢・既定値の正は [scoring-rules.md §5](../spec/scoring-rules.md)**。すべて即時反映・localStorage 保存（キー・version・防御的読込は [storage.md](./storage.md)）。

```ts
export interface RuleSettings {
  kuitan: boolean;                 // 喰いタン
  atozuke: boolean;                // 後付け（片和了）
  akaDoraCount: number;            // 赤ドラ枚数
  kiriageMangan: boolean;          // 切り上げ満貫
  kazoeYakuman: boolean;           // 数え役満（13翻以上）
  doubleYakuman: boolean;          // ダブル役満・役満複合
  rareYaku: boolean;               // レア役（流し満貫・人和 等）
  round: 'east-fixed' | 'random';  // 場（局）の固定/ランダム
  enabledYaku: Partial<Record<YakuId, boolean>>; // 出題する役の範囲（役ID→オン/オフ）。明示的に false の役だけ除外し、未指定・空 {} は全役オン（生成・判定とも）
}
```

## 15. アプリ設定 AppSettings

アプリ/UX の好み。`RuleSettings` と違い**採点に影響しない**（engine には渡さない）。即時反映・localStorage 保存（永続化の詳細は [storage.md](./storage.md)）。

```ts
export interface AppSettings {
  selectedCharacterId: string; // 選択中サポートキャラ（characters レジストリの id）。既定 'mao'
  playerName: string;          // プレイヤーの呼び方（Persona のセリフに差し込む）。既定 ''＝呼びかけなし
  se: boolean;                 // 効果音の有無。既定 true
  bgm: boolean;                // BGM（音楽）の有無。既定 false（学習中ずっと鳴るため）
  randomTileOrder: boolean;    // 牌のランダム並び表示（§1 の表示側シャッフル）。既定 false
}
```

## 16. 進捗・成績 Progress（飽き対策・難易度の駆動要素）

```ts
// 出題種類（QuizTarget）ごとの定着度。率＝correct/seen で苦手を測る（→ session.md §5）。
// seen（分母）を持つのが要点：正解数だけでは「苦手」と「未出題・露出不足」を区別できない。
export interface SkillStat {
  seen: number;     // 挑戦回数（分母）
  correct: number;  // 正解数（分子）。wrong は seen − correct で導出＝別フィールドで持たない
}

// 1キャラ分の成績。難易度アンロック（出題範囲：generation.md §3）・好感度（キャラとの関係）・
// 表情/衣装/特別セリフのアンロック・節目演出の駆動要素＋苦手の把握。お祝い止まり（プレッシャーをかけない）。
// 苦手データはキャラ別＝そのキャラとの接点が浅ければ得手不得手を「まだ知らない」のが妥当な状態。
export interface Progress {
  correctTotal: number;                       // 累計正答数
  correctByMode: Partial<Record<StudyMode, number>>; // モード別（難易度アンロックの駆動）
  // 苦手の把握（寄り添いアドバイスの素。出口の活用は未対応＝backlog feature-14）。
  // 任意フィールド＝既存データと共存し、欠落は防御的読込が補完する（storage.md §5・マイグレ不要）。
  byTarget?: Partial<Record<QuizTarget, SkillStat>>; // 何が弱いか（役/翻/符/点数の定着度＝率の真実）
  // byMistake（誤り方＝MistakeKind の積み上げ）は MistakeKind 精査（backlog refactoring-13）の後に追加する。
  // 精査前に貯めると古い分類のカウントが溜まり意味がズレるため（byTarget は分類が安定なので先行）。
}

// 成績はキャラごとに別管理（characterId → 成績）。キャラを切り替えると、そのキャラの
// 進捗・難易度帯で続く。localStorage 保存（永続化の詳細は design/storage.md）。
export type ProgressByCharacter = Record<string /* characterId */, Progress>;
```

苦手モデルの設計メモ（思想は [session.md](../spec/session.md) §5）：

- `seen/correct`（byTarget）＝**率（定着度）の真実**。分母 `seen` が必須（正解数だけでは露出不足と苦手が混同する）。
- 将来の `byMistake`（誤り方）＝不正解を `MistakeKind` で割った**カウントのみ**（分母なし）。`seen/correct` とは射影する軸が違う周辺集計で、二重計上にはならない（共有するのは「総 wrong」という整合点だけ）。`byMistake` は「どの罠に引っかかったか」＝真因の**診断ではなくヒント**として扱う（断定しない＝プレッシャーをかけない）。
- v1 は**通算**で集計（直近重視・ユーザー横断プロファイルは効果を見て格上げ）。「失敗を内部で数える」ことと「プレッシャーをかけない」は両立する（後者は**提示**の原則であって保存の制約ではない）。

## 17. セッション QuizSession / SessionViewState

セッション（提示層 `session`）の型。`QuizSession` は進行状態（ui が保持、session 層の純関数が遷移）、`SessionViewState` は ui が描く提示モデル（session が1ターンごとに組み立てる）。挙動の正は [session.md](../spec/session.md)。当面はクイズ session（解説の単独モードは別途）。

```ts
export type SessionStatus = 'greeting' | 'playing' | 'finished'; // 開始のあいさつ／出題中／終了

/** 1問の結果 */
export interface SessionAnswer {
  selectedIndex: number; // 選んだ選択肢（QuizQuestion.choices の index）
  correct: boolean;
}

// クイズ session の進行状態（8問＝東南戦：東1局〜南4局）。rng は状態に持たず遷移関数の引数で渡す
// （決定的・テスト可能）。局の場風は index から導出（東1〜4=東/南1〜4=南）。状態保持・永続化は ui。
export interface QuizSession {
  mode: StudyMode;          // 役 / 点数（StudyMode。§11）
  index: number;            // 現在の局 0–7
  hand: Hand;               // 現在の出題（手・場・和了状況）
  table: Table;
  winContext: WinContext;
  question: QuizQuestion;    // 現在の4択（§12）
  answers: SessionAnswer[];  // これまでの各問の結果（index と対応）
  correctCount: number;
  status: SessionStatus;
}

// ui が描く提示モデル（1ターン分）。session が engine/hints/characters を束ねて組み立て、ui は描画のみ。
// 「何を見せるか」は session、「どう見せるか（牌SVG・画像・音・アニメ）」は ui（session.md §4）。
export interface SessionViewState {
  // 盤面
  hand: Hand;
  table: Table;
  winContext: WinContext;
  highlights: HighlightTarget[];     // いま光らせる対象（解説のハイライト連携。§10）
  // 4択
  choices: QuizChoice[];
  selectedIndex: number | null;       // 未回答=null
  revealed: boolean;                  // 回答後（正誤・解説を開示）
  // キャラ（抽象。表情→画像の解決は ui）
  character: { id: string; expression: Expression; line: string; variantSeed: number }; // Expression は §13。variantSeed＝表情差分プール（ExpressionAsset.srcs）から1枚選ぶ種[0,1)。session が1ターンに1回引く（飽き対策・character-guide §4）、実 src 解決は ui
  // ヒント（現在キャラ文言で差し込み済みの、開いた段）
  hintSteps: HintStep[];              // §11
  // 解説（回答後のみ）
  result: ScoreResult | null;         // 役/採点（§9）
  // 進捗
  roundIndex: number;                 // 0–7
  correctCount: number;
  status: SessionStatus;
}
```

`SessionViewState` の各要素の対応（盤面/4択/キャラ/ヒント/解説/進捗）と、抽象（session）と描画（ui）の分担は [session.md](../spec/session.md) §4 の表が正。型は実装時に細部を詰める。
