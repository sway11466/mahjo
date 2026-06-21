# ひすい 画像生成プロンプト集

ひすい（＋使い魔 白蛇）の画像生成プロンプトを集約（[character-hisui.md](./character-hisui.md) §3 から分離して肥大化を回避）。

- **識別情報（外見コンセプト・衣装の模様・モチーフ・配色・使い魔設定）の正は [character-hisui.md](./character-hisui.md) §3**（世界・系譜の正は [world.md](../world.md) §5）。本ファイルは「実際に使う生成プロンプト」＋確定した見た目メモを持つ。
- 汎用の生成手順・嘘字対策・一貫性ワークフロー・**作る画像セットと順序**は [character-guide.md](../character-guide.md) §4。
- **画風はまお・りんと統一のハウススタイル＝くっきり線＋セル塗り・ツヤ控えめ**（`clean crisp anime lineart, sharp clean outlines, proper cel shading`）。
- 確定プロンプト（採用画像を出したもの）は構図・ポーズ・モチーフを保持する。

> **現状（2026-06-21・master＋派生 採用確定）：** 全身 master・勾玉を掲げた動きの立ち絵・neutral バストアップ master を採用済み。一発生成でほぼ狙い通り。残課題は 640×768 正規化＋WebP 化・表情差分の展開・使い魔（白蛇）の制作。

## 確定した見た目（一貫性の正・採用画像から固定）

採用 master／派生で固定した要素。表情差分・ポーズ違いでも維持する。

- 年齢感＝まお/りんより年上の落ち着いた若い女性（20代前半）。背は高め・所作は静かで品がある。色気でなく聡明さ・余裕で立つ（ゴージャス・動のさんごに対し、シック・静で踏み分ける）。
- 髪＝艶のある翠みの暗髪・ハーフアップ（上半分まとめ・残りは長く流す）、ぱっつん前髪、長いサイドの後れ毛。**簪は小さく繊細に**＝翡翠の小簪＋ごく小さな勾玉の下がり（大ぶりにしない）。
- 瞳＝翠（まお琥珀・りん紅と差別化）。穏やかで聡明な閉じ口の微笑（きつくない・色っぽくしない）。
- 衣装＝床丈の翡翠チャイナ（澄んだ翡翠グリーン。青緑・薄ミント・黒緑にしない）、襟詰め・胸元クローズ（控えめを死守）、サイドスリット、足首丈。
- **胸元＝勾玉形のチャイナボタン留め具（真珠白の盤扣＋翠の勾玉トグル）**＝法具モチーフ勾玉を胸元に乗せる identity 要素。
- 羽織り＝両腕に掛けて床まで流れる薄手・透ける真珠白の披帛（まお＝短ケープ／りん＝長ケープに対する差別化。ケープではない）。
- 模様＝**裾に真珠白の水紋（同心円アーチ＝青海波状）**をゾーン配置／勾玉の翠の差し色を胸元・腰・腿に小さく数点。無地を広く残す（盛りすぎない）。**披帛（薄布）には水紋を乗せない**（バストアップで両肩に出て煩くなるため＝この crop では留め具のみ）。
- 靴＝翡翠のフラット。

> モチーフ（法具＝勾玉／装飾＝水紋）・色（主色 翠・差し色 真珠白）の定義は [character-guide.md](../character-guide.md) §2・[world.md](../world.md) §5。テーマ色/差し色の hex は `character-hisui.md` 作成時に確定（TBD）。

## master 生成プロンプト（たたき台。固有作品名は使わずオリジナルに寄せる）

汎用の生成手順・嘘字対策・一貫性ワークフローは [character-guide.md](../character-guide.md) §4「作り方」の「AI生成（共通）」。本項は「ひすい」固有のプロンプトのみ。

顔の方針：**聡明で穏やかな少し年上の女性**。落ち着いた閉じ口の自信ある微笑を軸に、知的さ・余裕で魅せる（小悪魔のきつさ・色気を前面に出す方向には振らない＝シックで聡明）。顔を毎回ブレさせないため、顔の構造語を positive の先頭側に置く。

