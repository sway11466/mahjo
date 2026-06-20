import {
  tileFromId,
  allTiles,
  suited,
  honorTile,
  tileName,
  tileKind,
  isHonor,
  isTerminal,
  isYaochu,
  isSimple,
  TILE_COUNT,
  TILE_COPIES,
} from './tiles.ts';

describe('tileFromId / canonical table', () => {
  it('produces 136 tiles', () => {
    expect(allTiles()).toHaveLength(136);
  });

  it('id 0 is 1man, id 135 is chun (canonical bounds)', () => {
    expect(tileFromId(0)).toMatchObject({ kind: 'suited', suit: 'man', rank: 1 });
    expect(tileFromId(135)).toMatchObject({ kind: 'honor', honor: 'chun' });
  });

  it('keeps suit/honor boundaries in canonical order', () => {
    // man9 = ids 32..35, pin1 = 36.., sou1 = 72.., east = 108..
    expect(tileFromId(32)).toMatchObject({ suit: 'man', rank: 9 });
    expect(tileFromId(36)).toMatchObject({ suit: 'pin', rank: 1 });
    expect(tileFromId(72)).toMatchObject({ suit: 'sou', rank: 1 });
    expect(tileFromId(108)).toMatchObject({ kind: 'honor', honor: 'east' });
  });

  it('round-trips every id', () => {
    for (let id = 0; id < TILE_COUNT; id++) {
      expect(tileFromId(id).id).toBe(id);
    }
  });

  it('throws on out-of-range ids', () => {
    expect(() => tileFromId(-1)).toThrow();
    expect(() => tileFromId(136)).toThrow();
    expect(() => tileFromId(1.5)).toThrow();
  });
});

describe('builders and names', () => {
  it('builds suited and honor tiles by kind', () => {
    expect(suited('pin', 5)).toMatchObject({ kind: 'suited', suit: 'pin', rank: 5 });
    expect(honorTile('east')).toMatchObject({ kind: 'honor', honor: 'east' });
  });

  it('gives distinct ids for different copies of the same tile', () => {
    expect(honorTile('haku', 0).id).not.toBe(honorTile('haku', 1).id);
  });

  it('names tiles neutrally', () => {
    expect(tileName(suited('sou', 7))).toBe('7索');
    expect(tileName(honorTile('chun'))).toBe('中');
  });

  it('marks red dora in the name', () => {
    const red5 = { ...suited('pin', 5), red: true };
    expect(tileName(red5)).toBe('赤5筒');
  });
});

describe('tile predicates', () => {
  it('tileKind ignores copy (same kind, different copies)', () => {
    expect(tileKind(suited('pin', 5, 0))).toBe(tileKind(suited('pin', 5, 3)));
    expect(tileKind(suited('man', 1))).toBe(0);
    expect(tileKind(honorTile('chun'))).toBe(33);
    // id = kind*copies + copy
    expect(tileKind(tileFromId(2 * TILE_COPIES + 1))).toBe(2);
  });

  it('isHonor only for honor tiles', () => {
    expect(isHonor(honorTile('east'))).toBe(true);
    expect(isHonor(suited('man', 9))).toBe(false);
  });

  it('isTerminal only for suited 1/9', () => {
    expect(isTerminal(suited('man', 1))).toBe(true);
    expect(isTerminal(suited('sou', 9))).toBe(true);
    expect(isTerminal(suited('pin', 5))).toBe(false);
    expect(isTerminal(honorTile('haku'))).toBe(false); // 字牌は terminal ではない
  });

  it('isYaochu for terminals and honors, not simples', () => {
    expect(isYaochu(suited('man', 1))).toBe(true);
    expect(isYaochu(honorTile('north'))).toBe(true);
    expect(isYaochu(suited('pin', 4))).toBe(false);
  });

  it('isSimple only for suited 2–8', () => {
    expect(isSimple(suited('sou', 2))).toBe(true);
    expect(isSimple(suited('sou', 8))).toBe(true);
    expect(isSimple(suited('sou', 1))).toBe(false);
    expect(isSimple(suited('sou', 9))).toBe(false);
    expect(isSimple(honorTile('hatsu'))).toBe(false);
  });

  it('terminal/simple/honor partition every tile exactly once', () => {
    for (const t of allTiles()) {
      const flags = [isSimple(t), isTerminal(t), isHonor(t)].filter(Boolean);
      expect(flags).toHaveLength(1); // ちょうど1つに分類される
      expect(isYaochu(t)).toBe(isTerminal(t) || isHonor(t));
    }
  });
});
