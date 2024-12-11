export class MediaConfig {
    constructor(element, options = {}) {
        this.element = element;
        this.fitMode = options.fitMode || 'contain';
        this.title = options.title || '';
        this.caption = options.caption || '';
    }
}