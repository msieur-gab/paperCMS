# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PaperCMS is a clean, performant static portfolio site that combines PHP-based content generation with a client-side JavaScript application. It processes Markdown files with YAML frontmatter into JSON and renders them as an interactive portfolio with sections for About, Work, and Project Details.

## Content Management Commands

```bash
# Generate publications.json from markdown files
php php/generate.php

# Process markdown files directly (used by generate.php)
php php/markdown-to-json.php
```

The content processing system requires markdown files in `content/` with specific YAML frontmatter structure including required fields: `reference`, `title`, `description`, `status`, `date`, `category`, `contributors`, and `tags`.

## Architecture

### Content Pipeline
- **Markdown files** in `content/` contain YAML frontmatter and content
- **PHP processors** (`php/markdown-to-json.php`, `php/generate.php`) convert to `public/api/publications.json`
- **JavaScript app** (`app.js`) fetches and renders content dynamically

### Client-Side Architecture
The main application uses a clean, modular architecture with:

- **App class**: Central orchestrator managing state, navigation, and component lifecycle
- **Router**: Hash-based routing for sections and projects (`#about`, `#work`, `#project/path`)
- **Services**: ContentService, SearchService, StorageService for data management
- **UI Components**: MediaManager, ProjectGrid, SettingsDrawer, Navigation

### Key Features
- **Intelligent Media Sync**: Desktop sidebar automatically shows relevant media as user scrolls
- **Advanced Search**: Sophisticated filtering with status, related content, and text search
- **Theme System**: Dark/light mode with font size controls
- **Responsive Design**: Adaptive layout for desktop magazine-style and mobile views
- **SEO Optimized**: Static page generation, structured data, and proper meta tags

### Navigation Flow
1. **About section**: Static content introduction
2. **Work section**: Grid of project cards with filtering/search
3. **Project details**: Full project view with intelligent media sidebar (desktop)

### Contributors System
The modern contributors structure supports:
- Multiple contributors with roles (author, reviewer, editor, etc.)
- Avatar display and metadata
- Automatic author attribution for SEO and structured data
- Manual acknowledgements sections in markdown content

### Media Handling
- **MediaManager**: Handles media display in project details sidebar
- **IntelligentMediaSync**: Advanced scroll-based media synchronization with velocity detection
- **Responsive behavior**: Desktop sidebar, mobile inline display

### Content Structure
Articles support rich frontmatter including:
- **Required**: `reference`, `title`, `description`, `status`, `date`, `category`, `contributors`, `tags`
- **Optional**: `thumbnail`, `subcategories`, `related`, `documents`, `links`
- **Status types**: `published`, `archived`, `draft` (only published/archived shown by default)
- **Contributors**: Array with role-based attribution

### Search Features
Advanced search patterns:
- Status filtering: `--archived`, `--published`, `--draft`
- Related content: `--related:123`
- Full-text search across title, description, category, tags, and subcategories