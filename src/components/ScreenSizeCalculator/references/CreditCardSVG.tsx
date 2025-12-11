interface CreditCardSVGProps {
  width: number;
}

export function CreditCardSVG({ width }: CreditCardSVGProps) {
  return (
    <svg
      width={width}
      height={width * 0.63}
      viewBox="0 0 68 43"
      className="drop-shadow transition-all duration-300"
    >
      <rect x="0" y="0" width="68" height="43" rx="4" fill="url(#cardGradient)" stroke="#4B5563" strokeWidth="1" />
      <rect x="8" y="12" width="12" height="10" rx="2" fill="#D4AF37" opacity="0.9" />
      <line x1="10" y1="15" x2="18" y2="15" stroke="#B8860B" strokeWidth="0.5" />
      <line x1="10" y1="17" x2="18" y2="17" stroke="#B8860B" strokeWidth="0.5" />
      <line x1="10" y1="19" x2="18" y2="19" stroke="#B8860B" strokeWidth="0.5" />
      <rect x="0" y="28" width="68" height="6" fill="#1F2937" opacity="0.8" />
      <circle cx="56" cy="14" r="6" fill="#EB001B" opacity="0.9" />
      <circle cx="62" cy="14" r="6" fill="#F79E1B" opacity="0.7" />
      <defs>
        <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#374151" />
          <stop offset="50%" stopColor="#4B5563" />
          <stop offset="100%" stopColor="#374151" />
        </linearGradient>
      </defs>
    </svg>
  );
}
