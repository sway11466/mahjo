# さんご 画像生成プロンプト集

さんご（＋使い魔 狐〔狐仙／九尾〕）の画像生成プロンプトを集約（[character-sango.md](./character-sango.md) §3 から分離して肥大化を回避）。

- **識別情報（外見コンセプト・衣装の模様・モチーフ・配色・使い魔設定）の正は [character-sango.md](./character-sango.md) §3**（世界・系譜の正は [world.md](../world.md) §4・§5）。本ファイルは「実際に使う生成プロンプト」だけを持つ。
- 汎用の生成手順・嘘字対策・一貫性ワークフロー・**作る画像セットと順序**は [character-guide.md](../character-guide.md) §4。
- **画風はまお・りん・しん・ひすいと統一のハウススタイル＝くっきり線＋セル塗り・ツヤ控えめ**（`clean crisp anime lineart, sharp clean outlines, proper cel shading`）。
- 命名は kebab＋id 接頭辞（[character-guide.md](../character-guide.md) §3・§5）：配布 `sango-portrait-<expr>-<variant>.webp`／`sango-full-stand-a.webp`／`sango-avatar.webp`／`sango-familiar.webp`、master PNG（original 限定）`sango-master-full.png`・`sango-master-bustup.png`。

> **現状（2026-06-23・お試しで方向確定）：** 試し出しを重ね、**ルックの方向が固まった**（下記「ルックの方向」）。master 素体（直立）・道具付き立ち絵（杯を掲げる見せ場）＝狙い通りを確認。**バストアップ（neutral ベース顔）＝未確認**（master・立ち絵と同 identity で改めて出す）。確定したら採用版として原文保存し本注記を更新する。検討段階で大胆露出版（bold glamour）も試したが**不採用＝破棄**（上品な色気で確定）。

## ルックの方向（試し出しで確定）

さんごの核は **「紅と漆黒で絢爛に装った、姉御肌の大人の女館主」**＝ひすいの**シック（静）**に対する**ゴージャス（動）**。生成のたびに確認する：

- **年齢帯・等身**：20代後半の成熟した女性（師匠世代＝大人）。約 **7.5〜8頭身**（弟子3人〔まお・りん・しん〕より一段高い＝[character-guide.md](../character-guide.md) §3「等身」）。ティーン・幼児に倒さない。
- **顔（master/portrait の土台）**：**可愛い美人**（大きめの丸い目・柔らかい頬・甘い閉じ口の微笑み）に大人の落ち着き。口元/目尻にほくろ一点（上品な色気）。*きつい・険しい・怖い*に振らない。
- **顔（道具付き立ち絵＝見せ場）**：あえて表情を変えて個性を強調＝**ツンデレ**（そっぽ＋流し目＋薄笑い＋頬の赤み）。「べ、別に」の強気と照れの同居。*妖艶・下品*には振らない（色気は上品どまり）。
- **髪**：つや黒の**超ロング**。長いサイドスウェプトのポニー／ゆる三つ編みを片肩から腰下まで流す（動きが軸）。金のヘアカフ＋珊瑚紅の歩揺（簪）＋椿の花飾り。**帽子なし**（魔女は表に出さない＝世界観）。
- **衣装**：**珊瑚紅を主役**にした off-shoulder の旗袍（立て襟・深スリット）。**漆黒**の差し（パネル・帯）＋**金**の縁取り・装飾。披帛（ショール）で動を出す。紅は**面で華やかに使ってよい**（主色＝華やかさが身上。りん・しんの「点で効かす」とは逆）。

調整レバー（試し出しの知見）：可愛さ不足→目を大きく丸く＋頬をふっくら＋顎を小さく＋笑みを甘く（`LARGE round sparkling eyes, soft full youthful cheeks, sweet soft smile`）。きつく・怖い→`NOT harsh, NOT severe, NOT scary` ＋目の影を消す。大人っぽさ不足→`grown adult woman, late twenties, NOT a teen`。素体が崩れる（傾く）→`standing STRAIGHT and UPRIGHT, NOT contrapposto`。

## master 生成プロンプト（素体・直立・確定方向）

