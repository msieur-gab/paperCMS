export class SortComponent {
    constructor(config) {
        this.container = config.container;
        this.onSort = config.onSort;
        this.currentSort = 'newest';
        
        this.initialize();
    }

    initialize() {
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
        this.container.appendChild(sortWrapper);
        
        // Bind events
        sortSelect.addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            if (this.onSort) {
                this.onSort(this.currentSort);
            }
        });
    }
}