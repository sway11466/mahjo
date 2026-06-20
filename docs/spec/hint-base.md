# ヒント素（hint-base）

ヒント素を列挙する正本（中立・キャラ非依存）。設計・使い方・バリデーションは [hints.md](./hints.md)。各キャラの `character-<id>-script.md` はここのキーを全網羅する。末尾に**誤答の諭し素（MistakeKind）**も置く（同じく中立の基準＝キャラが声を当てる）。

キー：`yaku:<YakuId>`（[data-model.md](../design/data-model.md) §8）／`fu:<source>`（[scoring-rules.md](./scoring-rules.md) §2）／`dora`・`ura-dora`・`aka-dora`／`generic`。各素は `level 0`（ぼんやり）→`N`（具体）。答え（役名・確定値）は含めず、牌も指し示さない（ピンポイントのハイライトは回答後の解説側）。

> キーの正本（コード）は `src/hints/keys.ts`（`HINT_KEYS`）。語彙はコードと一致させる。現在は1着目ポイント＝1段（level 0）運用（[hints.md](./hints.md) §6）。段が自然に伸びるキーは L0→L2 まで記す。
>
> 現状の網羅範囲（41キー）：`generic` ×1 ／ 非役満の `yaku:*` ×30 ／ `fu:*` ×7（`menzen-ron` `tsumo` `wait` `pair` `meld` `kuipinfu` `chiitoi`）／ ドラ ×3。**役満15キーは parking lot で追加**（生成が parking lot）。**`fu:base`（副底20）・`fu:total`（合計）はヒント対象外**（前者は常に固定、後者は符の総和表示＝どちらも気づきの余地なし。採点 item には出るが provider が段にしない）。

---

## 汎用（`generic`）

特定の役・符によらず、あらゆる局面で使える緩い気づきの促し。盤面表示後しばらくで自動表示（idle／時間トリガー）、または段階ヒントの最初のぼんやり段に使う。プール（複数からランダム）。

- 手牌全体を、ゆっくり眺めてみよう
- 牌の色（種類）は揃ってる？
- 同じ牌が固まってない？
- あがり牌の周りを見てみよう
- 場の状況（場風・自風・ドラ）も確認

---

## 役モード（`yaku:*`）

### `yaku:riichi`（リーチ）
- L0 門前のまま聴牌した？ 宣言できる役があるかも

### `yaku:double-riichi`（ダブルリーチ）
- L0 宣言したのはいつ？ ごく早い巡目だと特別

### `yaku:ippatsu`（一発）
- L0 宣言したすぐあとに和了した？

### `yaku:menzen-tsumo`（門前清自摸和）
- L0 門前のままツモで和了した？

### `yaku:pinfu`（平和）
- L0 面子の形に注目（順子ばかり？）

### `yaku:tanyao`（断幺九）
- L0 端の牌（1・9）や字牌は入ってる？

### `yaku:iipeikou`（一盃口）
- L0 同じ並びの順子、重なってない？

### `yaku:yakuhai-haku`（役牌 白）
- L0 白の組はそろってる？

### `yaku:yakuhai-hatsu`（役牌 發）
- L0 發の組はそろってる？

### `yaku:yakuhai-chun`（役牌 中）
- L0 中の組はそろってる？

### `yaku:yakuhai-round`（場風）
- L0 場風の牌、組になってる？

### `yaku:yakuhai-seat`（自風）
- L0 自風の牌、組になってる？

### `yaku:sanshoku-doujun`（三色同順）
- L0 同じ並びを、別の色でも作ってない？

### `yaku:sanshoku-doukou`（三色同刻）
- L0 同じ数の組を、色違いで揃えてない？

### `yaku:ittsuu`（一気通貫）
- L0 ひとつの色で、数の並びが長く続いてない？

### `yaku:chanta`（混全帯幺九）
- L0 どの組にも端か字牌が入ってる？

### `yaku:junchan`（純全帯幺九）
- L0 どの組にも1か9が入ってる？ 字牌は無し？

### `yaku:chiitoitsu`（七対子）
- L0 同じ牌の組に注目
- L1 対子はいくつある？
- L2 すべて対子なら、面子は作らない形

### `yaku:toitoi`（対々和）
- L0 順子はある？ それとも組ばかり？

### `yaku:sanankou`（三暗刻）
- L0 自分でそろえた組、いくつある？

### `yaku:sankantsu`（三槓子）
- L0 槓は、いくつ作った？

### `yaku:honroutou`（混老頭）
- L0 2〜8の牌は無い？ 端と字牌だけ？

### `yaku:shousangen`（小三元）
- L0 三元牌（白發中）の集まり具合は？

### `yaku:honitsu`（混一色）
- L0 牌の種類に注目
- L1 数牌は何色まで使ってる？
- L2 字牌は混ざってOK

### `yaku:ryanpeikou`（二盃口）
- L0 同じ並びの順子、2組ぶん見える？

### `yaku:chinitsu`（清一色）
- L0 牌の色は1色だけ？ 字牌も無い？

### `yaku:haitei`（海底摸月）
- L0 その牌、最後のツモ？

### `yaku:houtei`（河底撈魚）
- L0 その牌、場の最後の1枚？

### `yaku:rinshan`（嶺上開花）
- L0 槓の直後にツモった牌？

### `yaku:chankan`（槍槓）
- L0 相手の槓に重ねてロンした？

---

## 点数モード（`fu:*` ／ ドラ）

### `fu:menzen-ron`（門前ロン）
- L0 門前のままロンで和了した？ 符が少し変わるよ

### `fu:tsumo`（ツモ）
- L0 ツモで和了した？ 符が少し付くよ

### `fu:wait`（待ち符）
- L0 待ちの形を思い出して
- L1 両面・双碰は符が付かない
- L2 単騎・嵌張・辺張は？

### `fu:pair`（雀頭）
- L0 雀頭は何の牌？

### `fu:meld`（刻子・槓子）
- L0 刻子や槓子に注目

### `fu:kuipinfu`（喰いピンフ形）
- L0 鳴いていて、符の付かない形になってない？

### `fu:chiitoi`（七対子の符）
- L0 七対子は符を数えない、決まった符

### `dora`（ドラ）
- L0 ドラ表示牌の次の牌、持ってる？

### `aka-dora`（赤ドラ）
- L0 赤い5は混じってない？

### `ura-dora`（裏ドラ）
- L0 リーチで和了したら、裏も見てみよう

---

## 誤答の諭し素（MistakeKind）

クイズで誤答したとき、選んだ誤答の `MistakeKind`（[data-model.md](../design/data-model.md) §12）に応じてキャラがそっと諭すための中立の基準（何を取り違えやすいか）。ヒント素と同じく、各キャラの `character-<id>-script.md` §4 がこの全 `MistakeKind` を自分の言葉で網羅する（突き合わせ＝型 `Record<MistakeKind, string>` で強制）。**答え（正解値）は含めない**。表示の流れは [screens.md](../design/screens.md) §3 解説シーン。

| `MistakeKind` | 取り違えやすい所（中立の趣旨） |
|---|---|
| `dealer-swap` | 親と子で点数が変わる（自風＝東か）。 |
| `dora-miss` | ドラ・赤ドラ・裏ドラの数え落とし。 |
| `tsumo-ron-swap` | ツモ/ロンで符・支払い配分が変わる。 |
| `fu-miscount` | 符の数え違い（待ち・明暗刻・雀頭・么九/中張・切り上げ）。 |
| `han-miscount` | 翻の数え違い（役見落とし・喰い下がり・満貫境界）。 |
