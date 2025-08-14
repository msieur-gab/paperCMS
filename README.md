# PaperCMS

A comfortable, distraction-free reading and sharing platform that embraces natural touch screen behaviors while creating immersive computer reading experiences.

## Why PaperCMS?

Most websites today are built mobile-first, then adapted for larger screens. While this approach works, it often treats different screen sizes as technical constraints rather than opportunities to enhance the reading experience. PaperCMS takes a different approach: it recognizes that desktop and mobile environments offer distinct interaction possibilities and designs for each accordingly.

This isn't about being revolutionary—it's about creating a more comfortable way to read and share content that feels natural on every device.

## Design Philosophy

### Opportunity-Driven Responsive Design

Rather than simply scaling mobile interfaces for larger screens, PaperCMS considers what each screen size does best:

- **Large screens** become magazine-style reading experiences with contextual media display
- **Mobile devices** focus on streamlined, touch-friendly content consumption
- **Each environment** leverages its natural interaction patterns

### The Desktop Reading Experience

On larger screens, PaperCMS adopts a layout inspired by well-designed magazines and children's books. As you read through an article, related media appears in a sidebar that syncs with your progress through the text.

This creates a comfortable rhythm where images, diagrams, and supporting visuals appear precisely when they're most relevant to what you're reading. You don't need to scroll back and forth hunting for related media—it's there when you need it, unobtrusive when you don't.

The result feels more like reading a thoughtfully laid-out magazine article than browsing a typical website.

### Comfortable Reading, Day and Night

The theme system goes beyond simple dark mode. Drawing inspiration from e-ink displays, it's designed to minimize eye strain and create truly comfortable reading conditions:

- **Light mode** optimized for daytime reading with carefully tuned contrast
- **Night mode** that not only darkens the interface but also converts images to grayscale and reduces their luminosity to prevent bright flashes while scrolling
- **Text size controls** for optimal reading comfort
- **Persistent preferences** that remember your settings across visits

## Content Management Approach

### Markdown-First Workflow

Content is created using Markdown files with YAML frontmatter. This choice supports cross-platform compatibility and future-proofs your content:

```yaml
---
title: "Your Article Title"
description: "Brief description"
status: "published"
category: "exploration"
contributors:
  - name: "Author Name"
    role: "author"
---

# Your content in markdown
```

### Why Markdown?

- **Readable everywhere**: Edit in GitHub, any text editor, or markdown app
- **System agnostic**: Works across platforms and tools
- **Future-proof**: Plain text format prevents vendor lock-in
- **Focused writing**: Separates content creation from design concerns

This approach lets content creators focus on ideas and narrative while trusting the presentation layer to handle formatting and layout decisions.

## Key Features

### Intelligent Media Synchronization
On desktop, media content updates dynamically as you read, creating contextual dialogue between text and visuals without interrupting reading flow.

### Advanced Content Organization
- Search and filtering across all content
- Category and tag-based organization
- Status-based content management (published, draft, archived)
- Contributor attribution system

### Reading Comfort Features
- Adaptive themes for day and night reading
- Adjustable text sizing
- Distraction-free layout focus
- Persistent user preferences

### Technical Capabilities
- SEO optimization with meta tag management
- Static page generation for search engines
- Responsive design that adapts to screen capabilities
- Performance-optimized content delivery

## Project Structure

```
paperCMS/
├── content/          # Markdown content files
├── php/             # Content processing
├── js/              # Client-side application
├── css/             # Themes and styling
├── static/          # Generated static pages
└── public/api/      # Generated JSON API
```

## Content Creation Guide

### Basic Markdown Structure

Each content file should include YAML frontmatter with required fields:

```yaml
---
title: "Your Article Title"
description: "Brief description for SEO and previews"
status: "published"  # published, draft, or archived
date: "2024-01-01"
category: "exploration"  # exploration, application, reflexion
contributors:
  - name: "Author Name"
    role: "author"
tags: ["design", "technology"]
thumbnail: "./content/media/your-image.jpg"  # optional
---

# Your Article Content

Regular markdown content follows here...
```

### Images and Media

Images are declared using standard markdown syntax and will automatically sync with reading progress on desktop:

```markdown
![Alt text description](./content/media/your-image.jpg)
```

**Image Guidelines:**
- Store images in `content/media/` directory
- Use descriptive alt text for accessibility
- Supported formats: JPG, PNG, WEBP, AVIF, GIF, SVG
- Images appear in the desktop sidebar synchronized with reading progress

### Charts and Data Visualization

PaperCMS supports interactive charts using Chart.js with automatic theme adaptation:

#### Supported Chart Types
- `bar` - Bar charts (vertical)
- `line` - Line charts with smooth curves
- `pie` - Pie charts
- `doughnut` - Doughnut charts

#### Chart Syntax

```markdown
\`\`\`chart-bar
{
  "title": "Chart Title",
  "data": {
    "labels": ["Q1", "Q2", "Q3", "Q4"],
    "datasets": [
      {
        "label": "Dataset 1",
        "data": [65, 78, 82, 92]
      },
      {
        "label": "Dataset 2",
        "data": [55, 68, 75, 85]
      }
    ]
  }
}
\`\`\`
```

#### Multi-Dataset Support

Charts fully support multiple datasets with automatic color assignment and theming.

### Text Formatting Options

```markdown
**Bold text** for emphasis
*Italic text* for subtle emphasis
==Highlighted text== for important passages
~~Redacted text~~ for sensitive information (appears as black bars)
`Inline code` for technical terms
```

The redaction feature (`~~text~~`) creates classified document-style black bars, useful for:
- Protecting person names in case studies
- Redacting company names in examples
- Hiding sensitive information while maintaining context

### Blockquotes and Special Elements

```markdown
> Use blockquotes for important quotes or callouts
> that deserve special visual attention in the reading flow.
```

### Lists and Structure

```markdown
## Headings create natural reading sections

### Subsections help organize complex topics

- Unordered lists for general items
- Multiple levels supported
  - Nested items work naturally

1. Ordered lists for sequential content
2. Step-by-step instructions
3. Numbered procedures
```

### Content Organization Tips

- **Categories**: Use consistent category names (`exploration`, `application`, `reflexion`)
- **Tags**: Help with content discovery and filtering
- **Status management**: Use `draft` for work-in-progress, `published` for live content
- **Media placement**: Images and charts automatically appear in the desktop sidebar at relevant reading points

## Getting Started

### Content Creation Workflow

1. Create markdown files in `content/` with proper YAML frontmatter
2. Run `php php/generate.php` to process content
3. Content appears automatically in the interface

### Deployment

1. Update the base URL in `php/config.php` for your domain
2. Generate content for production
3. Deploy to any web server

## Who Is This For?

PaperCMS works well for:
- Personal portfolios and blogs focused on reading experience
- Project documentation that benefits from rich media integration
- Content collections where the relationship between text and visuals matters
- Anyone who values comfortable, distraction-free reading environments

## Philosophy

This project emerged from a simple observation: the difference in screen sizes isn't just a technical challenge to solve—it's an opportunity to create better, more contextually appropriate experiences. PaperCMS doesn't try to reinvent web design; it simply tries to make reading on the web more comfortable and engaging by designing thoughtfully for each environment's strengths.

---

*A comfortable space for reading and sharing, designed for the way people naturally interact with different devices.*