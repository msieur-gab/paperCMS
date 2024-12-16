export class ContentParser {
    constructor(baseUrl = '') {
        this.baseUrl = baseUrl;
        this.reset();
    }

    reset() {
        this.frontmatter = null;
        this.inCodeBlock = false;
        this.inBlockquote = false;
        this.footnotes = new Map();
    }

    async parse(content) {
        const { frontmatter, body } = this.extractFrontmatter(content);
        const metadata = this.parseFrontmatter(frontmatter);
        const html = this.parseBody(body);
        
        return { metadata, html };
    }

    extractFrontmatter(content) {
        const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
        if (!match) {
            throw new Error('Invalid document format: No frontmatter found');
        }
        return {
            frontmatter: match[1],
            body: match[2]
        };
    }

    

    parseFrontmatter(yaml) {
        const lines = yaml.trim().split('\n');
        const result = {};
        let currentContext = { object: result, indent: -2 };
        let contextStack = [currentContext];

        for (const line of lines) {
            if (!line.trim()) continue;

            const indent = line.search(/\S/);
            const [key, ...valueParts] = line.trim().split(':');
            let value = valueParts.join(':').trim();

            // Handle special case for published: true
            if (key === 'published' && value === 'true') {
                result.date = {
                    published: new Date().toISOString().split('T')[0],
                    updated: new Date().toISOString().split('T')[0]
                };
                continue;
            }

            // Pop back to appropriate level based on indentation
            while (contextStack.length > 1 && indent <= contextStack[contextStack.length - 1].indent) {
                contextStack.pop();
                currentContext = contextStack[contextStack.length - 1];
            }

            if (value) {
                // Simple key-value pair
                currentContext.object[key] = value;
            } else {
                // New nested object
                const newObj = {};
                currentContext.object[key] = newObj;
                currentContext = { object: newObj, indent };
                contextStack.push(currentContext);
            }
        }

        // Ensure date object exists
        if (!result.date) {
            result.date = {
                published: new Date().toISOString().split('T')[0],
                updated: new Date().toISOString().split('T')[0]
            };
        }

        return result;
    }

    parseBody(markdown) {
        this.reset();
        const lines = markdown.trim().split('\n');
        let html = '<article><section class="project-section">';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line && !this.inCodeBlock) continue;

            if (this.inCodeBlock) {
                html += this.handleCodeBlock(line);
                continue;
            }

            if (this.inBlockquote) {
                html += this.handleBlockquote(line);
                continue;
            }

            html += this.parseLine(line);
        }

        html += this.parseFootnotes();
        html += '</section></article>';
        return html;
    }

    parseLine(line) {
        if (line.startsWith('#')) return this.parseHeading(line);
        if (line.startsWith('```')) return this.handleCodeBlock(line);
        if (line.startsWith('>')) return this.handleBlockquote(line);
        if (line.startsWith('![')) return this.parseImage(line);
        if (line.startsWith('- ') || /^\d+\./.test(line)) return this.parseList(line);
        
        return this.parseParagraph(line);
    }

    parseHeading(line) {
        const match = /^(#{1,6})\s+(.+)$/.exec(line);
        if (!match) return '';
        
        const level = match[1].length;
        const content = this.parseInline(match[2]);
        
        if (level === 1) {
            return `<h1 class="project-title">${content}</h1>`;
        }
        
        if (level === 2) {
            return `</section><section class="project-section"><h2 class="section-title">${content}</h2>`;
        }
        
        return `<h${level}>${content}</h${level}>`;
    }

    parseImage(line) {
        const match = /!\[(.*?)\]\((.+?)(?:\s+"(.*?)")?\)/.exec(line);
        if (!match) return '';

        const [_, alt, src, title] = match;
        const url = src.startsWith('media/') ? `./content/${src}` : src;
        const config = this.parseImageConfig(title);

        return `
            <figure class="media media-block" data-media 
                    ${config.fitMode ? `data-fit="${config.fitMode}"` : ''}>
                <img src="${url}" alt="${alt}" ${config.title ? `title="${config.title}"` : ''}>
                ${alt ? `<figcaption>${alt}</figcaption>` : ''}
            </figure>
        `;
    }

    parseImageConfig(title) {
        if (!title) return {};
        
        const parts = title.split('|').map(p => p.trim());
        const config = {};
        
        if (parts[0] === 'cover' || parts[0] === 'contain') {
            config.fitMode = parts[0];
            config.title = parts[1] || '';
        } else {
            config.title = parts[0];
        }
        
        return config;
    }

    parseParagraph(line) {
        // Si la ligne est vide ou commence par un caractère spécial, ne pas créer de paragraphe
        if (!line || line.startsWith('#') || line.startsWith('```') || line.startsWith('>')) {
            return '';
        }
        return `<p>${this.parseInline(line)}</p>`;
    }

    parseList(line) {
        const items = [];
        let currentIndent = line.search(/\S/);
        let currentLine = line;
        const listType = line.trim().startsWith('-') ? 'ul' : 'ol';

        // Traiter la première ligne
        const content = currentLine.replace(/^[\s-]*|\d+\.\s*/, '').trim();
        items.push(`<li>${this.parseInline(content)}</li>`);

        return `<${listType}>${items.join('')}</${listType}>`;
    }

    parseInline(text) {
        const redactor = new TextRedactor();
        return text
        
            // Liens
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
                const isRelative = url.startsWith('/') || url.startsWith('./') || url.startsWith('../');
                const finalUrl = isRelative ? `${this.baseUrl}${url}` : url;
                return `<a href="${finalUrl}">${text}</a>`;
            })
            // Gras
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Italique
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Code inline
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            // Surlignage
            .replace(/==(.*?)==/g, '<mark>$1</mark>')
            // Texte barré/supprimé
            .replace(/~~(.*?)~~/g, (_, text) => {
                return redactor.createRedactedElement(text);
            })
            // Notes de bas de page
            .replace(/\[\^(\d+)\]/g, (_, id) => {
                return `<sup><a href="#fn${id}" id="ref${id}" class="footnote-link">[${id}]</a></sup>`;
            });
    }

    handleCodeBlock(line) {
        if (!line.startsWith('```')) {
            return line + '\n';
        }

        if (!this.inCodeBlock) {
            this.inCodeBlock = true;
            const language = line.slice(3).trim();
            return `<figure class="media media-block code-block" data-media>
                    <pre><code class="language-${language}">`;
        }

        this.inCodeBlock = false;
        return `</code></pre></figure>`;
    }

    handleBlockquote(line) {
        if (!line.startsWith('> ') && this.inBlockquote) {
            this.inBlockquote = false;
            return '</blockquote></figure>';
        }

        if (line.startsWith('> ')) {
            const content = this.parseInline(line.slice(2));
            if (!this.inBlockquote) {
                this.inBlockquote = true;
                return `<figure class="media media-block blockquote" data-media>
                        <blockquote>${content}`;
            }
            return content;
        }

        return '';
    }

    parseFootnotes() {
        if (this.footnotes.size === 0) return '';
        
        let html = '<div class="footnotes">';
        this.footnotes.forEach((content, id) => {
            html += `
                <div id="fn${id}" class="footnote">
                    ${content}
                    <a href="#ref${id}" class="footnote-backref">↩</a>
                </div>
            `;
        });
        html += '</div>';
        return html;
    }
}

class TextRedactor {
    constructor() {
        this.redactionChar = 'X';
    }

    redactText(text) {
        // Preserve spaces, punctuation, and line breaks
        return text.replace(/[^\s\n.,!?;:]/g, this.redactionChar);
    }

    createRedactedElement(text) {
        const redactedText = this.redactText(text);
        return `<del aria-label="Redacted text">${redactedText}</del>`;
    }
}