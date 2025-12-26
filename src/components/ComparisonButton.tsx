/**
 * ComparisonButton - Link obfuscation for non-whitelisted comparisons
 *
 * For whitelisted comparisons: renders normal <a> tag
 * For non-whitelisted: renders <span> with onClick (invisible to crawlers)
 *
 * Use this for global areas (footer, sidebar) where you want zero link juice leakage.
 * For content areas, use ComparisonLink.astro instead (preserves user experience).
 */
import { getComparisonLink } from '../utils/url';

interface ComparisonButtonProps {
  idA: string;
  idB: string;
  className?: string;
  children: React.ReactNode;
}

export default function ComparisonButton({
  idA,
  idB,
  className = '',
  children,
}: ComparisonButtonProps) {
  const { href, isStatic } = getComparisonLink(idA, idB);

  // Whitelisted: normal link
  if (isStatic) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }

  // Non-whitelisted: JS navigation (invisible to crawlers)
  const handleClick = () => {
    window.location.href = href;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      window.location.href = href;
    }
  };

  // Handle middle-click / ctrl+click for new tab
  const handleAuxClick = (e: React.MouseEvent) => {
    if (e.button === 1) { // Middle click
      window.open(href, '_blank');
    }
  };

  const handleClickWithModifier = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      window.open(href, '_blank');
    } else {
      handleClick();
    }
  };

  return (
    <span
      role="link"
      tabIndex={0}
      className={`cursor-pointer ${className}`}
      onClick={handleClickWithModifier}
      onKeyDown={handleKeyDown}
      onAuxClick={handleAuxClick}
    >
      {children}
    </span>
  );
}
