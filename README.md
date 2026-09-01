# Screen Size Calculator

A static site for visual screen size comparison and calculation tools, built with Astro + React + Tailwind CSS.

**Live**: https://calc.screensize.net

## Project Structure

```
src/
├── components/           # UI components (Astro + React islands)
│   ├── ComparisonVisualizer/   # Interactive overlay/side-by-side views
│   ├── ScreenSizeCalculator/   # Main calculator with calibration
│   ├── calculators/            # PPI, aspect ratio, resolution calculators
│   ├── icons/                  # SVG icon components
│   └── shared/                 # Shared UI primitives
├── config/
│   └── navigation.ts     # Nav bar configuration
├── content/
│   └── blog/             # MDX blog posts
├── data/
│   ├── devices.ts        # 69 devices (phones, tablets, monitors, TVs, projectors)
│   └── comparison-signals.json  # GSC impression data for demand scoring
├── layouts/
│   ├── Layout.astro      # Base layout (SEO meta, schema, dark mode)
│   └── BlogPost.astro    # Blog post layout
├── pages/
│   ├── index.astro                  # Homepage
│   ├── [deviceId]-screen-size.astro # Device detail pages (68 pages)
│   ├── compare.astro                # Interactive compare tool
│   ├── comparison/
│   │   ├── [slug].astro             # Static comparison pages (~781 pairs)
│   │   ├── index.astro              # Comparison hub
│   │   ├── phones/index.astro       # Phone comparisons hub
│   │   ├── tablets/index.astro      # Tablet comparisons hub
│   │   ├── monitors/index.astro     # Monitor comparisons hub
│   │   ├── tvs/index.astro          # TV comparisons hub
│   │   └── projectors/index.astro   # Projector comparisons hub
│   ├── blog/                        # Blog index + [slug]
│   ├── devices/                     # Device listing by category
│   ├── resources/                   # Guides (common sizes, PPI, aspect ratio)
│   └── *-calculator.astro           # Calculator tool pages
├── utils/
│   ├── comparison-scoring/          # Scoring engine (see below)
│   ├── comparison.ts                # Pair generation utilities
│   ├── comparisonContent.ts         # Dynamic content generation for comparison pages
│   ├── contentVariants.ts           # Deterministic content variation via seed hashing
│   ├── calculations.ts              # Screen math (PPI, area, dimensions)
│   ├── deviceAge.ts                 # Device age/release date helpers
│   └── url.ts                       # URL generation and slug canonicalization
├── site.config.ts         # Site-wide config (SEO, affiliate, scoring rules)
└── styles/
    └── global.css         # Tailwind base styles
scripts/
├── generate-og-images.ts  # OG image generation via Satori + Sharp
└── push-to-google.ts      # Google Indexing API submission
```

## Commands

| Command | Action |
|:--|:--|
| `npm install` | Install dependencies |
| `npm run dev` | Dev server at `localhost:4321` |
| `npm run build` | Production build to `./dist/` |
| `npm run preview` | Preview production build locally |
| `npm run astro ...` | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI |
| `npm run generate:og` | Generate OG images for all pages |
| `npm run push:google` | Push URLs to Google Indexing API |

### Google Indexing (`push:google`)

Automate URL submission to Google Search Console for faster indexing.

- **Default (Sitemap)**: Parses `dist/` for sitemaps and pushes the top 200 most recently updated URLs.
  ```sh
  npm run push:google
  ```
- **Manual URLs**: Submit specific comma-separated URLs.
  ```sh
  npm run push:google -- --urls "https://example.com/p1,https://example.com/p2"
  ```
- **File Input**: Submit URLs listed in a text file (one per line).
  ```sh
  npm run push:google -- --file urls.txt
  ```

> [!NOTE]
> Authentication requires the Service Account JSON key located in `scripts/`.

## Comparison / Compare

Two distinct page types serve different purposes:

| | `/comparison/a-vs-b` | hash-based `/compare` tool URL |
|--|--|--|
| Type | Static (SSG) | Dynamic tool page |
| SEO | Selectively indexed via scoring engine | Indexable canonical tool page |
| Sitemap | Only indexed pairs included | Included as `/compare` |
| Content | Rich (FAQ, specs, expert summary) | Interactive tool only |

`src/site.config.ts` controls whether static comparison SEO pages are live:

```ts
siteConfig.features.comparisonSeoPages
```

- `true`: internal comparison links resolve to `/comparison/*`, comparison pages remain in `dist`, and indexed pairs can enter the sitemap.
- `false`: public comparison links resolve to hash-based `/compare#...` entries, category browse links fall back to `/devices/*`, built `dist/comparison*` output is deleted after build, sitemap excludes all comparison URLs, and markdown/blog links are rewritten at build time so published HTML does not keep pointing at removed comparison pages.

