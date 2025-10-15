/**
 * Intelligent Media Synchronization API
 *
 * A reusable, framework-agnostic API for synchronizing media content with scroll position
 * based on visibility, scroll velocity, and reading behavior patterns.
 *
 * @module IntelligentMediaSync
 * @version 2.0.0
 */

/**
 * @typedef {Object} SyncOptions
 * @property {string} [scrollContainerSelector='.content-scroll'] - CSS selector for scroll container
 * @property {number} [emaAlpha=0.25] - Exponential moving average alpha for velocity smoothing (0-1)
 * @property {number} [minSwitchInterval=120] - Minimum milliseconds between element switches
 * @property {number} [debounceMs=0] - Debounce delay (retained for compatibility, unused)
 * @property {number} [slowScrollThreshold=0.02] - Velocity threshold for slow scroll mode (px/ms)
 * @property {number} [mediumScrollThreshold=0.2] - Velocity threshold for medium scroll mode (px/ms)
 * @property {number} [velocityThreshold=0.4] - Velocity threshold for fast scroll mode (px/ms)
 * @property {number} [anticipationZone=150] - Distance in pixels to look ahead for upcoming elements
 * @property {number} [fastLookaheadMs=200] - Milliseconds to predict ahead during fast scrolling
 * @property {number} [significanceThreshold=0.15] - Minimum visibility improvement required to switch (0-1)
 * @property {number} [enterThreshold=0.4] - Visibility required for element to become active (0-1)
 * @property {number} [leaveThreshold=0.15] - Visibility below which current element loses active status (0-1)
 * @property {number} [historyLength=10] - Number of scroll history samples to maintain
 */

/**
 * @typedef {Object} ActiveChangePayload
 * @property {HTMLElement} element - The newly active element
 * @property {number} index - The index of the newly active element in the observed array
 */

/**
 * @callback OnActiveChangeCallback
 * @param {ActiveChangePayload} payload - Information about the newly active element
 * @returns {void|Promise<void>} - Optional promise for async operations
 */

/**
 * @typedef {Object} SyncState
 * @property {number} currentIndex - Index of currently active element (-1 if none)
 * @property {number} elementCount - Total number of elements being tracked
 * @property {boolean} isUpdating - Whether an update is currently in progress
 * @property {number} scrollVelocity - Current smoothed scroll velocity (px/ms)
 * @property {string} scrollDirection - Current scroll direction ('up' or 'down')
 */

/**
 * @typedef {Object} DebugInfo
 * @property {number} currentIndex - Index of currently active element
 * @property {number} scrollVelocity - Current smoothed scroll velocity
 * @property {string} scrollDirection - Current scroll direction
 * @property {Array<{index: number, desc: string, visibility: number}>} visibleElements - Currently visible elements
 */

/**
 * @typedef {Object} MediaSyncAPI
 * @property {Function} observe - Start observing elements for synchronization
 * @property {Function} disconnect - Stop observing and cleanup all resources
 * @property {Function} updateOptions - Update options dynamically
 * @property {Function} forceUpdate - Force update to a specific element
 * @property {Function} getCurrentElement - Get the currently active element
 * @property {Function} getCurrentIndex - Get the index of currently active element
 * @property {Function} getElementCount - Get total number of tracked elements
 * @property {Function} getState - Get current state snapshot
 * @property {Function} getDebugInfo - Get detailed debug information
 */

const DEFAULT_OPTIONS = {
    scrollContainerSelector: '.content-scroll',
    emaAlpha: 0.25,
    minSwitchInterval: 120,
    debounceMs: 0,
    slowScrollThreshold: 0.02,
    mediumScrollThreshold: 0.2,
    velocityThreshold: 0.4,
    anticipationZone: 150,
    fastLookaheadMs: 200,
    significanceThreshold: 0.15,
    enterThreshold: 0.4,
    leaveThreshold: 0.15,
    historyLength: 10
};

/**
 * Validates and clamps option values to safe ranges
 *
 * @param {SyncOptions} options - Options to validate
 * @returns {SyncOptions} - Validated options
 * @private
 */
