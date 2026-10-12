# キャラクター音楽（BGM）：まお

> まお個別の素性・ビジュアル・セリフは [character-mao.md](./character-mao.md)。本書はまおの BGM の制作ノート（曲の狙い・調・テンポ・小節数・ループ長・ラウドネス・たたき台の出所）。方式は MuseScore で自作アレンジした音源ファイル（`mao-bgm.m4a`）＝[sound.md](../../design/sound.md)「BGM の実現方式」「BGM の制作」・[ADR-0004](../../adr/ADR-0004-bgm-audio-files.md)。

> 旧方式（コード生成・[ADR-0003](../../adr/ADR-0003-bgm-code-generation.md) Superseded）の旋律データは、新方式の曲を心機一転で作り直す判断（2026-10-13）に伴い本書から削除した。曲はまだ無い（BGM は無音）。制作は [backlog](../../backlog.md) feature-21 (6)。

## 曲の狙い

**TBD**（作り直し中）。旧方式のときの方向性は「優しいけど元気。前半は落ち着いた素直な歌、中盤で一気に駆け上がり、後半でまた落ち着く。駆け上がりに好きな役＝一気通貫のまっすぐ上るフックを織り込む。明るい調・歯切れよい撥弦」だったが、旧旋律ごと見直す。ブリーフ（テンポ・拍の感じ・調・形式・動機・楽器）を決めてからここに書く。

## 制作ノート

曲ができたら埋める：

| 項目 | 値 |
|---|---|
| 原本 | `docs/characters/mao/mao-bgm.mscz`（必ず残す） |
| たたき台の出所 | （AI 支援の `.musicxml`/`.mid` を `original/` に置く場合はその名前と出所） |
| 調・テンポ | |
| 拍子・小節数 | |
| ループ長 L | 小節数 × 拍数 × 60 ÷ テンポ（`tools/bgm/make-bgm.ps1` の `-Bars`/`-Tempo`） |
| 統合ラウドネス | 目安 -23 LUFS（スクリプトの報告値） |
| 配布 | `src/assets/characters/mao/mao-bgm.m4a`（`Character.bgm`） |
