export class TextRedactor {
    constructor(options = {}) {
        this.options = {
            redactionChar: 'X',
            preserveLength: true,
            preserveSpaces: true,
            redactionClass: 'redacted',
            ...options
        };
        this.spaceRegex = /[^\s]/g;
    }

    redact(text) {
        if (!text) return '';
        if (this.options.preserveLength) {
            return this.options.preserveSpaces ? 
                text.replace(this.spaceRegex, this.options.redactionChar) :
                this.options.redactionChar.repeat(text.length);
        }
        return this.options.redactionChar.repeat(5);
    }
}

export class YAMLParser {
    static parse(yaml) {
        const lines = yaml.trim().split('\n');
        const result = {};
        let currentKey = null;
        let currentObject = result;
        let parents = [];
        let lastIndent = 0;

        const getIndentLevel = (line) => {
            const match = line.match(/^(\s*)/);
            return match ? match[1].length : 0;
        };

        for (let line of lines) {
            if (!line.trim() || line.trim() === '---') continue;

            const indent = getIndentLevel(line);
            line = line.trim();

            if (line.startsWith('-')) {
                const content = line.slice(1).trim();
                
                if (!content.includes(':')) {
                    if (!Array.isArray(currentObject[currentKey])) {
                        currentObject[currentKey] = [];
                    }
                    currentObject[currentKey].push(content);
                } else {
                    if (!Array.isArray(currentObject[currentKey])) {
                        currentObject[currentKey] = [];
                    }
                    const newItem = {};
                    currentObject[currentKey].push(newItem);
                    
                    const [key, value] = content.split(':').map(s => s.trim());
                    newItem[key] = value || {};
                    
                    if (!value) {
                        parents.push(currentObject);
                        currentObject = newItem[key];
                        currentKey = key;
                    }
                }
                continue;
            }

            if (line.includes(':')) {
                const [key, value] = line.split(':').map(s => s.trim());
                
                if (indent < lastIndent) {
                    const steps = (lastIndent - indent) / 2;
                    for (let i = 0; i < steps; i++) {
                        currentObject = parents.pop() || result;
                    }
                }

                currentKey = key;
                
                if (value) {
                    currentObject[key] = value;
                } else {
                    currentObject[key] = {};
                    parents.push(currentObject);
                    currentObject = currentObject[key];
                }
                
                lastIndent = indent;
            }
        }

        return result;
    }
}

