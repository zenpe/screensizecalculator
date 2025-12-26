import type { RoomViewProps } from '../types';
import { useContainerWidth } from '../hooks';
import { DeviceFrame } from '../frames';
import { HumanSilhouette, SofaHint } from './shared';

export function RoomView({
  larger,
  smaller,
  isMobile,
  availableHeight,
}: RoomViewProps) {
  // Human height reference: ~170cm = 67 inches
  const humanHeightInches = 67;

  // Container dimensions - responsive based on viewport
  const dynamicWidth = useContainerWidth();
  const containerWidth = isMobile ? Math.min(dynamicWidth, 340) : Math.min(dynamicWidth, 900);

  // Use available height from parent, minus space for info cards
  const infoCardsHeight = isMobile ? 80 : 100;
  const containerHeight = Math.max(availableHeight - infoCardsHeight, 250);

  // TV cabinet height from floor (typical: ~20-24 inches / 50-60cm)
  const cabinetHeightInches = 22;

  // Wall space above cabinet (where screens are mounted/placed)
  // Calculate based on largest screen + some padding
  const maxScreenHeightInches = Math.max(larger.dims.height, smaller.dims.height);
  const wallSpaceInches = maxScreenHeightInches + 10; // 10" padding above screens

  // Total height needed: floor to human head top
  const totalHeightInches = Math.max(humanHeightInches, cabinetHeightInches + wallSpaceInches);

  // Human width
  const humanWidthInches = 15;
  const gapInches = isMobile ? 3 : 5;

  // Total width: human + gap + screens side by side
  const totalWidthInches = humanWidthInches + gapInches + larger.dims.width + gapInches + smaller.dims.width;

  // Calculate scale to fit everything
  const scaleByWidth = (containerWidth * 0.92) / totalWidthInches;
  const scaleByHeight = (containerHeight * 0.72) / totalHeightInches;
  const roomScaleFactor = Math.min(scaleByWidth, scaleByHeight);

  // Apply scale
  const humanHeightPx = humanHeightInches * roomScaleFactor;
  const cabinetHeightPx = cabinetHeightInches * roomScaleFactor;
  const gapPx = gapInches * roomScaleFactor;

  const largerScaled = {
    width: larger.dims.width * roomScaleFactor,
    height: larger.dims.height * roomScaleFactor,
  };
  const smallerScaled = {
    width: smaller.dims.width * roomScaleFactor,
    height: smaller.dims.height * roomScaleFactor,
  };

  // Room total height
  const roomHeight = containerHeight;

  // Floor position from bottom of container - smaller on mobile
  const floorFromBottom = isMobile ? 25 : 35;

  // Cabinet line position (distance from floor)
  const cabinetLineFromFloor = cabinetHeightPx;

  return (
    <div className="flex flex-col items-center w-full">
      {/* Room simulation */}
      <div
        className="relative w-full max-w-5xl mx-auto bg-gradient-to-b from-slate-800 to-slate-900 rounded-lg overflow-hidden"
        style={{ height: `${roomHeight}px` }}
      >
        {/* Wall texture */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #fff 0px, #fff 1px, transparent 1px, transparent 50px)' }}></div>
        </div>

        {/* Virtual TV cabinet line - dashed line showing where devices bottom aligns */}
        <div
          className="absolute left-0 right-0 border-t border-dashed border-slate-600/50"
          style={{ bottom: `${floorFromBottom + cabinetLineFromFloor}px` }}
        >
          <span className={`absolute right-2 -top-4 text-xs text-slate-600 ${isMobile ? 'hidden' : ''}`}>TV Cabinet</span>
        </div>

        {/* Floor line */}
        <div
          className="absolute left-0 right-0 h-px bg-slate-500"
          style={{ bottom: `${floorFromBottom}px` }}
        ></div>

        {/* Floor area */}
        <div
          className="absolute left-0 right-0 bg-gradient-to-t from-slate-950 to-slate-900/80"
          style={{ bottom: 0, height: `${floorFromBottom}px` }}
        ></div>

        {/* Content container */}
        <div
          className="absolute inset-x-0 flex items-end justify-center px-4"
          style={{
            bottom: `${floorFromBottom + cabinetLineFromFloor}px`,
            gap: `${gapPx}px`
          }}
        >
          {/* Human silhouette - standing on the floor, not on cabinet */}
          <div
            className="flex flex-col items-center text-slate-500/70"
            style={{
              marginBottom: `-${cabinetLineFromFloor}px` // Push human down to floor level
            }}
          >
            <HumanSilhouette height={humanHeightPx} />
            <div className="text-xs text-center mt-1 text-slate-500">5'7"</div>
          </div>

          {/* Larger screen - bottom aligned to cabinet line */}
          <div className="flex flex-col items-center">
            <DeviceFrame
              device={larger.device}
              scaledDims={largerScaled}
              physicalDims={larger.dims}
              isLarger={true}
              isOverlayMode={false}
              showLabel={false}
              showDiagonal={true}
            />
          </div>

          {/* Smaller screen - bottom aligned to cabinet line */}
          <div className="flex flex-col items-center">
            <DeviceFrame
              device={smaller.device}
              scaledDims={smallerScaled}
              physicalDims={smaller.dims}
              isLarger={false}
              isOverlayMode={false}
              showLabel={false}
              showDiagonal={true}
            />
          </div>
        </div>

        {/* Sofa hint - subtle armrest edges for first person perspective */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{ bottom: 0 }}
        >
          <SofaHint width={isMobile ? Math.min(containerWidth * 0.85, 300) : 550} />
        </div>

        {/* Scale indicator */}
        <div className="absolute top-2 right-2 text-xs text-slate-600">
          Scale: {(roomScaleFactor).toFixed(2)}px/inch
        </div>
      </div>

      {/* Info cards - compact layout */}
      <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mt-2 w-full max-w-5xl mx-auto px-1">
        {/* Larger device info */}
        <div className="bg-slate-800/50 rounded p-1.5 sm:p-2 border border-slate-700">
          <div className="flex items-center gap-1 mb-0.5">
            <div className="w-2 h-1.5 sm:w-2.5 sm:h-1.5 border border-dashed border-slate-400 rounded flex-shrink-0"></div>
            <span className="text-[9px] sm:text-xs font-medium text-slate-300 truncate">{larger.device.name}</span>
          </div>
          <div className="text-[9px] sm:text-[10px] text-slate-400 truncate">
            {larger.device.diagonal}" ({(larger.dims.width * 2.54).toFixed(0)}×{(larger.dims.height * 2.54).toFixed(0)}cm)
          </div>
        </div>

        {/* Smaller device info */}
        <div className="bg-slate-800/50 rounded p-1.5 sm:p-2 border border-cyan-900/50">
          <div className="flex items-center gap-1 mb-0.5">
            <div className="w-2 h-1.5 sm:w-2.5 sm:h-1.5 border border-solid border-cyan-400 rounded flex-shrink-0"></div>
            <span className="text-[9px] sm:text-xs font-medium text-cyan-300 truncate">{smaller.device.name}</span>
          </div>
          <div className="text-[9px] sm:text-[10px] text-cyan-400/70 truncate">
            {smaller.device.diagonal}" ({(smaller.dims.width * 2.54).toFixed(0)}×{(smaller.dims.height * 2.54).toFixed(0)}cm)
          </div>
        </div>
      </div>
    </div>
  );
}
