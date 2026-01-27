---
title: Scroll Sync
description: "A meditation on synchronized storytelling — where text and image move as one, and complexity dissolves into intuition."
date:
    published: 2025-01-27
    updated: 2025-01-27
thumbnail: /content/media/scroll-sync-hero.jpg
status: published
category: project
subcategories:
    - design-systems
    - web-components
tags:
    - scroll-sync
    - storytelling
    - accessibility
    - web-components
    - interaction-design
project:
    status: completed
    timeline:
        start: 2025-01
        end: 2025-01
    client: Personal Project
---

# Scroll Sync: When Less Becomes More

![Synchronized reading experience](media/scroll-sync-hero.jpg "cover")

> "Perfection is achieved, not when there is nothing more to add, but when there is nothing left to take away."
> — Antoine de Saint-Exupéry

There is a particular kind of satisfaction in removing things. Not the hollow minimalism of bare walls and empty rooms, but the deliberate stripping away of noise until only essence remains. This project began with a question that seemed almost too simple: *how might text and image move together?*

The answer, it turns out, required understanding not screens or code, but people — how we sit, how we read, how our eyes trace patterns across light.

## The Disconnect We Accept

Open any long-form article on a desktop browser. The text flows downward. Images interrupt, demanding you stop, observe, then resume. Or worse — they float in sidebars, disconnected observers to the narrative they should be illuminating.

![Traditional article layout with disconnected media](media/traditional-layout.jpg)

We have accepted this friction as inherent to the medium. We scroll past images before finishing the paragraph that references them. We lose context. We lose the thread.

On mobile, paradoxically, this works. The constrained viewport forces a linear experience — text, then image, then text. You cannot look away because there is nowhere else to look. The limitation becomes a strength.

But on larger screens? All that space, and we use it to push things apart rather than bring them together.

## Reading Is Physical

Before writing any code, I sat with a simple observation: *where do my eyes rest when I read?*

Not at the center of the screen. Not at the bottom. Somewhere in the upper third — that comfortable zone where neck stays neutral, where the angle of light from screen to eye feels least strained. Below that zone, we scroll. We bring content up to meet our gaze rather than chase it downward.

![Reading zone visualization](media/reading-zone.jpg)

This is biomechanics, not preference. Decades of muscle memory from books held at chest height, from newspapers folded on tables, from phones cradled in palms. The screen inherited these patterns whether it intended to or not.

And direction matters. Scrolling down — reading forward — feels like progression. The eyes anticipate what rises to meet them. Scrolling up — reviewing, searching — requires more attention. The mental model shifts from consumption to retrieval.

> The best interface is one that respects what the body already knows.

Any synchronization system that ignores these rhythms will feel slightly wrong, even if the user cannot articulate why.

## The Principle of Single Truth

The first technical decision was also the most important: media lives in one place.

In the markup, each image, each blockquote, each code block exists exactly where the author placed it — inline with the text that gives it meaning. On smaller screens, it renders there. On larger screens, the same element *appears* in a dedicated media container, synchronized to scroll position.

Not duplicated. Not recreated. Moved, or rather, *projected*.

```html
<article>
  <p>The kanawa tsugi demonstrates this philosophy...</p>
  
  <figure data-media>
    <img src="joint-detail.jpg" alt="Kanawa tsugi joint">
    <figcaption>Interlocking geometry</figcaption>
  </figure>
  
  <p>Two beams interlock through complex shoulders...</p>
</article>
```

The `data-media` attribute is a marker, nothing more. It says: *this element participates in the synchronization*. It makes no assumptions about what lives inside — an image today, a video tomorrow, a live data visualization next year.

This is the semantic web as it was meant to be: meaningful structure that machines can enhance without dictating.

## Direction-Aware Presence

The core algorithm fits in a sentence: *show the last media element that has scrolled past the reading zone*.

But "reading zone" is not a fixed line. When scrolling down, it sits higher — around 30% from the top of viewport. We are reading forward; we want media to appear as we approach its context, not after we have passed it.

When scrolling up, the zone drops lower — closer to 45%. We are reviewing; we need to scroll further before the previous media reasserts itself.

![Direction-aware trigger zones](media/trigger-zones.jpg)

This asymmetry is invisible to the user. They simply feel that images appear at the right moment, that the experience flows. The fifteen percent difference between up and down creates a subtle hysteresis — a resistance to rapid flickering when scrolling hesitates at a boundary.

Small decisions. Large impact.

## The Edges Are Where Systems Break

Scroll to the very beginning of an article. What should the media container show? The first image, even if it has not yet "triggered"? An empty state? A loading placeholder?

Scroll to the very end. The last image sits high in the document, but you have reached the bottom. The reading zone has passed it, but there is nothing more to show. Does the container go blank?

These edge cases reveal character. Our solution: the first media appears immediately. The last media persists once the scroll progress exceeds 95%. Bookends that feel intentional rather than accidental.

> Handle the edges gracefully, and the middle takes care of itself.

And what of images placed in rapid succession? Two figures with only a sentence between them? The algorithm does not panic. It evaluates continuously, selecting the most recently passed anchor. Fast scrolling resolves cleanly because the system never tries to "catch up" — it simply reports current state.

