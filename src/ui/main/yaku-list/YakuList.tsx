import { useState } from 'react';
import { TileSvg } from '../../common/tiles/TileSvg.tsx';
import { RiichiStick } from '../board/RiichiStick.tsx';
import { buildYakuRows, type YakuDifficulty } from './yakuReference.ts';
import './YakuList.css';

// フィルタの選択肢（「すべて」＋難易度／役満／レア）。並びは学習順（易→難→役満→レア）。
type Filter = 'すべて' | YakuDifficulty;
const FILTERS: Filter[] = ['すべて', '初級', '中級', '上級', '役満', 'レア'];

// 行データは静的（YAKU_TABLE＋YAKU_REFERENCE＋レア役）。一度だけ組み立てる。
const ROWS = buildYakuRows();

/**
 * 役一覧の中身（表示専任・端末非依存）。役名（読み）＋翻＋成立条件を一覧し、難易度等でフィルタする。
 * モーダル／全画面の包み方は呼び出し側（YakuListOverlay）が決める。データは yakuReference の buildYakuRows。
 */
export function YakuList() {
  const [filter, setFilter] = useState<Filter>('すべて');
  const rows = ROWS.filter((r) => filter === 'すべて' || r.difficulty === filter);

  return (
    <div className="yaku-list">
      <div className="yaku-list__filters" role="tablist" aria-label="難易度フィルタ">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filter === f}
            className={`yaku-list__filter${filter === f ? ' yaku-list__filter--active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <ul className="yaku-list__rows">
        {rows.map((r) => (
          <li key={r.key} className="yaku-list__row">
            <div className="yaku-list__head">
              <span className="yaku-list__name">{r.name}</span>
              <span className="yaku-list__han">{r.han}</span>
            </div>
            <p className="yaku-list__condition">{r.condition}</p>
            {r.example ? (
              <div className="yaku-list__example" aria-label="参考手牌">
                {r.example.map((tile, i) => (
                  <span className="yaku-list__example-tile" key={i}>
                    <TileSvg tile={tile} />
                  </span>
                ))}
              </div>
            ) : r.riichiStick ? (
              <div className="yaku-list__riichi">
                <span className="yaku-list__riichi-stick">
                  <RiichiStick />
                </span>
                {r.riichiBadge && (
                  <span className="yaku-list__riichi-badge">{r.riichiBadge}</span>
                )}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
