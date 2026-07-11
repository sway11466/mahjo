import { tileFromId, kindOfSuited, kindOfHonor, TILE_COPIES } from '../tiles.ts';
import type {
  Tile,
  Honor,
  Hand,
  Meld,
  Table,
  WinContext,
  RuleSettings,
} from '../../types/index.ts';

/**
 * エンジンテスト共通のビルダ。kind ごとにコピー（0–3）を自動採番して一意な id を振る。
 * m/p/s は数牌、z は字牌。1ビルダ＝1手（同種5枚目で例外）。
 */
export function mk() {
  const used = new Map<number, number>();
  const grab = (kind: number): Tile => {
    const c = used.get(kind) ?? 0;
    if (c >= TILE_COPIES) throw new Error(`5th copy of kind ${kind}`);
    used.set(kind, c + 1);
    return tileFromId(kind * TILE_COPIES + c);
  };
  return {
    m: (r: number) => grab(kindOfSuited('man', r)),
    p: (r: number) => grab(kindOfSuited('pin', r)),
    s: (r: number) => grab(kindOfSuited('sou', r)),
    z: (h: Honor) => grab(kindOfHonor(h)),
  };
}

export type Mk = ReturnType<typeof mk>;

/**
 * 検証付きで Hand を組む。concealed は「あがり直前の手」（winningTile 別枠＝data-model §4）。
 * 枚数（concealed.length === 13 − 3×副露数）と id の一意性を構築時に検査し、
 * テストデータ自体の取り違え（13/15枚など）を即座に弾く。
 */
export function hand(concealed: Tile[], winningTile: Tile, calledMelds: Meld[] = []): Hand {
  const expected = 13 - 3 * calledMelds.length;
  if (concealed.length !== expected) {
    throw new Error(
      `concealed should have ${expected} tiles for ${calledMelds.length} called meld(s), got ${concealed.length}`,
    );
  }
  const ids = [
    ...concealed,
    winningTile,
    ...calledMelds.flatMap((m) => m.tiles),
  ].map((t) => t.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error('duplicate tile id in hand (a tile copy was reused)');
  }
  return { concealed, calledMelds, winningTile };
}

export function ctx(over: Partial<WinContext> = {}): WinContext {
  return {
    seatWind: 'south',
    win: 'ron',
    riichi: false,
    doubleRiichi: false,
    ippatsu: false,
    haitei: false,
    houtei: false,
    rinshan: false,
    chankan: false,
    tenho: false,
    chiho: false,
    ...over,
  };
}

export function rules(over: Partial<RuleSettings> = {}): RuleSettings {
  return {
    kuitan: true,
    atozuke: true,
    akaDoraCount: 0,
    kiriageMangan: false,
    kazoeYakuman: false,
    doubleYakuman: false,
    rareYaku: false,
    enabledYaku: {},
    ...over,
  };
}

export function tbl(over: Partial<Table> = {}): Table {
  return { roundWind: 'east', doraIndicators: [], ...over };
}
