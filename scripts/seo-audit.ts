import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

type IssueLevel = 'error' | 'warning';

interface Issue {
  level: IssueLevel;
  file: string;
  message: string;
}

const rootDir = process.cwd();
const distDir = join(rootDir, 'dist');
const blogDir = join(rootDir, 'src', 'content', 'blog');
const comparisonGoneFunctionPath = join(rootDir, 'functions', 'comparison', '[[path]].js');
const issues: Issue[] = [];

function addIssue(level: IssueLevel, file: string, message: string) {
  issues.push({ level, file, message });
}

function walkFiles(dir: string, extensions: string[]): string[] {
  if (!existsSync(dir)) return [];

  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...walkFiles(fullPath, extensions));
      continue;
    }

    if (stat.isFile() && extensions.includes(extname(entry).toLowerCase())) {
      files.push(fullPath);
    }
  }

  return files;
}

function getFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};

  const data: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const item = line.match(/^\s*([A-Za-z0-9_-]+):\s*['"]?(.+?)['"]?\s*$/);
    if (!item) continue;
    data[item[1]] = item[2];
  }

  return data;
}

function auditDist() {
  if (!existsSync(distDir)) {
    addIssue('error', 'dist', 'Missing dist directory. Run npm run build before npm run audit:seo.');
    return;
  }

  const distFiles = walkFiles(distDir, ['.html', '.xml']);
  for (const file of distFiles) {
    const text = readFileSync(file, 'utf8');
    const rel = relative(rootDir, file);

    if (/\/compare\?/.test(text)) {
      addIssue('error', rel, 'Found query-based compare link in built HTML/XML.');
    }

    if (/\/comparison\/|\/comparison\.html/.test(text)) {
      addIssue('error', rel, 'Found deprecated comparison URL in built HTML/XML.');
    }

    if (/\/[a-z0-9-]+-projector-screen-screen-size\b/i.test(text)) {
      addIssue('error', rel, 'Found legacy double screen-size projector URL in built HTML/XML.');
    }
  }

  if (existsSync(join(distDir, 'comparison'))) {
    addIssue('error', 'dist/comparison', 'Deprecated comparison output directory exists.');
  }

  if (existsSync(join(distDir, 'comparison.html'))) {
    addIssue('error', 'dist/comparison.html', 'Deprecated comparison index output exists.');
  }

  if (!existsSync(comparisonGoneFunctionPath)) {
    addIssue('error', 'functions/comparison/[[path]].js', 'Missing Cloudflare Pages Function for true 410 responses on deprecated comparison URLs.');
  }

  if (!existsSync(join(distDir, '_redirects'))) {
    addIssue('warning', 'dist/_redirects', 'Missing built _redirects file.');
  }

  if (!existsSync(join(distDir, '410.html'))) {
    addIssue('warning', 'dist/410.html', 'Missing built 410 page for removed comparison URLs.');
  }

  if (!existsSync(join(distDir, 'sitemap-index.xml'))) {
    addIssue('error', 'dist/sitemap-index.xml', 'Missing sitemap index.');
  }
}

function auditRobots() {
  const robotsPath = join(rootDir, 'public', 'robots.txt');
  if (!existsSync(robotsPath)) {
    addIssue('error', 'public/robots.txt', 'Missing robots.txt.');
    return;
  }

  const robots = readFileSync(robotsPath, 'utf8');
  if (!/Sitemap:\s*https:\/\/screensizecalculators\.com\/sitemap-index\.xml/i.test(robots)) {
    addIssue('warning', 'public/robots.txt', 'robots.txt should point to the production sitemap-index.xml.');
  }
}

function auditBlogContent() {
  const posts = walkFiles(blogDir, ['.md', '.mdx']);
  if (posts.length < 30) {
    addIssue('warning', 'src/content/blog', `Only ${posts.length} blog posts found. Content clusters are still shallow.`);
  }

  for (const file of posts) {
    const rel = relative(rootDir, file);
    const data = getFrontmatter(readFileSync(file, 'utf8'));
    const title = data.title ?? '';
    const description = data.description ?? '';

    if (!title) {
      addIssue('error', rel, 'Missing blog title.');
    } else if (title.length > 70) {
      addIssue('warning', rel, `Blog title is ${title.length} characters; keep search titles tighter when possible.`);
    }

    if (!description) {
      addIssue('error', rel, 'Missing blog description.');
    } else if (description.length < 110 || description.length > 170) {
      addIssue('warning', rel, `Blog description is ${description.length} characters; target roughly 120-160.`);
    }

    if (!data.pubDate) {
      addIssue('error', rel, 'Missing blog pubDate.');
    }

    if (!data.updatedDate) {
      addIssue('warning', rel, 'Missing updatedDate; add it when the article is materially refreshed.');
    }
  }
}

auditDist();
auditRobots();
auditBlogContent();

const errors = issues.filter((issue) => issue.level === 'error');
const warnings = issues.filter((issue) => issue.level === 'warning');

for (const issue of issues) {
  const prefix = issue.level === 'error' ? 'ERROR' : 'WARN';
  console.log(`${prefix} ${issue.file}: ${issue.message}`);
}

console.log(`\nSEO audit complete: ${errors.length} error(s), ${warnings.length} warning(s).`);

if (errors.length > 0) {
  process.exit(1);
}
