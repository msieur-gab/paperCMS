// UPDATED: ui/settingsDrawer.js - Consolidated settings management
import { getTheme, setTheme, getFontSize, setFontSize, resetFontSize, onSystemThemeChange } from '../utils/storage.js';

export class SettingsDrawer {
    constructor() {
        this.drawer = document.querySelector('.settings-drawer');
        this.toggleButton = document.querySelector('.settings-toggle');
        this.closeButton = document.querySelector('.close-settings');
        this.isOpen = false;
        
        this.fontSizes = {
            min: 14,
            max: 20,
            default: 16,
            current: 16,
            step: 1
        };
        
        if (!this.drawer || !this.toggleButton) {
            return;
        }
        
        this.init();
    }
    
    init() {
        this.setupDrawerControls();
        this.setupThemeControls(); // PRESERVE: Theme switching
        this.setupFontControls();  // PRESERVE: Font size controls
        this.setupGestureControls(); // PRESERVE: Mobile swipe gestures
        this.loadSavedSettings();
    }
    
    setupDrawerControls() {
        // Drawer toggle
        this.toggleButton.addEventListener('click', () => this.toggleDrawer());
        this.closeButton?.addEventListener('click', () => this.closeDrawer());
        
        // PRESERVE: Enhanced click outside handling using mousedown
        document.addEventListener('mousedown', (e) => {
            if (this.drawer.getAttribute('aria-hidden') === 'false' && 
                !this.drawer.contains(e.target) && 
                !this.toggleButton.contains(e.target)) {
                this.closeDrawer();
                e.preventDefault();
            }
        });
    }
    
    // PRESERVE: All current theme functionality
    setupThemeControls() {
        const themeToggles = document.querySelectorAll('.theme-toggle');
        
        themeToggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        });
        
        // Handle system theme changes
        const unsubscribe = onSystemThemeChange(() => {
            if (getTheme() === 'system') {
                setTheme('system');
                this.updateThemeToggleButtons();
            }
        });
        
        // Store unsubscribe function for cleanup
        this._unsubscribeSystemTheme = unsubscribe;
        
        // Initial theme toggle update
        this.updateThemeToggleButtons();
    }
    
    toggleTheme() {
        const currentTheme = getTheme() === 'system' 
            ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
            : getTheme();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        this.updateThemeToggleButtons();
    }
    
    updateThemeToggleButtons() {
        const themeToggles = document.querySelectorAll('.theme-toggle');
        const theme = getTheme();
        const effectiveTheme = theme === 'system' 
            ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
            : theme;
        
        themeToggles.forEach(toggle => {
            toggle.setAttribute('aria-label', 
                effectiveTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
            );
            toggle.setAttribute('data-theme', effectiveTheme);
        });
    }
    
    // PRESERVE: Font size controls
    setupFontControls() {
        const fontControls = {
            increase: document.querySelector('.font-size-increase'),
            decrease: document.querySelector('.font-size-decrease'),
            reset: document.querySelector('.font-size-reset')
        };

        fontControls.increase?.addEventListener('click', () => this.changeFontSize(1));
        fontControls.decrease?.addEventListener('click', () => this.changeFontSize(-1));
        fontControls.reset?.addEventListener('click', () => this.resetFontSize());
    }
    
    changeFontSize(direction) {
        const currentSize = getFontSize();
        const newSize = currentSize + (direction * this.fontSizes.step);
        const clampedSize = Math.max(this.fontSizes.min, Math.min(this.fontSizes.max, newSize));
        
        setFontSize(clampedSize);
        this.fontSizes.current = clampedSize;
        
        // Update button states
        this.updateFontControlButtons();
    }
    
    resetFontSize() {
        resetFontSize();
        this.fontSizes.current = this.fontSizes.default;
        this.updateFontControlButtons();
    }
    
    updateFontControlButtons() {
        const currentSize = this.fontSizes.current;
        const increaseBtn = document.querySelector('.font-size-increase');
        const decreaseBtn = document.querySelector('.font-size-decrease');
        
        if (increaseBtn) {
            increaseBtn.disabled = currentSize >= this.fontSizes.max;
        }
        if (decreaseBtn) {
            decreaseBtn.disabled = currentSize <= this.fontSizes.min;
        }
    }
    
    // PRESERVE: Mobile gesture support
    setupGestureControls() {
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
                
                // Only handle vertical swipes with minimal horizontal movement
                if (deltaX < 50 && deltaY > 30) {
                    this.drawer.style.transform = `translateY(${Math.max(0, deltaY)}px)`;
                    
                    // Auto-close if swiped down significantly
                    if (deltaY > 100) {
                        this.closeDrawer();
                    }
                }
            }
        }, { passive: true });

        this.drawer.addEventListener('touchend', () => {
            // Reset transform
            this.drawer.style.transform = '';
        }, { passive: true });
    }
    
    loadSavedSettings() {
        const settings = loadSavedSettings();
        this.fontSizes.current = settings.fontSize;
        this.updateFontControlButtons();
        this.updateThemeToggleButtons();
    }
    
    toggleDrawer() {
        if (this.isOpen) {
            this.closeDrawer();
        } else {
            this.openDrawer();
        }
    }
    
    openDrawer() {
        this.isOpen = true;
        
        // Restore focusability to all elements inside the drawer
        const focusableElements = this.drawer.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex="-1"]'
        );
        focusableElements.forEach(element => {
            element.removeAttribute('tabindex');
        });
        
        this.drawer.setAttribute('aria-hidden', 'false');
        document.body.classList.add('settings-open');
        this.toggleButton.setAttribute('aria-expanded', 'true');
    }
    
    closeDrawer() {
        this.isOpen = false;
        
        // Fix accessibility: Remove focus from any element inside the drawer before hiding it
        if (this.drawer.contains(document.activeElement)) {
            document.activeElement.blur();
        }
        
        // Make all focusable elements inside the drawer non-focusable when hidden
        const focusableElements = this.drawer.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        focusableElements.forEach(element => {
            element.setAttribute('tabindex', '-1');
        });
        
        this.drawer.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('settings-open');
        this.toggleButton.setAttribute('aria-expanded', 'false');
        
        // Reset any transform applied during gestures
        this.drawer.style.transform = '';
    }
    
    // Get current settings
    getCurrentSettings() {
        return {
            theme: getTheme(),
            effectiveTheme: getTheme() === 'system' 
                ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                : getTheme(),
            fontSize: getFontSize(),
            isOpen: this.isOpen
        };
    }
    
    // Cleanup method
    destroy() {
        if (this._unsubscribeSystemTheme) {
            this._unsubscribeSystemTheme();
        }
        this.closeDrawer();
    }
}