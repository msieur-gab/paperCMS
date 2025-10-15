# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Content Processing
```bash
# Generate JSON API and static pages from markdown content
php php/generate.php

# Access the generation script via web browser (alternative)
# Open index.html and click "Generate Content" or visit generate.php directly
```

### Development Server
```bash
# Serve the application locally (any HTTP server)
python -m http.server 8000
# or
php -S localhost:8000
# or
npx serve .
```

### File Structure Validation
```bash
# Check if content files have proper YAML frontmatter
find content/ -name "*.md" -exec head -10 {} \;
```

## Architecture Overview

PaperCMS is a PHP-based static site generator that creates a JavaScript SPA from Markdown content. The architecture follows a content-first approach with automatic JSON API generation.

### Core Components

**Content Processing Pipeline (PHP)**
- `php/markdown-to-json.php`: Converts markdown files to JSON API
- `php/static-page-generator.php`: Generates SEO-friendly static HTML pages
- `php/sitemap-generator.php`: Creates XML sitemaps for search engines
- `php/generate.php`: Main orchestration script with web UI

**Frontend Application (JavaScript)**
- `js/app.js`: Main application entry point
- `js/core/`: Core application logic and routing
- `js/services/`: API communication and data services
- `js/ui/`: UI components and interaction handlers
- `js/utils/`: Utility functions and helpers

**Styling System (CSS)**
- `css/base.css`: Base styles and CSS variables
- `css/theme.css`: Theme system (light/night modes)
- `css/typography.css`: Typography and reading experience
- `css/layouts.css`: Layout-specific styles
- `css/components.css`: Component-specific styles

### Key Architectural Patterns

**Content-Driven Architecture**: All content lives in `content/` as Markdown files with YAML frontmatter. The PHP processor converts these into a JSON API (`public/api/publications.json`) that feeds the JavaScript application.

**Dual Rendering Strategy**: 
- SPA for interactive reading experience
- Static HTML pages in `static/` for SEO and social media sharing
- Both use the same content source but different rendering approaches

**Progressive Enhancement**: The application works as static HTML pages even without JavaScript, with the SPA layer enhancing the experience.

**Theme-Aware Media**: Images automatically adapt to theme (grayscale in night mode) and sync with reading progress on desktop layouts.

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

**Advanced Search System**: Power-user search patterns to discover and filter content. See [Search Patterns](#search-patterns) section below.

## Search Patterns

The search system includes sophisticated pattern matching for content discovery and management. By default, only **published** content is visible, but special commands unlock hidden content.

### Status Filters

Reveal content by publication status using prefix patterns:

```bash
# Syntax: --status, #status, or -status

--draft           # Show all draft (unpublished) content
--published       # Show only published content (default)
--archived        # Show archived (deprecated) content
```

**Combine with keywords:**
```bash
--draft AI        # Draft articles mentioning "AI"
--archived design # Archived content about design
#published Japan  # Published content mentioning Japan
```

### Related Content Discovery

Find content networks using reference numbers:

```bash
# Syntax: --related:X, #related:X, or -related:X

--related:3       # Show all content related to publication #3
--related:5 wood  # Related to #5, containing "wood"
```

**How references work:**
Each publication can define a `reference` number and list `related` content in frontmatter:

```yaml
---
title: "Kanawa Joinery"
reference: 3
related:
  - content/pebbble.md
  - content/slow-design-md.md
---
```

Searching `--related:3` finds all publications listed in this article's `related` field.

### Pattern Combinations

Multiple patterns and keywords can be combined:

```bash
--draft --related:2       # Related drafts
--archived AI design      # Archived AI design content
#related:1 exploration    # Related exploration category content
```

### Technical Implementation

The search patterns are implemented in `js/services/searchService.js`:

- **Status patterns**: Lines 44-48 (regex: `/(?:--|#|-)(?:status)\b/i`)
- **Related patterns**: Lines 51-76 (regex: `/(?:--|#|-)related:(\d+)/i`)
- **Default behavior**: Lines 19-22 (only published unless searching for status)
- **Searchable fields**: Title, description, category, tags, subcategories

### Adding New Patterns

To add custom search patterns, extend the `applySearchPattern()` method:

```javascript
// Example: Add tag filter --tag:AI
const tagPattern = /(?:--|#|-)tag:(\w+)/i;
const tagMatch = query.match(tagPattern);

if (tagMatch) {
    const tagName = tagMatch[1];
    projects = projects.filter(pub =>
        pub.tags?.includes(tagName)
    );
}
```

## Development Workflow

1. Create/edit markdown files in `content/` directory
2. Run `php php/generate.php` to process content into JSON API and static pages  
3. Test changes by serving the application locally
4. Deploy by updating base URL in config and uploading to web server

The generate script provides a web interface showing processing statistics, error details, and generated file information.

## File Organization

- `content/`: Markdown content files with YAML frontmatter
- `php/`: Server-side processing scripts  
- `js/`: Client-side application code organized by function
- `css/`: Styling system organized by concern
- `static/`: Generated static HTML pages for SEO
- `public/api/`: Generated JSON API endpoints