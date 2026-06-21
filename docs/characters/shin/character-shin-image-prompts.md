# しん 画像生成プロンプト集

しん（＋使い魔カラス）の画像生成プロンプトを集約（[character-shin.md](./character-shin.md) §3 から分離して肥大化を回避）。

- **識別情報（外見コンセプト・衣装の模様・モチーフ・配色・使い魔設定）の正は [character-shin.md](./character-shin.md) §3**（世界・系譜の正は [world.md](../world.md) §5・§7）。本ファイルは「実際に使う生成プロンプト」だけを持つ。
- 汎用の生成手順・嘘字対策・一貫性ワークフロー・**作る画像セットと順序**は [character-guide.md](../character-guide.md) §4。
- **画風はまお・りん・ひすいと統一のハウススタイル＝くっきり線＋セル塗り・ツヤ控えめ**（`clean crisp anime lineart, sharp clean outlines, proper cel shading`）。
- 命名は kebab＋id 接頭辞（[character-guide.md](../character-guide.md) §3・§5）：配布 `shin-portrait-<expr>-<variant>.webp`／`shin-full-stand-a.webp`／`shin-avatar.webp`／`shin-familiar.webp`、master PNG（original 限定）`shin-master-full.png`・`shin-master-bustup.png`。

> **現状（2026-06-20・お試しで方向確定）：** 試し出しを重ね、**ルックの方向が固まった**（下記「ルックの方向」）。立ち絵（卦札を掲げる動的ポーズ）＝及第点、バストアップ（neutral ベース顔）＝狙い通りを確認。master 素体の最終1枚は未確定（立ち絵・バストアップは別系統で出せたので、素体は同 identity で改めて出す）。確定したら採用版として原文保存し本注記を更新する。

## ルックの方向（試し出しで確定）

しんの差別化の核（まお・りんは少女、**しんは少年**）に加え、試し出しで次が固まった。生成のたびに確認する：

- **年齢帯**：中高生（around 15・約7〜7.5頭身）。大人（8頭身・長身）や幼児（童顔・低頭身）に倒さない＝まお/りんと同じ年齢帯。
- **顔（master/portrait の土台）**：クールで端正な美形（refined cool bishounen idol）。穏やかな素のクール顔（涼しげ・閉じ口の落ち着き）。怖い・威圧・悪役には振らない。
- **顔（動きのある立ち絵＝見せ場）**：あえて表情を変えて個性を強調＝**鋭い緋眼＋不敵な薄笑い**（参考の気配は「鋭いクールな少年像＋エレガントな魔術師プリンス」を*特徴に翻訳*して寄せる。版権キャラの直接模倣はしない＝[character-guide.md](../character-guide.md) §4・[character-shin.md](./character-shin.md) §3。住み分けの一般則は [character-guide.md](../character-guide.md) §4「作る画像セットと順序」）。
- **肌**：暖色・血色のある健康的な肌（warm healthy lively skin）。青白い・生気のない肌は不可（怖さ・不健康さの主因だった）。
- **髪**：逆立った黒のとがった毛束＋前髪に緋ストリーク一筋。前髪で目に影を落とさない（目はくっきり見せる）。
- **衣装**：黒の道服／チャイナ（襟詰め）。緋は縁・裏地・一筋で点的に（黒が主役）。モチーフ＝焔／カラス羽根／卦の爻線（低密度・非対称・余白広め。雲・蝶は使わない）。

調整レバー（試し出しの知見）：大人っぽい→`around 14-15, about 7 heads`／幼い→`around 16, 7.5 heads, more defined jaw`。怖い・不健康→肌を暖色に＋目の影を消す＋`NOT scary, NOT menacing`。平凡→`refined / striking / charismatic`。鋭さ不足→`sharper keener eyes, confident smirk`。

## master 生成プロンプト（素体・たたき台）