ガイド §4「素体で master を作る」「1体だけ出す」準拠。**両腕を脇に下ろし・杯を持たず・衣装全体が見える正面全身の素体**を直立で出す（杯を掲げる姿・バストアップは派生＝下記）。表情は素体なので**穏やかで可愛い美人顔**（neutral 寄り。ツンデレの薄笑いは立ち絵側）。3:4 縦長の白紙キャンバス（`docs/characters/character-white-space.png`）を参照添付すると縦長・1体・くっきりが安定。positive/negative が分かれるツールは `── AVOID ──` 以降を negative 欄へ。採用したら `original/sango-master-full.png` に保管。

```
Use the attached blank vertical (3:4) image only as canvas/aspect; plain white background; draw ONE single full-body character head-to-toe, fresh crisp illustration.

[BODY] single full-body front view, one GLAMOROUS ADULT WOMAN only (a poised woman in her LATE TWENTIES, a grown hall-mistress — clearly an adult, NOT a teenager, NOT a little girl), tall statuesque adult proportions about 7.5 to 8 heads tall, a mature curvaceous womanly figure, confident and elegant; standing STRAIGHT and UPRIGHT facing directly forward, weight evenly on both legs, both feet planted, shoulders level (NOT a contrapposto, NOT a hip-cocked pose, NOT leaning), both arms relaxed at her sides, hands lowered and empty, the whole outfit clearly visible; elegant heels; small white margin below the feet.

[FACE] a BEAUTIFUL and CUTE, lovely charming ADULT woman's face — soft sweet feminine features, very pretty with an endearing cuteness; LARGE round sparkling almond eyes with lush eyelashes, bright lively catchlights and a gentle sweet gaze (adorable and captivating, warmly feminine — beautiful AND cute, NOT harsh, NOT severe, NOT scary); softly arched delicate eyebrows; a small refined nose; soft full youthful cheeks and a gently rounded delicate jaw with a soft small chin (sweetly pretty and youthful-looking — an adult woman with a cute charm, still clearly a grown woman, NOT a child, NOT a teen); a single small beauty mark near one eye / at the corner of the mouth (tasteful charm); smooth fresh clear skin, warm healthy living skin tone with a soft natural blush (NOT pale, NOT grey); a gentle warm expression with a sweet soft closed-mouth smile, charming, graceful and quietly confident. NO heavy shadow over the eyes, eyes fully visible, bright and lovely, no eye-bags.

[STYLE] clean crisp anime lineart, sharp clean outlines, proper anime CEL shading with clear hard-edged fold shadows and body-contour shading (volume and form); flat cel style with restrained gloss (NOT glossy, NOT dewy, NOT gradient-heavy); rich gorgeous palette led by warm CORAL-RED with deep-black and gold accents, but keep the SKIN warm, healthy and lively.

[HAIR] glossy jet-black hair, VERY LONG and flowing with elegant dramatic movement — gathered into a long side-swept ponytail / loose braid that drapes over one shoulder and sweeps far down past the hips (dramatic length, lively flow), a few soft strands framing the face; threaded with thin GOLD hair cuffs along its length; adorned with a CORAL-RED buyao (歩揺) hairpin and a single CORAL-RED camellia ornament (the coral accents are the only strong red in the hair); NO hat.

[OUTFIT — tasteful allure] a gorgeous, opulent CORAL-RED qipao / cheongsam reworked glamorously — a high closed mandarin collar but OFF-THE-SHOULDER, baring the shoulders and collarbone elegantly; figure-flattering with a deep thigh-high side slit revealing one leg; a long flowing sheer shawl (披帛) sweeping from the arms for graceful movement; ornate GOLD jewelry (drop earrings, a slim gold waist chain, bangles); warm CORAL-RED as the dominant color, DEEP BLACK accent panels and a black sash, thin GOLD piping along the edges; opulent and alluring but tasteful.

[PATTERN — fixed zoned, gorgeous but ordered, camellia as the single floral motif]
- camellia motif (椿): elegant CORAL-and-GOLD camellia blossoms with leaves embroidered LARGE and graceful across the skirt and trailing up one side (asymmetric, flowing), refined embroidery flat on the cloth;
- gold trim: thin gold piping along the collar, edges and hem; gold jewelry as the metal accent;
- black accents: deep-black panels / sash framing and breaking up the coral;
- all embroidery details are decorative (no real kanji, no legible text);
- use ONLY the camellia as the floral motif — NO other flowers, NO peony, NO lotus, NO rose, NO butterflies, NO clouds, NO stars, NO dragons, NO phoenix.

── AVOID ──
contrapposto, hip-cocked pose, leaning, twisted stance, weight on one leg, dynamic action pose;
plain ordinary unremarkable face, generic unremarkable face, dull lifeless face;
teenager, teen girl, young girl, child, little kid, chibi, baby face, round chubby cheeks, oversized round childlike eyes, short stubby body, big head, flat-chested teenage figure, schoolgirl;
lewd, crude, pornographic, vulgar over-sexualized pin-up, sleazy "妖艶" look;
scary, intimidating, menacing, sinister, gloomy, evil villain aura, dark shadow over the eyes, sunken eyes, eye-bags, cruel glare;
pale lifeless skin, grey or ashen skin, sickly pallor, cold-toned skin, corpse-like complexion, dull desaturated skin;
short proportions, 6-head tall, stubby;
hat, witch hat, wide-brim hat, cap, hood, crown;
twin-tails, odango buns, short hair, messy hair;
other flowers, peony, lotus, rose, butterflies, clouds, vines, stars, sparkles, dragon, phoenix bird printed on cloth;
neon red, hot pink, fully black outfit, drab muddy red;
holding object, arms crossed, hands raised in front of body, arms covering the outfit, cup, chalice, fan, weapon, staff, items in hand;
a fox, nine-tailed fox, animal companion in frame, second character;
character sheet, model sheet, turnaround, multiple views, side view, back view, multiple poses, duplicate character;
mahjong tiles, kanji or readable text on clothing, garbled characters, watermark, logo, signature, text;
glossy dewy skin, wet-look gloss, gradient-heavy rendering, blurry, soft focus, sketchy lineart, soft sleepy lines;
realistic, semi-realistic, 3d, busy background, scenery, colored background.
```

