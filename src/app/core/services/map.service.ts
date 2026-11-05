import { Injectable } from "@angular/core";
import Graphic from "@arcgis/core/Graphic";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Point from "@arcgis/core/geometry/Point";
import Polygon from "@arcgis/core/geometry/Polygon";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol";
import TextSymbol from "@arcgis/core/symbols/TextSymbol";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import WebMap from "@arcgis/core/WebMap";
import WebScene from "@arcgis/core/WebScene";
import EsriMap from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import SceneView from "@arcgis/core/views/SceneView";
import { BehaviorSubject } from "rxjs";
import { MapConfig, Parcel } from "../../shared/models/parcel.model";

const MASTERPLAN_URL = new URL("geojson/PBMasterplan2026.geojson", document.baseURI).toString();
const MASTERPLAN_PLOT_FIELD = "Master Plan Plot No";

const MASTERPLAN_2018_URL = "data/Master_Plan_2018.json";
const MASTERPLAN_2018_PLOT_FIELD = "Parcel No";

interface MasterplanFeature {
  type: "Feature";
  properties: Record<string, unknown>;
  geometry: { type: "Polygon" | "MultiPolygon"; coordinates: number[][][] | number[][][][] };
}

@Injectable({ providedIn: "root" })
export class MapService {
  private view?: MapView;
  private webMap?: WebMap;
  private sceneView?: SceneView;
  private webScene?: WebScene;
  private sceneInitPromise?: Promise<void>;
  private mapConfig?: MapConfig;
  private parcelLayer?: FeatureLayer;
  private highlightLayer?: GraphicsLayer;
  private sceneHighlightLayer?: GraphicsLayer;
  private labelsLayer?: GraphicsLayer;

  private labelMode: "current" | "all" = "current";
  private currentSelectedPolygon?: Polygon;
  private currentSelectedLabel?: string;
  private extentWatchHandle?: { remove: () => void };
  private extentDebounceTimer?: ReturnType<typeof setTimeout>;

  private krokiView?: MapView;
  private krokiMap?: EsriMap;
  private krokiHighlightLayer?: GraphicsLayer;

  private masterplanFeatures: MasterplanFeature[] = [];
  private masterplanLoadPromise?: Promise<void>;

  private masterplan2018Features: MasterplanFeature[] = [];
  private masterplan2018LoadPromise?: Promise<void>;

  private readonly selectedParcelSubject = new BehaviorSubject<Parcel | null>(null);
  readonly selectedParcel$ = this.selectedParcelSubject.asObservable();

  async initializeMap(container: HTMLDivElement, config: MapConfig): Promise<void> {
    this.mapConfig = config;
    this.webMap = new WebMap({
      portalItem: {
        id: config.webMapId,
        portal: {
          url: config.portalUrl,
        },
      },
    });

    this.view = new MapView({
      container,
      map: this.webMap,
      center: config.center,
      zoom: config.zoom,
      popupEnabled: false,
      ui: { components: [] },
    });

    await this.view.when();
    this.parcelLayer = await this.resolveParcelLayer();
    this.highlightLayer = new GraphicsLayer({ title: "Selected Plot" });
    this.webMap.add(this.highlightLayer);
    this.labelsLayer = new GraphicsLayer({ title: "Plot Labels" });
    this.webMap.add(this.labelsLayer);
    this.bindClickSelection();
    // Pre-load masterplan plots in the background.
    this.ensureMasterplanLoaded().catch((err) =>
      console.error("Failed to load masterplan plots", err)
    );
  }

  /**
   * Search a masterplan GeoJSON dataset by its plot-number field.
   * @param term  Search string (substring, case-insensitive)
   * @param dataset  '2026' (default) = PbMasterplan2026, '2018' = Master_Plan_2018
   */
  async searchMasterplanPlots(term: string, dataset: '2026' | '2018' = '2026'): Promise<Parcel[]> {
    const q = term.trim().toUpperCase();
    if (!q) {
      return [];
    }

    const is2018 = dataset === '2018';
    if (is2018) {
      await this.ensureMasterplan2018Loaded();
    } else {
      await this.ensureMasterplanLoaded();
    }
    const features = is2018 ? this.masterplan2018Features : this.masterplanFeatures;
    const plotField = is2018 ? MASTERPLAN_2018_PLOT_FIELD : MASTERPLAN_PLOT_FIELD;

    const matches: Parcel[] = [];
    for (const feat of features) {
      const plotNo = feat.properties?.[plotField];
      if (plotNo == null) {
        continue;
      }
      if (String(plotNo).toUpperCase().includes(q)) {
        matches.push(this.masterplanFeatureToParcel(feat, plotField, dataset));
        if (matches.length >= 25) {
          break;
        }
      }
    }
    return matches;
  }