master の方針（ガイド §4「素体で master を作る」「1体だけ出す」準拠）：このプロンプトは **master（ステップ1・t2i）専用**。**両腕を脇に下ろし・法具（勾玉）を持たせず・衣装の全体が見える正面全身の素体**を出す（勾玉を掲げる姿・ポーズ違いは master 確定後に同一セッション t2i で派生＝下記「派生プロンプト」）。設定シート化（複数アングル）を避けるため `single full-body illustration, one girl only, single front view` を立て、negative に `character sheet / model sheet / turnaround / multiple views` 等を積む。

縦長の白紙キャンバスを種にする（ガイド §4 ステップ1）。**3:4 縦長の真っ白 PNG を参照添付**して冒頭の canvas 指示文を添える。positive/negative が分かれるツールは `[AVOID]` 以降を negative 欄へ。

```
Use the attached blank vertical (3:4) image only as canvas/aspect; plain white background; draw ONE single full-body character head-to-toe, fresh crisp illustration.

[BODY] single full-body front view, one girl only, an elegant slender young woman (early twenties, a little older and taller than a teenage girl), calm composed intelligent poise, softly feminine and graceful silhouette (modest bust, gently defined waist, tasteful and fully clothed), long legs, standing straight and symmetric facing directly forward (no turn, no tilt), shoulders level, both arms relaxed hanging down at her sides, hands lowered and empty, full outfit unobstructed, flat jade-green shoes matching the dress, small white margin below the feet.

[FACE] gentle refined oval face, slightly more grown-up than a teen but still soft anime features, large calm almond-round eyes in clear jade green with bright catchlights, looking at viewer, fine soft eyebrows, small nose, a serene confident closed-mouth smile (wise, warm, composed — not sexy, not stern), light fair skin with flat even cel shading and only a faint blush.

[STYLE] clean crisp anime lineart, sharp clean outlines, proper anime CEL shading with clear hard-edged fold shadows and body-contour shading (volume and form); flat cel style (NOT gradient, NOT glossy, NOT dewy).

[HAIR] glossy dark hair with a faint jade-green sheen, blunt soft fringe, long sleek HALF-UP (upper half gathered, the rest flowing long); a SMALL DELICATE jade hairpin tucked discreetly into the gathered hair, with only a TINY comma-shaped jade magatama bead — subtle and understated, NOT a large ornament; long sidelocks framing the face; no hat.

[OUTFIT] serene Chinese-fortuneteller-witch mascot; a long floor-length JADE-GREEN qipao — a clear refined jade / emerald-jade green (NOT teal, NOT mint-pale, NOT dark-blackish), fitted to her graceful figure, high side slit, high mandarin collar with the chest fully closed and modest, fastened down the collar/chest with pearl-white frog-button clasps whose toggles are shaped like small jade-green comma magatama (the magatama clasps at the chest), pearl-white trim; a SEPARATE long sheer flowing shawl / pibo draped over both arms and trailing down past the hips (translucent gauzy pearl-white, distinct from the dress, NOT a cape, NOT a capelet); clear cel fold shadows on the qipao and shawl (volume, not a flat sticker).

[PATTERN — fixed zoned layout, pearl-white thread, NO scattered clutter]
- pearl-white WATER-RIPPLE embroidery (concentric arc ripples / flowing water motif), placed by zone: a band of water ripples low on the skirt / hem, a small ripple cluster off-center at one hip (asymmetric), and a single small ripple accent at one shawl shoulder;
- a few small jade-green comma-shaped magatama beads as accents near the collar and the hip ripple cluster (no more than a handful);
- plenty of plain jade fabric between motifs, refined and elegant, restrained and intelligent;
- use ONLY the motifs listed above — do NOT add any extra pattern, flowers, dragons, clouds, stars, or decoration not specified here; NEVER write any text / letters / kanji / labels anywhere on the artwork.

solo, front-facing, plain white background.

[AVOID] large hairpin, oversized hair ornament, big headpiece, bulky kanzashi, dangling beaded tassel hanging from the hair; extra unspecified motifs, invented pattern; flowers, lotus, dragon, phoenix, clouds, stars; flat shadeless single-color dress, sticker-like flat fill; teal / mint / pale-washed green, dark blackish green, neon green; flat chest, boyish; busty, large breasts, cleavage, exposed chest, open neckline, keyhole, cutout, sexy, seductive, sultry, heavy makeup; glossy/dewy skin, gradient or soft glowing shading; held objects, holding fan or staff, raised arms, arms crossed; cape, short capelet (she wears a sheer shawl, not a cape); snake, animal, familiar in frame; child, chibi, super deformed, big head, stubby limbs, middle-aged, matronly, old, realistic, semi-realistic, 3d; three-quarter/turned/tilted/asymmetric pose; cropped feet, close-up, character sheet, model sheet, turnaround, multiple views, side view, back view, duplicate; any text, letters, words, kanji or text on clothing, watermark, logo; blurry, soft focus, sketchy lineart.
```