## 派生プロンプト（道具付き立ち絵／バストアップ）

master 確定後に **同一セッション t2i** で派生（作る順序は [character-guide.md](../character-guide.md) §4「作る画像セットと順序」）。**派生では白キャンバスを添付しない**（純 t2i でセッションの視覚記憶に寄りかかり衣装の模様が揃う＝ガイド §4）。

### 道具付き立ち絵（紅の杯を掲げる動的ポーズ・ツンデレ・確定方向）→ `sango-full-stand-a.webp`

スタート画面・キャラ選択の見せ場。狙い＝**杯をすっと掲げる優雅な所作で動きを出す＋ツンデレの強気な薄笑い**。

> **表情は neutral（master・portrait の土台）とあえて変える**。立ち絵は見せ場なので、さんごの個性（ツンデレ・強気な色気）を前に出す（一般則は [character-guide.md](../character-guide.md) §4「作る画像セットと順序」）。穏やかな素顔は portrait 側が担う＝住み分け。狐（狐仙／九尾）は単体アセット（`sango-familiar.webp`）で別途出すため、立ち絵では枠外（AVOID）。

```
IMPORTANT — this is a SHOWPIECE pose. Push the EXPRESSION and an ELEGANT sense of motion hard, even if it differs from the soft calm master.

Same character (a glamorous adult woman in her late twenties, ~7.5–8 heads tall, very long flowing jet-black side-swept hair with gold cuffs, coral-red buyao hairpin and a coral camellia, a beautiful cute pretty face with a small beauty mark, warm healthy skin, gorgeous coral-red OFF-THE-SHOULDER qipao with a deep side slit, black and gold accents, camellia embroidery, same crisp cel art style).

[EXPRESSION & VIBE — lead with this] a GORGEOUS, confident, alluring grown woman with a proud TSUNDERE edge — beautiful charming face turned slightly away with a cool self-assured air, glancing back at the viewer from the corner of her eyes; a confident knowing half-smile / faint smirk (lips together), a touch of haughty pride with a soft blush on the cheeks (secretly pleased, won't admit it); elegant, striking and charismatic — alluring but tasteful, NOT scary, NOT vulgar, NOT a plain sweet smile. Eyes beautiful and bright, warm healthy skin.

[POSE — elegant glamorous movement] single full-body illustration, one adult woman only (~7.5–8 heads), a graceful poised standing pose with elegant motion — the whole figure on ONE three-quarter diagonal, weight on one leg in a refined contrapposto, hip gently cocked; one hand elegantly presenting / holding aloft a small CORAL-RED divination CUP (杯) out to the side at chest height (a graceful showman's flourish), the other arm posed gracefully resting on the hip; the long sheer shawl and very long hair sweeping with the motion; the deep side slit and flowing skirt showing the movement; full outfit clearly visible, cup held away from the body; elegant heels.

[CUP = 杯] a small elegant CORAL-RED divination cup / chalice with a thin gold rim, glowing faintly; no real kanji, no legible text.

[HAIR] glossy jet-black hair, very long side-swept ponytail / braid sweeping past the hips with lively movement, thin gold hair cuffs, coral-red buyao hairpin and a coral camellia, fringe not shadowing the eyes; NO hat.

[STYLE] clean crisp anime lineart, sharp clean outlines, proper anime cel shading with hard-edged fold shadows; flat cel style, restrained gloss; gorgeous palette led by coral-red with black and gold, SKIN kept warm and healthy.

[OUTFIT + PATTERN] same gorgeous CORAL-RED off-the-shoulder qipao, high mandarin collar, deep thigh-high slit, sheer shawl; coral-red dominant, deep-black accent panels / sash, thin gold trim and gold jewelry; same camellia embroidery (coral-and-gold camellias trailing across the skirt up one side); use ONLY the camellia motif, NO other flowers, NO butterflies, NO clouds, NO stars, NO dragons.

── AVOID ──
stiff static direct front pose, T-pose, frozen lifeless stance, twisted broken pose;
plain sweet idol smile, bland ordinary face, big open grin, harsh severe glare;
lewd, crude, pornographic, vulgar pin-up, sleazy look;
evil villain glare, menacing, scary, cruel sneer, dark shadow over the eyes, sunken eyes, eye-bags;
pale lifeless skin, grey or ashen skin, sickly pallor, cold-toned skin;
teenager, teen girl, child, chibi, baby face, oversized childlike eyes, big head, short stubby body, flat-chested teen, 6-head tall;
hat, witch hat, wide-brim hat, hood, crown;
twin-tails, odango buns, short hair;
other flowers, peony, lotus, rose, butterflies, clouds, vines, stars, dragon, phoenix; neon red, hot pink, fully black outfit;
a fox, nine-tailed fox, second character, animal companion in frame;
both hands hidden, arms crossed hiding the outfit, cup covering the body;
mahjong tiles, kanji or readable text on clothing or cup, garbled characters, watermark, logo, text;
glossy dewy skin, gradient-heavy rendering, blurry, soft focus, sketchy lineart;
character sheet, model sheet, multiple views, side view, back view, duplicate character;
realistic, semi-realistic, 3d, busy background, colored background.
```

