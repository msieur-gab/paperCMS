// NEW: app.js - Simplified main coordinator
import { ContentService } from './services/contentService.js';
import { SearchService } from './services/searchService.js';
import { StorageService } from './services/storageService.js';
import { ChartService } from './services/chartService.js';
import { MediaManager } from './ui/mediaManager.js';
import { IntelligentMediaSync } from './ui/intelligentMediaSync.js';
import { ProjectGrid } from './ui/projectGrid.js';
import { SettingsDrawer } from './ui/settingsDrawer.js';
import { Navigation } from './ui/navigation.js';
import { MetaManager } from './core/metaManager.js';
import { Router } from './core/router.js';
// ResponsiveLayout functionality integrated directly
import { dom } from './utils/dom.js';
import { ResizeManager } from './utils/resizeManager.js';

class App {
    constructor() {
        // Core services
        this.contentService = new ContentService();
        this.storageService = new StorageService();
        this.resizeManager = new ResizeManager();
        this.chartService = new ChartService(this.resizeManager);
        this.metaManager = new MetaManager();
        
        // Core elements
        this.mainElement = document.querySelector('main');
        this.projectDetailsContent = document.getElementById('project-details-content');
        this.mediaContainer = document.querySelector('.project-media');
        
        // State
        this.state = {
            currentSection: 'story',
            isProjectOpen: false,
            isLoading: false,
            sections: ['story', 'projects', 'project-details']
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
            defaultSection: 'story'
        });
    }

    setupDesktopLayout() {
        if (this.isDesktop) {
            // PRESERVE: Your core innovation
            this.mediaManager = new MediaManager(this.mediaContainer, { chartService: this.chartService });
            this.intelligentMediaSync = new IntelligentMediaSync(this.mediaManager);
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
        // Project handlers can be added here in the future if needed
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
                            const projectsIndex = this.state.sections.indexOf('projects');
                            this.mainElement.scrollTo({
                                left: projectsIndex * this.mainElement.clientWidth,
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
        // The IntelligentMediaSync will call MediaManager directly (no EventBus)
    }

    async handleInitialRoute() {
        await this.router.handleInitialURL();
    }

    async openProject(path, isPopState = false) {
        if (this.state.isLoading) return;
        
        this.state.isLoading = true;
        
        // Clear content service cache to ensure fresh parsing
        this.contentService.clearCache();
        
        // Clear media manager and disconnect scroll observer to prevent persistence from previous project
        if (this.intelligentMediaSync) {
            this.intelligentMediaSync.disconnect();
        }
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
            
            // EXPERIMENTAL: Header enhancements - easily removable
            this.updateProjectHeaderMetadata(project.metadata);
    
            if (this.projectDetailsContent) {
                this.projectDetailsContent.innerHTML = project.html;
                
                // Initialize charts after content is rendered
                this.initializeCharts();
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
    
            // Setup media observation for desktop layout
            if (this.isDesktop && this.intelligentMediaSync && this.mediaManager) {
                // Small delay to ensure DOM is fully rendered
                setTimeout(() => {
                    const mediaElements = this.projectDetailsContent.querySelectorAll('[data-media]');
                    if (mediaElements.length > 0) {
                        this.intelligentMediaSync.observe(Array.from(mediaElements));
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


    navigateToSection(section, isPopState = false) {
        // Prevent navigation to project-details if no project is open
        if (section === 'project-details' && !this.state.isProjectOpen) {
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
            if (this.intelligentMediaSync) {
                this.intelligentMediaSync.disconnect();
                this.intelligentMediaSync = null;
            }
            if (this.mediaManager) {
                this.mediaManager.destroy();
                this.mediaManager = null;
            }
        } else if (this.state.isProjectOpen) {
            // Reinitialize desktop layout
            if (!this.mediaManager) {
                this.mediaManager = new MediaManager(this.mediaContainer, { chartService: this.chartService });
            }
            if (!this.intelligentMediaSync) {
                this.intelligentMediaSync = new IntelligentMediaSync(this.mediaManager);
            }
            
            const mediaElements = document.querySelectorAll('[data-media]');
            if (mediaElements.length > 0) {
                this.mediaManager.updateMedia({ element: mediaElements[0] });
                this.intelligentMediaSync.observe(Array.from(mediaElements));
            }
        }
    }

    setupResponsiveHandling() {
        // Initial setup based on screen size
        this.handleLayoutChange(window.innerWidth < 768);
    }
    
    // Header metadata display with scroll behavior
    updateProjectHeaderMetadata(metadata) {
        const authorByline = document.querySelector('.author-byline');
        const dateByline = document.querySelector('.date-byline');
        
        if (!authorByline || !dateByline) {
            return;
        }
        
        // Find primary author from contributors array
        const primaryAuthor = metadata.contributors?.find(c => c.role === 'author') || metadata.contributors?.[0];
        const authorName = primaryAuthor?.name || 'Gabriel Baude';
        let authorAvatar = primaryAuthor?.avatar || './content/media/avatars/gabriel_baude.jpg';
        
        // Fix avatar path - ensure it includes content/ folder
        if (authorAvatar && !authorAvatar.startsWith('http') && !authorAvatar.startsWith('./content/')) {
            if (authorAvatar.startsWith('./media/')) {
                authorAvatar = authorAvatar.replace('./media/', './content/media/');
            } else if (authorAvatar.startsWith('media/')) {
                authorAvatar = './content/' + authorAvatar;
            }
        }
        
        const avatar = authorByline.querySelector('.author-avatar-header');
        const name = authorByline.querySelector('.author-name-header');
        const dateElement = dateByline.querySelector('.publication-date-header');
        
        // Set author info
        if (avatar && authorAvatar) {
            avatar.src = authorAvatar;
            avatar.alt = authorName;
        }
        
        if (name && authorName) {
            name.textContent = authorName;
        }
        
        // Publication date - check multiple possible locations
        const publishedDate = metadata.date?.published || metadata.published || metadata['date.published'];
        
        if (publishedDate && dateElement) {
            const date = new Date(publishedDate);
            const formattedDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            dateElement.textContent = formattedDate;
            dateElement.setAttribute('datetime', publishedDate);
        }
        
        // Show both bylines
        authorByline.style.display = 'block';
        dateByline.style.display = 'block';
        
        // Setup scroll-based shrinking
        this.setupBylineScrollBehavior();
    }
    
    // Scroll-based byline shrinking
    setupBylineScrollBehavior() {
        const contentScroll = document.querySelector('.content-scroll');
        const authorByline = document.querySelector('.author-byline');
        const dateByline = document.querySelector('.date-byline');
        
        if (!contentScroll || !authorByline || !dateByline) return;
        
        let ticking = false;
        
        const updateBylines = () => {
            const scrollTop = contentScroll.scrollTop;
            const threshold = 100; // Start shrinking after 100px scroll
            
            if (scrollTop > threshold) {
                authorByline.classList.add('scroll-shrunk');
                dateByline.classList.add('scroll-shrunk');
            } else {
                authorByline.classList.remove('scroll-shrunk');
                dateByline.classList.remove('scroll-shrunk');
            }
            ticking = false;
        };
        
        const onScroll = () => {
            if (!ticking) {
                requestAnimationFrame(updateBylines);
                ticking = true;
            }
        };
        
        // Remove existing listener if any
        contentScroll.removeEventListener('scroll', onScroll);
        // Add new listener
        contentScroll.addEventListener('scroll', onScroll, { passive: true });
    }

    async initializeCharts() {
        try {
            // Initialize all charts in the project content container
            await this.chartService.initializeChartsInContainer(this.projectDetailsContent);
        } catch (error) {
            console.error('Failed to initialize charts:', error);
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
        if (this.intelligentMediaSync) {
            this.intelligentMediaSync.disconnect();
        }
        // Layout cleanup handled in resize handler
        if (this.mediaManager) {
            this.mediaManager.destroy();
        }
        if (this.chartService) {
            this.chartService.destroy();
        }
        if (this.resizeManager) {
            this.resizeManager.destroy();
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
