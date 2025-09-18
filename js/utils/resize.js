// Simple resize utilities - no classes needed
let isDesktop = window.innerWidth >= 768;
const resizeCallbacks = new Set();

// Debounced resize handler
let resizeTimeout = null;
const handleResize = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        const newIsDesktop = window.innerWidth >= 768;
        const breakpointChanged = isDesktop !== newIsDesktop;
        
        if (breakpointChanged) {
            isDesktop = newIsDesktop;
            // Notify all callbacks of breakpoint change
            resizeCallbacks.forEach(callback => {
                try {
                    callback(isDesktop);
                } catch (error) {
                    console.error('Resize callback error:', error);
                }
            });
        }
    }, 250);
};

// Set up listeners once
window.addEventListener('resize', handleResize);
window.addEventListener('orientationchange', () => {
    setTimeout(handleResize, 100);
});

// Public API
export const isDesktopViewport = () => isDesktop;
export const isMobileViewport = () => !isDesktop;

export const onBreakpointChange = (callback) => {
    resizeCallbacks.add(callback);
    return () => resizeCallbacks.delete(callback);
};