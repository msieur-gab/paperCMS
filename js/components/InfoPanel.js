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
        // Create toggle button
        this.toggleButton = document.createElement('button');
        this.toggleButton.className = 'info-toggle';
        this.toggleButton.setAttribute('aria-label', 'Show article information');
        this.toggleButton.setAttribute('aria-expanded', 'false');

        // Add button to project header initially
        const headerActions = document.querySelector('.project-header-actions');
        if (headerActions) {
            headerActions.insertBefore(this.toggleButton, headerActions.firstChild);
        }

        // Create panel
        this.panel = document.createElement('aside');
        this.panel.className = 'info-panel';
        this.panel.setAttribute('role', 'complementary');
        this.panel.setAttribute('aria-label', 'Article information');

        this.updatePanelContent();
        document.body.appendChild(this.panel);
    }

    createCollapsibleGroup(title, content, isOpen = false) {
        const id = 'group-' + title.toLowerCase().replace(/\s+/g, '-');
        return `
            <div class="info-group ${isOpen ? 'is-open' : ''}" data-group="${id}">
                <div class="group-header">
                    <button class="group-toggle" 
                            aria-controls="${id}" 
                            aria-expanded="${isOpen}">
                        <h6>${title}</h6>
                        <svg width="12" height="12" viewBox="0 0 12 12">
                            <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </button>
                </div>
                <div class="group-content" 
                     id="${id}" 
                     aria-hidden="${!isOpen}"
                     style="height: ${isOpen ? 'auto' : '0'}">
                    <div class="group-inner">
                        ${content}
                    </div>
                </div>
            </div>
        `;
    }

    setupCollapsibleGroups() {
        this.panel.querySelectorAll('.group-toggle').forEach(toggle => {
            toggle.addEventListener('click', () => {
                const group = toggle.closest('.info-group');
                const content = group.querySelector('.group-content');
                const inner = content.querySelector('.group-inner');
                const isOpen = group.classList.contains('is-open');

                // Toggle state
                group.classList.toggle('is-open');
                toggle.setAttribute('aria-expanded', !isOpen);
                content.setAttribute('aria-hidden', isOpen);

                // Animate height
                requestAnimationFrame(() => {
                    if (!isOpen) {
                        const height = inner.offsetHeight;
                        content.style.height = height + 'px';
                    } else {
                        content.style.height = content.offsetHeight + 'px';
                        // Force reflow
                        content.offsetHeight;
                        content.style.height = '0';
                    }
                });
            });
        });
    }

    getRelatedArticleInfo(path) {
        if (!path || typeof path !== 'string') {
            console.warn('Invalid path provided to getRelatedArticleInfo:', path);
            return {
                title: 'Unknown Article',
                description: 'Related article information unavailable'
            };
        }

        const cleanPath = path
            .replace('content/', '')
            .replace('- ', '')
            .replace('.md', '');

        return this.publications.find(pub => pub.path === `${cleanPath}.md`) || {
            title: cleanPath,
            description: 'Related article'
        };
    }


    updatePanelContent() {
        if (!this.metadata) return;

        // Extract all metadata with proper defaults
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

        // Log to check what we're getting
        console.log('Author data:', author);

        const isButtonInPanel = this.panel.contains(this.toggleButton);
        if (isButtonInPanel) {
            this.toggleButton.remove();
        }

        // 2. Related Content Section
        const relatedContent = related.length || documents.length || links.length ? `
                <dl>
                    ${related.length ? `
                        <div class="info-item">
                            <dt>Related Articles</dt>
                            <dd class="related-articles">
                            <p class="category-intro">These articles share similar themes, techniques, or concepts and may provide additional context or perspectives.</p>

                                ${related.map(path => {
            const article = this.getRelatedArticleInfo(path);
            const cleanPath = path.replace('content/', '').replace('.md', '');
            return `
                                        <a href="#project/${cleanPath}" 
                                           class="related-article"
                                           data-path="${cleanPath}">
                                            <strong>${article.title}</strong>
                                            ${article.description ? `
                                                <p>${article.description}</p>
                                            ` : ''}
                                        </a>
                                    `;
        }).join('')}
                            </dd>
                        </div>
                    ` : ''}
                    ${documents.length ? `
                        <div class="info-item">
                            <dt>Documents</dt>
                            <dd class="documents-list">
                            <p class="category-intro">Supporting documentation, research papers, and reference materials that provide deeper insights into this topic.</p>

                                ${documents.map(doc => {
            const title = typeof doc === 'object'
                ? Object.keys(doc)[0]
                : doc;
            const url = typeof doc === 'object'
                ? doc[title]
                : '';
            return `
                                        <a href="${url}" class="document-link" 
                                           target="_blank" rel="noopener noreferrer">
                                            <strong>${title}</strong>
                                        </a>
                                    `;
        }).join('')}
                            </dd>
                        </div>
                    ` : ''}
                    ${links.length ? `
                        <div class="info-item">
                            <dt>External Links</dt>
                            <dd class="external-links">
                            <p class="category-intro">Curated external resources, references, and related websites that complement this article.</p>

                                ${links.map(link => {
            const title = typeof link === 'object'
                ? Object.keys(link)[0]
                : link;
            const url = typeof link === 'object'
                ? link[title]
                : '';
            return `
                                        <a href="${url}" class="external-link" 
                                           target="_blank" rel="noopener noreferrer">
                                            <strong>${title}</strong>
                                        </a>
                                    `;
        }).join('')}
                            </dd>
                        </div>
                    ` : ''}
                </dl>
            ` : '';

        // 1. Article Details Section
        const articleDetails = `
        <dl>
            ${title ? `
                <div class="info-item">
                    <dt>Title</dt>
                    <dd class="article-title">${title}</dd>
                </div>
            ` : ''}
    
            ${description ? `
                <div class="info-item">
                    <dt>Description</dt>
                    <dd class="article-description">${description}</dd>
                </div>
            ` : ''}
    
            ${author.name ? `
                <div class="info-item author-item">
                    ${author.avatar ? `
                        <img src="${author.avatar}" 
                             alt="${author.name}" 
                             class="author-avatar">
                    ` : ''}
                    <div class="author-details">
                        <dt>Author</dt>
                        <dd>${author.name}</dd>
                    </div>
                </div>
            ` : ''}
    
            ${date.published ? `
                <div class="info-item">
                    <dt>Published</dt>
                    <dd>${new Intl.DateTimeFormat('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        }).format(new Date(date.published))}</dd>
                </div>
            ` : ''}
    
            ${category ? `
                <div class="info-item">
                    <dt>Category</dt>
                    <dd>${category}</dd>
                </div>
            ` : ''}
    
            ${tags.length ? `
                <div class="info-item">
                    <dt>Tags</dt>
                    <dd class="tags-list">
                        ${tags.map(tag => `
                            <span class="info-tag">${tag}</span>
                        `).join('')}
                    </dd>
                </div>
            ` : ''}
    
            ${subcategories.length ? `
                <div class="info-item">
                    <dt>Subcategories</dt>
                    <dd class="subcategories-list">
                        ${subcategories.map(sub => `
                            <span class="info-subcategory">${sub}</span>
                        `).join('')}
                    </dd>
                </div>
            ` : ''}
        </dl>
    `;

        // 3. Project Details Section
        const projectDetails = project.status || project.client || timeline.start ? `
            <dl>
                ${project.status ? `
                    <div class="info-item">
                        <dt>Status</dt>
                        <dd>${project.status}</dd>
                    </div>
                ` : ''}
                ${project.client ? `
                    <div class="info-item">
                        <dt>Client</dt>
                        <dd>${project.client}</dd>
                    </div>
                ` : ''}
                ${project.timeline?.start && project.timeline?.end ? `
                    <div class="info-item">
                        <dt>Timeline</dt>
                        <dd>${project.timeline.start} - ${project.timeline.end}</dd>
                    </div>
                ` : ''}
            </dl>
        ` : '';

        // Assemble panel content
        // this.panel.innerHTML = `
        //     <header class="info-panel-header">
        //         <h4>Article Information</h4>
        //         <button class="close-info" aria-label="Close information panel">×</button>
        //     </header>
        //     <div class="info-panel-content">
        //         ${this.createCollapsibleGroup('Article Details', articleDetails, true)}
        //         ${relatedContent ? this.createCollapsibleGroup('Related Content', relatedContent) : ''}
        //         ${projectDetails ? this.createCollapsibleGroup('Project Info', projectDetails) : ''}
        //     </div>
        // `;

        this.panel.innerHTML = `
            <header class="info-panel-header">
                <h4>Article Information</h4>
                <button class="close-info" aria-label="Close information panel">×</button>
            </header>
            <div class="info-panel-content">
                ${this.createCollapsibleGroup('Article Details', articleDetails, false)}
                ${relatedContent ? this.createCollapsibleGroup('Related Content', relatedContent, true) : ''}

                ${projectDetails ? this.createCollapsibleGroup('Project Info', projectDetails) : ''}
            </div>
        `;

        // Setup collapsible behavior
        this.setupCollapsibleGroups();
    }

    setupEventListeners() {
        // Toggle panel visibility
        this.toggleButton.addEventListener('click', () => {
            const isOpen = !this.panel.classList.contains('is-active');
            if (isOpen) {
                this.show();
            } else {
                this.hide();
            }
        });

        // Close button
        this.panel.addEventListener('click', (e) => {
            if (e.target.classList.contains('close-info')) {
                this.hide();
            }
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.panel.classList.contains('is-active')) {
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
            if (this.panel.classList.contains('is-active') &&
                !this.panel.contains(e.target) &&
                !this.toggleButton.contains(e.target)) {
                this.hide();
            }
        });

        // Handle window resize
        this.handleResize = () => {
            if (this.debounceTimeout) {
                clearTimeout(this.debounceTimeout);
            }
            this.debounceTimeout = setTimeout(() => {
                if (window.innerWidth < 768) {
                    this.hide();
                }
            }, 150);
        };

        window.addEventListener('resize', this.handleResize);
    }

    show() {
        this.panel.classList.add('is-active');
        this.toggleButton.classList.add('is-active');
        this.toggleButton.setAttribute('aria-expanded', 'true');
    }

    hide() {
        this.panel.classList.remove('is-active');
        this.toggleButton.classList.remove('is-active');
        this.toggleButton.setAttribute('aria-expanded', 'false');
    }

    update(metadata) {
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

        window.removeEventListener('resize', this.handleResize);
    }
}