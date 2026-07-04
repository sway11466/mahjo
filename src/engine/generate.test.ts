import {
  generate,
  generateForSeed,
  seedIds,
  seedPool,
  unlockedBands,
  BAND_THRESHOLD,
  type GeneratedQuestion,
} from './generate.ts';
import { parse } from './parse.ts';
import { detectYaku } from './yaku.ts';
import { summarize, riichiActive } from './score.ts';
import { getYaku } from './yaku-table.ts';
import { mulberry32, pick } from './rng.ts';
import { tileKind } from './tiles.ts';
import { rules } from './__tests__/hands.ts';
import type { Tile, YakuId, Progress } from '../types/index.ts';

function progress(over: Partial<Progress> = {}): Progress {
  return { correctTotal: 0, correctByMode: {}, ...over };
}

function allTiles(q: GeneratedQuestion): Tile[] {
  return [
    ...q.hand.concealed,
    q.hand.winningTile,
    ...q.hand.calledMelds.flatMap((m) => m.tiles),
  ];
}

/** 全分解にわたって検出される役の和集合 */
function detectedUnion(q: GeneratedQuestion): Set<YakuId> {
  const s = new Set<YakuId>();
  for (const d of parse(q.hand)) {
    for (const id of detectYaku(d, q.hand, q.table, q.winContext, rules())) s.add(id);
  }
  return s;
}

const MENZEN_ONLY: YakuId[] = ['pinfu', 'iipeikou', 'ryanpeikou', 'chiitoitsu'];

describe('generate — シードごとの合法性と役の成立', () => {
  it.each(seedIds())('「%s」を含む合法な和了形を生成する（多数回）', (seed) => {
    for (let s = 0; s < 30; s++) {
      const q = generateForSeed(seed, mulberry32(s * 131 + 7), rules());

      // 牌が一意・各種別4枚以内・合計14枚（＋カン1つにつき1枚）
      const tiles = allTiles(q);
      const kanCount = q.hand.calledMelds.filter((m) => m.type === 'kantsu').length;
      expect(tiles).toHaveLength(14 + kanCount);
      expect(new Set(tiles.map((t) => t.id)).size).toBe(14 + kanCount);
      const counts = new Map<number, number>();
      for (const t of tiles) counts.set(tileKind(t), (counts.get(tileKind(t)) ?? 0) + 1);
      for (const c of counts.values()) expect(c).toBeLessThanOrEqual(4);

      // 和了形として分解でき、シード役が実際に成立している
      expect(parse(q.hand).length).toBeGreaterThan(0);
      expect(detectedUnion(q)).toContain(seed);

      // 門前限定役は門前で構築されている
      if (MENZEN_ONLY.includes(seed)) {
        expect(q.hand.calledMelds.every((m) => !m.open)).toBe(true);
      }
    }
  });
});

describe('generate — 決定性', () => {
  it('同じ seed・進捗・ルールなら同じ問題を返す', () => {
    const a = generate(progress(), 'yaku', mulberry32(2024), rules());
    const b = generate(progress(), 'yaku', mulberry32(2024), rules());
    expect(a).toEqual(b);
  });
});

describe('generate — 難易度のアンロック', () => {
  it('正答0は易のみ、しきい値で中・難が解放される', () => {
    expect(unlockedBands(progress(), 'yaku')).toEqual(['easy']);
    expect(
      unlockedBands(progress({ correctByMode: { yaku: BAND_THRESHOLD.medium } }), 'yaku'),
    ).toEqual(['easy', 'medium']);
    expect(
      unlockedBands(progress({ correctByMode: { yaku: BAND_THRESHOLD.hard } }), 'yaku'),
    ).toEqual(['easy', 'medium', 'hard']);
  });

  it('アンロックはモード別（点数モードの進捗は役モードに効かない）', () => {
    const p = progress({ correctByMode: { score: BAND_THRESHOLD.hard } });
    expect(unlockedBands(p, 'yaku')).toEqual(['easy']);
    expect(unlockedBands(p, 'score')).toEqual(['easy', 'medium', 'hard']);
  });
});

