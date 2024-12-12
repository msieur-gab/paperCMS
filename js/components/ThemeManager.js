export class ThemeManager {
    constructor(eventBus) {
        // Core dependencies
        this.eventBus = eventBus;
        
        // State
        this.currentTheme = localStorage.getItem('theme') || 'system';
        this.isTransitioning = false;
        
        // System theme detection
        this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        // Animation duration (should match CSS)
        this.transitionDuration = 500;
        
        // Bind methods that will be used as event listeners
        this.handleSystemThemeChange = this.handleSystemThemeChange.bind(this);
        this.handleThemeToggleClick = this.handleThemeToggleClick.bind(this);
        
        // Initialize
        this.initialize();
    }

    toggleTheme() {
        const currentEffectiveTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentEffectiveTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
    }
    
    initialize() {
        // Apply initial theme
        this.applyTheme(this.currentTheme);
        
        // Set up system theme change listener
        this.mediaQuery.addEventListener('change', this.handleSystemThemeChange);
        
        // Set up theme toggle button if it exists
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', this.handleThemeToggleClick);
            this.updateToggleButtonState(themeToggle);
        }
        
        // Listen for theme change events from other parts of the application
        this.eventBus.on('themeChange', (theme) => this.applyTheme(theme));
    }

    async applyTheme(theme) {
        // Prevent multiple transitions at once
        if (this.isTransitioning) return;
        
        try {
            this.isTransitioning = true;
            
            // Store the theme preference
            this.currentTheme = theme;
            localStorage.setItem('theme', theme);

            // Get the actual theme value based on system or explicit choice
            const effectiveTheme = theme === 'system' 
                ? (this.mediaQuery.matches ? 'dark' : 'light')
                : theme;

            // Apply theme to document
            document.documentElement.setAttribute('data-theme', effectiveTheme);
            
            // Update meta theme-color for mobile browsers
            this.updateMetaThemeColor(effectiveTheme);
            
            // Update toggle button if it exists
            const toggle = document.querySelector('.theme-toggle');
            if (toggle) {
                this.updateToggleButtonState(toggle);
            }

            // Emit theme updated event
            this.eventBus.emit('themeUpdated', {
                preference: theme,
                effective: effectiveTheme
            });

            // Wait for transition to complete
            await new Promise(resolve => setTimeout(resolve, this.transitionDuration));
            
        } catch (error) {
            console.error('Error applying theme:', error);
            this.eventBus.emit('themeError', error);
        } finally {
            this.isTransitioning = false;
        }
    }

    handleSystemThemeChange(event) {
        if (this.currentTheme === 'system') {
            const newTheme = event.matches ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
            
            this.updateMetaThemeColor(newTheme);
            
            // Notify the application of the system theme change
            this.eventBus.emit('themeUpdated', {
                preference: 'system',
                effective: newTheme
            });
        }
    }

    handleThemeToggleClick() {
        const currentEffectiveTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentEffectiveTheme === 'dark' ? 'light' : 'dark';
        this.toggleTheme(); 
    }

    updateToggleButtonState(toggle) {
        const effectiveTheme = document.documentElement.getAttribute('data-theme');
        
        // Update aria-label
        toggle.setAttribute('aria-label', 
            `Switch to ${effectiveTheme === 'dark' ? 'light' : 'dark'} theme`
        );
        
        // Update pressed state for system theme
        toggle.setAttribute('aria-pressed', this.currentTheme !== 'system');
    }

    updateMetaThemeColor(theme) {
        // Update theme-color meta tag for mobile browsers
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute(
                'content',
                theme === 'dark' ? '#212529' : '#ffffff'
            );
        }
    }

    getCurrentTheme() {
        return {
            preference: this.currentTheme,
            effective: document.documentElement.getAttribute('data-theme')
        };
    }

    isSystemTheme() {
        return this.currentTheme === 'system';
    }

    isDarkTheme() {
        return document.documentElement.getAttribute('data-theme') === 'dark';
    }

    destroy() {
        // Remove system theme change listener
        this.mediaQuery.removeEventListener('change', this.handleSystemThemeChange);
        
        // Remove theme toggle button listener
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.removeEventListener('click', this.handleThemeToggleClick);
        }
        
        // Clean up event bus listeners
        // Note: This assumes your EventBus has an 'off' method
        this.eventBus.off('themeChange');
    }
}