import { SearchComponent } from './SearchComponent.js';
import { SortComponent } from './SortComponent.js';

export class ProjectList {
    constructor(mainElement, onProjectSelect) {
        this.mainElement = mainElement;
        this.onProjectSelect = onProjectSelect;
        this.publications = [];
        this.categories = [];
        this.selectedCategory = 'all';
        this.searchQuery = '';
        this.filterNav = document.querySelector('.category-filter');
        this.searchContainer = document.querySelector('.search-container');
        this.currentSort = 'newest';
        this.sortContainer = document.querySelector('.sort-container');
    }

    async initialize() {
        try {
            await this.loadPublications();
            this.initializeSearch();
            this.initializeSort();
            this.renderFilters();
            this.renderProjects();
            this.attachEventListeners();
        } catch (error) {
            console.error('Error initializing project list:', error);
            this.renderError();
        }
    }
    initializeSort() {
        if (!this.sortContainer) {
            console.warn('Sort container not found in DOM');
            return;
        }

        new SortComponent({
            container: this.sortContainer,
            onSort: (sortType) => {
                this.currentSort = sortType;
                this.renderProjects();
            }
        });
    }

    sortPublications(publications) {
        const sorted = [...publications];
        
        switch (this.currentSort) {
            case 'newest':
                return sorted.sort((a, b) => 
                    new Date(b.date.published) - new Date(a.date.published)
                );
            case 'oldest':
                return sorted.sort((a, b) => 
                    new Date(a.date.published) - new Date(b.date.published)
                );
            case 'az':
                return sorted.sort((a, b) => 
                    a.title.localeCompare(b.title)
                );
            case 'za':
                return sorted.sort((a, b) => 
                    b.title.localeCompare(a.title)
                );
            default:
                return sorted;
        }
    }

    initializeSearch() {
        if (!this.searchContainer) {
            console.warn('Search container not found in DOM');
            return;
        }

        new SearchComponent({
            container: this.searchContainer,
            onSearch: (query) => {
                this.searchQuery = query;
                this.renderProjects();
            }
        });
    }

    async loadPublications() {
        const response = await fetch('./public/api/publications.json');
        const data = await response.json();
        this.publications = data.publications;
        
        // Extract unique categories
        const uniqueCategories = new Set(this.publications.map(pub => pub.category));
        this.categories = ['all', ...uniqueCategories];
    }

    isSearchingForStatus() {
        if (!this.searchQuery) return false;
        
        const statusPatterns = {
            'archived': /(?:--|#|-)(?:archived?)\b/i,
            'published': /(?:--|#|-)published\b/i,
            'draft': /(?:--|#|-)draft\b/i
        };

        return Object.values(statusPatterns).some(pattern => 
            pattern.test(this.searchQuery)
        );
    }

    renderProjects() {
    //     // Initial filter: only published content by default
    // let filteredPublications = this.publications.filter(pub => 
    //     // Only show published content unless specifically searching for other statuses
    //     (pub.status === 'published' || this.isSearchingForStatus()) &&
    //     // Keep existing category filter
    //     (this.selectedCategory === 'all' || pub.category === this.selectedCategory)
    // );

    let filteredPublications = this.publications.filter(pub => 
        this.selectedCategory === 'all' || pub.category === this.selectedCategory
    );


    
        if (this.searchQuery) {
            // Status keywords patterns
            const statusPatterns = {
                'archived': /(?:--|#|-)(?:archived?)\b/i,  // Matches --archived, #archived, -archived
                'published': /(?:--|#|-)published\b/i,
                'draft': /(?:--|#|-)draft\b/i
            };
    
            // Related content pattern matching
            const relatedPattern = /(?:--|#|-)related:(\d+)/i;
            const relatedMatch = this.searchQuery.match(relatedPattern);
    
            if (relatedMatch) {
                // Related content handling stays the same
                const referenceNumber = relatedMatch[1];
                const sourcePublication = this.publications.find(pub => 
                    pub.reference === referenceNumber
                );
    
                if (sourcePublication && sourcePublication.related) {
                    const relatedPaths = sourcePublication.related.map(path => 
                        path.replace('content/', '').replace(/^-\s*/, '')
                    );
                    
                    filteredPublications = filteredPublications.filter(pub => 
                        relatedPaths.includes(pub.path)
                    );
                } else {
                    filteredPublications = [];
                }
                
                const remainingQuery = this.searchQuery.replace(relatedMatch[0], '').trim();
                if (remainingQuery) {
                    filteredPublications = this.applyRegularSearch(filteredPublications, remainingQuery);
                }
            } else {
                // Check for status patterns
                let statusMatch = null;
                let matchedStatus = null;
    
                // Find first matching status pattern
                for (const [status, pattern] of Object.entries(statusPatterns)) {
                    const match = this.searchQuery.match(pattern);
                    if (match) {
                        statusMatch = match[0];
                        matchedStatus = status;
                        break;
                    }
                }
    
                if (statusMatch) {
                    // Remove the matched pattern and apply status filter
                    const remainingQuery = this.searchQuery.replace(statusMatch, '').trim();
                    filteredPublications = this.applyStatusFilter(filteredPublications, matchedStatus, remainingQuery);
                } else {
                    // Regular search
                    filteredPublications = this.applyRegularSearch(filteredPublications, this.searchQuery);
                }
            }
        }
    
        // Apply sorting and render
        filteredPublications = this.sortPublications(filteredPublications);
        this.renderFilteredPublications(filteredPublications);
    }
    
    // Helper methods to keep the code organized
    applyRegularSearch(publications, query) {
        return publications.filter(pub => {
            const searchableContent = [
                pub.title,
                pub.description,
                pub.category,
                ...(pub.tags || []),
                ...(pub.subcategories || [])
            ].join(' ').toLowerCase();
            
            return searchableContent.includes(query.toLowerCase());
        });
    }
    
    applyStatusFilter(publications, status, remainingQuery) {
        return publications.filter(pub => {
            const matchesStatus = pub.status === status;
            
            if (remainingQuery) {
                const searchableContent = [
                    pub.title,
                    pub.description,
                    pub.category,
                    ...(pub.tags || []),
                    ...(pub.subcategories || [])
                ].join(' ').toLowerCase();
                
                return matchesStatus && searchableContent.includes(remainingQuery);
            }
            
            return matchesStatus;
        });
    }
    
    renderFilteredPublications(filteredPublications) {
        this.mainElement.innerHTML = filteredPublications.length ? 
            filteredPublications.map((pub, index) => `
                <article class="project-card" data-path="${pub.path.replace(/\.md$/, '')}" style="--animation-order: ${index}">
                    ${this.getProjectCardContent(pub)}
                </article>
            `).join('') :
            '<div class="no-results">No projects found matching your criteria</div>';
    
        requestAnimationFrame(() => {
            this.mainElement.querySelectorAll('.project-card').forEach(card => {
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

    updateProjectsContent(filteredPublications) {
        this.mainElement.innerHTML = filteredPublications.length ? 
            filteredPublications.map(pub => {
                const cleanPath = pub.path.replace(/\.md$/, '');
                return `
                    <article class="project-card" data-path="${cleanPath}">
                        <!-- ... existing card content ... -->
                    </article>
                `;
            }).join('') :
            '<div class="no-results">No projects found matching your criteria</div>';

        // Set animation order for each card
        this.mainElement.querySelectorAll('.project-card').forEach((card, index) => {
            card.style.setProperty('--animation-order', index);
        });

        this.attachProjectListeners();
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
            // this.attachProjectListeners();
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
            <div class="error-message" role="alert">
                Error loading projects. Please try again later.
            </div>
        `;
    }
}