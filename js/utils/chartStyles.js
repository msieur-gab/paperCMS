// Chart styling utility - isolated for fine-grained control
export class ChartStyleManager {
    constructor() {
        // Chart-specific configuration - initialize BEFORE updateTheme()
        this.chartDefaults = {
            borderWidth: 2,
            borderRadius: 4,
            fontFamily: 'Roboto, system-ui, -apple-system, sans-serif',
            headingFontFamily: 'Orienta, system-ui, -apple-system, sans-serif',
            fontSize: 12,
            headingFontSize: 16,
            animationDuration: 750,
            tension: 0.4, // For line charts
            transparency: {
                fill: '20',      // 20% opacity for fill areas
                bar: '80',       // 80% opacity for bars  
                solid: 'FF'      // 100% opacity for borders/lines
            }
        };
        
        // Initialize theme after defaults are set
        this.updateTheme();
    }

    updateTheme() {
        const root = document.documentElement;
        const style = getComputedStyle(root);
        const isDark = root.getAttribute('data-theme') === 'dark';
        
        // Extract colors from CSS custom properties
        this.colors = {
            // Base theme colors
            text: style.getPropertyValue('--color-text').trim(),
            textLight: style.getPropertyValue('--color-text-light').trim(),
            background: style.getPropertyValue('--color-background').trim(),
            border: style.getPropertyValue('--color-border').trim(),
            
            // Chart-specific color palettes
            primary: style.getPropertyValue('--chart-primary').trim(),
            secondary: style.getPropertyValue('--chart-secondary').trim(),
            tertiary: style.getPropertyValue('--chart-tertiary').trim(),
            quaternary: style.getPropertyValue('--chart-quaternary').trim(),
            quinary: style.getPropertyValue('--chart-quinary').trim(),
            accent: style.getPropertyValue('--chart-accent').trim()
        };

        // Generate additional palette variations
        this.generatePaletteVariations();
        
        // Create default Chart.js options
        this.createDefaultOptions();
    }

    generatePaletteVariations() {
        const baseColors = [
            this.colors.primary,
            this.colors.secondary, 
            this.colors.tertiary,
            this.colors.quaternary,
            this.colors.quinary,
            this.colors.accent
        ];

        // Generate extended palette with variations
        this.palette = {
            standard: baseColors,
            light: baseColors.map(color => this.lightenColor(color, 0.3)),
            dark: baseColors.map(color => this.darkenColor(color, 0.3)),
            muted: baseColors.map(color => this.adjustSaturation(color, 0.6))
        };
    }

