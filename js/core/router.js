export class Router {
    constructor(config) {
        this.app = config.app;
        this.sections = config.sections || ['about', 'work', 'project-details'];
        this.defaultSection = config.defaultSection || 'about';
        
        // Bind methods
        this.handlePopState = this.handlePopState.bind(this);
        
        // Initialize
        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('popstate', this.handlePopState);
    }

    async handleInitialURL() {
        const hash = window.location.hash.slice(1);
        
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
        history.pushState(
            { section }, 
            '', 
            `#${section}`
        );
    }

    updateProjectURL(path) {
        const cleanPath = this.cleanPath(path);
        history.pushState(
            { type: 'project', path: cleanPath }, 
            '', 
            `#project/${cleanPath}`
        );
    }

    cleanPath(path) {
        return path.replace(/\.md$/, '');
    }

    addMdExtension(path) {
        return path.endsWith('.md') ? path : `${path}.md`;
    }

    destroy() {
        window.removeEventListener('popstate', this.handlePopState);
    }
}