describe('generate — 出題プール', () => {
  it('易帯のプールに中・難の役は入らない', () => {
    const pool = seedPool(rules(), ['easy']);
    expect(pool).toContain('tanyao');
    expect(pool).not.toContain('honitsu'); // medium
    expect(pool).not.toContain('pinfu'); // hard
  });

  it('enabledYaku でオフにした役はプールから除外される', () => {
    const pool = seedPool(rules({ enabledYaku: { tanyao: false } }), ['easy', 'medium', 'hard']);
    expect(pool).not.toContain('tanyao');
    expect(pool).toContain('chiitoitsu');
  });

  it('解放帯が広がるとプールは増える方向にのみ変わる', () => {
    const easy = new Set(seedPool(rules(), ['easy']));
    const all = new Set(seedPool(rules(), ['easy', 'medium', 'hard']));
    for (const id of easy) expect(all.has(id)).toBe(true);
    expect(all.size).toBeGreaterThan(easy.size);
  });
});

describe('generate — 場風（セッション連携）', () => {
  const WINDS = ['east', 'south', 'west', 'north'] as const;

  it.each(WINDS)('場風 %s を渡すと table.roundWind に反映される', (w) => {
    // round 設定では出ない west/north も、引数で渡せば反映される
    const q = generateForSeed('tanyao', mulberry32(20), rules(), w);
    expect(q.table.roundWind).toBe(w);
  });

  it.each(WINDS)('yakuhai-round は渡された場風牌の刻子で構築する（%s）', (w) => {
    const q = generateForSeed('yakuhai-round', mulberry32(31), rules(), w);
    expect(q.table.roundWind).toBe(w);
    expect(q.winContext.seatWind).not.toBe(w); // 連風回避＝自風は場風と別
    expect(detectedUnion(q)).toContain('yakuhai-round');
  });

  it('場風を省略すると RuleSettings.round に従う（east-fixed→east）', () => {
    for (let s = 0; s < 10; s++) {
      const q = generateForSeed('tanyao', mulberry32(s + 1), rules({ round: 'east-fixed' }));
      expect(q.table.roundWind).toBe('east');
    }
  });

  it('場風を省略・random のときは east か south（西北は出ない）', () => {
    const seen = new Set<string>();
    for (let s = 0; s < 40; s++) {
      seen.add(generateForSeed('tanyao', mulberry32(s * 7 + 3), rules({ round: 'random' })).table.roundWind);
    }
    expect([...seen].every((w) => w === 'east' || w === 'south')).toBe(true);
  });

  it('generate（高レベル入口）も場風を素通しする', () => {
    const q = generate(progress(), 'yaku', mulberry32(55), rules(), 'north');
    expect(q.table.roundWind).toBe('north');
  });
});

describe('generate — 生成後ガード（難易度の暴れ抑制）', () => {
  // 易帯を超える「形役」。これらか役満が出たら解放帯(easy)超過とみなす（realizedRank と同基準）
  const OVER_EASY: YakuId[] = [
    'pinfu', 'sanankou', 'iipeikou', 'sanshoku-doujun', 'ittsuu', 'honitsu', 'chinitsu', 'ryanpeikou',
  ];
  function exceedsEasy(q: GeneratedQuestion): boolean {
    for (const d of parse(q.hand)) {
      for (const id of detectYaku(d, q.hand, q.table, q.winContext, rules())) {
        if (getYaku(id)?.yakuman) return true;
        if (OVER_EASY.includes(id)) return true;
      }
    }
    return false;
  }

  it('易のみ解放では、ガード（1回振り直し）で中・難の複合が明確に減る', () => {
    const easyPool = seedPool(rules(), ['easy']);
    const N = 1200;
    let raw = 0;
    let guarded = 0;
    for (let i = 0; i < N; i++) {
      const seed = pick(mulberry32(i * 9 + 1), easyPool);
      if (exceedsEasy(generateForSeed(seed, mulberry32(i * 9 + 2), rules()))) raw++; // ガードなし
      if (exceedsEasy(generate(progress(), 'yaku', mulberry32(i * 9 + 3), rules()))) guarded++; // ガードあり
    }
    expect(guarded).toBeLessThan(raw); // 1回の振り直しで減る
    expect(guarded / N).toBeLessThan(raw / N); // （意図の明示）
  });

  it('ガード後も手は常に合法（14＋カン数枚・分解可能）', () => {
    for (let i = 0; i < 60; i++) {
      const q = generate(progress(), 'yaku', mulberry32(i * 3 + 1), rules());
      const kc = q.hand.calledMelds.filter((m) => m.type === 'kantsu').length;
      expect(allTiles(q)).toHaveLength(14 + kc);
      expect(parse(q.hand).length).toBeGreaterThan(0);
    }
  });
});

