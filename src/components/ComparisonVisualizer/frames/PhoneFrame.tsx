import type { PhoneFrameProps } from '../types';

export function PhoneFrame({
  width,
  height,
  label,
  diagonal,
  isLarger,
  isOverlayMode,
  showLabel = true,
  showDiagonal = true,
  physicalDims,
  bodyDims,
}: PhoneFrameProps) {
  const useDashed = isOverlayMode && isLarger;
  const borderColor = isLarger ? 'border-slate-400' : 'border-cyan-400';
  const bgColor = isLarger ? 'bg-slate-800/60' : 'bg-slate-700/80';
  const textColor = isLarger ? 'text-slate-300' : 'text-cyan-300';
  const subTextColor = isLarger ? 'text-slate-500' : 'text-cyan-400/70';

  const notchWidth = Math.max(width * 0.3, 24);
  const notchHeight = Math.max(height * 0.015, 5);
  const homeWidth = Math.max(width * 0.4, 32);
  const homeHeight = Math.max(height * 0.006, 3);
  const fontSize = Math.max(Math.min(width * 0.15, 20), 12);
  const borderRadius = Math.min(width, height) * 0.1;

  // Screen dimensions in mm (calculated from diagonal)
  const screenHeightMm = physicalDims ? (physicalDims.height * 25.4).toFixed(0) : '';
  const screenWidthMm = physicalDims ? (physicalDims.width * 25.4).toFixed(0) : '';

  // Body dimensions in mm (from device data)
  const bodyHeightMm = bodyDims ? bodyDims.height.toFixed(0) : '';
  const bodyWidthMm = bodyDims ? bodyDims.width.toFixed(0) : '';

  return (
    <div className="flex flex-col items-center transition-all duration-300 ease-out">
      <div
        className={`relative ${bgColor} ${borderColor} flex flex-col overflow-hidden transition-all duration-300 ease-out`}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          borderWidth: useDashed ? '2px' : '3px',
          borderStyle: useDashed ? 'dashed' : 'solid',
          borderRadius: `${borderRadius}px`,
          boxShadow: isLarger && isOverlayMode ? 'none' : '0 4px 20px rgba(34, 211, 238, 0.2)',
        }}
      >
        <div className="flex justify-center" style={{ paddingTop: `${Math.max(height * 0.02, 4)}px` }}>
          <div className="bg-slate-900 rounded-full" style={{ width: `${notchWidth}px`, height: `${notchHeight}px` }} />
        </div>
        <div className="flex-1 flex items-center justify-center">
          {showDiagonal && (
            <div className={`${isLarger ? 'text-slate-500' : 'text-cyan-400'} font-bold`} style={{ fontSize: `${fontSize}px` }}>
              {diagonal}"
            </div>
          )}
        </div>
        <div className="flex justify-center" style={{ paddingBottom: `${Math.max(height * 0.015, 3)}px` }}>
          <div className={`${isLarger ? 'bg-slate-600' : 'bg-slate-500'} rounded-full`} style={{ width: `${homeWidth}px`, height: `${homeHeight}px` }} />
        </div>
      </div>
      {showLabel && (physicalDims || bodyDims) && (
        <div className={`mt-3 text-center ${textColor}`}>
          <div className="font-medium text-sm truncate max-w-[120px] sm:max-w-none">{label}</div>
          {bodyDims && (
            <div className={`text-xs ${subTextColor}`}>Body: {bodyHeightMm} × {bodyWidthMm}mm</div>
          )}
          {physicalDims && (
            <div className={`text-[10px] ${subTextColor} opacity-70`}>Screen: {screenHeightMm} × {screenWidthMm}mm</div>
          )}
        </div>
      )}
    </div>
  );
}
