import { createIntelligentMediaSync } from './mediaSyncApi.js';

export class IntelligentMediaSync {
    constructor(mediaManager, options = {}) {
        this.mediaManager = mediaManager;

        const {
            scrollContainer = null,
            ...syncOptions
        } = options;

        this.sync = createIntelligentMediaSync({
            scrollContainer,
            options: syncOptions,
            onActiveChange: ({ element }) => this.mediaManager?.updateMedia?.({ element })
        });
    }

    observe(elements) {
        this.sync.observe(elements);
    }

    disconnect() {
        this.sync.disconnect();
    }

    updateOptions(options) {
        this.sync.updateOptions(options);
    }

    forceUpdate(element) {
        this.sync.forceUpdate(element);
    }

    getDebugInfo() {
        return this.sync.getDebugInfo();
    }
}
