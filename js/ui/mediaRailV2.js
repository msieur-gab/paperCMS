import { createIntelligentMediaSync } from './mediaSyncApi.js';

const DEFAULT_OPTIONS = {
    breakpoint: 1040,          // px – when viewport >= breakpoint we use rail mode
    position: 'left',          // 'left' | 'right'
    columnsDesktop: '1fr 1fr', // desktop grid template
    railClass: 'media-rail',   // CSS hook
    railContainer: null,       // optional existing container
    enterThreshold: 0.1,
    leaveThreshold: 0.05,
    significanceThreshold: 0.08
};

function moveElement(element, targetContainer) {
    if (!element || !targetContainer) return;
    targetContainer.appendChild(element);
}

function createRailContainer({ position, railClass }) {
    const rail = document.createElement('aside');
    rail.className = railClass;
    rail.dataset.position = position;
    rail.style.height = '100vh';
    rail.style.position = 'sticky';
    rail.style.top = '0';
    rail.style.display = 'grid';
    rail.style.gridTemplateRows = 'auto 1fr';
    rail.style.gap = '1.5rem';
    rail.style.padding = '2.5rem';
    rail.style.background = 'var(--media-rail-bg, #0f1117)';
    rail.style.color = 'var(--media-rail-fg, #f5f7fb)';
    rail.innerHTML = `
        <header class="media-rail__header">
            <span class="media-rail__label">Active Media</span>
            <h2 class="media-rail__title">Scroll to explore</h2>
        </header>
        <div class="media-rail__stage"></div>
    `;
    return rail;
}

function wrapLayout(scrollContainer, rail, position, columnsDesktop) {
    const layout = document.createElement('div');
    layout.className = 'media-rail-layout';
    layout.style.display = 'grid';
    layout.style.gridTemplateColumns = columnsDesktop;
    layout.style.height = '100vh';

    scrollContainer.parentElement.insertBefore(layout, scrollContainer);
    if (position === 'right') {
        layout.appendChild(scrollContainer);
        layout.appendChild(rail);
    } else {
        layout.appendChild(rail);
        layout.appendChild(scrollContainer);
    }

    scrollContainer.style.height = '100vh';
    scrollContainer.style.overflowY = 'auto';

    return layout;
}

function cloneMediaElement(element) {
    const clone = element.cloneNode(true);
    clone.removeAttribute('data-media');
    clone.classList.add('media-rail-item');
    return clone;
}

