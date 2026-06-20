import type { Tile, Wind, HighlightTarget } from '../../../types/index.ts';
import { TileSvg } from '../../common/tiles/TileSvg.tsx';
import { TileBack } from '../../common/tiles/TileBack.tsx';
import { HONOR_LABEL } from '../../../engine/tiles.ts';
import { InfoBox } from './InfoBox.tsx';
import { kindLit, doraIndicatorLit, uraDoraIndicatorLit } from '../highlights.ts';
import './BoardInfo.css';

interface BoardInfoProps {
  /** 場風（局の東/南を決める） */
  roundWind: Wind;
  /** 現在の局 index（0–7）。局番号＝(index%4)+1、進捗 n/8 を兼ねる */
  roundIndex: number;
  /** ドラ表示牌（Table.doraIndicators）。空なら表示しない */
  doraIndicators: Tile[];
  /** 裏ドラ表示牌（リーチ和了時のみ）。空なら裏向きで未公開を示す */
  uraDoraIndicators: Tile[];
  /** いま光らせる対象（解説・ヒント連携）。既定は無し。 */
  highlights?: HighlightTarget[];
}

/**
 * 盤面上部の場情報（現在の局・ドラ・裏ドラ）＝全員共通の情報。
 * 自分の情報（自風・ツモ/ロン など）は手牌側に置く（ロンはあがり牌を浮かせて逆向きに）。
 * 局は1セッション8問（東南戦）の進捗を兼ねる（screens.md §3）。場風は局から導出。
 */
export function BoardInfo({
  roundWind,
  roundIndex,
  doraIndicators,
  uraDoraIndicators,
  highlights = [],
}: BoardInfoProps) {
  return (
    <section className="board-info" aria-label="場の情報">
      {/* 現在の局（例 東1局・南3局）。場風（東/南）と局番号で進捗 n/8 を兼ねる。
          場風は局チップに含まれるので、場風ハイライトはこのチップを光らせる。
          中央上に配置（左はスペーサ・右はドラ） */}
      <InfoBox
        className={`board-info__round${kindLit(highlights, 'roundWind') ? ' info-box--lit' : ''}`}
      >
        {HONOR_LABEL[roundWind]}
        {(roundIndex % 4) + 1}局
      </InfoBox>

      <div className="board-info__right">
        {/* ドラ・裏ドラを横並び（左＝ドラ／右＝裏ドラ）。両方とも常に表示。
            裏ドラはリーチ和了時のみ公開、それ以外は裏向きの牌で見せる */}
        <div className="board-info__dora-row">
          <InfoBox label="ドラ" className="info-box--dora">
            {doraIndicators.map((t, i) => (
              <span className="board-info__tile" key={i}>
                <TileSvg tile={t} highlighted={doraIndicatorLit(highlights, i)} />
              </span>
            ))}
          </InfoBox>
          <InfoBox label="裏ドラ" className="info-box--dora">
            {uraDoraIndicators.length > 0 ? (
              uraDoraIndicators.map((t, i) => (
                <span className="board-info__tile" key={i}>
                  <TileSvg tile={t} highlighted={uraDoraIndicatorLit(highlights, i)} />
                </span>
              ))
            ) : (
              <span className="board-info__tile">
                <TileBack />
              </span>
            )}
          </InfoBox>
        </div>
      </div>
    </section>
  );
}
