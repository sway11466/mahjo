# ADR-0004: BGM は自作アレンジの音源ファイル（AAC）で持ち、Senaris と制作方式をそろえる

- ステータス: Accepted（[ADR-0003](./ADR-0003-bgm-code-generation.md) を置き換える）
- 日付: 2026-10-03
- 決定者: （プロジェクトオーナー）
- 関連: [sound.md](../design/sound.md)、[architecture.md](../design/architecture.md)（§1 技術スタック・§2 レイヤ分離）、[character-guide.md](../characters/character-guide.md) §5、[ADR-0003](./ADR-0003-bgm-code-generation.md)

---

## Context（背景）

[ADR-0003](./ADR-0003-bgm-code-generation.md) は BGM を素の Web Audio API のコード生成（主旋律の度数記法＋即興音）で鳴らす方式を採り、まお・りんの曲を投入した。その後、オーナーの別プロダクト Senaris（Godot 製の SLG）で BGM の制作方式が確立した：AI 支援のたたき台を MuseScore で自作アレンジし、原本 `.mscz` から WAV を書き出し、ffmpeg でループ加工と変換をして音源ファイルとして組み込む。音量は統合ラウドネス -23 LUFS でそろえ、権利は台帳で管理する。

Mahjo の BGM もこの制作方式にそろえたい。合成音では届かなかった音の表現（ADR-0003 の負の影響）を、同じ道具・同じ手順で作る自作アレンジで埋める。ただし Mahjo は Web（PWA・完全静的）なので、Senaris の方式をそのまま持ち込めない点が2つある：

- 配布サイズ ── PWA は既定で全アセットを precache する。音源ファイルを置くとオフライン容量にそのまま乗る。
- 形式 ── Senaris の Ogg Vorbis は Safari（iPhone/Mac）で再生できない。

---

## Decision（決定）

BGM は **MuseScore で自作アレンジした音源ファイル**で持ち、ブラウザで再生する。コード生成（Web Audio 合成の二層構成）は廃止する。

- **制作** … Senaris と同じ。たたき台（AI 支援）→ MuseScore で編曲（原本 `.mscz` を必ず残す）→ WAV 書き出し → ffmpeg でループ加工（ループ長で切り、残響を先頭に折り返す）→ 変換。音量は -23 LUFS 目安。手順の正は [sound.md](../design/sound.md)「BGM の制作」。
- **形式** … **AAC（`.m4a`・96 kbps・44.1 kHz・ステレオ）**。全ブラウザ（Safari 含む）で再生でき、1曲（60〜90秒ループ）あたり 1 MB 前後に収まる。Ogg Vorbis は Safari 非対応、Opus は Safari で不確かなため採らない。
- **曲の単位** … キャラ別に1曲（現状どおり）。`Character.bgm` は音源ファイルのアセットパスを指す。未指定キャラは無音。
- **配布** … **precache に入れない**。BGM は既定オフなので、オンにしたときだけ取得し Service Worker のランタイムキャッシュに残す（Workbox の `globIgnores` ＋ `runtimeCaching`）。オフラインの初回容量に音源は乗らない。
- **再生** … `fetch → decodeAudioData → AudioBufferSourceNode(loop)`。継ぎ目なしループで、ループ加工した音源がそのまま活きる。autoplay 解禁（初回操作）・キャラ切替のクロスフェード・トグルでの停止は現行の挙動を引き継ぐ。ランタイム依存は増やさない。
- **置き場** … 原本 `.mscz` は `docs/characters/<id>/`（画像の制作ソースと同じ扱い＝ビルド非搭載）、配布 `.m4a` は `src/assets/characters/<id>/`。命名・一覧は [character-guide.md](../characters/character-guide.md) §5。

層の分担は変えない（[architecture.md](../design/architecture.md) §2）：characters はアセットパス（データ）だけを持ち、取得・デコード・再生の IO は ui（`src/ui/audio`）。engine には入れない。

---

## Consequences（結果・影響）

### 正の影響
- **音の表現が上がる** … MuseScore ＋ Muse Sounds の音源で作る自作アレンジ。合成音の限界（ADR-0003 の負の影響）が解消する。
- **Senaris と道具・手順を共有** … 制作フロー・ループ加工・ラウドネス基準・台帳の考え方が同じ。片方で得た知見がもう片方に効く。
- **権利の問いは引き続き消えている** … 全曲自作アレンジ。第三者素材を使う場合だけ台帳に記録する（SE と同じ方針）。
- **オフライン容量は増えない** … precache から外すので、キャラが増えても PWA の初回容量は変わらない。

### 負の影響・トレードオフ
- **キャラ追加に曲1本の制作が要る** … 「キャラ追加＝データ＋画像」に加えて、MuseScore での作曲・編曲（数十分〜）と加工が必要。曲が無いキャラは無音で成立させる（必須にしない）。
- **BGM オン時にネットワークが要る（初回だけ）** … precache しないので、オフラインで初めて BGM をオンにすると取得できず無音。一度鳴らせばランタイムキャッシュで次回以降はオフラインでも鳴る。既定オフの機能なので許容する。
- **制作環境が要る** … MuseScore Studio・Muse Sounds・ffmpeg（Senaris と同じセット）。
- **既存コードの撤去が要る** … Web Audio 合成の実装（`src/ui/audio` の notation/improv/synth）・`src/types/bgm.ts`・作曲ツール `tools/melody-authoring`・まお／りんの楽譜データは不要になる。撤去と再生の置き換えは [backlog.md](../backlog.md) feature-21 で追跡する（本 ADR は方針の決定。コードは別作業）。

---

## Alternatives Considered（検討した代替案）

### コード生成を続ける（ADR-0003 のまま）
- 配布サイズ・権利・依存の点では最良だが、音の表現が合成音に縛られる。Senaris で確立した自作アレンジの流れを活かせない。→ 不採用。

### Ogg Vorbis（Senaris と同一の形式）
- 制作パイプラインを最後まで共有できるが、Safari で無音になる。モダンブラウザ前提の割り切り（[architecture.md](../design/architecture.md)「対象環境」）でも、iPhone で鳴らないのは学習 BGM として実害が見えている。→ 不採用。変換の最終段だけ AAC に変える。

### Opus
- 同じ音質で AAC より小さい（80〜96 kbps で十分）が、Safari での再生可否がコンテナ・版に依存して読み切れない。→ 不採用。Safari を切る判断をする時に再検討。

### Ogg ＋ MP3 の二重同梱
- 互換性は最大だが、ファイル数と容量が2倍になり運用も増える。AAC 1本で全ブラウザを賄えるので不要。→ 不採用。

### precache に含める（通常のアセットと同じ扱い）
- 実装が最も単純だが、既定オフの機能のために 1 MB×キャラ数をオフライン初回容量に乗せることになる。→ 不採用。ランタイムキャッシュで賄う。
