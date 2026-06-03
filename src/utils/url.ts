/**
 * URL utilities for comparison pages
 * Ensures consistent canonical URLs by enforcing alphabetical order
 */

import { getComparisonBrowseUrl, isComparisonSeoEnabled } from '../site.config';

/**
 * Generate a canonical comparison slug for two device IDs
 * Always returns alphabetically sorted slug
 *
 * @param id1 - First device ID
 * @param id2 - Second device ID
 * @returns Canonical comparison slug (e.g., "apple-vs-samsung")
 */
export function getComparisonSlug(id1: string, id2: string): string {
  const [a, b] = [id1, id2].sort();
  return `${a}-vs-${b}`;
}

/**
 * Generate a canonical comparison URL for two device IDs
 * Always returns static canonical page: /comparison/a-vs-b
 *
 * @param id1 - First device ID
 * @param id2 - Second device ID
 * @returns Canonical comparison URL path
 */
export function getComparisonUrl(id1: string, id2: string): string {
  return `/comparison/${getComparisonSlug(id1, id2)}`;
}

export function getCompareToolUrl(id1: string, id2: string): string {
  const [a, b] = [id1, id2].sort();
  return `/compare#${new URLSearchParams({ a, b }).toString()}`;
}

export function getCompareDeviceUrl(id: string): string {
  return `/compare#device=${encodeURIComponent(id)}`;
}

export function getDevicePageRouteParam(id: string): string {
  return id.endsWith('-projector-screen') ? id.replace(/-screen$/, '') : id;
}

export function getDevicePageSlug(id: string): string {
  return `${encodeURIComponent(getDevicePageRouteParam(id))}-screen-size`;
}

export function getDevicePageUrl(id: string): string {
  return `/${getDevicePageSlug(id)}`;
}

export function normalizeLegacyProjectorScreenUrls(value: string): string {
  if (typeof value !== 'string') return value;

  return value.replace(
    /\/([a-z0-9-]+-projector-screen)-screen-size(?=\/|[?#."' <]|$)/gi,
    '/$1-size',
  );
}

export function getComparisonEntryUrl(id1: string, id2: string): string {
  if (isComparisonSeoEnabled()) {
    return getComparisonUrl(id1, id2);
  }

  return getCompareToolUrl(id1, id2);
}

function splitHrefParts(href: string): { path: string; search: string; hash: string } {
  const match = href.match(/^([^?#]*)(\?[^#]*)?(#.*)?$/);
  return {
    path: match?.[1] ?? href,
    search: match?.[2] ?? '',
    hash: match?.[3] ?? '',
  };
}

function decodeHtmlAmpersands(value: string): string {
  return value.replace(/&(amp|#38|#x26);/gi, '&');
}

export function rewriteComparisonHrefForSeo(href: string): string {
  if (isComparisonSeoEnabled() || typeof href !== 'string') {
    return href;
  }

  const normalizedHref = decodeHtmlAmpersands(href);

  if (normalizedHref.startsWith('/compare')) {
    const { path, search, hash } = splitHrefParts(normalizedHref);
    if (path !== '/compare') return normalizeLegacyProjectorScreenUrls(href);

    if (hash) return normalizeLegacyProjectorScreenUrls(href);

    const params = new URLSearchParams(search.replace(/^\?/, ''));
    const deviceId = params.get('device') || params.get('a');
    const a = params.get('a');
    const b = params.get('b');

    if (a && b) {
      return getCompareToolUrl(a, b);
    }

    return normalizeLegacyProjectorScreenUrls(deviceId ? getCompareDeviceUrl(deviceId) : href);
  }

  if (!normalizedHref.startsWith('/comparison')) {
    return normalizeLegacyProjectorScreenUrls(href);
  }

  const { path, search, hash } = splitHrefParts(normalizedHref);
  const categoryMap = {
    phones: 'phone',
    tablets: 'tablet',
    tvs: 'tv',
    monitors: 'monitor',
    projectors: 'projector',
  } as const;

  if (path === '/comparison' || path === '/comparison/') {
    return normalizeLegacyProjectorScreenUrls(`${getComparisonBrowseUrl()}${search}${hash}`);
  }

  const slug = path.replace(/^\/comparison\//, '').replace(/\/$/, '');

  if (slug in categoryMap) {
    return normalizeLegacyProjectorScreenUrls(`${getComparisonBrowseUrl(categoryMap[slug as keyof typeof categoryMap])}${search}${hash}`);
  }

  const deviceIds = slug.split('-vs-');
  if (deviceIds.length === 2 && deviceIds[0] && deviceIds[1]) {
    return normalizeLegacyProjectorScreenUrls(`${getComparisonEntryUrl(deviceIds[0], deviceIds[1])}${hash}`);
  }

  return normalizeLegacyProjectorScreenUrls(`${getComparisonBrowseUrl()}${search}${hash}`);
}

export function rewriteComparisonLinksInHtml(html: string): string {
  if (isComparisonSeoEnabled() || typeof html !== 'string') {
    return html;
  }

  return normalizeLegacyProjectorScreenUrls(
    html.replace(/\bhref=(["'])([^"']*)\1/g, (match, quote: string, href: string) => {
      const rewrittenHref = rewriteComparisonHrefForSeo(href);
      return rewrittenHref === href ? match : `href=${quote}${rewrittenHref}${quote}`;
    }),
  );
}

/**
 * Link data for comparison pages with SEO attributes
 */
export interface ComparisonLinkData {
  href: string;
  isStatic: boolean;
}

/**
 * Generate internal comparison link data.
 * All internal comparison links should point to canonical static pages.
 *
 * @param id1 - First device ID
 * @param id2 - Second device ID
 * @returns Link data
 */
export function getComparisonLink(id1: string, id2: string): ComparisonLinkData {
  const comparisonSeoEnabled = isComparisonSeoEnabled();
  return {
    href: comparisonSeoEnabled ? getComparisonUrl(id1, id2) : getCompareToolUrl(id1, id2),
    isStatic: comparisonSeoEnabled,
  };
}
