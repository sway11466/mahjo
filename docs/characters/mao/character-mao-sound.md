# キャラクター音楽（BGM）：まお

> まお個別の素性・ビジュアル・セリフは [character-mao.md](./character-mao.md)。本書はまおの BGM の制作ノート（曲の狙い・調・テンポ・小節数・ループ長・ラウドネス・たたき台の出所）。方式は MuseScore で自作アレンジした音源ファイル（`mao-bgm.m4a`）＝[sound.md](../../design/sound.md)「BGM の実現方式」「BGM の制作」・[ADR-0004](../../adr/ADR-0004-bgm-audio-files.md)。

> 旧方式（コード生成・[ADR-0003](../../adr/ADR-0003-bgm-code-generation.md) Superseded）の旋律データは、新方式の曲を心機一転で作り直す判断（2026-10-13）に伴い本書から削除した。現行の曲は 2026-10-14 に作り直した第1版（たたき台＝MuseScore 基本音源のまま）。音色・ミックスの仕上げは MuseScore で行い、同名上書きで差し替える。

## 曲の狙い

全キャラ共通の方向性「中華風だけど華やか」（[sound.md](../../design/sound.md)「BGM の方向性」）を、まおの「王道・優しいけど元気」で受ける。

- 王道の明るさ：サビは F長調の王道進行（B♭–C–Am–Dm）から Gm–C–F で着地。五音音階寄りの旋律に装飾音を添えて中華風に。
- 優しい入り：イントロ・Aメロはニ短調で薄め（ダルシマーは4分→8分、ドラムは半分のノリ）。Bメロで同音連打の動機を3段に上げて、サビで全部乗せ（ダルシマー16分・2周目はバイオリンが旋律を重ねる）。
- 好きな役のフック：サビ末尾（とイントロ末尾）に一気通貫＝ファから高いソまで9音を16分で一直線に駆け上がる。
- 駆動：♩=150、8分のオクターブベース＋3+3+2 の食い込み。

## 制作ノート

| 項目 | 値 |
|---|---|
| 原本 | `docs/characters/mao/mao-bgm.mscz`（必ず残す）。現状はたたき台 MIDI を MuseScore CLI で読み込んだだけ（基本音源） |
| たたき台の出所 | `original/mao-bgm-draft.mid`。Claude が生成スクリプト `original/mao-bgm-draft.py`（旋律・和音・伴奏型をデータで記述）から書き出し、mp3 試聴で方向を決めた（サビ2案＝F長調の王道／ニ短調のドラマチックからF長調を採用。ニ短調案は他キャラ候補として保留） |
| 構成 | イントロ4（F–C–Dm–C7）→ Aメロ8（Dm–B♭–C–F–Dm–B♭–Gm–A）→ Bメロ8（B♭–C–Am–Dm–Gm–Gm–C–C7）→ サビ8×2（B♭–C–Am–Dm–Gm–C–F–C7） |
| 楽器 | フルート（旋律）・バイオリン（サビ2周目の重ね）・ピアノ（3+3+2 の刻み）・ダルシマー（アルペジオ）・ストリングス（和音）・ベース・ドラム |
| 調・テンポ | ニ短調／F長調・♩=150 |
| 拍子・小節数 | 4/4・36小節 |
| ループ長 L | 36 × 4 × 60 ÷ 150 = 57.600 秒（`make-bgm.ps1 -Bars 36 -Tempo 150`） |
| 統合ラウドネス | -23.1 LUFS（ピーク -10.0 dBFS）。書き出し WAV は -12.8 LUFS で、`make-bgm.ps1` が -10.20 dB 補正した |
| 配布 | `src/assets/characters/mao/mao-bgm.m4a`（`Character.bgm`） |

## 作成レシピ

共通の流れは [sound.md](../../design/sound.md)「BGM の制作」。まおで実際に回した手順と値（作り直すときはこのまま再現できる）。コマンドはリポジトリ直下の PowerShell。`<scratch>` は一時フォルダ（WAV・mp3 はコミットしない）。

1. 方向決め：全体の方向性（中華風だけど華やか）を、まおの「王道・軽快・優しいけど元気」で受けると決めた（上記「曲の狙い」）。
2. スケッチ：サビ8小節×2周を2案、♩=150 で聴き比べた。A＝F長調の王道進行、B＝ニ短調でAの属和音から和声的短音階で駆け上がる。まおは王道なのでAを採用（Bも好評＝他キャラ候補）。

   ```
   python -I docs\characters\mao\original\mao-bgm-draft.py <scratch>
   ```

   `mao-sketch-A.mid`／`mao-sketch-B.mid` が出る（`song` 引数なし）。mp3 化は手順3と同じ CLI。
3. たたき台：Aをサビにして36小節を組んだ。第1稿は「最初からダルシマーが激しすぎて騒がしい」との指摘があり、ダルシマーの刻みをセクションで段階化して直した（イントロ＝4分、Aメロ＝8分、Bメロ・サビ＝16分）。

   ```
   python -I docs\characters\mao\original\mao-bgm-draft.py docs\characters\mao\original song
   Start-Process -Wait -NoNewWindow "C:\Program Files\MuseScore 4\bin\MuseScore4.exe" -ArgumentList "-o <scratch>\mao-bgm.mp3 docs\characters\mao\original\mao-bgm-draft.mid"
   ```

   旋律・和音・伴奏型を直すときはスクリプトの `SONG_MAO`（セクションごとの和音と旋律）と `accomp_bar`（セクション別の伴奏の密度）を編集する。
4. 原本化：`.mid` → `.mscz`（いまは基本音源のまま。Muse Sounds・ミックスの仕上げは未）。

   ```
   Start-Process -Wait -NoNewWindow "C:\Program Files\MuseScore 4\bin\MuseScore4.exe" -ArgumentList "-o docs\characters\mao\mao-bgm.mscz docs\characters\mao\original\mao-bgm-draft.mid"
   ```

5. 書き出し：

   ```
   Start-Process -Wait -NoNewWindow "C:\Program Files\MuseScore 4\bin\MuseScore4.exe" -ArgumentList "-o <scratch>\mao-bgm.wav docs\characters\mao\mao-bgm.mscz"
   ```

   基本音源の書き出しはピーク 0.1 dBFS（7サンプルが 0 dBFS に張り付く）で、スクリプトが入力ピークの警告を出す。聴感上は問題ないので第1版はそのまま。GUI で仕上げるときは master を少し下げて書き出す。
6. 加工：

   ```
   .\tools\bgm\make-bgm.ps1 -In <scratch>\mao-bgm.wav -Id mao -Bars 36 -Tempo 150
   ```

7. 配線：`src/characters/mao/index.ts` の `bgm: 'characters/mao/mao-bgm.m4a'`。継ぎ目の実聴は未（サビ末尾の C7 からイントロ頭の F に戻る）。
