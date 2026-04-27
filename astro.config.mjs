// @ts-check
import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { devices } from './src/data/devices.ts';
import {
  isComparisonSeoEnabled,
  templateVersions,
} from './src/site.config.ts';
import { rewriteComparisonHrefForSeo } from './src/utils/url.ts';
import { shouldIndexComparison } from './src/utils/comparison-scoring/index.ts';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import rehypeExternalLinks from 'rehype-external-links';

function removeComparisonSeoOutput() {
  return {
    name: 'remove-comparison-seo-output',
    hooks: {
      'astro:build:done'() {
        if (isComparisonSeoEnabled()) return;

        const distDir = resolve(process.cwd(), 'dist');
        const targets = [
          resolve(distDir, 'comparison'),
          resolve(distDir, 'comparison.html'),
        ];

        for (const target of targets) {
          if (!existsSync(target)) continue;
          rmSync(target, { recursive: true, force: true });
        }
      },
    },
  };
}

function rewriteComparisonLinks() {
  return (tree) => {
    if (isComparisonSeoEnabled()) return;

    const visit = (node) => {
      if (!node || typeof node !== 'object') return;

      if (
        node.type === 'element' &&
        node.tagName === 'a' &&
        node.properties &&
        typeof node.properties.href === 'string'
      ) {
        node.properties.href = rewriteComparisonHrefForSeo(node.properties.href);
      }

      if (Array.isArray(node.children)) {
        for (const child of node.children) {
          visit(child);
        }
      }
    };

    visit(tree);
  };
}

// Create a map for faster device date lookups.
const deviceDateMap = new Map(devices.filter(d => d.updatedAt).map(d => [d.id, d.updatedAt]));
const blogContentDir = join(process.cwd(), 'src', 'content', 'blog');
const staticPagesDir = join(process.cwd(), 'src', 'pages');

function getFrontmatterDate(frontmatter, field) {
  const match = frontmatter.match(new RegExp(`^\\s*${field}:\\s*["']?([0-9]{4}-[0-9]{2}-[0-9]{2})["']?\\s*$`, 'm'));
  return match ? match[1] : null;
}

function getConstDate(fileContent, field) {
  const match = fileContent.match(new RegExp(`(?:^|\\n)\\s*const\\s+${field}\\s*=\\s*["']([0-9]{4}-[0-9]{2}-[0-9]{2})["']\\s*;?`, 'm'));
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
const staticPageDateMap = getStaticPageDateMap();
const latestBlogDate = getLatestDate(...blogDateMap.values());

// Helper: get the latest date from multiple date strings
function getLatestDate(...dates) {
  const validDates = dates.filter(d => d).map(d => new Date(d).getTime());
  if (validDates.length === 0) return null;
  return new Date(Math.max(...validDates)).toISOString();
}

function getStaticPageDateMap() {
  const map = new Map();

  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (!entry.isFile() || extname(entry.name).toLowerCase() !== '.astro') continue;

      const relativePath = fullPath.slice(staticPagesDir.length + 1).replace(/\\/g, '/');
      if (relativePath.includes('[')) continue;

      const fileContent = readFileSync(fullPath, 'utf8');
      const updatedDate = getConstDate(fileContent, 'updatedDate');
      if (!updatedDate) continue;

      map.set(getStaticPageRoute(relativePath), updatedDate);
    }
  }

  walk(staticPagesDir);
  return map;
}

function getStaticPageRoute(relativePath) {
  const normalized = relativePath.replace(/\\/g, '/').replace(/\.astro$/, '');
  if (normalized === 'index') return '/';
  if (normalized.endsWith('/index')) return `/${normalized.slice(0, -'/index'.length)}`;
  return `/${normalized}`;
}

function getPagePath(url) {
  try {
    const pathname = new URL(url).pathname.replace(/\/$/, '');
    return pathname || '/';
  } catch {
    const pathname = url.replace(/^https?:\/\/[^/]+/i, '').replace(/\/$/, '');
    return pathname || '/';
  }
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
    removeComparisonSeoOutput(),
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
        if (!isComparisonSeoEnabled() && page.includes('/comparison')) {
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
          const pagePath = getPagePath(page.url);
          lastmod = getLatestDate(
            staticPageDateMap.get(pagePath),
            templateVersions.staticPages
          );
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
      rewriteComparisonLinks,
      [rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }]
    ]
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
