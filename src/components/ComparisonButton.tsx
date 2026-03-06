/**
 * ComparisonButton - canonical comparison link button
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
  const { href } = getComparisonLink(idA, idB);

  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}
