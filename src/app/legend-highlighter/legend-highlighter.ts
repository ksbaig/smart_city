import MapView from "@arcgis/core/views/MapView";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";
import Geometry from "@arcgis/core/geometry/Geometry";

interface LegendHighlighterOptions {
  view: MapView;
  featureLayer: FeatureLayer; // layer to query for matching features
  fieldName: string; // attribute field to match legend label
  legendHost: HTMLElement; // DOM element that contains the legend
  highlightOpacity?: number; // 0..1, default 0.45
}

/**
 * LegendHighlighter
 * - Attaches click handlers to a legend container
 * - Extracts only the clicked legend label robustly
 * - Queries the provided FeatureLayer for matching features (fieldName = label)
 * - Draws results in a GraphicsLayer using the clicked swatch color
 * - Zooms the view to the matched features extent
 *
 * Usage: see README in same folder for a short example.
 */
export class LegendHighlighter {
  private view: MapView;
  private layer: FeatureLayer;
  private fieldName: string;
  private legendHost: HTMLElement;
  private highlightOpacity: number;
  private graphicsLayer: GraphicsLayer;
  private boundClick: (ev: MouseEvent) => void;

  constructor(opts: LegendHighlighterOptions) {
    this.view = opts.view;
    this.layer = opts.featureLayer;
    this.fieldName = opts.fieldName;
    this.legendHost = opts.legendHost;
    this.highlightOpacity = opts.highlightOpacity ?? 0.45;

    this.graphicsLayer = new GraphicsLayer({ id: "legend-highlight-layer" });
    // ensure the graphics layer is on the map
    try {
      const map = this.view.map;
      if (map && !map.findLayerById(this.graphicsLayer.id)) {
        map.add(this.graphicsLayer);
      }
    } catch (e) {
      console.warn("LegendHighlighter: could not add graphics layer to map", e);
    }

    this.boundClick = this.onLegendClick.bind(this);
    this.legendHost.addEventListener("click", this.boundClick, { capture: false });
  }

  destroy(): void {
    this.legendHost.removeEventListener("click", this.boundClick);
    try {
      const map = this.view.map;
      if (map) {
        map.remove(this.graphicsLayer);
      }
    } catch {}
  }

  private async onLegendClick(ev: MouseEvent): Promise<void> {
    const target = ev.target as HTMLElement | null;
    if (!target) return;

    // Find the closest legend item container (try common ArcGIS classes, fall back to nearest element)
    const item = target.closest(".esri-legend__layer-row, .esri-legend__layer, .legend-item, li, div") as HTMLElement | null;
    if (!item) return;

    const label = this.extractLegendLabelFromElement(item);
    if (!label) return;

    const swatchColor = this.extractSwatchColorFromElement(item) || "rgba(255,0,0,1)";

    await this.queryAndHighlight(label, swatchColor);
  }

  private extractLegendLabelFromElement(el: HTMLElement): string | null {
    // Prefer the nearest legend "row" element (ArcGIS uses esri-legend__layer-row)
    const row = (el.closest(".esri-legend__layer-row") || el.closest(".esri-legend__layer") || el) as HTMLElement;

    // Try specific label selectors within that row
    const selectors = [
      ".esri-legend__layer-row__label",
      ".esri-legend__layer-caption",
      ".legend-label",
      "label",
      ".text"
    ];
    for (const s of selectors) {
      const found = row.querySelector(s);
      if (found) {
        const txt = (found.textContent || "").trim();
        if (txt) return txt;
      }
    }

    // If no dedicated label element found, prefer the shortest direct child's text
    let best: string | null = null;
    for (const child of Array.from(row.children)) {
      const txt = (child.textContent || "").trim();
      if (!txt) continue;
      if (best === null || txt.length < best.length) best = txt;
    }
    if (best) return best;

    // Last resort: split the row's full text by newline and choose the shortest line
    const all = (row.textContent || "").split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    if (all.length === 0) return null;
    all.sort((a, b) => a.length - b.length);
    return all[0];
  }