describe('generate — 生成後ガード（役満は通さない）', () => {
  // bug-3 回帰：清一色シードは高点法で四暗刻（例 234 234 234+666+88 → 222 333 444 666 の4刻子）
  // に再解釈されうる（generateForSeed 単体で約0.8%）。役満が通ると summarize が han:0 を返し
  // 翻あての正解が「0翻」に壊れる。易のみ解放＋清一色（中帯）は帯超えの振り直しを必ず消費する
  // ため、「振り直しは1回だけ・2回目は未検査」だった旧ガードではここで役満がすり抜けた。
  it('清一色プールで大量生成しても役満は1問も出ない', () => {
    const only = (id: YakuId): Partial<Record<YakuId, boolean>> =>
      Object.fromEntries(seedIds().filter((x) => x !== id).map((x) => [x, false]));
    const r = rules({ enabledYaku: only('chinitsu') });
    for (let i = 0; i < 1000; i++) {
      const q = generate(progress(), 'yaku', mulberry32(i * 23 + 1), r); // 易のみ解放（フォールバックで清一色）
      expect(summarize(q.hand, q.table, q.winContext, r).yakuman).toBe(false);
    }
  });
});

describe('generate — 和了状況の付与（副露・リーチ・ドラ）', () => {
  function handIds(q: GeneratedQuestion): number[] {
    return allTiles(q).map((t) => t.id);
  }

  const kanCount = (q: GeneratedQuestion): number =>
    q.hand.calledMelds.filter((m) => m.type === 'kantsu').length;

  it('ドラ表示牌は基本1枚＋カン1つにつき1枚、手牌と id が衝突しない', () => {
    for (let i = 0; i < 100; i++) {
      const q = generate(progress({ correctByMode: { yaku: 30 } }), 'yaku', mulberry32(i * 7 + 1), rules());
      expect(q.table.doraIndicators).toHaveLength(1 + kanCount(q));
      for (const ind of q.table.doraIndicators) expect(handIds(q)).not.toContain(ind.id);
    }
  });

  it('裏ドラ表示牌はリーチ時のみ、ドラと同数（カンドラぶん）', () => {
    for (let i = 0; i < 200; i++) {
      const q = generate(progress(), 'yaku', mulberry32(i * 11 + 5), rules());
      if (riichiActive(q.winContext)) {
        expect(q.table.uraDoraIndicators).toHaveLength(1 + kanCount(q));
      } else {
        expect(q.table.uraDoraIndicators).toBeUndefined();
      }
    }
  });

  it('副露した手はリーチにならない（門前必須の依存）', () => {
    for (let i = 0; i < 400; i++) {
      const q = generate(progress({ correctByMode: { yaku: 30 } }), 'yaku', mulberry32(i * 13 + 2), rules());
      const open = q.hand.calledMelds.some((m) => m.open); // 明い面子（暗槓は門前なので除く）
      if (open) expect(riichiActive(q.winContext)).toBe(false);
    }
  });

  it('門前限定・形が崩れるシードは副露しない（暗槓は可＝門前維持）', () => {
    for (const seed of ['pinfu', 'iipeikou', 'ryanpeikou', 'chiitoitsu', 'sanankou'] as const) {
      for (let i = 0; i < 30; i++) {
        const q = generateForSeed(seed, mulberry32(i * 17 + 3), rules());
        expect(q.hand.calledMelds.every((m) => !m.open)).toBe(true); // 明い面子は無い（暗槓はOK）
      }
    }
  });

  it('副露可能シードは副露版が出る（喰い下がりが出題に現れる）', () => {
    let open = 0;
    for (let i = 0; i < 60; i++) {
      if (generateForSeed('honitsu', mulberry32(i * 3 + 1), rules()).hand.calledMelds.length > 0) open++;
    }
    expect(open).toBeGreaterThan(0);
  });

  it('リーチ・一発が確率で出る（一発はリーチより十分まれ）', () => {
    let riichi = 0;
    let ippatsu = 0;
    let open = 0;
    const N = 2000;
    for (let i = 0; i < N; i++) {
      const q = generate(progress({ correctByMode: { yaku: 30 } }), 'yaku', mulberry32(i * 19 + 7), rules());
      if (q.winContext.riichi) riichi++;
      if (q.winContext.ippatsu) ippatsu++;
      if (q.hand.calledMelds.length > 0) open++;
    }
    expect(riichi).toBeGreaterThan(0);
    expect(open).toBeGreaterThan(0);
    expect(ippatsu).toBeLessThan(riichi); // 一発はリーチの一部（5%）
  });

  it('ダブルリーチが確率で出る（riichi と排他・門前のみ。feature-8）', () => {
    let double = 0;
    let riichi = 0;
    for (let i = 0; i < 2000; i++) {
      const q = generate(progress({ correctByMode: { yaku: 30 } }), 'yaku', mulberry32(i * 19 + 7), rules());
      if (q.winContext.riichi) riichi++;
      if (q.winContext.doubleRiichi) {
        double++;
        // 排他表現：doubleRiichi 成立時 riichi は立てない（scoring-rules §1.1）
        expect(q.winContext.riichi).toBe(false);
        // 門前のみ（明い面子があればリーチ系は付かない）
        expect(q.hand.calledMelds.some((m) => m.open)).toBe(false);
        // エンジンの検出が double-riichi を返す（riichi でなく）
        const ids = detectedUnion(q);
        expect(ids).toContain('double-riichi');
        expect(ids).not.toContain('riichi');
      }
    }
    expect(double).toBeGreaterThan(0);
    expect(double).toBeLessThan(riichi); // ダブルリーチはリーチより十分まれ（10%）
  });
});

