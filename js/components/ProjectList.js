export class ProjectList {
    constructor(mainElement, onProjectSelect) {
        this.mainElement = mainElement;
        this.onProjectSelect = onProjectSelect;
        this.publications = [];
        this.categories = [];
        this.selectedCategory = 'all';
        this.filterNav = document.querySelector('.category-filter');
    }

    async initialize() {
        try {
            await this.loadPublications();
            this.renderFilters();
            this.renderProjects();
            this.attachEventListeners();
        } catch (error) {
            console.error('Error initializing project list:', error);
            this.renderError();
        }
    }

    async loadPublications() {
        const response = await fetch('/public/api/publications.json');
        const data = await response.json();
        this.publications = data.publications;
        
        // Extract unique categories
        const uniqueCategories = new Set(this.publications.map(pub => pub.category));
        this.categories = ['all', ...uniqueCategories];
    }

    renderProjects() {
        const filteredPublications = this.publications.filter(pub => 
            this.selectedCategory === 'all' || pub.category === this.selectedCategory
        );

        this.mainElement.innerHTML = filteredPublications.map(pub => {
            // Remove .md extension for clean URLs
            const cleanPath = pub.path.replace(/\.md$/, '');
            
            return `
                <div class="project-card" data-path="${cleanPath}">
                    <h3 class="project-title">${pub.title}</h3>
                    <p class="project-description">${pub.description}</p>
                    <div class="project-tags">
                        ${pub.tags.map(tag => `
                            <span class="project-tag">${tag}</span>
                        `).join('')}
                    </div>
                    <div class="project-meta">
                        <span class="project-category">${pub.category}</span>
                        <time class="project-date">
                            ${new Date(pub.date.published).toLocaleDateString()}
                        </time>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderFilters() {
        if (!this.filterNav) return;
        
        this.filterNav.innerHTML = this.categories.map(category => `
            <button 
                class="category-btn ${this.selectedCategory === category ? 'active' : ''}"
                data-category="${category}">
                ${category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
        `).join('');
    }

    attachEventListeners() {
        // Category filter clicks
        this.filterNav?.addEventListener('click', (e) => {
            const button = e.target.closest('.category-btn');
            if (!button) return;

            this.selectedCategory = button.dataset.category;
            
            this.filterNav.querySelectorAll('.category-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.category === this.selectedCategory);
            });
            
            this.renderProjects();
            this.attachProjectListeners();
        });

        this.attachProjectListeners();
    }

    attachProjectListeners() {
        this.mainElement.querySelectorAll('.project-card').forEach(card => {
            card.addEventListener('click', () => {
                const path = card.dataset.path;
                if (this.onProjectSelect) {
                    this.onProjectSelect(path);
                }
            });
        });
    }

    renderError() {
        this.mainElement.innerHTML = `
            <div class="error-message">
                Error loading projects. Please try again later.
            </div>
        `;
    }
}