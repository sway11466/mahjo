# まお 画像生成プロンプト集

まお（＋使い魔ココ）の画像生成プロンプトを集約（[character-mao.md](./character-mao.md) §3 から分離して肥大化を回避）。

- **識別情報（外見コンセプト・衣装の模様・モチーフ・配色・使い魔設定）の正は [character-mao.md](./character-mao.md) §3**。本ファイルは「実際に使う生成プロンプト」だけを持つ。
- 汎用の生成手順・嘘字対策・一貫性ワークフロー・**作る画像セットと順序**は [character-guide.md](../character-guide.md) §4。
- **画風はりんと統一のハウススタイル＝くっきり線＋フラットなセル塗り・ツヤ控えめ**（`clean crisp anime lineart, sharp clean outlines, smooth cel shading`）。旧ソフト画風（ツヤ/グラデ）版のプロンプトは git 履歴に残る。まお刷新＝backlog feature-11。
- 確定プロンプト（採用画像を出したもの）は構図・ポーズ・モチーフを保持し、レンダリング語のみハウススタイルへ差し替える。

## master 生成プロンプト（たたき台。固有作品名は使わずオリジナルに寄せる）

汎用の生成手順・嘘字対策・一貫性ワークフローは [character-guide.md](../character-guide.md) §4「作り方」の「AI生成（共通）」。本項は「まお」固有のプロンプトのみ。

顔の方針：**親しみやすい moe 系**（丸顔・大きくまん丸の瞳）を軸に、目元だけ少し引き締めて品を足す。クール・吊り目・大人美人寄りには振らない（汎用受け・「教わって安心する相手」を優先）。顔を毎回ブレさせないため、顔の構造語を positive の先頭側に置く。

master の方針（ガイド §4「素体で master を作る」「1体だけ出す」準拠）：このプロンプトは **master（ステップ1・t2i）専用**。**両腕を脇に下ろし・法具（御札の束）を持たせず・衣装の全体が見える正面全身の素体**を出す（御札を扇状に持つ姿・ポーズ違いは master 確定後に i2i で派生＝§4 ステップ3）。腕や法具で衣装が隠れると表情差分・ポーズ違いの参照として使いづらいため。あわせて設定シート化（複数アングル）を避けるため `consistent character design` は positive に置かず、`single full-body illustration, one girl only, single front view` を立て、negative に `character sheet / model sheet / turnaround / multiple views` 等を積む。

縦長の白紙キャンバスを種にする（ガイド §4 ステップ1）。**3:4 縦長の真っ白 PNG を1枚用意して参照添付**し、冒頭の canvas 指示文（白を背景として 1体を枠いっぱいに描く）を必ず添える。白紙の上の新規生成なので線がくっきりのまま縦長・1体が安定する。positive/negative が分かれているツールは `── AVOID ──` 以降を negative 欄へ。

