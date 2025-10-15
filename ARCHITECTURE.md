# PaperCMS Architecture

## Content Generation Strategy

PaperCMS uses a **unified HTML generation approach** that serves both SEO and SPA needs from a single source.

### Why This Design?

Previously, the system generated TWO separate HTML outputs:
- `static/*.html` - Full pages for SEO with redirect scripts
- `public/content/*.html` - HTML fragments for SPA

This was redundant and added complexity. The new architecture consolidates both into a single, efficient approach.

---

## Current Architecture

### Single Source of Truth: `public/content/*.html`

Each article generates ONE full HTML file that serves multiple purposes:

1. **SEO & Social Media** (Direct Access)
   - Full HTML page with complete `<head>` section
   - Open Graph meta tags for Facebook/LinkedIn
   - Twitter Card meta tags
   - Schema.org structured data (JSON-LD)
   - Canonical URLs pointing to itself
   - Direct link: `https://yoursite.com/public/content/article-name.html`

2. **SPA Content** (JavaScript Extraction)
   - SPA fetches the same HTML file
   - Extracts content from `<main id="article-content">`
   - Inserts extracted content into SPA container
   - Fetches metadata separately from JSON API

3. **Human Visitors** (Optional Redirect)
   - Page includes "View Interactive Version →" link
   - Works standalone without JavaScript
   - Users can choose to view SPA or static version

---

## Generation Pipeline

```
content/*.md (Markdown source)
     ↓
php/generate.php (Orchestration)
     ↓
     ├── php/markdown-to-json.php → public/api/publications.json
     ├── php/html-content-generator.php → public/content/*.html
     └── php/sitemap-generator.php → sitemap.xml
```

### 1. Markdown to JSON API
**File**: `php/markdown-to-json.php`
**Output**: `public/api/publications.json`
**Purpose**: Article metadata for SPA navigation

### 2. HTML Content Generation
**File**: `php/html-content-generator.php`
**Output**: `public/content/*.html`
**Purpose**: Full HTML pages with SEO meta tags + article content

**Generated HTML Structure**:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Article Title - Gabriel Baude</title>
    <meta name="description" content="...">

    <!-- Open Graph -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="...">
    <meta property="og:title" content="...">
    <meta property="og:image" content="...">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:title" content="...">

    <!-- Structured Data -->
    <script type="application/ld+json">{...}</script>

    <!-- SPA Styles -->
    <link rel="stylesheet" href="css/base.css">
    ...
</head>
<body>
    <a href="#project/article-name" class="spa-redirect">View Interactive Version →</a>

    <main class="content-wrapper" id="article-content">
        <!-- Article content sections -->
        <section>...</section>
    </main>

    <script>
        // Chart.js initialization if needed
    </script>
</body>
</html>
```

### 3. Sitemap Generation
**File**: `php/sitemap-generator.php`
**Output**: `sitemap.xml` + `robots.txt`
**Purpose**: SEO discovery

**Sitemap URLs**:
```xml
<url>
    <loc>https://yoursite.com/public/content/article-name.html</loc>
    <lastmod>2024-12-22</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
</url>
```

---

## SPA Integration

### Content Service (`js/services/contentService.js`)

```javascript
async getProject(slug) {
    // 1. Fetch full HTML page
    const fullHtmlText = await fetch(`./public/content/${slug}.html`);

    // 2. Extract just the article content
    const html = this.extractArticleContent(fullHtmlText);

    // 3. Fetch metadata from JSON API
    const metadata = await this.getProjects();

    return { html, metadata };
}

extractArticleContent(fullHtml) {
    // Extract content from <main id="article-content">
    const match = fullHtml.match(/<main[^>]*id="article-content"[^>]*>([\s\S]*?)<\/main>/);
    return match ? match[1].trim() : fullHtml;
}
```

---

## Benefits of This Architecture

### ✅ Simplified
- One generator instead of two
- One output location instead of two
- One source of truth

### ✅ Performant
- No redirect delays for direct access
- SPA still gets pre-rendered HTML
- Smaller bundle size (removed 400+ lines of client-side parsing)

### ✅ SEO-Friendly
- Full meta tags for crawlers
- Actual content (not just preview)
- Clean, semantic HTML
- No JavaScript required for crawlers

### ✅ Maintainable
- Single template to update
- Consistent structure across all pages
- Less code to maintain

### ✅ Flexible
- Works as standalone pages
- Works with SPA extraction
- Works for social media bots
- Works for search engine crawlers

---

## File Structure

```
paperCMS/
├── content/                  # Markdown source files
│   ├── article-1.md
│   └── article-2.md
├── public/
│   ├── api/
│   │   └── publications.json # Metadata for SPA
│   └── content/              # Full HTML pages (SEO + SPA)
│       ├── article-1.html
│       └── article-2.html
├── php/
│   ├── generate.php          # Main build script
│   ├── markdown-to-json.php
│   ├── html-content-generator.php
│   ├── sitemap-generator.php
│   └── config.php
├── js/
│   └── services/
│       └── contentService.js  # SPA content loading
├── sitemap.xml               # SEO sitemap
└── robots.txt                # Crawler instructions
```

---

## Removed Components

The following have been removed as part of the consolidation:

- ❌ `php/static-page-generator.php` - Redundant generator
- ❌ `static/` directory - Redundant output location
- ❌ Separate static page generation step in `generate.php`

---

## Running the Build

```bash
# Generate all content (JSON API + HTML pages + sitemap)
php php/generate.php

# Or via web interface
open http://localhost:8000/php/generate.php
```

**Output**:
- 📄 10 HTML Pages (SEO + SPA) → `public/content/*.html`
- 📋 1 JSON API → `public/api/publications.json`
- 🗺️ 1 Sitemap → `sitemap.xml`

---

## Summary

**Old Approach**: Generate HTML fragments for SPA + separate full pages for SEO
**New Approach**: Generate full pages that work for both SEO and SPA

**Result**: Cleaner, lighter, more maintainable architecture with no loss of functionality.