> **聡明さの出し方：** 知性は「眼鏡」を足さずとも、落ち着いた目元＋余裕の閉じ口微笑＋静かな佇まいで出せる（採用 master で確認）。眼鏡をトレードマークにしたければ翡翠縁の細い眼鏡を足せるが、表情差分での一貫性（反射・崩れ）が難点なので当面なしで進める。
> **緑が濁る/青緑に寄るとき：** `clear refined jade / emerald-jade` を強め、negative の `teal / mint / pale-washed / blackish / neon green` を重み付け。澄んだ翡翠を芯に、暗→黒緑と明→ミントの両端を挟む。
> **簪が大きく出るとき：** `SMALL DELICATE ... TINY ... NOT a large ornament` を保ち、negative の `large hairpin / oversized hair ornament / bulky kanzashi` を強化。いっそ消すなら HAIR を `a simple plain clip or tie, no hair ornament, no hairpin` に差し替える（勾玉は胸元の留め具＋立ち絵の手持ちで出るので identity は崩れない）。
> 顔の安定は語の調整より参照画像が効く。気に入った1枚（=master）を確定したら、以降は同一セッション t2i / i2i でその顔を固定し、表情差分を派生させる（[character-guide.md](../character-guide.md) §4）。

> **まお・りんと差がつくか毎回確認：** 髪は3人とも暗色なので**配色・髪型・羽織り・モチーフで差を立てる** ── 配色（翠＋真珠白 ↔ 紺＋金 ↔ 赤紫＋銀）、髪型（ハーフアップロング ↔ お団子 ↔ ツインテール）、羽織り（透ける披帛 ↔ 短ケープ ↔ 長ケープ）、表情（聡明な余裕の微笑 ↔ 満面の笑み ↔ 小悪魔スマイル）、年齢感（少し年上 ↔ 10代 ↔ 10代）、モチーフ（水紋・勾玉〔水・知〕↔ 月星・符 ↔ 蝶・鈴）。セレクト画面で並べて即・別人と分かること。

## 派生プロンプト（道具付き立ち絵／バストアップ）

master 確定後に **同一セッション t2i** で派生させた**確定プロンプト**（実際に採用画像を出したもの）。作る順序・考え方は [character-guide.md](../character-guide.md) §4「作る画像セットと順序」。**派生では白紙キャンバスを添付しない**（添付すると柄がドリフトする＝ガイド §4 の知見）。

**道具付き立ち絵（勾玉を占いの振り子のように掲げる動的ポーズ）** — スタート画面・キャラ選択の見せ場。体を斜め・片手で勾玉を細い紐で振り子のように下げ・反対の手は脱力。披帛と髪が動きで片側へ流れる。

