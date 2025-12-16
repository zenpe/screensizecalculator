// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import rehypeExternalLinks from 'rehype-external-links';

// https://astro.build/config
export default defineConfig({
  site: 'https://screensizecalculators.com',
  trailingSlash: 'never', // Remove trailing slashes
  build: {
    format: 'file' // Use file-based routing instead of directory-based
  },
  integrations: [react(), mdx(), sitemap()],
  markdown: {
    rehypePlugins: [
      [rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }]
    ]
  },
  vite: {
    plugins: [tailwindcss()]
  }
});