describe('generate — 和了状況の整合（不可能な組み合わせを作らない）', () => {
  // bug-6 回帰：嶺上開花＝直前に槓を宣言しているので一発は必ず消える。リーチ＋一発の付与と
  // 槓＋嶺上の付与が独立に転がると ippatsu && rinshan（物理的に不可能）が約0.04%で出ていた。
  // 暗刻ベースの sanankou シードは槓を引きやすい＝この組み合わせが最も出やすい入力。
  it('一発と嶺上開花は同時に立たない（多数回）', () => {
    for (let i = 0; i < 20000; i++) {
      const q = generateForSeed('sanankou', mulberry32(i * 31 + 11), rules());
      expect(q.winContext.ippatsu && q.winContext.rinshan).toBe(false);
    }
  });
});

describe('generate — 追加の形役シード（純チャン・三色同刻・小三元・混老頭）', () => {
  // シード役の成立・合法性は先頭の it.each(seedIds()) が自動で拾う。ここは各構築器の
  // 「役満・上位役へ倒れない設計」の狙いを固定する（コメントは構築器側）。

  it('junchan：字牌を含まない（純全帯幺九の条件）・役満（清老頭）に倒れない', () => {
    for (let i = 0; i < 60; i++) {
      const q = generateForSeed('junchan', mulberry32(i * 7 + 1), rules());
      expect(allTiles(q).every((t) => t.kind === 'suited')).toBe(true);
      expect(summarize(q.hand, q.table, q.winContext, rules()).yakuman).toBe(false);
    }
  });

  it('honroutou：么九牌のみ・字牌と老頭牌が必ず混在（清老頭/字一色に倒れない）', () => {
    for (let i = 0; i < 60; i++) {
      const q = generateForSeed('honroutou', mulberry32(i * 11 + 3), rules());
      const ts = allTiles(q);
      expect(ts.every((t) => t.kind === 'honor' || t.rank === 1 || t.rank === 9)).toBe(true);
      expect(ts.some((t) => t.kind === 'honor')).toBe(true);
      expect(ts.some((t) => t.kind === 'suited')).toBe(true);
      expect(summarize(q.hand, q.table, q.winContext, rules()).yakuman).toBe(false);
      expect(detectedUnion(q)).toContain('toitoi'); // 対々和と必ず複合（scoring-rules §1.1）
    }
  });

  it('shousangen：役牌2種とちょうど複合する（大三元には倒れない）', () => {
    const dragons: YakuId[] = ['yakuhai-haku', 'yakuhai-hatsu', 'yakuhai-chun'];
    for (let i = 0; i < 60; i++) {
      const q = generateForSeed('shousangen', mulberry32(i * 13 + 5), rules());
      const ids = detectedUnion(q);
      expect(ids).toContain('shousangen');
      expect(dragons.filter((d) => ids.has(d))).toHaveLength(2);
      expect(summarize(q.hand, q.table, q.winContext, rules()).yakuman).toBe(false);
    }
  });

  it('sanshoku-doukou：刻子1組を副露して三暗刻の常伴を避ける', () => {
    for (let i = 0; i < 60; i++) {
      const q = generateForSeed('sanshoku-doukou', mulberry32(i * 17 + 7), rules());
      expect(q.hand.calledMelds.some((m) => m.open)).toBe(true);
      expect(detectedUnion(q)).not.toContain('sanankou');
    }
  });
});