    createDefaultOptions() {
        this.defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: this.chartDefaults.animationDuration,
                easing: 'easeInOutQuart'
            },
            plugins: {
                legend: {
                    labels: {
                        color: this.colors.text,
                        font: {
                            family: this.chartDefaults.fontFamily,
                            size: this.chartDefaults.fontSize
                        },
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: this.colors.background,
                    titleColor: this.colors.text,
                    bodyColor: this.colors.text,
                    borderColor: this.colors.border,
                    borderWidth: 1,
                    cornerRadius: 6,
                    titleFont: {
                        family: this.chartDefaults.fontFamily,
                        size: this.chartDefaults.fontSize + 1,
                        weight: 'bold'
                    },
                    bodyFont: {
                        family: this.chartDefaults.fontFamily,
                        size: this.chartDefaults.fontSize
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: this.colors.textLight,
                        font: {
                            family: this.chartDefaults.fontFamily,
                            size: this.chartDefaults.fontSize - 1
                        }
                    },
                    grid: {
                        color: this.colors.border,
                        lineWidth: 0.5
                    },
                    border: {
                        color: this.colors.border,
                        width: 1
                    }
                },
                y: {
                    ticks: {
                        color: this.colors.textLight,
                        font: {
                            family: this.chartDefaults.fontFamily,
                            size: this.chartDefaults.fontSize - 1
                        }
                    },
                    grid: {
                        color: this.colors.border,
                        lineWidth: 0.5
                    },
                    border: {
                        color: this.colors.border,
                        width: 1
                    }
                }
            }
        };
    }

    // Get color palette based on usage context
    getColorPalette(count = 6, style = 'standard') {
        const palette = this.palette[style] || this.palette.standard;
        
        if (count <= palette.length) {
            return palette.slice(0, count);
        }
        
        // Generate additional colors if needed
        const extended = [...palette];
        while (extended.length < count) {
            extended.push(...palette);
        }
        
        return extended.slice(0, count);
    }

    // Create styled dataset for different chart types
    createDataset(label, data, chartType, options = {}) {
        const {
            colorStyle = 'standard',
            colorIndex = 0,
            multiDataset = false
        } = options;

        const colors = this.getColorPalette(multiDataset ? 1 : data.length, colorStyle);
        
        const dataset = {
            label: label,
            data: data,
            borderWidth: this.chartDefaults.borderWidth,
            borderRadius: this.chartDefaults.borderRadius
        };

        // Apply chart-type specific styling
        switch (chartType) {
            case 'bar':
                return this.styleBarDataset(dataset, colors, multiDataset, colorIndex);
            case 'line':
                return this.styleLineDataset(dataset, colors, multiDataset, colorIndex);
            case 'pie':
            case 'doughnut':
                return this.stylePieDataset(dataset, colors);
            default:
                return dataset;
        }
    }

    styleBarDataset(dataset, colors, multiDataset, colorIndex) {
        if (multiDataset) {
            const color = colors[colorIndex % colors.length];
            dataset.backgroundColor = color + this.chartDefaults.transparency.bar;
            dataset.borderColor = color + this.chartDefaults.transparency.solid;
        } else {
            dataset.backgroundColor = colors.map(color => color + this.chartDefaults.transparency.bar);
            dataset.borderColor = colors.map(color => color + this.chartDefaults.transparency.solid);
        }
        
        dataset.hoverBackgroundColor = colors.map(color => color + this.chartDefaults.transparency.solid);
        return dataset;
    }

    styleLineDataset(dataset, colors, multiDataset, colorIndex) {
        if (multiDataset) {
            const color = colors[colorIndex % colors.length];
            dataset.backgroundColor = color + this.chartDefaults.transparency.fill;
            dataset.borderColor = color + this.chartDefaults.transparency.solid;
            dataset.fill = false; // Don't fill multi-line charts
        } else {
            dataset.backgroundColor = colors[0] + this.chartDefaults.transparency.fill;
            dataset.borderColor = colors[0] + this.chartDefaults.transparency.solid;
            dataset.fill = true;
        }
        
        dataset.tension = this.chartDefaults.tension;
        dataset.pointBackgroundColor = dataset.borderColor;
        dataset.pointBorderColor = this.colors.background;
        dataset.pointBorderWidth = 2;
        dataset.pointRadius = 4;
        dataset.pointHoverRadius = 6;
        
        return dataset;
    }

    stylePieDataset(dataset, colors) {
        dataset.backgroundColor = colors.map(color => color + this.chartDefaults.transparency.bar);
        dataset.borderColor = colors.map(color => color + this.chartDefaults.transparency.solid);
        dataset.borderWidth = 1;
        dataset.hoverBackgroundColor = colors.map(color => color + this.chartDefaults.transparency.solid);
        
        return dataset;
    }

    // Merge custom options with defaults
    mergeOptions(customOptions = {}, chartType = null) {
        let options = Chart.helpers.merge({}, this.defaultOptions, customOptions);
        
        // Remove scales for pie/doughnut charts
        if (chartType === 'pie' || chartType === 'doughnut') {
            delete options.scales;
        }
        
        return options;
    }

    // Add chart title styling
    addTitle(options, title) {
        if (!title) return options;
        
        options.plugins = options.plugins || {};
        options.plugins.title = {
            display: true,
            text: title,
            color: this.colors.text,
            font: {
                family: this.chartDefaults.headingFontFamily,
                size: this.chartDefaults.headingFontSize,
                weight: 'bold'
            },
            padding: {
                top: 10,
                bottom: 20
            }
        };
        
        return options;
    }

    // Color utility functions
    lightenColor(color, amount) {
        // Simple lightening - in production you might want a more sophisticated color manipulation library
        return color; // Placeholder - implement actual lightening
    }

    darkenColor(color, amount) {
        // Simple darkening - in production you might want a more sophisticated color manipulation library  
        return color; // Placeholder - implement actual darkening
    }

    adjustSaturation(color, factor) {
        // Adjust color saturation - placeholder for actual implementation
        return color; // Placeholder - implement actual saturation adjustment
    }

    // Configuration presets for common use cases
    getPreset(presetName) {
        const presets = {
            minimal: {
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { grid: { display: false } },
                    y: { grid: { display: false } }
                }
            },
            
            detailed: {
                plugins: {
                    legend: { 
                        display: true,
                        position: 'bottom'
                    }
                },
                scales: {
                    x: { 
                        grid: { display: true },
                        title: { display: true }
                    },
                    y: { 
                        grid: { display: true },
                        title: { display: true }
                    }
                }
            },

            presentation: {
                plugins: {
                    legend: { 
                        display: true,
                        position: 'top'
                    }
                },
                animation: {
                    duration: 1500
                }
            }
        };

        return presets[presetName] || {};
    }

    // Destroy and cleanup
    destroy() {
        // Clean up any event listeners or resources if needed
        this.colors = null;
        this.palette = null;
        this.defaultOptions = null;
    }
}