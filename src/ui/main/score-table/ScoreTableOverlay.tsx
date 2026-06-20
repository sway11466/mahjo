import { ScoreTable } from './ScoreTable.tsx';
import { ReferenceOverlay } from '../../common/ReferenceOverlay.tsx';

interface ScoreTableOverlayProps {
  onClose: () => void;
}

/** 点数表を共通の参照オーバーレイ（端末別の器）で包む。中身は ScoreTable。 */
export function ScoreTableOverlay({ onClose }: ScoreTableOverlayProps) {
  return (
    <ReferenceOverlay title="点数表" onClose={onClose}>
      <ScoreTable />
    </ReferenceOverlay>
  );
}
