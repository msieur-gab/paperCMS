// Simple storage functions - no classes needed
const PREFIX = 'gabriel-portfolio-';
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

// Theme management
export const getTheme = () => localStorage.getItem(`${PREFIX}theme`) || 'system';
export const setTheme = (theme) => {
    localStorage.setItem(`${PREFIX}theme`, theme);
    applyTheme(theme);
};

export const applyTheme = (theme) => {
    const effectiveTheme = theme === 'system' 
        ? (mediaQuery.matches ? 'dark' : 'light')
        : theme;

    if (document.documentElement.getAttribute('data-theme') === effectiveTheme) {
        return effectiveTheme;
    }

    document.documentElement.setAttribute('data-theme', effectiveTheme);
    return effectiveTheme;
};

// Font size management
export const getFontSize = () => parseInt(localStorage.getItem(`${PREFIX}fontSize`)) || 16;
export const setFontSize = (size) => {
    const clampedSize = Math.max(14, Math.min(20, size));
    localStorage.setItem(`${PREFIX}fontSize`, clampedSize);
    document.documentElement.style.fontSize = `${clampedSize}px`;
    return clampedSize;
};

export const resetFontSize = () => setFontSize(16);

// Generic storage
export const store = (key, value) => localStorage.setItem(`${PREFIX}${key}`, value);
export const retrieve = (key) => localStorage.getItem(`${PREFIX}${key}`);

// Initialize settings
export const loadSavedSettings = () => {
    const theme = getTheme();
    const fontSize = getFontSize();
    
    applyTheme(theme);
    setFontSize(fontSize);
    
    return { theme, fontSize };
};

// System theme listener
export const onSystemThemeChange = (callback) => {
    mediaQuery.addEventListener('change', callback);
    return () => mediaQuery.removeEventListener('change', callback);
};