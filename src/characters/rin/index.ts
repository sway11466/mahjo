import type { Character } from '../../types/index.ts';

/**
 * サポートキャラ「りん」（魔女・まおの自称ライバル）。定義は docs/characters/rin/character-rin.md、
 * セリフは character-rin-script.md が正。ここはそのデータ化（ロジックは持たない）。
 *
 * 画像アセットは現状 full.webp（立ち絵）＋ portrait_neutral_a.webp（neutral バストアップ）を配置済み。
 * 他の表情ポートレートは未配置で、配置されしだい同名（characters/rin/portrait_<expr>_<variant>.webp）で
 * 差し込めるよう expressions を宣言だけしておく。未配置の表情は portraitUrl が neutral ベース顔へ
 * フォールバックする（avatarAssets.portraitUrl ②・data-model §13）ので、当面は全場面で neutral が出る。
 * motif（鈴・蝶）は ui の resolver 未登録のため描画されない（未登録キーは適用なし＝data-model §10）。
 */

const PORTRAIT = (expr: string, variant = 'a') =>
  `characters/rin/portrait_${expr}_${variant}.webp`;

const PORTRAITS = (expr: string, ...variants: string[]) =>
  variants.map((v) => PORTRAIT(expr, v));

export const rin: Character = {
  id: 'rin',
  displayName: 'りん',
  avatar: 'characters/rin/avatar.webp',
  themeColor: '#7d2c5c', // 濃い赤紫（ワインマゼンタ）。character-rin.md §3（暫定・要微調整）
  accentColor: '#cfd2dc', // 銀（鈴・髪飾りに呼応）。装飾モチーフ（蝶）の色
  motif: { ritual: 'suzu', decor: 'butterfly' }, // 法具＝銀鈴・装飾＝蝶（resolver は順次・未登録の間は非表示）
  // りんが持つ（予定の）表情。実画像は未配置（full.webp のみ）。配置後は同名で有効化。
  expressions: [
    { expression: 'neutral', srcs: PORTRAITS('neutral', 'a') }, // 配置済み（ベース顔・全場面のフォールバック先）
    { expression: 'smug', srcs: PORTRAITS('smug', 'a') },
    { expression: 'mischievous', srcs: PORTRAITS('mischievous', 'a') },
    { expression: 'thinking', srcs: PORTRAITS('thinking', 'a') },
    { expression: 'insight', srcs: PORTRAITS('insight', 'a') },
    { expression: 'smile', srcs: PORTRAITS('smile', 'a') },
    { expression: 'troubled', srcs: PORTRAITS('troubled', 'a') },
    { expression: 'happy', srcs: PORTRAITS('happy', 'a') },
  ],
  // 小悪魔ゆえ既定マップから上書き（character-rin.md §1・§3）：あいさつ＝得意げ／正解＝いたずら。
  // それ以外（dealing/hinting/explaining/wrong/finished）は既定マップどおり。
  reactions: { greeting: 'smug', correct: 'mischievous' },
  persona: {
    // 文言の正は character-rin-script.md §1（必須5場面）。タメ口・小悪魔／ミス時は寄り添う。
    greeting: [
      'ふふっ、来たね。あたしの方が上手に視てあげる。',
      'まおより楽しませてあげる。覚悟しておいてね？',
      'お待ちかね。さ、鈴を鳴らそうか。',
    ],
    dealing: [
      'この手……さて、キミには何が見える？',
      '落ち着いて。あたしが見てるから大丈夫。',
      'ふぅん、なかなか面白い手だね。',
      'ひとつずつ、ね。慌てない慌てない。',
    ],
    correct: [
      'ふふっ、お見通しだったでしょ？',
      '正解。やるじゃない、見直しちゃった。',
      'そうそう、それでこそ。',
      'あたしの見込んだ通り。いい目してるね。',
      '鈴の音が聞こえた？　大当たり。',
    ],
    wrong: [
      'あー、惜しい。責めてないよ？',
      'ん、ちょっとずれたね。だいじょうぶ。',
      '惜しかった。鈴も少し笑ってる、優しくね。',
      'そこは、あたしと一緒に見直そっか。',
    ],
    finished: [
      'おつかれさま。ね、あたしと組んだ方が楽しいでしょ？',
      'ぜんぶ視てきたね。今日はよくがんばった。',
      'ここまで来たキミに、鈴ひとつ。また鳴らしにおいで。',
    ],
  },
  // 着目ポイント別ヒント文言（character-rin-script.md §2 が正）。hint-base 全41キー網羅。答えは言わない。
  script: {
    generic: [
      'まずは手牌ぜんたい、ゆっくり眺めてごらん？',
      '牌の色（種類）、揃ってきてる？',
      '同じ牌、固まってない？',
      'あがり牌のまわりも見てみて。',
      '場の状況──場風（バカゼ）・自風（ジカゼ）・ドラも、お忘れなく。',
    ],
    // 役モード
    'yaku:riichi': ['門前（メンゼン）のまま、聴牌（テンパイ）できてる？ 宣言、いけそうだよ。'],
    'yaku:double-riichi': ['宣言、ずいぶん早かったんじゃない？'],
    'yaku:ippatsu': ['宣言した、すぐあと……だったでしょ？'],
    'yaku:menzen-tsumo': ['門前（メンゼン）のまま、自分で引けたね。'],
    'yaku:pinfu': ['面子（メンツ）の形、見てごらん。やさしい並びでしょ？'],
    'yaku:tanyao': ['端の牌や字牌（ジハイ）、入ってる？'],
    'yaku:iipeikou': ['同じ並び、どこかで重なってない？'],
    'yaku:yakuhai-haku': ['白、そろってる？'],
    'yaku:yakuhai-hatsu': ['發、そろってる？'],
    'yaku:yakuhai-chun': ['中、そろってる？'],
    'yaku:yakuhai-round': ['場の風の牌、組になってる？'],
    'yaku:yakuhai-seat': ['キミの風の牌、組になってる？'],
    'yaku:sanshoku-doujun': ['同じ並び、ほかの色でも作ってない？'],
    'yaku:sanshoku-doukou': ['同じ数の組、色違いでそろってない？'],
    'yaku:ittsuu': ['ひとつの色で、数がずーっと続いてない？'],
    'yaku:chanta': ['どの組にも、端か字牌（ジハイ）が入ってる？'],
    'yaku:junchan': ['どの組にも1か9が……字牌（ジハイ）は無し、でしょ？'],
    'yaku:chiitoitsu': [
      '同じ牌のペア、いくつあるか数えてみて。',
      'ぜんぶ二枚ずつ、そろってる？',
      '面子（メンツ）は作らない形……ピンと来た？',
    ],
    'yaku:toitoi': ['順子（ジュンツ）はある？ それとも組ばっかり？'],
    'yaku:sanankou': ['自分でそろえた組、いくつある？'],
    'yaku:sankantsu': ['槓（カン）、いくつ作った？'],
    'yaku:honroutou': ['真ん中の牌（2〜8）は……無さそう？'],
    'yaku:shousangen': ['白・發・中、集まってきてる？'],
    'yaku:honitsu': [
      '牌の種類、ちょっと見てみよ。',
      '数牌（スーパイ）は何色まで使ってる？',
      '字牌（ジハイ）は混ざってても平気だよ。',
    ],
    'yaku:ryanpeikou': ['同じ並びの順子（ジュンツ）、2組ぶん見える？'],
    'yaku:chinitsu': ['牌の色、1色だけ？ 字牌（ジハイ）も無い？'],
    'yaku:haitei': ['その牌、最後のツモだった？'],
    'yaku:houtei': ['その牌、場の最後の1枚だった？'],
    'yaku:rinshan': ['槓（カン）のすぐあとに、引いた牌でしょ？'],
    'yaku:chankan': ['相手の槓（カン）に、重ねてあがった？'],
    // 点数モード（符・ドラ）
    'fu:menzen-ron': ['門前（メンゼン）のままロン……符（フ）が少し変わるよ。'],
    'fu:tsumo': ['自分で引いたね。符（フ）が少し付くよ。'],
    'fu:wait': [
      '待ちの形、思い出してみて。',
      '両面（リャンメン）と双碰（シャンポン）は符（フ）が付かないの。',
      '単騎（タンキ）・嵌張（カンチャン）・辺張（ペンチャン）だったら……？',
    ],
    'fu:pair': ['雀頭（ジャントウ）は、何の牌？'],
    'fu:meld': ['刻子（コーツ）や槓子（カンツ）に、注目してみよ。'],
    'fu:kuipinfu': ['鳴いていて、符（フ）の付かない形……になってない？'],
    'fu:chiitoi': ['この形は符（フ）を数えないの。決まった符だよ。'],
    dora: ['ドラ表示の次の牌、持ってない？'],
    'aka-dora': ['赤い5、混じってない？'],
    'ura-dora': ['リーチであがったら、裏も見てみよ。'],
  },
  // 成立役の解説文言（character-rin-script.md §3 が正）。回答後の解説で1つずつ＝役名OK。通常役＋ドラ網羅。
  explain: {
    'yaku:riichi':
      'リーチだね。門前（メンゼン）のまま聴牌（テンパイ）して宣言する――それだけで一翻。潔くていいでしょ。',
    'yaku:double-riichi':
      '最初の巡目でのリーチ、「ダブルリーチ」。早い決断、嫌いじゃないな。',
    'yaku:ippatsu':
      'リーチのすぐあと、一巡以内であがれた「一発（イッパツ）」。流れに乗ったね。',
    'yaku:menzen-tsumo':
      '門前（メンゼン）のまま自分で引いた「門前清自摸和（メンゼンツモ）」。このツモの一枚だよ。',
    'yaku:pinfu':
      '順子（ジュンツ）だけ・役のない雀頭（ジャントウ）・両面（リャンメン）待ち……符（フ）のつかない綺麗な形、「平和（ピンフ）」。素直だね。',
    'yaku:tanyao':
      '端の1・9も字牌（ジハイ）も使わない「断幺九（タンヤオ）」。2〜8だけ、すっきり。',
    'yaku:iipeikou':
      '同じ並びの順子（ジュンツ）が二組、「一盃口（イーペーコー）」。ほら、そっくりでしょ？',
    'yaku:yakuhai-haku':
      '三元牌（サンゲンパイ）の白をそろえた役牌（ヤクハイ）。白は揃えるだけで一翻、お得だよ。',
    'yaku:yakuhai-hatsu': '發をそろえた役牌（ヤクハイ）。緑のこの組だね。',
    'yaku:yakuhai-chun': '中をそろえた役牌（ヤクハイ）。赤いこの組。',
    'yaku:yakuhai-round':
      '場の風の牌をそろえた役牌（ヤクハイ）。今の場と同じ風、ね。',
    'yaku:yakuhai-seat':
      'キミの風の牌をそろえた役牌（ヤクハイ）。自分の風と同じ、ここ。',
    'yaku:sanshoku-doujun':
      '同じ並びを三つの色でそろえた「三色同順（サンショクドウジュン）」。色がそろうと気持ちいいよね。',
    'yaku:sanshoku-doukou':
      '同じ数の刻子を三色、「三色同刻（サンショクドウコー）」。なかなか珍しい形、よく作ったね。',
    'yaku:ittsuu':
      'ひとつの色で1から9までまっすぐ一本、「一気通貫（イッキツウカン）」。……まお好みの役だけど、悪くないね。',
    'yaku:chanta':
      'どの組にも端か字牌（ジハイ）が入る「混全帯幺九（チャンタ）」。全部に么九（ヤオチュー）、見える？',
    'yaku:junchan':
      '端の1・9だけで字牌（ジハイ）を使わない「純全帯幺九（ジュンチャン）」。チャンタより一段上、やるね。',
    'yaku:chiitoitsu':
      '面子（メンツ）を作らず、対子（トイツ）を七つそろえた「七対子（チートイツ）」。全部が対……あたしの鈴みたいでしょ？　好きな役なんだ。',
    'yaku:toitoi':
      '順子（ジュンツ）を使わず刻子（コーツ）だけでそろえた「対々和（トイトイ）」。組ばかりの力強い形だね。',
    'yaku:sanankou':
      '自分でそろえた暗刻（アンコー）が三つ、「三暗刻（サンアンコー）」。ロンじゃない、ここの組たち。',
    'yaku:sankantsu': '槓（カン）を三つ作った「三槓子（サンカンツ）」。槓、頑張ったね。',
    'yaku:honroutou':
      '1・9と字牌（ジハイ）だけの「混老頭（ホンロウトウ）」。真ん中の牌がひとつも無いの、気づいた？',
    'yaku:shousangen':
      '白・發・中のうち二つが刻子（コーツ）、一つが雀頭（ジャントウ）の「小三元（ショウサンゲン）」。三元牌（サンゲンパイ）、集めたね。',
    'yaku:honitsu':
      '数牌（スーパイ）を一色だけ＋字牌（ジハイ）の「混一色（ホンイツ）」。色がそろうと見ごたえあるでしょ。',
    'yaku:ryanpeikou':
      '一盃口（イーペーコー）が二組ぶん、「二盃口（リャンペーコー）」。門前（メンゼン）でしか作れない、贅沢な形だよ。',
    'yaku:chinitsu':
      '字牌（ジハイ）も混ぜず、一色だけでそろえた「清一色（チンイツ）」。お見事、認めるよ。',
    'yaku:haitei':
      '最後のツモであがる「海底摸月（ハイテイ）」。ぎりぎりの一枚、引き寄せたね。',
    'yaku:houtei':
      '場の最後の一枚でロンする「河底撈魚（ホウテイ）」。最後まで見てた成果。',
    'yaku:rinshan':
      '槓（カン）のあとの嶺上牌（リンシャンパイ）であがる「嶺上開花（リンシャンカイホー）」。粋な巡り合わせ。',
    'yaku:chankan':
      '相手の加槓（カカン）に重ねてあがる「槍槓（チャンカン）」。よく見てたね、お見事。',
    dora: 'ドラだよ。ドラ表示の次の牌が、この手にあったね。一枚ごとに一翻、お得でしょ。',
    'aka-dora': '赤ドラ。赤い5が混じってた。これも一枚で一翻。',
    'ura-dora': '裏ドラ。リーチであがったご褒美、裏も乗ったね。',
  },
  // 誤答の諭し（character-rin-script.md §4 が正）。答え（正解値）は言わず、取り違えやすい所をそっと示す。
  mistakes: {
    'dealer-swap':
      'もしかして、親と子を取り違えてない？ 自分の風が東かどうかで点数が変わるよ。',
    'dora-miss':
      'ドラ、見落としてない？ 赤い5や、リーチなら裏ドラも数えてみよ。',
    'tsumo-ron-swap':
      'ツモとロン、取り違えてない？ 符（フ）や払いが少し変わるんだ。',
    'fu-miscount':
      '符（フ）の数え、どこかで食い違ったかも。待ちや刻子（コーツ）、雀頭（ジャントウ）をていねいに見てみよ。',
    'han-miscount':
      '翻（ハン）の数え、ひとつ抜けたかもね。役をもう一度、かぞえ直してみよ。',
  },
};
