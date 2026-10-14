# キャラクター音楽（BGM）：りん

> りん個別の素性・ビジュアル・セリフは [character-rin.md](./character-rin.md)。本書はりんの BGM の制作ノート（曲の狙い・調・テンポ・小節数・ループ長・ラウドネス・たたき台の出所）。方式は MuseScore で自作アレンジした音源ファイル（`rin-bgm.m4a`）＝[sound.md](../../design/sound.md)「BGM の実現方式」「BGM の制作」・[ADR-0004](../../adr/ADR-0004-bgm-audio-files.md)。

> 旧方式（コード生成・[ADR-0003](../../adr/ADR-0003-bgm-code-generation.md) Superseded）の旋律データは、新方式の曲を心機一転で作り直す判断（2026-10-13）に伴い本書から削除した。現行の曲は 2026-10-15 に作った第1版（たたき台＝MuseScore 基本音源のまま）。音色・ミックスの仕上げは MuseScore で行い、同名上書きで差し替える。

## 曲の狙い

全キャラ共通の方向性「中華風だけど華やか」（[sound.md](../../design/sound.md)「BGM の方向性」）を、りんの「エレガントだけど小悪魔」で受ける。まおの「王道・まっすぐ元気」（F長調・♩=150・一直線の駆け上がり）と並べて違和感が出ないテンポ感を保ちつつ、色を変える。

- 裏拍の鈴：和音を拍の裏でチェレスタが刻む（鈴＝りん）。キックは4つ打ち、ハイハットも裏。裏拍を取る感じを、名前の鈴の音で出す。
- エレガント：主旋律はバイオリン。ニ短調だが沈ませず、サビ7小節目で A（属和音・和声的短音階）に上がって華やかにする。
- 小悪魔の動機：同じ音を2回ずつ鳴らす「対」（りんりん／好きな役＝七対子の対）を旋律の骨にする。サビの終わりは対のまま降りて（ラ・ラ、ソ・ソ、ミ・ミ → ド♯）頭へ戻る。駆け上がりはまお（一気通貫）のフックなので使わない。
- 濃淡：イントロ・Aメロは薄く（Aメロはドラム半分のノリ・チェレスタ2音・弦なし）、Bメロで4つ打ちに切り替えて段々上げ、サビで2本目のバイオリンのハモリ（2周目はフルートも）を重ねて厚くする。

## 制作ノート

| 項目 | 値 |
|---|---|
| 原本 | `docs/characters/rin/rin-bgm.mscz`（必ず残す）。現状はたたき台 MIDI を MuseScore CLI で読み込んだだけ（基本音源） |
| たたき台の出所 | `original/rin-bgm-draft.mid`。Claude が生成スクリプト `original/rin-bgm-draft.py`（旋律・和音・伴奏型をデータで記述）から書き出し、mp3 試聴で方向を決めた（経緯は下記「作成レシピ」） |
| 構成 | イントロ4（Dm–B♭–Gm–A7）→ Aメロ8（Dm–C–B♭–A–Dm–C–B♭–A7）→ Bメロ8（B♭–C–F–Dm–B♭–C–Gm–A7）→ サビ8×2（Dm–B♭–C–Am–B♭–C–A–A7） |
| 楽器 | バイオリン（旋律）・バイオリン2（サビのハモリ）・フルート（サビ2周目の重ね）・チェレスタ（裏拍の和音）・ストリングス（和音）・ベース・ドラム |
| 調・テンポ | ニ短調・♩=132 |
| 拍子・小節数 | 4/4・36小節（イントロ4＋ループ32） |
| ループ範囲 | イントロ I＝4 × 4 × 60 ÷ 132 ≒ 7.273 秒は初回だけ。ループ L＝32 × 4 × 60 ÷ 132 ≒ 58.182 秒（Aメロ頭〜サビ末尾）。`Character.bgm` は `loopStart: 16 × 60 ÷ 132`・`loopEnd: 144 × 60 ÷ 132`（≒ 65.455）。継ぎ目はサビ末尾の A7 → Aメロ頭の Dm |
| 統合ラウドネス | -23.1 LUFS（ピーク -9.0 dBFS）。書き出し WAV は -15.4 LUFS で、`make-bgm.ps1` が -7.60 dB 補正した |
| 配布 | `src/assets/characters/rin/rin-bgm.m4a`（`Character.bgm.src`） |

## 作成レシピ