function validateOptions(options) {
    const validated = { ...options };

    // Clamp values between 0 and 1
    ['emaAlpha', 'significanceThreshold', 'enterThreshold', 'leaveThreshold'].forEach(key => {
        if (validated[key] !== undefined) {
            validated[key] = Math.max(0, Math.min(1, validated[key]));
        }
    });

    // Ensure positive values
    ['minSwitchInterval', 'anticipationZone', 'fastLookaheadMs', 'historyLength'].forEach(key => {
        if (validated[key] !== undefined) {
            validated[key] = Math.max(0, validated[key]);
        }
    });

    // Velocity thresholds should be positive
    ['slowScrollThreshold', 'mediumScrollThreshold', 'velocityThreshold'].forEach(key => {
        if (validated[key] !== undefined) {
            validated[key] = Math.max(0, validated[key]);
        }
    });

    return validated;
}

/**
 * Core implementation of the Intelligent Media Sync system
 * @private
 */
class IntelligentMediaSyncCore {
    constructor({ scrollContainer = null, options = {}, onActiveChange = () => {} }) {
        this.options = { ...DEFAULT_OPTIONS, ...validateOptions(options) };
        this.onActiveChange = typeof onActiveChange === 'function' ? onActiveChange : () => {};

        this.explicitScrollContainer = scrollContainer || null;
        this.scrollContainer = scrollContainer || null;

        this.elements = [];
        this.currentIndex = -1;
        this.isUpdating = false;

        this.scrollVelocity = 0;
        this.scrollDirection = 'down';
        this.velEMA = 0;
        this.scrollHistory = [];
        this.lastScrollTime = 0;
        this.lastScrollY = 0;
        this.lastSwitchTime = 0;

        this.rafId = null;
        this.pendingTick = false;

        this.io = null;
        this.ro = null;

        this.isScrollListenerAttached = false;
        this.onScroll = this.onScroll.bind(this);
    }

    /**
     * Start observing elements for synchronization
     * @param {HTMLElement[]|NodeList} elements - Elements to observe
     */
    observe(elements) {
        this.cancelAnimationFrame();
        this.removeObservers();
        this.detachScrollListener();

        const targetElements = Array.isArray(elements) ? elements : Array.from(elements || []);

        // Filter out invalid elements
        const validElements = targetElements.filter(el =>
            el &&
            el.nodeType === Node.ELEMENT_NODE &&
            el.isConnected
        );

        if (validElements.length === 0) {
            console.warn('[IntelligentMediaSync] No valid elements to observe');
            return;
        }

        this.elements = validElements.map((element, index) => ({
            element,
            index,
            isVisible: false,
            visibilityScore: 0,
            rect: { top: 0, bottom: 0, height: 0, center: 0 },
            desc: this.getElementDescription(element)
        }));

        this.scrollHistory = [];
        this.scrollVelocity = 0;
        this.velEMA = 0;
        this.lastScrollTime = 0;
        this.lastScrollY = 0;
        this.currentIndex = -1;
        this.isUpdating = false;
        this.lastSwitchTime = 0;

        if (!this.ensureScrollContainer() || this.elements.length === 0) {
            return;
        }

        this.attachScrollListener();
        this.createObservers();
        this.measureAll();
        this.updateActiveElement();
    }

    /**
     * Stop observing and cleanup all resources
     */
    disconnect() {
        this.cancelAnimationFrame();
        this.detachScrollListener();
        if (!this.explicitScrollContainer) {
            this.scrollContainer = null;
        }
        this.removeObservers();

        this.elements = [];
        this.currentIndex = -1;
        this.isUpdating = false;

        this.scrollVelocity = 0;
        this.scrollDirection = 'down';
        this.velEMA = 0;
        this.scrollHistory = [];
        this.lastScrollTime = 0;
        this.lastScrollY = 0;
        this.lastSwitchTime = 0;
    }

    /**
     * Update synchronization options dynamically
     * @param {SyncOptions} partialOptions - Options to update
     */
    updateOptions(partialOptions = {}) {
        this.options = { ...this.options, ...validateOptions(partialOptions) };
    }

    /**
     * Force update to a specific element
     * @param {HTMLElement} element - Element to activate
     */
    forceUpdate(element) {
        const entry = this.elements.find((item) => item.element === element);
        if (!entry) return;

        this.currentIndex = entry.index;
        this.lastSwitchTime = performance.now();
        this.isUpdating = true;

        try {
            const result = this.onActiveChange({ element, index: entry.index });
            Promise.resolve(result)
                .catch(() => {})
                .finally(() => {
                    this.isUpdating = false;
                });
        } catch {
            this.isUpdating = false;
        }
    }

