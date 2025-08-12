// NEW: app.js - Simplified main coordinator
import { ContentService } from './services/contentService.js';
import { SearchService } from './services/searchService.js';
import { StorageService } from './services/storageService.js';
import { MediaManager } from './ui/mediaManager.js';
import { IntersectionManager } from './ui/intersectionManager.js';
import { ProjectGrid } from './ui/projectGrid.js';
import { SettingsDrawer } from './ui/settingsDrawer.js';
import { Navigation } from './ui/navigation.js';
import { MetaManager } from './core/metaManager.js';
import { Router } from './core/router.js';
// ResponsiveLayout functionality integrated directly
import { dom } from './utils/dom.js';

class App {
    constructor() {
        // Core services
        this.contentService = new ContentService();
        this.storageService = new StorageService();
        this.metaManager = new MetaManager();
        
        // Core elements
        this.mainElement = document.querySelector('main');
        this.projectDetailsContent = document.getElementById('project-details-content');
        this.mediaContainer = document.querySelector('.project-media');
        
        // State
        this.state = {
            currentSection: 'about',
            isProjectOpen: false,
            isLoading: false,
            sections: ['about', 'work', 'project-details']
        };
        
        this.isDesktop = window.innerWidth >= 768;
        
        // Debounce timeouts
        this.scrollTimeout = null;
        this.resizeTimeout = null;
        
        this.init();
    }

    async init() {
        try {
            // Initialize in order
            await this.initializeServices();
            this.setupNavigation();
            this.setupDesktopLayout(); // PRESERVE: Your magazine layout
            this.setupProjectSystem(); // PRESERVE: Search & filtering
            this.setupSettings();      // PRESERVE: Settings drawer
            this.setupEventListeners();
            await this.handleInitialRoute();
            this.setupResponsiveHandling();
            
            // Ensure initial state is correct
            if (!this.state.isProjectOpen) {
                this.mainElement.classList.add('no-project');
            }
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showErrorMessage('Failed to initialize application');
        }
    }
    
    async initializeServices() {
        // Load projects for search service
        const projectsData = await this.contentService.getProjects();
        this.searchService = new SearchService(projectsData.publications);
    }

    setupNavigation() {
        this.navigation = new Navigation(this);
        
        // Router setup
        this.router = new Router({
            app: this,
            sections: this.state.sections,
            defaultSection: 'about'
        });
    }

    setupDesktopLayout() {
        console.log('Setting up desktop layout, isDesktop:', this.isDesktop);
        console.log('Media container:', this.mediaContainer);
        
        if (this.isDesktop) {
            // PRESERVE: Your core innovation
            this.mediaManager = new MediaManager(this.mediaContainer);
            this.intersectionManager = new IntersectionManager(this.mediaManager);
            console.log('Created MediaManager and IntersectionManager');
        }
        
        // Responsive layout handling integrated directly in resize handler
    }
    
    setupProjectSystem() {
        // PRESERVE: Search and filtering functionality
        const projectsGrid = document.querySelector('.projects-grid');
        if (projectsGrid) {
            this.projectGrid = new ProjectGrid(
                projectsGrid, 
                this.contentService, 
                this.searchService  // Direct connection
            );
            
            // Set project selection callback
            this.projectGrid.setOnProjectSelect((path) => this.openProject(path));
        }
    }
    
    setupSettings() {
        // PRESERVE: Settings drawer functionality
        this.settingsDrawer = new SettingsDrawer(this.storageService);
    }

    setupEventListeners() {
        this.setupProjectHandlers();
        this.setupLayoutHandlers();
        this.setupScrollHandling();
        this.setupMediaHandlers();
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
        window.addEventListener('resize', () => {
            if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
            
            // Add resizing class to disable scroll snap
            this.mainElement.classList.add('resizing');
            
            this.resizeTimeout = setTimeout(() => {
                // Calculate proper scroll position
                const currentSection = this.state.currentSection;
                const sectionIndex = this.state.sections.indexOf(currentSection);
                const scrollLeft = sectionIndex * window.innerWidth;
                
                // Scroll to correct position without animation
                this.mainElement.scrollTo({
                    left: scrollLeft,
                    behavior: 'auto'
                });
                
                // Update desktop state
                this.isDesktop = window.innerWidth >= 768;
                
                // Remove resizing class after a brief delay
                setTimeout(() => {
                    this.mainElement.classList.remove('resizing');
                }, 50);
            }, 150);
        });
    }

