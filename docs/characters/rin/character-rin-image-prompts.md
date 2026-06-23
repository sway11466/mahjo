# りん 画像生成プロンプト集

りん（＋使い魔 銀猫）の画像生成プロンプトを集約（[character-rin.md](./character-rin.md) §3 から分離して肥大化を回避）。

- **識別情報（外見コンセプト・衣装の模様・モチーフ・配色・使い魔設定）の正は [character-rin.md](./character-rin.md) §3**。本ファイルは「実際に使う生成プロンプト」だけを持つ。
- 汎用の生成手順・嘘字対策・一貫性ワークフロー・**作る画像セットと順序**は [character-guide.md](../character-guide.md) §4。
- 確定プロンプト（採用画像を出したもの）は原文のまま保持する。

> **現状（2026-06-15・master 採用確定）：** 全身 master・鈴を掲げた動きの立ち絵・neutral ウエストアップ master を採用済み。残課題は 640×768 正規化＋WebP 化・表情差分の展開。

## master 生成プロンプト（たたき台。固有作品名は使わずオリジナルに寄せる）

汎用の生成手順・嘘字対策・一貫性ワークフローは [character-guide.md](../character-guide.md) §4「作り方」の「AI生成（共通）」。本項は「りん」固有のプロンプトのみ。

顔の方針：**親しみやすい moe 系の小悪魔**。丸さは残し、**目は開き気味＋眉はゆるめ**（つり目・細め・つり眉にしすぎるとアップできつく出る。実制作で確認）、**視線は正面**・口は閉じ気味の含み笑い（小悪魔スマイル）を軸にする。**八重歯は出さない**（`fang` 系の語を入れない）。半眼（`half-lidded`）は妖艶＝大人びるので使わない。きつさが出たら**眉から緩める**のが一番効く。ベース顔は穏やかにし、**小悪魔感は表情差分（insight・smug 等）で出す**。

master の方針（ガイド §4「素体で master を作る」「1体だけ出す」準拠）：このプロンプトは **master（ステップ1・t2i）専用**。**両腕を脇に下ろし・法具（銀鈴）を持たせず・衣装の全体が見える正面全身の素体**を出す（鈴を掲げる姿・ポーズ違いは master 確定後に同一セッション t2i で派生＝下記「派生プロンプト」）。設定シート化（複数アングル）を避けるため `single full-body illustration, one girl only, front view` を立て、negative に `character sheet / model sheet / turnaround / multiple views` 等を積む。

縦長の白紙キャンバスを種にする（ガイド §4 ステップ1）。**3:4 縦長の真っ白 PNG を参照添付**して冒頭の canvas 指示文を添えると縦長・1体・くっきりが安定する。比率設定が効くツールなら白紙は不要（文言だけ残しても可＝実制作では未添付でも良い絵が出た）。

```
Use the attached blank vertical image only as the canvas and aspect ratio;
treat the white as a plain white background and draw one single full-body character filling the frame head-to-toe.

positive:
── BODY / FRAMING ──
single full-body illustration, one girl only, front view, full figure head to feet,
slender tall teenage girl, long slim legs, elegant graceful proportions,
both arms hanging down at her sides, hands lowered, full qipao unobstructed,
flat round-toe mary-jane shoes in wine red-purple matching the dress, no heels,
── FACE (small-devil but softer, front gaze, no fang) ──
youthful rounded face, soft cheeks, small nose,
big crimson red eyes with a slight upturn, looking straight at the viewer,
soft gently curved eyebrows, relaxed and even (not angled, not raised),
sly teasing smirk with one mouth corner raised, lips together, smug "I see through you" look, mischievous and playful,
clean crisp anime lineart, sharp outlines, smooth cel shading,
── DESIGN (silver embroidery by zone, asymmetric layout) ──
mischievous young witch girl with a Chinese twist, app mascot,
elegant refined silver embroidery placed by zone, asymmetric off-center layout, plenty of plain fabric between motifs:
butterflies and winding vines on the long cape,
a cluster of delicate butterflies and vines off to one side of the waist (asymmetric, not centered, not mirrored left-to-right),
a single small butterfly accent at the upper chest near the collar,
a butterfly on the thigh near the slit, trailing leafy vines and butterflies on the lower skirt and hem,
demure high mandarin collar, closed bodice fully covering the chest, no keyhole, no cutout,
one-piece ankle-length fitted qipao, smooth continuous skirt, hem reaching the ankles,
deep magenta / wine red-purple with silver accents,
glossy jet-black hair, twin-tails, blunt fringe, no hat, silver bell hair charms and tassels,
long flowing open-front cape draping down past the hips, soft elegant draping fabric with butterfly and vine motifs,
solo single character, front-facing, plain solid white background, no background elements

negative:
symmetric waist pattern, mirrored embroidery at the waist, evenly centered waist motif,
angled sharp eyebrows, raised eyebrow, upturned angry eyebrows, furrowed brow,
clouds, cloud motif, auspicious clouds, swirling cloud pattern,
short capelet, tiny shoulder cape, cape ending at the shoulders,
waist sash, obi belt, separate waist band, sash around the waist, two-piece outfit, skirt waistband,
bells on the dress, hanging bells, dangling bells, three-dimensional bells, bell charms at the waist,
black or dark shoes, mismatched shoe color, high heels, platform shoes,
character sheet, model sheet, turnaround, multiple views, side view, back view, multiple poses, duplicate character,
looking away, averted gaze, profile view,
fang, snaggletooth, visible teeth,
bland sweet smile, expressionless, innocent good-girl look, dead-eyed glare, cruel angry face, heavy makeup,
plain undecorated dress, over-decorated clutter,
chibi, super deformed, big head, stubby limbs, child,
arms crossed, hands raised in front of body, holding object, arms covering the dress,
chest cutout, keyhole neckline, cleavage, exposed chest, plunging neckline,
knee-length, short skirt, bare legs,
mature adult woman, realistic, semi-realistic, 3d,
multiple characters, cropped body, close-up, busy background,
mahjong tiles, kanji or text on clothing, watermark, logo
```