ガイド §4「素体で master を作る」「1体だけ出す」準拠。**両腕を脇に下ろし・法具（卦札）を持たず・衣装全体が見える正面全身の素体**を出す（卦札を扱う姿・バストアップは派生＝下記）。表情は素体なので**涼しげな素のクール顔**（neutral 寄り。不敵な薄笑いは立ち絵側）。3:4 縦長の白紙キャンバス（`docs/characters/character-white-space.png`）を参照添付すると縦長・1体・くっきりが安定。positive/negative が分かれるツールは `── AVOID ──` 以降を negative 欄へ。採用したら `original/shin-master-full.png` に保管。

```
Use the attached blank vertical (3:4) image only as canvas/aspect; plain white background; draw ONE single full-body character head-to-toe, fresh crisp illustration.

[BODY] single full-body front view, one MID-TEEN BOY only (around 15, a teenage apprentice in the same age band as the other teenage apprentices — youthful but clearly not a small child), slim teenage proportions about 7 to 7.5 heads tall (NOT a tall 8-head adult, but NOT a stubby 6-head little kid), slender teen build, flat chest, straight shoulders; standing straight facing directly forward, weight even, both arms relaxed hanging down at his sides, hands lowered and empty, full robe unobstructed; black flat slippers; small white margin below the feet.

[FACE] a refined COOL HANDSOME bishounen idol face — like a cool, elegant, princely young Japanese idol — elegant, well-balanced, symmetrical features; a clean straight slim nose; clear bright almond eyes with crisp defined eyelids and clean eye outlines, vivid CRIMSON eyes, cool and composed yet calm, kind and approachable (well-lit, NOT sharp slitted, NOT scary); neat slender eyebrows; a slim refined youthful jaw and a softly pointed chin (still a teenage boy — not gaunt, not feminine, not an adult); smooth fresh clear skin, warm healthy living skin tone with a soft natural blush (NOT pale, NOT grey, NOT lifeless); a cool calm composed expression with a soft closed mouth, quietly confident, elegant and photogenic. NO heavy shadow cast over the eyes, eyes fully visible and bright, no eye-bags, not menacing.

[STYLE] clean crisp anime lineart, sharp clean outlines, proper anime CEL shading with clear hard-edged fold shadows and body-contour shading (volume and form); flat cel style with restrained gloss (NOT glossy, NOT dewy, NOT gradient-heavy); cool muted palette for the outfit and mood, but keep the SKIN warm, healthy and lively (not cold-toned, not desaturated).

[HAIR] glossy jet-black hair (no hat), spiky layered tufts with movement and pointed strands but kept neat and stylish, soft long fringe framing the face that does NOT fall over or shadow the eyes (eyes fully visible), one single vivid CRIMSON inner-color streak in the fringe (a single thin scarlet lock, the only red in the hair).

[OUTFIT] cool young fortune-teller boy with a Chinese twist (a hidden witch — nothing overtly occult on the surface); a BLACK-based daoist robe / changshan-style chinois — a high closed mandarin collar, light and easy to move in, fitted but not tight; deep matte black as the dominant color; crimson ONLY as thin edges, collar trim, cuffs and the inner lining glimpsed at the front opening (red used sparingly as a point accent, never as a large field); clear cel fold shadows following the body and the drape (volume, not a flat sticker).

[PATTERN — fixed zoned layout, LOW density, asymmetric, wide plain black space, crimson as thin line/edge accents only]
- flame motif (緋の炎): a few stylized crimson flame-tongues (thin tapering licks with negative-space inner cut-outs) climbing low from the LEFT hem upward along one side only (asymmetric, not mirrored), small and sparse;
- crow-feather motif: a single crimson crow feather mark at the RIGHT chest near the collar, and a couple of small scattered feather accents trailing off one sleeve cuff;
- trigram yao-lines (卦の爻線, the broken/solid horizontal bars of the I-Ching): one short stacked trigram of thin crimson bars on the LEFT upper sleeve, fixed to that zone;
- all card-face / feather / glyph details are crimson UNREADABLE decorative glyphs (no real kanji, no legible text);
- use ONLY the listed motifs (flame, crow feather, trigram bars) — do NOT add any unspecified pattern, NO clouds, NO butterflies, NO stars, NO dragons; keep large areas of plain black fabric (minimal, restrained, lots of negative space).

── AVOID ──
plain ordinary unremarkable face, generic boy-next-door face;
small child, little kid, elementary-schooler, toddler proportions, chibi, super deformed, baby face, round chubby cheeks, oversized round childlike eyes, stubby short body, big head;
scary, intimidating, menacing, sinister, gloomy, evil villain aura, dark shadow over the eyes, shadowed eyes, sunken eyes, eye-bags, sharp narrow slitted eyes, cruel glare, harsh sneer;
pale lifeless skin, grey or ashen skin, sickly pallor, cold-toned bluish skin, vampire pallor, corpse-like complexion, dull desaturated skin;
tall adult proportions, 8-head tall, mature grown man, long adult face, old, lanky;
girl, female, feminine figure, breasts, soft girlish makeup face, long flowing girl hair, twin-tails, odango buns;
clouds, cloud motif, butterflies, vines, stars, sparkles, dragon, phoenix bird printed on cloth;
large red fabric area, fully red outfit, neon red, pink;
holding object, arms crossed, hands raised in front of body, arms covering the robe, weapon, staff, fan, cards in hand;
hat, cap, hood;
character sheet, model sheet, turnaround, multiple views, side view, back view, multiple poses, duplicate character;
mahjong tiles, kanji or readable text on clothing, garbled characters, watermark, logo, signature, text;
glossy dewy skin, wet-look gloss, gradient-heavy rendering, blurry, soft focus, sketchy lineart, soft sleepy lines;
realistic, semi-realistic, 3d, busy background, scenery, colored background.
```