export class MarkdownParser {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.frontmatter = null;
        this.redactor = new TextRedactor();
        this.reset();
    }

    reset() {
        this.inCodeBlock = false;
        this.inBlockquote = false;
        this.currentSection = null;
        this.buffer = '';
        this.codeBuffer = '';
        this.blockquoteBuffer = '';
        this.footnotes = new Map();
    }

    getIndentLevel(line) {
        const match = line.match(/^(\s*)/);
        return match ? match[1].length : 0;
    }

    parseLine(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\[\^(\d+)\]/g, (match, id) => 
                `<sup><a href="#fn${id}" id="ref${id}" class="footnote-link">[${id}]</a></sup>`)
            .replace(/==(.*?)==/g, '<mark>$1</mark>')
            .replace(/~~(.*?)~~/g, (match, content) => {
                const redactedContent = this.redactor.redact(content);
                return `<del aria-label="redacted text">${redactedContent}</del>`;
            })
            .replace(/\((media\/[^)]+)\)/g, `(${this.baseUrl}/content/$1)`);
    }

    parseHeading(line) {
        const match = line.match(/^(#{1,6})\s(.+)$/);
        if (!match) return null;
        
        const level = match[1].length;
        const content = this.parseLine(match[2].trim());
        
        // Ignorer les h1 car ils viennent du frontmatter
        if (level === 1) return null;
        
        // Pour h2, créer une nouvelle section
        if (level === 2) {
            return `</section><section class="project-section">
                <h2 class="section-title">${content}</h2>
            `;
        }
        
        // Pour les autres niveaux, simplement retourner le heading
        return `<h${level}>${content}</h${level}>`;
    }

    parseImage(line) {
        const match = line.match(/!\[(.*?)\]\((.*?)(?:\s+"(.*?)")?\)/);
        if (!match) return null;

        const [_, alt, url, title] = match;
        const parsedAlt = this.parseLine(alt);
        const finalUrl = url.startsWith('media/') ? `${this.baseUrl}/content/${url}` : url;
        
        let fitMode = 'contain';
        let imageTitle = '';
        
        if (title) {
            const titleParts = title.split('|').map(part => part.trim());
            if (titleParts[0] === 'cover' || titleParts[0] === 'contain') {
                fitMode = titleParts[0];
                imageTitle = titleParts[1] || '';
            } else {
                imageTitle = title;
            }
        }

        return `<figure class="media media-block" data-media>
            <img src="${finalUrl}" 
                 alt="${parsedAlt}"
                 data-fit="${fitMode}"
                 ${imageTitle ? `title="${imageTitle}"` : ''}>
            ${parsedAlt ? `<figcaption>${parsedAlt}</figcaption>` : ''}
        </figure>`;
    }

    parseCodeBlock(line) {
        if (!line.startsWith('```')) return null;

        if (!this.inCodeBlock) {
            this.inCodeBlock = true;
            const language = line.slice(3).trim();
            return `<figure class="media media-block code-block" data-media>
                <pre class="language-${language}"><code class="language-${language}">`;
        }

        this.inCodeBlock = false;
        return `</code></pre></figure>`;
    }

    parseBlockquote(line) {
        if (!line.startsWith('> ') && !this.inBlockquote) return null;

        if (line.startsWith('> ')) {
            if (!this.inBlockquote) {
                this.inBlockquote = true;
                return `<figure class="media media-block blockquote" data-media>
                    <blockquote>${this.parseLine(line.slice(2))}`;
            }
            return `${this.parseLine(line.slice(2))}`;
        }

        if (this.inBlockquote) {
            this.inBlockquote = false;
            return `</blockquote></figure>`;
        }
    }

    parseList(lines, startIndex) {
        const list = [];
        const listType = lines[startIndex].startsWith('- ') ? 'ul' : 'ol';
        let currentIndex = startIndex;
        let currentIndent = this.getIndentLevel(lines[startIndex]);
        
        while (currentIndex < lines.length) {
            const line = lines[currentIndex];
            const indent = this.getIndentLevel(line);
            
            if (!line.trim() || (!line.startsWith('- ') && !/^\d+\./.test(line))) break;
            if (indent < currentIndent) break;
            
            if (indent > currentIndent) {
                const [subList, newIndex] = this.parseList(lines, currentIndex);
                list[list.length - 1] += subList;
                currentIndex = newIndex;
            } else {
                const content = line.replace(/^-|\d+\.\s*/, '').trim();
                list.push(`<li>${this.parseLine(content)}</li>`);
                currentIndex++;
            }
        }
        
        return [`<${listType}>${list.join('')}</${listType}>`, currentIndex];
    }

    parseFootnotes(lines) {
        let footnotes = '';
        lines.forEach(line => {
            const match = line.match(/^\[\^(\d+)\]:\s*(.+)$/);
            if (match) {
                const [_, id, content] = match;
                footnotes += `<div id="fn${id}" class="footnote">
                    ${this.parseLine(content.trim())}
                    <a href="#ref${id}" class="footnote-backref">↩</a>
                </div>`;
            }
        });
    
        return footnotes ? `<div class="footnotes">${footnotes}</div>` : '';
    }

    parseParagraph(line) {
        return `<p>${this.parseLine(line)}</p>`;
    }

    parseMarkdown(markdown) {
        this.reset();
        
        const frontmatterMatch = markdown.match(/^---\n([\s\S]*?)\n---/);
        if (!frontmatterMatch) {
            throw new Error('No frontmatter found in markdown document');
        }

        this.frontmatter = YAMLParser.parse(frontmatterMatch[1]);
        if (!this.frontmatter.title) {
            throw new Error('No title found in frontmatter');
        }

        // Commencer le document avec une section et le titre du frontmatter
        let html = '<article><section class="project-section">';
        html += `<h1 class="project-title">${this.frontmatter.title}</h1>`;

        // Parser le reste du markdown
        const lines = markdown.slice(frontmatterMatch[0].length).trim().split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line && !this.inCodeBlock) continue;

            let content = null;

            if (this.inCodeBlock) {
                content = line + '\n';
            } else if (line.startsWith('- ') || /^\d+\./.test(line)) {
                const [listHtml, newIndex] = this.parseList(lines, i);
                content = listHtml;
                i = newIndex - 1;
            } else {
                content = this.parseCodeBlock(line) ||
                         this.parseBlockquote(line) ||
                         this.parseHeading(line) ||
                         this.parseImage(line) ||
                         (line && this.parseParagraph(line));
            }

            if (content) html += content;
        }

        // Ajouter les notes de bas de page s'il y en a
        const footnotesHtml = this.parseFootnotes(lines);
        if (footnotesHtml) {
            html += footnotesHtml;
        }

        // Fermer la dernière section
        html += '</section></article>';

        return {
            html,
            metadata: this.frontmatter
        };
    }
}

