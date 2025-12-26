import type { BaseFrameProps } from '../types';

export function MonitorFrame({
  width,
  height,
  label,
  diagonal,
  isLarger,
  isOverlayMode,
  showLabel = true,
  showDiagonal = true,
  showStand = true,
  dims,
}: BaseFrameProps & { showStand?: boolean }) {
  const useDashed = isOverlayMode && isLarger;
  const borderColor = isLarger ? 'border-slate-500' : 'border-cyan-400';
  const bgColor = isLarger ? 'bg-slate-800/60' : 'bg-slate-700/80';
  const bezelColor = isLarger ? 'bg-slate-800' : 'bg-slate-700';
  const textColor = isLarger ? 'text-slate-400' : 'text-cyan-300';
  const fontSize = Math.max(Math.min(width * 0.07, 16), 10);

  // Thin bezel for modern monitors
  const bezelWidth = Math.max(width * 0.008, 2);
  const standWidth = Math.max(width * 0.25, 30);
  const standHeight = Math.max(height * 0.04, 6);
  const standNeckWidth = Math.max(width * 0.06, 10);
  const standNeckHeight = Math.max(height * 0.12, 15);

  // In overlay mode, hide stand to focus on screen comparison
  const displayStand = showStand && !isOverlayMode;

  return (
    <div className="flex flex-col items-center transition-all duration-300 ease-out">
      {/* Monitor body with thin bezel */}
      <div
        className={`relative ${bezelColor} rounded-sm transition-all duration-300 ease-out`}
        style={{
          padding: `${bezelWidth}px`,
          boxShadow: isLarger && isOverlayMode ? 'none' : '0 4px 15px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div
          className={`relative ${bgColor} ${borderColor} flex items-center justify-center transition-all duration-300 ease-out`}
          style={{
            width: `${width}px`,
            height: `${height}px`,
            borderWidth: useDashed ? '2px' : '0',
            borderStyle: useDashed ? 'dashed' : 'solid',
          }}
        >
          {showDiagonal && (
            <div className={`${isLarger ? 'text-slate-500' : 'text-cyan-400'} font-bold`} style={{ fontSize: `${fontSize}px` }}>
              {diagonal}"
            </div>
          )}
        </div>
      </div>

      {/* Stand neck - only show if displayStand is true */}
      {displayStand && (
        <div className={`${bezelColor}`} style={{ width: `${standNeckWidth}px`, height: `${standNeckHeight}px` }}></div>
      )}

      {/* Stand base - oval shaped - only show if displayStand is true */}
      {displayStand && (
        <div
          className={`${bezelColor}`}
          style={{
            width: `${standWidth}px`,
            height: `${standHeight}px`,
            borderRadius: '50%',
          }}
        ></div>
      )}

      {/* Label */}
      {showLabel && (
        <div className={`mt-3 text-center ${textColor}`}>
          <div className="font-medium text-sm truncate max-w-[120px] sm:max-w-none">{label}</div>
          <div className={`text-xs ${isLarger ? 'text-slate-500' : 'text-cyan-400/70'}`}>
            {dims.width.toFixed(1)}" × {dims.height.toFixed(1)}"
          </div>
        </div>
      )}
    </div>
  );
}
