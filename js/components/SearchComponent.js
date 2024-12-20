export class SearchComponent {
    constructor(config) {
        this.container = config.container;
        this.onSearch = config.onSearch;
        this.debounceTimeout = null;
        this.searchDelay = 300;
        
        this.initialize();
    }

    initialize() {
        // Create search input
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
        
        // Assemble and insert elements
        searchWrapper.appendChild(searchIcon);
        searchWrapper.appendChild(searchInput);
        this.container.insertBefore(searchWrapper, this.container.firstChild);
        
        // Bind events
        this.bindEvents(searchInput);
    }

    bindEvents(searchInput) {
        searchInput.addEventListener('input', (e) => {
            if (this.debounceTimeout) {
                clearTimeout(this.debounceTimeout);
            }
            
            this.debounceTimeout = setTimeout(() => {
                const query = e.target.value.trim().toLowerCase();
                if (this.onSearch) {
                    this.onSearch(query);
                }
            }, this.searchDelay);
        });

        // Clear search on 'x' button click
        searchInput.addEventListener('search', (e) => {
            if (e.target.value === '') {
                this.onSearch('');
            }
        });
    }
}

