interface HandHoldingPhoneSVGProps {
  width: number;
}

export function HandHoldingPhoneSVG({ width }: HandHoldingPhoneSVGProps) {
  return (
    <svg
      width={width}
      height={width * 1.8}
      viewBox="0 0 60 108"
      className="drop-shadow transition-all duration-300"
    >
      {/* Hand */}
      <ellipse cx="30" cy="85" rx="22" ry="18" fill="#E5C4A8" />
      <ellipse cx="30" cy="95" rx="18" ry="10" fill="#D4A574" />
      {/* Thumb */}
      <ellipse cx="8" cy="65" rx="6" ry="14" fill="#E5C4A8" transform="rotate(-15 8 65)" />
      {/* Fingers wrapped around */}
      <rect x="48" y="40" width="8" height="35" rx="4" fill="#E5C4A8" />
      <rect x="50" y="50" width="6" height="30" rx="3" fill="#D4A574" opacity="0.5" />
      {/* Phone body */}
      <rect x="12" y="5" width="36" height="70" rx="6" fill="#1F2937" stroke="#374151" strokeWidth="1.5" />
      {/* Phone screen */}
      <rect x="14" y="10" width="32" height="60" rx="3" fill="url(#phoneScreen)" />
      {/* Notch */}
      <rect x="22" y="12" width="16" height="4" rx="2" fill="#111827" />
      {/* Home indicator */}
      <rect x="22" y="64" width="16" height="3" rx="1.5" fill="#374151" />
      <defs>
        <linearGradient id="phoneScreen" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="50%" stopColor="#1D4ED8" />
          <stop offset="100%" stopColor="#1E40AF" />
        </linearGradient>
      </defs>
    </svg>
  );
}