```
Same character as the master we just made — keep the SAME face, hairstyle, small jade hairpin, eyes, colors, jade qipao, sheer pearl-white shawl, water-ripple hem and magatama accents, and art style. Now draw a full-body standing illustration with a graceful divination pose. Do NOT attach any blank canvas.

[BODY / POSE] single full-body view, one elegant slender young woman (early twenties), calm composed intelligent poise, softly feminine graceful figure (modest bust, tasteful, fully clothed), long legs; a gently DYNAMIC pose with a soft three-quarter turn — the body rotated about 30-45° with a calm contrapposto and a slight twist at the waist, the ENTIRE figure (face, head, shoulders, torso, hips, legs) on ONE coherent diagonal, the face turned the same way glancing serenely toward the viewer (NOT a front face on a turned body); she RAISES one hand and lets a single carved JADE magatama bead hang from a fine cord between her fingers, like a divination pendulum held up near her chest/face, the OTHER hand resting lightly in front near her waist; the long sheer pearl-white shawl and her long hair sweeping softly to one side with the motion; flat jade-green shoes, both feet visible, small white margin below the feet.

[FACE] gentle refined oval face turned to the SAME three-quarter angle as the body, large calm almond-round jade-green eyes with bright catchlights glancing at viewer, fine soft eyebrows, small nose, serene confident closed-mouth smile (wise, warm, composed — not sexy, not stern), light fair skin with flat even cel shading and a faint blush.

[STYLE] clean crisp anime lineart, sharp clean outlines, proper anime CEL shading with clear hard-edged fold shadows and body-contour shading (volume and form); flat cel style (NOT gradient, NOT glossy, NOT dewy).

[HAIR] glossy dark hair with a faint jade-green sheen, blunt soft fringe, long sleek HALF-UP (upper half gathered, the rest flowing long); a SMALL DELICATE jade hairpin tucked discreetly into the gathered hair, with only a TINY comma-shaped jade magatama bead — subtle and understated, NOT a large ornament; long sidelocks framing the face; no hat.

[OUTFIT] serene Chinese-fortuneteller-witch mascot; long floor-length JADE-GREEN qipao (clear refined jade / emerald-jade, NOT teal, NOT mint-pale, NOT dark-blackish), high side slit, high mandarin collar fully closed and modest, fastened down the collar/chest with pearl-white frog-button clasps whose toggles are shaped like small jade-green comma magatama (the magatama clasps at the chest), pearl-white trim; a SEPARATE long sheer translucent gauzy PEARL-WHITE shawl / pibo draped over both arms and trailing past the hips, sweeping to one side with the motion (distinct from the dress, NOT a cape); clear cel fold shadows on qipao and shawl.

[PATTERN — fixed zoned layout, pearl-white thread, NO clutter]
- pearl-white WATER-RIPPLE embroidery (concentric arc ripples) as a band low on the skirt / hem, plus a small off-center ripple cluster at one hip and one small ripple accent at one shawl shoulder;
- a few small jade-green comma-shaped magatama bead accents near the collar and the hip (a handful at most);
- plenty of plain jade fabric between motifs, restrained and elegant;
- use ONLY these motifs — NO flowers, lotus, dragon, phoenix, clouds, stars, or any unspecified pattern; NEVER write any text / letters / kanji anywhere.

solo, plain white background.

[AVOID] large hairpin, oversized hair ornament, big headpiece, bulky kanzashi, dangling beaded tassel hanging from the hair; front-facing face on a turned body, weak/no turn, twisted unnatural neck, stiff frontal stance, T-pose, motion blur, speed lines; extra unspecified motifs, flowers, dragon, clouds, stars; teal/mint/pale-washed or blackish or neon green; flat shadeless single-color dress, sticker-like flat fill; busty, large breasts, cleavage, exposed chest, open neckline, cutout, sexy, seductive, sultry; glossy/dewy skin, gradient shading; cape, short capelet; snake, animal, familiar in frame; real readable kanji or text on the cord/charm; child, chibi, big head, middle-aged, matronly, old, realistic, 3d; cropped feet, close-up, character sheet, multiple views, side view, back view, duplicate; any text, letters, kanji on clothing, watermark, logo; blurry, soft focus, sketchy lineart.
```

**バストアップ（勾玉なし・neutral）** — portrait（表情差分）のベース顔。出力を **640×768（5:6）に機械クロップ**して整形（表情差分はこれを基準に同一セッション t2i）。**この crop では披帛の水紋を出さない**（左右対称フレームで両肩に出て煩くなるため＝採用時に修正）。水紋の本来の置き場＝裾はこの crop では枠外。

