export class MediaManager {
    constructor(aside, options = {}) {
        this.aside = aside;
        this.currentMedia = null;
        this.currentChart = null; // Track current chart instance
        this.chartService = options.chartService || null; // Use provided ChartService
        
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
        if (!element) {
            console.error('No element provided to setNewMedia');
            return;
        }

        // Find the current-media figure container
        const mediaContainer = this.aside.querySelector('.current-media');
        if (!mediaContainer) {
            console.error('No .current-media container found in aside');
            return;
        }

        // Destroy any existing chart
        if (this.currentChart) {
            this.currentChart.destroy();
            this.currentChart = null;
        }

        // Clear current content
        mediaContainer.innerHTML = '';
        
        // Check if this is a chart element
        if (element.classList.contains('chart-block')) {
            await this.renderChart(element, mediaContainer);
            return;
        }
        
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

        // Better logging for different media types
        let mediaDescription;
        if (element.querySelector('img')) {
            mediaDescription = element.querySelector('img').alt || 'Image';
        } else if (element.tagName === 'BLOCKQUOTE') {
            const quoteText = element.querySelector('p')?.textContent || element.textContent;
            mediaDescription = quoteText.substring(0, 50) + (quoteText.length > 50 ? '...' : '');
        } else if (element.classList.contains('chart-block')) {
            const config = JSON.parse(element.dataset.chartConfig || '{}');
            mediaDescription = `Chart: ${config.title || element.dataset.chartType}`;
        } else {
            mediaDescription = element.tagName;
        }

    }
    
    async renderChart(element, container) {
        if (!this.chartService) {
            console.error('ChartService not available');
            return;
        }
        
        try {
            // Use ChartService to create sidebar chart
            this.currentChart = await this.chartService.createSidebarChart(element, container);
            this.currentMedia = container.firstElementChild; // Chart container created by ChartService
            
        } catch (error) {
            console.error('Failed to render chart:', error);
            
            // Show error in container
            const errorDiv = document.createElement('div');
            errorDiv.className = 'chart-error';
            errorDiv.innerHTML = `
                <p>Failed to render chart: ${error.message}</p>
                <pre>${element.dataset.chartConfig}</pre>
            `;
            container.appendChild(errorDiv);
            this.currentMedia = errorDiv;
        }
    }

    destroy() {
        // Charts are managed by ChartService, just clear our references
        this.currentChart = null;
        
        this.currentMedia = null;
        const mediaContainer = this.aside?.querySelector('.current-media');
        if (mediaContainer) {
            mediaContainer.innerHTML = '';
        }
        this.state.isTransitioning = false;
        this.state.currentMediaId = null;
    }

    clear() {
        // Charts are managed by ChartService, just clear our references
        this.currentChart = null;
        
        // Immediate clear without animation
        const mediaContainer = this.aside?.querySelector('.current-media');
        if (mediaContainer) {
            mediaContainer.innerHTML = '';
        }
        this.currentMedia = null;
        this.state.currentMediaId = null;
    }
}