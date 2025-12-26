import type { Device } from '../../data/devices';

export interface Dimensions {
  width: number;
  height: number;
}

export interface DeviceWithDimensions {
  device: Device;
  dims: Dimensions;
  area: number;
}

export type DisplayMode = 'overlay' | 'side-by-side' | 'room-view';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ScaleConfig {
  widthRatio: number;
  heightRatio: number;
  sideBySideWidth: number;
  sideBySideHeight: number;
}

export interface ViewingDistance {
  min: number;
  max: number;
  optimal: number;
}

export interface ComparisonVisualizerProps {
  deviceA: Device;
  deviceB: Device;
}

export interface DeviceFrameProps {
  device: Device;
  scaledDims: Dimensions;
  physicalDims: Dimensions;
  isLarger: boolean;
  isOverlayMode: boolean;
  showLabel?: boolean;
  showDiagonal?: boolean;
}

export interface BaseFrameProps {
  width: number;
  height: number;
  label: string;
  diagonal: number;
  isLarger: boolean;
  isOverlayMode: boolean;
  showLabel?: boolean;
  showDiagonal?: boolean;
  dims: Dimensions;
}

export interface PhoneFrameProps extends Omit<BaseFrameProps, 'dims'> {
  physicalDims?: Dimensions;
  bodyDims?: { height: number; width: number };
}

export interface RoomViewProps {
  larger: DeviceWithDimensions;
  smaller: DeviceWithDimensions;
  isMobile: boolean;
  availableHeight: number;
}

export interface ComparisonData {
  larger: DeviceWithDimensions;
  smaller: DeviceWithDimensions;
  isPhoneComparison: boolean;
  isLargeScreenComparison: boolean;
  areSameSize: boolean;
  sizeDiffPercent: number;
}