describe('generate — 赤ドラ（akaDoraCount。feature-12）', () => {
  const isRed = (t: Tile): boolean => t.kind === 'suited' && t.red;
  const fives = (ts: Tile[]): Tile[] => ts.filter((t) => t.kind === 'suited' && t.rank === 5);
  /** 手牌＋表示牌（赤の適用対象すべて） */
  function everyTile(q: GeneratedQuestion): Tile[] {
    return [...allTiles(q), ...q.table.doraIndicators, ...(q.table.uraDoraIndicators ?? [])];
  }

  it('既定（0枚）では赤牌が出ない', () => {
    for (let i = 0; i < 200; i++) {
      const q = generate(progress(), 'yaku', mulberry32(i * 29 + 1), rules());
      expect(everyTile(q).some(isRed)).toBe(false);
    }
  });

  it('赤は5の数牌にのみ付き、3枚設定では各色1枚以内', () => {
    for (let i = 0; i < 400; i++) {
      const q = generateForSeed('tanyao', mulberry32(i * 37 + 5), rules({ akaDoraCount: 3 }));
      const reds = everyTile(q).filter(isRed);
      const bySuit = new Map<string, number>();
      for (const t of reds) {
        expect(t.kind === 'suited' && t.rank === 5).toBe(true);
        if (t.kind === 'suited') bySuit.set(t.suit, (bySuit.get(t.suit) ?? 0) + 1);
      }
      for (const c of bySuit.values()) expect(c).toBeLessThanOrEqual(1);
    }
  });

  it('12枚設定（全部赤）では手の5が全て赤になり、採点のドラに乗る', () => {
    const r = rules({ akaDoraCount: 12 });
    let redSeen = 0;
    for (let i = 0; i < 200; i++) {
      const q = generateForSeed('tanyao', mulberry32(i * 41 + 7), r);
      const handFives = fives(allTiles(q));
      expect(handFives.every(isRed)).toBe(true);
      if (handFives.length > 0) {
        redSeen++;
        const s = summarize(q.hand, q.table, q.winContext, r);
        expect(s.doraHan).toBeGreaterThanOrEqual(handFives.length);
      }
    }
    expect(redSeen).toBeGreaterThan(0); // 断幺九は 2–8 のみ＝5を含む手が実際に出ている
  });

  it('3枚設定でも赤が実際に出題に現れる（上限であって0固定ではない）', () => {
    let redSeen = 0;
    for (let i = 0; i < 400; i++) {
      const q = generateForSeed('tanyao', mulberry32(i * 43 + 11), rules({ akaDoraCount: 3 }));
      if (allTiles(q).some(isRed)) redSeen++;
    }
    expect(redSeen).toBeGreaterThan(0);
  });

  it('赤ドラ設定でも決定的（同じ seed → 同じ問題）', () => {
    const a = generate(progress(), 'yaku', mulberry32(777), rules({ akaDoraCount: 3 }));
    const b = generate(progress(), 'yaku', mulberry32(777), rules({ akaDoraCount: 3 }));
    expect(a).toEqual(b);
  });
});

describe('generate — カン生成', () => {
  // 暗刻ベースの toitoi/sanankou は槓を引きうる
  it('副露可能シードは槓（明/暗）を生成しうる', () => {
    let kan = 0;
    for (let i = 0; i < 200; i++) {
      const q = generateForSeed('toitoi', mulberry32(i * 5 + 1), rules());
      if (q.hand.calledMelds.some((m) => m.type === 'kantsu')) kan++;
    }
    expect(kan).toBeGreaterThan(0);
  });

  it('槓のある手はドラ表示牌が1＋槓数になり、合計牌が14＋槓数', () => {
    for (let i = 0; i < 300; i++) {
      const q = generateForSeed('sanankou', mulberry32(i * 7 + 3), rules());
      const kc = q.hand.calledMelds.filter((m) => m.type === 'kantsu').length;
      if (kc === 0) continue;
      expect(q.table.doraIndicators).toHaveLength(1 + kc);
      const total =
        q.hand.concealed.length + 1 + q.hand.calledMelds.reduce((s, m) => s + m.tiles.length, 0);
      expect(total).toBe(14 + kc);
      // 暗槓は門前を崩さない（open:false）
      const ankan = q.hand.calledMelds.filter((m) => m.type === 'kantsu' && !m.open);
      if (ankan.length === q.hand.calledMelds.length && ankan.length > 0) {
        // 全ての副露が暗槓ならリーチ可能（門前）
        expect(q.hand.calledMelds.every((m) => !m.open)).toBe(true);
      }
    }
  });
})