```
Use the attached blank vertical (3:4) image only as canvas/aspect; plain white background; draw ONE single full-body character head-to-toe, fresh crisp illustration.

[BODY] single full-body front view, one girl only, slender tall teenage girl with a softly FEMININE figure — a modest bust and a gently defined waist, graceful feminine silhouette (tasteful, modest, fully clothed), long slim legs, standing straight and symmetric facing directly forward (no turn, no tilt), shoulders level, both arms relaxed hanging down at her sides, hands lowered and empty, full outfit unobstructed, deep-purple flat shoes matching the dress, small white margin below the feet.

[FACE] soft round oval face, large round sparkling amber-brown eyes with bright catchlights, looking at viewer, small nose, bright cheerful open smile, genki expression, light fair skin with flat even shading and only a faint blush.

[STYLE] clean crisp anime lineart, sharp clean outlines, proper anime CEL shading with clear hard-edged fold shadows and body-contour shading (volume and form); flat cel style (NOT gradient, NOT glossy, NOT dewy).

[HAIR] dark navy hair, blunt fringe, twin odango buns (no hat); a SMALL hair charm at each bun = exactly TWO small gold stars + a small wooden ofuda tag (red unreadable glyphs) fixed right at the bun base, short and compact; long loose sidelocks framing the face; plain fringe.

[OUTFIT] gentle Chinese-witch mascot; a long RICH royal-purple qipao — a medium-deep, saturated vivid purple, clearly purple (NOT navy/blackish/too dark, NOT too bright/pale/neon) — fitted to follow her gentle feminine curves, mid-calf with a high side slit, gold trim, high mandarin collar with the chest fully closed; a SEPARATE short shoulder CAPELET (a short cape ending around the mid-upper-arm / elbow — a fixed short length, NOT a long cape), open at the front (qipao fully visible underneath), with a clear gold-trimmed edge so it reads distinct from the dress, plain-purple inner lining; the qipao and cape have clear cel fold shadows following the body and the drape (volume, not a flat sticker).

[PATTERN — fixed zoned layout, fine gold dot-and-line, NO loose scattered stars]
- exactly TWO small gold crescent moons (no more, no fewer): one just beside the high side slit at about mid-thigh, one low near the hem on the opposite (closed) side of the skirt (NO crescent on the chest, no other crescents anywhere);
- small red auspicious clouds (each with a thin gold outline), FIXED positions: one on EACH shoulder of the cape (left and right), one on the LEFT chest, one on the LEFT waist, one on the RIGHT thigh, and one at EACH of the LEFT and RIGHT skirt hem corners (no clouds anywhere else);
- named gold constellations (the points are small ROUND gold dots — filled circles, NOT star-shaped — joined by fine gold lines), each fixed to its zone:
  • Cassiopeia (a sideways W/M of 5 stars) at the center belly/waist,
  • Lyra (a small constellation) at the LEFT knee / lower skirt;
  (no constellations on the cape; nothing on the right thigh)
- NO star motifs anywhere on the dress or cape — the only star-like marks are the small ROUND gold dots of the constellations (Cassiopeia, Lyra); absolutely no loose, scattered, sprinkled or sparkle stars;
- plenty of plain purple between motifs, refined and elegant;
- use ONLY the motifs listed above — do NOT add any extra constellations, crescents, clouds, stars, or any pattern / decoration not specified here; draw the named constellations as gold dot-and-line shapes ONLY — NEVER write their names or any text / letters / labels anywhere on the artwork.

solo, front-facing, plain white background.

[AVOID] extra unspecified motifs, invented pattern elements; flat shadeless single-color dress, sticker-like flat fill; flat chest, boyish/androgynous, no bust; busty, large breasts, cleavage, exposed chest, open neckline, cutout; navy/blackish/too dark, too bright/neon/pale, washed-out purple; crescent moon on the chest; loose scattered stars, standalone star motifs, sparkle / twinkle stars, any star shapes on the dress or cape, extra crescent moons (more than two), star-shaped constellation points; glossy/dewy skin, gradient or soft glowing shading; oversized crescents, red clouds without a gold outline, frumpy pattern; earrings, tassel, long cord, charm/moon on top of the buns; cape merged into the dress; three-quarter/turned/tilted/asymmetric pose, arms raised, holding objects, folding fan; mismatched shoes; chibi, big head, child, mature adult woman, realistic, 3d; cropped feet, close-up, character sheet, multiple views, duplicate; any text, letters, words, captions or constellation-name labels anywhere on the image, kanji or text on clothing, watermark, logo; blurry, soft focus, sketchy lineart
```

> **等身が低頭身に倒れるとき（重要）：** モデルは "8 heads tall" など**数値の等身指定をほぼ無視する**。等身を上げる実効レバーは順に ①`full-length fashion illustration` など全身ファッション図の語、②`teenage girl / tall / long legs` の年齢・体型語、③`cute / round / chibi` 系を減らす、④**狙った1枚を参照画像にして i2i で固定**（プロンプトより確実）。それでも幼く出るなら `cute` を削り、negative の `chibi, child` を重み付け強化する。
>
> **等身の出し分け：** 上は通常版（背の高いスタイリッシュ全身）。**デフォルメ版（SD）** も別バリエーションとして持つ。SD を狙うときは BODY ブロックを `super deformed, chibi, 2–3 heads tall, big head, small body, stubby limbs` に差し替え、negative から `chibi, super deformed, sd, big head, short body, stubby limbs, child, toddler` を外す（顔・DESIGN 側はそのまま流用）。通常版とSD版で同一の顔・配色・モチーフを保つこと。

