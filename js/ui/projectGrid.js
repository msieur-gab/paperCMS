// UPDATED: ui/projectGrid.js (simplified but preserves all features)
export class ProjectGrid {
    constructor(container, contentService, searchService) {
        this.container = container;
        this.contentService = contentService;
        this.searchService = searchService; // Direct reference
        this.filterNav = document.querySelector('.category-filter');
        this.searchContainer = document.querySelector('.search-container');
        this.sortContainer = document.querySelector('.sort-container');
        this.debounceTimeout = null;
        this.searchDelay = 300;
        
        this.init();
    }

    async init() {
        try {
            this.setupSearchUI();
            this.setupSortUI();
            this.setupCategoryFilters();
            this.render();
        } catch (error) {
            console.error('Error initializing project grid:', error);
            this.renderError();
        }
    }

    setupSearchUI() {
        // PRESERVE: All current search UI elements
        if (!this.searchContainer) {
            console.warn('Search container not found in DOM');
            return;
        }

        // Create search wrapper
        const searchWrapper = document.createElement('div');
        searchWrapper.className = 'search-wrapper';
        
        const searchInput = document.createElement('input');
        searchInput.type = 'search';
        searchInput.className = 'search-input';
        searchInput.placeholder = 'Search projects...';
        searchInput.setAttribute('aria-label', 'Search projects');
        
        // Create search icon
        const searchIcon = document.createElement('span');
        searchIcon.className = 'search-icon';
        searchIcon.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 20 20">
                <path d="M8.5 3a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zM1 8.5a7.5 7.5 0 1 1 13.89 4.01l3.89 3.89a1 1 0 0 1-1.42 1.42l-3.89-3.89A7.5 7.5 0 0 1 1 8.5z"/>
            </svg>`;
        
        searchWrapper.appendChild(searchIcon);
        searchWrapper.appendChild(searchInput);
        this.searchContainer.appendChild(searchWrapper);
        
        // Direct event handling (no EventBus)
        searchInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // Clear search on 'x' button click
        searchInput.addEventListener('search', (e) => {
            if (e.target.value === '') {
                this.handleSearch('');
            }
        });
    }

    setupSortUI() {
        if (!this.sortContainer) {
            console.warn('Sort container not found in DOM');
            return;
        }

        const sortWrapper = document.createElement('div');
        sortWrapper.className = 'sort-wrapper';
        
        const sortSelect = document.createElement('select');
        sortSelect.className = 'sort-select';
        sortSelect.setAttribute('aria-label', 'Sort projects');
        
        const options = [
            { value: 'newest', text: 'Newest First' },
            { value: 'oldest', text: 'Oldest First' },
            { value: 'az', text: 'A to Z' },
            { value: 'za', text: 'Z to A' }
        ];
        
        options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.text;
            sortSelect.appendChild(option);
        });
        
        sortWrapper.appendChild(sortSelect);
        this.sortContainer.appendChild(sortWrapper);
        
        sortSelect.addEventListener('change', (e) => {
            this.handleSort(e.target.value);
        });
    }

    setupCategoryFilters() {
        if (!this.filterNav) return;
        
        const categories = this.searchService.getCategories();
        
        this.filterNav.innerHTML = categories.map(category => `
            <button 
                class="category-btn ${category === 'all' ? 'active' : ''}"
                data-category="${category}">
                ${category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
        `).join('');

        // Category filter clicks
        this.filterNav.addEventListener('click', (e) => {
            const button = e.target.closest('.category-btn');
            if (!button) return;

            const category = button.dataset.category;
            
            this.filterNav.querySelectorAll('.category-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.category === category);
            });
            
            this.handleCategoryFilter(category);
        });
    }

    handleSearch(query) {
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
        }
        
        this.debounceTimeout = setTimeout(() => {
            const trimmedQuery = query.trim().toLowerCase();
            const filtered = this.searchService.applyFilters({ search: trimmedQuery });
            this.render(filtered);
        }, this.searchDelay);
    }
    
    handleCategoryFilter(category) {
        const filtered = this.searchService.applyFilters({ category });
        this.render(filtered);
    }
    
    handleSort(sortType) {
        const filtered = this.searchService.applyFilters({ sort: sortType });
        this.render(filtered);
    }
    
    render(filteredProjects = null) {
        const projects = filteredProjects || this.searchService.applyFilters();

        this.container.innerHTML = projects.length ? 
            projects.map((pub, index) => `
                <article class="project-card" data-path="${pub.path.replace(/\.md$/, '')}" style="--animation-order: ${index}">
                    ${this.getProjectCardContent(pub)}
                </article>
            `).join('') :
            '<div class="no-results">No projects found matching your criteria</div>';
    
        requestAnimationFrame(() => {
            this.container.querySelectorAll('.project-card').forEach(card => {
                card.classList.add('visible');
            });
        });
    
        this.attachProjectListeners();
    }

    getProjectCardContent(pub) {
        return `
            ${pub.reference ? `<h1 class="series-number">${pub.reference}</h1>` : ''}
            <h2 class="project-title">${pub.title}</h2>
            ${pub.tags?.length ? `
                <ul class="project-tags" aria-label="Project tags">
                    ${pub.tags.map(tag => `<li class="project-tag">${tag}</li>`).join('')}
                </ul>
            ` : ''}
            ${pub.thumbnail ? `
                <img src="${pub.thumbnail}" alt="${pub.title}" class="project-thumbnail">
            ` : ''}
            <p class="project-description">${pub.description}</p>
            <footer class="project-meta">
                <span class="project-category">${pub.category}</span>
                <time datetime="${pub.date.published}">
                    ${new Date(pub.date.published).toLocaleDateString()}
                </time>
                ${pub.status ? `<span class="project-status">${pub.status}</span>` : ''}
            </footer>
        `;
    }

    attachProjectListeners() {
        this.container.querySelectorAll('.project-card').forEach(card => {
            card.addEventListener('click', () => {
                const path = card.dataset.path;
                if (this.onProjectSelect) {
                    this.onProjectSelect(path);
                }
            });
        });
    }

    setOnProjectSelect(callback) {
        this.onProjectSelect = callback;
    }

    renderError() {
        this.container.innerHTML = `
            <div class="error-message" role="alert">
                Error loading projects. Please try again later.
            </div>
        `;
    }

    // Get current filter state
    getCurrentFilters() {
        return this.searchService.getCurrentFilters();
    }

    // Reset all filters
    reset() {
        const projects = this.searchService.reset();
        this.render(projects);
        
        // Reset UI elements
        const searchInput = document.querySelector('.search-input');
        if (searchInput) searchInput.value = '';
        
        const sortSelect = document.querySelector('.sort-select');
        if (sortSelect) sortSelect.value = 'newest';
        
        // Reset category buttons
        this.filterNav?.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === 'all');
        });
    }

    destroy() {
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
        }
    }
}