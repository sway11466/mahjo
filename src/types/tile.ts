/** 数牌のスート（萬子 / 筒子 / 索子） */
export type Suit = 'man' | 'pin' | 'sou';

/** 字牌（東 南 西 北 / 白 發 中） */
export type Honor =
  | 'east'
  | 'south'
  | 'west'
  | 'north'
  | 'haku'
  | 'hatsu'
  | 'chun';

/**
 * 牌（物理1枚）。kind による判別共用体。
 * id は現実の雀牌セット（34種×4＝136枚）の正準順の通し番号で、物理牌の識別・並び順・
 * ハイライト参照を兼ねる。模様（suit/rank/honor）は id から決まる（→ engine/tiles の tileFromId が唯一の出所）。
 * red（赤ドラ）は設定から決まる別軸。
 */
export type Tile = { id: number } & (
  | { kind: 'suited'; suit: Suit; rank: number; red: boolean }
  | { kind: 'honor'; honor: Honor }
);