> 顔の安定は語の調整より参照画像が効く。気に入った1枚（=master）を確定したら、以降は i2i / reference でその顔を固定し、表情差分を派生させる（[character-guide.md](../character-guide.md) §4「作り方」の一貫性ワークフロー）。プロンプトは「master を引くまで」の役割。`cute/youthful` と `refined/defined eye` は逆方向に効くので、可愛さを強めたいときは前者を増やす。

## 派生プロンプト（道具付き立ち絵／バストアップ）

master 確定後に **同一セッション t2i** で派生させた**確定プロンプト**（実際に採用画像を出したもの）。作る順序・考え方は [character-guide.md](../character-guide.md) §4「作る画像セットと順序」。

**道具付き立ち絵（御札を持つ動的ポーズ）** — スタート画面・キャラ選択の見せ場。体を斜め・脚を開く（クロスなし）・片手で御札の束を上げ・反対の手は前。

```
Use the attached blank vertical (3:4) image only as canvas/aspect; plain white background; draw ONE single full-body character head-to-toe, fresh crisp illustration.

[BODY / POSE] single full-body view, one girl only, slender tall teenage girl with a softly feminine figure (modest bust, gently defined waist, graceful silhouette, tasteful and modest), long slim legs; a LIVELY DYNAMIC pose, the movement coming from a STRONG turn and contrapposto (not from blur); a STRONG three-quarter view — the whole body clearly rotated about 45° away from the camera, one shoulder distinctly FORWARD and closer to the viewer while the other recedes; the HIPS and SHOULDERS tilted in OPPOSITE directions, a clear twist at the waist, head slightly tilted; the ENTIRE figure on ONE coherent 3/4 diagonal — face, head, shoulders, torso, hips and legs all turned the SAME ~45° way (the face glancing toward the viewer, slightly as if over one shoulder), NOT a front-facing face on a turned body; weight on the back leg, the FRONT leg extended forward and slightly out through the high side slit, kept fairly STRAIGHT with the toe pointed (an elegant extended leg, NOT bent at the knee), legs NOT crossed; she RAISES one hand with a lively flourish, holding up a fanned-out hand of flat wooden talisman cards (ofuda) near her shoulder/face, the OTHER hand resting lightly in front near her waist; deep-purple flat shoes matching the dress, both feet and shoes visible, small white margin below the feet.

[FACE] soft round oval face, her head and face turned to the SAME three-quarter angle as the body (a coherent 3/4 view), eyes glancing toward the viewer, large round sparkling amber-brown eyes with bright catchlights, small nose, bright cheerful open smile, genki expression, light fair skin with flat even shading and only a faint blush.

[STYLE] clean crisp anime lineart, sharp clean outlines, proper anime CEL shading with clear hard-edged fold shadows and body-contour shading (volume and form); flat cel style (NOT gradient, NOT glossy, NOT dewy).

[HAIR] dark navy hair, blunt fringe, twin odango buns (no hat); a SMALL hair charm at each bun = exactly TWO small gold stars + a small wooden ofuda tag (red unreadable glyphs) fixed right at the bun base, short and compact; long loose sidelocks framing the face; plain fringe.

[OUTFIT] gentle Chinese-witch mascot; a long RICH royal-purple qipao — medium-deep saturated vivid purple, clearly purple (NOT navy/blackish/too dark, NOT too bright/pale/neon) — fitted to her gentle feminine curves, mid-calf with a high side slit, gold trim, high mandarin collar with the chest fully closed; a SEPARATE short shoulder CAPELET (a short cape ending around the mid-upper-arm / elbow — a fixed short length, NOT a long cape), open at the front (qipao visible underneath), clear gold-trimmed edge (distinct from the dress, not merged), plain-purple inner lining, the capelet and the loose sidelocks sweeping to ONE side with the motion (the capelet staying short); clear cel fold shadows on the qipao and cape (volume, not a flat sticker).

[PATTERN — fixed zoned layout, fine gold dot-and-line, NO loose scattered stars]
- exactly TWO small gold crescent moons (no more, no fewer): one just beside the high side slit at about mid-thigh, one low near the hem on the opposite (closed) side of the skirt (NO crescent on the chest, no other crescents anywhere);
- small red auspicious clouds (each with a thin gold outline), FIXED positions: one on EACH shoulder of the cape (left and right), one on the LEFT chest, one on the LEFT waist, one on the RIGHT thigh, and one at EACH of the LEFT and RIGHT skirt hem corners (no clouds anywhere else);
- named gold constellations (the points are small ROUND gold dots — filled circles, NOT star-shaped — joined by fine gold lines), each fixed to its zone:
  • Cassiopeia (a sideways W/M of 5 stars) at the center belly/waist,
  • Lyra (a small constellation) at the LEFT knee / lower skirt;
  (no constellations on the cape; nothing on the right thigh)
- NO star motifs anywhere on the dress or cape — the only star-like marks are the small ROUND gold dots of the constellations (Cassiopeia, Lyra); absolutely no loose, scattered, sprinkled or sparkle stars;
- plenty of plain purple between motifs, refined and elegant;
- use ONLY the motifs listed above — do NOT add any extra constellations, crescents, clouds, stars, or any pattern / decoration not specified here; draw the named constellations as gold dot-and-line shapes ONLY — NEVER write their names or any text / letters / labels anywhere on the artwork.

solo, plain white background.

[AVOID] extra unspecified motifs, invented pattern elements; front-facing face on a turned body, weak or subtle turn, nearly frontal pose, facing the camera straight-on, mismatched face and body angle, twisted unnatural neck, stiff frontal stance, stiff static pose, T-pose, motion blur, speed lines; flat shadeless single-color dress, sticker-like flat fill; flat chest, boyish/androgynous, no bust; busty, large breasts, cleavage, exposed chest, open neckline, cutout; navy/blackish/too dark, too bright/neon/pale purple, washed-out; crescent on the chest; loose scattered stars, standalone star motifs, sparkle / twinkle stars, any star shapes on the dress or cape, extra crescent moons (more than two), star-shaped constellation points; glossy/dewy skin, gradient or soft glowing shading; oversized crescents, red clouds without gold outline, frumpy pattern; earrings, tassel, long cord, charm/moon on top of buns; cape merged into the dress; folding paper fan, real kanji or readable text on the cards; bent front knee, deeply bent leg, crouching, both legs straight and stiff; crossed legs, ankles crossed, legs pressed together; mismatched shoes; chibi, big head, child, mature adult woman, realistic, 3d; cropped feet, close-up, character sheet, multiple views, duplicate; any text, letters, words, captions or constellation-name labels anywhere on the image, kanji or text on clothing, watermark, logo; blurry, soft focus, sketchy lineart.
```

