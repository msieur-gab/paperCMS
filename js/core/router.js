export class Router {
    constructor(config) {
        this.app = config.app;
        this.sections = config.sections || ['story', 'projects', 'project-details'];
        this.defaultSection = config.defaultSection || 'story';
        
        // Bind methods
        this.handlePopState = this.handlePopState.bind(this);
        
        // Initialize
        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('popstate', this.handlePopState);
    }

    async handleInitialURL() {
        // Handle both hash-based URLs (legacy) and clean URLs (new)
        const hash = window.location.hash.slice(1);
        const pathname = window.location.pathname;
        
        // Check for clean URL structure first
        if (pathname.startsWith('/project/')) {
            const projectSlug = pathname.replace('/project/', '').replace('/', '');
            await this.app.openProject(projectSlug, true);
            return;
        }
        
        if (pathname === '/projects') {
            this.app.navigateToSection('projects', true);
            return;
        }
        
        if (pathname === '/story' || pathname === '/') {
            this.app.navigateToSection('story', true);
            return;
        }
        
        // Fallback to hash-based routing for legacy support
        if (hash) {
            if (hash.startsWith('project/')) {
                const projectPath = this.cleanPath(hash.replace('project/', ''));
                await this.app.openProject(projectPath, true);
            } else if (this.sections.includes(hash)) {
                this.app.navigateToSection(hash, true);
            } else {
                this.app.navigateToSection(this.defaultSection, true);
            }
        } else {
            this.app.navigateToSection(this.defaultSection, true);
        }
    }

    handlePopState(e) {
        if (e.state) {
            if (e.state.type === 'project') {
                this.app.openProject(e.state.path, true);
            } else {
                this.app.navigateToSection(e.state.section, true);
            }
        } else {
            this.app.navigateToSection(this.defaultSection, true);
        }
    }

    updateURL(section) {
        const url = section === 'story' ? '/' : `/${section}`;
        history.pushState(
            { section }, 
            '', 
            url
        );
    }

    updateProjectURL(path) {
        const cleanPath = this.cleanPath(path);
        const url = `/project/${cleanPath}`;
        history.pushState(
            { type: 'project', path: cleanPath }, 
            '', 
            url
        );
    }

    // cleanPath(path) {
    //     return path.replace(/\.md$/, '');
    // }

    // addMdExtension(path) {
    //     return path.endsWith('.md') ? path : `${path}.md`;
    // }

    cleanPath(path) {
        return path
            .replace(/\.md$/, '')
            .replace('content/', '')
            .replace('- ', '');
    }
    
    addMdExtension(path) {
        const cleanPath = path
            .replace('- ', '')
            .replace(/\.md$/, '');
        return `${cleanPath}.md`;
    }

    destroy() {
        window.removeEventListener('popstate', this.handlePopState);
    }
}