## 派生プロンプト（道具付き立ち絵／バストアップ）

master 確定後に **同一セッション t2i** で派生（作る順序は [character-guide.md](../character-guide.md) §4「作る画像セットと順序」）。**派生では白キャンバスを添付しない**（純 t2i でセッションの視覚記憶に寄りかかり衣装の模様が揃う＝ガイド §4）。

> **試し出しの知見：** 同一セッションで穏やかな素体が視覚記憶に強く残ると、後からの「鋭く・動きを」が打ち消されやすい（in-session の慣性）。**表情・所作を文頭に置いて強く**書くか、別セッションで出すと乗りやすい（立ち絵は別セッションで及第点が出た）。

### 道具付き立ち絵（卦札を掲げる動的ポーズ・確定方向）→ `shin-full-stand-a.webp`

スタート画面・キャラ選択の見せ場。狙い＝**エレガントな魔術師の所作（札をすっと掲げる見せ場）で動きを出す＋鋭い不敵なクール顔**。

> **表情は neutral（master・portrait の土台）とあえて変える**。立ち絵は見せ場なので、しんの個性（鋭い・不敵なクール）を前に出す（一般則は [character-guide.md](../character-guide.md) §4「作る画像セットと順序」）。穏やかな素顔は portrait 側が担う＝住み分け。

