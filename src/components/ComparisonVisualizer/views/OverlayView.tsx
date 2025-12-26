import type { DeviceWithDimensions, Dimensions } from '../types';
import { DeviceFrame } from '../frames';
import { getViewingDistance } from '../utils';

interface OverlayViewProps {
  larger: DeviceWithDimensions;
  smaller: DeviceWithDimensions;
  largerScaled: Dimensions;
  smallerScaled: Dimensions;
  areSameSize: boolean;
  sizeDiffPercent: number;
  isPhoneComparison: boolean;
  isLargeScreenComparison: boolean;
}

export function OverlayView({
  larger,
  smaller,
  largerScaled,
  smallerScaled,
  areSameSize,
  sizeDiffPercent,
  isPhoneComparison,
  isLargeScreenComparison,
}: OverlayViewProps) {
  const largerDistance = getViewingDistance(larger.device.diagonal);
  const smallerDistance = getViewingDistance(smaller.device.diagonal);

  return (
    <div className="relative flex flex-col items-center">
      {areSameSize && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 bg-amber-500/90 text-slate-900 text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap">
          Similar sizes ({sizeDiffPercent.toFixed(1)}% diff)
        </div>
      )}

      {/* Devices container with explicit height for larger device */}
      <div
        className="relative flex items-end justify-center transition-all duration-300 ease-out"
        style={{ height: `${largerScaled.height + 10}px` }}
      >
        {/* Larger device (background) */}
        <div
          className="absolute bottom-0 transition-all duration-300 ease-out"
          style={{ transform: areSameSize ? 'translateX(-25px)' : 'none' }}
        >
          <DeviceFrame
            device={larger.device}
            scaledDims={largerScaled}
            physicalDims={larger.dims}
            isLarger={true}
            isOverlayMode={true}
            showLabel={false}
            showDiagonal={false}
          />
        </div>
        {/* Smaller device (foreground) */}
        <div
          className="relative z-10 transition-all duration-300 ease-out"
          style={{ transform: areSameSize ? 'translateX(25px)' : 'none' }}
        >
          <DeviceFrame
            device={smaller.device}
            scaledDims={smallerScaled}
            physicalDims={smaller.dims}
            isLarger={false}
            isOverlayMode={true}
            showLabel={false}
            showDiagonal={false}
          />
        </div>
      </div>

      {/* Labels below */}
      <div className="flex justify-center gap-2 sm:gap-10 mt-3 sm:mt-4 w-full px-1">
        <div className="text-center text-slate-400 flex-1 max-w-[140px] sm:max-w-[200px]">
          <div className="flex items-center justify-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
            <div className="w-3 h-2 sm:w-4 sm:h-3 border-2 border-dashed border-slate-400 bg-slate-800/50 rounded flex-shrink-0"></div>
            <span className="font-medium text-[10px] sm:text-sm truncate">{larger.device.name}</span>
          </div>
          <div className="text-[10px] sm:text-xs text-slate-500 truncate">
            {isPhoneComparison ? (
              <>
                {larger.device.phone?.dimensions ? (
                  <>Body: {larger.device.phone.dimensions.height.toFixed(0)}×{larger.device.phone.dimensions.width.toFixed(0)}mm</>
                ) : (
                  <>{larger.device.diagonal}" · {(larger.dims.height * 25.4).toFixed(0)}×{(larger.dims.width * 25.4).toFixed(0)}mm</>
                )}
              </>
            ) : (
              <>{larger.device.diagonal}" · {larger.dims.width.toFixed(1)}"×{larger.dims.height.toFixed(1)}"</>
            )}
          </div>
          {isPhoneComparison && larger.device.phone?.dimensions && (
            <div className="text-[9px] sm:text-[10px] text-slate-600 truncate">
              Screen: {(larger.dims.height * 25.4).toFixed(0)}×{(larger.dims.width * 25.4).toFixed(0)}mm
            </div>
          )}
          {isLargeScreenComparison && (
            <div className="text-[10px] sm:text-xs text-slate-600 mt-0.5 sm:mt-1 hidden sm:block">
              View: {largerDistance.min.toFixed(1)}-{largerDistance.max.toFixed(1)} ft
            </div>
          )}
        </div>
        <div className="text-center text-cyan-300 flex-1 max-w-[140px] sm:max-w-[200px]">
          <div className="flex items-center justify-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
            <div className="w-3 h-2 sm:w-4 sm:h-3 border-2 border-solid border-cyan-400 bg-slate-700/70 rounded flex-shrink-0"></div>
            <span className="font-medium text-[10px] sm:text-sm truncate">{smaller.device.name}</span>
          </div>
          <div className="text-[10px] sm:text-xs text-cyan-400/70 truncate">
            {isPhoneComparison ? (
              <>
                {smaller.device.phone?.dimensions ? (
                  <>Body: {smaller.device.phone.dimensions.height.toFixed(0)}×{smaller.device.phone.dimensions.width.toFixed(0)}mm</>
                ) : (
                  <>{smaller.device.diagonal}" · {(smaller.dims.height * 25.4).toFixed(0)}×{(smaller.dims.width * 25.4).toFixed(0)}mm</>
                )}
              </>
            ) : (
              <>{smaller.device.diagonal}" · {smaller.dims.width.toFixed(1)}"×{smaller.dims.height.toFixed(1)}"</>
            )}
          </div>
          {isPhoneComparison && smaller.device.phone?.dimensions && (
            <div className="text-[9px] sm:text-[10px] text-cyan-600 truncate">
              Screen: {(smaller.dims.height * 25.4).toFixed(0)}×{(smaller.dims.width * 25.4).toFixed(0)}mm
            </div>
          )}
          {isLargeScreenComparison && (
            <div className="text-[10px] sm:text-xs text-cyan-600 mt-0.5 sm:mt-1 hidden sm:block">
              View: {smallerDistance.min.toFixed(1)}-{smallerDistance.max.toFixed(1)} ft
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