  /**
   * Zoom to a masterplan parcel polygon and highlight it on the map.
   */
  async zoomToMasterplanParcel(parcel: Parcel): Promise<void> {
    if (!this.view || !parcel.geometry) {
      return;
    }
    const geom = parcel.geometry as { type: string; coordinates: unknown };
    let rings: number[][][] = [];
    if (geom.type === "Polygon") {
      rings = geom.coordinates as number[][][];
    } else if (geom.type === "MultiPolygon") {
      rings = (geom.coordinates as number[][][][]).flat();
    } else {
      return;
    }

    const polygon = new Polygon({
      rings,
      spatialReference: { wkid: 4326 },
    });

    if (!this.highlightLayer) {
      this.highlightLayer = new GraphicsLayer({ title: "Selected Plot" });
      if (this.webMap) {
        this.webMap.add(this.highlightLayer);
      }
    }
    this.highlightLayer.removeAll();
    this.highlightLayer.add(
      new Graphic({
        geometry: polygon,
        symbol: this.createParcelHighlightSymbol(parcel, 0.35),
      })
    );

    const target = polygon.extent ? polygon.extent.clone().expand(1.6) : polygon;
    try {
      await this.view.goTo(target, { animate: true });
    } catch (err) {
      console.warn("goTo failed", err);
    }
    this.currentSelectedPolygon = polygon;
    this.currentSelectedLabel = parcel.displayName || parcel.id;
    this.applyLabelsForCurrentMode();
    this.selectedParcelSubject.next(parcel);
  }

  private async ensureMasterplanLoaded(): Promise<void> {
    if (this.masterplanFeatures.length) {
      return;
    }
    if (!this.masterplanLoadPromise) {
      this.masterplanLoadPromise = (async () => {
        const res = await fetch(MASTERPLAN_URL);
        if (!res.ok) {
          throw new Error(`Failed to load ${MASTERPLAN_URL}: ${res.status}`);
        }
        const json = (await res.json()) as { features?: MasterplanFeature[] };
        this.masterplanFeatures = json.features ?? [];
      })();
    }
    await this.masterplanLoadPromise;
  }

  private async ensureMasterplan2018Loaded(): Promise<void> {
    if (this.masterplan2018Features.length) {
      return;
    }
    if (!this.masterplan2018LoadPromise) {
      this.masterplan2018LoadPromise = (async () => {
        const res = await fetch(MASTERPLAN_2018_URL);
        if (!res.ok) {
          throw new Error(`Failed to load ${MASTERPLAN_2018_URL}: ${res.status}`);
        }
        const json = (await res.json()) as { features?: MasterplanFeature[] };
        this.masterplan2018Features = json.features ?? [];
      })();
    }
    await this.masterplan2018LoadPromise;
  }

  private masterplanFeatureToParcel(
    feat: MasterplanFeature,
    plotField = MASTERPLAN_PLOT_FIELD,
    dataset: '2026' | '2018' = '2026'
  ): Parcel {
    const props = feat.properties ?? {};
    const plotNo = String(props[plotField] ?? "").trim();
    const objectId = Number(props["OBJECTID"] ?? props["ObjectID"] ?? 0);
    return {
      id: plotNo || `plot-${objectId}`,
      objectId,
      displayName: plotNo || `Plot ${objectId}`,
      attributes: props,
      geometry: feat.geometry,
      sourceDataset: dataset,
    };
  }

