import type {
  Tile,
  Meld,
  Wind,
  Hand,
  Table,
  WinContext,
  Decomposition,
  YakuId,
  ScoreItem,
  HighlightTarget,
  HintKey,
} from '../types/index.ts';
import { isYaochu } from './tiles.ts';

/**
 * 符計算（fu）。採用した1解釈（Decomposition）＋手＋場＋和了状況から符を求める。
 * 正は [scoring-rules.md](../../docs/spec/scoring-rules.md) §2。純粋関数。
 *
 * 出力は合計符（10符切り上げ後）＋内訳（ScoreItem category:'fu'）。pinfu / chiitoitsu は
 * 符の特例があるため、成立役（pinfu は yaku、chiitoitsu は Decomposition.specialForm）で分岐する。
 */
export interface FuResult {
  fu: number; // 10符単位に切り上げ後の合計符
  items: ScoreItem[]; // 内訳（副底・待ち・雀頭・面子 等）
}

export function computeFu(
  d: Decomposition,
  hand: Hand,
  table: Table,
  win: WinContext,
  yaku: YakuId[],
): FuResult {
  const menzen = hand.calledMelds.every((m) => !m.open);

  // 七対子は25符固定（切り上げもしない）。解説では手牌全体を光らせる（7対子＝手全体）
  if (d.specialForm === 'chiitoitsu') {
    return { fu: 25, items: [fuItem('fu-chiitoi', 'fu:chiitoi', '七対子', 25, '七対子は25符固定', handTileTargets(hand))] };
  }
  // 国士など他の特殊形は役満固定点で符を使わない（防御的に0）
  if (d.specialForm) return { fu: 0, items: [] };

  // 平和：符が付かない形。ツモ20符固定／ロンは副底20＋門前ロン10＝30符
  if (yaku.includes('pinfu')) {
    const items = [fuItem('fu-base', 'fu:base', '副底', 20, '基本符（常に加算）', handTileTargets(hand))];
    if (win.win === 'ron') {
      items.push(fuItem('fu-menzen-ron', 'fu:menzen-ron', '門前ロン', 10, '門前でロン和了', [{ kind: 'menzenRon' }]));
      return { fu: 30, items };
    }
    return { fu: 20, items }; // 平和ツモはツモ符を付けない
  }

  const pair = d.melds.find((m) => m.type === 'pair')!;
  const sets = d.melds.filter((m) => m.type !== 'pair');
  const items: ScoreItem[] = [fuItem('fu-base', 'fu:base', '副底', 20, '基本符（常に加算）', handTileTargets(hand))];
  let raw = 20;

  // 門前ロン / ツモ
  if (menzen && win.win === 'ron') {
    raw += 10;
    items.push(fuItem('fu-menzen-ron', 'fu:menzen-ron', '門前ロン', 10, '門前でロン和了', [{ kind: 'menzenRon' }]));
  }
  if (win.win === 'tsumo') {
    raw += 2;
    items.push(fuItem('fu-tsumo', 'fu:tsumo', 'ツモ', 2, 'ツモ和了', [{ kind: 'tsumo' }]));
  }

  // 待ち符（単騎・嵌張・辺張＝+2、両面・双碰＝0）
  if (d.wait === 'tanki' || d.wait === 'kanchan' || d.wait === 'penchan') {
    raw += 2;
    items.push(fuItem('fu-wait', 'fu:wait', `待ち(${waitLabel(d.wait)})`, 2, '待ちの形による符', [
      { kind: 'winningTile' },
    ]));
  }

  // 雀頭（役牌＋2、連風牌＋4）
  const pf = pairFu(pair.tiles[0]!, table.roundWind, win.seatWind);
  if (pf > 0) {
    raw += pf;
    items.push(fuItem('fu-pair', 'fu:pair', '雀頭(役牌)', pf, '役牌・連風牌の雀頭', tileTargets(pair)));
  }

  // 面子符（順子0、刻子・槓子は中張/么九×明/暗）
  sets.forEach((m, i) => {
    const f = meldFu(m, hand.winningTile.id, win);
    if (f > 0) {
      raw += f;
      // id は面子ごとに一意（連番）だが、解説/ヒントのキーは全面子で共有の `fu:meld`。
      items.push(fuItem(`fu-meld-${i}`, 'fu:meld', meldFuLabel(m, hand.winningTile.id, win), f, '面子の符', tileTargets(m)));
    }
  });

  // 10符単位に切り上げ
  let fu = Math.ceil(raw / 10) * 10;

  // 喰い平和形（副露で20符ロン相当）は30符に繰り上げ
  if (!menzen && win.win === 'ron' && fu === 20) {
    fu = 30;
    items.push(fuItem('fu-kuipinfu', 'fu:kuipinfu', '喰い平和形 繰り上げ', 10, '20符ロンは30符に繰り上げ'));
  }

  // 締め：足し合わせ→10符切り上げの結果（解説ウォークスルーの最後の1ステップ）。光らせ無し。
  // ラベルは名前のみ（単位の「符」は UI のキャプションが value に付ける）。
  items.push(fuItem('fu-total', 'fu:total', '合計', fu, totalDesc(raw, fu)));

  return { fu, items };
}

