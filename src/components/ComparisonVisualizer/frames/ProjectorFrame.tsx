import type { BaseFrameProps } from '../types';

export function ProjectorFrame({
  width,
  height,
  label,
  diagonal,
  isLarger,
  isOverlayMode,
  showLabel = true,
  showDiagonal = true,
  dims,
}: BaseFrameProps) {
  const useDashed = isOverlayMode && isLarger;
  const textColor = isLarger ? 'text-slate-400' : 'text-cyan-300';
  const fontSize = Math.max(Math.min(width * 0.05, 16), 10);

  // Mount dimensions
  const mountHeight = Math.max(height * 0.03, 6);
  const mountWidth = width * 1.02;
  const borderWidth = Math.max(width * 0.008, 2);

  // Glow intensity based on size (larger screens = more glow spread)
  const glowSpread = Math.min(width * 0.15, 40);
  const glowOpacity = isLarger ? 0.4 : 0.6;

  return (
    <div className="flex flex-col items-center transition-all duration-300 ease-out">
      {/* Mounting bar / roller case */}
      <div
        className="rounded-t-sm transition-all duration-300 ease-out"
        style={{
          width: `${mountWidth}px`,
          height: `${mountHeight}px`,
          background: 'linear-gradient(180deg, #52525b 0%, #3f3f46 50%, #27272a 100%)',
          boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2)',
        }}
      ></div>

      {/* Screen with black border and projection glow */}
      <div
        className="relative transition-all duration-300 ease-out"
        style={{
          padding: `${borderWidth}px`,
          background: '#0f0f0f',
          // Soft ambient glow around the screen (light spill effect)
          boxShadow: isLarger && isOverlayMode
            ? 'none'
            : `0 0 ${glowSpread * 2}px ${glowSpread}px rgba(200, 200, 180, ${glowOpacity * 0.3}),
               0 8px 30px rgba(0, 0, 0, 0.4)`,
        }}
      >
        {/* The projection surface with diffuse reflection effect */}
        <div
          className="relative flex items-center justify-center overflow-hidden"
          style={{
            width: `${width}px`,
            height: `${height}px`,
            border: useDashed ? `2px dashed ${isLarger ? '#64748b' : '#22d3ee'}` : 'none',
            // Base matte white with subtle texture feel
            background: isLarger
              ? 'linear-gradient(135deg, #d4d4d8 0%, #e4e4e7 25%, #d4d4d8 50%, #e4e4e7 75%, #d4d4d8 100%)'
              : 'linear-gradient(135deg, #e5e5e5 0%, #f5f5f5 25%, #e5e5e5 50%, #f5f5f5 75%, #e5e5e5 100%)',
          }}
        >
          {/* Projection light effect - soft center hotspot */}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse 80% 70% at 50% 45%,
                rgba(255, 253, 245, ${isLarger ? 0.5 : 0.7}) 0%,
                rgba(255, 250, 235, ${isLarger ? 0.3 : 0.45}) 30%,
                rgba(245, 240, 225, ${isLarger ? 0.15 : 0.2}) 60%,
                transparent 100%)`,
            }}
          />

          {/* Subtle vignette - projectors have slightly darker edges */}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse 100% 100% at 50% 50%,
                transparent 40%,
                rgba(0, 0, 0, 0.08) 80%,
                rgba(0, 0, 0, 0.15) 100%)`,
            }}
          />

          {/* Screen texture - very subtle grain for matte screen feel */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 4 4' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Diagonal size text */}
          {showDiagonal && (
            <div
              className={`relative z-10 font-bold ${isLarger ? 'text-slate-500' : 'text-slate-600'}`}
              style={{
                fontSize: `${fontSize}px`,
                textShadow: '0 1px 2px rgba(255,255,255,0.5)',
              }}
            >
              {diagonal}"
            </div>
          )}
        </div>
      </div>

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
