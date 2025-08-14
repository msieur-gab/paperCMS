// ResizeManager - Centralized responsive behavior handling
export class ResizeManager {
    constructor() {
        this.subscribers = new Map();
        this.isDesktop = window.innerWidth >= 768;
        this.currentWidth = window.innerWidth;
        this.currentHeight = window.innerHeight;
        
        this.debounceTimeout = null;
        this.debounceDelay = 250;
        
        this.setupListeners();
    }

    setupListeners() {
        const handleResize = () => {
            clearTimeout(this.debounceTimeout);
            this.debounceTimeout = setTimeout(() => {
                this.processResize();
            }, this.debounceDelay);
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', () => {
            // Orientation change needs a slight delay to get accurate dimensions
            setTimeout(() => handleResize(), 100);
        });
        
        // Store handler for cleanup
        this.resizeHandler = handleResize;
    }

    processResize() {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;
        const newIsDesktop = newWidth >= 768;
        
        // Check if we crossed the mobile/desktop breakpoint
        const breakpointChanged = this.isDesktop !== newIsDesktop;
        
        const resizeData = {
            width: newWidth,
            height: newHeight,
            isDesktop: newIsDesktop,
            isMobile: !newIsDesktop,
            breakpointChanged,
            previousWidth: this.currentWidth,
            previousHeight: this.currentHeight,
            previousIsDesktop: this.isDesktop
        };

        // Update internal state
        this.currentWidth = newWidth;
        this.currentHeight = newHeight;
        this.isDesktop = newIsDesktop;

        // Notify all subscribers
        this.notifySubscribers(resizeData);
    }

    // Subscribe a component to resize events
    subscribe(componentId, callback) {
        if (typeof callback !== 'function') {
            throw new Error('ResizeManager: callback must be a function');
        }
        
        this.subscribers.set(componentId, callback);
        
        // Return unsubscribe function
        return () => this.unsubscribe(componentId);
    }

    // Unsubscribe a component
    unsubscribe(componentId) {
        this.subscribers.delete(componentId);
    }

    // Notify all subscribers of resize event
    notifySubscribers(resizeData) {
        for (const [componentId, callback] of this.subscribers) {
            try {
                callback(resizeData);
            } catch (error) {
                console.error(`ResizeManager: Error in ${componentId} resize handler:`, error);
            }
        }
    }

    // Get current state
    getCurrentState() {
        return {
            width: this.currentWidth,
            height: this.currentHeight,
            isDesktop: this.isDesktop,
            isMobile: !this.isDesktop
        };
    }

    // Check if currently mobile
    isMobileViewport() {
        return !this.isDesktop;
    }

    // Check if currently desktop
    isDesktopViewport() {
        return this.isDesktop;
    }

    // Cleanup
    destroy() {
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
            window.removeEventListener('orientationchange', this.resizeHandler);
        }
        
        clearTimeout(this.debounceTimeout);
        this.subscribers.clear();
    }
}