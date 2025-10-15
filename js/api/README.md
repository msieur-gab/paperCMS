# Intelligent Media Sync API

A reusable, framework-agnostic JavaScript API for synchronizing media content with scroll position based on visibility, scroll velocity, and reading behavior patterns.

## Features

- **Velocity-Adaptive Behavior** - Adapts to different scroll speeds (slow reading, normal scrolling, fast seeking)
- **Predictive Lookahead** - Shows upcoming content during fast scrolling
- **Hysteresis System** - Prevents flickering between similar elements
- **Performance Optimized** - Uses IntersectionObserver and requestAnimationFrame for smooth 60fps
- **Zero Dependencies** - Pure browser APIs, works everywhere
- **Framework Agnostic** - Works with vanilla JS, React, Vue, or any framework
- **Fully Configurable** - Tune all behavior through options
- **TypeScript Ready** - Complete JSDoc annotations

## Quick Start

### 1. Import the API

```javascript
import { createIntelligentMediaSync } from './js/api/intelligentMediaSync.js';
```

### 2. Create a Sync Instance

```javascript
const sync = createIntelligentMediaSync({
    onActiveChange: ({ element, index }) => {
        console.log(`Active element changed to index ${index}`);
        updateYourUI(element);
    }
});
```

### 3. Observe Elements

```javascript
const images = document.querySelectorAll('.article img');
sync.observe(images);
```

### 4. Cleanup When Done

```javascript
sync.disconnect();
```

## Demo

Open `demo.html` in a web browser to see the API in action with:
- Live synchronization visualization
- Interactive controls for tuning behavior
- Real-time debug information
- Example usage patterns

```bash
# Serve the demo locally
python -m http.server 8000
# Then open: http://localhost:8000/js/api/demo.html
```

## API Reference

### `createIntelligentMediaSync(config)`

Creates a new synchronization instance.

**Parameters:**

```typescript
{
    scrollContainer?: HTMLElement,     // Optional scroll container
    options?: {
        emaAlpha?: number,             // Velocity smoothing (0-1, default: 0.25)
        minSwitchInterval?: number,    // Min ms between switches (default: 120)
        slowScrollThreshold?: number,  // Slow scroll velocity (default: 0.02)
        mediumScrollThreshold?: number,// Medium scroll velocity (default: 0.2)
        velocityThreshold?: number,    // Fast scroll velocity (default: 0.4)
        anticipationZone?: number,     // Lookahead distance px (default: 150)
        fastLookaheadMs?: number,      // Lookahead time ms (default: 200)
        significanceThreshold?: number,// Min improvement (0-1, default: 0.15)
        enterThreshold?: number,       // Visibility to enter (0-1, default: 0.4)
        leaveThreshold?: number,       // Visibility to leave (0-1, default: 0.15)
        scrollContainerSelector?: string // CSS selector (default: '.content-scroll')
    },
    onActiveChange?: (payload) => void // Callback when active element changes
}
```

**Returns:**

```typescript
{
    observe: (elements: HTMLElement[] | NodeList) => void,
    disconnect: () => void,
    updateOptions: (options: Object) => void,
    forceUpdate: (element: HTMLElement) => void,
    getCurrentElement: () => HTMLElement | null,
    getCurrentIndex: () => number,
    getElementCount: () => number,
    getState: () => Object,
    getDebugInfo: () => Object
}
```

## Usage Examples

### Basic Usage

```javascript
import { createIntelligentMediaSync } from './js/api/intelligentMediaSync.js';

const sync = createIntelligentMediaSync({
    onActiveChange: ({ element }) => {
        document.getElementById('media-panel').innerHTML = element.innerHTML;
    }
});

const mediaElements = document.querySelectorAll('.media-element');
sync.observe(mediaElements);
```

### With Custom Options

```javascript
const sync = createIntelligentMediaSync({
    options: {
        emaAlpha: 0.3,              // More responsive velocity
        minSwitchInterval: 200,     // Calmer switching
        velocityThreshold: 0.5      // Higher fast scroll threshold
    },
    onActiveChange: ({ element, index }) => {
        console.log(`Switched to element ${index}`);
        updateUI(element);
    }
});
```

### With Explicit Scroll Container

```javascript
const scrollContainer = document.querySelector('.my-custom-scroller');

const sync = createIntelligentMediaSync({
    scrollContainer,
    onActiveChange: ({ element }) => {
        highlightElement(element);
    }
});
```

### Dynamic Option Updates

```javascript
const sync = createIntelligentMediaSync({ /* ... */ });

// Update options on the fly
document.getElementById('smoothness-slider').addEventListener('input', (e) => {
    sync.updateOptions({ emaAlpha: parseFloat(e.target.value) });
});
```

### Querying State

```javascript
// Get current state
const state = sync.getState();
console.log(state.currentIndex);      // -1 if none active
console.log(state.elementCount);      // Total tracked elements
console.log(state.scrollVelocity);    // Current velocity (px/ms)
console.log(state.scrollDirection);   // 'up' or 'down'

// Get active element
const activeElement = sync.getCurrentElement(); // HTMLElement or null

// Get debug info
const debugInfo = sync.getDebugInfo();
console.log(debugInfo.visibleElements); // Array of visible elements
```

### Force Update

```javascript
// Force switch to a specific element
const targetElement = document.querySelector('.specific-media');
sync.forceUpdate(targetElement);
```

## Configuration Guide

### Tuning for Different Use Cases

