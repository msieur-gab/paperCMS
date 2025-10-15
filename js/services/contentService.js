// NEW: services/contentService.js - Streamlined content handling
export class ContentService {
    constructor() {
        this.cache = new Map();
        this.baseUrl = './content/';
    }

    async getProjects() {
        try {
            const response = await fetch('./public/api/publications.json');
            if (!response.ok) throw new Error('Failed to fetch projects');
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Failed to load projects:', error);
            throw error;
        }
    }

    async getProject(slug) {
        if (this.cache.has(slug)) {
            return this.cache.get(slug);
        }

        try {
            const cleanSlug = this.cleanSlug(slug);

            // Fetch both HTML content and metadata in parallel
            const [htmlResponse, projectsData] = await Promise.all([
                fetch(`./public/content/${cleanSlug}.html`),
                this.getProjects()
            ]);

            if (!htmlResponse.ok) throw new Error(`Failed to fetch project: ${cleanSlug}`);

            const fullHtmlText = await htmlResponse.text();

            // Extract just the article content from the full HTML page
            const html = this.extractArticleContent(fullHtmlText);

            // Find metadata from JSON API
            const publicationPath = `${cleanSlug}.md`;
            const publicationData = projectsData.publications.find(pub =>
                pub.path === publicationPath ||
                pub.path.endsWith(`/${publicationPath}`) ||
                pub.path.replace('.md', '') === cleanSlug
            );

            // Extract metadata in the format expected by the app
            const metadata = publicationData ? {
                title: publicationData.title,
                description: publicationData.description,
                date: publicationData.date,
                category: publicationData.category,
                tags: publicationData.tags || [],
                contributors: publicationData.contributors || [],
                status: publicationData.status
            } : {};

            const project = { html, metadata };

            this.cache.set(slug, project);
            return project;
        } catch (error) {
            console.error('Failed to load project:', error);
            throw error;
        }
    }

    extractArticleContent(fullHtml) {
        // Extract content from <main id="article-content">
        const match = fullHtml.match(/<main[^>]*id="article-content"[^>]*>([\s\S]*?)<\/main>/);
        if (match && match[1]) {
            return match[1].trim();
        }

        // Fallback: if no main tag, try to extract body content (skip head)
        const bodyMatch = fullHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/);
        if (bodyMatch && bodyMatch[1]) {
            // Remove script tags and return
            return bodyMatch[1]
                .replace(/<script[\s\S]*?<\/script>/gi, '')
                .replace(/<a[^>]*class="spa-redirect"[^>]*>[\s\S]*?<\/a>/gi, '')
                .trim();
        }

        // Last resort: return the full HTML (probably already a fragment)
        return fullHtml;
    }

    cleanSlug(slug) {
        return slug
            .replace(/\.md$/, '')
            .replace('content/', '')
            .replace(/^-\s*/, '');
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
    }

    // Get cached projects
    getCachedProject(slug) {
        return this.cache.get(slug);
    }

    // Check if project is cached
    isCached(slug) {
        return this.cache.has(slug);
    }
}
