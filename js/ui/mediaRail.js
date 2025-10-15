import { createIntelligentMediaSync } from './mediaSyncApi.js';

function cloneMediaElement(element) {
    const clone = element.cloneNode(true);
    clone.removeAttribute('data-media');
    clone.classList.add('media-rail-item');
    return clone;
}

export function createMediaRail({
    scrollContainer,
    mediaElements,
    railContainer,
    options = {}
} = {}) {
    if (!scrollContainer) {
        throw new Error('createMediaRail requires a scrollContainer element.');
    }
    if (!railContainer) {
        throw new Error('createMediaRail requires a railContainer element.');
    }
    const elements = Array.isArray(mediaElements) ? mediaElements : Array.from(mediaElements || []);
    if (!elements.length) {
        throw new Error('createMediaRail requires at least one media element.');
    }

    const sync = createIntelligentMediaSync({
        scrollContainer,
        options,
        onActiveChange: ({ element, index }) => {
            const cloned = cloneMediaElement(element);
            railContainer.innerHTML = '';
            railContainer.dataset.activeIndex = index;
            railContainer.appendChild(cloned);
        }
    });

    function init() {
        sync.observe(elements);
    }

    function destroy() {
        sync.disconnect();
        railContainer.innerHTML = '';
        delete railContainer.dataset.activeIndex;
    }

    return {
        init,
        destroy,
        observe: sync.observe,
        disconnect: sync.disconnect,
        updateOptions: sync.updateOptions,
        forceUpdate: sync.forceUpdate,
        getDebugInfo: sync.getDebugInfo
    };
}
