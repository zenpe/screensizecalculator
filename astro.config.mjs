// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { devices } from './src/data/devices.ts';
import { templateVersions, indexedComparisons } from './src/site.config.ts';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import rehypeExternalLinks from 'rehype-external-links';

// Create a map for faster device date lookups.
const deviceDateMap = new Map(devices.filter(d => d.updatedAt).map(d => [d.id, d.updatedAt]));

// Helper: get the latest date from multiple date strings
function getLatestDate(...dates) {
  const validDates = dates.filter(d => d).map(d => new Date(d).getTime());
  if (validDates.length === 0) return null;
  return new Date(Math.max(...validDates)).toISOString();
}

// https://astro.build/config
export default defineConfig({
  site: 'https://screensizecalculators.com',
  trailingSlash: 'never',
  build: {
    format: 'file'
  },
  integrations: [
    react(),
    mdx(),
    sitemap({
      filter: (page) => {
        // Exclude utility/legal pages from sitemap
        if (page.includes('/404') || page.includes('/terms') || page.includes('/privacy')) {
          return false;
        }
        // Exclude noindex comparison pages from sitemap
        if (page.includes('/comparison/') && page.includes('-vs-')) {
          const slug = page.split('/comparison/').pop()?.replace(/\/$/, '') || '';
          return indexedComparisons.has(slug);
        }
        return true;
      },
      serialize(page) {
        /** @type {string | null} */
        let lastmod = null;

        // Rule 1: Blog Posts (from content collections)
        // @ts-ignore - entry is provided by sitemap integration for content collection pages
        if (page.entry && page.entry.data && page.entry.data.pubDate) {
          // @ts-ignore
          const contentDate = page.entry.data.updatedDate || page.entry.data.pubDate;
          lastmod = getLatestDate(contentDate, templateVersions.blogTemplate);
        }
        // Rule 2: Comparison Pages
        else if (page.url.includes('/comparison/')) {
          const urlPart = page.url.split('/comparison/').pop();
          const slug = urlPart ? urlPart.replace(/\/$/, '') : '';
          const deviceIds = slug.split('-vs-');

          if (deviceIds.length === 2) {
            const date1 = deviceDateMap.get(deviceIds[0]);
            const date2 = deviceDateMap.get(deviceIds[1]);
            lastmod = getLatestDate(date1, date2, templateVersions.comparisonTemplate);
          } else {
            lastmod = getLatestDate(templateVersions.comparisonTemplate);
          }
        }
        // Rule 3: Device Detail Pages
        else if (page.url.match(/\/([a-zA-Z0-9-]+)-screen-size/)) {
          const match = page.url.match(/\/([a-zA-Z0-9-]+)-screen-size/);
          const deviceId = match ? match[1] : null;
          const deviceDate = deviceId ? deviceDateMap.get(deviceId) : null;
          lastmod = getLatestDate(deviceDate, templateVersions.deviceTemplate);
        }
        // Rule 4: All other (static) pages
        else {
          lastmod = getLatestDate(templateVersions.staticPages);
        }

        if (lastmod) {
          return {
            url: page.url,
            lastmod: lastmod,
          };
        }

        // Fallback for pages with no date info
        return page;
      },
    }),
  ],
  markdown: {
    rehypePlugins: [
      [rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }]
    ]
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