**バストアップ（お札なし・neutral）** — portrait（表情差分）のベース顔。出力を **640×768（5:6）に機械クロップ**して整形（表情差分はこれを基準に同一セッション t2i）。※文中の `attached blank 5:6 canvas` は**実際には未添付＝無効**（後でクロップするのでキャンバス不要）。構成・フレーミングは [character-rin-image-prompts.md](../rin/character-rin-image-prompts.md) のバストアップに準拠（塗りはフラットのハウススタイル）。

```
Same character as the master we just made — keep the SAME face, hairstyle, hair charms, colors, outfit, pattern and art style. Now draw a WAIST-UP PORTRAIT.

=== VERSION: NO HELD TALISMAN ("お札なし") ===
This portrait has NO talisman cards held in the hands — she is NOT holding any ofuda fan or cards (same as the plain standing master). The small star + ofuda HAIR charms at the buns stay — they are part of the character, not "held" items. Hands are relaxed and lowered, empty.

Use the attached blank vertical image (5:6) ONLY as the canvas and aspect ratio: plain solid white background, draw the character filling the frame.

── FRAMING ──
waist-up portrait, framed from the top of the head down to about the waist / navel, the whole chest and upper torso fully visible (not cropped at the chest), front-facing, centered, face clearly visible at a comfortable size, arms relaxed and lowered, hands empty, NO held talisman cards, NO ofuda fan in hand, calm neutral expression with a soft gentle closed-mouth smile (greeting base face),

── FACE / RENDERING ──
soft round oval face, soft cheeks, gentle jawline, large round sparkling amber-brown eyes with bright catchlights, looking straight at viewer, lightly raised expressive eyebrows, small nose, light fair skin with flat even shading and only a faint blush, clean crisp anime lineart, sharp clean outlines, proper anime CEL shading with clear hard-edged fold shadows and body-contour shading (volume and form), flat cel style (NOT gradient, NOT glossy, NOT dewy), high detail,

── HAIR ──
dark navy hair, blunt fringe, twin odango buns (no hat); a SMALL hair charm at each bun = exactly TWO small gold stars + a small wooden ofuda tag (red unreadable glyphs) fixed right at the bun base, short and compact; long loose sidelocks framing the face; plain fringe,

── DESIGN (collar, chest and shoulders show at this crop) ──
gentle Chinese-witch mascot; a RICH royal-purple qipao (medium-deep saturated vivid purple, clearly purple, NOT navy/blackish/too dark, NOT too bright/pale/neon) fitted to a softly feminine figure (modest bust), demure high mandarin collar with the chest fully closed (no keyhole, no cutout, no open neckline), gold trim; a SEPARATE short shoulder CAPELET (ending around the upper arm), open at the front, clear gold-trimmed edge so it reads distinct from the dress (not merged), plain-purple inner lining; clear cel fold shadows (volume, not a flat sticker); pattern at this crop = small gold-outlined red clouds on the LEFT chest, the LEFT waist, and one on EACH shoulder of the cape (left and right); plus Cassiopeia at the center belly/waist (a sideways W/M of small ROUND gold dots joined by fine gold lines, NOT star-shaped, no name/text); plenty of plain purple; use ONLY these motifs (no other pattern at this crop),

── AVOID ──
extra unspecified motifs, invented pattern elements, standalone star motifs, sparkle / twinkle stars, any star shapes on the dress or cape, star-shaped constellation points (points must be round dots); holding talisman cards, ofuda fan in hand, hands raised into frame; flat shadeless single-color dress, sticker-like flat fill; flat chest, boyish/androgynous, no bust; busty, large breasts, cleavage, exposed chest, open neckline, cutout; navy/blackish/too dark, too bright/neon/pale purple, washed-out; earrings, tassel, long cord, charm/moon on top of buns; cape merged into the dress; glossy/dewy skin, gradient or soft glowing shading; extreme close-up, cropped at the chest, zoomed-in face, off-center, looking away, full body, open big grin; chibi, big head, child, mature adult woman, realistic, 3d; any text, letters, words, captions or constellation-name labels anywhere on the image, kanji or text on clothing, watermark, logo; blurry, soft focus, sketchy lineart.
```

