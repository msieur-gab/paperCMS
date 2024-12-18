export class InfoPanel {
    constructor(config) {
        this.metadata = config.metadata || {};
        this.eventBus = config.eventBus;
        this.onArticleSelect = config.onArticleSelect;
        this.publications = [];
        this.debounceTimeout = null;
        
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

    updatePanelContent() {
        if (!this.metadata) return;

        const {
            title,
            date,
            category,
            subcategories = [],
            tags = [],
            related = [],
            project,
            author,
            series
        } = this.metadata;

        // Convert objects to arrays if necessary
        const tagsArray = Array.isArray(tags) ? tags : Object.keys(tags);
        const relatedArray = Array.isArray(related) ? related : Object.keys(related);
        const subcategoriesArray = Array.isArray(subcategories) ? subcategories : Object.keys(subcategories);

        this.panel.innerHTML = `
            <header class="info-panel-header">
                <h2>Article Information</h2>
                <button class="close-info" aria-label="Close information panel">×</button>
            </header>

            <div class="info-panel-content">
                ${author ? `
                    <section class="info-section author-section">
                        <div class="author-info">
                            ${author.avatar ? `
                                <img src="${author.avatar}" alt="${author.name}" class="author-avatar">
                            ` : ''}
                            <span class="author-name">${author.name}</span>
                        </div>
                    </section>
                ` : ''}

                <section class="info-section">
                    <h3>Details</h3>
                    <div class="metadata-list">
                        ${date ? `
                            <div class="metadata-item">
                                <span class="metadata-label">Published</span>
                                <span>${new Date(date.published).toLocaleDateString()}</span>
                            </div>
                            ${date.updated && date.updated !== date.published ? `
                                <div class="metadata-item">
                                    <span class="metadata-label">Updated</span>
                                    <span>${new Date(date.updated).toLocaleDateString()}</span>
                                </div>
                            ` : ''}
                        ` : ''}
                        
                        ${category ? `
                            <div class="metadata-item">
                                <span class="metadata-label">Category</span>
                                <span>${category}</span>
                            </div>
                        ` : ''}

                        ${series ? `
                            <div class="metadata-item">
                                <span class="metadata-label">Series</span>
                                <div class="series-info">
                                    <span>${series.name}</span>
                                    ${series.number ? `<span class="series-number">#${series.number}</span>` : ''}
                                </div>
                            </div>
                        ` : ''}

                        ${project ? `
                            <div class="metadata-item">
                                <span class="metadata-label">Project Status</span>
                                <span>${project.status}</span>
                            </div>
                            ${project.client ? `
                                <div class="metadata-item">
                                    <span class="metadata-label">Client</span>
                                    <span>${project.client}</span>
                                </div>
                            ` : ''}
                        ` : ''}
                    </div>
                </section>

                ${subcategoriesArray.length ? `
                    <section class="info-section">
                        <h3>Subcategories</h3>
                        <div class="subcategories-list">
                            ${subcategoriesArray.map(subcat => `
                                <span class="info-subcategory">${subcat}</span>
                            `).join('')}
                        </div>
                    </section>
                ` : ''}

                ${tagsArray.length ? `
                    <section class="info-section">
                        <h3>Tags</h3>
                        <div class="tags-list">
                            ${tagsArray.map(tag => `
                                <span class="info-tag">${tag}</span>
                            `).join('')}
                        </div>
                    </section>
                ` : ''}

                ${relatedArray.length ? `
                    <section class="info-section">
                        <h3>Related Articles</h3>
                        <div class="related-articles">
                            ${relatedArray.map(path => {
                                const cleanPath = path
                                    .replace('content/', '')
                                    .replace('- ', '')
                                    .replace('.md', '');
                                const article = this.getRelatedArticleInfo(path);
                                return `
                                    <a href="#project/${cleanPath}" 
                                       class="related-article"
                                       data-path="${cleanPath}">
                                        <h4>${article.title}</h4>
                                        ${article.description ? `
                                            <p>${article.description}</p>
                                        ` : ''}
                                    </a>
                                `;
                            }).join('')}
                        </div>
                    </section>
                ` : ''}
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
        this.metadata = metadata;
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