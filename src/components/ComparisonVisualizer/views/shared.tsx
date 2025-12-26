/**
 * Human silhouette SVG component (standing, ~170cm / 5'7")
 */
export function HumanSilhouette({ height, className = '' }: { height: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 40 170"
      style={{ height: `${height}px` }}
      className={className}
      fill="currentColor"
    >
      {/* Head */}
      <circle cx="20" cy="12" r="10" />
      {/* Neck */}
      <rect x="17" y="22" width="6" height="8" />
      {/* Body */}
      <path d="M8 30 L32 30 L30 90 L10 90 Z" />
      {/* Left arm */}
      <path d="M8 32 L2 70 L6 72 L12 40 Z" />
      {/* Right arm */}
      <path d="M32 32 L38 70 L34 72 L28 40 Z" />
      {/* Left leg */}
      <path d="M10 90 L8 168 L14 168 L18 90 Z" />
      {/* Right leg */}
      <path d="M22 90 L26 168 L32 168 L30 90 Z" />
    </svg>
  );
}

/**
 * Sofa hint - minimal visual cue for first person perspective
 * Just subtle armrest edges to suggest "you're sitting here"
 */
export function SofaHint({ width }: { width: number }) {
  const armWidth = width * 0.06;
  const armHeight = width * 0.12;

  return (
    <div className="relative" style={{ width: `${width}px`, height: `${armHeight}px` }}>
      {/* Left armrest edge */}
      <div
        className="absolute left-0 bottom-0 rounded-t-lg"
        style={{
          width: `${armWidth}px`,
          height: `${armHeight}px`,
          background: 'linear-gradient(to right, rgba(63, 63, 70, 0.6) 0%, rgba(63, 63, 70, 0.2) 100%)',
          boxShadow: 'inset 1px 1px 4px rgba(255,255,255,0.08)',
        }}
      />

      {/* Right armrest edge */}
      <div
        className="absolute right-0 bottom-0 rounded-t-lg"
        style={{
          width: `${armWidth}px`,
          height: `${armHeight}px`,
          background: 'linear-gradient(to left, rgba(63, 63, 70, 0.6) 0%, rgba(63, 63, 70, 0.2) 100%)',
          boxShadow: 'inset -1px 1px 4px rgba(255,255,255,0.08)',
        }}
      />

      {/* Subtle center arc hint - very faint sofa back top edge */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2"
        style={{
          width: `${width * 0.7}px`,
          height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(82, 82, 91, 0.3) 30%, rgba(82, 82, 91, 0.4) 50%, rgba(82, 82, 91, 0.3) 70%, transparent 100%)',
          borderRadius: '50% 50% 0 0',
        }}
      />
    </div>
  );
}