export class MetadataManager {
    constructor(container) {
        this.container = this.getOrCreateContainer(container);
    }

    getOrCreateContainer(parent) {
        let container = parent.querySelector('.metadata-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'metadata-container';
            parent.appendChild(container);
        }
        return container;
    }

    formatDate(dateStr) {
        try {
            return new Date(dateStr).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            return dateStr;
        }
    }

    update(metadata) {
        let content = '';

        // Dates
        if (metadata.date) {
            if (metadata.date.published) content += `Published: ${this.formatDate(metadata.date.published)}\n`;
            if (metadata.date.updated) content += `Updated: ${this.formatDate(metadata.date.updated)}\n`;
        }

        // Author
        if (metadata.author?.name) content += `\nAuthor: ${metadata.author.name}\n`;

        // Category
        if (metadata.category) content += `\nCategory: ${metadata.category}\n`;

        // Subcategories
        const subcategories = metadata.subcategories?.subcategories;
        if (subcategories?.length) content += `\nSubcategories: ${subcategories.join(', ')}\n`;

        // Tags
        const tags = metadata.subcategories?.tags?.tags;
        if (tags?.length) content += `\nTags: ${tags.join(', ')}\n`;

        // Related content
        const related = metadata.subcategories?.tags?.related?.related;
        if (related?.length) {
            content += '\nRelated Content:\n';
            related.forEach((link, index) => {
                const formattedLink = link.replace(/^\//, '');
                const linkId = `related-link-${index}`;
                content += `- <a href="#" id="${linkId}" class="related-link" data-path="${formattedLink}">${formattedLink}</a>\n`;
            });
        }

        // Project details
        const project = metadata.subcategories?.tags?.related?.project;
        if (project) {
            content += '\nProject Details:\n';
            if (project.status) content += `Status: ${project.status}\n`;
            if (project.timeline?.start && project.timeline?.end) {
                content += `Timeline: ${project.timeline.start} - ${project.timeline.end}\n`;
            }
        }

        // Client
        const client = metadata.subcategories?.tags?.related?.client;
        if (client) content += `Client: ${client}\n`;

        this.container.innerHTML = content;
        this.setupEventListeners(related);
        this.addStyles();
    }

    setupEventListeners(related) {
        if (!related?.length) return;
        related.forEach((link, index) => {
            const element = this.container.querySelector(`#related-link-${index}`);
            if (element) {
                element.addEventListener('click', (e) => {
                    e.preventDefault();
                    const path = link.replace(/^\//, '');
                    document.dispatchEvent(new CustomEvent('loadContent', { 
                        detail: { path } 
                    }));
                });
            }
        });
    }

    addStyles() {
        if (document.querySelector('#metadata-styles')) return;
        const style = document.createElement('style');
        style.id = 'metadata-styles';
        style.textContent = `
            .metadata-container .related-link {
                color: inherit;
                text-decoration: underline;
                cursor: pointer;
            }
            .metadata-container .related-link:hover {
                opacity: 0.8;
            }
        `;
        document.head.appendChild(style);
    }
}