## バストアップ → portrait クロップ手順（まお確定枠）

汎用の考え方・基準は [character-guide.md](../character-guide.md) §4「バストアップ → portrait（640×768）」。本項は**まおで確定した具体値（枠・コマンド）**で、表情を増やすたびこれに従えば neutral と顔位置・スケールが揃う。

**確定枠（2026-06-24・happy で検証し neutral と一致）**

- 元画像：`docs/characters/mao/original/mao-portrait-<expr>-a.png`（同一/再構築セッションの t2i・白背景・944×1136 前後）。
- クロップ枠：**`-crop 609x731+168+0 +repage`** を**全表情で固定**（中身ぴったりに合わせず neutral と同じ枠＝差し替えてもズレない）。
  - 幅609・X=168 ＝ neutral master bustup の中身横幅・左端（`original/mao-master-bustup.png` の trim `609x1122+168+14` 由来）。
  - 高さ731・Y=0 ＝ 5:6 になる高さ（609 × 6/5 ≈ 731）を上端 y=0 から採る（頭を切らない）。
- **順序が肝**：① クロップ → ② 透過（Photopea・手作業）→ ③ リサイズ 640×768 → ④ WebP。⚠️ 白背景のままリサイズすると白フチ（フリンジ）が出るので**必ず透過してからリサイズ**。

**手順**

```
# ① 確認（任意）：トリムが neutral と揃うか。±1px は許容し、枠は 609x731+168+0 のまま固定する
magick original/mao-portrait-<expr>-a.png -fuzz 5% -format "trim: %@  canvas: %wx%h" info:
#   neutral 基準 = trim 609x1122+168+14 / canvas 944x1136

# ② クロップ（リサイズなし・native 609x731）
magick original/mao-portrait-<expr>-a.png -crop 609x731+168+0 +repage mao-portrait-<expr>-a-cropped.png

# ③ 透過：609x731 のまま Photopea で背景抜き（ここではリサイズしない）

# ④ 透過 PNG を 640×768 にリサイズ → WebP（配布先 src/assets へ）
magick <透過cropped>.png -resize 640x768 -background none -gravity center -extent 640x768 mao-portrait-<expr>-a.png
magick mao-portrait-<expr>-a.png -strip -define webp:method=6 -quality 90 mao-portrait-<expr>-a.webp
#   → src/assets/characters/mao/mao-portrait-<expr>-a.webp
```