// ── 部品 ───────────────────────────────────────────────────

/** 刻子/槓子の符。順子・雀頭は0。明暗は open＋（ロンで完成した刻子＝明刻）で決まる。 */
function meldFu(m: Meld, winningTileId: number, win: WinContext): number {
  if (m.type !== 'kotsu' && m.type !== 'kantsu') return 0;
  const yao = isYaochu(m.tiles[0]!);
  const open = isOpenTriplet(m, winningTileId, win);
  if (m.type === 'kantsu') return yao ? (open ? 16 : 32) : open ? 8 : 16;
  return yao ? (open ? 4 : 8) : open ? 2 : 4;
}

/** 明刻/明槓か。副露は明。暗槓(open=false)は暗。ロンで完成した刻子は明刻扱い。 */
function isOpenTriplet(m: Meld, winningTileId: number, win: WinContext): boolean {
  if (m.open) return true;
  if (m.type === 'kantsu') return false; // 暗槓（明槓は open=true で上で拾う）
  return win.win === 'ron' && m.tiles.some((t) => t.id === winningTileId);
}

/** 雀頭の符：三元牌＋2、場風＋2、自風＋2（連風牌は 2＋2＝4） */
function pairFu(t: Tile, round: Wind, seat: Wind): number {
  if (t.kind !== 'honor') return 0;
  let f = 0;
  if (t.honor === 'haku' || t.honor === 'hatsu' || t.honor === 'chun') f += 2;
  if (t.honor === round) f += 2;
  if (t.honor === seat) f += 2;
  return f;
}

function waitLabel(wait: Decomposition['wait']): string {
  return wait === 'tanki' ? '単騎' : wait === 'kanchan' ? '嵌張' : '辺張';
}

function meldFuLabel(m: Meld, winningTileId: number, win: WinContext): string {
  const kind = m.type === 'kantsu' ? '槓' : '刻';
  const openness = isOpenTriplet(m, winningTileId, win) ? '明' : '暗';
  const range = isYaochu(m.tiles[0]!) ? '么九' : '中張';
  return `${openness}${kind}(${range})`;
}

function tileTargets(m: Meld): HighlightTarget[] {
  return m.tiles.map((t) => ({ kind: 'tile', tileId: t.id }));
}

/** 手牌全体の牌ターゲット（副底・七対子の解説で手全体を光らせる）。 */
function handTileTargets(hand: Hand): HighlightTarget[] {
  return [...hand.concealed, hand.winningTile, ...hand.calledMelds.flatMap((m) => m.tiles)].map((t) => ({
    kind: 'tile',
    tileId: t.id,
  }));
}

/** 締め item の説明文。切り上げが起きたら raw→fu を、起きなければ合計だけを言う。 */
function totalDesc(raw: number, fu: number): string {
  return fu === raw ? '符の合計' : `${raw}符を10符単位に切り上げて${fu}符`;
}

function fuItem(
  id: string,
  explainKey: HintKey,
  label: string,
  value: number,
  description: string,
  highlightTargets: HighlightTarget[] = [],
): ScoreItem {
  return { id, explainKey, category: 'fu', label, value, description, highlightTargets };
}
