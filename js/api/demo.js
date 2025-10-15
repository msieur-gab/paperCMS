/**
 * Intelligent Media Sync API Demo
 *
 * This demo shows how to use the createIntelligentMediaSync API
 * to synchronize media content with scroll position.
 */

import { createIntelligentMediaSync } from './intelligentMediaSync.js';

// Media data for the demo
const mediaData = {
    '1': {
        title: 'Visibility Tracking',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        description: 'Using IntersectionObserver with 21 threshold levels for precise visibility tracking.'
    },
    '2': {
        title: 'Velocity Adaptation',
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        description: 'EMA smoothing filters noise for natural velocity tracking across different scroll speeds.'
    },
    '3': {
        title: 'Hysteresis System',
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        description: 'Asymmetric thresholds (40% enter / 15% leave) prevent flickering between similar elements.'
    },
    '4': {
        title: 'Performance',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        description: 'requestAnimationFrame + batched measurements deliver smooth 60fps synchronization.'
    },
    '5': {
        title: 'Configuration',
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        description: 'All behavior is configurable through options - tune it for your specific use case.'
    },
    '6': {
        title: 'Applications',
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        description: 'Perfect for articles, documentation, education, data journalism, and photo essays.'
    },
    '7': {
        title: 'Summary',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        description: 'Velocity-adaptive, hysteresis-based sync reduces cognitive load and enhances comprehension.'
    }
};

// Get DOM elements
const mediaPanel = document.getElementById('media-panel');
const mediaPreview = document.getElementById('media-preview');
const mediaDescription = document.getElementById('media-description');
const debugIndex = document.getElementById('debug-index');
const debugVelocity = document.getElementById('debug-velocity');
const debugDirection = document.getElementById('debug-direction');
const debugVisible = document.getElementById('debug-visible');

// Get control elements
const emaAlphaInput = document.getElementById('ema-alpha');
const emaValueDisplay = document.getElementById('ema-value');
const minIntervalInput = document.getElementById('min-interval');
const intervalValueDisplay = document.getElementById('interval-value');
const velocityThresholdInput = document.getElementById('velocity-threshold');
const thresholdValueDisplay = document.getElementById('threshold-value');

// Update media panel UI
function updateMediaPanel(element) {
    const mediaId = element.getAttribute('data-media-id');
    const data = mediaData[mediaId];

    if (!data) return;

    // Update preview
    mediaPreview.textContent = data.title;
    mediaPreview.style.background = data.gradient;

    // Update description
    mediaDescription.textContent = data.description;

    // Add active animation
    mediaPanel.classList.add('active');
    setTimeout(() => mediaPanel.classList.remove('active'), 300);
}

// Update debug panel
function updateDebugPanel(sync) {
    const state = sync.getState();
    const debugInfo = sync.getDebugInfo();

    debugIndex.textContent = state.currentIndex;
    debugVelocity.textContent = state.scrollVelocity.toFixed(4);
    debugDirection.textContent = state.scrollDirection;
    debugVisible.textContent = debugInfo.visibleElements.length;
}

// Create the sync instance
const sync = createIntelligentMediaSync({
    scrollContainer: document.querySelector('.content-scroll'),
    options: {
        emaAlpha: 0.25,
        minSwitchInterval: 120,
        velocityThreshold: 0.4
    },
    onActiveChange: ({ element }) => {
        updateMediaPanel(element);
    }
});

// Get all media elements
const mediaElements = document.querySelectorAll('.media-element');

// Start observing
sync.observe(mediaElements);

// Set up debug panel update interval
setInterval(() => {
    updateDebugPanel(sync);
}, 100);

// Wire up controls to dynamically update options
emaAlphaInput.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    emaValueDisplay.textContent = value.toFixed(2);
    sync.updateOptions({ emaAlpha: value });
});

minIntervalInput.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    intervalValueDisplay.textContent = value;
    sync.updateOptions({ minSwitchInterval: value });
});

velocityThresholdInput.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    thresholdValueDisplay.textContent = value.toFixed(1);
    sync.updateOptions({ velocityThreshold: value });
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    sync.disconnect();
});

// Log API methods for exploration
console.log('🎯 Intelligent Media Sync Demo');
console.log('Available API methods:', Object.keys(sync));
console.log('Try these in the console:');
console.log('  sync.getState() - Get current state');
console.log('  sync.getDebugInfo() - Get detailed debug info');
console.log('  sync.getCurrentElement() - Get active element');
console.log('  sync.getCurrentIndex() - Get active index');
console.log('  sync.getElementCount() - Get total elements');
console.log('  sync.updateOptions({ emaAlpha: 0.5 }) - Update options');
console.log('  sync.forceUpdate(element) - Force switch to element');

// Make sync available globally for console experimentation
window.sync = sync;