    setupScrollHandling() {
        let ticking = false;
        
        this.mainElement.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
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
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    setupMediaHandlers() {
        // Media intersection handling (for desktop magazine layout)
        // The IntersectionManager will call MediaManager directly (no EventBus)
    }

    async handleInitialRoute() {
        await this.router.handleInitialURL();
    }

    async openProject(path, isPopState = false) {
        if (this.state.isLoading) return;
        
        this.state.isLoading = true;
        
        // Clear content service cache to ensure fresh parsing
        this.contentService.clearCache();
        
        // Clear media manager immediately to prevent persistence from previous project
        if (this.mediaManager) {
            this.mediaManager.clear();
        }
        
        try {
            this.mainElement.classList.remove('no-project');
            
            if (this.projectDetailsContent) {
                this.projectDetailsContent.innerHTML = '<div class="loading">Loading...</div>';
            }
    
            const project = await this.contentService.getProject(path);
            
            // Update project title in header
            const projectTitle = document.querySelector('.project-header .project-title');
            if (projectTitle) {
                projectTitle.textContent = project.metadata.title || '';
            }
    
            if (this.projectDetailsContent) {
                console.log('Setting project HTML:', project.html.substring(0, 500) + '...');
                this.projectDetailsContent.innerHTML = project.html;
                console.log('Project content after setting HTML:', this.projectDetailsContent.innerHTML.substring(0, 500) + '...');
            }
            
            const cleanPath = this.router.cleanPath(path);
            this.navigation.updateProjectInNav(project.metadata.title, cleanPath);
            
            // Update SEO
            this.metaManager.updateForProject(project.metadata, cleanPath);
            
            this.state.isProjectOpen = true;
            this.navigateToSection('project-details', isPopState);
            
            if (!isPopState) {
                this.router.updateProjectURL(cleanPath);
            }
    
            // Setup magazine layout for desktop
            if (this.isDesktop) {
                // Reinitialize MediaManager and IntersectionManager for new project
                this.mediaManager = new MediaManager(this.mediaContainer);
                this.intersectionManager = new IntersectionManager(this.mediaManager);
                
                // Small delay to ensure DOM is updated
                setTimeout(() => {
                    // Try multiple selectors to find media elements (images and blockquotes)
                    let mediaElements = document.querySelectorAll('[data-media]');
                    console.log('Found [data-media] elements:', mediaElements.length);
                    
                    if (mediaElements.length === 0) {
                        mediaElements = document.querySelectorAll('.media-block');
                        console.log('Found .media-block elements:', mediaElements.length);
                    }
                    
                    if (mediaElements.length === 0) {
                        mediaElements = document.querySelectorAll('blockquote, figure');
                        console.log('Found blockquote/figure elements:', mediaElements.length);
                    }
                    
                    console.log('Media elements:', mediaElements);
                    if (mediaElements.length > 0) {
                        console.log('Initializing with first media element:', mediaElements[0]);
                        // Force immediate update of the first media element
                        this.mediaManager.updateMedia({ element: mediaElements[0] });
                        this.intersectionManager.observe(mediaElements);
                    } else {
                        console.warn('No media elements found in project content');
                        // Let's also check what's actually in the DOM
                        console.log('Current project content HTML:', this.projectDetailsContent.innerHTML);
                    }
                }, 100);
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
    
        // Add resizing class before transition
        this.mainElement.classList.add('resizing');
        
        const workIndex = this.state.sections.indexOf('work');
        this.mainElement.scrollTo({
            left: workIndex * window.innerWidth,
            behavior: 'smooth'
        });
    
        // Update state after transition
        setTimeout(() => {
            this.state.isProjectOpen = false;
            this.state.currentSection = 'work';
            this.mainElement.classList.add('no-project');
            
            // Clean up project navigation
            this.navigation.removeProjectFromNav();
            
            this.router.updateURL('work');
            this.navigation.updateActiveSection('work');
            
            // Update SEO for work section
            this.metaManager.updateForSection('work');
            
            // Clean up media components
            if (this.intersectionManager) {
                this.intersectionManager.disconnect();
            }
            if (this.mediaManager) {
                this.mediaManager.destroy();
            }
            
            // Remove resizing class after everything is done
            setTimeout(() => {
                this.mainElement.classList.remove('resizing');
            }, 50);
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
        this.navigation.updateActiveSection(section);
        
        if (!isPopState) {
            if (section === 'project-details' && this.state.isProjectOpen) {
                const projectNav = document.querySelector('a[section="project-details"]');
                const currentPath = projectNav?.getAttribute('data-path');
                if (currentPath) {
                    this.router.updateProjectURL(currentPath);
                }
            } else {
                this.router.updateURL(section);
                this.metaManager.updateForSection(section);
            }
        }
    }

    handleLayoutChange(isMobile) {
        this.isDesktop = !isMobile;
        
        if (isMobile) {
            if (this.intersectionManager) {
                this.intersectionManager.disconnect();
            }
            if (this.mediaManager) {
                this.mediaManager.destroy();
            }
        } else if (this.state.isProjectOpen) {
            // Reinitialize desktop layout
            if (!this.mediaManager) {
                this.mediaManager = new MediaManager(this.mediaContainer);
            }
            if (!this.intersectionManager) {
                this.intersectionManager = new IntersectionManager(this.mediaManager);
            }
            
            const mediaElements = document.querySelectorAll('[data-media]');
            if (mediaElements.length > 0) {
                this.mediaManager.updateMedia({ element: mediaElements[0] });
                this.intersectionManager.observe(mediaElements);
            }
        }
    }

    setupResponsiveHandling() {
        // Initial setup based on screen size
        this.handleLayoutChange(window.innerWidth < 768);
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
        // Layout cleanup handled in resize handler
        if (this.mediaManager) {
            this.mediaManager.destroy();
        }
        if (this.router) {
            this.router.destroy();
        }
        if (this.settingsDrawer) {
            this.settingsDrawer.destroy();
        }
        if (this.projectGrid) {
            this.projectGrid.destroy();
        }
        
        if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
        if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});