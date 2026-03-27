// @ts-check
import { readdirSync, readFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { devices } from './src/data/devices.ts';
import { templateVersions } from './src/site.config.ts';
import { shouldIndexComparison } from './src/utils/comparison-scoring/index.ts';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import rehypeExternalLinks from 'rehype-external-links';

// Create a map for faster device date lookups.
const deviceDateMap = new Map(devices.filter(d => d.updatedAt).map(d => [d.id, d.updatedAt]));
const blogContentDir = join(process.cwd(), 'src', 'content', 'blog');

function getFrontmatterDate(frontmatter, field) {
  const match = frontmatter.match(new RegExp(`^\\s*${field}:\\s*["']?([0-9]{4}-[0-9]{2}-[0-9]{2})["']?\\s*$`, 'm'));
  return match ? match[1] : null;
}

function getBlogDateMap() {
  const map = new Map();

  for (const entry of readdirSync(blogContentDir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;

    const extension = extname(entry.name).toLowerCase();
    if (!['.md', '.mdx'].includes(extension)) continue;

    const fileContent = readFileSync(join(blogContentDir, entry.name), 'utf8');
    const frontmatterMatch = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!frontmatterMatch) continue;

    const frontmatter = frontmatterMatch[1];
    const pubDate = getFrontmatterDate(frontmatter, 'pubDate');
    const updatedDate = getFrontmatterDate(frontmatter, 'updatedDate');
    const contentDate = updatedDate || pubDate;

    if (contentDate) {
      map.set(basename(entry.name, extension), contentDate);
    }
  }

  return map;
}

const blogDateMap = getBlogDateMap();
const latestBlogDate = getLatestDate(...blogDateMap.values());

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
        if (
          page.includes('/404') ||
          page.includes('/terms') ||
          page.includes('/privacy') ||
          page.includes('/compare')
        ) {
          return false;
        }
        // Exclude noindexed comparison pages from sitemap
        if (page.includes('/comparison/') && !page.endsWith('/comparison')) {
          const slug = page.split('/comparison/').pop()?.replace(/\/$/, '');
          const hubSlugs = ['phones', 'tablets', 'monitors', 'tvs', 'projectors'];
          if (slug && !hubSlugs.includes(slug)) {
            return shouldIndexComparison(slug);
          }
        }
        return true;
      },
      serialize(page) {
        /** @type {string | null} */
        let lastmod = null;
        const blogSlugMatch = page.url.match(/\/blog\/([^/?#]+)\/?$/);

        // Rule 1: Blog Posts (from blog content frontmatter)
        if (blogSlugMatch) {
          const slug = blogSlugMatch[1];
          const contentDate = blogDateMap.get(slug);
          lastmod = getLatestDate(contentDate, templateVersions.blogTemplate);
        }
        // Rule 1b: Blog index page
        else if (page.url.match(/\/blog\/?$/)) {
          lastmod = getLatestDate(latestBlogDate, templateVersions.blogTemplate);
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
        else if (page.url.match(/\/([a-zA-Z0-9-]+)-screen-size\/?$/)) {
          const match = page.url.match(/\/([a-zA-Z0-9-]+)-screen-size\/?$/);
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
