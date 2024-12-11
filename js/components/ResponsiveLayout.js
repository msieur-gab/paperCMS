export class ResponsiveLayout {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.breakpoint = 768;
        this.isMobile = false;
        
        this.handleResize = this.handleResize.bind(this);
        window.addEventListener('resize', this.handleResize);
        this.handleResize();
    }
    
    handleResize() {
        const wasMobile = this.isMobile;
        this.isMobile = window.innerWidth < this.breakpoint;
        
        if (wasMobile !== this.isMobile) {
            this.eventBus.emit('layoutChange', { isMobile: this.isMobile });
        }
    }
    
    destroy() {
        window.removeEventListener('resize', this.handleResize);
    }
}