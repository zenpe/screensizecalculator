interface HumanSilhouetteSVGProps {
  height: number;
}

export function HumanSilhouetteSVG({ height }: HumanSilhouetteSVGProps) {
  return (
    <svg
      width={height * 0.35}
      height={height}
      viewBox="0 0 35 100"
      className="drop-shadow transition-all duration-300"
    >
      {/* Head */}
      <circle cx="17.5" cy="10" r="8" fill="#6B7280" />
      {/* Neck */}
      <rect x="14" y="17" width="7" height="5" fill="#6B7280" />
      {/* Body/Torso */}
      <path d="M7 22 L28 22 L25 55 L10 55 Z" fill="#6B7280" />
      {/* Left arm */}
      <path d="M7 22 Q2 35 4 48" stroke="#6B7280" strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* Right arm */}
      <path d="M28 22 Q33 35 31 48" stroke="#6B7280" strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* Left leg */}
      <path d="M10 55 L8 100" stroke="#6B7280" strokeWidth="6" strokeLinecap="round" />
      {/* Right leg */}
      <path d="M25 55 L27 100" stroke="#6B7280" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}
