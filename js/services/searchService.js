// NEW: services/searchService.js - Preserves all complex search functionality
export class SearchService {
    constructor(projects) {
        this.allProjects = projects;
        this.filteredProjects = [...projects];
        this.currentFilters = {
            search: '',
            category: 'all',
            sort: 'newest'
        };
    }

    // PRESERVE: All current search capabilities
    applyFilters(filters = {}) {
        this.currentFilters = { ...this.currentFilters, ...filters };
        
        let filtered = [...this.allProjects];
        
        // Default: Only show published projects unless specifically searching for status
        if (!this.currentFilters.search || !this.isSearchingForStatus(this.currentFilters.search)) {
            filtered = filtered.filter(p => p.status === 'published');
        }
        
        // Category filter
        if (this.currentFilters.category !== 'all') {
            filtered = filtered.filter(p => p.category === this.currentFilters.category);
        }
        
        // PRESERVE: Complex search patterns
        if (this.currentFilters.search) {
            filtered = this.applySearchPattern(filtered, this.currentFilters.search);
        }
        
        // PRESERVE: Sorting options
        filtered = this.applySorting(filtered, this.currentFilters.sort);
        
        this.filteredProjects = filtered;
        return filtered;
    }
    
    // PRESERVE: Your sophisticated search patterns
    applySearchPattern(projects, query) {
        // Status keywords patterns
        const statusPatterns = {
            'archived': /(?:--|#|-)(?:archived?)\b/i,  // Matches --archived, #archived, -archived
            'published': /(?:--|#|-)published\b/i,
            'draft': /(?:--|#|-)draft\b/i
        };

        // Related content pattern matching
        const relatedPattern = /(?:--|#|-)related:(\d+)/i;
        const relatedMatch = query.match(relatedPattern);

        if (relatedMatch) {
            // Related content handling
            const referenceNumber = relatedMatch[1];
            const sourcePublication = this.allProjects.find(pub => 
                pub.reference === referenceNumber
            );

            if (sourcePublication && sourcePublication.related) {
                const relatedPaths = sourcePublication.related.map(path => 
                    path.replace('content/', '').replace(/^-\s*/, '')
                );
                
                projects = projects.filter(pub => 
                    relatedPaths.includes(pub.path)
                );
            } else {
                projects = [];
            }
            
            const remainingQuery = query.replace(relatedMatch[0], '').trim();
            if (remainingQuery) {
                projects = this.applyRegularSearch(projects, remainingQuery);
            }
        } else {
            // Check for status patterns
            let statusMatch = null;
            let matchedStatus = null;

            // Find first matching status pattern
            for (const [status, pattern] of Object.entries(statusPatterns)) {
                const match = query.match(pattern);
                if (match) {
                    statusMatch = match[0];
                    matchedStatus = status;
                    break;
                }
            }

            if (statusMatch) {
                // Remove the matched pattern and apply status filter
                const remainingQuery = query.replace(statusMatch, '').trim();
                projects = this.applyStatusFilter(projects, matchedStatus, remainingQuery);
            } else {
                // Regular search
                projects = this.applyRegularSearch(projects, query);
            }
        }
        
        return projects;
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

    // PRESERVE: Sorting functionality
    applySorting(projects, sortType) {
        const sorted = [...projects];
        
        switch (sortType) {
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

    // Get categories for filter UI
    getCategories() {
        const uniqueCategories = new Set(this.allProjects.map(pub => pub.category));
        return ['all', ...uniqueCategories];
    }

    // Helper to check if searching for status
    isSearchingForStatus(query) {
        if (!query) return false;
        
        const statusPatterns = {
            'archived': /(?:--|#|-)(?:archived?)\b/i,
            'published': /(?:--|#|-)published\b/i,
            'draft': /(?:--|#|-)draft\b/i
        };

        return Object.values(statusPatterns).some(pattern => 
            pattern.test(query)
        );
    }

    // Get current filter state
    getCurrentFilters() {
        return { ...this.currentFilters };
    }

    // Reset filters
    reset() {
        this.currentFilters = {
            search: '',
            category: 'all',
            sort: 'newest'
        };
        this.filteredProjects = [...this.allProjects];
        return this.filteredProjects;
    }
}