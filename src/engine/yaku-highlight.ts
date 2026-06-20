import type {
  Tile,
  Meld,
  Decomposition,
  Hand,
  Table,
  WinContext,
  YakuId,
  HighlightTarget,
} from '../types/index.ts';
import { isDragon, isWindTile } from './tiles.ts';
import {
  findSanshokuDoujun,
  findSanshokuDoukou,
  findIttsuu,
  findPeikou,
  concealedTriplets,
} from './yaku.ts';

/**
 * 役 → ハイライト対象（HighlightTarget）。点数モードの解説で「この役はどの牌か」を
 * クリックで光らせるために、採用解釈（Decomposition）から役ごとの対象牌・マーカーを返す。
 * data-model §10。純粋関数。
 */
export function yakuHighlights(
  id: YakuId,
  d: Decomposition,
  hand: Hand,
  table: Table,
  win: WinContext,
): HighlightTarget[] {
  // 牌集合で決まる役・特殊形は手牌全体を指す
  if (WHOLE_HAND.has(id)) return tilesOf(handTiles(d));

  const sets = d.melds.filter((m) => m.type !== 'pair');
  const pair = d.melds.find((m) => m.type === 'pair');
  const triplets = sets.filter((m) => m.type === 'kotsu' || m.type === 'kantsu');
  const shuntsu = sets.filter((m) => m.type === 'shuntsu');

  switch (id) {
    // 役牌（三元牌・場風・自風）
    case 'yakuhai-haku':
      return tilesOf(dragonMeldTiles(triplets, 'haku'));
    case 'yakuhai-hatsu':
      return tilesOf(dragonMeldTiles(triplets, 'hatsu'));
    case 'yakuhai-chun':
      return tilesOf(dragonMeldTiles(triplets, 'chun'));
    case 'yakuhai-round':
      return [...tilesOf(honorMeldTiles(triplets, table.roundWind)), { kind: 'roundWind' }];
    case 'yakuhai-seat':
      return [...tilesOf(honorMeldTiles(triplets, win.seatWind)), { kind: 'seatWind' }];

    // 三色・一気通貫（形は yaku.ts の finder を共有）
    case 'sanshoku-doujun':
      return meldTargets(findSanshokuDoujun(shuntsu));
    case 'sanshoku-doukou':
      return meldTargets(findSanshokuDoukou(triplets));
    case 'ittsuu':
      return meldTargets(findIttsuu(shuntsu));

    // 一盃口・二盃口（先頭から必要数の組の牌）
    case 'iipeikou':
      return meldTargets(findPeikou(shuntsu).slice(0, 1).flat());
    case 'ryanpeikou':
      return meldTargets(findPeikou(shuntsu).slice(0, 2).flat());

    // 刻子系
    case 'toitoi':
      return tilesOf(triplets.flatMap((m) => m.tiles));
    case 'sanankou':
      return meldTargets(concealedTriplets(triplets, hand, win, d.wait));
    case 'suuankou':
    case 'suuankou-tanki':
      return tilesOf(triplets.flatMap((m) => m.tiles));
    case 'sankantsu':
    case 'suukantsu':
      return tilesOf(triplets.filter((m) => m.type === 'kantsu').flatMap((m) => m.tiles));

    // 三元・四喜
    case 'shousangen':
      return tilesOf([
        ...triplets.filter((m) => isDragon(m.tiles[0]!)).flatMap((m) => m.tiles),
        ...(pair ? pair.tiles : []),
      ]);
    case 'daisangen':
      return tilesOf(triplets.filter((m) => isDragon(m.tiles[0]!)).flatMap((m) => m.tiles));
    case 'shousuushi':
      return tilesOf([
        ...triplets.filter((m) => isWindTile(m.tiles[0]!)).flatMap((m) => m.tiles),
        ...(pair ? pair.tiles : []),
      ]);
    case 'daisuushi':
      return tilesOf(triplets.filter((m) => isWindTile(m.tiles[0]!)).flatMap((m) => m.tiles));

    // 状況役（牌でなくマーカー／上がり牌）
    case 'menzen-tsumo':
    case 'haitei':
    case 'rinshan':
      return [{ kind: 'tsumo' }];
    case 'houtei':
    case 'chankan':
      return [{ kind: 'winningTile' }];

    // リーチ・天和等は指す牌がない
    default:
      return [];
  }
}

/** 手牌全体を指す役（牌集合・特殊形で決まるもの） */
const WHOLE_HAND = new Set<YakuId>([
  'tanyao', 'honitsu', 'chinitsu', 'honroutou', 'tsuuiisou', 'ryuuiisou', 'chinroutou',
  'chuuren', 'chuuren-junsei', 'chiitoitsu', 'kokushi', 'kokushi-13', 'chanta', 'junchan', 'pinfu',
]);

// ── 補助 ───────────────────────────────────────────────────

function handTiles(d: Decomposition): Tile[] {
  return d.specialForm ? (d.specialTiles ?? []) : d.melds.flatMap((m) => m.tiles);
}

function tilesOf(tiles: Tile[]): HighlightTarget[] {
  return tiles.map((t) => ({ kind: 'tile', tileId: t.id }));
}

/** finder の結果（成立面子。無ければ null/空）→ その牌のハイライト対象。 */
function meldTargets(melds: Meld[] | null): HighlightTarget[] {
  return tilesOf((melds ?? []).flatMap((m) => m.tiles));
}

function dragonMeldTiles(triplets: Meld[], honor: 'haku' | 'hatsu' | 'chun'): Tile[] {
  return triplets.filter((m) => m.tiles[0]!.kind === 'honor' && m.tiles[0]!.honor === honor).flatMap((m) => m.tiles);
}
function honorMeldTiles(triplets: Meld[], honor: string): Tile[] {
  return triplets.filter((m) => m.tiles[0]!.kind === 'honor' && m.tiles[0]!.honor === honor).flatMap((m) => m.tiles);
}
