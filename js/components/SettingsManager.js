export class SettingsManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.drawer = document.querySelector('.settings-drawer');
        this.toggleButton = document.querySelector('.settings-toggle');
        this.closeButton = document.querySelector('.close-settings');
        this.fontSizes = {
            min: 14,
            max: 20,
            default: 16,
            current: 16,
            step: 1
        };
        
        this.setupEventListeners();
        this.loadSavedSettings();
    }

    setupEventListeners() {
        // Drawer controls
        this.toggleButton.addEventListener('click', () => this.toggleDrawer());
        this.closeButton.addEventListener('click', () => this.closeDrawer());
        
        // Font size controls
        document.querySelector('.font-size-increase').addEventListener('click', () => this.changeFontSize(1));
        document.querySelector('.font-size-decrease').addEventListener('click', () => this.changeFontSize(-1));
        document.querySelector('.font-size-reset').addEventListener('click', () => this.resetFontSize());
        
        // Close on backdrop tap
        this.drawer.addEventListener('click', (e) => {
            if (e.target === this.drawer) {
                this.closeDrawer();
            }
        });

        // Handle swipe down to close
        let touchStart = 0;
        this.drawer.addEventListener('touchstart', (e) => {
            touchStart = e.touches[0].clientY;
        }, { passive: true });

        this.drawer.addEventListener('touchmove', (e) => {
            const delta = e.touches[0].clientY - touchStart;
            if (delta > 50) {
                this.closeDrawer();
            }
        }, { passive: true });
    }

    toggleDrawer() {
        const isHidden = this.drawer.getAttribute('aria-hidden') === 'true';
        this.drawer.setAttribute('aria-hidden', !isHidden);
        
        // Update main nav position
        document.querySelector('.main-nav').classList.toggle('drawer-open');
    }

    closeDrawer() {
        this.drawer.setAttribute('aria-hidden', 'true');
        document.querySelector('.main-nav').classList.remove('drawer-open');
    }

    changeFontSize(direction) {
        const newSize = this.fontSizes.current + (direction * this.fontSizes.step);
        
        if (newSize >= this.fontSizes.min && newSize <= this.fontSizes.max) {
            this.fontSizes.current = newSize;
            document.documentElement.style.fontSize = `${newSize}px`;
            localStorage.setItem('fontSize', newSize);
        }
    }

    resetFontSize() {
        this.fontSizes.current = this.fontSizes.default;
        document.documentElement.style.fontSize = `${this.fontSizes.default}px`;
        localStorage.setItem('fontSize', this.fontSizes.default);
    }

    loadSavedSettings() {
        // Load saved font size
        const savedFontSize = localStorage.getItem('fontSize');
        if (savedFontSize) {
            this.fontSizes.current = parseInt(savedFontSize, 10);
            document.documentElement.style.fontSize = `${savedFontSize}px`;
        }
    }
}