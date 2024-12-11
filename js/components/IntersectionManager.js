export class IntersectionManager {
    constructor(eventBus, options = {}) {
        this.eventBus = eventBus;
        
        console.log('Creating IntersectionManager with root:', document.querySelector('.content-scroll'));

        const observerOptions = {
            root: document.querySelector('.content-scroll'),
            threshold: 0.2, // Lower threshold since elements aren't reaching 0.5
            rootMargin: '-10% 0px -10% 0px' // Less aggressive margin
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                console.log('Intersection detected:', 
                    entry.target.querySelector('img')?.alt || entry.target.tagName,
                    'isIntersecting:', entry.isIntersecting,
                    'ratio:', entry.intersectionRatio
                );
                
                // Trigger on a lower threshold
                if (entry.isIntersecting && entry.intersectionRatio >= 0.2) {
                    console.log('Emitting mediaIntersection for:', 
                        entry.target.querySelector('img')?.alt || entry.target.tagName);
                    this.eventBus.emit('mediaIntersection', entry.target);
                }
            });
        }, observerOptions);
    }

    observe(elements) {
        console.log('Starting observation of elements:', elements);
        if (!this.observer) return;
        
        this.disconnect();
        
        elements.forEach(element => {
            if (element) {
                this.observer.observe(element);
            }
        });
    }

    disconnect() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}