    /**
     * Get detailed debug information
     * @returns {DebugInfo}
     */
    getDebugInfo() {
        return {
            currentIndex: this.currentIndex,
            scrollVelocity: Number(this.scrollVelocity.toFixed(4)),
            scrollDirection: this.scrollDirection,
            visibleElements: this.elements
                .filter((entry) => entry.isVisible)
                .map((entry) => ({
                    index: entry.index,
                    desc: entry.desc.slice(0, 30),
                    visibility: Number(entry.visibilityScore.toFixed(2))
                }))
        };
    }

    ensureScrollContainer() {
        const candidate = this.explicitScrollContainer || this.scrollContainer;
        if (candidate && candidate.ownerDocument && candidate.isConnected) {
            this.scrollContainer = candidate;
            return this.scrollContainer;
        }

        const selector = this.options.scrollContainerSelector;
        if (!selector) {
            this.scrollContainer = null;
            return null;
        }

        const container = document.querySelector(selector);
        this.scrollContainer = container || null;
        return this.scrollContainer;
    }

    attachScrollListener() {
        const container = this.ensureScrollContainer();
        if (!container || this.isScrollListenerAttached) {
            return;
        }

        container.addEventListener('scroll', this.onScroll, { passive: true });
        this.isScrollListenerAttached = true;
    }

    detachScrollListener() {
        if (this.scrollContainer && this.isScrollListenerAttached) {
            this.scrollContainer.removeEventListener('scroll', this.onScroll);
        }
        this.isScrollListenerAttached = false;
    }

    createObservers() {
        const root = this.ensureScrollContainer();
        if (!root) {
            this.removeObservers();
            return;
        }

        const thresholds = Array.from({ length: 21 }, (_, index) => index / 20);

        this.io = new IntersectionObserver(
            (entries) => this.handleIntersections(entries),
            { root, threshold: thresholds }
        );

        this.elements.forEach((entry) => this.io.observe(entry.element));

        this.ro = new ResizeObserver(() => {
            this.measureAll();
            this.requestTick();
        });
        this.ro.observe(root);
    }

    removeObservers() {
        if (this.io) {
            this.io.disconnect();
            this.io = null;
        }

        if (this.ro) {
            this.ro.disconnect();
            this.ro = null;
        }

        this.elements.forEach((entry) => {
            entry.isVisible = false;
            entry.visibilityScore = 0;
        });
    }

    handleIntersections(entries) {
        for (const entry of entries) {
            const elementData = this.elements.find((item) => item.element === entry.target);
            if (!elementData) continue;

            elementData.isVisible = entry.intersectionRatio > 0;
            elementData.visibilityScore = entry.intersectionRatio;
        }

        this.requestTick();
    }

    onScroll() {
        if (!this.scrollContainer) {
            return;
        }

        const now = performance.now();
        const scrollTop = this.scrollContainer.scrollTop;

        if (this.lastScrollTime) {
            const deltaTime = Math.max(1, now - this.lastScrollTime);
            const deltaY = scrollTop - this.lastScrollY;
            const velocity = Math.abs(deltaY) / deltaTime;
            this.velEMA = this.options.emaAlpha * velocity + (1 - this.options.emaAlpha) * (this.velEMA || velocity);
            this.scrollVelocity = this.velEMA;

            if (deltaY !== 0) {
                this.scrollDirection = deltaY > 0 ? 'down' : 'up';
            }

            this.scrollHistory.push({
                time: now,
                position: scrollTop,
                velocity: this.scrollVelocity,
                direction: this.scrollDirection
            });

            if (this.scrollHistory.length > this.options.historyLength) {
                this.scrollHistory.shift();
            }
        }

        this.lastScrollTime = now;
        this.lastScrollY = scrollTop;

        this.requestTick();
    }

    requestTick() {
        if (this.pendingTick) {
            return;
        }

        this.pendingTick = true;
        if (this.rafId === null) {
            this.rafId = requestAnimationFrame(() => this.onAnimationFrame());
        }
    }

    cancelAnimationFrame() {
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        this.pendingTick = false;
    }

    onAnimationFrame() {
        this.rafId = null;
        if (!this.pendingTick) {
            return;
        }

        this.pendingTick = false;
        this.measureAll();
        this.updateActiveElement();
    }

