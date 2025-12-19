// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { devices } from './src/data/devices.ts';
import { getCollection } from 'astro:content';
import { contentDates } from './src/site.config.ts';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import rehypeExternalLinks from 'rehype-external-links';

// Create maps for faster date lookups
const deviceDateMap = new Map(devices.map(d => [d.id, d.updatedAt]));

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
      async serialize(page) {
        let pageSpecificDateStr;
        let templateDateStr;

        // Rule 1: Blog Posts
        if (page.url.includes('/blog/')) {
          const blogSlug = page.url.split('/blog/').pop().replace(/\/$/, '');
          if (blogSlug) {
            const blogCollection = await getCollection('blog');
            const blogPost = blogCollection.find(p => p.slug === blogSlug);
            pageSpecificDateStr = blogPost?.data.pubDate;
          }
          templateDateStr = contentDates.blogContent;
        }
        // Rule 2: Comparison Pages
        else if (page.url.includes('/comparison/')) {
          const slug = page.url.split('/comparison/').pop().replace(/\/$/, '');
          const deviceIds = slug.split('-vs-');
          if (deviceIds.length === 2) {
            const date1 = deviceDateMap.get(deviceIds[0]);
            const date2 = deviceDateMap.get(deviceIds[1]);
            const dates = [date1, date2].filter(Boolean).map(d => new Date(d).getTime());
            if (dates.length > 0) {
              pageSpecificDateStr = new Date(Math.max(...dates)).toISOString();
            }
          }
          templateDateStr = contentDates.deviceContent;
        }
        // Rule 3: Device Detail Pages
        else if (page.url.match(/\/([a-zA-Z0-9-]+)-screen-size/)) {
          const deviceId = page.url.match(/\/([a-zA-Z0-9-]+)-screen-size/)[1];
          pageSpecificDateStr = deviceDateMap.get(deviceId);
          templateDateStr = contentDates.deviceContent;
        }
        // Rule 4: All other (static) pages
        else {
          templateDateStr = contentDates.staticContent;
        }

        // Combine dates and find the most recent one
        const datesToCompare = [];
        if (pageSpecificDateStr) datesToCompare.push(new Date(pageSpecificDateStr));
        if (templateDateStr) datesToCompare.push(new Date(templateDateStr));

        if (datesToCompare.length > 0) {
          const lastmod = new Date(Math.max(...datesToCompare.map(d => d.getTime()))).toISOString();
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