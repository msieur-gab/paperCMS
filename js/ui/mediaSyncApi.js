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

class IntelligentMediaSyncCore {
    constructor({ scrollContainer = null, options = {}, onActiveChange = () => {} }) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
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

    observe(elements) {
        this.cancelAnimationFrame();
        this.removeObservers();
        this.detachScrollListener();

        const targetElements = Array.isArray(elements) ? elements : Array.from(elements || []);
        this.elements = targetElements.map((element, index) => ({
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

    updateOptions(partialOptions = {}) {
        this.options = { ...this.options, ...partialOptions };
    }

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

export function createIntelligentMediaSync({ scrollContainer = null, options = {}, onActiveChange = () => {} } = {}) {
    const core = new IntelligentMediaSyncCore({ scrollContainer, options, onActiveChange });
    return {
        observe: core.observe.bind(core),
        disconnect: core.disconnect.bind(core),
        updateOptions: core.updateOptions.bind(core),
        forceUpdate: core.forceUpdate.bind(core),
        getDebugInfo: core.getDebugInfo.bind(core)
    };
}
