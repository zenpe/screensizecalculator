# Astro Starter Kit: Basics

```sh
npm create astro@latest -- --template basics
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 📅 Page Date Logic (SEO)

页面更新日期用于 Schema.org `dateModified` 和 OG `article:modified_time`。

### 各页面类型日期策略

| 页面类型 | 日期来源 | 文件 |
|----------|----------|------|
| 设备页 | `MAX(device.updatedAt, 分散日期)` | `[deviceId]-screen-size.astro` |
| 比较页 | `MAX(两设备updatedAt, 分散日期)` | `comparison/[slug].astro` |
| 博客页 | frontmatter `pubDate`/`updatedDate` | `BlogPost.astro` |
| 静态页 | `contentDates.staticContent` (仅sitemap) | `astro.config.mjs` |

### 分散日期算法 (`src/site.config.ts`)

避免所有页面日期相同，基于页面ID生成分散日期：

```
基准 = 周一（动态选择）
偏移 = hash(pageId) % 7  → 0-6天
日期 = MIN(基准 + 偏移, 今天)
```

**基准选择：**
- 周一~周三构建 → 用上周一（日期距今 2-10 天）
- 周四~周日构建 → 用本周一（日期距今 0-6 天）

### 配置项 (`src/site.config.ts`)

| 配置 | 用途 |
|------|------|
| `contentDates.blogContent` | 博客页 sitemap lastmod |
| `contentDates.staticContent` | 静态页 sitemap lastmod |

---

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   └── favicon.svg
├── src
│   ├── assets
│   │   └── astro.svg
│   ├── components
│   │   └── Welcome.astro
│   ├── layouts
│   │   └── Layout.astro
│   └── pages
│       └── index.astro
└── package.json
```

To learn more about the folder structure of an Astro project, refer to [our guide on project structure](https://docs.astro.build/en/basics/project-structure/).

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |
| `npm run generate:og`     | Generate Open Graph images for all pages         |
| `npm run push:google`     | Push sitemap or specific URLs to Google Indexing |

## 🛠 Custom Scripts

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

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
