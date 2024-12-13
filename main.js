// main.js
import { ProjectList } from './js/components/ProjectList.js';
import { EventBus } from './js/core/events.js';
import { Portfolio } from './js/components/Portfolio.js';
import { ContentParser } from './js/components/ContentParser.js';
import { MediaManager } from './js/components/MediaManager.js';
import { IntersectionManager } from './js/components/IntersectionManager.js';
import { ResponsiveLayout } from './js/components/ResponsiveLayout.js';
import { Router } from './js/core/router.js';
import { ThemeManager } from './js/components/ThemeManager.js';

class App {
    constructor() {
        // Core elements
        this.mainElement = document.querySelector('main');
        this.mainNav = document.querySelector('.main-nav');
        this.projectDetailsContent = document.getElementById('project-details-content');
        this.mediaContainer = document.querySelector('.project-media');
        
        // State management
        this.state = {
            currentSection: 'about',
            isProjectOpen: false,
            isLoading: false,
            sections: ['about', 'work', 'project-details']
        };

        // Core services
        this.eventBus = new EventBus();
        this.contentParser = new ContentParser();
        this.router = new Router({
            app: this,
            sections: this.state.sections,
            defaultSection: 'about'
        });

        // Debounce timeouts
        this.scrollTimeout = null;
        this.resizeTimeout = null;

        // Initialize the application
        this.initialize();
    }

    async initialize() {
        try {
            await this.initializeComponents();
            await this.router.handleInitialURL();
            this.setupEventListeners();
            
            // Ensure initial state is correct
            if (!this.state.isProjectOpen) {
                this.mainElement.classList.add('no-project');
            }
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showErrorMessage('Failed to initialize application');
        }
    }

    async initializeComponents() {
        // Initialize layout manager
        this.layout = new ResponsiveLayout(this.eventBus);
        
        // Initialize theme manager 
        this.themeManager = new ThemeManager(this.eventBus);

        // Initialize media management
        this.mediaManager = new MediaManager(this.mediaContainer);
        this.intersectionManager = new IntersectionManager(this.eventBus);

        // Initialize portfolio component
        const portfolioConfig = {
            eventBus: this.eventBus,
            contentParser: this.contentParser,
            mediaManager: this.mediaManager,
            intersectionManager: this.intersectionManager,
            responsiveLayout: this.layout,
            elements: {
                main: this.mainElement,
                aside: this.mediaContainer
            }
        };
        this.portfolio = new Portfolio(portfolioConfig);

        // Initialize project list
        const projectsGrid = document.querySelector('.projects-grid');
        if (projectsGrid) {
            this.projectList = new ProjectList(
                projectsGrid,
                (path) => this.openProject(path)
            );
            await this.projectList.initialize();
        }
    }

    setupEventListeners() {
        this.setupNavigationHandlers();
        this.setupProjectHandlers();
        this.setupLayoutHandlers();
        this.setupScrollHandling();
        this.setupMediaHandlers();
    }

    setupNavigationHandlers() {
        // Navigation click handling
        this.mainNav.addEventListener('click', (e) => {
            const link = e.target.closest('a[section]');
            if (link) {
                e.preventDefault();
                const section = link.getAttribute('section');
                
                // Prevent navigation to project-details if no project is open
                if (section === 'project-details' && !this.state.isProjectOpen) {
                    console.warn('Cannot navigate to project details - no project is open');
                    return;
                }
                
                this.navigateToSection(section);
            }
        });
    }

    setupProjectHandlers() {
        // Project close button
        document.addEventListener('click', (e) => {
            const closeButton = e.target.closest('.close-project');
            if (closeButton) {
                e.preventDefault();
                this.closeProject();
            }
        });
    }

    setupLayoutHandlers() {
        // Responsive layout handling
        window.addEventListener('resize', () => {
            if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
            
            this.mainElement.classList.add('resizing');
            
            this.resizeTimeout = setTimeout(() => {
                const currentSection = this.state.currentSection;
                const sectionIndex = this.state.sections.indexOf(currentSection);
                const scrollLeft = sectionIndex * this.mainElement.clientWidth;
                
                this.mainElement.scrollTo({
                    left: scrollLeft,
                    behavior: 'auto'
                });
                
                this.mainElement.classList.remove('resizing');
            }, 150);
        });

        // Layout change handling
        this.eventBus.on('layoutChange', ({ isMobile }) => {
            this.handleLayoutChange(isMobile);
        });
    }

    setupScrollHandling() {
        this.mainElement.addEventListener('scroll', () => {
            if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
            
            this.scrollTimeout = setTimeout(() => {
                if (!this.mainElement.classList.contains('resizing')) {
                    const scrollLeft = this.mainElement.scrollLeft;
                    const width = this.mainElement.clientWidth;
                    const sectionIndex = Math.round(scrollLeft / width);
                    const section = this.state.sections[sectionIndex];
                    
                    // Prevent scrolling to project-details if no project is loaded
                    if (section === 'project-details' && !this.state.isProjectOpen) {
                        const workIndex = this.state.sections.indexOf('work');
                        this.mainElement.scrollTo({
                            left: workIndex * this.mainElement.clientWidth,
                            behavior: 'smooth'
                        });
                        return;
                    }
                    
                    if (section && section !== this.state.currentSection) {
                        this.updateSection(section);
                    }
                }
            }, 100);
        });
    }

