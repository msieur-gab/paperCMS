export class Portfolio {
    constructor(config) {
        // Destructure config
        const {
            eventBus,
            contentParser,
            mediaManager,
            intersectionManager,
            responsiveLayout,
            elements
        } = config;
        
        // Store dependencies
        this.eventBus = eventBus;
        this.contentParser = contentParser;
        this.mediaManager = mediaManager;
        this.intersectionManager = intersectionManager;
        this.layout = responsiveLayout || { isMobile: window.innerWidth < 768 };
        
        // Store DOM elements
        this.mainElement = elements.main;
        this.asideElement = elements.aside;
        
        // Initialize state
        this.currentContent = null;

        // Set up event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for media intersection events
        this.eventBus.on('mediaIntersection', (mediaElement) => {
            if (this.mediaManager && !this.isMobile()) {
                console.log('Portfolio: Handling media intersection for', mediaElement);
                this.mediaManager.updateMedia({ element: mediaElement });
            }
        });

        // Listen for layout changes
        this.eventBus.on('layoutChange', ({ isMobile }) => {
            this.handleLayoutChange(isMobile);
        });
    }

    // Helper method to check mobile state
    isMobile() {
        return this.layout?.isMobile || window.innerWidth < 768;
    }
    
    async loadContent(url) {
        try {
            console.log('Portfolio: Loading content from', url);
            
            // Start loading state
            this.mainElement.classList.add('loading');
            
            // Fetch and parse content
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const content = await response.text();
            const { metadata, html } = await this.contentParser.parse(content);
            
            // Update DOM
            this.mainElement.innerHTML = html;
            this.currentContent = { url, metadata };
            
            // Setup media observation if needed
            if (!this.isMobile()) {
                await this.setupMedia();
            }
            
            return metadata;
        } catch (error) {
            console.error('Portfolio: Error loading content:', error);
            this.eventBus.emit('error', error);
            throw error;
        } finally {
            this.mainElement.classList.remove('loading');
        }
    }

    async setupMedia() {
        console.log('Portfolio: Setting up media');
        const mediaElements = this.mainElement.querySelectorAll('[data-media]');
        if (mediaElements.length === 0) return;

        // Disconnect any existing observers
        this.intersectionManager.disconnect();

        // Start observing new media elements
        this.intersectionManager.observe(mediaElements);

        // Show first media element immediately
        const firstMedia = mediaElements[0];
        if (firstMedia && this.mediaManager) {
            console.log('Portfolio: Displaying first media element');
            await this.mediaManager.updateMedia({ element: firstMedia });
        }
    }
    
    handleLayoutChange(isMobile) {
        console.log('Portfolio: Handling layout change, isMobile:', isMobile);
        
        if (isMobile) {
            // Clean up desktop view
            this.intersectionManager.disconnect();
            if (this.mediaManager) {
                this.mediaManager.destroy();
            }
        } else {
            // Setup desktop view
            this.setupMedia();
        }
        
        // Toggle aside visibility
        if (this.asideElement) {
            this.asideElement.classList.toggle('hidden', isMobile);
        }
    }
    
    observeMedia() {
        console.log('Portfolio: Observing media elements');
        const mediaElements = this.mainElement.querySelectorAll('[data-media]');
        if (mediaElements.length > 0) {
            this.intersectionManager.observe(mediaElements);
        }
    }
    
    destroy() {
        console.log('Portfolio: Destroying instance');
        if (this.intersectionManager) {
            this.intersectionManager.disconnect();
        }
        if (this.layout) {
            this.layout.destroy();
        }
        if (this.mediaManager) {
            this.mediaManager.destroy();
        }
    }
}