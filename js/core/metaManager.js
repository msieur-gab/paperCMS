// NEW: core/metaManager.js - Social media SEO management
export class MetaManager {
    constructor() {
        this.defaultMeta = {
            title: 'Gabriel Baude - Designer & Technologist',
            description: 'Portfolio of Gabriel Baude - Designer and technologist exploring the intersection of traditional wisdom and modern design challenges.',
            image: './content/media/og-default.jpg',
            type: 'website'
        };
    }
    
    updateForProject(metadata, slug) {
        const title = `${metadata.title} - Gabriel Baude`;
        const description = metadata.description || this.defaultMeta.description;
        const image = metadata.thumbnail || this.defaultMeta.image;
        const url = `${window.location.origin}${window.location.pathname}#project/${slug}`;
        
        // Update page title
        document.title = title;
        
        // Update meta tags
        this.setMetaTag('description', description);
        
        // Open Graph tags
        this.setMetaTag('og:title', title);
        this.setMetaTag('og:description', description);
        this.setMetaTag('og:image', this.resolveImageUrl(image));
        this.setMetaTag('og:url', url);
        this.setMetaTag('og:type', 'article');
        
        // Twitter Card tags
        this.setMetaTag('twitter:card', 'summary_large_image');
        this.setMetaTag('twitter:title', title);
        this.setMetaTag('twitter:description', description);
        this.setMetaTag('twitter:image', this.resolveImageUrl(image));
        
        // Article specific meta
        if (metadata.contributors && metadata.contributors.length > 0) {
            const primaryAuthor = metadata.contributors.find(c => c.role === 'author') || metadata.contributors[0];
            this.setMetaTag('article:author', primaryAuthor.name);
        }
        
        if (metadata.date && metadata.date.published) {
            this.setMetaTag('article:published_time', metadata.date.published);
        }
        
        if (metadata.tags && metadata.tags.length) {
            // Add article tags
            metadata.tags.forEach(tag => {
                this.addMetaTag('article:tag', tag);
            });
        }
        
        // Canonical URL
        this.setLinkTag('canonical', url);
    }
    
    updateForSection(section) {
        let title, description;
        
        switch (section) {
            case 'story':
                title = 'Story - Gabriel Baude';
                description = 'Learn about Gabriel Baude - Designer and technologist with over two decades of experience bridging Eastern and Western design principles.';
                break;
            case 'projects':
                title = 'Projects - Gabriel Baude';
                description = 'Explore the portfolio of Gabriel Baude - Projects spanning design, technology, and cultural understanding.';
                break;
            default:
                title = this.defaultMeta.title;
                description = this.defaultMeta.description;
        }
        
        const url = `${window.location.origin}${window.location.pathname}#${section}`;
        
        // Update page title
        document.title = title;
        
        // Update meta tags
        this.setMetaTag('description', description);
        this.setMetaTag('og:title', title);
        this.setMetaTag('og:description', description);
        this.setMetaTag('og:url', url);
        this.setMetaTag('og:type', 'website');
        this.setMetaTag('og:image', this.resolveImageUrl(this.defaultMeta.image));
        
        // Twitter cards
        this.setMetaTag('twitter:title', title);
        this.setMetaTag('twitter:description', description);
        this.setMetaTag('twitter:image', this.resolveImageUrl(this.defaultMeta.image));
        
        // Remove article-specific tags
        this.removeMetaTags(['article:author', 'article:published_time', 'article:tag']);
        
        // Canonical URL
        this.setLinkTag('canonical', url);
    }
    
    setMetaTag(property, content) {
        // Try property first (for og: tags)
        let element = document.querySelector(`meta[property="${property}"]`);
        
        // Then try name (for standard meta tags)
        if (!element) {
            element = document.querySelector(`meta[name="${property}"]`);
        }
        
        if (!element) {
            element = document.createElement('meta');
            if (property.startsWith('og:') || property.startsWith('article:')) {
                element.setAttribute('property', property);
            } else {
                element.setAttribute('name', property);
            }
            document.head.appendChild(element);
        }
        
        element.setAttribute('content', content);
    }
    
    addMetaTag(property, content) {
        const element = document.createElement('meta');
        element.setAttribute('property', property);
        element.setAttribute('content', content);
        document.head.appendChild(element);
    }
    
    removeMetaTags(properties) {
        properties.forEach(property => {
            const elements = document.querySelectorAll(`meta[property="${property}"], meta[name="${property}"]`);
            elements.forEach(el => el.remove());
        });
    }
    
    setLinkTag(rel, href) {
        let element = document.querySelector(`link[rel="${rel}"]`);
        
        if (!element) {
            element = document.createElement('link');
            element.setAttribute('rel', rel);
            document.head.appendChild(element);
        }
        
        element.setAttribute('href', href);
    }
    
    resolveImageUrl(imagePath) {
        if (!imagePath) return this.defaultMeta.image;
        
        // If already absolute URL, return as is
        if (imagePath.startsWith('http')) return imagePath;
        
        // Convert relative path to absolute
        const baseUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname.replace('/index.html', '')}`;
        return `${baseUrl}/${imagePath.replace(/^\.\//, '')}`;
    }
    
    // Generate structured data for rich snippets
    generateStructuredData(metadata, slug) {
        const structuredData = {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": metadata.title,
            "description": metadata.description,
            "author": {
                "@type": "Person",
                "name": (metadata.contributors?.find(c => c.role === 'author') || metadata.contributors?.[0])?.name || "Gabriel Baude"
            },
            "datePublished": metadata.date?.published,
            "image": this.resolveImageUrl(metadata.thumbnail),
            "url": `${window.location.origin}${window.location.pathname}#project/${slug}`
        };
        
        // Update or create structured data script
        let script = document.querySelector('script[type="application/ld+json"]');
        if (!script) {
            script = document.createElement('script');
            script.type = 'application/ld+json';
            document.head.appendChild(script);
        }
        
        script.textContent = JSON.stringify(structuredData);
    }
    
    // Reset to default meta
    resetToDefault() {
        this.updateForSection('story');
    }
}