```
IMPORTANT — this is a SHOWPIECE pose. Push the EXPRESSION and an ELEGANT sense of motion hard, even if it differs from the calm master.

Same character (around 15, black upswept spiky hair with a single crimson fringe streak, vivid crimson eyes, warm healthy lively skin, black daoist robe with the same crimson motifs, same crisp cel art style).

[EXPRESSION & VIBE — lead with this] a COOL, ELEGANT, CHARISMATIC young magician-prince with a sharp confident edge; refined poised handsome bishounen face; keen SHARP crimson eyes with a knowing, self-assured look and a slight upward outer tilt; bold neat dark eyebrows; an elegant cool confident smirk (one corner up, lips together), suave and quietly theatrical, like a graceful magician showman; striking, polished and charismatic — NOT a gentle idol smile, NOT bland; cool and composed, but NOT evil, NOT menacing, NOT scary. Eyes clear and bright, no shadow over them, warm healthy skin (not pale).

[POSE — elegant movement, magician flourish] single full-body illustration, one mid-teen BOY only (around 15, slim teen proportions about 7 to 7.5 heads), a graceful poised standing pose with elegant motion — the whole figure on ONE three-quarter diagonal, weight on one leg with a refined contrapposto, a smooth theatrical magician's gesture: one hand presenting a single rounded FORTUNE CARD elegantly out to the side at chest/eye height (a showman's flourish), the other arm gracefully posed; the long robe hem and wide sleeves sweeping with the motion; full robe clearly visible, card held away from the robe; black flat slippers.

[CARD = 卦札] rounded-corner divination card, black with a thin crimson edge, FACE = stacked I-Ching trigram yao-lines (thin crimson bars, unreadable decorative glyphs), BACK = a crimson crow-feather emblem; no real kanji, no legible text.

[HAIR] glossy jet-black hair (no hat), bold upswept spiky pointed tufts (cool, stylish, a little theatrical), fringe not shadowing the eyes, one single vivid CRIMSON streak in the fringe (the only red in the hair).

[STYLE] clean crisp anime lineart, sharp clean outlines, proper anime cel shading with hard-edged fold shadows; flat cel style, restrained gloss; cool muted palette for the outfit, SKIN kept warm and healthy.

[OUTFIT + PATTERN] same BLACK daoist changshan, high closed mandarin collar; crimson ONLY as thin edges/trim/cuffs/inner lining; same low-density asymmetric motifs — sparse crimson flame-tongues low on one side of the hem, one crimson crow feather at a chest, a short trigram-bar mark on one upper sleeve; wide plain black space; use ONLY these motifs, NO clouds, NO butterflies, NO stars, NO dragons.

── AVOID ──
stiff static direct front pose, T-pose, frozen lifeless stance, twisted pose;
gentle soft idol smile, sweet innocent look, bland ordinary face, big happy grin;
evil villain glare, menacing, sinister, scary, cruel sneer, demonic, dark shadow over the eyes, sunken eyes, eye-bags;
pale lifeless skin, grey or ashen skin, sickly pallor, cold-toned skin, vampire pallor;
small child, chibi, baby face, round chubby cheeks, oversized round childlike eyes, big head, stubby body;
tall adult proportions, 8-head tall, grown man, old, lanky;
girl, female, feminine, breasts, makeup, long girl hair, twin-tails;
both hands hidden, arms crossed hiding the robe, card covering the robe;
clouds, butterflies, vines, stars, dragon, large red area, neon red, pink;
hat, hood, weapon, staff;
mahjong tiles, kanji or readable text on clothing or card, garbled characters, watermark, logo, text;
glossy dewy skin, gradient-heavy rendering, blurry, soft focus, sketchy lineart;
character sheet, model sheet, multiple views, side view, back view, duplicate character;
realistic, semi-realistic, 3d, busy background, colored background.
```

### バストアップ（卦札なし・neutral／確定方向）→ `shin-master-bustup.png` → `shin-portrait-neutral-a.webp`

portrait（表情差分）のベース顔。**道具なし・neutral・正面・手は枠外**。出力を **5:6 でクロップ → 透過 → 640×768** に整える（順序厳守＝ガイド §4 のクロップノート）。表情差分はこのバストアップを基準に同一セッション t2i。