> **小悪魔が“きつく”出るとき：** smirk を強めると目が死んで冷たくなりがち。`playful / mischievous / teasing` を足し、`harsh / cruel / glare / dead-eyed / angled sharp eyebrows` を negative で重み付けする（八重歯は出さない＝`fang` 系は positive に入れず negative へ）。からかいは「余裕の含み笑い」であって睨みではない（プレイヤーを咎めない＝[product-concept](../../product-concept.md) §3）。きつさが出たら**眉から緩める**（つり眉・目の細めの解除が一番効く）。

> **等身が低頭身に倒れるとき：** まおと同じレバー（[character-mao.md](../mao/character-mao.md) §3 の等身ノート参照）。①`full-length fashion illustration` 等の全身ファッション図、②`teenage / tall / long legs`、③`cute / chibi` を減らす、④狙った1枚を参照に i2i で固定。

> **まおと差がつくか毎回確認：** 髪は両方とも暗色なので**髪型・配色・表情・模様で差を立てる** ── 髪型（ツインテール ↔ お団子）、配色（赤紫＋銀 ↔ 紺＋金）、表情（小悪魔スマイル ↔ 満面の笑み）、手持ち（銀鈴 ↔ 御札）、模様（蔦・葉＋蝶〔地・自然〕 ↔ 月・星・瑞雲〔天〕）。髪色（漆黒 ↔ 夜紺）は差が小さいので頼りすぎない。セレクト画面で並べて即・別人と分かること。

> 顔の安定は語の調整より参照画像が効く。気に入った1枚（=master）を確定したら、以降は i2i / reference でその顔を固定し、表情差分を派生させる（[character-guide.md](../character-guide.md) §4「作り方」の一貫性ワークフロー）。

## 派生プロンプト（道具付き立ち絵／バストアップ）

master 確定後に **同一セッション t2i** で派生させた**確定プロンプト**（実際に採用画像を出したもの）。作る順序・考え方は [character-guide.md](../character-guide.md) §4「作る画像セットと順序」。

**道具付き立ち絵（銀鈴を掲げる動的ポーズ）** — スタート画面・キャラ選択の見せ場。体を斜め・片手で銀鈴の房を脇に上げ・反対の手は脱力。鈴はドレスから離して持ち、刺繍（蝶・蔦）を隠さない。

