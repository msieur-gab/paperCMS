export class IntelligentMediaSync {
    constructor(mediaManager, options = {}) {
        this.mediaManager = mediaManager;
        this.elements = [];
        this.currentIndex = -1;
        this.isUpdating = false;
        
        // Scroll tracking
        this.scrollHistory = [];
        this.scrollVelocity = 0;
        this.scrollDirection = 'down';
        this.lastScrollTime = 0;
        this.lastScrollY = 0;
        
        // Prediction and timing
        this.predictedIndex = -1;
        this.lastSwitchTime = 0;
        this.debounceTimeout = null;
        
        this.options = {
            debounceMs: 16, // Minimal debounce (1 frame) for smooth prediction without delays
            minSwitchInterval: 0, // No minimum switch interval
            velocityThreshold: 0.4, // Keep original fast scroll threshold
            anticipationZone: 150, // px ahead to start anticipating
            historyLength: 10, // scroll history samples
            slowScrollThreshold: 0.02, // Keep original slow scroll threshold
            mediumScrollThreshold: 0.2, // Keep original medium scroll threshold
            significanceThreshold: 0.15, // Require meaningful change before switching (15%)
            ...options
        };
        
        this.scrollContainer = null;
        this.isScrollListenerAttached = false;
        this.scrollListener = this.handleScroll.bind(this);
        
    }

    observe(elements) {
        
        this.disconnect();
        
        // Calculate positions and create element metadata
        this.elements = elements.map((el, index) => ({
            element: el,
            index,
            top: el.offsetTop,
            bottom: el.offsetTop + el.offsetHeight,
            height: el.offsetHeight,
            center: el.offsetTop + el.offsetHeight / 2,
            desc: this.getElementDescription(el),
            isVisible: false,
            visibilityScore: 0
        }));
        
        
        if (this.elements.length > 0) {
            this.setupScrollListener();
            // Initial sync
            setTimeout(() => {
                this.updateActiveElement();
            }, 100);
        }
    }

    getElementDescription(element) {
        if (element.querySelector('img')) {
            return element.querySelector('img').alt || 'Image';
        } else if (element.tagName === 'BLOCKQUOTE') {
            const text = element.textContent || '';
            return text.substring(0, 50) + (text.length > 50 ? '...' : '');
        } else {
            return element.tagName;
        }
    }

    setupScrollListener() {
        const scrollContainer = document.querySelector('.content-scroll');
        if (!scrollContainer) {
            return;
        }

        if (this.scrollContainer && this.scrollContainer !== scrollContainer && this.isScrollListenerAttached) {
            this.scrollContainer.removeEventListener('scroll', this.scrollListener);
            this.isScrollListenerAttached = false;
        }

        this.scrollContainer = scrollContainer;

        if (!this.isScrollListenerAttached) {
            scrollContainer.addEventListener('scroll', this.scrollListener, { passive: true });
            this.isScrollListenerAttached = true;
        }
    }

    handleScroll(event) {
        this.trackScrollMetrics(event);
        
        if (this.isUpdating) return;
        
        clearTimeout(this.debounceTimeout);
        this.debounceTimeout = setTimeout(() => {
            this.updateActiveElement();
        }, this.options.debounceMs);
    }

    trackScrollMetrics(e) {
        const now = Date.now();
        const scrollY = e.target.scrollTop;
        
        // Calculate velocity and direction
        if (this.lastScrollTime > 0) {
            const deltaTime = now - this.lastScrollTime;
            const deltaY = scrollY - this.lastScrollY;
            
            if (deltaTime > 0) {
                const velocity = Math.abs(deltaY) / deltaTime; // px/ms
                this.scrollVelocity = velocity;
                this.scrollDirection = deltaY > 0 ? 'down' : 'up';
                
                // Update scroll history for trend analysis
                this.scrollHistory.push({
                    time: now,
                    position: scrollY,
                    velocity: velocity,
                    direction: this.scrollDirection
                });
                
                // Keep history to reasonable size
                if (this.scrollHistory.length > this.options.historyLength) {
                    this.scrollHistory.shift();
                }
            }
        }
        
        this.lastScrollTime = now;
        this.lastScrollY = scrollY;
    }

    updateActiveElement() {
        if (this.elements.length === 0) return;
        
        const scrollContainer = this.scrollContainer || document.querySelector('.content-scroll');
        if (!scrollContainer) return;
        
        if (!this.scrollContainer) {
            this.scrollContainer = scrollContainer;
        }

        const scrollTop = scrollContainer.scrollTop;
        const viewportHeight = scrollContainer.clientHeight;
        const viewportMiddle = scrollTop + viewportHeight / 2;
        const viewportTop = scrollTop;
        const viewportBottom = scrollTop + viewportHeight;
        
        // Update visibility scores for all elements
        this.updateElementVisibility(viewportTop, viewportBottom, viewportMiddle);
        
        // Determine the best element based on scroll behavior
        const selectedIndex = this.selectIntelligentElement(scrollTop, viewportMiddle, viewportHeight);
        
        // Only update if element changed
        if (selectedIndex !== -1 && selectedIndex !== this.currentIndex) {
            
            this.currentIndex = selectedIndex;
            this.lastSwitchTime = Date.now();
            this.isUpdating = true;
            
            const updatePromise = this.mediaManager.updateMedia({ 
                element: this.elements[selectedIndex].element 
            });
            
            if (updatePromise && typeof updatePromise.finally === 'function') {
                updatePromise.finally(() => {
                    this.isUpdating = false;
                });
            } else {
                setTimeout(() => {
                    this.isUpdating = false;
                }, this.options.debounceMs);
            }
        }
    }

    updateElementVisibility(viewportTop, viewportBottom, viewportMiddle) {
        this.elements.forEach(el => {
            // Calculate how much of the element is visible
            const visibleTop = Math.max(el.top, viewportTop);
            const visibleBottom = Math.min(el.bottom, viewportBottom);
            const visibleHeight = Math.max(0, visibleBottom - visibleTop);
            
            el.isVisible = visibleHeight > 0;
            el.visibilityScore = el.height > 0 ? visibleHeight / el.height : 0;
            el.distanceFromCenter = Math.abs(el.center - viewportMiddle);
        });
    }

    selectIntelligentElement(scrollTop, viewportMiddle, viewportHeight) {
        const visibleElements = this.elements.filter(el => el.isVisible);
        
        if (visibleElements.length === 0) {
            return this.currentIndex; // Keep current if nothing visible
        }

        // FAST SCROLLING: Anticipate next element - always show relevant content
        if (this.scrollVelocity > this.options.velocityThreshold) {
            return this.handleFastScroll(scrollTop, viewportMiddle, viewportHeight, visibleElements);
        }
        
        // VERY SLOW SCROLLING: Be very conservative, only switch for major visibility changes
        if (this.scrollVelocity < this.options.slowScrollThreshold) {
            return this.handleSlowScroll(visibleElements);
        }
        
        // MEDIUM SCROLLING: Progressive switching - ensure content visibility
        if (this.scrollVelocity < this.options.mediumScrollThreshold) {
            return this.handleMediumScroll(visibleElements);
        }
        
        // FASTER MEDIUM SCROLLING: More responsive to ensure content isn't missed
        return this.handleResponsiveScroll(visibleElements);
    }

    handleFastScroll(scrollTop, viewportMiddle, viewportHeight, visibleElements) {
        
        // Predict where we'll be in the near future based on velocity
        const anticipationDistance = this.scrollVelocity * 200; // 200ms ahead prediction
        const futurePosition = this.scrollDirection === 'down' 
            ? viewportMiddle + anticipationDistance 
            : viewportMiddle - anticipationDistance;
        
        // Find element closest to predicted future position
        let bestElement = visibleElements[0];
        let bestDistance = Math.abs(bestElement.center - futurePosition);
        
        for (const el of visibleElements) {
            const distance = Math.abs(el.center - futurePosition);
            if (distance < bestDistance) {
                bestDistance = distance;
                bestElement = el;
            }
        }
        
        // Also consider elements just outside viewport in scroll direction for better anticipation
        const anticipationElements = this.elements.filter(el => {
            if (this.scrollDirection === 'down') {
                return el.top > viewportMiddle && el.top < viewportMiddle + this.options.anticipationZone;
            } else {
                return el.bottom < viewportMiddle && el.bottom > viewportMiddle - this.options.anticipationZone;
            }
        });
        
        for (const el of anticipationElements) {
            const distance = Math.abs(el.center - futurePosition);
            if (distance < bestDistance) {
                bestDistance = distance;
                bestElement = el;
            }
        }
        
        return bestElement.index;
    }

    handleSlowScroll(visibleElements) {
        // For slow scrolling, only switch if there's a significant visibility improvement
        let bestElement = visibleElements[0];
        let bestScore = bestElement.visibilityScore;
        
        for (const el of visibleElements) {
            if (el.visibilityScore > bestScore) {
                bestScore = el.visibilityScore;
                bestElement = el;
            }
        }
        
        // Only switch if the improvement is significant or current element isn't visible
        const currentElement = this.currentIndex >= 0 ? this.elements[this.currentIndex] : null;
        const currentScore = currentElement?.visibilityScore || 0;
        
        const improvement = bestScore - currentScore;
        
        if (improvement > this.options.significanceThreshold || currentScore < 0.05) {
            return bestElement.index;
        }
        return this.currentIndex; // Stay with current element
    }

    handleMediumScroll(visibleElements) {
        // For medium scroll, prefer elements in scroll direction
        const currentElement = this.currentIndex >= 0 ? this.elements[this.currentIndex] : null;
        
        if (!currentElement) {
            // No current element, pick most visible
            let bestElement = visibleElements[0];
            for (const el of visibleElements) {
                if (el.visibilityScore > bestElement.visibilityScore) {
                    bestElement = el;
                }
            }
            return bestElement.index;
        }
        
        // Filter elements by scroll direction preference
        const directionElements = visibleElements.filter(el => {
            if (this.scrollDirection === 'down') {
                return el.index >= this.currentIndex; // Same or forward elements
            } else {
                return el.index <= this.currentIndex; // Same or backward elements
            }
        });
        
        // If no elements in preferred direction, use all visible elements
        const candidateElements = directionElements.length > 0 ? directionElements : visibleElements;
        
        // Find most visible in preferred direction
        let bestElement = candidateElements[0];
        let bestScore = bestElement.visibilityScore;
        
        for (const el of candidateElements) {
            if (el.visibilityScore > bestScore) {
                bestScore = el.visibilityScore;
                bestElement = el;
            }
        }
        
        // Check if switch is worthwhile
        const currentScore = currentElement.visibilityScore || 0;
        const improvement = bestScore - currentScore;
        
        if (improvement > this.options.significanceThreshold || currentScore < 0.1) {
            return bestElement.index;
        }
        return this.currentIndex;
    }

    handleResponsiveScroll(visibleElements) {
        // For faster scrolling, be more responsive to ensure content isn't missed
        // but still require some significance to avoid rapid switching
        
        let bestElement = visibleElements[0];
        let bestScore = bestElement.visibilityScore;
        
        for (const el of visibleElements) {
            if (el.visibilityScore > bestScore) {
                bestScore = el.visibilityScore;
                bestElement = el;
            }
        }
        
        // More lenient threshold for responsive scrolling
        const currentElement = this.currentIndex >= 0 ? this.elements[this.currentIndex] : null;
        const currentScore = currentElement?.visibilityScore || 0;
        const lowerThreshold = this.options.significanceThreshold * 0.5; // 10% instead of 20%
        
        const improvement = bestScore - currentScore;
        
        if (improvement > lowerThreshold || currentScore < 0.1) {
            return bestElement.index;
        }
        return this.currentIndex;
    }

    calculateElementScore(element, directionWeight, visibilityWeight) {
        // Higher visibility score is better
        const visibilityScore = element.visibilityScore * visibilityWeight;
        
        // Direction score: prefer elements in scroll direction
        let directionScore = 0;
        if (this.currentIndex >= 0) {
            const currentElement = this.elements[this.currentIndex];
            if (this.scrollDirection === 'down' && element.index > currentElement.index) {
                directionScore = directionWeight;
            } else if (this.scrollDirection === 'up' && element.index < currentElement.index) {
                directionScore = directionWeight;
            }
        }
        
        return visibilityScore + directionScore;
    }

    disconnect() {
        if (this.scrollContainer && this.isScrollListenerAttached) {
            this.scrollContainer.removeEventListener('scroll', this.scrollListener);
        }
        this.isScrollListenerAttached = false;
        this.scrollContainer = null;

        this.elements = [];
        this.currentIndex = -1;
        this.predictedIndex = -1;
        this.lastSwitchTime = 0;
        this.isUpdating = false;
        this.scrollHistory = [];
        this.scrollVelocity = 0;
        clearTimeout(this.debounceTimeout);
        this.debounceTimeout = null;
        this.lastScrollTime = 0;
        this.lastScrollY = 0;
    }

    // Debug methods
    getCurrentElement() {
        return this.currentIndex >= 0 ? this.elements[this.currentIndex]?.element : null;
    }

    forceUpdate(element) {
        const elementData = this.elements.find(el => el.element === element);
        if (elementData) {
            this.currentIndex = elementData.index;
            this.lastSwitchTime = Date.now();
            this.mediaManager.updateMedia({ element });
        }
    }

    getDebugInfo() {
        return {
            currentIndex: this.currentIndex,
            scrollVelocity: this.scrollVelocity,
            scrollDirection: this.scrollDirection,
            visibleElements: this.elements.filter(el => el.isVisible).map(el => ({
                index: el.index,
                desc: el.desc.substring(0, 30),
                visibilityScore: el.visibilityScore.toFixed(2)
            }))
        };
    }
}
