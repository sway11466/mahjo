import { FuCounting } from './FuCounting.tsx';
import { ReferenceOverlay } from '../../common/ReferenceOverlay.tsx';

interface FuCountingOverlayProps {
  onClose: () => void;
}

/** 符の数え方を共通の参照オーバーレイ（端末別の器）で包む。中身は FuCounting。 */
export function FuCountingOverlay({ onClose }: FuCountingOverlayProps) {
  return (
    <ReferenceOverlay title="符の数え方" onClose={onClose}>
      <FuCounting />
    </ReferenceOverlay>
  );
}
