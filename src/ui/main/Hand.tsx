import type {
  Hand as HandModel,
  Meld,
  HighlightTarget,
} from '../../types/index.ts';
import { TileSvg } from '../common/tiles/TileSvg.tsx';
import { tileLit, meldLit, kindLit } from './highlights.ts';
import './Hand.css';

interface HandProps {
  /** 手（門前＋副露＋上がり牌） */
  hand: HandModel;
  /** あがり方。'tsumo' は牌の上に「ツモ」、'ron' は牌を浮かせて逆向きにして「ロン」（場＝他家から来た感） */
  win?: 'tsumo' | 'ron';
  /** いま光らせる対象（解説・ヒント連携。data-model §10）。既定は無し。 */
  highlights?: HighlightTarget[];
}

/** 副露面子の鳴き種別（初心者向けラベル）。順子＝チー・刻子＝ポン・槓子＝カン。 */
function callLabel(meld: Meld): string {
  switch (meld.type) {
    case 'shuntsu':
      return 'チー';
    case 'kotsu':
      return 'ポン';
    case 'kantsu':
      return 'カン';
    case 'pair':
      return '';
  }
}

/**
 * 手牌を横一列に並べる。門前は正準順（id 昇順）、あがり牌は1枚分あけて分離、
 * 副露面子はさらに離して別グループで示す（uxui §1。横向き表現は今後の改良）。
 */
export function Hand({ hand, win, highlights = [] }: HandProps) {
  const concealed = [...hand.concealed].sort((a, b) => a.id - b.id);
  // あがり牌のハイライト：winningTile マーカー、または上がり牌そのものの tile 指定。
  const winningLit =
    kindLit(highlights, 'winningTile') || tileLit(highlights, hand.winningTile.id);
  // あがり方の表示（ツモ/門前ロン）が対象か。
  const winLabelLit =
    win === 'tsumo' ? kindLit(highlights, 'tsumo') : kindLit(highlights, 'menzenRon');

  return (
    <div className="hand" role="list" aria-label="手牌">
      {concealed.map((tile, i) => (
        <div className="hand__tile" role="listitem" key={`c${i}`}>
          <TileSvg tile={tile} highlighted={tileLit(highlights, tile.id)} />
        </div>
      ))}

      {/* あがり牌：1枚分あけて分離。ツモは上に「ツモ」、ロンは浮かせて逆向き（場＝他家から来た感）に「ロン」 */}
      <div className="hand__gap" aria-hidden="true" />
      <div
        className={
          'hand__tile hand__tile--winning' +
          (win === 'ron' ? ' hand__tile--ron' : '')
        }
        role="listitem"
      >
        {win && (
          <span
            className={'hand__win-label' + (winLabelLit ? ' hand__win-label--lit' : '')}
          >
            {win === 'tsumo' ? 'ツモ' : 'ロン'}
          </span>
        )}
        <TileSvg tile={hand.winningTile} highlighted={winningLit} />
      </div>

      {/* 副露面子：手牌から離した別グループ。flex-grow を牌枚数ぶんにして門前と同じ牌サイズに揃える。
          鳴き種別（ポン/チー/カン）は牌の真上に添える */}
      {hand.calledMelds.map((meld, mi) => {
        const meldHot = meldLit(highlights, mi);
        return (
          <div
            className="hand__meld"
            key={`m${mi}`}
            style={{ flexGrow: meld.tiles.length }}
          >
            <span className="hand__call-label">{callLabel(meld)}</span>
            {meld.tiles.map((tile, ti) => (
              <div className="hand__tile hand__tile--called" role="listitem" key={ti}>
                <TileSvg
                  tile={tile}
                  highlighted={meldHot || tileLit(highlights, tile.id)}
                />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
