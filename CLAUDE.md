# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Content Processing
```bash
# Generate JSON API and static pages from markdown content
php php/generate.php

# View generation results via web browser
# Visit generate.php directly to see processing stats
```

### Development Server
```bash
# Serve the application locally (PHP required for hybrid routing)
php -S localhost:8000

# Test URLs:
# http://localhost:8000/                    # Homepage (SPA shell)
# http://localhost:8000/projects            # Projects page (SPA shell)  
# http://localhost:8000/project/kanawa      # Article (pre-rendered HTML + SPA)
```

### File Structure Validation
```bash
# Check if content files have proper YAML frontmatter
find content/ -name "*.md" -exec head -10 {} \;
```

## Architecture Overview

PaperCMS is a **hybrid PHP + JavaScript system** that solves the SPA vs SEO dilemma through intelligent routing. Content is processed from Markdown files into both JSON APIs (for SPA functionality) and pre-rendered HTML (for perfect SEO).

### Core Components

**Hybrid Routing System (index.php)**
- **Route Detection**: Analyzes URLs to determine content vs navigation
- **Article Routes**: `/project/slug` → Pre-rendered HTML with perfect SEO
- **Navigation Routes**: `/`, `/projects` → SPA shell with JavaScript enhancement
- **Progressive Enhancement**: Works without JS, amazing with JS

**Content Processing Pipeline (PHP)**
- `php/markdown-to-json.php`: Converts markdown files to JSON API + HTML parsing
- `php/static-page-generator.php`: Generates SEO-friendly static HTML pages  
- `php/sitemap-generator.php`: Creates XML sitemaps for search engines
- `php/generate.php`: Main orchestration script with web UI

**Frontend Application (JavaScript) - Simplified Architecture**
- `js/app.js`: Main application coordinator (simplified from 15+ files)
- `js/core/`: Core routing and meta management
- `js/services/`: Content, search, and chart services
- `js/ui/`: UI components (magazine layout, project grid, settings)
- `js/utils/`: Simple utility functions (storage, resize handling)

**Styling System (CSS)**
- `css/main.css`: Imports all CSS modules
- `css/theme.css`: Advanced theme system (light/night modes with image processing)
- `css/layouts.css`: Magazine-style desktop layouts with media synchronization  
- `css/components.css`: Component-specific styles

### Key Architectural Patterns

**Hybrid Routing Strategy**: 
- **SEO Routes** (`/project/slug`): Pre-rendered HTML with full content, meta tags, and structured data
- **SPA Routes** (`/`, `/projects`): Interactive shell with JavaScript enhancements
- **Single Codebase**: One set of templates serves both crawlers and users

**Content-Driven Architecture**: All content lives in `content/` as Markdown files with YAML frontmatter. The system generates both JSON APIs (for SPA) and HTML (for SEO) from the same source.

**Progressive Enhancement**: 
- **Without JavaScript**: Articles are readable as static HTML with proper SEO
- **With JavaScript**: Full magazine-style experience with media synchronization
- **Backwards Compatible**: Legacy hash URLs automatically redirect

**Simplified State Management**: Eliminated complex service classes in favor of direct function calls and consolidated state in the main app.

### Content Structure

Content files must include YAML frontmatter with required fields:
```yaml
---
title: "Article Title"
description: "SEO description"  
status: "published"  # published, draft, archived
category: "exploration"  # exploration, application, reflexion
date: "2024-01-01"
contributors:
  - name: "Author Name"
    role: "author"
---
```

### Configuration

**Base URL Configuration**: Update `BASE_URL` in `php/config.php` for deployment:
- GitHub Pages: `https://username.github.io/repo-name`  
- Netlify: `https://your-site.netlify.app`
- Custom domain: `https://your-domain.com`

### Special Features

**Chart Integration**: Supports Chart.js visualizations with theme-aware styling:
```markdown
\`\`\`chart-bar
{
  "title": "Chart Title",
  "data": {
    "labels": ["Q1", "Q2", "Q3", "Q4"],
    "datasets": [{"label": "Dataset", "data": [65, 78, 82, 92]}]
  }
}
\`\`\`
```

**Desktop Reading Experience**: On large screens, media content appears in a synchronized sidebar that updates based on reading progress, creating a magazine-style layout.

**Redaction Feature**: Use `~~text~~` for classified document-style black bars to hide sensitive information while maintaining context.

## Development Workflow

1. **Create/edit markdown** files in `content/` directory
2. **Run `php php/generate.php`** to process content into JSON API and static pages  
3. **Test locally**: `php -S localhost:8000` (PHP required for routing)
4. **Deploy**: Update base URL in `php/config.php` and upload to web server

### Key Benefits of This Architecture

- ✅ **Zero Build Steps**: Content processed on-demand
- ✅ **Perfect SEO**: Pre-rendered HTML for crawlers
- ✅ **Progressive Enhancement**: Works without JS, enhanced with JS
- ✅ **Clean URLs**: `/project/article-name` instead of `/#project/article-name`
- ✅ **Social Media Ready**: Rich previews with proper meta tags
- ✅ **Simplified Codebase**: 400+ lines of complexity eliminated

## File Organization

- `content/`: Markdown content files with YAML frontmatter
- `php/`: Server-side processing scripts  
- `js/`: Client-side application code organized by function
- `css/`: Styling system organized by concern
- `static/`: Generated static HTML pages for SEO
- `public/api/`: Generated JSON API endpoints