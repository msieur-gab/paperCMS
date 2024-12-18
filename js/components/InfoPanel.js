export class InfoPanel {
    constructor(config) {
        this.metadata = config.metadata || {};
        this.eventBus = config.eventBus;
        this.onArticleSelect = config.onArticleSelect;
        this.publications = [];
        this.debounceTimeout = null;
        
        this.metadata = {
            author: {},
            date: {},
            project: {},
            ...this.metadata
        };
        
        this.initialize();
    }

    async initialize() {
        try {
            await this.loadPublications();
            this.createElements();
            this.setupEventListeners();
        } catch (error) {
            console.error('Failed to initialize InfoPanel:', error);
        }
    }

    async loadPublications() {
        try {
            const response = await fetch('./public/api/publications.json');
            const data = await response.json();
            this.publications = data.publications;
        } catch (error) {
            console.error('Failed to load publications for related content:', error);
            this.publications = [];
        }
    }

    createElements() {
        // Create toggle button and add it to the header actions
        const headerActions = document.querySelector('.project-header-actions');
        if (headerActions) {
            this.toggleButton = document.createElement('button');
            this.toggleButton.className = 'info-toggle';
            this.toggleButton.setAttribute('aria-label', 'Show article information');
            this.toggleButton.setAttribute('aria-expanded', 'false');
            this.toggleButton.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 16v-4"/>
                    <path d="M12 8h.01"/>
                </svg>
            `;
            headerActions.insertBefore(this.toggleButton, headerActions.firstChild);
        }
    
        // Create panel
        this.panel = document.createElement('aside');
        this.panel.className = 'info-panel';
        this.panel.setAttribute('role', 'complementary');
        this.panel.setAttribute('aria-label', 'Article information');
        
        this.updatePanelContent();
    
        // Add panel to DOM
        document.body.appendChild(this.panel);
    }

    getRelatedArticleInfo(path) {
        if (!path || typeof path !== 'string') {
            console.warn('Invalid path provided to getRelatedArticleInfo:', path);
            return {
                title: 'Unknown Article',
                description: 'Related article information unavailable'
            };
        }

        // Clean the path by removing 'content/' and '.md'
        const cleanPath = path
            .replace('content/', '')
            .replace('- ', '')  // Remove dash and space if present
            .replace('.md', '');
            
        return this.publications.find(pub => pub.path === `${cleanPath}.md`) || {
            title: cleanPath,
            description: 'Related article'
        };
    }

    ensureArray(value) {
        // Simpler now that ContentParser guarantees arrays
        return Array.isArray(value) ? value : [];
    }

    updatePanelContent() {
        if (!this.metadata) return;
    
        const {
            title,
            description,
            date = {},
            category,
            subcategories = [],
            tags = [],
            related = [],
            project = {},
            author = {},
            documents = [],
            links = [],
            timeline = {}
        } = this.metadata;
    
        const authorInfo = {
            name: this.metadata.name || author.name,
            avatar: author.avatar || this.metadata.avatar
        };
    
        const projectInfo = {
            status: this.metadata.status || project.status,
            client: this.metadata.client || project.client,
            timeline: timeline || project.timeline
        };
    
        this.panel.innerHTML = `
            <header class="info-panel-header">
                <h4>Article Information</h4>
                <button class="close-info" aria-label="Close information panel">×</button>
            </header>
    
            <div class="info-panel-content">
                <section class="article-metadata">
                    <dl>
                        ${authorInfo.name || authorInfo.avatar ? `
                            <dt>Author</dt>
                            <dd class="author-info">
                                ${authorInfo.avatar ? `
                                    <img src="${authorInfo.avatar}" alt="${authorInfo.name}" class="author-avatar">
                                ` : ''}
                                ${authorInfo.name ? `
                                    <span class="author-name">${authorInfo.name}</span>
                                ` : ''}
                            </dd>
                        ` : ''}
    
                        ${date.published ? `
                            <dt>Published</dt>
                            <dd>${new Date(date.published).toLocaleDateString()}</dd>
                        ` : ''}
                        
                        ${date.updated && date.updated !== date.published ? `
                            <dt>Updated</dt>
                            <dd>${new Date(date.updated).toLocaleDateString()}</dd>
                        ` : ''}
                        
                        ${category ? `
                            <dt>Category</dt>
                            <dd>${category}</dd>
                        ` : ''}
    
                        ${subcategories && subcategories.length > 0 ? `
                            <dt>Subcategories</dt>
                            <dd>
                                <ul class="subcategories-list">
                                    ${subcategories.map(subcat => `
                                        <li>${subcat}</li>
                                    `).join('')}
                                </ul>
                            </dd>
                        ` : ''}
    
                        ${tags && tags.length > 0 ? `
                            <dt>Tags</dt>
                            <dd>
                                <ul class="tags-list">
                                    ${tags.map(tag => `
                                        <li>${tag}</li>
                                    `).join('')}
                                </ul>
                            </dd>
                        ` : ''}
    
                        ${projectInfo.status ? `
                            <dt>Project Status</dt>
                            <dd>${projectInfo.status}</dd>
                        ` : ''}
                        
                        ${projectInfo.client ? `
                            <dt>Client</dt>
                            <dd>${projectInfo.client}</dd>
                        ` : ''}
    
                        ${projectInfo.timeline?.start && projectInfo.timeline?.end ? `
                            <dt>Timeline</dt>
                            <dd>${projectInfo.timeline.start} - ${projectInfo.timeline.end}</dd>
                        ` : ''}
    
                        ${related && related.length > 0 ? `
                            <dt>Related Articles</dt>
                            <dd>
                                <ul class="related-articles">
                                    ${related.map(path => {
                                        const cleanPath = path
                                            .replace('content/', '')
                                            .replace('- ', '')
                                            .replace('.md', '');
                                        const article = this.getRelatedArticleInfo(path);
                                        return `
                                            <li>
                                                <a href="#project/${cleanPath}" 
                                                   class="related-article"
                                                   data-path="${cleanPath}">
                                                    <strong>${article.title}</strong>
                                                    ${article.description ? `
                                                        <p>${article.description}</p>
                                                    ` : ''}
                                                </a>
                                            </li>
                                        `;
                                    }).join('')}
                                </ul>
                            </dd>
                        ` : ''}
    
                        ${documents && documents.length > 0 ? `
                            <dt>Documents</dt>
                            <dd>
                                <ul class="documents-list">
                                    ${documents.map(doc => {
                                        const title = typeof doc === 'object' 
                                            ? Object.keys(doc)[0] 
                                            : doc;
                                        const url = typeof doc === 'object' 
                                            ? doc[title] 
                                            : '';
                                        
                                        return `
                                            <li>
                                                <a href="${url}" 
                                                   class="document-link" 
                                                   target="_blank" 
                                                   rel="noopener noreferrer">
                                                    ${title}
                                                </a>
                                            </li>
                                        `;
                                    }).join('')}
                                </ul>
                            </dd>
                        ` : ''}
                        
                        ${links && links.length > 0 ? `
                            <dt>External Links</dt>
                            <dd>
                                <ul class="links-list">
                                    ${links.map(link => {
                                        const title = typeof link === 'object' 
                                            ? Object.keys(link)[0] 
                                            : link;
                                        const url = typeof link === 'object' 
                                            ? link[title] 
                                            : '';
                                        
                                        return `
                                            <li>
                                                <a href="${url}" 
                                                   class="external-link" 
                                                   target="_blank" 
                                                   rel="noopener noreferrer">
                                                    ${title}
                                                </a>
                                            </li>
                                        `;
                                    }).join('')}
                                </ul>
                            </dd>
                        ` : ''}
                    </dl>
                </section>
            </div>
        `;
    }

    setupEventListeners() {
        // Toggle panel visibility
        this.toggleButton.addEventListener('click', () => {
            const isOpen = this.panel.classList.toggle('active');
            this.toggleButton.setAttribute('aria-expanded', isOpen);
        });

        // Close button
        this.panel.addEventListener('click', (e) => {
            if (e.target.classList.contains('close-info')) {
                this.hide();
            }
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.panel.classList.contains('active')) {
                this.hide();
            }
        });

        // Handle related article clicks
        this.panel.addEventListener('click', (e) => {
            const relatedLink = e.target.closest('.related-article');
            if (relatedLink) {
                e.preventDefault();
                const path = relatedLink.getAttribute('data-path');
                if (this.onArticleSelect) {
                    this.onArticleSelect(path);
                }
                this.hide();
            }
        });

        // Handle clicks outside panel
        document.addEventListener('click', (e) => {
            if (this.panel.classList.contains('active') && 
                !this.panel.contains(e.target) && 
                !this.toggleButton.contains(e.target)) {
                this.hide();
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            if (this.debounceTimeout) {
                clearTimeout(this.debounceTimeout);
            }
            this.debounceTimeout = setTimeout(() => {
                if (window.innerWidth < 768) {
                    this.hide();
                }
            }, 150);
        });
    }

    show() {
        this.panel.classList.add('active');
        this.toggleButton.setAttribute('aria-expanded', 'true');
        this.eventBus.emit('infoPanelStateChange', { isOpen: true });
    }

    hide() {
        this.panel.classList.remove('active');
        this.toggleButton.setAttribute('aria-expanded', 'false');
        this.eventBus.emit('infoPanelStateChange', { isOpen: false });
    }

    update(metadata) {
        console.log('Updating InfoPanel with metadata:', metadata);
        
        // Merge top-level properties with nested structures
        this.metadata = {
            author: {},
            date: {},
            project: {},
            timeline: {},
            ...metadata
        };
        
        this.updatePanelContent();
    }

    destroy() {
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
        }
        
        if (this.toggleButton) {
            this.toggleButton.remove();
        }
        if (this.panel) {
            this.panel.remove();
        }
        
        // Clean up event listeners
        window.removeEventListener('resize', this.handleResize);
    }
}