```
Same character as the standing pose — keep the SAME cool sharp charismatic bishounen face, mid-teen age (around 15), black upswept spiky hair with the single crimson fringe streak, vivid crimson eyes, warm healthy lively skin, black daoist robe and art style. Now draw a WAIST-UP PORTRAIT (base neutral face).

NO held cards / items — he is NOT holding anything. Hands relaxed and lowered, out of frame.

[FRAMING] waist-up portrait, framed from the top of the head down to about the waist, the whole chest and upper torso fully visible (not cropped at the chest), front-facing, centered, face clearly visible at a comfortable size, plain solid white background.

[EXPRESSION — calm cool base / greeting face] a calm, composed, cool RESTING expression with a soft closed mouth, quietly confident and a little aloof; keen sharp crimson eyes, calm and clear (NOT smirking, NOT a gentle sweet idol smile, NOT scary, NOT glaring); cool and handsome at ease.

[FACE] refined cool handsome bishounen, slim sharp youthful jaw, clean straight slim nose, sharp almond eyes with crisp eyelids, vivid CRIMSON eyes with bright catchlights, neat dark eyebrows; smooth fresh clear skin, warm healthy living skin tone with a soft natural blush (NOT pale, NOT grey, NOT lifeless); clean crisp anime lineart, sharp clean outlines, restrained-gloss cel shading, high detail. NO heavy shadow over the eyes, eyes fully visible and bright, no eye-bags.

[HAIR] glossy jet-black hair (no hat), bold upswept spiky pointed tufts (cool, stylish), long fringe framing the face that does NOT shadow the eyes, one single vivid CRIMSON inner-color streak in the fringe (the only red in the hair).

[OUTFIT — collar and chest show at this crop] black daoist changshan with a high closed mandarin collar, thin crimson collar trim and a glimpse of crimson inner lining at the front opening; a single crimson crow-feather mark at the chest near the collar; deep matte black dominant, crimson only as thin accents.

── AVOID ──
holding cards, items in hand, hands raised into frame;
smirk, big open grin, gentle sweet idol smile, bland ordinary face;
evil villain glare, menacing, scary, cruel sneer, dark shadow over the eyes, sunken eyes, eye-bags, gloomy;
pale lifeless skin, grey or ashen skin, sickly pallor, cold-toned skin, vampire pallor;
small child, chibi, baby face, round chubby cheeks, oversized round childlike eyes, big head;
tall adult, grown man, old, lanky;
girl, female, feminine, breasts, makeup, long girl hair, twin-tails;
clouds, butterflies, stars, dragon, large red area, neon red, pink;
hat, hood;
extreme close-up, cropped at the chest, framed too tight, zoomed-in face, off-center, looking away, full body;
mahjong tiles, kanji or readable text on clothing, garbled characters, watermark, logo, text;
glossy dewy skin, gradient-heavy rendering, blurry, soft focus, sketchy lineart, soft sleepy lines;
realistic, semi-realistic, 3d, busy background, colored background.
```

> 表情差分（happy・troubled・smile 等）はこのバストアップ neutral を基準に同一セッション t2i で派生し、`shin-portrait-<expr>-a.webp` に書き出す。同じ枠でクロップして揃える（差し替えてもズレない）。立ち絵の不敵な薄笑いを `smug`／`mischievous` 系の差分に流用してもよい。

## 使い魔（カラス）の生成プロンプト → `shin-familiar.webp`

**未制作（現状は設定のみ・UI 未登場＝[character-shin.md](./character-shin.md) §3 使い魔）。** 制作時はまお（使い魔ココ）・りん（銀猫）に倣う：**1:1 の白紙正方形（`docs/characters/familier-white-space.png`）を種**にとまり姿の全身を master 生成 → 同セッション t2i／i2i で表情・ポーズ派生。配色・画風はしん本体に寄せる：**黒一色の理知的なカラス＋緋の差し（鋭い目・足環）**。鋭い目だが*不吉に振りすぎない*（陰はあるが相棒）。

```
Use the attached blank square (1:1) image only as canvas/aspect; plain white background; draw ONE single crow, fresh crisp illustration.

[SUBJECT] single intelligent crow perched, full body, side-three-quarter view, calm alert posture, sharp clever eyes (clever, NOT ominous, NOT scary), a quiet familiar companion.

[DESIGN] glossy jet-black plumage with clean cel shading, a single vivid CRIMSON accent — crimson eyes and a thin crimson leg-ring — matching its master; sleek refined silhouette, neat feathers.

[STYLE] clean crisp anime lineart, sharp clean outlines, proper anime cel shading with hard-edged fold shadows; flat cel style with restrained gloss; cool muted palette; plain solid white background.

── AVOID ──
scary ominous horror crow, evil glowing eyes, blood, gore, menacing pose, monster, demon;
other birds, owl, multiple birds, character sheet, multiple views;
red body, large red area, neon, pink;
watermark, logo, text, busy background, colored background, realistic, 3d, blurry, sketchy lineart.
```

> カラスの含み：黒いカラスは*父の朱雀（火の鳥）の翳った写し*という裏設定（[world.md](../world.md) §5・§7）。アプリ内では出自を語らず、見た目の気配（黒＋緋の差し）に留める。
