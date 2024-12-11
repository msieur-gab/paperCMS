export class MediaManager {
    constructor(aside, options = {}) {
        this.aside = aside;
        this.currentMedia = null;
        this.options = {
            transitionDuration: 150,
            defaultFitMode: 'contain',
            ...options
        };

        this.state = {
            isTransitioning: false,
            currentMediaId: null
        };
    }

    async updateMedia(mediaConfig) {
        if (!mediaConfig || this.state.isTransitioning) return;
        
        this.state.isTransitioning = true;
        
        try {
            await this.fadeOut();
            await this.setNewMedia(mediaConfig);
            await this.fadeIn();
        } catch (error) {
            console.error('Error updating media:', error);
        } finally {
            this.state.isTransitioning = false;
        }
    }

    async fadeOut() {
        if (!this.currentMedia) return;
        
        this.currentMedia.classList.add('fade-out');
        await new Promise(resolve => 
            setTimeout(resolve, this.options.transitionDuration)
        );
    }

    async fadeIn() {
        if (!this.currentMedia) return;
        
        this.currentMedia.classList.remove('fade-out');
        await new Promise(resolve => 
            setTimeout(resolve, this.options.transitionDuration)
        );
    }

    async setNewMedia(mediaConfig) {
        const { element } = mediaConfig;
        if (!element) return;

        // Find the current-media figure container
        const mediaContainer = this.aside.querySelector('.current-media');
        if (!mediaContainer) return;

        // Clear current content
        mediaContainer.innerHTML = '';
        
        // Clone the content from the original media element
        const clone = element.cloneNode(true);
        
        // Remove media-block class from clone
        clone.classList.remove('media-block');
        
        // Move fit mode to image if present
        const img = clone.querySelector('img');
        if (img && element.dataset.fit) {
            img.dataset.fit = element.dataset.fit;
        }
        
        // Add content to container
        mediaContainer.appendChild(clone);
        this.currentMedia = clone;

        console.log('Media updated:', element.querySelector('img')?.alt);

    }

    destroy() {
        this.currentMedia = null;
        const mediaContainer = this.aside.querySelector('.current-media');
        if (mediaContainer) {
            mediaContainer.innerHTML = '';
        }
    }
}