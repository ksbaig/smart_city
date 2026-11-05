LegendHighlighter
==================

Standalone helper to wire legend clicks to map highlights.

Usage
-----
1. Import and initialize from any component after the map and layer are ready.

Example (inside an Angular component after map and layer ready):

```ts
import LegendHighlighter from './legend-highlighter/legend-highlighter';

// assume `mapView` is your ArcGIS MapView, `landuseLayer` is a FeatureLayer instance
// and the DOM legend container is available at #legend-host
const legendHost = document.getElementById('legend-host');
if (legendHost && mapView && landuseLayer) {
  const highlighter = new LegendHighlighter({
    view: mapView,
    featureLayer: landuseLayer,
    fieldName: 'Landuse (English)', // change to the attribute field that matches legend labels
    legendHost,
    highlightOpacity: 0.5,
  });

  // keep reference if you want to destroy later:
  // highlighter.destroy();
}
```

Notes
-----
- The module extracts the clicked label robustly (prefers known label selectors, falls back to shortest child text, then shortest text line).
- It attempts to read the legend swatch color from inline styles or SVG fill and uses that to color the highlight graphics.
- The component performs a FeatureLayer `queryFeatures` using an exact equality `WHERE` clause — ensure the field and label text match exactly (or extend the module to use `LIKE` / normalization if needed).

Integration
-----------
- This is intentionally standalone and does not modify existing application files. Drop it into your project and instantiate when the map and legend DOM are available.

