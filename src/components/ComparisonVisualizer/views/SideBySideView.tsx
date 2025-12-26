import type { DeviceWithDimensions, Dimensions } from '../types';
import { DeviceFrame } from '../frames';

interface SideBySideViewProps {
  larger: DeviceWithDimensions;
  smaller: DeviceWithDimensions;
  largerScaled: Dimensions;
  smallerScaled: Dimensions;
  isStacked: boolean;
}

export function SideBySideView({
  larger,
  smaller,
  largerScaled,
  smallerScaled,
  isStacked,
}: SideBySideViewProps) {
  return (
    <div className={`flex justify-center ${isStacked ? 'flex-col items-center gap-2' : 'flex-row items-end gap-6 md:gap-12'}`}>
      <DeviceFrame
        device={larger.device}
        scaledDims={largerScaled}
        physicalDims={larger.dims}
        isLarger={true}
        isOverlayMode={false}
        showLabel={true}
        showDiagonal={true}
      />
      <DeviceFrame
        device={smaller.device}
        scaledDims={smallerScaled}
        physicalDims={smaller.dims}
        isLarger={false}
        isOverlayMode={false}
        showLabel={true}
        showDiagonal={true}
      />
    </div>
  );
}