```
Use the attached blank vertical image only as the canvas and aspect ratio;
treat the white as a plain white background and draw one single full-body character filling the frame head-to-toe.

positive:
── BODY / POSE (single figure, dynamic, full body head to feet) ──
single full-body illustration, one girl only, slender tall teenage girl, long slim legs, elegant graceful proportions,
lively dynamic standing pose with a sense of motion, weight on one leg, hips and torso turned slightly, gentle contrapposto,
one arm raised out to the side holding up a cluster of small silver fortune bells on a cord, bells and silver tassels swaying,
the other arm relaxed, full qipao still clearly visible, bells held away from the body (not covering the dress),
twin-tails and the long cape flowing as if caught in a soft breeze,
flat round-toe mary-jane shoes in wine red-purple matching the dress, no heels,
── FACE (small-devil but softer, front gaze, no fang) ──
youthful rounded face, soft cheeks, small nose,
big crimson red eyes with a slight upturn, looking straight at the viewer,
soft gently curved eyebrows, relaxed and even (not angled, not raised),
sly teasing smirk with one mouth corner raised, lips together, smug "I see through you" look, mischievous and playful,
clean crisp anime lineart, sharp outlines, smooth cel shading,
── DESIGN (silver embroidery by zone, asymmetric layout) ──
mischievous young witch girl with a Chinese twist, app mascot,
elegant refined silver embroidery placed by zone, asymmetric off-center layout, plenty of plain fabric between motifs:
butterflies and winding vines on the long cape,
a cluster of delicate butterflies and vines off to one side of the waist (asymmetric, not centered, not mirrored left-to-right),
a single small butterfly accent at the upper chest near the collar,
a butterfly on the thigh near the slit, trailing leafy vines and butterflies on the lower skirt and hem,
demure high mandarin collar, closed bodice fully covering the chest, no keyhole, no cutout,
one-piece ankle-length fitted qipao, smooth continuous skirt, hem reaching the ankles,
deep magenta / wine red-purple with silver accents,
glossy jet-black hair, twin-tails, blunt fringe, no hat, silver bell hair charms and tassels,
long flowing open-front cape draping down past the hips, soft elegant draping fabric with butterfly and vine motifs,
solo single character, front-facing, plain solid white background, no background elements

negative:
symmetric waist pattern, mirrored embroidery at the waist, evenly centered waist motif,
angled sharp eyebrows, raised eyebrow, upturned angry eyebrows, furrowed brow,
arms crossed, both hands hidden, bells covering the dress, stiff static pose, T-pose,
extra bells embroidered on the dress, clouds, cloud motif,
short capelet, cape ending at the shoulders, waist sash, two-piece outfit,
black or dark shoes, mismatched shoe color, high heels, platform shoes,
character sheet, model sheet, multiple views, side view, back view, multiple poses, duplicate character,
looking away, averted gaze, profile view,
fang, snaggletooth, visible teeth,
bland sweet smile, expressionless, dead-eyed glare, cruel angry face, heavy makeup,
plain undecorated dress, over-decorated clutter,
chibi, super deformed, big head, stubby limbs, child,
chest cutout, keyhole neckline, cleavage, exposed chest,
knee-length, short skirt, bare legs,
mature adult woman, realistic, semi-realistic, 3d,
multiple characters, cropped body, close-up, busy background,
mahjong tiles, kanji or text on clothing, watermark, logo
```

**バストアップ（鈴なし・neutral）** — portrait（表情差分）のベース顔。出力を **640×768（5:6）に機械クロップ**して整形（表情差分はこれを基準に同一セッション t2i）。※文中の `attached blank 5:6 canvas` は**実際には未添付＝無効**（後でクロップするのでキャンバス不要）。

```
Same character as the master we just made — keep the SAME face, hairstyle, hair ornaments, colors, outfit and art style. Now draw a WAIST-UP PORTRAIT.

=== VERSION: NO HELD BELLS ("鈴なし") ===
This portrait has NO bells held in the hands — she is NOT holding any cluster of fortune bells or cord of bells (same as the plain standing master). The small silver bell HAIR charms and tassels stay — they are part of the character, not "held" items. Hands are relaxed and lowered, empty.

Use the attached blank vertical image (5:6) ONLY as the canvas and aspect ratio: plain solid white background, draw the character filling the frame.

── FRAMING ──
waist-up portrait, framed from the top of the head down to about the waist / navel, the whole chest and upper torso fully visible (not cropped at the chest), front-facing, centered, face clearly visible at a comfortable size, arms relaxed and lowered, hands empty, NO held bells, NO bells on a cord in hand, calm neutral expression with a soft gentle closed-mouth smile (greeting base face),

── FACE / RENDERING ──
youthful rounded face, soft cheeks, gentle jawline, large round sparkling heroine eyes, bright glossy catchlights, glistening lustrous eyes, crimson red eyes with a slight upturn, looking straight at viewer, soft gently curved relaxed eyebrows (even, not angled, not raised), small nose, warm healthy skin tone with soft rosy blush on the cheeks, dewy lustrous skin with soft glossy highlights, glossy shiny hair with bright highlights, lustrous glossy anime rendering, soft gradient cel shading with rich warm lighting (not flat), clean crisp anime lineart, sharp clean outlines, high detail,

── HAIR ──
glossy jet-black hair, blunt fringe, twin-tails (no hat) with a smooth clean silhouette, long flowing twin-tails framing the face on both sides, hair charms of small silver bells and tassels, no ornament on the front fringe,

── DESIGN (collar, chest and shoulders show at this crop) ──
deep magenta / wine red-purple qipao with a high mandarin collar, silver trim and silver butterfly + winding vine embroidery, rich saturated wine red-purple (deep, not pale), short flowing cape over the shoulders with silver butterfly and vine motifs, a single small silver butterfly accent at the upper chest near the collar, the cape inner lining plain solid wine red-purple,

── AVOID ──
holding bells, cluster of bells in hand, bells on a cord in hand, hands holding objects, watermark, logo, signature, text, bottom-right stamp, extreme close-up, cropped at the chest, framed too tight, zoomed-in face, off-center, looking away, full body, hands raised into frame, open big grin, angled sharp eyebrows, raised eyebrow, smug harsh sneer, fang, visible teeth, clouds, cloud motif, gold embroidery, chibi, super deformed, big head, child, mature adult woman, realistic, semi-realistic, 3d, flat dull shading, pale sickly skin, matte lifeless rendering, ahoge, flyaway frizz from the twin-tails, ornament on front fringe, busy background, scenery, colored background, mahjong tiles, kanji or text on clothing, garbled characters, blurry, soft focus, sketchy lineart, soft sleepy lines
```