  async searchParcels(term: string): Promise<Parcel[]> {
    if (!this.parcelLayer || !term.trim()) {
      return [];
    }

    await this.parcelLayer.load();
    const nameField = this.getSearchField(this.parcelLayer);
    const safe = term.trim().replace(/'/g, "''").toUpperCase();

    const query = this.parcelLayer.createQuery();
    query.where = `UPPER(${nameField}) LIKE '%${safe}%'`;
    query.outFields = ["*"];
    query.returnGeometry = true;
    query.num = 15;

    const result = await this.parcelLayer.queryFeatures(query);
    return result.features.map((feature) => this.graphicToParcel(feature));
  }

  async selectParcelByObjectId(objectId: number): Promise<void> {
    if (!this.parcelLayer || !this.view) {
      return;
    }

    const query = this.parcelLayer.createQuery();
    query.where = `OBJECTID = ${objectId}`;
    query.outFields = ["*"];
    query.returnGeometry = true;
    query.num = 1;

    const result = await this.parcelLayer.queryFeatures(query);
    const feature = result.features[0];
    if (!feature) {
      return;
    }

    if (feature.geometry) {
      try {
        await this.view.goTo({ target: feature.geometry, zoom: 17 } as any, { animate: true });
      } catch (err) {
        console.warn("goTo failed", err);
      }
    }
    this.selectedParcelSubject.next(this.graphicToParcel(feature));
  }

  clearHighlight(): void {
    this.highlightLayer?.removeAll();
    this.sceneHighlightLayer?.removeAll();
    this.krokiHighlightLayer?.removeAll();
    this.labelsLayer?.removeAll();
    // Also clear any graphics drawn directly on the MapView or SceneView.
    this.view?.graphics.removeAll();
    this.sceneView?.graphics.removeAll();
    this.currentSelectedPolygon = undefined;
    this.currentSelectedLabel = undefined;
    this.stopExtentWatcher();
    this.labelMode = "current";
    this.selectedParcelSubject.next(null);
  }

  async takeMapScreenshot(width = 1600, height = 900): Promise<string> {
    if (!this.view) {
      throw new Error("Map view is not ready.");
    }
    await this.view.when();
    const screenshot = await this.view.takeScreenshot({
      format: "jpg",
      quality: 90,
      width,
      height,
    });
    return screenshot.dataUrl;
  }

  /** Switch label rendering mode. */
  setLabelMode(mode: "current" | "all"): void {
    this.labelMode = mode;
    this.applyLabelsForCurrentMode();
  }

  getLabelMode(): "current" | "all" {
    return this.labelMode;
  }

  private applyLabelsForCurrentMode(): void {
    if (!this.labelsLayer) return;
    this.labelsLayer.removeAll();
    if (this.labelMode === "current") {
      this.stopExtentWatcher();
      if (this.currentSelectedPolygon && this.currentSelectedLabel) {
        this.addTextLabel(this.currentSelectedLabel, this.currentSelectedPolygon);
      }
      return;
    }
    this.startExtentWatcher();
    void this.refreshExtentLabels();
  }

  private addTextLabel(text: string, polygon: Polygon): void {
    if (!this.labelsLayer || !text) return;
    const center = polygon.centroid ?? polygon.extent?.center;
    if (!center) return;
    const point = new Point({
      x: center.x,
      y: center.y,
      spatialReference: center.spatialReference,
    });
    const symbol = new TextSymbol({
      text,
      color: [20, 20, 20, 1],
      haloColor: [255, 255, 255, 0.9],
      haloSize: 1.5,
      font: { size: 11, weight: "bold", family: "Arial" },
    });
    this.labelsLayer.add(new Graphic({ geometry: point, symbol }));
  }

  private startExtentWatcher(): void {
    if (!this.view || this.extentWatchHandle) return;
    this.extentWatchHandle = reactiveUtils.watch(
      () => this.view!.stationary,
      (stationary) => {
        if (!stationary) return;
        if (this.extentDebounceTimer) clearTimeout(this.extentDebounceTimer);
        this.extentDebounceTimer = setTimeout(() => {
          void this.refreshExtentLabels();
        }, 400);
      }
    );
  }

  private stopExtentWatcher(): void {
    if (this.extentWatchHandle) {
      this.extentWatchHandle.remove();
      this.extentWatchHandle = undefined;
    }
    if (this.extentDebounceTimer) {
      clearTimeout(this.extentDebounceTimer);
      this.extentDebounceTimer = undefined;
    }
  }

  private async refreshExtentLabels(): Promise<void> {
    if (this.labelMode !== "all" || !this.labelsLayer || !this.view) return;
    this.labelsLayer.removeAll();
    // Skip if zoomed too far out — labels would be unreadable / overload.
    if (this.view.scale > 8000) return;
    await this.ensureMasterplanLoaded();
    const extent = this.view.extent;
    if (!extent) return;
    const xmin = extent.xmin, xmax = extent.xmax, ymin = extent.ymin, ymax = extent.ymax;
    let count = 0;
    for (const feat of this.masterplanFeatures) {
      const plotNo = feat.properties?.[MASTERPLAN_PLOT_FIELD];
      if (plotNo == null) continue;
      const rings = this.featureRings(feat);
      if (!rings.length) continue;
      const polygon = new Polygon({ rings, spatialReference: { wkid: 4326 } });
      const c = polygon.centroid ?? polygon.extent?.center;
      if (!c) continue;
      if (c.x < xmin || c.x > xmax || c.y < ymin || c.y > ymax) continue;
      this.addTextLabel(String(plotNo), polygon);
      count++;
      if (count >= 300) break;
    }
  }

  private featureRings(feat: MasterplanFeature): number[][][] {
    const geom = feat.geometry;
    if (!geom) return [];
    if (geom.type === "Polygon") return geom.coordinates as number[][][];
    if (geom.type === "MultiPolygon") return (geom.coordinates as number[][][][]).flat();
    return [];
  }

  destroy(): void {
    if (this.view) {
      this.view.destroy();
      this.view = undefined;
    }
    if (this.sceneView) {
      this.sceneView.destroy();
      this.sceneView = undefined;
    }
    this.destroyKrokiMap();
  }

  detachScene(): void {
    if (this.sceneView) {
      try {
        this.sceneView.container = null;
      } catch {
        // ignore detach failures
      }
    }
  }

  /**
   * Initialize a small live MapView inside the Kroki dialog, focused on the
   * given parcel. The basemap can be toggled later via setKrokiBasemap().
   */
  async initializeKrokiMap(
    container: HTMLDivElement,
    parcel: Parcel,
    basemap: "satellite" | "blank" = "satellite"
  ): Promise<void> {
    this.destroyKrokiMap();
    this.krokiMap = new EsriMap({
      basemap: basemap === "satellite" ? "satellite" : "gray-vector",
    });
    this.krokiHighlightLayer = new GraphicsLayer({ title: "Kroki Plot" });
    this.krokiMap.add(this.krokiHighlightLayer);

    this.krokiView = new MapView({
      container,
      map: this.krokiMap,
      ui: { components: ["zoom"] },
    });

    await this.krokiView.when();
    this.drawKrokiParcel(parcel);
  }

  setKrokiBasemap(basemap: "satellite" | "blank"): void {
    if (!this.krokiMap) return;
    this.krokiMap.basemap = (basemap === "satellite" ? "satellite" : "gray-vector") as any;
  }

  private drawKrokiParcel(parcel: Parcel): void {
    if (!this.krokiView || !this.krokiHighlightLayer || !parcel.geometry) return;
    const geom = parcel.geometry as { type: string; coordinates: unknown };
    let rings: number[][][] = [];
    if (geom.type === "Polygon") {
      rings = geom.coordinates as number[][][];
    } else if (geom.type === "MultiPolygon") {
      rings = (geom.coordinates as number[][][][]).flat();
    } else {
      return;
    }
    const polygon = new Polygon({ rings, spatialReference: { wkid: 4326 } });
    this.krokiHighlightLayer.removeAll();
    this.krokiHighlightLayer.add(
      new Graphic({
        geometry: polygon,
        symbol: this.createParcelHighlightSymbol(parcel, 0.55),
      })
    );
    const target = polygon.extent ? polygon.extent.clone().expand(1.4) : polygon;
    this.krokiView.goTo(target, { animate: false }).catch(() => undefined);
  }

  destroyKrokiMap(): void {
    if (this.krokiView) {
      this.krokiView.destroy();
      this.krokiView = undefined;
    }
    this.krokiMap = undefined;
    this.krokiHighlightLayer = undefined;
  }

  /**
   * Lazily initialize the 3D SceneView from a WebScene portal item.
   * Safe to call repeatedly — only loads on the first call.
   */
  async initializeScene(container: HTMLDivElement): Promise<void> {
    if (this.sceneView) {
      if (this.sceneView.container !== container) {
        try {
          this.sceneView.container = container;
        } catch (err) {
          console.warn('[map.service] failed to reattach SceneView container, recreating scene view', err);
          this.sceneView.destroy();
          this.sceneView = undefined;
          this.sceneInitPromise = undefined;
          return this.initializeScene(container);
        }
      }
      return;
    }
    if (!this.mapConfig) {
      throw new Error("MapConfig not initialized.");
    }
    if (!this.sceneInitPromise) {
      this.sceneInitPromise = (async () => {
        const sceneId = await this.resolveWebSceneId();
        if (!sceneId) {
          throw new Error("Could not resolve a WebScene id (set webSceneId or instantAppId in MapConfig).");
        }
        this.webScene = new WebScene({
          portalItem: {
            id: sceneId,
            portal: { url: this.mapConfig!.portalUrl },
          },
        });
        this.sceneView = new SceneView({
          container,
          map: this.webScene,
        });
        await this.sceneView.when();
        this.sceneHighlightLayer = new GraphicsLayer({ title: "Selected Plot (3D)" });
        this.webScene.add(this.sceneHighlightLayer);
      })();
    }
    await this.sceneInitPromise;
  }

  private async resolveWebSceneId(): Promise<string | undefined> {
    const cfg = this.mapConfig!;
    if (cfg.webSceneId) return cfg.webSceneId;
    if (!cfg.instantAppId) return undefined;
    const url = `${cfg.portalUrl.replace(/\/$/, "")}/sharing/rest/content/items/${cfg.instantAppId}/data?f=json`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to load Instant App config (${res.status}).`);
    }
    const data: any = await res.json();
    // Common shapes used by Instant Apps / 3D Viewer
    return (
      data?.values?.webscene ||
      data?.values?.webmap ||
      data?.webscene ||
      data?.map?.itemId ||
      undefined
    );
  }

  /** Sync viewpoint from 2D MapView to 3D SceneView. */
  syncMapToScene(): void {
    if (this.view && this.sceneView && this.view.viewpoint) {
      try {
        this.sceneView.viewpoint = this.view.viewpoint.clone();
      } catch {
        /* ignore */
      }
    }
  }

  /** Sync viewpoint from 3D SceneView back to 2D MapView. */
  syncSceneToMap(): void {
    if (this.view && this.sceneView && this.sceneView.viewpoint) {
      try {
        this.view.viewpoint = this.sceneView.viewpoint.clone();
      } catch {
        /* ignore */
      }
    }
  }

  /** Zoom the 3D scene to a parcel polygon with a tilted camera. */
  async zoomSceneToParcel(parcel: Parcel): Promise<void> {
    if (!this.sceneView || !parcel.geometry) {
      return;
    }
    const geom = parcel.geometry as { type: string; coordinates: unknown };
    let rings: number[][][] = [];
    if (geom.type === "Polygon") {
      rings = geom.coordinates as number[][][];
    } else if (geom.type === "MultiPolygon") {
      rings = (geom.coordinates as number[][][][]).flat();
    } else {
      return;
    }

    const polygon = new Polygon({
      rings,
      spatialReference: { wkid: 4326 },
    });

    if (this.sceneHighlightLayer) {
      this.sceneHighlightLayer.removeAll();
      this.sceneHighlightLayer.add(
        new Graphic({
          geometry: polygon,
          symbol: this.createParcelHighlightSymbol(parcel, 0.45),
        })
      );
    }

    try {
      await this.sceneView.goTo(
        { target: polygon.extent ? polygon.extent.clone().expand(2) : polygon, tilt: 65, heading: 30 },
        { animate: true }
      );
    } catch (err) {
      console.warn("scene goTo failed", err);
    }
  }

  private async resolveParcelLayer(): Promise<FeatureLayer> {
    if (!this.webMap) {
      throw new Error("WebMap not initialized.");
    }

    await this.webMap.loadAll();
    const featureLayers = this.webMap.allLayers
      .toArray()
      .filter((layer) => layer.type === "feature") as FeatureLayer[];

    if (!featureLayers.length) {
      throw new Error("No feature layers found in WebMap.");
    }

    const exactLayer16 = featureLayers.find((layer) =>
      layer.url?.toLowerCase().endsWith("/16")
    );
    if (exactLayer16) {
      return exactLayer16;
    }

    const parcelNamed = featureLayers.find((layer) =>
      layer.title?.toLowerCase().includes("parcel")
    );
    return parcelNamed ?? featureLayers[0];
  }

  private bindClickSelection(): void {
    if (!this.view || !this.parcelLayer) {
      return;
    }

    const handleParcelHit = async (event: any, zoomIn: boolean) => {
      const hit = await this.view!.hitTest(event);
      const match = (hit.results as Array<{ graphic?: Graphic }>).find(
        (item) => item.graphic?.layer === this.parcelLayer
      );
      if (!match?.graphic) return;

      const parcel = this.graphicToParcel(match.graphic);
      const geometry = match.graphic.geometry as any;
      if (geometry?.type === "polygon") {
        const poly = geometry as Polygon;
        if (this.highlightLayer) {
          this.highlightLayer.removeAll();
          this.highlightLayer.add(
            new Graphic({
              geometry: poly,
              symbol: this.createParcelHighlightSymbol(parcel, 0.35),
            })
          );
        }
        this.currentSelectedPolygon = poly;
        this.currentSelectedLabel = parcel.displayName || parcel.id;
        this.applyLabelsForCurrentMode();
      }
      this.selectedParcelSubject.next(parcel);
      if (zoomIn && geometry) {
        try {
          await this.view!.goTo({ target: geometry, zoom: 17 });
        } catch {
          /* ignore */
        }
      }
    };

    this.view.on("click", (event) => {
      void handleParcelHit(event, true);
    });
    this.view.on("double-click", (event) => {
      // Prevent default double-click zoom so the selection is the only effect.
      event.stopPropagation();
      void handleParcelHit(event, true);
    });
  }

  private graphicToParcel(graphic: Graphic): Parcel {
    const attributes = (graphic.attributes ?? {}) as Record<string, unknown>;
    const objectId = Number(attributes["OBJECTID"] ?? 0);
    const id = this.extractParcelId(attributes);

    return {
      id,
      objectId,
      displayName: this.extractDisplayName(attributes),
      attributes,
      geometry: graphic.geometry,
    };
  }

  private createParcelHighlightSymbol(_parcel: Parcel, alpha: number): SimpleFillSymbol {
    // green highlight for map selection
    return new SimpleFillSymbol({
      color: [31, 138, 90, alpha],
      outline: new SimpleLineSymbol({ color: [15, 90, 55, 1], width: 4 }),
    });
  }

  private getSearchField(layer: FeatureLayer): string {
    const fields = layer.fields?.map((field) => field.name.toUpperCase()) ?? [];
    const candidates = [
      "ENGLISHSTREETNAME",
      "ARABICSTREETNAME",
      "ROAD_NAME",
      "NAME",
      "PARCEL_ID",
      "PARCEL_NO",
      "OBJECTID",
    ];

    for (const candidate of candidates) {
      if (fields.includes(candidate)) {
        return candidate;
      }
    }

    return layer.objectIdField;
  }

  private extractParcelId(attributes: Record<string, unknown>): string {
    const candidates = [
      "PARCEL_ID",
      "PARCELID",
      "PARCEL_NO",
      "OBJECTID",
    ];

    for (const key of candidates) {
      const value = attributes[key];
      if (value !== undefined && value !== null && `${value}`.trim() !== "") {
        return String(value);
      }
    }

    return "unknown-parcel";
  }

  private extractDisplayName(attributes: Record<string, unknown>): string {
    const candidates = [
      "ENGLISHSTREETNAME",
      "ARABICSTREETNAME",
      "ROAD_NAME",
      "NAME",
      "PARCEL_ID",
      "PARCEL_NO",
    ];

    for (const key of candidates) {
      const value = attributes[key];
      if (value !== undefined && value !== null && `${value}`.trim() !== "") {
        return String(value);
      }
    }

    return this.extractParcelId(attributes);
  }
}