### バストアップ（杯なし・neutral／未確認）→ `sango-master-bustup.png` → `sango-portrait-neutral-a.webp`

portrait（表情差分）のベース顔。**道具なし・neutral・正面・手は枠外**。出力を **5:6 でクロップ → 透過 → 640×768** に整える（順序厳守＝ガイド §4 のクロップノート）。表情差分はこのバストアップを基準に同一セッション t2i。**未確認＝出して採用したら本注記を消す。**

```
Same character as the standing pose — keep the SAME beautiful cute charming adult face (late twenties), very long jet-black side-swept hair with gold cuffs, coral-red buyao hairpin and a coral camellia, beauty mark, warm healthy skin, gorgeous coral-red off-shoulder qipao and art style. Now draw a WAIST-UP PORTRAIT (base neutral face).

NO held cup / items — she is NOT holding anything. Hands relaxed and lowered, out of frame.

[FRAMING] waist-up portrait, framed from the top of the head down to about the waist, the whole chest and upper torso fully visible (not cropped at the chest), front-facing, centered, face clearly visible at a comfortable size, plain solid white background.

[EXPRESSION — calm gentle base / greeting face] a calm, gentle, elegant RESTING expression with a sweet soft closed-mouth smile, warm and quietly confident; large beautiful round eyes with a gentle sweet gaze (NOT smirking, NOT harsh, NOT severe, NOT scary); lovely, cute and graceful at ease.

[FACE] beautiful cute charming adult woman, soft sweet feminine features, large round sparkling almond eyes with lush lashes and bright catchlights, softly arched delicate eyebrows, a small refined nose, soft full youthful cheeks and a gently rounded delicate jaw with a soft small chin, a single small beauty mark near one eye / at the corner of the mouth; smooth fresh clear skin, warm healthy living skin tone with a soft natural blush (NOT pale, NOT grey); clean crisp anime lineart, sharp clean outlines, restrained-gloss cel shading, high detail. NO heavy shadow over the eyes, eyes fully visible, bright and lovely, no eye-bags.

[HAIR] glossy jet-black hair, very long and side-swept over one shoulder sweeping down out of frame, soft strands framing the face, thin gold hair cuffs, a coral-red buyao hairpin and a single coral camellia ornament; NO hat.

[OUTFIT — shoulders and chest show at this crop] gorgeous coral-red OFF-THE-SHOULDER qipao with a high mandarin collar, bare shoulders and collarbone elegantly shown, thin gold collar trim, gold drop earrings and a slim gold necklace; coral-red dominant, deep-black accents, gold trim; a single coral-and-gold camellia at the chest / shoulder.

── AVOID ──
holding cup, items in hand, hands raised into frame;
smirk, big open grin, harsh severe face, bland ordinary face;
lewd, vulgar, sleazy, over-sexualized;
evil glare, menacing, scary, dark shadow over the eyes, sunken eyes, eye-bags, gloomy;
pale lifeless skin, grey or ashen skin, sickly pallor, cold-toned skin;
teenager, teen girl, child, chibi, baby face, oversized childlike eyes, big head;
hat, witch hat, hood;
twin-tails, odango buns, short hair;
other flowers, peony, lotus, butterflies, stars, dragon; neon red, hot pink, fully black outfit;
a fox, second character;
extreme close-up, cropped at the chest, framed too tight, zoomed-in face, off-center, looking away, full body;
mahjong tiles, kanji or readable text, garbled characters, watermark, logo, text;
glossy dewy skin, gradient-heavy rendering, blurry, soft focus, sketchy lineart;
realistic, semi-realistic, 3d, busy background, colored background.
```

