# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PaperCMS is a static portfolio site that combines PHP-based content generation with a client-side JavaScript application. It processes Markdown files with YAML frontmatter into JSON and renders them as an interactive portfolio with sections for About, Work, and Project Details.

## Content Management Commands

```bash
# Generate publications.json from markdown files
php generate.php

# Process markdown files directly (used by generate.php)
php markdown-to-json.php
```

The content processing system requires markdown files in `content/` with specific YAML frontmatter structure including required fields: `reference`, `title`, `description`, `status`, `date`, `category`, `author`, and `tags`.

## Architecture

### Content Pipeline
- **Markdown files** in `content/` contain YAML frontmatter and content
- **PHP processors** (`markdown-to-json.php`, `generate.php`) convert to `public/api/publications.json`
- **JavaScript app** (`main.js`) fetches and renders content dynamically

### Client-Side Architecture
The main application (`main.js`) uses a component-based architecture with:

- **App class**: Central orchestrator managing state, navigation, and component lifecycle
- **Router**: Hash-based routing for sections and projects (`#about`, `#work`, `#project/path`)
- **EventBus**: Decoupled communication between components
- **Component system**: Modular UI components in `js/components/`

### Key Components
- **ProjectList**: Manages work section with filtering, search, and sorting
- **Portfolio**: Handles project detail view and media management
- **ContentParser**: Processes markdown content and metadata
- **ThemeManager**: Dark/light theme switching
- **SettingsManager**: Settings drawer with font size and theme controls

### Navigation Flow
1. **About section**: Static content introduction
2. **Work section**: Grid of project cards with filtering/search
3. **Project details**: Full project view with media sidebar (desktop only)

### State Management
The app maintains state for:
- Current section (`about`, `work`, `project-details`)
- Project open status
- Loading states
- Navigation sections array

### Media Handling
- **MediaManager**: Handles media display in project details sidebar
- **IntersectionManager**: Observes media elements for automatic sidebar updates
- **ResponsiveLayout**: Adapts behavior for mobile vs desktop

### Content Structure
Projects must include required frontmatter fields and support optional fields like `thumbnail`, `subcategories`, `related`, `documents`, and `links`. Only `published` and `archived` status articles are displayed by default.

### Search Features
Advanced search patterns supported:
- Status filtering: `--archived`, `--published`, `--draft`
- Related content: `--related:123` (finds content related to reference 123)
- Regular text search across title, description, category, tags, and subcategories