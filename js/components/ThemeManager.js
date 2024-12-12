// js/components/ThemeManager.js
export class ThemeManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.currentTheme = localStorage.getItem('theme') || 'system';
        this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        this.initialize();
    }
    
    initialize() {
        // Apply initial theme
        this.applyTheme(this.currentTheme);
        
        // Listen for system theme changes
        this.mediaQuery.addListener(() => this.handleSystemThemeChange());
        
        // Listen for theme change events
        this.eventBus.on('themeChange', (theme) => this.applyTheme(theme));
    }
    
    applyTheme(theme) {
        this.currentTheme = theme;
        localStorage.setItem('theme', theme);
        
        if (theme === 'system') {
            this.handleSystemThemeChange();
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }
        
        // Emit theme updated event
        this.eventBus.emit('themeUpdated', theme);
    }
    
    handleSystemThemeChange() {
        if (this.currentTheme === 'system') {
            const isDark = this.mediaQuery.matches;
            document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        }
    }
    
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
    }
    
    destroy() {
        this.mediaQuery.removeListener(this.handleSystemThemeChange);
    }
}