> **小悪魔感はベースでは弱くてよい。** バストアップの neutral は穏やかな含み笑いが土台。小悪魔の得意げさは表情差分（`insight`＝ひらめき／得意げ、`smug` 寄りの差分）で出す（[character-guide.md](../character-guide.md) §4 ステップ3）。差分は同一セッション t2i で neutral を基準に展開。

## バストアップ → portrait クロップ手順（りん確定枠）

汎用の考え方・基準は [character-guide.md](../character-guide.md) §4「バストアップ → portrait（640×768）」。本項は**りんで確定した具体値（枠・コマンド）**。りんは **640 幅のネイティブ窓を等倍で切る**（拡大しない＝5:6 の最終寸 640×768 を直接クロップ）。

**確定枠（2026-06-24・neutral で検証）**

- 元画像：`docs/characters/rin/original/rin-portrait-<expr>-a.png`（同一/再構築セッションの t2i・白背景・944×1136 前後）。
- クロップ枠：**`-crop 640x768+155+16 +repage`** を全表情で固定。
  - 幅640・X=155 ＝中身をほぼ水平中央に置き、外側のツインテールは枠で自然にカット（中身中央 ≈ x=480 に対し 155..795）。
  - 高さ768・Y=16 ＝頭頂の少し上から。**640×768＝5:6 の最終寸そのものなのでリサイズ不要**（等倍＝線がネイティブの鮮明さのまま）。ツインテールが広く張るので窓を詰めず 640 幅で等倍に切る。
- **順序**：① クロップ（640×768・等倍）→ ② 透過（Photopea・手作業）→ ③ そのまま WebP。リサイズが無いので白フチは出にくいが、透過は ① の後に行う。

**手順**

```
# ① 確認（任意）：トリムが neutral と揃うか。枠は 640x768+155+16 のまま固定する
magick original/rin-portrait-<expr>-a.png -fuzz 8% -format "trim: %@  canvas: %wx%h\n" info:
#   neutral 基準（master-bustup）= trim 773x1093+93+43 / canvas 944x1136

# ② クロップ（640×768・等倍・リサイズなし）
magick original/rin-portrait-<expr>-a.png -crop 640x768+155+16 +repage rin-portrait-<expr>-a-cropped.png

# ③ 透過：640×768 のまま Photopea で背景抜き

# ④ そのまま WebP（配布先 src/assets へ。リサイズ不要）
magick <透過cropped>.png -strip -define webp:method=6 -quality 90 rin-portrait-<expr>-a.webp
#   → src/assets/characters/rin/rin-portrait-<expr>-a.webp
```

**フレーミング確認**：クロップ結果を既存 neutral（`docs/characters/rin/rin-portrait-neutral-a.png`）と並べ、頭頂・目元・胸元・下端が揃うか見る（表情差〔開口等〕での顔の大小はズレではない）。

**master 差し替え時**：枠 `+155+16` / 幅640 は現 master-bustup 由来。master を別画像に差し替えたら ① のトリム測定からやり直す（X/Y が変わる）。

## 使い魔（銀猫）の生成プロンプト

**未制作（現状は設定のみ・UI 未登場＝[character-rin.md](./character-rin.md) §3 使い魔）。** 制作時はまお（使い魔ココ）に倣う：**1:1 の白紙正方形を種**におすわり全身を master 生成 → 同セッション t2i／i2i で表情・ポーズ派生（[character-mao-image-prompts.md](../mao/character-mao-image-prompts.md) の「使い魔ココ」項が雛形）。配色・画風はりん本体に寄せる（**漆黒寄りの毛＋紅の瞳**＝まおのココとは別猫に。**首に銀の鈴**＝法具モチーフの銀鈴に呼応）。まおのココと**猫同士もライバル**の気配（[character-rin.md](./character-rin.md) §3 使い魔）。
