import type { Wind, HighlightTarget } from '../../../types/index.ts';
import { HONOR_LABEL } from '../../../engine/tiles.ts';
import { InfoBox } from './InfoBox.tsx';
import { kindLit } from '../highlights.ts';
import './SeatInfo.css';

interface SeatInfoProps {
  /** 自風（親/子は seatWind==='east' で導出） */
  seatWind: Wind;
  /** いま光らせる対象（解説・ヒント連携）。既定は無し。 */
  highlights?: HighlightTarget[];
}

/**
 * 自分の情報（自風＝親/子）。手牌の左上に置く（screens.md §3：自分の情報は手牌まわり）。
 * ハイライト対象＝seatWind。リーチ・ツモ/ロン等は別要素。
 */
export function SeatInfo({ seatWind, highlights = [] }: SeatInfoProps) {
  const role = seatWind === 'east' ? '親' : '子';
  return (
    <div className="seat-info">
      <InfoBox
        label="自風"
        className={kindLit(highlights, 'seatWind') ? 'info-box--lit' : ''}
      >
        {HONOR_LABEL[seatWind]}
        <span className="seat-info__role">{role}</span>
      </InfoBox>
    </div>
  );
}