```
Same character as the master we just made — keep the SAME face, hairstyle, small jade hairpin, eyes, colors, jade qipao, sheer pearl-white shawl, pattern and art style. Now draw a WAIST-UP PORTRAIT. Do NOT attach any blank canvas.

=== VERSION: NO HELD CHARM ("勾玉なし") ===
She is NOT holding any magatama or cord — hands relaxed and lowered, empty. The small jade hairpin + tiny magatama bead in the HAIR stays (worn, not held).

[FRAMING] waist-up portrait, framed from the top of the head down to about the waist / navel, the whole chest and upper torso fully visible (not cropped at the chest), front-facing, centered, face clearly visible at a comfortable size, arms relaxed and lowered, hands empty, calm serene neutral expression with a soft gentle closed-mouth smile (greeting base face).

[FACE / RENDERING] gentle refined oval face, soft cheeks, gentle jawline, large calm almond-round jade-green eyes with bright catchlights looking straight at viewer, fine soft relaxed eyebrows, small nose, light fair skin with flat even cel shading and a faint blush, clean crisp anime lineart, sharp clean outlines, proper anime CEL shading with hard-edged fold shadows and body-contour shading, flat cel style (NOT gradient, NOT glossy, NOT dewy), high detail.

[HAIR] glossy dark hair with a faint jade-green sheen, blunt soft fringe, long sleek HALF-UP (upper half gathered, the rest flowing long down); a SMALL DELICATE jade hairpin tucked discreetly into the gathered hair, with only a TINY comma-shaped jade magatama bead — subtle and understated, NOT a large ornament; long sidelocks framing the face; no hat.

[DESIGN — collar, chest and shoulders show at this crop] serene Chinese-fortuneteller-witch mascot; JADE-GREEN qipao (clear refined jade, NOT teal/mint/pale, NOT blackish) with a high mandarin collar fully closed and modest, fastened down the collar/chest with pearl-white frog-button clasps whose toggles are shaped like small jade-green comma magatama (the magatama clasps at the chest); the long sheer translucent PEARL-WHITE shawl draped plainly over both shoulders/arms; at this crop the ONLY pattern is the magatama frog-button clasps — NO water ripples at this crop (the ripple motif sits on the skirt hem, out of frame); the sheer shawl is plain and unpatterned; plenty of plain jade fabric.

[AVOID] water-ripple pattern on the shoulders or on the sheer sleeves, ripples on both shoulders, any embroidery on the sheer shawl; large hairpin, oversized hair ornament, big headpiece, bulky kanzashi, dangling beaded tassel hanging from the hair; held magatama, cord or charm in hand, hands raised into frame; extra unspecified motifs, flowers, dragon, clouds, stars; teal/mint/pale or blackish/neon green; flat shadeless single-color dress, sticker-like flat fill; busty, large breasts, cleavage, exposed chest, open neckline, cutout, sexy, seductive; glossy/dewy skin, gradient shading; cape, short capelet; snake/animal in frame; extreme close-up, cropped at the chest, zoomed-in face, off-center, looking away, full body, open big grin; child, chibi, big head, middle-aged, matronly, old, realistic, 3d; any text, letters, kanji on clothing, watermark, logo; blurry, soft focus, sketchy lineart.
```

> **聡明さはベースでは穏やかでよい。** バストアップの neutral は落ち着いた閉じ口の微笑が土台。気づき（`insight`）・笑み（`smile`）等の出し分けは表情差分（同一セッション t2i）で展開（[character-guide.md](../character-guide.md) §4 ステップ3）。

## 使い魔（白蛇）の生成プロンプト

**未制作（現状は設定のみ・UI 未登場＝[world.md](../world.md) §5）。** 白蛇＝弁財天の神使（知恵・清廉）でひすいの聡明さに呼応する。制作時はまお（使い魔ココ）に倣う：**1:1 の白紙正方形を種**にとぐろ／鎌首の全身を master 生成 → 同セッション t2i／i2i で表情・ポーズ派生（[character-mao-image-prompts.md](../mao/character-mao-image-prompts.md) の「使い魔ココ」項が雛形）。配色・画風はひすい本体に寄せる（**白〜真珠白の体＋翠の瞳**、所により鱗に翡翠の差し色、crisp lineart）。嘘字対策・愛嬌（怖くしすぎない・親しみのある聡明な相棒）に留意。