  private extractSwatchColorFromElement(el: HTMLElement): string | null {
    // Look for an inline-style background-color on a swatch element or an <svg> fill
    const swatchSelectors = [".esri-legend__layer-row__swatch", ".swatch", ".legend-swatch", "svg", "path"];
    for (const s of swatchSelectors) {
      const node = el.querySelector(s) as HTMLElement | SVGElement | null;
      if (!node) continue;
      // SVG path fill
      if (node instanceof SVGElement) {
        try {
          const fill = (node as any).getAttribute ? (node as any).getAttribute("fill") : null;
          if (fill) return fill;
        } catch {}
      }
      const style = (node as HTMLElement).style;
      if (style && style.backgroundColor) return style.backgroundColor;
      // check computed style
      const cs = window.getComputedStyle(node as Element);
      if (cs && cs.backgroundColor && cs.backgroundColor !== "rgba(0, 0, 0, 0)") return cs.backgroundColor;
    }
    return null;
  }

  private cssColorToRgbaArray(css: string): [number, number, number, number] {
    // Accept formats like rgb(), rgba(), #rrggbb, #rgb
    css = css.trim();
    if (css.startsWith("rgba")) {
      const m = css.match(/rgba\(([^)]+)\)/);
      if (m) {
        const parts = m[1].split(",").map(p => p.trim());
        return [parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]), parseFloat(parts[3])];
      }
    }
    if (css.startsWith("rgb")) {
      const m = css.match(/rgb\(([^)]+)\)/);
      if (m) {
        const parts = m[1].split(",").map(p => p.trim());
        return [parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]), 1];
      }
    }
    if (css.startsWith("#")) {
      let hex = css.slice(1);
      if (hex.length === 3) hex = hex.split("").map(h => h + h).join("");
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return [r, g, b, 1];
    }
    // fallback
    return [255, 0, 0, 1];
  }

  private async queryAndHighlight(label: string, swatchCssColor: string): Promise<void> {
    try {
      // build a safer WHERE clause using LIKE on UPPER(field) with escaped single-quotes
      const safe = (label || "").trim().replace(/'/g, "''");
      const upperSafe = safe.toUpperCase();
      const where = `UPPER(${this.fieldName}) LIKE '%${upperSafe}%'`;

      // debug
      // console.debug('[LegendHighlighter] WHERE', where);

      const result = await this.layer.queryFeatures({ where, returnGeometry: true, outFields: ["*"] });
      if (!result || !result.features || result.features.length === 0) {
        console.info("LegendHighlighter: no features matching", label);
        this.graphicsLayer.removeAll();
        return;
      }

      const rgba = this.cssColorToRgbaArray(swatchCssColor);
      const sym = {
        type: "simple-fill",
        color: [rgba[0], rgba[1], rgba[2], this.highlightOpacity],
        outline: { color: [rgba[0], rgba[1], rgba[2], 1], width: 1 }
      } as any;

      const graphics: Graphic[] = result.features.map(f => {
        return new Graphic({ geometry: f.geometry as Geometry, symbol: sym, attributes: f.attributes });
      });

      this.graphicsLayer.removeAll();
      this.graphicsLayer.addMany(graphics);

      // compute extent
      let extent = (result.features[0].geometry as any).extent;
      for (const feat of result.features) {
        const e = (feat.geometry as any).extent;
        if (!e) continue;
        if (!extent) extent = e;
        else extent = extent.union ? extent.union(e) : extent;
      }

      if (extent) {
        // zoom with a small padding
        await this.view.goTo(extent.expand ? extent.expand(1.25) : extent, { duration: 600 });
      }
    } catch (err) {
      console.error("LegendHighlighter: query/zoom failed", err);
    }
  }
}

export default LegendHighlighter;