## Layout as Dialogue

The visual relationship between text and media is a conversation. Sometimes text dominates — long passages of reasoning that need space to breathe. Sometimes media carries the weight — a photograph that says more than description ever could.

The `split` property emerged from this understanding. Not a rigid 50/50 division, but a ratio: `3:2` gives text room to stretch, `1:2` lets media command attention.

```html
<scroll-sync split="3:2" media-position="right">
```

The notation mirrors aspect ratios in photography, grid systems in typography. Designers already think this way. The code simply speaks their language.

And position matters. Media on the right feels like annotation — supporting material. Media on the left feels like evidence — here is the thing, now let me explain it. Neither is correct universally. Both are correct contextually.

## Stability Under Change

Accessibility is not an afterthought bolted onto finished work. It is a design constraint that, properly embraced, makes everything better.

Font size must scale. This is non-negotiable. But what happens to layout when text grows larger?

Early iterations used `rem` units for padding and gaps — the common practice. When font size increased, padding increased proportionally. The media container shrank. The relationship between text and image shifted in ways that felt broken even if they were technically "responsive."

The fix required distinguishing between two types of measurement:

- **Structural dimensions** (padding, gaps, positioning): fixed in pixels. These define the frame.
- **Typographic dimensions** (font size, line height): relative to root. These adapt to user preference.

The frame stays stable. The content within adapts. Text reflows, line counts change, scroll height changes — but the media container holds its ground.

![Stable layout under font scaling](media/font-scaling.jpg)

This is the difference between *responsive* and *unstable*. Responsive means adapting intentionally. Unstable means breaking under pressure.

## The Legibility Trade

Traditional typography wisdom suggests 45-75 characters per line for optimal readability. The `ch` unit in CSS makes this easy: `max-width: 65ch`.

But `ch` is font-relative. Change the font size, and the container width changes. The careful ratio you established between text column and media column dissolves.

We faced a choice: enforce strict character counts and accept layout instability, or use fixed widths and accept variable line lengths.

We chose stability.

> No one reads text below 14px on large screens anyway.

The practical reality is that users who need larger text will increase it. Users who prefer smaller text are already comfortable with longer lines. The theoretical optimum of 65 characters matters less than the lived experience of a layout that holds together.

What remains is ensuring text stays scannable through other means — clear hierarchy, adequate spacing, visual rhythm. Typography is a system, not a single measurement.

## Sticky Headers, Shifting Zones

Some layouts pin section headers to the top of the viewport as you scroll. This aids navigation in long documents but introduces a complication: if an `<h1>` occupies 48 pixels at the top of the screen, the *effective* reading zone shifts down by 48 pixels.

The component accounts for this. Pass `sticky-headers="h1,h2"` and it measures those elements, adjusting its calculations accordingly.

```html
<scroll-sync sticky-headers="h1,h2" zone-down="0.30">
```

This is the kind of detail that separates tools from toys. In isolation, it seems trivial. In practice, it means the component works correctly in real-world layouts without manual calibration.

## Events Over Imperatives

The component does not know what lives inside your media elements. An image requires no special handling — clone the HTML, and it displays. But a chart built with JavaScript? A video with playback state? An interactive visualization?

These cannot simply be cloned. They need initialization, state management, cleanup.

Rather than building special handling for every possible media type, the component emits an event:

```javascript
scrollSync.addEventListener('media-change', (e) => {
  const { element, index, isFirst, isLast } = e.detail;
  
  if (element.matches('.chart-block')) {
    initializeChart(element);
  }
});
```

The component announces what happened. The application decides what to do about it. Separation of concerns preserved. Future media types supported without modifying the core.

## Code as Raw Material

There is a tendency to view design and development as separate disciplines — the designer creates vision, the developer implements constraint. But code is not constraint. Code is material.

Wood has grain. Stone has weight. Code has logic, reactivity, state. The designer who understands their material shapes it directly, rather than describing shapes for others to approximate.

> This component exists because I wanted to feel how text and image could breathe together — and the only way to feel it was to build it.

Every property, every default value, every edge case emerged from interaction. Not from specification documents, but from scrolling, adjusting, scrolling again. Does this feel right? Does the image appear too early? Too late? Does the layout hold when I push it?

The final artifact is not a deliverable. It is a crystallization of countless small judgments, made possible only by working in the material itself.

## What Remains

Strip away the configuration options. Ignore the technical implementation. What is this, really?

A way for story and evidence to move as one.

A respect for how bodies actually engage with screens.

A frame stable enough to hold changing content.

A system simple enough to understand, flexible enough to adapt.

![The essence of scroll-sync](media/scroll-sync-essence.jpg)

The best tools disappear. They do not demand attention; they enable intention. Someone reads an article built with this component and never thinks about synchronization. They simply feel that the images were there when needed, that the experience flowed, that reading was — for a moment — frictionless.

That invisibility is the goal. Not to be noticed, but to be *felt*.

> When there is nothing left to remove, what remains is not emptiness. It is essence.