Use `getComparisonLink()`, `getCompareToolUrl()`, and `getComparisonBrowseUrl()` for internal routing instead of hardcoding `/comparison/*`.

### Sitemap Rules

- `/compare`, device pages, blog posts, calculators, and core static pages are included.
- `privacy`, `terms`, `404`, and deprecated `comparison` pages are excluded from sitemap.

## Comparison Scoring Engine

`src/utils/comparison-scoring/` controls which comparison pages get indexed.

### How It Works

1. **Hard rules** filter out invalid pairs (missing data, self-comparison, non-canonical slug, invalid category cross)
2. **Scorers** evaluate each valid pair on a 0-1 scale, weighted per track profile
3. **Quota + threshold** selection: pairs are ranked by score, capped by category quota, filtered by track threshold
4. **Duplicate penalty** prevents one device from dominating the index
5. **Per-device cap** limits how many indexed pairs any single device can appear in

### Tracks

| Track | When | Description |
|--|--|--|
| `model` | Both devices are named models (iPhone, Samsung, iPad, Pixel, Surface) | Emphasizes intent, generation, demand |
| `sizeProfile` | Both are generic sizes (65" TV, 27" Monitor) | Emphasizes intent, scene, completeness |
| `mixed` | One model + one size profile | Stricter threshold (70 vs 55/50) |

### Scorers

| Scorer | What it measures |
|--|--|
| `intent` | Purchase decision relevance (cross-brand, same-gen, flagship tier, adjacent sizes) |
| `generation` | Release year proximity (same year = 1.0, 1yr gap = 0.85, ...) |
| `demand` | GSC impression data (log-normalized); neutral default when no data |
| `completeness` | Data richness (resolution, phone specs, price, expert summary) |
| `recency` | How recent the newer device is (6mo = 1.0, decaying to 0.08) |
| `quality` | Content quality (expert summary length, spec completeness) |
| `scene` | Usage scenario match (same category, TV vs projector, size similarity) |

### Configuration (`src/site.config.ts`)

```typescript
comparisonIndexConfig = {
  enabled: true,          // false = shadow mode (all indexed, scores still computed)
  thresholds: { model: 55, sizeProfile: 50, mixed: 70 },
  categoryQuotas: { phone: 200, tablet: 60, monitor: 15, tv: 36, projector: 3, 'projector-tv': 27 },
  selectionPolicy: {
    maxIndexedPerDevice: { model: 8, sizeProfile: 12, mixed: 4 },
    duplicatePenalty: { startsAfter: 6, perExtra: 2, max: 12 },
  },
  pinnedSlugs: [],        // Force-index specific slugs
  profiles: { ... },      // Per-track scorer weights (must sum to 100)
}
```

### Build Artifacts

- `dist/score-report.json` — Full scoring report with per-pair breakdown, generated on every build
- Pages with `shouldIndex: false` get `<meta name="robots" content="noindex">` and are excluded from sitemap

### Hub Page Behavior

Category hub pages (phones, tablets, etc.) only list indexed pairs in their link sections. The search component receives all pairs so users can find any comparison.

## Page Date Logic (SEO)

Page dates drive Schema.org `dateModified`, OG `article:modified_time`, and Sitemap `lastmod`:

```
Final date = MAX(content date, template version date)
```

| Page Type | Date Calculation |
|--|--|
| Device detail | `MAX(device.updatedAt, templateVersions.deviceTemplate)` |
| Comparison | `MAX(deviceA.updatedAt, deviceB.updatedAt, templateVersions.comparisonTemplate)` |
| Blog | `MAX(updatedDate \|\| pubDate, templateVersions.blogTemplate)` |
| Static pages | `MAX(page updatedDate, templateVersions.staticPages)` |

Update template version dates in `src/site.config.ts` only when you modify the actual template markup.

### When to Update Dates

- **Modify template layout/structure** → update the corresponding `templateVersions.*` date
- **Modify device data** → update `device.updatedAt` field in `devices.ts`
- **Modify blog content** → update `updatedDate` in frontmatter
- **Modify a static `.astro` page's content** → update that page's `const updatedDate = 'YYYY-MM-DD'`

### Processing Flow

1. **Page rendering**: computes `MAX(content date, template date)` for Schema.org and OG tags
2. **Sitemap generation**: `astro.config.mjs` `serialize` function uses the same logic for `lastmod`

## Tech Stack

- **Framework**: Astro 5 (static SSG)
- **UI**: React 19 (interactive islands), Tailwind CSS 4
- **Content**: MDX blog posts
- **Build tools**: Satori + Sharp (OG images), tsx (scripts)
- **Testing**: Vitest (unit), CJS post-build scripts (regression)
- **APIs**: Google Indexing API, Amazon Associates
