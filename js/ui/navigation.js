// NEW: ui/navigation.js - Simple navigation handling
export class Navigation {
    constructor(app) {
        this.app = app;
        this.mainNav = document.querySelector('.main-nav');
        this.sections = ['about', 'work', 'project-details'];
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        if (!this.mainNav) return;
        
        // Navigation click handling
        this.mainNav.addEventListener('click', (e) => {
            const link = e.target.closest('a[section]');
            if (link) {
                e.preventDefault();
                const section = link.getAttribute('section');
                
                // Prevent navigation to project-details if no project is open
                if (section === 'project-details' && !this.app.state.isProjectOpen) {
                    return;
                }
                
                this.app.navigateToSection(section);
            }
        });
    }
    
    updateActiveSection(section) {
        if (!this.mainNav) return;
        
        this.mainNav.querySelectorAll('a[section]').forEach(link => {
            const linkSection = link.getAttribute('section');
            link.classList.toggle('active', linkSection === section);
        });
    }
    
    updateProjectInNav(title, path) {
        if (!this.mainNav) return;
        
        let projectNav = this.mainNav.querySelector('a[section="project-details"]');
        
        if (!projectNav) {
            projectNav = document.createElement('a');
            projectNav.setAttribute('section', 'project-details');
            projectNav.href = '#project-details';
            this.mainNav.appendChild(projectNav);
        }
        
        projectNav.textContent = title;
        projectNav.setAttribute('data-path', path);
    }
    
    removeProjectFromNav() {
        if (!this.mainNav) return;
        
        const projectNav = this.mainNav.querySelector('a[section="project-details"]');
        if (projectNav) {
            projectNav.remove();
        }
    }
    
    getCurrentActiveSection() {
        if (!this.mainNav) return null;
        
        const activeLink = this.mainNav.querySelector('a[section].active');
        return activeLink ? activeLink.getAttribute('section') : null;
    }
}