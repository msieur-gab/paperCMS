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
        
        if (!this.drawer || !this.toggleButton) {
            console.warn('Settings drawer elements not found in DOM');
            return;
        }
        
        this.setupEventListeners();
        this.loadSavedSettings();
    }

    setupEventListeners() {
        // Drawer controls
        this.toggleButton.addEventListener('click', () => this.toggleDrawer());
        this.closeButton?.addEventListener('click', () => this.closeDrawer());
        
        // Font size controls
        const fontControls = {
            increase: document.querySelector('.font-size-increase'),
            decrease: document.querySelector('.font-size-decrease'),
            reset: document.querySelector('.font-size-reset')
        };

        fontControls.increase?.addEventListener('click', () => this.changeFontSize(1));
        fontControls.decrease?.addEventListener('click', () => this.changeFontSize(-1));
        fontControls.reset?.addEventListener('click', () => this.resetFontSize());
        
        // Enhanced click outside handling using mousedown
        document.addEventListener('mousedown', (e) => {
            if (this.drawer.getAttribute('aria-hidden') === 'false' && 
                !this.drawer.contains(e.target) && 
                !this.toggleButton.contains(e.target)) {
                this.closeDrawer();
                e.preventDefault();
            }
        });

        // Enhanced touch handling for mobile
        let touchStart = { y: 0, x: 0 };
        let touchMove = { y: 0, x: 0 };
        
        this.drawer.addEventListener('touchstart', (e) => {
            if (e.target === this.drawer) {
                touchStart.y = e.touches[0].clientY;
                touchStart.x = e.touches[0].clientX;
                touchMove = { ...touchStart };
            }
        }, { passive: true });

        this.drawer.addEventListener('touchmove', (e) => {
            if (e.target === this.drawer) {
                touchMove.y = e.touches[0].clientY;
                touchMove.x = e.touches[0].clientX;
                
                const deltaY = touchMove.y - touchStart.y;
                const deltaX = Math.abs(touchMove.x - touchStart.x);
                
                // Only handle vertical swipes
                if (deltaY > 30 && deltaX < 30) {
                    // Add visual feedback during swipe
                    this.drawer.style.transform = `translateY(${deltaY}px)`;
                    
                    if (deltaY > 100) {
                        this.closeDrawer();
                    }
                }
            }
        }, { passive: true });
        
        this.drawer.addEventListener('touchend', () => {
            if (this.drawer.getAttribute('aria-hidden') === 'false') {
                this.drawer.style.transform = '';
            }
        });
        
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.drawer.getAttribute('aria-hidden')) {
                this.closeDrawer();
            }
        });

        // Handle click on backdrop
        this.drawer.addEventListener('click', (e) => {
            if (e.target === this.drawer) {
                this.closeDrawer();
            }
        });
    }

    toggleDrawer() {
        const isHidden = this.drawer.getAttribute('aria-hidden') === 'true';
        this.drawer.setAttribute('aria-hidden', !isHidden);
        
        // Update main nav position
        document.querySelector('.main-nav')?.classList.toggle('drawer-open');
        
        // Update toggle button state
        this.toggleButton.setAttribute('aria-expanded', !isHidden);
    }

    closeDrawer() {
        this.drawer.setAttribute('aria-hidden', 'true');
        document.querySelector('.main-nav')?.classList.remove('drawer-open');
        this.toggleButton.setAttribute('aria-expanded', 'false');
        
        // Reset any transform applied during swipe
        this.drawer.style.transform = '';
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