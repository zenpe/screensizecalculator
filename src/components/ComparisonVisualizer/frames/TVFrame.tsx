import type { BaseFrameProps } from '../types';

export function TVFrame({
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
  const bezelColor = isLarger ? 'bg-slate-700' : 'bg-slate-600';
  const textColor = isLarger ? 'text-slate-400' : 'text-cyan-300';
  const fontSize = Math.max(Math.min(width * 0.06, 18), 10);

  // Bezel and stand dimensions
  const bezelWidth = Math.max(width * 0.015, 3);
  const standWidth = Math.max(width * 0.35, 40);
  const standHeight = Math.max(height * 0.06, 8);
  const standNeckWidth = Math.max(width * 0.08, 15);
  const standNeckHeight = Math.max(height * 0.08, 10);

  // In overlay mode, hide stand to focus on screen comparison
  const displayStand = showStand && !isOverlayMode;

  return (
    <div className="flex flex-col items-center transition-all duration-300 ease-out">
      {/* TV body with bezel */}
      <div
        className={`relative ${bezelColor} rounded-sm transition-all duration-300 ease-out`}
        style={{
          padding: `${bezelWidth}px`,
          boxShadow: isLarger && isOverlayMode ? 'none' : '0 4px 20px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Screen */}
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
          {/* Brand logo area */}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
            <div className={`w-4 h-1 ${isLarger ? 'bg-slate-600' : 'bg-slate-500'} rounded-full opacity-50`}></div>
          </div>
        </div>
      </div>

      {/* Stand neck - only show if displayStand is true */}
      {displayStand && (
        <div className={`${bezelColor}`} style={{ width: `${standNeckWidth}px`, height: `${standNeckHeight}px` }}></div>
      )}

      {/* Stand base - only show if displayStand is true */}
      {displayStand && (
        <div
          className={`${bezelColor} rounded-sm`}
          style={{
            width: `${standWidth}px`,
            height: `${standHeight}px`,
            borderRadius: '2px 2px 4px 4px',
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