    measureAll() {
        const container = this.ensureScrollContainer();
        if (!container) {
            return;
        }

        const rootRect = container.getBoundingClientRect();

        this.elements.forEach((entry) => {
            const rect = entry.element.getBoundingClientRect();
            const top = rect.top - rootRect.top + container.scrollTop;
            const bottom = top + rect.height;
            const center = (top + bottom) / 2;

            entry.rect.top = top;
            entry.rect.bottom = bottom;
            entry.rect.height = rect.height;
            entry.rect.center = center;
        });
    }

    updateActiveElement() {
        if (this.isUpdating || this.elements.length === 0) {
            return;
        }

        const selectedIndex = this.selectIntelligentElement();
        if (selectedIndex === -1 || selectedIndex === this.currentIndex) {
            return;
        }

        const now = performance.now();
        if (now - this.lastSwitchTime < this.options.minSwitchInterval) {
            return;
        }

        this.currentIndex = selectedIndex;
        this.lastSwitchTime = now;
        this.isUpdating = true;

        try {
            const entry = this.elements[selectedIndex];
            const result = this.onActiveChange({
                element: entry.element,
                index: entry.index
            });

            Promise.resolve(result)
                .catch(() => {})
                .finally(() => {
                    this.isUpdating = false;
                });
        } catch {
            this.isUpdating = false;
        }
    }

    selectIntelligentElement() {
        const visible = this.elements.filter((entry) => entry.isVisible);
        if (visible.length === 0) {
            return this.currentIndex;
        }

        const velocity = this.scrollVelocity;
        if (velocity > this.options.velocityThreshold) {
            return this.handleFastScroll(visible);
        }

        if (velocity < this.options.slowScrollThreshold) {
            return this.handleSlowScroll(visible);
        }

        if (velocity < this.options.mediumScrollThreshold) {
            return this.handleMediumScroll(visible);
        }

        return this.handleResponsiveScroll(visible);
    }

    handleFastScroll(visible) {
        const container = this.ensureScrollContainer();
        if (!container) {
            return this.currentIndex;
        }

        const centerNow = container.scrollTop + container.clientHeight / 2;
        const lookahead = this.scrollVelocity * this.options.fastLookaheadMs;
        const futureCenter = this.scrollDirection === 'down' ? centerNow + lookahead : centerNow - lookahead;

        let best = visible[0];
        let bestDistance = Math.abs(best.rect.center - futureCenter);

        for (const entry of visible) {
            const distance = Math.abs(entry.rect.center - futureCenter);
            if (distance < bestDistance) {
                best = entry;
                bestDistance = distance;
            }
        }

        const zone = this.options.anticipationZone;
        const ahead = this.elements.filter((entry) => {
            return this.scrollDirection === 'down'
                ? entry.rect.top > centerNow && entry.rect.top < centerNow + zone
                : entry.rect.bottom < centerNow && entry.rect.bottom > centerNow - zone;
        });

        for (const entry of ahead) {
            const distance = Math.abs(entry.rect.center - futureCenter);
            if (distance < bestDistance) {
                best = entry;
                bestDistance = distance;
            }
        }

        return this.applyHysteresis(best.index);
    }

    handleSlowScroll(visible) {
        const best = visible.reduce((a, b) => (b.visibilityScore > a.visibilityScore ? b : a));
        return this.applyHysteresis(best.index);
    }

    handleMediumScroll(visible) {
        const current = this.currentIndex >= 0 ? this.elements[this.currentIndex] : null;

        const inDirection = current
            ? visible.filter((entry) =>
                  this.scrollDirection === 'down' ? entry.index >= current.index : entry.index <= current.index
              )
            : visible;

        const pool = inDirection.length > 0 ? inDirection : visible;
        const best = pool.reduce((a, b) => (b.visibilityScore > a.visibilityScore ? b : a));

        return this.applyHysteresis(best.index);
    }

    handleResponsiveScroll(visible) {
        const best = visible.reduce((a, b) => (b.visibilityScore > a.visibilityScore ? b : a));
        return this.applyHysteresis(best.index, true);
    }

    applyHysteresis(candidateIndex, responsive = false) {
        const candidate = this.elements[candidateIndex];
        if (!candidate) {
            return this.currentIndex;
        }

        const current = this.currentIndex >= 0 ? this.elements[this.currentIndex] : null;
        const candidateScore = candidate.visibilityScore;
        const currentScore = current?.visibilityScore ?? 0;
        const improvement = candidateScore - currentScore;

        if (!current) {
            return candidateIndex;
        }

        const enter = this.options.enterThreshold;
        const leave = this.options.leaveThreshold;
        const baseGap = this.options.significanceThreshold;
        const gap = responsive ? Math.max(0.1, baseGap * 0.5) : baseGap;

        if (currentScore <= leave && improvement >= gap) {
            return candidateIndex;
        }

        if (candidateScore >= enter && improvement >= gap) {
            return candidateIndex;
        }

        return this.currentIndex;
    }

