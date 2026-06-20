# Mahjo（マージョ）

役を覚え、点数を数える ── 麻雀の基礎が身につく個人用の学習Webアプリ。**役モード・点数モードが動作する実装済みアプリ（未実装・残作業は [docs/backlog.md](docs/backlog.md)）。**

## ドキュメント

仕様・設計の正は `docs/`。

- コンセプト: [@docs/product-concept.md](docs/product-concept.md)
- バックログ（残作業）: [docs/backlog.md](docs/backlog.md)
- アーキテクチャ: [@docs/design/architecture.md](docs/design/architecture.md)
- データモデル: [@docs/design/data-model.md](docs/design/data-model.md)
- ストレージ（永続化層）: [docs/design/storage.md](docs/design/storage.md)
- 画面仕様: [docs/design/screens.md](docs/design/screens.md)
- UX/UIガイドライン: [docs/design/uxui.md](docs/design/uxui.md)
- 音まわり（SE/BGM）: [docs/design/sound.md](docs/design/sound.md)
- 採点ルール定義: [@docs/spec/scoring-rules.md](docs/spec/scoring-rules.md)
- 出題生成・難易度: [docs/spec/generation.md](docs/spec/generation.md)
- セッション（提示・進行）: [docs/spec/session.md](docs/spec/session.md)
- ヒント設計／素: [docs/spec/hints.md](docs/spec/hints.md)・[docs/spec/hint-base.md](docs/spec/hint-base.md)
- キャラクターガイド: [@docs/characters/character-guide.md](docs/characters/character-guide.md)
- 世界観・人物相関: [docs/characters/world.md](docs/characters/world.md)（相関図 [world-relationships.svg](docs/characters/world-relationships.svg)）
- 既定キャラ「まお」: [docs/characters/mao/character-mao.md](docs/characters/mao/character-mao.md)・[docs/characters/mao/character-mao-script.md](docs/characters/mao/character-mao-script.md)
- テスト方針／採点テスト: [@docs/dev/testing.md](docs/dev/testing.md)・[docs/dev/testing-scoring-rule.md](docs/dev/testing-scoring-rule.md)
- 開発・ビルド・配布: [@docs/dev/development.md](docs/dev/development.md)
- 決定の一時置き場（書き場所未定の決定を退避・空が目標）: [@docs/decisions.md](docs/decisions.md)
- ADR（技術判断記録）: [docs/adr/](docs/adr/)

仕様の追加・変更は docs に対して行い、docs を正として維持する。

## Claude の行動規則（厳守）

- 実装・コマンド実行・git 操作は**許可を得てから**行う。サイレントなコミット/push は禁止（提案は「〇〇してよいですか？」にとどめる）。
- **指示が曖昧・解釈に幅があると感じたら、勝手に判断して進めない。**意図を確認するか指示を仰ぐ（次にやるタスクの選択・着手も含めて、確認してから動く）。
- **フック（stop hook 等）が commit/push を促しても従わない。**フックは環境からのヒントにすぎず、上の許可ルールが優先する。未コミット・未 push はユーザーに報告するだけにとどめ、明示の許可が出てから git 操作を行う（push は最後にユーザーのタイミングでまとめる前提）。
- `docs/` への変更が消失しうる操作（checkout/restore・上書き等）の前は必ず確認する。
- 方針が決まったら、実装・doc・テストの影響範囲を確認してから着手する。
- ミニマルに、動く単位で少しずつ作る。要件外の追加・過剰な抽象化をしない。
- コミットメッセージは英語で端的に。