    setupMediaHandlers() {
        // Media intersection handling
        this.eventBus.on('mediaIntersection', (mediaElement) => {
            if (!this.state.isProjectOpen || window.innerWidth < 768) return;
            this.mediaManager.updateMedia({ element: mediaElement });
        });
    }

    async openProject(path, isPopState = false) {
        if (this.state.isLoading) return;
        
        this.state.isLoading = true;
        
        try {
            this.mainElement.classList.remove('no-project');
            
            if (this.projectDetailsContent) {
                this.projectDetailsContent.innerHTML = '<div class="loading">Loading...</div>';
            }
    
            const fetchPath = this.router.addMdExtension(path);
            const response = await fetch(`./content/${fetchPath}`);
            
            if (!response.ok) throw new Error('Failed to fetch project content');
            
            const content = await response.text();
            const { metadata, html } = await this.contentParser.parse(content);
    
            // Update project title in header
            const projectTitle = document.querySelector('.project-header .project-title');
            if (projectTitle) {
                projectTitle.textContent = metadata.title || '';
            }

            if (this.projectDetailsContent) {
                this.projectDetailsContent.innerHTML = html;
            }
            
            const cleanPath = this.router.cleanPath(path);
            this.updateProjectInNav(metadata.title, cleanPath);
            
            this.state.isProjectOpen = true;
            this.navigateToSection('project-details', isPopState);
            
            if (!isPopState) {
                this.router.updateProjectURL(cleanPath);
            }
    
            if (window.innerWidth >= 768) {
                const mediaElements = document.querySelectorAll('.media-block');
                if (mediaElements.length > 0) {
                    this.mediaManager.updateMedia({ element: mediaElements[0] });
                    this.intersectionManager.observe(mediaElements);
                }
            }
        } catch (error) {
            console.error('Error loading project:', error);
            this.showErrorMessage('Failed to load project');
            this.mainElement.classList.add('no-project');
            this.state.isProjectOpen = false;
        } finally {
            this.state.isLoading = false;
        }
    }

    closeProject() {
        if (!this.state.isProjectOpen) return;

        const workIndex = this.state.sections.indexOf('work');
        this.mainElement.scrollTo({
            left: workIndex * this.mainElement.clientWidth,
            behavior: 'smooth'
        });

        setTimeout(() => {
            this.state.isProjectOpen = false;
            this.state.currentSection = 'work';
            
            this.mainElement.classList.add('no-project');
            
            const projectNav = this.mainNav.querySelector('a[section="project-details"]');
            if (projectNav) projectNav.remove();
            
            this.router.updateURL('work');
            this.updateNavigation('work');
            
            if (this.intersectionManager) {
                this.intersectionManager.disconnect();
            }
        }, 500);
    }

    navigateToSection(section, isPopState = false) {
        // Prevent navigation to project-details if no project is open
        if (section === 'project-details' && !this.state.isProjectOpen) {
            console.warn('Attempted to navigate to project details with no project loaded');
            return;
        }
        
        if (!this.state.sections.includes(section)) return;
        
        const sectionIndex = this.state.sections.indexOf(section);
        const scrollLeft = sectionIndex * this.mainElement.clientWidth;
        
        this.mainElement.scrollTo({
            left: scrollLeft,
            behavior: isPopState ? 'auto' : 'smooth'
        });

        this.updateSection(section, isPopState);
    }

    updateSection(section, isPopState = false) {
        this.state.currentSection = section;
        this.updateNavigation(section);
        
        if (!isPopState) {
            if (section === 'project-details' && this.state.isProjectOpen) {
                const projectNav = this.mainNav.querySelector('a[section="project-details"]');
                const currentPath = projectNav?.getAttribute('data-path');
                if (currentPath) {
                    this.router.updateProjectURL(currentPath);
                }
            } else {
                this.router.updateURL(section);
            }
        }
    }

    updateNavigation(section) {
        this.mainNav.querySelectorAll('a[section]').forEach(link => {
            const linkSection = link.getAttribute('section');
            link.classList.toggle('active', linkSection === section);
        });
    }

    updateProjectInNav(title, path) {
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

    handleLayoutChange(isMobile) {
        if (isMobile) {
            if (this.intersectionManager) {
                this.intersectionManager.disconnect();
            }
            if (this.mediaManager) {
                this.mediaManager.destroy();
            }
        } else if (this.state.isProjectOpen) {
            const mediaElements = document.querySelectorAll('.media-block');
            if (mediaElements.length > 0) {
                this.mediaManager.updateMedia({ element: mediaElements[0] });
                this.intersectionManager.observe(mediaElements);
            }
        }
    }

    showErrorMessage(message) {
        if (this.projectDetailsContent) {
            this.projectDetailsContent.innerHTML = `
                <div class="error-message">
                    ${message}
                </div>
            `;
        }
    }

    destroy() {
        if (this.intersectionManager) {
            this.intersectionManager.disconnect();
        }
        if (this.layout) {
            this.layout.destroy();
        }
        if (this.mediaManager) {
            this.mediaManager.destroy();
        }
        if (this.router) {
            this.router.destroy();
        }
        if (this.themeManager) {
            this.themeManager.destroy();
        }
        
        if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
        if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});