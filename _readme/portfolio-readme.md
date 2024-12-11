# Portfolio Documentation

A modern, responsive portfolio application that handles dynamic content loading with media synchronization.

## Overview

This portfolio application implements a dynamic viewing experience that adapts to different screen sizes. It features a split-view layout on large screens and a linear layout on mobile devices.

### Key Features

- Dynamic content loading from markdown files
- Synchronized media display on large screens
- Responsive design with different viewing modes
- YAML frontmatter support for metadata
- Smooth transitions and loading states

## Architecture

### Display Modes

#### Large Screen (>= 768px)
- Split-view layout with two main sections:
  - Left side: Fixed media display area showing the current media element
  - Right side: Scrollable content area with text and inline media references
- Media synchronization: As you scroll through the content, the left panel automatically updates to show the relevant media
- Metadata display in the left panel below the media

#### Mobile Screen (< 768px)
- Single column layout
- Media elements appear inline with the content
- Metadata appears at the bottom of the content
- No synchronized media panel

### Core Components

#### Portfolio Class
Main application controller that coordinates all other components.

```javascript
class Portfolio {
    constructor(config) { /* ... */ }
    loadContent(url) { /* ... */ }
    observeMedia() { /* ... */ }
    handleLayoutChange(isMobile) { /* ... */ }
}
```

Key responsibilities:
- Content loading and initialization
- Layout management
- Event coordination
- Component lifecycle management

#### ContentParser Class
Handles markdown and frontmatter parsing.

```javascript
class ContentParser {
    constructor(baseUrl) { /* ... */ }
    parse(content) { /* ... */ }
    parseFrontmatter(yaml) { /* ... */ }
    parseBody(markdown) { /* ... */ }
}
```

Key responsibilities:
- Markdown to HTML conversion
- YAML frontmatter parsing
- Media path resolution
- Special content handling (code blocks, blockquotes)

#### MediaManager Class
Manages media display and transitions.

```javascript
class MediaManager {
    constructor(aside, options) { /* ... */ }
    updateMedia(mediaConfig) { /* ... */ }
    setNewMedia(mediaConfig) { /* ... */ }
}
```

Key responsibilities:
- Media element handling
- Transition animations
- Aspect ratio calculations
- Media type-specific setup

#### IntersectionManager Class
Handles scroll-based media synchronization.

```javascript
class IntersectionManager {
    constructor(eventBus, options) { /* ... */ }
    observe(elements) { /* ... */ }
    disconnect() { /* ... */ }
}
```

Key responsibilities:
- Scroll position monitoring
- Media element intersection detection
- Triggering media updates

### Event System

The application uses a central event bus for component communication:

```javascript
class EventBus {
    constructor() { /* ... */ }
    on(event, callback) { /* ... */ }
    emit(event, data) { /* ... */ }
}
```

Key events:
- `mediaIntersection`: Triggered when a media element enters viewport
- `layoutChange`: Fired when screen size changes between mobile/desktop
- `error`: Emitted when errors occur during operation

## Content Structure

### Markdown Files
Content is written in markdown files with YAML frontmatter:

```markdown
---
title: Article Title
description: Article description
date:
    published: 2024-01-01
author:
    name: Author Name
tags:
    - tag1
    - tag2
---

# Content starts here...
```

### Media References
Media is referenced using standard markdown syntax with optional attributes:

```markdown
![Alt text](media/image.jpg "cover")
```

Special attributes:
- `cover`: Image fills available space
- `contain`: Image is contained within boundaries

## Setup and Usage

### Installation
1. Clone the repository
2. Place markdown content in the `content` directory
3. Place media files in the `content/media` directory

### Content Creation Guidelines
- Use descriptive image alt text
- Keep media files organized in the media directory
- Include complete frontmatter for all content files
- Use relative paths for media references

### Development
The application uses ES modules and requires a modern browser. No build step is required.

To start development:
1. Set up a local server
2. Open index.html
3. Content changes are reflected on page reload

## Component Dependencies

```
Portfolio
├── EventBus
├── ContentParser
├── MediaManager
├── IntersectionManager
└── ResponsiveLayout
```

### File Structure
```
/
├── index.html
├── style.css
├── app.js
├── core/
│   └── events.js
├── components/
│   ├── Portfolio.js
│   ├── ContentParser.js
│   ├── MediaManager.js
│   └── IntersectionManager.js
└── content/
    ├── media/
    └── articles/
```

## Browser Support
- Modern browsers with ES6+ support
- CSS Grid support required
- IntersectionObserver API support required

## Contributing
Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Create a pull request

## License
This project is licensed under the MIT License.
