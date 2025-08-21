// NEW: services/contentService.js - Streamlined content handling
export class ContentService {
    constructor() {
        this.cache = new Map();
        this.baseUrl = './content/';
    }

    async getProjects() {
        try {
            const response = await fetch('./public/api/publications.json');
            if (!response.ok) throw new Error('Failed to fetch projects');
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Failed to load projects:', error);
            throw error;
        }
    }

    async getProject(slug) {
        if (this.cache.has(slug)) {
            return this.cache.get(slug);
        }

        try {
            const cleanSlug = this.cleanSlug(slug);
            const response = await fetch(`${this.baseUrl}${cleanSlug}.md`);
            if (!response.ok) throw new Error(`Failed to fetch project: ${cleanSlug}`);
            
            const markdown = await response.text();
            const project = this.parseMarkdown(markdown);
            
            this.cache.set(slug, project);
            return project;
        } catch (error) {
            console.error('Failed to load project:', error);
            throw error;
        }
    }

    cleanSlug(slug) {
        return slug
            .replace(/\.md$/, '')
            .replace('content/', '')
            .replace(/^-\s*/, '');
    }

    parseMarkdown(content) {
        // Simplified since PHP already validates everything
        const match = content.match(/^---\n(.*?)\n---\n(.*)$/s);
        if (!match) {
            throw new Error('Invalid document format: No frontmatter found');
        }
        
        const [_, frontmatter, body] = match;
        const metadata = this.parseYAML(frontmatter);
        const html = this.markdownToHTML(body);
        
        return {
            metadata: metadata, 
            html: html
        };
    }

    // Simpler YAML parsing since PHP ensures valid structure
    parseYAML(yaml) {
        const lines = yaml.trim().split('\n');
        const result = {};
        let currentKey = null;
        let currentArray = null;
        
        for (const line of lines) {
            if (!line.trim()) continue;
            
            const trimmed = line.trim();
            
            // Handle array items
            if (trimmed.startsWith('- ')) {
                const value = trimmed.slice(2).trim();
                if (currentArray && currentKey) {
                    result[currentKey].push(value);
                }
                continue;
            }
            
            // Handle key-value pairs
            if (trimmed.includes(':')) {
                const [key, ...valueParts] = trimmed.split(':');
                const value = valueParts.join(':').trim();
                const cleanKey = key.trim();
                
                if (value === '') {
                    // Start of array or object
                    result[cleanKey] = [];
                    currentKey = cleanKey;
                    currentArray = result[cleanKey];
                } else {
                    // Simple key-value
                    result[cleanKey] = value;
                    currentKey = null;
                    currentArray = null;
                }
            }
        }
        
        return result;
    }
    