**Magazine-like Feel (Calm, Deliberate)**
```javascript
{
    emaAlpha: 0.15,              // Very smooth velocity
    minSwitchInterval: 250,      // Long intervals between switches
    significanceThreshold: 0.2   // Higher bar for switching
}
```

**Responsive Dashboard (Quick, Reactive)**
```javascript
{
    emaAlpha: 0.35,              // More responsive velocity
    minSwitchInterval: 80,       // Quick switching
    significanceThreshold: 0.1   // Lower bar for switching
}
```

**Educational Content (Stable, Predictable)**
```javascript
{
    slowScrollThreshold: 0.03,   // Wider slow scroll range
    minSwitchInterval: 150,      // Moderate switching
    enterThreshold: 0.5          // High bar to become active
}
```

## How It Works

### Four Reading Modes

The API recognizes different scroll behaviors and adapts accordingly:

1. **Slow Scroll** (< 0.02 px/ms)
   - Conservative switching
   - Assumes careful reading
   - Keeps media stable

2. **Medium Scroll** (0.02-0.2 px/ms)
   - Progressive switching
   - Respects reading direction
   - Balanced responsiveness

3. **Responsive Scroll** (0.2-0.4 px/ms)
   - More eager switching
   - Prevents missing content
   - Lower thresholds

4. **Fast Scroll** (> 0.4 px/ms)
   - Predictive lookahead
   - Shows what's coming (200ms ahead)
   - Anticipates destination

### Hysteresis System

Prevents "ping-pong" flickering with asymmetric thresholds:

```
Visibility Score
100% ┤         Active Element
     │              │
 40% ┤──────────── ENTER ──────────┐
     │                             │
 15% ┤──────────── LEAVE ──────────┤
     │                             │
  0% ┤─────────────────────────────┘

Rule: Need 40% to become active, stay active until below 15%
```

### Performance Architecture

- **IntersectionObserver**: Hardware-accelerated visibility tracking (21 threshold levels)
- **ResizeObserver**: Automatic layout change detection
- **requestAnimationFrame**: 60fps updates synced to browser paint cycle
- **Batched Measurements**: All DOM reads happen together (no layout thrashing)
- **EMA Smoothing**: Noise-free velocity tracking

## Browser Support

- Chrome 51+
- Firefox 55+
- Safari 12.1+
- Edge 79+

Requires: `IntersectionObserver`, `ResizeObserver`, `requestAnimationFrame`

## Integration Examples

### React

```jsx
import { useEffect, useRef } from 'react';
import { createIntelligentMediaSync } from './js/api/intelligentMediaSync.js';

function Article() {
    const syncRef = useRef(null);
    const [activeMedia, setActiveMedia] = useState(null);

    useEffect(() => {
        syncRef.current = createIntelligentMediaSync({
            onActiveChange: ({ element }) => {
                setActiveMedia(element.dataset.mediaId);
            }
        });

        const elements = document.querySelectorAll('.media-element');
        syncRef.current.observe(elements);

        return () => syncRef.current.disconnect();
    }, []);

    return (
        <div>
            <div className="content-scroll">
                {/* Your content */}
            </div>
            <MediaPanel activeId={activeMedia} />
        </div>
    );
}
```

### Vue

```vue
<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { createIntelligentMediaSync } from './js/api/intelligentMediaSync.js';

const activeMediaId = ref(null);
let sync = null;

onMounted(() => {
    sync = createIntelligentMediaSync({
        onActiveChange: ({ element }) => {
            activeMediaId.value = element.dataset.mediaId;
        }
    });

    const elements = document.querySelectorAll('.media-element');
    sync.observe(elements);
});

onUnmounted(() => {
    sync?.disconnect();
});
</script>

<template>
    <div>
        <div class="content-scroll">
            <!-- Your content -->
        </div>
        <MediaPanel :active-id="activeMediaId" />
    </div>
</template>
```

### Vanilla JavaScript

```javascript
// Simple setup
import { createIntelligentMediaSync } from './js/api/intelligentMediaSync.js';

const mediaPanel = document.getElementById('media-panel');
const sync = createIntelligentMediaSync({
    onActiveChange: ({ element }) => {
        mediaPanel.innerHTML = element.innerHTML;
        mediaPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
});

const images = document.querySelectorAll('article img');
sync.observe(images);
```

## Architecture

```
┌─────────────────────────────────────────┐
│  createIntelligentMediaSync (Factory)   │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  IntelligentMediaSyncCore (Private)     │
├─────────────────────────────────────────┤
│  • Velocity tracking (EMA)              │
│  • IntersectionObserver                 │
│  • ResizeObserver                       │
│  • requestAnimationFrame                │
│  • 4-mode selection logic               │
│  • Hysteresis system                    │
└─────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Public API Methods                     │
├─────────────────────────────────────────┤
│  observe()                              │
│  disconnect()                           │
│  updateOptions()                        │
│  getCurrentElement()                    │
│  getState()                             │
│  getDebugInfo()                         │
└─────────────────────────────────────────┘
```

## Contributing

This API is part of the [PaperCMS](https://github.com/yourusername/paperCMS) project.

## License

MIT License - See LICENSE file for details

## Related Reading

- [Human-Centered Design Article](../../intelligent-media-sync-human-centered.md) - The design philosophy behind this API
- [Technical Deep Dive](../../intelligent-media-sync-article.md) - Implementation details and architecture

---

**Questions?** Open an issue or check the demo for interactive examples.
