// New SettingsManager.js
export class SettingsManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.drawer = document.querySelector('.settings-drawer');
        this.toggleButton = document.querySelector('.settings-toggle');
        this.closeButton = document.querySelector('.close-settings');
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.toggleButton.addEventListener('click', () => this.toggleDrawer());
        this.closeButton.addEventListener('click', () => this.closeDrawer());
        
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
    }

    closeDrawer() {
        this.drawer.setAttribute('aria-hidden', 'true');
    }
}