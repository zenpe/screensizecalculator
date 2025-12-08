// Shared calculation utilities for all calculators

// Calculate aspect ratio from width and height
export function calculateAspectRatio(width: number, height: number): number {
  return width / height;
}

// Calculate GCD for simplifying ratios
export function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

// Simplify aspect ratio to lowest terms
export function simplifyRatio(width: number, height: number): { w: number; h: number } {
  const divisor = gcd(Math.round(width), Math.round(height));
  return {
    w: Math.round(width / divisor),
    h: Math.round(height / divisor)
  };
}

// Calculate dimensions from diagonal and aspect ratio
export function calculateDimensions(diagonal: number, aspectRatio: number): { width: number; height: number } {
  const height = diagonal / Math.sqrt(aspectRatio * aspectRatio + 1);
  const width = height * aspectRatio;
  return { width, height };
}

// Calculate PPI from resolution and diagonal
export function calculatePPI(resWidth: number, resHeight: number, diagonal: number): number {
  const diagonalPixels = Math.sqrt(resWidth ** 2 + resHeight ** 2);
  return diagonalPixels / diagonal;
}

// Format number with specified decimal places
export function formatNumber(num: number, decimals: number = 2): string {
  return num.toFixed(decimals);
}
