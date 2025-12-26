# Astro Starter Kit: Basics

```sh
npm create astro@latest -- --template basics
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 📅 Page Date Logic (SEO)

页面更新日期用于 Schema.org `dateModified`、OG `article:modified_time` 和 Sitemap `lastmod`。

### 日期策略

采用 **模板版本日期** 作为保底，内容日期优先的策略：

```
最终日期 = MAX(内容日期, 模板版本日期)
```

### 各页面类型日期来源

| 页面类型 | 日期计算 | 相关文件 |
|----------|----------|----------|
| 设备详情页 | `MAX(device.updatedAt, templateVersions.deviceTemplate)` | `[deviceId]-screen-size.astro` |
| 对比页 | `MAX(deviceA.updatedAt, deviceB.updatedAt, templateVersions.comparisonTemplate)` | `comparison/[slug].astro` |
| 博客页 | `MAX(updatedDate \|\| pubDate, templateVersions.blogTemplate)` | `BlogPost.astro` |
| 静态页 | `templateVersions.staticPages` | `astro.config.mjs` |

### 配置项 (`src/site.config.ts`)

```typescript
export const templateVersions = {
  deviceTemplate: '2025-12-26',      // 设备详情页模板版本
  comparisonTemplate: '2025-12-26',  // 对比页模板版本
  blogTemplate: '2025-12-26',        // 博客模板版本
  staticPages: '2025-12-26',         // 静态页版本
};
```

### 何时更新模板版本日期

- **修改模板布局/结构**时：更新对应的模板版本日期
- **修改设备数据**时：更新 `device.updatedAt` 字段
- **修改博客内容**时：更新 frontmatter 中的 `updatedDate`

### 日期处理流程

1. **页面渲染**：计算 `MAX(内容日期, 模板日期)` 用于 Schema.org 和 OG 标签
2. **Sitemap 生成**：`astro.config.mjs` 中的 `serialize` 函数使用相同逻辑计算 `lastmod`

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