共通の流れは [sound.md](../../design/sound.md)「BGM の制作」。りんで実際に回した手順と値（作り直すときはこのまま再現できる）。コマンドはリポジトリ直下の PowerShell。`<scratch>` は一時フォルダ（WAV・mp3 はコミットしない）。

1. 方向決め：まおとの対比で「裏拍を取る感じ」、キャラは小悪魔・からかい上手・都会の貴族の娘（エレガントで繁盛している館の弟子）。ブリーフはニ短調・♩=132・同音2回の動機・鈴の音色、から始めた。
2. スケッチ（回り道の記録。同じ迷いを繰り返さないため）：
   - サビ8小節×2周を、同じ旋律でノリ違いの2案（裏打ち＝4つ打ち＋裏のピアノ／スウィング）。→「暗い、小悪魔っぽくない」。
   - G長調で明るく作り直し（ピチカート・ハープの軽い裏打ち／スウィング）。→「明るすぎ。音が多い」。
   - 「エレガントだけど小悪魔」をハバネラ（『カルメン』の型）で、リズムを鈴（チェレスタ／鈴の束）で刻む案、主旋律の楽器違い（クラリネット・オーボエ・ミュートトランペット）、テンポ違い（♩=100〜124）。→ チェレスタとクラリネットは好評だったが「のんびりして、まおの曲と並べると違和感」。
   - 最初の裏打ち案に戻し、裏拍の和音をピアノからチェレスタへ。主旋律はバイオリン（クラリネットより「エレガント」）。8小節目の16分の駆け上がりは「まおと被る」ので、対で降りる形に替えて採用。
   - 学び：テンポ感はキャラ間でそろえる（遅いと並べたときに浮く）。キャラの色は調・楽器・動機で変える。鈴（チェレスタ）を裏拍に置くと、裏拍とキャラ（鈴＝りん）が同時に立つ。
3. たたき台：採用したサビで36小節を組んだ。第1稿は「サビが弱い」との指摘で、サビにだけ2本目のバイオリンのハモリ（その時の和音の構成音から旋律の3〜4度下を選ぶ）を足して直した。

   ```
   python -I docs\characters\rin\original\rin-bgm-draft.py docs\characters\rin\original
   Start-Process -Wait -NoNewWindow "C:\Program Files\MuseScore 4\bin\MuseScore4.exe" -ArgumentList "-o <scratch>\rin-bgm.mp3 docs\characters\rin\original\rin-bgm-draft.mid"
   ```

   旋律・和音を直すときはスクリプトの `SONG`（セクションごとの和音と旋律。サビは `CHORUS_MEL`）、伴奏の密度は `accomp_bar`、サビのハモリは `build_song` を編集する。
4. 原本化：`.mid` → `.mscz`（いまは基本音源のまま。Muse Sounds・ミックスの仕上げは未）。

   ```
   Start-Process -Wait -NoNewWindow "C:\Program Files\MuseScore 4\bin\MuseScore4.exe" -ArgumentList "-o docs\characters\rin\rin-bgm.mscz docs\characters\rin\original\rin-bgm-draft.mid"
   ```

5. 書き出し：

   ```
   Start-Process -Wait -NoNewWindow "C:\Program Files\MuseScore 4\bin\MuseScore4.exe" -ArgumentList "-o <scratch>\rin-bgm.wav docs\characters\rin\rin-bgm.mscz"
   ```

6. 加工：

   ```
   .\tools\bgm\make-bgm.ps1 -In <scratch>\rin-bgm.wav -Id rin -IntroBars 4 -Bars 32 -Tempo 132
   ```

7. 配線：`src/characters/rin/index.ts` の `bgm: { src: 'characters/rin/rin-bgm.m4a', loopStart: (16 * 60) / 132, loopEnd: (144 * 60) / 132 }`。継ぎ目の確認は、1周目＋2周目（7.273秒〜）を ffmpeg で連結した mp3 で行える：

   ```
   ffmpeg -i src\assets\characters\rin\rin-bgm.m4a -i src\assets\characters\rin\rin-bgm.m4a -filter_complex "[0]atrim=0:65.455,asetpts=PTS-STARTPTS[a];[1]atrim=7.273:65.455,asetpts=PTS-STARTPTS[b];[a][b]concat=n=2:v=0:a=1[o]" -map "[o]" <scratch>\rin-loop-preview.mp3
   ```
