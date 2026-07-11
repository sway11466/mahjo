import type { YakuId } from './yaku.ts';

/**
 * ルール設定（採点・生成・出題に効く）。選択肢・既定値の正は scoring-rules.md §5。
 * すべて即時反映・localStorage 保存。一部（atozuke/enabledYaku）は採点でなく
 * 生成・出題範囲に効く。
 */
export interface RuleSettings {
  kuitan: boolean; // 喰いタン
  atozuke: boolean; // 後付け（片和了）
  akaDoraCount: number; // 赤ドラ枚数（生成時の上限）
  kiriageMangan: boolean; // 切り上げ満貫
  kazoeYakuman: boolean; // 数え役満（13翻以上）
  doubleYakuman: boolean; // ダブル役満・役満複合
  rareYaku: boolean; // レア役（流し満貫・人和 等）
  enabledYaku: Partial<Record<YakuId, boolean>>; // 出題する役の範囲（未指定はオン扱い）
}

/**
 * アプリ/UX 設定。RuleSettings と違い採点に影響しない（engine には渡さない）。
 * 即時反映・localStorage 保存。
 */
export interface AppSettings {
  selectedCharacterId: string; // 選択中サポートキャラ（characters レジストリの id）。既定 'mao'
  playerName: string; // プレイヤーの呼び方（Persona のセリフに差し込む）。既定 ''＝呼びかけなし
  se: boolean; // 効果音の有無。既定 true
  bgm: boolean; // BGM（音楽）の有無。既定 false（学習中ずっと鳴るため）
  randomTileOrder: boolean; // 牌のランダム並び表示。既定 false
}
