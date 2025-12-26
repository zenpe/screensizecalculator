import type { DeviceFrameProps } from '../types';
import { PhoneFrame } from './PhoneFrame';
import { TVFrame } from './TVFrame';
import { MonitorFrame } from './MonitorFrame';
import { ProjectorFrame } from './ProjectorFrame';

export { PhoneFrame, TVFrame, MonitorFrame, ProjectorFrame };

/**
 * Unified device frame renderer that dispatches to the appropriate frame component
 */
export function DeviceFrame({
  device,
  scaledDims,
  physicalDims,
  isLarger,
  isOverlayMode,
  showLabel,
  showDiagonal,
}: DeviceFrameProps) {
  const commonProps = {
    width: scaledDims.width,
    height: scaledDims.height,
    label: device.name,
    diagonal: device.diagonal,
    isLarger,
    isOverlayMode,
    showLabel,
    showDiagonal,
    dims: physicalDims,
  };

  switch (device.category) {
    case 'phone':
      return <PhoneFrame {...commonProps} physicalDims={physicalDims} bodyDims={device.phone?.dimensions} />;
    case 'tablet':
      // Tablet: similar to monitor but without stand
      return <MonitorFrame {...commonProps} showStand={false} />;
    case 'tv':
      return <TVFrame {...commonProps} />;
    case 'projector':
      return <ProjectorFrame {...commonProps} />;
    case 'monitor':
      return <MonitorFrame {...commonProps} />;
    default:
      return <TVFrame {...commonProps} />;
  }
}