> 表情差分（happy・troubled・smile・smug 等）はこのバストアップ neutral を基準に同一セッション t2i で派生し、`sango-portrait-<expr>-a.webp` に書き出す。同じ枠でクロップして揃える（差し替えてもズレない）。立ち絵のツンデレ薄笑いを `smug`／`mischievous` 系の差分に流用してよい。

## 使い魔（狐＝狐仙／九尾）の生成プロンプト → `sango-familiar.webp`

**未制作（現状は設定のみ・UI 未登場＝[character-sango.md](./character-sango.md) §3 使い魔）。** 制作時はまお（使い魔ココ）・りん（銀猫）に倣う：**1:1 の白紙正方形（`docs/characters/familier-white-space.png`）を種**にとまり姿／座り姿の全身を master 生成 → 同セッション t2i／i2i で表情・ポーズ派生。配色・画風はさんご本体に寄せる：**艶やかな珊瑚紅〜金の九尾の狐＋大人の色気（賢く優美）**。鋭さより*艶やかさ・格*を出す（妖艶には振らない）。

```
Use the attached blank square (1:1) image only as canvas/aspect; plain white background; draw ONE single fox, fresh crisp illustration.

[SUBJECT] single elegant NINE-TAILED fox (kitsune / fox-spirit) sitting / perched gracefully, full body, side-three-quarter view, calm poised posture, beautiful clever eyes (graceful and wise, NOT ominous, NOT scary), a refined familiar companion with an air of mature elegance; nine flowing tails fanning out gracefully.

[DESIGN] sleek lustrous CORAL-RED-and-warm-gold fur with clean cel shading, soft cream underside, GOLD accent tips on the tails and a thin gold ornament, matching its mistress; refined elegant silhouette, glossy well-groomed fur.

[STYLE] clean crisp anime lineart, sharp clean outlines, proper anime cel shading with hard-edged fold shadows; flat cel style with restrained gloss; gorgeous warm palette; plain solid white background.

── AVOID ──
scary ominous horror fox, evil glowing eyes, demon, monster, blood, gore, menacing pose, sleazy "妖艶";
other animals, single-tail ordinary fox, multiple foxes, character sheet, multiple views;
fully red body, neon, hot pink;
watermark, logo, text, busy background, colored background, realistic, 3d, blurry, sketchy lineart.
```

> 狐の含み：狐仙（九尾）は さんごの**大人の色気・館主の格**を映す相棒（艶やかさ＝[world.md](../world.md) §5）。アプリ内では声を出さない（ヒントの担い手＝[hints.md](../spec/hints.md)）。出自・神格は表に出さず、見た目の艶（珊瑚紅×金・九尾）に留める。