    // Basic markdown to HTML focusing on media elements preservation
    markdownToHTML(markdown) {
        let html = markdown;
        
        // PRESERVE: Chart blocks before other processing
        html = this.parseChartBlocks(html);
        
        // PRESERVE: Media blocks with attributes (critical for your magazine layout)
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)\s*\{([^}]+)\}/g, (match, alt, src, attrs) => {
            // Fix path: media/ should be content/media/
            let resolvedSrc = src;
            if (src.startsWith('media/')) {
                resolvedSrc = 'content/' + src;
            }
            
            // Parse attributes
            const dataMedia = attrs.includes('data-media') ? ' data-media' : '';
            const className = attrs.match(/class="([^"]+)"/)?.[1] || '';
            return `<figure class="media-block ${className}"${dataMedia}>
                <img src="${resolvedSrc}" alt="${alt}" />
            </figure>`;
        });
        
        // PRESERVE: Standard images and videos as media blocks (for magazine layout)
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, srcWithArgs) => {
            // Parse source and arguments (support both quoted and space-separated)
            let src, args;
            
            // Check for quoted arguments: file.webm "arg1 arg2 arg3"
            const quotedMatch = srcWithArgs.match(/^([^\s"]+)\s+"([^"]+)"$/);
            if (quotedMatch) {
                src = quotedMatch[1];
                args = quotedMatch[2].split(/\s+/);
            } else {
                // Fall back to space-separated: file.webm arg1 arg2 arg3
                const parts = srcWithArgs.split(/\s+/);
                src = parts[0];
                args = parts.slice(1);
            }
            
            // Fix path: media/ should be content/media/
            let resolvedSrc = src;
            if (src.startsWith('media/')) {
                resolvedSrc = 'content/' + src;
            }
            
            // Check if it's a video file
            const videoExtensions = ['.webm', '.mp4', '.mov', '.avi'];
            const isVideo = videoExtensions.some(ext => src.toLowerCase().endsWith(ext));
            
            if (isVideo) {
                // Parse video arguments
                let videoAttrs = ['controls']; // Default controls
                let figureAttrs = '';
                let playbackRate = '1';
                
                args.forEach(arg => {
                    const lowerArg = arg.toLowerCase();
                    if (lowerArg === 'autoplay') {
                        videoAttrs.push('autoplay');
                    } else if (lowerArg === 'loop') {
                        videoAttrs.push('loop');
                    } else if (lowerArg === 'mute' || lowerArg === 'muted') {
                        videoAttrs.push('muted');
                    } else if (lowerArg === 'nocontrols') {
                        videoAttrs = videoAttrs.filter(attr => attr !== 'controls');
                    } else if (lowerArg.match(/^\d+(\.\d+)?x$/)) {
                        playbackRate = lowerArg.replace('x', '');
                    } else if (lowerArg === 'cover') {
                        figureAttrs = ' data-fit="cover"';
                    } else if (lowerArg === 'contain') {
                        figureAttrs = ' data-fit="contain"';
                    }
                });
                
                const videoAttrString = videoAttrs.join(' ');
                const playbackScript = playbackRate !== '1' ? 
                    `<script>document.currentScript.previousElementSibling.querySelector('video').playbackRate = ${playbackRate};</script>` : '';
                
                return `<figure class="media-block" data-media${figureAttrs}>
                    <video ${videoAttrString}>
                        <source src="${resolvedSrc}" type="video/${src.split('.').pop()}">
                        Your browser does not support the video tag.
                    </video>
                    ${playbackScript}
                </figure>`;
            } else {
                // Parse image arguments
                let figureAttrs = '';
                args.forEach(arg => {
                    const lowerArg = arg.toLowerCase();
                    if (lowerArg === 'cover' || lowerArg === 'contain') {
                        figureAttrs = ` data-fit="${lowerArg}"`;
                    }
                });
                
                // All images should be media blocks for the magazine layout to work
                return `<figure class="media-block" data-media${figureAttrs}>
                    <img src="${resolvedSrc}" alt="${alt}" />
                </figure>`;
            }
        });
        
        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
        
        // Headers
        html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
        
        // Bold and italic
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        
        // PRESERVE: Highlight and strikethrough effects (critical for text styling)
        html = html.replace(/==([^=]+)==/g, '<mark>$1</mark>');
        html = html.replace(/~~([^~]+)~~/g, (match, content) => {
            return `<del>${this.redactText(content)}</del>`;
        });
        
        // PRESERVE: Blockquotes as media elements (for magazine layout sidebar)
        // Handle multi-line blockquotes properly
        html = html.replace(/(^> .+(?:\n> .+)*)/gm, (match) => {
            // Remove the '> ' from each line and convert to paragraphs
            const lines = match.split('\n').map(line => line.replace(/^> /, '')).filter(line => line.trim());
            const content = lines.join('<br>');
            
            // Blockquotes should behave like media and be displayed in sidebar
            return `<blockquote class="media-block" data-media>
                <p>${content}</p>
            </blockquote>`;
        });
        
        // Code blocks
        html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Paragraphs
        html = html.split('\n\n').map(paragraph => {
            paragraph = paragraph.trim();
            if (!paragraph) return '';
            
            // Skip if it's already a complete HTML block element
            if (paragraph.match(/^<(h[1-6]|div|figure|blockquote|pre|ul|ol|li)\b/)) {
                return paragraph;
            }
            
            // If it contains inline HTML tags but isn't a block element, wrap in paragraph
            return `<p>${paragraph}</p>`;
        }).join('\n');
        
        // Remove standalone media blocks that appear before the first header to prevent layout issues
        html = this.filterPreHeaderMedia(html);
        
        // Create sections based on H1 headlines (like in About section)
        html = this.createSections(html);
        
        return html;
    }

    // Parse chart blocks (```chart or ```chart-type)
    parseChartBlocks(markdown) {
        // Match chart blocks: ```chart, ```chart-bar, ```chart-line, etc.
        return markdown.replace(/```chart(?:-(\w+))?\n([\s\S]*?)```/g, (match, chartType, content) => {
            try {
                // Parse JSON configuration
                const config = JSON.parse(content.trim());
                
                // Determine chart type from block or config
                const type = chartType || config.type || 'bar';
                
                // Generate unique ID for this chart
                const chartId = `chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                
                // Create chart as single media block (like images and blockquotes)
                return `<figure class="chart-block media-block" data-media data-chart-type="${type}" data-chart-config='${JSON.stringify(config)}' data-chart-id="${chartId}">
                    <canvas id="${chartId}" class="chart-canvas"></canvas>
                    ${config.title ? `<figcaption class="chart-title">${config.title}</figcaption>` : ''}
                </figure>`;
            } catch (error) {
                console.error('Failed to parse chart configuration:', error);
                // Return error block that won't break layout
                return `<div class="chart-error">
                    <p>Chart configuration error: ${error.message}</p>
                    <pre><code>${content}</code></pre>
                </div>`;
            }
        });
    }

    // Remove standalone media blocks before first header to prevent layout issues on desktop
    filterPreHeaderMedia(html) {
        // Find the first H1 or H2 tag
        const firstHeaderMatch = html.match(/<h[12]>/);
        if (!firstHeaderMatch) {
            // No headers found, return as is
            return html;
        }
        
        const firstHeaderIndex = firstHeaderMatch.index;
        const beforeHeader = html.substring(0, firstHeaderIndex);
        const fromHeader = html.substring(firstHeaderIndex);
        
        // Remove standalone media blocks from the pre-header content
        const filteredBeforeHeader = beforeHeader.replace(
            /<figure[^>]*class="[^"]*media-block[^"]*"[^>]*>.*?<\/figure>/gs, 
            ''
        ).replace(
            /<blockquote[^>]*class="[^"]*media-block[^"]*"[^>]*>.*?<\/blockquote>/gs, 
            ''
        );
        
        return filteredBeforeHeader + fromHeader;
    }

    // Create sections based on H1 and H2 headlines - each gets its own section
    createSections(html) {
        // Split content by H1 and H2 tags to create sections
        const parts = html.split(/(<h[12]>.*?<\/h[12]>)/);
        let result = '';
        let currentSection = '';
        
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i].trim();
            if (!part) continue;
            
            // Check if this is an H1 or H2 tag
            const isH1 = part.match(/^<h1>.*<\/h1>$/);
            const isH2 = part.match(/^<h2>.*<\/h2>$/);
            
            if (isH1 || isH2) {
                // Both H1 and H2 start new sections
                if (currentSection) {
                    result += `<section>\n${currentSection}\n</section>\n`;
                    currentSection = '';
                }
                // Start new section with this heading
                currentSection = part;
            } else {
                // Regular content, add to current section
                currentSection += (currentSection ? '\n' : '') + part;
            }
        }
        
        // Close final section if exists
        if (currentSection) {
            result += `<section>\n${currentSection}\n</section>\n`;
        }
        
        // If no H1 or H2 tags were found, return original content
        return result || html;
    }


    // Utility function to redact text by replacing letters with 'X' while preserving spacing
    redactText(text) {
        return text.replace(/\S/g, 'X');
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
    }

    // Get cached projects
    getCachedProject(slug) {
        return this.cache.get(slug);
    }

    // Check if project is cached
    isCached(slug) {
        return this.cache.has(slug);
    }
}