**フレーミング確認**：透過前でも ④ の `-resize 640x768` をかけた確認用ファイルを neutral（`mao-portrait-neutral-a.png`）と並べ、頭頂・髪飾り（御札タグ）・肩ライン・顔スケールが揃うか見る（開口など**表情差による顔の大小はズレではない**）。

**master 差し替え時**：枠 `+168` / 幅609 は neutral master bustup 由来。master を別画像に差し替えたら ① のトリム測定からやり直す（X/W が変わる）。並べて scale を合わせる基準キャラは りん `rin-portrait-neutral-a`（character-guide §4）。

## 使い魔ココの生成プロンプト（たたき台）

ココ（使い魔）の master 生成プロンプト。**1:1 の白紙正方形を種**にする（おすわり全身が正方形に収まる＋ボタン／キャラ選択がほぼ正方形＝表示と一致）。配色・画風はまお本体に寄せる（夜紺＋琥珀の瞳、crisp lineart）。表情／ポーズ違いは master 確定後に同セッション t2i／i2i で派生（[character-guide.md](../character-guide.md) §4）。positive/negative が分かれるツールは `── AVOID ──` 以降を negative 欄へ。

```
Use the attached blank SQUARE image ONLY as the canvas and aspect ratio:
treat the white as a plain white background, and draw one single cat
filling the frame. Generate a fresh crisp illustration (do not trace the blank).

── BODY / FRAMING ──
single cute cat, one cat only, full body, front-facing sitting pose ("ousuwari"),
whole cat from ears to paws visible inside the frame, small white margin around it,
slim natural cat proportions (not chibi, not super-deformed, not chubby),
soft gentle silhouette, relaxed sitting posture, tail curled around the front paws,
── FACE / EXPRESSION ──
friendly approachable expression, big round amber-brown eyes with bright glossy catchlights,
soft gentle gaze looking at viewer, calm relaxed face with a faint gentle smile,
small cute nose, soft rounded cheeks,
── RENDERING ──
clean crisp anime lineart, sharp clean outlines, smooth cel shading,
soft clean fur (flat anime cel style, not glossy, not realistic),
── COLOR / DESIGN ──
dark navy-blue fur (deep midnight blue with a faint purple undertone,
matching the witch's hair), slightly lighter muzzle and belly, a witch's familiar cat,
wearing a slim collar with a small gold crescent-moon and star charm,
a tiny wooden talisman (ofuda) card dangling from the collar
(talisman face = decorative red glyphs, unreadable is fine),
gold accents, mystical cute mascot mood,
solo, single character, front-facing, plain solid white background, no background elements

── AVOID (negative) ──
human, girl, person, anthropomorphic cat, standing on hind legs, walking pose,
two cats, multiple animals, character sheet, model sheet, turnaround,
multiple views, multiple poses, side view, back view, duplicate,
realistic, photo, 3d, semi-realistic,
chibi blob, super deformed sd, giant head tiny body,
fat cat, chubby, overweight, bloated round body,
angry, mean, grumpy, scowling, furrowed brow, sharp slanted narrow eyes, fierce, intimidating, predatory,
half-asleep, drowsy, droopy sleepy eyes,
any text / letters / words / labels anywhere, kanji or readable text on the talisman, garbled characters, watermark, logo,
busy background, scenery, props, colored background,
blurry, soft focus, sketchy lineart
```

> master は**親しみ重視の素体**にする：大きめのまん丸な琥珀の瞳＋ふんわりした頬で“人懐っこい顔”にし、細めの目・吊り目・しかめ面は negative で抑える（細身＋鋭い目だと無関心で怖く見える）。**ココのだるさ（性格）は表情でなくポーズで出す**——master 確定後の i2i 派生で、寝そべり・伸び・頬杖・だらけ座り 等の脱力ポーズに振る（[character-guide.md](../character-guide.md) §4 ステップ3）。体型は `slim ... soft gentle silhouette` で締めつつ negative の `fat/chubby/round body`（猫は放っておくと丸く出る）。配色がまおと別猫に見えるときは `matching the witch's hair`＋`deep midnight blue` を強調。
