export class IntersectionManager {
    constructor(mediaManager, options = {}) {
        this.mediaManager = mediaManager; // Direct reference
        
        console.log('Creating IntersectionManager with root:', document.querySelector('.content-scroll'));

        const observerOptions = {
            root: document.querySelector('.content-scroll'),
            threshold: 0.2, // Lower threshold since elements aren't reaching 0.5
            rootMargin: '-10% 0px -10% 0px' // Less aggressive margin
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const elementDesc = entry.target.querySelector('img')?.alt || 
                                 entry.target.textContent?.substring(0, 50) || 
                                 entry.target.tagName;
                console.log('Intersection detected:', elementDesc,
                    'isIntersecting:', entry.isIntersecting,
                    'ratio:', entry.intersectionRatio
                );
                
                // Trigger on a lower threshold
                if (entry.isIntersecting && entry.intersectionRatio >= 0.2) {
                    console.log('Calling mediaManager.updateMedia for:', elementDesc);
                    this.mediaManager.updateMedia({ element: entry.target }); // Correct format
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