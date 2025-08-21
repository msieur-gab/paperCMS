// ChartService - Centralized chart management for PaperCMS
export class ChartService {
    constructor(resizeManager = null) {
        this.charts = new Map(); // Track all chart instances
        this.chartStyles = null;
        this.isInitialized = false;
        this.pendingCharts = []; // Charts waiting for dependencies to load
        this.resizeManager = resizeManager;
        this.resizeUnsubscribe = null;
        
        // Load dependencies
        this.initializeDependencies();
    }

    async initializeDependencies() {
        try {
            // Load Chart.js if not already loaded
            if (typeof Chart === 'undefined') {
                await this.loadScript('https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js');
            }
            
            // Import ChartStyleManager
            const { ChartStyleManager } = await import('../utils/chartStyles.js');
            this.chartStyles = new ChartStyleManager();
            
            this.isInitialized = true;
            
            // Setup theme change monitoring
            this.setupThemeListener();
            
            // Setup resize handling if ResizeManager is available
            this.setupResizeHandling();
            
            // Process any pending charts
            await this.processPendingCharts();
            
        } catch (error) {
            console.error('Failed to load chart dependencies:', error);
            throw error;
        }
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            // Check if script is already loaded
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async processPendingCharts() {
        const pending = [...this.pendingCharts];
        this.pendingCharts = [];
        
        for (const chartConfig of pending) {
            await this.createChart(chartConfig);
        }
    }

    setupThemeListener() {
        // Watch for data-theme attribute changes on document element
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                    this.updateTheme();
                }
            });
        });
        
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });
        
        // Store observer for cleanup
        this.themeObserver = observer;
    }

    setupResizeHandling() {
        if (!this.resizeManager) return;
        
        // Subscribe to resize events
        this.resizeUnsubscribe = this.resizeManager.subscribe('chartService', (resizeData) => {
            this.handleResize(resizeData);
        });
    }

    handleResize(resizeData) {
        // Charts now use responsive CSS, so we just need to trigger a resize
        // Chart.js handles responsive behavior automatically with responsive: true
        if (resizeData.breakpointChanged) {
            this.refreshChartsForResize();
        }
    }

    async refreshChartsForResize() {
        // Trigger Chart.js resize for all charts
        for (const [chartId, chartData] of this.charts) {
            try {
                if (chartData.chart && chartData.chart.resize) {
                    chartData.chart.resize();
                }
            } catch (error) {
                console.error('Failed to resize chart:', chartId, error);
            }
        }
    }

    // Main method to create a chart
    async createChart({ element, canvas, chartType, config, chartId }) {
        if (!this.isInitialized) {
            // Add to pending queue
            this.pendingCharts.push({ element, canvas, chartType, config, chartId });
            return null;
        }

        try {
            // Destroy existing chart with same ID if it exists
            if (this.charts.has(chartId)) {
                this.destroyChart(chartId);
            }

            // Get canvas context
            const ctx = canvas.getContext('2d');
            
            // Style the datasets using ChartStyleManager
            const styledData = this.styleChartData(config.data, chartType);
            
            // Create chart options
            const chartOptions = this.chartStyles.mergeOptions({}, chartType);
            this.chartStyles.addTitle(chartOptions, config.title);
            
            // Create Chart.js instance
            const chart = new Chart(ctx, {
                type: chartType,
                data: styledData,
                options: chartOptions
            });
            
            // Store chart instance
            this.charts.set(chartId, {
                chart,
                element,
                canvas,
                config,
                chartType
            });
            
            return chart;
            
        } catch (error) {
            console.error('Failed to create chart:', error);
            throw error;
        }
    }



    // Style chart data using ChartStyleManager
    styleChartData(data, chartType) {
        return {
            labels: data.labels,
            datasets: data.datasets.map((dataset, index) => {
                const multiDataset = data.datasets.length > 1;
                return this.chartStyles.createDataset(
                    dataset.label, 
                    dataset.data, 
                    chartType, 
                    { 
                        multiDataset,
                        colorIndex: index,
                        totalDatasets: data.datasets.length
                    }
                );
            })
        };
    }

    // Initialize all chart blocks in a container (for mobile inline charts)
    async initializeChartsInContainer(container) {
        const chartBlocks = container.querySelectorAll('.chart-block[data-chart-id]');
        const results = [];

        for (const chartBlock of chartBlocks) {
            const result = await this.initializeChartBlock(chartBlock);
            if (result) results.push(result);
        }

        return results;
    }

    // Initialize a single chart block (unified approach like other media elements)
    async initializeChartBlock(chartBlock) {
        const chartType = chartBlock.dataset.chartType;
        const config = JSON.parse(chartBlock.dataset.chartConfig);
        const chartId = chartBlock.dataset.chartId;

        // Find the canvas element (single canvas now)
        const canvas = chartBlock.querySelector('.chart-canvas');

        if (!canvas) {
            console.warn('No canvas found for chart:', chartId);
            return null;
        }

        return await this.createChart({
            element: chartBlock,
            canvas,
            chartType,
            config,
            chartId
        });
    }

    // Create chart for sidebar (used by MediaManager)
    async createSidebarChart(chartElement, sidebarContainer) {
        const chartType = chartElement.dataset.chartType;
        const config = JSON.parse(chartElement.dataset.chartConfig);
        const chartId = chartElement.dataset.chartId;

        // Create sidebar-specific container
        const chartContainer = document.createElement('div');
        chartContainer.className = 'chart-container';
        
        const canvas = document.createElement('canvas');
        canvas.id = `sidebar-${chartId}`;
        canvas.className = 'chart-canvas';
        // Don't set explicit width/height - let CSS and Chart.js handle responsive sizing
        // Chart.js will handle proper dimensions based on container and responsive: true
        
        chartContainer.appendChild(canvas);
        
        // Add title if present
        if (config.title) {
            const title = document.createElement('div');
            title.className = 'chart-title';
            title.textContent = config.title;
            chartContainer.appendChild(title);
        }
        
        sidebarContainer.appendChild(chartContainer);

        // Create the chart
        return await this.createChart({
            element: chartElement,
            canvas,
            chartType,
            config,
            chartId: `sidebar-${chartId}`
        });
    }

    // Handle theme changes
    updateTheme() {
        if (!this.chartStyles) return;
        
        this.chartStyles.updateTheme();
        
        // Re-render all existing charts with new theme (async to prevent freezing)
        this.reRenderAllCharts();
    }

    async reRenderAllCharts() {
        const chartIds = Array.from(this.charts.keys());
        
        // Process charts one by one to prevent overwhelming the browser
        for (const chartId of chartIds) {
            try {
                await this.reRenderChart(chartId);
            } catch (error) {
                console.error('Failed to re-render chart:', chartId, error);
            }
        }
    }

    // Re-render a specific chart (useful for theme changes)
    async reRenderChart(chartId) {
        const chartData = this.charts.get(chartId);
        if (!chartData) return;

        const { chart, element, canvas, config, chartType } = chartData;
        
        try {
            // Destroy old chart
            chart.destroy();
            
            // Create new chart with updated theme
            await this.createChart({
                element,
                canvas,
                chartType,
                config,
                chartId
            });
            
        } catch (error) {
            console.error('Failed to re-render chart:', chartId, error);
        }
    }

    // Destroy a specific chart
    destroyChart(chartId) {
        const chartData = this.charts.get(chartId);
        if (chartData) {
            chartData.chart.destroy();
            this.charts.delete(chartId);
        }
    }

    // Destroy all charts
    destroyAllCharts() {
        for (const [chartId, chartData] of this.charts) {
            chartData.chart.destroy();
        }
        this.charts.clear();
    }

    // Get chart instance
    getChart(chartId) {
        return this.charts.get(chartId)?.chart;
    }

    // Check if chart exists
    hasChart(chartId) {
        return this.charts.has(chartId);
    }

    // Get all chart IDs
    getChartIds() {
        return Array.from(this.charts.keys());
    }


    // Cleanup and destroy service
    destroy() {
        this.destroyAllCharts();
        
        if (this.chartStyles) {
            this.chartStyles.destroy();
            this.chartStyles = null;
        }
        
        // Clean up theme observer
        if (this.themeObserver) {
            this.themeObserver.disconnect();
            this.themeObserver = null;
        }
        
        // Clean up resize subscription
        if (this.resizeUnsubscribe) {
            this.resizeUnsubscribe();
            this.resizeUnsubscribe = null;
        }
        
        this.pendingCharts = [];
        this.isInitialized = false;
    }
}