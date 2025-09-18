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