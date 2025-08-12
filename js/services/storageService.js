// NEW: services/storageService.js - Unified storage management
export class StorageService {
    constructor() {
        this.prefix = 'gabriel-portfolio-';
        this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    }
    
    // PRESERVE: Theme persistence and management
    getTheme() {
        return localStorage.getItem(`${this.prefix}theme`) || 'system';
    }
    
    setTheme(theme) {
        localStorage.setItem(`${this.prefix}theme`, theme);
        this.applyTheme(theme);
    }
    
    applyTheme(theme) {
        const effectiveTheme = theme === 'system' 
            ? (this.mediaQuery.matches ? 'dark' : 'light')
            : theme;

        // If already set to this theme, don't reapply
        if (document.documentElement.getAttribute('data-theme') === effectiveTheme) {
            return effectiveTheme;
        }

        document.documentElement.setAttribute('data-theme', effectiveTheme);
        return effectiveTheme;
    }
    
    // PRESERVE: Font size persistence  
    getFontSize() {
        return parseInt(localStorage.getItem(`${this.prefix}fontSize`)) || 16;
    }
    
    setFontSize(size) {
        // Validate size bounds
        const clampedSize = Math.max(14, Math.min(20, size));
        localStorage.setItem(`${this.prefix}fontSize`, clampedSize);
        document.documentElement.style.fontSize = `${clampedSize}px`;
        return clampedSize;
    }
    
    resetFontSize() {
        return this.setFontSize(16);
    }
    
    // Generic storage methods
    get(key) {
        return localStorage.getItem(`${this.prefix}${key}`);
    }
    
    set(key, value) {
        localStorage.setItem(`${this.prefix}${key}`, value);
    }
    
    remove(key) {
        localStorage.removeItem(`${this.prefix}${key}`);
    }
    
    // Get all settings
    getAllSettings() {
        return {
            theme: this.getTheme(),
            fontSize: this.getFontSize()
        };
    }
    
    // Load and apply all saved settings
    loadSavedSettings() {
        const theme = this.getTheme();
        const fontSize = this.getFontSize();
        
        this.applyTheme(theme);
        this.setFontSize(fontSize);
        
        return { theme, fontSize };
    }
    
    // Listen to system theme changes
    onSystemThemeChange(callback) {
        this.mediaQuery.addEventListener('change', callback);
        return () => this.mediaQuery.removeEventListener('change', callback);
    }
    
    // Get effective theme (resolves 'system' to actual theme)
    getEffectiveTheme() {
        const theme = this.getTheme();
        return theme === 'system' 
            ? (this.mediaQuery.matches ? 'dark' : 'light')
            : theme;
    }
}