export function createResponsiveMediaRail({
    scrollContainer,
    mediaElements,
    options = {}
} = {}) {
    if (!scrollContainer) {
        throw new Error('createResponsiveMediaRail requires a scrollContainer element.');
    }

    const baseElements = Array.isArray(mediaElements) ? mediaElements : Array.from(mediaElements || []);
    if (!baseElements.length) {
        throw new Error('createResponsiveMediaRail requires at least one media element.');
    }

    const config = { ...DEFAULT_OPTIONS, ...options };
    let currentMode = 'mobile';
    let railContainer = config.railContainer;
    let layoutWrapper = null;
    const originals = baseElements.map((element) => ({
        element,
        parent: element.parentElement,
        nextSibling: element.nextElementSibling,
        placeholder: null
    }));

    const sync = createIntelligentMediaSync({
        scrollContainer,
        options: {
        ...config.syncOptions,
        enterThreshold: config.enterThreshold ?? DEFAULT_OPTIONS.enterThreshold,
        leaveThreshold: config.leaveThreshold ?? DEFAULT_OPTIONS.leaveThreshold,
        significanceThreshold: config.significanceThreshold ?? DEFAULT_OPTIONS.significanceThreshold
    },
        onActiveChange: ({ index }) => {
            if (currentMode !== 'desktop' || !railContainer) return;
            const sourceEntry = originals[index];
            if (!sourceEntry) return;
            const sourceElement = sourceEntry.element;
            if (!sourceElement) return;

            const stage = railContainer.querySelector('.media-rail__stage');
            if (!stage) return;

            const cloned = cloneMediaElement(sourceElement);
            stage.innerHTML = '';
            stage.dataset.activeIndex = index;
            stage.appendChild(cloned);
        }
    });

    function enterDesktopMode() {
        if (currentMode === 'desktop') return;
        currentMode = 'desktop';

        if (!railContainer) {
            railContainer = createRailContainer(config);
        }

        if (!layoutWrapper) {
            layoutWrapper = wrapLayout(scrollContainer, railContainer, config.position, config.columnsDesktop);
        } else if (!layoutWrapper.contains(railContainer)) {
            if (config.position === 'right') {
                layoutWrapper.appendChild(railContainer);
            } else {
                layoutWrapper.insertBefore(railContainer, layoutWrapper.firstElementChild);
            }
        }
        layoutWrapper.style.gridTemplateColumns = config.columnsDesktop;

        const stage = railContainer.querySelector('.media-rail__stage');
        if (stage) {
            stage.innerHTML = '<p class="media-rail__placeholder">Scroll to activate media.</p>';
        }

        layoutWrapper.style.height = '100vh';
        scrollContainer.style.height = '100vh';
        scrollContainer.style.overflowY = 'auto';

        const observedElements = originals.map((entry) => {
            const { element, parent, placeholder } = entry;

            const computed = window.getComputedStyle(element);
            const height = element.offsetHeight || Number(element.dataset.mediaHeight) || 320;

            let slot = placeholder;
            if (!slot) {
                slot = document.createElement('div');
                slot.className = 'media-rail__slot';
                entry.placeholder = slot;
            }

            slot.style.display = computed.display === 'inline' ? 'inline-block' : 'block';
            slot.style.height = `${height}px`;
            slot.style.marginTop = computed.marginTop;
            slot.style.marginBottom = computed.marginBottom;
            slot.style.marginLeft = computed.marginLeft;
            slot.style.marginRight = computed.marginRight;

            if (parent) {
                parent.insertBefore(slot, element);
            }

            if (element.parentElement) {
                element.parentElement.removeChild(element);
            }

            return slot;
        });

        sync.observe(observedElements);
    }

    function enterMobileMode() {
        if (currentMode === 'mobile') return;
        currentMode = 'mobile';

        sync.disconnect();

        originals.forEach((entry) => {
            const { element, parent, nextSibling, placeholder } = entry;

            if (placeholder && placeholder.parentElement) {
                placeholder.parentElement.replaceChild(element, placeholder);
            } else if (parent && element.parentElement !== parent) {
                if (nextSibling && nextSibling.parentElement === parent) {
                    parent.insertBefore(element, nextSibling);
                } else {
                    parent.appendChild(element);
                }
            } else if (!element.parentElement && parent) {
                parent.appendChild(element);
            }
        });

        if (railContainer) {
            const stage = railContainer.querySelector('.media-rail__stage');
            if (stage) stage.innerHTML = '';
            if (railContainer.parentElement) {
                railContainer.parentElement.removeChild(railContainer);
            }
        }

        if (layoutWrapper) {
            layoutWrapper.style.gridTemplateColumns = '1fr';
            layoutWrapper.style.height = 'auto';
            scrollContainer.style.height = 'auto';
            scrollContainer.style.overflowY = 'visible';
        }
    }

    function evaluateMode() {
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
        if (viewportWidth >= config.breakpoint) {
            enterDesktopMode();
            originals.forEach(({ element }) => {
                if (element.isConnected) {
                    sync.forceUpdate(element);
                }
            });
        } else {
            enterMobileMode();
        }
    }

    function init() {
        evaluateMode();
        window.addEventListener('resize', evaluateMode);
    }

    function destroy() {
        window.removeEventListener('resize', evaluateMode);
        sync.disconnect();

        if (railContainer && !config.railContainer && railContainer.parentElement) {
            railContainer.parentElement.removeChild(railContainer);
        }

        if (layoutWrapper && layoutWrapper.parentElement) {
            const parent = layoutWrapper.parentElement;
            while (layoutWrapper.firstChild) {
                parent.insertBefore(layoutWrapper.firstChild, layoutWrapper);
            }
            parent.removeChild(layoutWrapper);
        }

        originals.forEach((entry) => {
            const { element, parent, nextSibling, placeholder } = entry;

            if (placeholder && placeholder.parentElement) {
                placeholder.parentElement.replaceChild(element, placeholder);
            } else if (parent && element.parentElement !== parent) {
                if (nextSibling && nextSibling.parentElement === parent) {
                    parent.insertBefore(element, nextSibling);
                } else {
                    parent.appendChild(element);
                }
            } else if (!element.parentElement && parent) {
                parent.appendChild(element);
            }

            if (placeholder && placeholder.parentElement) {
                placeholder.parentElement.removeChild(placeholder);
            }
            entry.placeholder = null;
        });
    }

    return {
        init,
        destroy,
        enterDesktopMode,
        enterMobileMode,
        updateOptions: sync.updateOptions,
        forceUpdate: sync.forceUpdate,
        getDebugInfo: sync.getDebugInfo
    };
}
