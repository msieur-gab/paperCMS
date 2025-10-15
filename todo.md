Findings

  - High: js/services/contentService.js:65 – the hand-rolled YAML parser flattens nested structures. In files like content/kanawa.md, contributors becomes
    ['role: author', …] and date collapses into stray top-level keys. The SPA then falls back to default author/avatar/date in updateProjectHeaderMetadata,
    so every project shows the wrong byline and SEO metadata.
  - High: js/services/contentService.js:285 – chart configs are embedded in a single-quoted attribute. Any apostrophe in a chart title/label produces <figure
    … data-chart-config='{"title":"Gabriel's Update"}'>, which terminates the attribute early. ChartService’s subsequent JSON.parse throws and the chart
    never renders.
  - High: js/services/contentService.js:185 – the playback-rate helper runs document.currentScript.previousElementSibling.querySelector('video'). The
    previous sibling is already the <video> element, so the querySelector returns null; setting playbackRate then throws and project rendering stops whenever
    a markdown video uses 0.5x, 2x, etc.
  - Medium: js/ui/intelligentMediaSync.js:76 & js/ui/intelligentMediaSync.js:361 – each observe() wires a new scroll listener on .content-scroll,
    but disconnect() never removes it. Opening multiple projects stacks listeners, causing duplicate updateMedia calls and progressively worse scroll
    performance.