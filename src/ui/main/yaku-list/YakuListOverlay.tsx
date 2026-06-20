import { YakuList } from './YakuList.tsx';
import { ReferenceOverlay } from '../../common/ReferenceOverlay.tsx';

interface YakuListOverlayProps {
  onClose: () => void;
}

/** 役一覧を共通の参照オーバーレイ（端末別の器）で包む。中身は YakuList。 */
export function YakuListOverlay({ onClose }: YakuListOverlayProps) {
  return (
    <ReferenceOverlay title="役一覧" onClose={onClose}>
      <YakuList />
    </ReferenceOverlay>
  );
}