    getElementDescription(element) {
        const img = element.querySelector?.('img');
        if (img) {
            return img.alt || 'Image';
        }

        if (element.tagName === 'BLOCKQUOTE') {
            const text = element.textContent || '';
            return text.substring(0, 50) + (text.length > 50 ? '…' : '');
        }

        return element.tagName;
    }
}

/**
 * Creates an intelligent media synchronization instance
 *
 * This factory function creates a synchronization system that intelligently tracks
 * which element is most relevant based on scroll position, visibility, and velocity.
 * It adapts its behavior based on reading patterns (slow reading, fast scrolling, etc.)
 *
 * @param {Object} config - Configuration object
 * @param {HTMLElement} [config.scrollContainer=null] - The scroll container element
 * @param {SyncOptions} [config.options={}] - Synchronization options
 * @param {OnActiveChangeCallback} [config.onActiveChange] - Callback when active element changes
 * @returns {MediaSyncAPI} API object with methods for controlling synchronization
 *
 * @example
 * // Basic usage
 * const sync = createIntelligentMediaSync({
 *     onActiveChange: ({ element, index }) => {
 *         console.log(`Active element changed to index ${index}`);
 *         updateMediaPanel(element);
 *     }
 * });
 *
 * const images = document.querySelectorAll('.article img');
 * sync.observe(images);
 *
 * @example
 * // With custom options
 * const sync = createIntelligentMediaSync({
 *     options: {
 *         emaAlpha: 0.3,              // More responsive velocity tracking
 *         minSwitchInterval: 200,     // Calmer switching (200ms between changes)
 *         velocityThreshold: 0.5      // Higher threshold for fast scroll mode
 *     },
 *     onActiveChange: async ({ element }) => {
 *         await loadMedia(element);
 *     }
 * });
 *
 * @example
 * // With explicit scroll container
 * const scrollContainer = document.querySelector('.my-scroll-container');
 * const sync = createIntelligentMediaSync({
 *     scrollContainer,
 *     options: { emaAlpha: 0.25 },
 *     onActiveChange: ({ element }) => updateUI(element)
 * });
 */
export function createIntelligentMediaSync({ scrollContainer = null, options = {}, onActiveChange = () => {} } = {}) {
    const core = new IntelligentMediaSyncCore({
        scrollContainer,
        options: validateOptions(options),
        onActiveChange
    });

    return {
        /**
         * Start observing elements for synchronization
         * @param {HTMLElement[]|NodeList} elements - Elements to observe
         */
        observe: core.observe.bind(core),

        /**
         * Stop observing and cleanup all resources
         */
        disconnect: core.disconnect.bind(core),

        /**
         * Update options dynamically
         * @param {SyncOptions} options - Options to update
         */
        updateOptions: (opts) => core.updateOptions(validateOptions(opts)),

        /**
         * Force update to a specific element
         * @param {HTMLElement} element - Element to activate
         */
        forceUpdate: core.forceUpdate.bind(core),

        /**
         * Get the currently active element
         * @returns {HTMLElement|null} The active element or null if none
         */
        getCurrentElement: () => {
            const idx = core.currentIndex;
            return idx >= 0 ? core.elements[idx]?.element : null;
        },

        /**
         * Get the index of the currently active element
         * @returns {number} Index of active element (-1 if none)
         */
        getCurrentIndex: () => core.currentIndex,

        /**
         * Get the total number of tracked elements
         * @returns {number} Number of elements being tracked
         */
        getElementCount: () => core.elements.length,

        /**
         * Get current state snapshot
         * @returns {SyncState} Current state information
         */
        getState: () => ({
            currentIndex: core.currentIndex,
            elementCount: core.elements.length,
            isUpdating: core.isUpdating,
            scrollVelocity: core.scrollVelocity,
            scrollDirection: core.scrollDirection
        }),

        /**
         * Get detailed debug information
         * @returns {DebugInfo} Debug information
         */
        getDebugInfo: core.getDebugInfo.bind(core)
    };
}
