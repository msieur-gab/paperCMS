import { TextRedactor, YAMLParser, MarkdownParser, MetadataManager } from './utils.js';

export class Portfolio {
    constructor() {
        this.main = document.querySelector('main');
        this.aside = document.querySelector('aside');
        this.currentMedia = this.aside.querySelector('.current-media');
        this.isMobile = window.innerWidth < 768;
        this.observer = null;
        this.baseUrl = window.location.origin;
        
        this.markdownParser = new MarkdownParser(this.baseUrl);
        this.metadataManager = new MetadataManager(this.aside);
    }

    handleResize = () => {
        this.isMobile = window.innerWidth < 768;
        this.aside.classList.toggle('hidden', this.isMobile);
        
        if (!this.isMobile) {
            this.setupIntersectionObserver();
        }
    }

    updateCurrentMedia(mediaElement) {
        if (!mediaElement || this.isMobile) return;
        
        this.currentMedia.classList.add('fade-out');
        
        setTimeout(() => {
            const figure = mediaElement;
            const img = figure.querySelector('img');
            
            if (img) {
                const ratio = img.naturalWidth / img.naturalHeight || img.width / img.height;
                this.currentMedia.classList.remove('landscape', 'portrait');
                this.currentMedia.classList.add(ratio >= 1 ? 'landscape' : 'portrait');
            }
            
            // Copier tout le contenu de la figure
            this.currentMedia.innerHTML = figure.innerHTML;
            this.currentMedia.classList.remove('fade-out');
        }, 150);
    }

    setupIntersectionObserver() {
        if (this.observer) {
            this.observer.disconnect();
        }

        const options = {
            root: this.main,
            threshold: 0.5,
            rootMargin: "0px 0px -50% 0px"
        };

        this.observer = new IntersectionObserver(entries => {
            if (this.isMobile) return;

            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const mediaFigure = entry.target;
                    if (mediaFigure) {
                        this.updateCurrentMedia(mediaFigure);
                    }
                }
            });
        }, options);

        // Observer toutes les figures avec data-media
        const mediaElements = this.main.querySelectorAll('figure.media[data-media]');
        mediaElements.forEach(figure => {
            this.observer.observe(figure);
        });

        // Afficher le premier média
        const firstMedia = mediaElements[0];
        if (firstMedia) {
            this.updateCurrentMedia(firstMedia);
        }
    }

    async loadContent(markdownUrl) {
        try {
            console.log('Loading content from:', markdownUrl);
            this.main.classList.add('fade-out');
            
            const response = await fetch(markdownUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const markdown = await response.text();
            await new Promise(resolve => setTimeout(resolve, 150));
            
            const { html, metadata } = this.markdownParser.parseMarkdown(markdown);
            this.main.innerHTML = html;
            
            if (metadata) {
                this.metadataManager.update(metadata);
            }
            
            this.main.scrollTop = 0;
            
            if (!this.isMobile) {
                this.setupIntersectionObserver();
            }
            
            this.main.classList.remove('fade-out');
            this.main.classList.add('fade-in');
            
            setTimeout(() => {
                this.main.classList.remove('fade-in');
            }, 300);
    
        } catch (error) {
            console.error('Loading error:', error);
            this.main.innerHTML = `<p>Error loading content: ${error.message}</p>`;
        }
    }

    init(markdownUrl) {
        window.addEventListener('resize', this.handleResize);
        document.addEventListener('loadContent', (e) => {
            this.loadContent(`${this.baseUrl}/${e.detail.path}`);
        });
        this.handleResize();
        this.loadContent(markdownUrl);
    }

    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
        window.removeEventListener('resize', this.handleResize);
        document.removeEventListener('loadContent');
    }
}

// Initialize
// document.addEventListener('DOMContentLoaded', () => {
//     const portfolio = new Portfolio();
//     const baseUrl = window.location.origin;
//     portfolio.init(`${baseUrl}/content/kanawa.md`);
// });