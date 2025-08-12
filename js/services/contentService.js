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
        return {
            metadata: this.parseYAML(frontmatter), 
            html: this.markdownToHTML(body)
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
        console.log('Converting markdown to HTML, input length:', markdown.length);
        let html = markdown;
        
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
        
        // PRESERVE: Standard images as media blocks (for magazine layout)
        const imageMatches = html.match(/!\[([^\]]*)\]\(([^)]+)\)/g);
        const blockquoteMatches = html.match(/(^> .+(?:\n> .+)*)/gm);
        console.log('Found image matches:', imageMatches);
        console.log('Found blockquote matches:', blockquoteMatches);
        
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
            console.log('Converting image:', match, 'alt:', alt, 'src:', src);
            
            // Fix path: media/ should be content/media/
            let resolvedSrc = src;
            if (src.startsWith('media/')) {
                resolvedSrc = 'content/' + src;
                console.log('Resolved image path from', src, 'to', resolvedSrc);
            }
            
            // All images should be media blocks for the magazine layout to work
            return `<figure class="media-block" data-media>
                <img src="${resolvedSrc}" alt="${alt}" />
            </figure>`;
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
        html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');
        
        // PRESERVE: Blockquotes as media elements (for magazine layout sidebar)
        // Handle multi-line blockquotes properly
        html = html.replace(/(^> .+(?:\n> .+)*)/gm, (match) => {
            console.log('Found blockquote:', match);
            // Remove the '> ' from each line and convert to paragraphs
            const lines = match.split('\n').map(line => line.replace(/^> /, '')).filter(line => line.trim());
            const content = lines.join('<br>');
            console.log('Converting blockquote to:', content);
            
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
        
        // Create sections based on H1 headlines (like in About section)
        html = this.createSections(html);
        
        console.log('Final HTML output length:', html.length);
        console.log('Final HTML contains media blocks:', html.includes('media-block'));
        console.log('Final HTML contains data-media:', html.includes('data-media'));
        
        return html;
    }

    // Create sections based on H1 and standalone H2 headlines (matching About section structure)
    createSections(html) {
        // Split content by H1 and H2 tags to create sections
        const parts = html.split(/(<h[12]>.*?<\/h[12]>)/);
        let result = '';
        let currentSection = '';
        let hasH1InSection = false;
        
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i].trim();
            if (!part) continue;
            
            // Check if this is an H1 or H2 tag
            const isH1 = part.match(/^<h1>.*<\/h1>$/);
            const isH2 = part.match(/^<h2>.*<\/h2>$/);
            
            if (isH1) {
                // H1 always starts a new section
                if (currentSection) {
                    result += `<section>\n${currentSection}\n</section>\n`;
                    currentSection = '';
                }
                currentSection = part;
                hasH1InSection = true;
            } else if (isH2) {
                // H2 starts a new section only if there's no H1 in current section
                if (!hasH1InSection && currentSection) {
                    result += `<section>\n${currentSection}\n</section>\n`;
                    currentSection = part;
                    hasH1InSection = false;
                } else if (!hasH1InSection) {
                    // No current section, start new one with H2
                    currentSection = part;
                    hasH1InSection = false;
                } else {
                    // H2 within H1 section, just add to current section
                    currentSection += (currentSection ? '\n' : '') + part;
                }
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