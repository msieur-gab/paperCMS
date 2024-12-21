export class ThemeManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.currentTheme = localStorage.getItem('theme') || 'system';
        this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        this.transitionDuration = 500;
        
        // Get both theme toggle buttons (main and drawer)
        this.themeToggles = document.querySelectorAll('.theme-toggle');
        
        // Bind methods for event listeners
        this.handleSystemThemeChange = this.handleSystemThemeChange.bind(this);
        this.handleThemeToggle = this.handleThemeToggle.bind(this);
        
        this.initialize();
    }

    initialize() {
        // Apply initial theme
        this.applyTheme(this.currentTheme);
        
        // Listen for system theme changes
        this.mediaQuery.addEventListener('change', this.handleSystemThemeChange);
        
        // Set up theme toggle buttons
        this.themeToggles.forEach(toggle => {
            toggle.addEventListener('click', this.handleThemeToggle);
            this.updateToggleButton(toggle);
        });
    }

    handleThemeToggle() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
    }

    async applyTheme(theme) {
        this.currentTheme = theme;
        localStorage.setItem('theme', theme);

        const effectiveTheme = theme === 'system' 
            ? (this.mediaQuery.matches ? 'dark' : 'light')
            : theme;

        // If already set to this theme, don't reapply
        if (document.documentElement.getAttribute('data-theme') === effectiveTheme) {
            return;
        }

        document.documentElement.setAttribute('data-theme', effectiveTheme);
        
        // Update all toggle buttons
        this.themeToggles.forEach(toggle => {
            this.updateToggleButton(toggle);
        });

        // Emit theme change event
        this.eventBus.emit('themeUpdated', {
            theme: effectiveTheme,
            isSystem: theme === 'system'
        });
    }

    handleSystemThemeChange(event) {
        if (this.currentTheme === 'system') {
            this.applyTheme('system');
        }
    }

    updateToggleButton(toggle) {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        toggle.setAttribute('aria-label', `Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} theme`);
    }

    destroy() {
        this.mediaQuery.removeEventListener('change', this.handleSystemThemeChange);
        
        this.themeToggles.forEach(toggle => {
            toggle.removeEventListener('click', this.handleThemeToggle);
        });
    }
}