import type { Tile, Suit, Honor } from '../types/index.ts';

/** スートの正準順（id 昇順と一致：萬 → 筒 → 索） */
export const SUITS = ['man', 'pin', 'sou'] as const;
/** 字牌の正準順（東 南 西 北 → 白 發 中） */
export const HONORS = [
  'east',
  'south',
  'west',
  'north',
  'haku',
  'hatsu',
  'chun',
] as const;

export const RANKS_PER_SUIT = 9; // 数牌は 1–9
/** 数牌の kind 数（＝字牌 kind の開始位置）。3スート×9ランク＝27。 */
export const SUITED_KINDS = SUITS.length * RANKS_PER_SUIT; // 27
export const TILE_KINDS = SUITED_KINDS + HONORS.length; // 27 + 7 = 34
export const TILE_COPIES = 4; // 各種4枚
export const TILE_COUNT = TILE_KINDS * TILE_COPIES; // 136

/** 表示・名称用の牌ラベル（中立な漢字。色などの装飾は UI 側） */
export const SUIT_LABEL: Record<Suit, string> = {
  man: '萬',
  pin: '筒',
  sou: '索',
};
export const HONOR_LABEL: Record<Honor, string> = {
  east: '東',
  south: '南',
  west: '西',
  north: '北',
  haku: '白',
  hatsu: '發',
  chun: '中',
};

/**
 * 正準id → 牌。模様の唯一の出所（data-model §1）。
 * id を kind（0–33）と copy（0–3）に分解し、kind から suit/rank または honor を導く。
 * red は設定由来の別軸なので、ここでは常に false（赤ドラの付与は別処理）。
 */
export function tileFromId(id: number): Tile {
  if (!Number.isInteger(id) || id < 0 || id >= TILE_COUNT) {
    throw new RangeError(`tile id out of range: ${id}`);
  }
  const kind = Math.floor(id / TILE_COPIES); // 0–33
  if (isSuitedKind(kind)) {
    const suit = SUITS[Math.floor(kind / RANKS_PER_SUIT)]!; // 0,1,2
    const rank = (kind % RANKS_PER_SUIT) + 1; // 1–9
    return { id, kind: 'suited', suit, rank, red: false };
  }
  const honor = HONORS[kind - SUITED_KINDS]!;
  return { id, kind: 'honor', honor };
}

/** 136枚を正準順で生成 */
export function allTiles(): Tile[] {
  return Array.from({ length: TILE_COUNT }, (_unused, id) => tileFromId(id));
}

/**
 * 牌の種別番号（0–33）。模様の同一性（赤ドラ・コピー違いを無視した「同じ牌」）の判定に使う。
 * id は kind×4＋copy なので kind は id を 4 で割った商（→ tileFromId と整合）。
 */
export function tileKind(tile: Tile): number {
  return Math.floor(tile.id / TILE_COPIES);
}

/** 数牌の (suit, rank) → 牌種別（0–26）。kind 算術の唯一の出所（data-model §1）。 */
export function kindOfSuited(suit: Suit, rank: number): number {
  return SUITS.indexOf(suit) * RANKS_PER_SUIT + (rank - 1);
}

/** 字牌 → 牌種別（27–33）。kind 算術の唯一の出所。 */
export function kindOfHonor(honor: Honor): number {
  return SUITED_KINDS + HONORS.indexOf(honor);
}

/** その種別（0–33）が数牌か（字牌は SUITED_KINDS 以上）。 */
export function isSuitedKind(kind: number): boolean {
  return kind < SUITED_KINDS;
}

/** 数牌を組み立てる（copy は 0–3）。手牌の構築・テスト用 */
export function suited(suit: Suit, rank: number, copy = 0): Tile {
  if (rank < 1 || rank > 9) throw new RangeError(`rank out of range: ${rank}`);
  return tileFromId(kindOfSuited(suit, rank) * TILE_COPIES + copy);
}

/** 字牌を組み立てる（copy は 0–3）。手牌の構築・テスト用 */
export function honorTile(honor: Honor, copy = 0): Tile {
  return tileFromId(kindOfHonor(honor) * TILE_COPIES + copy);
}

/** 字牌か */
export function isHonor(tile: Tile): boolean {
  return tile.kind === 'honor';
}

/** 老頭牌（数牌の1/9）か */
export function isTerminal(tile: Tile): boolean {
  return tile.kind === 'suited' && (tile.rank === 1 || tile.rank === 9);
}

/** 么九牌（老頭牌＋字牌）か */
export function isYaochu(tile: Tile): boolean {
  return isHonor(tile) || isTerminal(tile);
}

/** 中張牌（数牌の2–8）か */
export function isSimple(tile: Tile): boolean {
  return tile.kind === 'suited' && tile.rank >= 2 && tile.rank <= 8;
}

/** 三元牌（白・發・中）か */
export function isDragon(tile: Tile): boolean {
  return (
    tile.kind === 'honor' &&
    (tile.honor === 'haku' || tile.honor === 'hatsu' || tile.honor === 'chun')
  );
}

/** 風牌（東南西北）か */
export function isWindTile(tile: Tile): boolean {
  return (
    tile.kind === 'honor' &&
    (tile.honor === 'east' || tile.honor === 'south' || tile.honor === 'west' || tile.honor === 'north')
  );
}

/** 牌の中立な名称（例 "7索" / "赤5筒" / "中"） */
export function tileName(tile: Tile): string {
  if (tile.kind === 'honor') return HONOR_LABEL[tile.honor];
  return `${tile.red ? '赤' : ''}${tile.rank}${SUIT_LABEL[tile.suit]}`;
}
