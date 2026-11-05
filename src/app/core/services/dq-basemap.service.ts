/**
 * DqBasemapService
 *
 * NEW service for the updated webmap configuration (May 2026).
 * Keeps old map.service.ts untouched.
 *
 * WebMap  (view only):   dd12f69323894efd92f6ca63b62ed672  (Landuse&Transportation_WebMap)
 * FeatureLayer (query):  DQ_Basemap / FeatureServer / 28
 *   - Primary query field: PlotID  (alias "Plot ID", esriFieldTypeString, length 15)
 */
import { Injectable } from "@angular/core";
import Graphic from "@arcgis/core/Graphic";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer";
import WebTileLayer from "@arcgis/core/layers/WebTileLayer";
import Basemap from "@arcgis/core/Basemap";
import Point from "@arcgis/core/geometry/Point";
import Polyline from "@arcgis/core/geometry/Polyline";
import Polygon from "@arcgis/core/geometry/Polygon";
import Extent from "@arcgis/core/geometry/Extent";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";
import PictureMarkerSymbol from "@arcgis/core/symbols/PictureMarkerSymbol";
import TextSymbol from "@arcgis/core/symbols/TextSymbol";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import * as webMercatorUtils from "@arcgis/core/geometry/support/webMercatorUtils";
import WebMap from "@arcgis/core/WebMap";
import WebScene from "@arcgis/core/WebScene";
import EsriMap from "@arcgis/core/Map";
import Compass from "@arcgis/core/widgets/Compass";
import ScaleBar from "@arcgis/core/widgets/ScaleBar";
import Zoom from "@arcgis/core/widgets/Zoom";
import MapView from "@arcgis/core/views/MapView";
import SceneView from "@arcgis/core/views/SceneView";
import { BehaviorSubject } from "rxjs";
import { MapConfig, Parcel } from "../../shared/models/parcel.model";

// ─── New portal / map constants ──────────────────────────────────────────────
/** Primary attribute field on FeatureServer/28 used to search / identify a plot. */
const PLOT_ID_FIELD = "PlotID";
const MASTERPLAN_PLOT_NO_FIELD = "MasterplanPlotNo";

// ─── Local masterplan GeoJSON (unchanged from old service) ───────────────────
const MASTERPLAN_URL        = new URL("geojson/PBMasterplan2026.geojson", document.baseURI).toString();
const MASTERPLAN_PLOT_FIELD = "Master Plan Plot No";

const MASTERPLAN_2018_URL        = "data/Master_Plan_2018.json";
const MASTERPLAN_2018_PLOT_FIELD = "Parcel No";
const ATM_BRANCH_GEOJSON_URL = "geojson/Riyadh_ATMs_and_Branches.geojson";
const BRANCH_GEOJSON_URL = "geojson/Riyadh_Branch_Locations.geojson";
const KING_FAHD_ROAD_URL = new URL("geojson/king_fahd_road.geojson", document.baseURI).toString();
const KING_FAHD_UTILITIES_URL = new URL("geojson/king_fahd_road_utilities_300.geojson", document.baseURI).toString();

interface MasterplanFeature {
  type: "Feature";
  properties: Record<string, unknown>;
  geometry: { type: "Polygon" | "MultiPolygon"; coordinates: number[][][] | number[][][][] };
}

export interface Dashboard1Summary {
  totalFeatures: number;
  contractStatusCounts: Record<string, number>;
  plotStatusCounts: Record<string, number>;
  leaseTypeCounts: Record<string, number>;
  zoneCounts: Record<string, number>;
  contractStatusField?: string;
  plotStatusField?: string;
  leaseTypeField?: string;
  zoneField?: string;
}

@Injectable({ providedIn: "root" })
export class DqBasemapService {
  private view?: MapView;
  private webMap?: WebMap;
  private sceneView?: SceneView;
  private webScene?: WebScene;
  private sceneInitPromise?: Promise<void>;
  private mapConfig?: MapConfig;

  /** Graphics created by Panoramic JSON / Panoramic View1 toggles. */
  private panoramicPointGraphics: Graphic[] = [];

  /** GraphicsLayer used for GeoServer / panoramic point symbols. */
  private panoramicPointsLayer?: GraphicsLayer;
  private atmLayer?: GraphicsLayer;
  private branchLayer?: GraphicsLayer;
  private kingFahdRoadLayer?: GeoJSONLayer;
  private kingFahdUtilitiesLayer?: GeoJSONLayer;
  private kingFahdUtilityCategoryCounts = new Map<string, number>();

  /** Parcel FeatureLayer loaded directly from DQ_Basemap/FeatureServer/28. */
  private parcelLayer?: FeatureLayer;
  private highlightLayer?: GraphicsLayer;
  private dashboardHighlightLayer?: GraphicsLayer;
  private sceneHighlightLayer?: GraphicsLayer;
  private labelsLayer?: GraphicsLayer;
  private vertexLayer?: GraphicsLayer;
  private plotSheetOutlineLayer?: GraphicsLayer;
  private dashboardBlinkTimer?: number;
  private dashboardHoverHitRequest = 0;

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
  private readonly geoJsonFeatureCache = new Map<string, Array<{ properties?: Record<string, unknown>; geometry?: { type?: string; coordinates?: unknown } }>>();

  // Basemap toggle state.
  private basemapMode: "webmap" | "satellite" = "webmap";
  private originalBasemap?: Basemap;
  private satelliteBasemap?: Basemap;
  private googleStreetsBasemap?: Basemap;
  private googleSatelliteBasemap?: Basemap;
  private googleHybridBasemap?: Basemap;
  /** Operational webmap layer ids hidden while in satellite-only mode. */
  private hiddenLayerIds: string[] = [];

  private readonly selectedParcelSubject = new BehaviorSubject<Parcel | null>(null);
  readonly selectedParcel$ = this.selectedParcelSubject.asObservable();

  // ─── Map initialisation ────────────────────────────────────────────────────

  async initializeMap(container: HTMLDivElement, config: MapConfig): Promise<void> {
    this.mapConfig = config;

    try {
      this.webMap = new WebMap({
        basemap: this.getGoogleStreetsBasemap(),
      });
    } catch (error) {
      console.warn("DqBasemapService: local map initialization failed", error);
      this.webMap = new WebMap({
        basemap: this.getGoogleStreetsBasemap(),
      });
    }

    // Always start with Google Streets in the main map.
    this.webMap.basemap = this.getGoogleStreetsBasemap();

    this.view = new MapView({
      container,
      map: this.webMap,
      ...(config.center ? { center: config.center } : { center: [46.6753, 24.7136] }),
      ...(config.zoom !== undefined ? { zoom: config.zoom } : { zoom: 12 }),
      popupEnabled: false,
      ui: { components: [] },
    });

    await this.view.when();

    this.view.ui.add(
      new Zoom({
        view: this.view,
      }),
      "top-right"
    );

    this.view.ui.add(
      new Compass({
        view: this.view,
      }),
      "top-right"
    );

    this.view.ui.add(
      new ScaleBar({
        view: this.view,
        unit: "dual",
      }),
      "bottom-right"
    );

    // Keep "webmap" mode aligned with the startup map style.
    this.originalBasemap = this.getGoogleStreetsBasemap();

    this.highlightLayer = new GraphicsLayer({ title: "Selected Plot" });
    this.webMap.add(this.highlightLayer);

    this.labelsLayer = new GraphicsLayer({ title: "Plot Labels" });
    this.webMap.add(this.labelsLayer);

    this.dashboardHighlightLayer = new GraphicsLayer({ title: "Dashboard Highlight", opacity: 0.85 });
    this.webMap.add(this.dashboardHighlightLayer);

    this.panoramicPointsLayer = new GraphicsLayer({ title: "Panoramic Points", visible: true });
    this.webMap.add(this.panoramicPointsLayer);

    await this.loadAtmAndBranchMarkers();
    try {
      await this.loadKingFahdRoadLayers();
    } catch (err) {
      console.error("DqBasemapService: failed to load King Fahd road layers", err);
    }

    this.bindClickSelection();
    this.bindDashboardHoverTooltip();

    // Pre-load local masterplan GeoJSON in the background.
    this.ensureMasterplanLoaded().catch((err) =>
      console.error("DqBasemapService: failed to load masterplan plots", err)
    );
  }

  private removeOnlineImageryAndBasemapLayers(): void {
    if (!this.webMap) return;
    const toRemove = this.webMap.layers.toArray().filter((layer: any) => {
      const url = String(layer?.url ?? "").toLowerCase();
      const portalUrl = String(layer?.portalItem?.portal?.url ?? "").toLowerCase();
      return (
        url.includes("services.arcgisonline.com") ||
        url.includes("server.arcgisonline.com") ||
        url.includes("basemaps.arcgis.com") ||
        portalUrl.includes("arcgis.com")
      );
    });
    for (const layer of toRemove) {
      try {
        this.webMap.remove(layer);
      } catch {
        // ignore layer removal failures
      }
    }
  }

  /**
   * Load King Fahd Road and its nearby utilities, then frame both layers.
   * The road file is a single Feature, so it is wrapped as a FeatureCollection.
   */
  private async loadKingFahdRoadLayers(): Promise<void> {
    if (!this.webMap || !this.view) {
      return;
    }

    if (!this.kingFahdRoadLayer) {
      this.kingFahdRoadLayer = new GeoJSONLayer({
        id: "king-fahd-road",
        title: "King Fahd Road",
        listMode: "show",
        legendEnabled: true,
        url: KING_FAHD_ROAD_URL,
        renderer: {
          type: "simple",
          symbol: {
            type: "simple-line",
            color: [230, 81, 0, 1],
            width: 5,
            style: "solid",
          },
        } as any,
      });
    }

    if (!this.kingFahdUtilitiesLayer) {
      this.kingFahdUtilitiesLayer = new GeoJSONLayer({
        id: "king-fahd-road-utilities",
        title: "King Fahd Road Utilities",
        listMode: "show",
        legendEnabled: true,
        url: KING_FAHD_UTILITIES_URL,
        renderer: this.buildKingFahdUtilityRenderer() as any,
        popupTemplate: {
          title: "{name}",
          content: [
            {
              type: "fields",
              fieldInfos: [
                { fieldName: "asset_type", label: "Asset Type" },
                { fieldName: "asset_id", label: "Asset ID" },
                { fieldName: "distance_from_road_m", label: "Distance from Road (m)" },
                { fieldName: "side_of_road", label: "Side of Road" },
              ],
            },
          ],
        } as any,
      });
    }

    await Promise.all([
      this.kingFahdRoadLayer.load(),
      this.kingFahdUtilitiesLayer.load(),
      this.refreshKingFahdUtilityCategoryCounts(),
    ]);
    const utilityCount = (await this.kingFahdUtilitiesLayer.queryFeatureCount().catch(() => 0)) ?? 0;
    console.log(`[king-fahd] loaded road and ${utilityCount} utility features.`);

    if (!this.webMap.findLayerById(this.kingFahdRoadLayer.id)) {
      this.webMap.add(this.kingFahdRoadLayer);
    }
    if (!this.webMap.findLayerById(this.kingFahdUtilitiesLayer.id)) {
      this.webMap.add(this.kingFahdUtilitiesLayer);
    }

    console.log("[king-fahd] King Fahd Road and utilities loaded. Default Riyadh view retained.");
  }

  private utilityColorByType(assetType: string): [number, number, number] {
    switch (assetType) {
      case "streetlight": return [255, 193, 7];
      case "trash_bin": return [120, 144, 156];
      case "fire_hydrant": return [229, 57, 53];
      case "atm": return [16, 185, 129];
      case "bank_branch": return [37, 99, 235];
      case "petrol_station": return [245, 124, 0];
      case "mosque": return [0, 150, 136];
      case "bus_stop": return [124, 77, 255];
      case "traffic_signal": return [255, 152, 0];
      case "cctv_camera": return [55, 71, 79];
      case "parking_meter": return [121, 85, 72];
      case "public_bench": return [104, 159, 56];
      case "telecom_cabinet": return [63, 81, 181];
      case "electrical_transformer": return [255, 214, 0];
      case "water_valve": return [0, 188, 212];
      case "manhole": return [84, 110, 122];
      case "public_toilet": return [236, 64, 122];
      default: return [33, 150, 243];
    }
  }

  private utilityLegendLabel(assetType: string): string {
    return assetType
      .split("_")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  private buildKingFahdUtilityRenderer(): unknown {
    const assetTypes = [
      "streetlight",
      "trash_bin",
      "fire_hydrant",
      "atm",
      "bank_branch",
      "petrol_station",
      "mosque",
      "bus_stop",
      "traffic_signal",
      "cctv_camera",
      "parking_meter",
      "public_bench",
      "telecom_cabinet",
      "electrical_transformer",
      "water_valve",
      "manhole",
      "public_toilet",
    ];

    const uniqueValueInfos = assetTypes.map((assetType) => {
      const color = this.utilityColorByType(assetType);
      return {
        value: assetType,
        label: this.utilityLegendLabel(assetType),
        symbol: {
          type: "simple-marker",
          style: "circle",
          color: [color[0], color[1], color[2], 0.95],
          size: 8,
          outline: { color: [255, 255, 255, 1], width: 1 },
        },
      };
    });

    return {
      type: "unique-value",
      field: "asset_type",
      defaultLabel: "Other Utilities",
      defaultSymbol: {
        type: "simple-marker",
        style: "circle",
        color: [33, 150, 243, 0.95],
        size: 8,
        outline: { color: [255, 255, 255, 1], width: 1 },
      },
      uniqueValueInfos,
    };
  }

  private async refreshKingFahdUtilityCategoryCounts(): Promise<void> {
    const response = await fetch(KING_FAHD_UTILITIES_URL);
    if (!response.ok) {
      throw new Error(`Failed to load ${KING_FAHD_UTILITIES_URL}: ${response.status}`);
    }
    const data = await response.json();
    const features = Array.isArray(data?.features) ? data.features : [];
    const categoryCounts = new Map<string, number>();
    this.kingFahdUtilityCategoryCounts.clear();

    for (const feature of features) {
      const coords = feature?.geometry?.coordinates;
      if (!Array.isArray(coords) || coords.length < 2) continue;
      const longitude = Number(coords[0]);
      const latitude = Number(coords[1]);
      if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) continue;

      const assetType = String(feature?.properties?.asset_type ?? "").toLowerCase();
      categoryCounts.set(assetType, (categoryCounts.get(assetType) ?? 0) + 1);
    }

    // Store categories for legend display
    this.kingFahdUtilityCategoryCounts = categoryCounts;

    const categoryList = Array.from(categoryCounts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([type, count]) => `${type}(${count})`)
      .join(", ");
    console.log(
      `[king-fahd-utilities] loaded ${features.length} features across ${categoryCounts.size} categories: ${categoryList}`
    );
  }

  private async loadAtmAndBranchMarkers(): Promise<void> {
    if (!this.webMap) {
      return;
    }

    this.atmLayer = new GraphicsLayer({
      id: "riyadh-atms-layer",
      title: "ATMs",
      listMode: "show",
    });
    this.branchLayer = new GraphicsLayer({
      id: "riyadh-branches-layer",
      title: "Branches",
      listMode: "show",
    });

    const atmSymbol = new PictureMarkerSymbol({
      url: new URL("assets/img/atm.png", document.baseURI).toString(),
      width: "28px",
      height: "28px",
    });
    const atmFallbackSymbol = new SimpleMarkerSymbol({
      style: "square",
      color: [16, 185, 129, 1],
      size: 12,
      outline: { color: [255, 255, 255, 1], width: 1 },
    });
    const branchSymbol = new PictureMarkerSymbol({
      url: new URL("assets/img/banks.png", document.baseURI).toString(),
      width: "28px",
      height: "28px",
    });
    const branchFallbackSymbol = new SimpleMarkerSymbol({
      style: "diamond",
      color: [37, 99, 235, 1],
      size: 14,
      outline: { color: [255, 255, 255, 1], width: 1 },
    });

    const isType = (type: string) => (feature: { properties?: Record<string, unknown> }) =>
      String(feature?.properties?.["feature_type"] ?? "").toLowerCase() === type;

    const [atmCount, branchCount] = await Promise.all([
      this.addGeoJsonPointGraphics(
        "geojson/Riyadh_ATM_Locations.geojson",
        this.atmLayer,
        atmSymbol
      ),
      this.addGeoJsonPointGraphics(
        "geojson/Riyadh_Branch_Locations.geojson",
        this.branchLayer,
        branchSymbol
      ),
    ]);

    if (!atmCount) {
      await this.addGeoJsonPointGraphics(
        "geojson/Riyadh_ATMs_and_Branches.geojson",
        this.atmLayer,
        atmFallbackSymbol,
        isType("atm")
      );
    }
    if (!branchCount) {
      await this.addGeoJsonPointGraphics(
        "geojson/Riyadh_ATMs_and_Branches.geojson",
        this.branchLayer,
        branchFallbackSymbol,
        isType("branch")
      );
    }

    this.webMap.add(this.atmLayer);
    this.webMap.add(this.branchLayer);
    this.webMap.reorder(this.atmLayer, this.webMap.layers.length - 1);
    this.webMap.reorder(this.branchLayer, this.webMap.layers.length - 1);
    console.log(`[atm] loaded ${this.atmLayer.graphics.length} ATM markers and ${this.branchLayer.graphics.length} branch markers`);
  }

  private async addGeoJsonPointGraphics(
    relativeUrl: string,
    layer: GraphicsLayer,
    symbol: PictureMarkerSymbol | SimpleMarkerSymbol,
    includeFeature?: (feature: { properties?: Record<string, unknown>; geometry?: { coordinates?: unknown } }) => boolean
  ): Promise<number> {
    try {
      const url = new URL(relativeUrl, document.baseURI).toString();
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`);
      }
      const data = await response.json();
      const features = Array.isArray(data?.features) ? data.features : [];
      let added = 0;
      for (const feature of features) {
        if (includeFeature && !includeFeature(feature)) {
          continue;
        }
        const coords = feature?.geometry?.coordinates;
        if (!Array.isArray(coords) || coords.length < 2) {
          continue;
        }
        const longitude = Number(coords[0]);
        const latitude = Number(coords[1]);
        if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
          continue;
        }
        layer.add(
          new Graphic({
            geometry: new Point({
              longitude,
              latitude,
              spatialReference: { wkid: 4326 },
            }),
            symbol,
            attributes: feature.properties ?? {},
          })
        );
        added += 1;
      }
      return added;
    } catch (error) {
      console.error(`[atm] Failed to load ${relativeUrl}`, error);
      return 0;
    }
  }

  // ─── Search using PlotID on FeatureServer/28 ──────────────────────────────

  async searchParcels(term: string): Promise<Parcel[]> {
    if (!this.parcelLayer || !term.trim()) return [];

    await this.parcelLayer.load();
    const safe = term.trim().replace(/'/g, "''").toUpperCase();

    const query = this.parcelLayer.createQuery();
    query.where     = `UPPER(${PLOT_ID_FIELD}) LIKE '%${safe}%'`;
    query.outFields = ["*"];
    query.returnGeometry = true;
    query.num       = 20;

    const result = await this.parcelLayer.queryFeatures(query);
    return result.features.map((f) => this.graphicToParcel(f));
  }

  async selectParcelByObjectId(objectId: number): Promise<void> {
    if (!this.parcelLayer || !this.view) return;

    const query = this.parcelLayer.createQuery();
    query.where          = `OBJECTID = ${objectId}`;
    query.outFields      = ["*"];
    query.returnGeometry = true;
    query.num            = 1;

    const result = await this.parcelLayer.queryFeatures(query);
    const feature = result.features[0];
    if (!feature) return;

    if (feature.geometry) {
      try {
        await this.view.goTo({ target: feature.geometry, zoom: 17 } as any, { animate: true });
      } catch (err) {
        console.warn("goTo failed", err);
      }
    }
    this.selectedParcelSubject.next(this.graphicToParcel(feature));
  }

  async updateParcelAttributes(objectId: number, updates: Record<string, unknown>): Promise<void> {
    if (!this.parcelLayer) {
      throw new Error("Parcel layer not initialized.");
    }
    if (!Number.isFinite(objectId) || objectId <= 0) {
      throw new Error("Invalid parcel object id.");
    }

    const keys = Object.keys(updates);
    if (!keys.length) {
      return;
    }

    await this.parcelLayer.load();
    const objectIdField = this.parcelLayer.objectIdField || "OBJECTID";
    const attributes: Record<string, unknown> = {
      [objectIdField]: objectId,
    };

    for (const key of keys) {
      attributes[key] = updates[key];
    }

    const editResult = await this.parcelLayer.applyEdits({
      updateFeatures: [new Graphic({ attributes })],
    });

    const updateError = editResult.updateFeatureResults?.[0]?.error;
    if (updateError) {
      throw new Error(updateError.message || "Feature update failed.");
    }
  }

  // ─── Masterplan local GeoJSON (same as old service) ───────────────────────

  async searchMasterplanPlots(term: string, dataset: "2026" | "2018" = "2026"): Promise<Parcel[]> {
    const q = term.trim().toUpperCase();
    if (!q) return [];

    const is2018 = dataset === "2018";
    if (is2018) {
      await this.ensureMasterplan2018Loaded();

      const matches: Parcel[] = [];
      for (const feat of this.masterplan2018Features) {
        const plotNo = feat.properties?.[MASTERPLAN_2018_PLOT_FIELD];
        if (plotNo == null) continue;
        if (String(plotNo).toUpperCase().includes(q)) {
          matches.push(this.masterplanFeatureToParcel(feat, MASTERPLAN_2018_PLOT_FIELD, dataset));
          if (matches.length >= 25) break;
        }
      }
      console.log("[searchMasterplanPlots] 2018 lookup", {
        dataset,
        term,
        matches: matches.length,
        sampleAttributes: matches.slice(0, 3).map((parcel) => parcel.attributes),
      });
      return matches;
    }

    await this.ensureMasterplanLoaded();
    const matches: Parcel[] = [];
    for (const feat of this.masterplanFeatures) {
      const plotNo = feat.properties?.[MASTERPLAN_PLOT_FIELD];
      if (plotNo != null && String(plotNo).toUpperCase().includes(q)) {
        matches.push(this.masterplanFeatureToParcel(feat, MASTERPLAN_PLOT_FIELD, dataset));
        if (matches.length >= 25) break;
      }
    }
    return matches;
  }

  async searchAtmAndBranchById(term: string): Promise<Parcel[]> {
    const q = term.trim().toUpperCase();
    if (!q) {
      return [];
    }

    const searchAtm = q.startsWith("ATM-") || !q.startsWith("BR-");
    const searchBranch = q.startsWith("BR-") || !q.startsWith("ATM-");

    const [atmFeatures, branchFeatures] = await Promise.all([
      this.loadGeoJsonFeatures(ATM_BRANCH_GEOJSON_URL),
      this.loadGeoJsonFeatures(BRANCH_GEOJSON_URL),
    ]);

    const matches: Parcel[] = [];
    const addMatch = (feature: { properties?: Record<string, unknown>; geometry?: { type?: string; coordinates?: unknown } }, locationType: "atm" | "branch"): void => {
      const parcel = this.geoJsonFeatureToLocationParcel(feature, locationType);
      if (parcel) {
        matches.push(parcel);
      }
    };

    if (searchAtm) {
      for (const feature of atmFeatures) {
        const props = feature.properties ?? {};
        const featureType = String(props["feature_type"] ?? "").trim().toLowerCase();
        const atmId = String(props["id"] ?? "").trim().toUpperCase();
        if (featureType !== "atm" || !atmId) {
          continue;
        }
        if (atmId === q) {
          addMatch(feature, "atm");
          break;
        }
      }
    }

    if (searchBranch) {
      for (const feature of branchFeatures) {
        const props = feature.properties ?? {};
        const branchId = String(props["Branch_ID"] ?? "").trim().toUpperCase();
        if (!branchId) {
          continue;
        }
        if (branchId === q) {
          addMatch(feature, "branch");
          break;
        }
      }
    }

    return matches;
  }

  async zoomToMasterplanParcel(parcel: Parcel): Promise<void> {
    if (!parcel.geometry) {
      this.selectedParcelSubject.next(parcel);
      return;
    }
    if (!this.view) {
      this.selectedParcelSubject.next(parcel);
      return;
    }

    const geom = parcel.geometry as Polygon | Point | { type?: string; coordinates?: unknown; rings?: number[][][]; spatialReference?: unknown; x?: number; y?: number; longitude?: number; latitude?: number };
    let polygon: Polygon | null = null;
    let point: Point | null = null;
    if (geom instanceof Polygon) {
      polygon = geom;
    } else if (geom instanceof Point) {
      point = geom;
    } else if (Array.isArray(geom.rings)) {
      polygon = new Polygon({ rings: geom.rings, spatialReference: geom.spatialReference as any });
    } else if (geom.type === "Polygon") {
      polygon = new Polygon({ rings: geom.coordinates as number[][][], spatialReference: { wkid: 4326 } });
    } else if (geom.type === "MultiPolygon") {
      polygon = new Polygon({ rings: (geom.coordinates as number[][][][]).flat(), spatialReference: { wkid: 4326 } });
    } else if (geom.type === "Point" && Array.isArray(geom.coordinates)) {
      const [longitude, latitude] = geom.coordinates as number[];
      if (Number.isFinite(longitude) && Number.isFinite(latitude)) {
        point = new Point({ longitude, latitude, spatialReference: { wkid: 4326 } });
      }
    } else if (Number.isFinite(geom.longitude) && Number.isFinite(geom.latitude)) {
      point = new Point({ longitude: Number(geom.longitude), latitude: Number(geom.latitude), spatialReference: geom.spatialReference as any });
    } else if (Number.isFinite(geom.x) && Number.isFinite(geom.y)) {
      point = new Point({ x: Number(geom.x), y: Number(geom.y), spatialReference: geom.spatialReference as any });
    }

    if (!polygon && !point) {
      this.selectedParcelSubject.next(parcel);
      return;
    }

    if (!this.highlightLayer) {
      this.highlightLayer = new GraphicsLayer({ title: "Selected Plot" });
      this.webMap?.add(this.highlightLayer);
    }
    this.highlightLayer.removeAll();
    const geometry = polygon ?? point!;
    const selGraphic = new Graphic({
      geometry,
      symbol: polygon ? this.createHighlightSymbol(parcel, 0.35) : this.createPointHighlightSymbol(),
    });
    this.highlightLayer.add(selGraphic);

    const target = polygon ? (polygon.extent ? polygon.extent.clone().expand(1.6) : polygon) : { target: point!, zoom: 16 };
    try {
      await this.view.goTo(target, { animate: true });
    } catch (err) {
      console.warn("goTo failed", err);
    }
    // Flash the freshly-added graphic so selection is obvious
    // Disabled blinking: try { this.flashGraphic(selGraphic, 3, 360); } catch {}
    this.currentSelectedPolygon  = polygon ?? undefined;
    this.currentSelectedLabel    = polygon ? (parcel.displayName || parcel.id) : undefined;
    this.applyLabelsForCurrentMode();
    this.selectedParcelSubject.next(parcel);
  }

  // ─── Highlight / labels ───────────────────────────────────────────────────

  clearHighlight(): void {
    this.stopDashboardBlink();
    try { this.view?.closePopup?.(); } catch {}
    // Remove graphics from all known highlight layers and view-level graphics
    this.highlightLayer?.removeAll();
    this.dashboardHighlightLayer?.removeAll();
    this.sceneHighlightLayer?.removeAll();
    this.krokiHighlightLayer?.removeAll();
    this.labelsLayer?.removeAll();
    // plot sheet and vertex overlays
    try { this.plotSheetOutlineLayer?.removeAll(); } catch {}
    try { this.vertexLayer?.removeAll(); } catch {}
    // Remove any graphics drawn directly on the views
    try { this.view?.graphics.removeAll(); } catch {}
    try { this.sceneView?.graphics.removeAll(); } catch {}
    this.currentSelectedPolygon = undefined;
    this.currentSelectedLabel   = undefined;
    this.stopExtentWatcher();
    this.labelMode = "current";
    this.selectedParcelSubject.next(null);
  }

  clearDashboardHighlights(): void {
    this.stopDashboardBlink();
    try { this.view?.closePopup?.(); } catch {}
    this.dashboardHighlightLayer?.removeAll();
  }

  async highlightLocationParcels(parcels: Parcel[]): Promise<void> {
    if (!this.view || !parcels.length) {
      this.clearDashboardHighlights();
      return;
    }

    if (!this.dashboardHighlightLayer) {
      this.dashboardHighlightLayer = new GraphicsLayer({ title: "Dashboard Highlight", opacity: 0.9 });
      this.webMap?.add(this.dashboardHighlightLayer);
    }

    this.stopDashboardBlink();
    this.dashboardHighlightLayer.removeAll();

    const graphics: Graphic[] = [];
    for (const parcel of parcels) {
      const geometry = parcel.geometry as { type?: string; coordinates?: unknown } | undefined;
      if (!geometry || geometry.type !== "Point" || !Array.isArray(geometry.coordinates)) {
        continue;
      }

      const [longitude, latitude] = geometry.coordinates as number[];
      if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
        continue;
      }

      const locationType = String(parcel.attributes?.["_locationType"] ?? "atm").toLowerCase();
      const color: [number, number, number] = locationType === "branch" ? [37, 99, 235] : [16, 185, 129];
      const marker = new SimpleMarkerSymbol({
        style: "circle",
        size: 14,
        color: [color[0], color[1], color[2], 0.5],
        outline: { color: [255, 255, 255, 1], width: 2 },
      });

      graphics.push(
        new Graphic({
          geometry: new Point({ longitude, latitude, spatialReference: { wkid: 4326 } }),
          symbol: marker,
          attributes: parcel.attributes,
        })
      );
    }

    if (!graphics.length) {
      return;
    }

    this.dashboardHighlightLayer.addMany(graphics);
    this.ensureGraphicLayersOnTop();

    const points = graphics
      .map((item) => item.geometry)
      .filter((geometry): geometry is Point => !!geometry && geometry.type === "point");

    try {
      if (points.length === 1) {
        await this.view.goTo({ target: points[0], zoom: 16 }, { animate: true });
      } else {
        await this.view.goTo(points, { animate: true });
      }
    } catch (err) {
      console.warn("[dashboard] voice-agent goTo failed", err);
    }
  }

  async highlightBranchMarkersByPerformanceStatus(statusValue: string, colorHex: string): Promise<void> {
    await this.highlightPointMarkersByPerformanceStatus(this.branchLayer, statusValue, colorHex, "branch");
  }

  async highlightAtmMarkersByPerformanceStatus(statusValue: string, colorHex: string): Promise<void> {
    await this.highlightPointMarkersByPerformanceStatus(this.atmLayer, statusValue, colorHex, "ATM");
  }

  private async highlightPointMarkersByPerformanceStatus(
    sourceLayer: GraphicsLayer | undefined,
    statusValue: string,
    colorHex: string,
    sourceLabel: string
  ): Promise<void> {
    if (!this.view || !sourceLayer) {
      return;
    }
    const normalized = statusValue.trim().toUpperCase();
    if (!normalized) {
      this.clearDashboardHighlights();
      return;
    }

    if (!this.dashboardHighlightLayer) {
      this.dashboardHighlightLayer = new GraphicsLayer({ title: "Dashboard Highlight", opacity: 0.9 });
      this.webMap?.add(this.dashboardHighlightLayer);
    }

    this.stopDashboardBlink();
    this.dashboardHighlightLayer.removeAll();

    const matching = sourceLayer.graphics
      .toArray()
      .filter((graphic) => String(graphic.attributes?.["Performance_Status"] ?? "").trim().toUpperCase() === normalized);

    if (!matching.length) {
      console.warn(`[dashboard] No ${sourceLabel} markers matched Performance_Status=${statusValue}`);
      return;
    }

    const [r, g, b] = this.parseHexColor(colorHex);
    const baseSymbol = new SimpleMarkerSymbol({
      style: "circle",
      size: 16,
      color: [r, g, b, 0.55],
      outline: { color: [r, g, b, 1], width: 2.5 },
    });

    const highlightGraphics = matching
      .filter((graphic) => !!graphic.geometry)
      .map((graphic) => new Graphic({
        geometry: graphic.geometry,
        attributes: graphic.attributes,
        symbol: baseSymbol.clone(),
      }));

    if (!highlightGraphics.length) {
      return;
    }

    this.dashboardHighlightLayer.addMany(highlightGraphics);
    this.ensureGraphicLayersOnTop();

    const points = highlightGraphics
      .map((graphic) => graphic.geometry)
      .filter((geometry): geometry is Point => !!geometry && geometry.type === "point");

    try {
      if (points.length === 1) {
        await this.view.goTo({ target: points[0], zoom: 15 }, { animate: true });
      } else if (points.length > 1) {
        await this.view.goTo(points, { animate: true });
      }
    } catch (err) {
      console.warn(`[dashboard] ${sourceLabel} goTo failed`, err);
    }

    this.flashDashboardPointHighlights(highlightGraphics, [r, g, b]);
  }

  private flashDashboardPointHighlights(graphics: Graphic[], color: [number, number, number], pulses = 4, intervalMs = 260): void {
    this.stopDashboardBlink();
    let cycles = 0;
    let strong = false;
    this.dashboardBlinkTimer = window.setInterval(() => {
      strong = !strong;
      const symbol = new SimpleMarkerSymbol({
        style: "circle",
        size: strong ? 24 : 14,
        color: [color[0], color[1], color[2], strong ? 0.82 : 0.4],
        outline: { color: [color[0], color[1], color[2], 1], width: strong ? 3.5 : 2 },
      });
      for (const graphic of graphics) {
        try {
          graphic.symbol = symbol.clone();
        } catch {
          // ignore symbol update errors for disposed graphics
        }
      }

      cycles += 1;
      if (cycles >= pulses * 2) {
        this.stopDashboardBlink();
        const finalSymbol = new SimpleMarkerSymbol({
          style: "circle",
          size: 18,
          color: [color[0], color[1], color[2], 0.62],
          outline: { color: [color[0], color[1], color[2], 1], width: 2.8 },
        });
        for (const graphic of graphics) {
          try {
            graphic.symbol = finalSymbol.clone();
          } catch {
            // ignore symbol update errors for disposed graphics
          }
        }
      }
    }, intervalMs);
  }

  private stopDashboardBlink(): void {
    if (this.dashboardBlinkTimer) {
      window.clearInterval(this.dashboardBlinkTimer);
      this.dashboardBlinkTimer = undefined;
    }
  }

  private findFieldName(fields: string[], substrings: string[]): string | null {
    const lowerSubstrings = substrings.map((s) => s.toLowerCase());
    for (const field of fields) {
      const lower = field.toLowerCase();
      if (lowerSubstrings.some((substr) => lower.includes(substr))) {
        return field;
      }
    }
    return null;
  }

  private normalizeDashboardValue(value: unknown): string {
    if (value === null || value === undefined) return "Unknown";
    const str = String(value).trim();
    return str === "" ? "Unknown" : str;
  }

  /**
   * Returns a mapping of land use value -> count, using the best-available land use field.
   * Optionally accepts a filter object: { zoneValue, statusValue } to restrict the count.
   */
  public async getLanduseCounts(filter?: { zoneValue?: string | null; statusValue?: string | null }): Promise<{ field: string; counts: Record<string, number> }> {
    if (!this.parcelLayer) throw new Error("Parcel layer not initialized.");
    await this.parcelLayer.load();
    const fields = this.parcelLayer.fields ?? [];
    const allFields = fields.map(f => String(f.name));
    // Prefer 'Landuse (English)', then 'Sub Landuse', then 'LandUseCategory'
    const landuseField =
      allFields.find(f => f.trim().toLowerCase() === 'landuse (english)') ||
      allFields.find(f => f.trim().toLowerCase() === 'sub landuse') ||
      allFields.find(f => f.trim().toLowerCase() === 'landusecategory') ||
      this.findFieldName(allFields, ['landuse', 'land use', 'category']);
    if (!landuseField) throw new Error('No land use field found on parcel layer.');

    // Build WHERE clause if filter is provided
    const whereClauses: string[] = [];
    if (filter?.zoneValue) {
      // Try to find the best zone field (reuse dashboard logic)
      let zoneField = allFields.find((name) => name.trim().toLowerCase() === 'zone english name');
      if (!zoneField) {
        const exactAlias = fields.find((field) => String(field.alias ?? '').trim().toLowerCase() === 'zone english name');
        if (exactAlias) zoneField = String(exactAlias.name);
      }
      if (!zoneField) {
        const aliasMatch = fields.find((field) => {
          const alias = String(field.alias ?? '').toLowerCase();
          return ['zone english name', 'zone name', 'zone'].some((pattern) => alias.includes(pattern));
        });
        if (aliasMatch) zoneField = String(aliasMatch.name);
      }
      if (!zoneField) zoneField = this.findFieldName(allFields, ['zone', 'area', 'sector', 'masterplan']) ?? undefined;
      if (zoneField) {
        const quoted = /[^A-Za-z0-9_]/.test(zoneField) ? `"${zoneField}"` : zoneField;
        whereClauses.push(`UPPER(${quoted}) = '${String(filter.zoneValue).trim().replace(/'/g, "''").toUpperCase()}'`);
      }
    }
    if (filter?.statusValue) {
      // Try to find the best status field (reuse dashboard logic)
      const statusField = this.findFieldName(allFields, ['contractstatus', 'plotstatus', 'status']);
      if (statusField) {
        const quoted = /[^A-Za-z0-9_]/.test(statusField) ? `"${statusField}"` : statusField;
        whereClauses.push(`UPPER(${quoted}) = '${String(filter.statusValue).trim().replace(/'/g, "''").toUpperCase()}'`);
      }
    }
    const where = whereClauses.length ? whereClauses.join(' AND ') : '1=1';

    // Query all features (paged)
    const counts: Record<string, number> = {};
    let total = 0;
    const query = this.parcelLayer.createQuery();
    query.where = where;
    query.outFields = [landuseField];
    query.returnGeometry = false;
    query.num = 2000;
    query.start = 0;
    while (true) {
      query.start = total;
      let pageResult;
      try {
        pageResult = await this.parcelLayer.queryFeatures(query);
      } catch (err) {
        throw new Error(`Landuse count query failed: ${err}`);
      }
      for (const feature of pageResult.features) {
        const value = this.normalizeDashboardValue(feature.attributes?.[landuseField]);
        counts[value] = (counts[value] ?? 0) + 1;
      }
      total += pageResult.features.length;
      if (!pageResult.exceededTransferLimit || !pageResult.features.length) break;
    }
    return { field: landuseField, counts };
  }

  async getDashboard1Summary(zoneValue?: string | null, statusValue?: string | null): Promise<Dashboard1Summary> {
    if (!this.parcelLayer) {
      throw new Error("Parcel layer not initialized.");
    }

    await this.parcelLayer.load();
    const fields = this.parcelLayer.fields ?? [];
    const allFields = fields.map((field) => String(field.name));
    const allAliases = fields.map((field) => String(field.alias ?? ""));
    const contractStatusField =
      this.findFieldName(allFields, ["contractstatus", "contract_status", "contract status"]);
    const plotStatusField =
      this.findFieldName(allFields, ["plotstatus", "plot_status", "plot status"]);
    const leaseTypeField =
      this.findFieldName(allFields, ["leasetype", "lease_type", "lease type", "lease"]);

    const zonePatterns = [
      "zone english name", "zoneenglishname", "zone_english_name", "zone_eng", "zoneeng",
      "zone name", "zone_name"
    ];

    let zoneField = allFields.find((name) => name.trim().toLowerCase() === 'zone english name');
    if (!zoneField) {
      const exactAlias = fields.find((field) => String(field.alias ?? "").trim().toLowerCase() === 'zone english name');
      if (exactAlias) {
        zoneField = String(exactAlias.name);
      }
    }
    if (!zoneField) {
      const aliasMatch = fields.find((field) => {
        const alias = String(field.alias ?? "").toLowerCase();
        return zonePatterns.some((pattern) => alias.includes(pattern));
      });
      if (aliasMatch) {
        zoneField = String(aliasMatch.name);
      }
    }
    if (!zoneField) {
      zoneField = this.findFieldName(allFields, ["zone", "area", "sector", "masterplan"]) ?? undefined;
    }
    if (!zoneField) {
      zoneField = this.findFieldName(allFields, ["zoneid", "zone_id"]) ?? undefined;
    }
    console.log('[DASHBOARD] allFields=', allFields);
    console.log('[DASHBOARD] allAliases=', allAliases);
    console.log('[DASHBOARD] resolved zoneField=', zoneField);

    const outFields = [contractStatusField, plotStatusField, leaseTypeField, zoneField].filter(
      (field): field is string => !!field
    );

    if (!outFields.length) {
      throw new Error(`Could not find dashboard fields on parcel layer. Available fields: ${allFields.join(", ")}`);
    }

    const quotedField = (name: string): string => (/[^A-Za-z0-9_]/.test(name) ? `"${name.replace(/"/g, '"')}"` : name);
    const whereClauses: string[] = [];
    if (statusValue && contractStatusField) {
      const statusFieldSql = quotedField(contractStatusField);
      whereClauses.push(`UPPER(${statusFieldSql}) = '${String(statusValue).trim().replace(/'/g, "''").toUpperCase()}'`);
    }
    if (zoneValue && zoneField) {
      const zoneFieldSql = quotedField(zoneField);
      whereClauses.push(`UPPER(${zoneFieldSql}) = '${String(zoneValue).trim().replace(/'/g, "''").toUpperCase()}'`);
    }

    const counts = {
      contractStatusCounts: {} as Record<string, number>,
      plotStatusCounts: {} as Record<string, number>,
      leaseTypeCounts: {} as Record<string, number>,
      zoneCounts: {} as Record<string, number>,
    };
    let totalFeatures = 0;

    const query = this.parcelLayer.createQuery();
    query.where = whereClauses.length ? whereClauses.join(' AND ') : '1=1';
    query.outFields = outFields;
    query.returnGeometry = false;
    query.num = 2000;
    query.start = 0;

    while (true) {
      query.start = totalFeatures;
      let pageResult;
      try {
        pageResult = await this.parcelLayer.queryFeatures(query);
      } catch (err) {
        throw new Error(`Dashboard1 query failed: ${err}`);
      }

      for (const feature of pageResult.features) {
        const attrs = feature.attributes ?? {};
        if (contractStatusField) {
          const value = this.normalizeDashboardValue(attrs[contractStatusField]);
          counts.contractStatusCounts[value] = (counts.contractStatusCounts[value] ?? 0) + 1;
        }
        if (plotStatusField) {
          const value = this.normalizeDashboardValue(attrs[plotStatusField]);
          counts.plotStatusCounts[value] = (counts.plotStatusCounts[value] ?? 0) + 1;
        }
        if (leaseTypeField) {
          const value = this.normalizeDashboardValue(attrs[leaseTypeField]);
          counts.leaseTypeCounts[value] = (counts.leaseTypeCounts[value] ?? 0) + 1;
        }
        if (zoneField) {
          const value = this.normalizeDashboardValue(attrs[zoneField]);
          counts.zoneCounts[value] = (counts.zoneCounts[value] ?? 0) + 1;
        }
      }

      totalFeatures += pageResult.features.length;
      if (!pageResult.exceededTransferLimit || !pageResult.features.length) {
        break;
      }
    }

    // Return the field names used so the dashboard can use them for highlighting
    return {
      totalFeatures,
      ...counts,
      contractStatusField: contractStatusField ?? undefined,
      plotStatusField: plotStatusField ?? undefined,
      leaseTypeField: leaseTypeField ?? undefined,
      zoneField: zoneField ?? undefined,
    };
  }

  async highlightParcelsByContractStatus(statusValue: string, colorHex: string, fieldName?: string, suppressFlash = false): Promise<void> {
    if (!this.parcelLayer || !this.view) {
      return;
    }

    if (!statusValue.trim()) {
      this.clearDashboardHighlights();
      return;
    }

    await this.parcelLayer.load();

    const normalizedValue = statusValue.trim().replace(/'/g, "''").toUpperCase();
    const isUnknown = normalizedValue === "UNKNOWN";

    const allFields = (this.parcelLayer.fields ?? []).map((field) => String(field.name));
    let mainStatusField = fieldName;
    if (!mainStatusField) {
      const statusFields = allFields.filter((name) => {
        const lower = name.toLowerCase();
        return lower.includes("contractstatus") || lower.includes("plotstatus");
      });
      mainStatusField = statusFields.find((f) => f.toLowerCase().includes("english")) || statusFields[0];
    }

    const quotedField = (name: string): string => {
      return /[^A-Za-z0-9_]/.test(name) ? `"${name}"` : name;
    };

    if (!mainStatusField) {
      console.warn(
        "highlightParcelsByContractStatus: no valid parcel layer fields found for contract status query",
        allFields
      );
      this.clearDashboardHighlights();
      return;
    }

    // Diagnostic logging: log the field name and a sample of values
    console.log('[DASHBOARD] highlightParcelsByContractStatus field:', mainStatusField);
    try {
      const sampleQuery = this.parcelLayer.createQuery();
      sampleQuery.where = '1=1';
      sampleQuery.outFields = [mainStatusField];
      sampleQuery.returnGeometry = false;
      sampleQuery.num = 10;
      const sampleResult = await this.parcelLayer.queryFeatures(sampleQuery);
      const sampleValues = sampleResult.features.map((f) => f.attributes?.[mainStatusField]);
      console.log('[DASHBOARD] Sample values for', mainStatusField, ':', sampleValues);
    } catch (e) {
      console.warn('[DASHBOARD] Could not fetch sample values for', mainStatusField, e);
    }

    let whereClause = '';
    if (isUnknown) {
      whereClause = `(
        UPPER(${quotedField(mainStatusField)}) = 'UNKNOWN' OR
        ${quotedField(mainStatusField)} IS NULL OR
        ${quotedField(mainStatusField)} = ''
      )`;
    } else {
      whereClause = `UPPER(${quotedField(mainStatusField)}) = '${normalizedValue}'`;
    }

    const query = this.parcelLayer.createQuery();
    query.where = whereClause;
    query.outFields = ["*"];
    query.returnGeometry = true;
    query.num = 2000;
    query.start = 0;

    // Page through all results in case the server caps each response.
    let allFeatures: Graphic[] = [];
    let pageStart = 0;
    while (true) {
      query.start = pageStart;
      let pageResult;
      try {
        pageResult = await this.parcelLayer.queryFeatures(query);
      } catch (err) {
        console.warn("highlightParcelsByContractStatus: query failed", query.where, err);
        break;
      }
      allFeatures = allFeatures.concat(pageResult.features);
      if (!pageResult.exceededTransferLimit || !pageResult.features.length) {
        break;
      }
      pageStart += pageResult.features.length;
    }

    console.log(
      `highlightParcelsByContractStatus [${statusValue}]: ${allFeatures.length} parcel(s) returned`,
      allFeatures.map((f) => f.attributes)
    );

    if (!this.dashboardHighlightLayer) {
      this.dashboardHighlightLayer = new GraphicsLayer({ title: "Dashboard Highlight", opacity: 0.85 });
      this.webMap?.add(this.dashboardHighlightLayer);
    }

    this.dashboardHighlightLayer.removeAll();
    if (!allFeatures.length) {
      console.warn("highlightParcelsByContractStatus: 0 features matched for", statusValue, "where:", query.where);
      return;
    }

    const [r, g, b] = this.parseHexColor(colorHex);
    const fillSymbol = new SimpleFillSymbol({
      // Use fully opaque fill so selection is solid and clearly visible.
      color: [r, g, b, 1],
      outline: new SimpleLineSymbol({ color: [r, g, b, 1], width: 2.5 }),
    });

    const graphics = allFeatures
      .filter((feature) => !!feature.geometry)
      .map((feature) => new Graphic({ geometry: feature.geometry, symbol: fillSymbol }));

    if (graphics.length) {
      this.dashboardHighlightLayer.addMany(graphics);
      // Ensure graphic layers render on top of basemap (especially in satellite modes).
      this.ensureGraphicLayersOnTop();
      console.log(`highlightParcelsByContractStatus: added ${graphics.length} polygon graphic(s) to map`);
      try {
        const extents = allFeatures
          .map((feat) => feat.geometry?.extent)
          .filter((extent): extent is Extent => !!extent);

        let combinedExtent: Extent | null = null;
        for (const ext of extents) {
          combinedExtent = combinedExtent ? combinedExtent.union(ext) : ext.clone();
        }

        if (combinedExtent) {
          await this.view.goTo(combinedExtent.expand(1.15), { animate: true });
        }
      } catch (err) {
        console.warn("highlightParcelsByContractStatus goTo failed", err);
      }

      try {
        if (!suppressFlash) {
          for (const graphic of graphics) {
            this.flashGraphic(graphic, 3, 320);
          }
        }
      } catch (err) {
        console.warn("highlightParcelsByContractStatus flash failed", err);
      }
    }
  }

  /**
   * Highlight parcels by a generic attribute value. The `fieldSubstrings` array is used to
   * detect which parcel layer fields to query (case-insensitive substring match).
   */
  async highlightParcelsByAttribute(
    attrValue: string,
    colorHex: string,
    fieldSubstrings: string[],
    suppressFlash = false
  ): Promise<void> {
    if (!this.parcelLayer || !this.view) return;
    if (!attrValue.trim()) { this.clearDashboardHighlights(); return; }

    await this.parcelLayer.load();
    // Use all string fields (editable/nullable do not affect queryability)
    const allStringFields = (this.parcelLayer.fields ?? []).filter(f => f.type === 'string');
    const allFieldNames = allStringFields.map(f => f.name);
    // Try to match field name OR alias substrings (case-insensitive)
    const lowered = fieldSubstrings.map(s => s.toLowerCase());
    const statusFields = allStringFields.filter(f => {
      const nameLower = f.name.toLowerCase();
      const aliasLower = String(f.alias ?? '').toLowerCase();
      return lowered.some(kw => nameLower.includes(kw) || aliasLower.includes(kw));
    }).map(f => f.name);
    // If no match, use all string fields
    const targetFields = statusFields.length ? statusFields : allFieldNames;
    if (!targetFields.length) {
      console.warn("[highlightParcelsByAttribute] No string fields found on parcel layer.", allFieldNames);
      this.clearDashboardHighlights();
      return;
    }

    // Escape single quotes and quote field names that contain spaces or special chars
    const safeValue = attrValue.replace(/'/g, "''");
    const quoteField = (name: string) => /[^A-Za-z0-9_]/.test(name) ? `"${name.replace(/"/g, '""')}"` : name;
    // Build WHERE clause with UPPER for case-insensitive match
    const where = targetFields.map(f => `UPPER(${quoteField(f)}) LIKE UPPER('%${safeValue}%')`).join(' OR ');
    console.log('[highlightParcelsByAttribute] WHERE:', where);

    const query = this.parcelLayer.createQuery();
    query.where = where;
    query.returnGeometry = true;
    query.outFields = ['*'];

    let allFeatures: Graphic[] = [];
    try {
      const result = await this.parcelLayer.queryFeatures(query);
      allFeatures = result.features;
      console.log(`[highlightParcelsByAttribute] [${attrValue}]: ${allFeatures.length} parcel(s)`);
    } catch (err) {
      console.error('[highlightParcelsByAttribute] Query failed:', err);
      // Fallback: try each field one by one
      allFeatures = await this.fallbackQueryOneByOne(this.parcelLayer, targetFields, safeValue);
    }

    if (!this.dashboardHighlightLayer) {
      this.dashboardHighlightLayer = new GraphicsLayer({ title: "Dashboard Highlight", opacity: 0.85 });
      this.webMap?.add(this.dashboardHighlightLayer);
    }
    this.dashboardHighlightLayer.removeAll();
    if (!allFeatures.length) {
      console.warn("[highlightParcelsByAttribute] 0 features matched for", attrValue, "where:", where);
      return;
    }

    const [r, g, b] = this.parseHexColor(colorHex);
    const fillSymbol = new SimpleFillSymbol({
      color: [r, g, b, 1],
      outline: new SimpleLineSymbol({ color: [r, g, b, 1], width: 2.5 }),
    });
    const graphics = allFeatures.filter(f => !!f.geometry).map(f => new Graphic({ geometry: f.geometry, symbol: fillSymbol }));
    if (graphics.length) {
      this.dashboardHighlightLayer.addMany(graphics);
      this.ensureGraphicLayersOnTop();
      console.log(`[highlightParcelsByAttribute] added ${graphics.length} polygon graphic(s) to map`);
      try {
        const extents = allFeatures.map(feat => feat.geometry?.extent).filter((extent): extent is Extent => !!extent);
        let combinedExtent: Extent | null = null;
        for (const ext of extents) {
          combinedExtent = combinedExtent ? combinedExtent.union(ext) : ext.clone();
        }
        if (combinedExtent) {
          await this.view.goTo(combinedExtent.expand(1.15), { animate: true });
        }
      } catch (err) {
        console.warn("highlightParcelsByAttribute goTo failed", err);
      }
      try {
        if (!suppressFlash) {
          for (const graphic of graphics) {
            this.flashGraphic(graphic, 3, 320);
          }
        }
      } catch (err) {
        console.warn("highlightParcelsByAttribute flash failed", err);
      }
    }
  }

  // Fallback: query each field separately and merge results
  private async fallbackQueryOneByOne(
    layer: FeatureLayer,
    fields: string[],
    safeValue: string
  ): Promise<Graphic[]> {
    const results: Graphic[] = [];
    const seenOIDs = new Set<number>();
    for (const field of fields) {
      try {
        const query = layer.createQuery();
        query.where = `${field} LIKE '%${safeValue}%'`;
        query.returnGeometry = true;
        query.outFields = ['*'];
        const result = await layer.queryFeatures(query);
        for (const feature of result.features) {
          const oid = feature.attributes[layer.objectIdField];
          if (!seenOIDs.has(oid)) {
            seenOIDs.add(oid);
            results.push(feature);
          }
        }
      } catch (fieldErr) {
        console.warn(`[fallbackQueryOneByOne] Field "${field}" not queryable, skipping.`, fieldErr);
      }
    }
    console.log(`[fallbackQueryOneByOne] Total unique parcels found: ${results.length}`);
    return results;
  }


  /**
   * Highlight parcels that match both a contract status and a zone (when provided).
   * If `zoneValue` is falsy, falls back to regular contract-status-only highlighting.
   */
  async highlightParcelsByContractStatusWithZone(
    zoneValue: string | null,
    statusValue: string,
    colorHex: string,
    statusFieldName?: string,
    zoneFieldName?: string,
    suppressFlash = false
  ): Promise<void> {
    if (!zoneValue) {
      return this.highlightParcelsByContractStatus(statusValue, colorHex, statusFieldName, suppressFlash);
    }
    if (!this.parcelLayer || !this.view) return;

    await this.parcelLayer.load();
    const normalizedStatus = statusValue.trim().replace(/'/g, "''").toUpperCase();
    const normalizedZone = zoneValue.trim().replace(/'/g, "''").toUpperCase();

    const allFields = (this.parcelLayer.fields ?? []).map((f) => String(f.name));

    const statusFields = statusFieldName
      ? [statusFieldName]
      : allFields.filter((name) => {
          const lower = name.toLowerCase();
          return lower.includes("contractstatus") || lower.includes("plotstatus");
        });

    const zoneFields = zoneFieldName
      ? [zoneFieldName]
      : allFields.filter((name) => {
          const lower = name.toLowerCase();
          return lower.includes("zone") || lower.includes("area") || lower.includes("sector") || lower.includes("masterplan");
        });

    const quotedField = (name: string): string => (/[^A-Za-z0-9_]/.test(name) ? `"${name}"` : name);

    const statusWhere = statusFields.map((f) => `UPPER(${quotedField(f)}) = '${normalizedStatus}'`);
    let zoneWhere: string[] = [];

    if (zoneFieldName) {
      const zoneFieldSql = /[^A-Za-z0-9_]/.test(zoneFieldName)
        ? `"${zoneFieldName.replace(/"/g, '"')}"`
        : zoneFieldName;
      zoneWhere = [`UPPER(${zoneFieldSql}) = '${normalizedZone}'`];
      console.log('[DASHBOARD] using canonical zone field:', zoneFieldName, 'sqlField:', zoneFieldSql, 'normalizedZone:', normalizedZone);
    } else {
      // Build zone WHERE parts: try full normalized zone, then individual tokens
      const zoneNormalizedForTokens = normalizedZone.replace(/[^A-Z0-9]+/g, " ");
      const zoneTokens = zoneNormalizedForTokens.split(/\s+/).filter(Boolean);
      // Filter out overly-generic tokens (common words that match too broadly)
      const STOP_TOKENS = new Set(['AREA', 'ZONE', 'PLOT', 'PLOTNO', 'PLOT#', 'MASTERPLAN', 'MASTERPLANZONEID', 'MM', 'PSH']);
      const zoneTokensFiltered = zoneTokens.filter(tok => tok.length > 2 && !STOP_TOKENS.has(tok));

      const zoneWhereParts: string[] = [];
      for (const f of zoneFields) {
        // full phrase match first
        zoneWhereParts.push(`UPPER(${quotedField(f)}) LIKE '%${normalizedZone}%'`);
        // individual filtered token matches
        for (const tok of zoneTokensFiltered) {
          zoneWhereParts.push(`UPPER(${quotedField(f)}) LIKE '%${tok}%'`);
        }
      }
      zoneWhere = zoneWhereParts;
      console.log('[DASHBOARD] zoneFields:', zoneFields, 'zoneTokens:', zoneTokens, 'filtered:', zoneTokensFiltered);
    }

    if (!statusWhere.length) {
      console.warn("highlightParcelsByContractStatusWithZone: no status fields", allFields);
      return this.clearDashboardHighlights();
    }

    if (!zoneWhere.length) {
      // no zone fields — fall back to status-only
      return this.highlightParcelsByContractStatus(statusValue, colorHex);
    }

    const where = `(${statusWhere.join(" OR ")}) AND (${zoneWhere.join(" OR ")})`;
    console.log('[DASHBOARD] highlightParcelsByContractStatusWithZone WHERE:', where);

    const query = this.parcelLayer.createQuery();
    query.where = where;
    query.outFields = ["*"];
    query.returnGeometry = true;
    query.num = 2000;
    query.start = 0;

    let allFeatures: Graphic[] = [];
    let pageStart = 0;
    while (true) {
      query.start = pageStart;
      let pageResult;
      try {
        pageResult = await this.parcelLayer.queryFeatures(query);
      } catch (err) {
        console.warn("highlightParcelsByContractStatusWithZone: query failed", query.where, err);
        break;
      }
      allFeatures = allFeatures.concat(pageResult.features);
      if (!pageResult.exceededTransferLimit || !pageResult.features.length) break;
      pageStart += pageResult.features.length;
    }

    console.log(`highlightParcelsByContractStatusWithZone [${statusValue}] in [${zoneValue}]: ${allFeatures.length}`);

    if (!this.dashboardHighlightLayer) {
      this.dashboardHighlightLayer = new GraphicsLayer({ title: "Dashboard Highlight", opacity: 0.85 });
      this.webMap?.add(this.dashboardHighlightLayer);
    }
    this.dashboardHighlightLayer.removeAll();
    if (!allFeatures.length) {
      console.warn("highlightParcelsByContractStatusWithZone: 0 features matched", where);
      return;
    }

    const [r, g, b] = this.parseHexColor(colorHex);
    const fillSymbol = new SimpleFillSymbol({ color: [r, g, b, 1], outline: new SimpleLineSymbol({ color: [r, g, b, 1], width: 2.5 }) });

    const graphics = allFeatures.filter((f) => !!f.geometry).map((f) => new Graphic({ geometry: f.geometry, symbol: fillSymbol }));
    if (graphics.length) {
      this.dashboardHighlightLayer.addMany(graphics);
      this.ensureGraphicLayersOnTop();
      try {
        const extents = allFeatures.map((feat) => feat.geometry?.extent).filter((e): e is Extent => !!e);
        let combined: Extent | null = null;
        for (const e of extents) combined = combined ? combined.union(e) : e.clone();
        if (combined) await this.view.goTo(combined.expand(1.15), { animate: true });
      } catch (err) {
        console.warn("highlightParcelsByContractStatusWithZone goTo failed", err);
      }
      try {
        if (!suppressFlash) {
          for (const graphic of graphics) {
            this.flashGraphic(graphic, 3, 320);
          }
        }
      } catch (err) {
        console.warn("highlightParcelsByContractStatusWithZone flash failed", err);
      }
    }
  }

  private parseHexColor(hex: string): [number, number, number] {
    const normalized = hex.replace(/^#/, "");
    const value = normalized.length === 3
      ? normalized.split("").map((txt) => txt + txt).join("")
      : normalized;
    const r = parseInt(value.slice(0, 2), 16);
    const g = parseInt(value.slice(2, 4), 16);
    const b = parseInt(value.slice(4, 6), 16);
    return [r, g, b];
  }

  private ensureGraphicLayersOnTop(): void {
    if (!this.webMap) return;
    const layersToKeep = [
      this.plotSheetOutlineLayer,
      this.vertexLayer,
      this.dashboardHighlightLayer,
      this.atmLayer,
      this.branchLayer,
      this.highlightLayer,
      this.labelsLayer,
    ];

    for (const layer of layersToKeep) {
      if (!layer) continue;
      try {
        const exists = this.webMap.allLayers.toArray().includes(layer);
        if (exists) {
          this.webMap.remove(layer);
        }
        this.webMap.add(layer);
        layer.visible = true;
      } catch (e) {
        console.warn("ensureGraphicLayersOnTop failed for layer", layer, e);
      }
    }
  }

  setLabelMode(mode: "current" | "all"): void {
    this.labelMode = mode;
    this.applyLabelsForCurrentMode();
  }

  getLabelMode(): "current" | "all" {
    return this.labelMode;
  }

  // ─── Basemap toggle (Webmap ↔ Satellite-only) ────────────────────────────

  /**
   * Toggle the underlying basemap.
   *  - "webmap"   → restore the original WebMap basemap and re-show all
   *                 operational layers that were hidden in satellite mode.
   *  - "satellite" → swap to a basemap consisting of the GISDATAOWNER
   *                  Satellite_Images ImageServer and hide the WebMap's
   *                  operational (landuse / transportation) layers so only
   *                  the satellite imagery + parcel/highlight/label graphics
   *                  remain visible.
   */
  setBasemapMode(mode: "webmap" | "satellite"): void {
    if (!this.webMap) return;
    if (this.basemapMode === mode) return;
    this.basemapMode = mode;

    if (mode === "satellite") {
      this.webMap.basemap = this.getGoogleSatelliteBasemap();

      // Hide the webmap's operational layers (landuse colors, etc.) but
      // keep our own layers (parcel feature layer, highlight, labels).
      const ourTitles = new Set(["Selected Plot", "Plot Labels", "ATMs", "Branches"]);
      this.hiddenLayerIds = [];
      this.webMap.layers.forEach((layer: any) => {
        if (layer === this.parcelLayer) return;
        if (ourTitles.has(layer.title)) return;
        if (layer.visible) {
          this.hiddenLayerIds.push(layer.id);
          layer.visible = false;
        }
      });
      // Ensure our graphic layers (highlights, labels) remain visible and render on top.
      this.ensureGraphicLayersOnTop();
    } else {
      if (this.originalBasemap) {
        this.webMap.basemap = this.originalBasemap;
      }
      const idsToRestore = new Set(this.hiddenLayerIds);
      this.webMap.layers.forEach((layer: any) => {
        if (idsToRestore.has(layer.id)) layer.visible = true;
      });
      this.hiddenLayerIds = [];
    }
  }

  getBasemapMode(): "webmap" | "satellite" {
    return this.basemapMode;
  }

  /**
   * Restore the default webmap view (restore basemap + show all operational layers).
   */
  applyDefaultView(): void {
    if (!this.webMap) return;
    // Restore the startup Google Streets basemap and show layers that may have been hidden.
    this.webMap.basemap = this.originalBasemap ?? this.getGoogleStreetsBasemap();
    this.webMap.layers.forEach((layer: any) => {
      layer.visible = true;
    });
    this.hiddenLayerIds = [];
    this.basemapMode = "webmap";
  }

  /**
   * Show satellite imagery as the basemap while keeping the webmap's operational
   * layers (landuse/transportation) visible so user sees land symbology over
   * the satellite imagery.
   */
  applyLandAndSatelliteView(): void {
    if (!this.webMap) return;
    this.webMap.basemap = this.getGoogleSatelliteBasemap();
    // Ensure operational layers remain visible
    this.webMap.layers.forEach((layer: any) => {
      if (layer === this.parcelLayer) return;
      if (layer.title === "Selected Plot" || layer.title === "Plot Labels") return;
      layer.visible = true;
    });
    this.hiddenLayerIds = [];
    this.basemapMode = "satellite";
  }

  /**
   * Show satellite basemap and hide all operational layers except parcel / highlight / labels.
   * Useful when user wants to see only the selected parcel over imagery.
   */
  applySatelliteParcelOnlyView(): void {
    if (!this.webMap) return;
    this.webMap.basemap = this.getGoogleHybridBasemap();
    // Show only satellite + our graphic highlight layers.
    const keepLayers = new Set([
      this.highlightLayer?.id,
      this.dashboardHighlightLayer?.id,
      this.labelsLayer?.id,
      this.plotSheetOutlineLayer?.id,
      this.vertexLayer?.id,
      this.atmLayer?.id,
      this.branchLayer?.id,
    ]);
    this.hiddenLayerIds = [];
    this.webMap.layers.forEach((layer: any) => {
      // hide everything except our graphic layers
      if (layer && keepLayers.has(layer.id)) {
        layer.visible = true;
        return;
      }
      if (layer.id) this.hiddenLayerIds.push(layer.id);
      layer.visible = false;
    });
    this.basemapMode = "satellite";
    // Bring our graphic layers to top and ensure visible
    this.ensureGraphicLayersOnTop();
  }

  /**
   * Show satellite basemap and hide all operational layers including plot labels
   * and selected-plot graphics. This leaves only the base satellite imagery.
   */
  applySatelliteOnlyView(): void {
    if (!this.webMap) return;
    this.webMap.basemap = this.getGoogleSatelliteBasemap();
    this.webMap.layers.forEach((layer: any) => {
      // keep ATM and branch markers visible over the satellite imagery
      if (layer === this.atmLayer || layer === this.branchLayer) {
        layer.visible = true;
        return;
      }
      // hide all layers except the basemap layers (basemap layers are not in webMap.layers)
      layer.visible = false;
      if (layer.id) this.hiddenLayerIds.push(layer.id);
    });
    // Keep our graphic layers present but hidden; they will be shown when a dashboard action adds graphics.
    if (this.highlightLayer) this.highlightLayer.visible = false;
    if (this.dashboardHighlightLayer) this.dashboardHighlightLayer.visible = false;
    if (this.labelsLayer) this.labelsLayer.visible = false;
    this.basemapMode = "satellite";
  }

  /**
   * If a parcel is currently selected, re-apply a prominent red outline
   * to the selection so it stands out over imagery.
   */
  applyRedHighlightForCurrentSelection(): void {
    const parcel = this.selectedParcelSubject.getValue();
    if (!parcel) return;

    // Ensure we have a polygon geometry to draw. Prefer the cached currentSelectedPolygon
    // but fall back to the parcel.geometry if needed.
    let polygonGeom = this.currentSelectedPolygon;
    if (!polygonGeom && parcel.geometry) {
      const geom = parcel.geometry as any;
      if (geom.type === "Polygon") {
        polygonGeom = new Polygon({ rings: geom.coordinates as any, spatialReference: { wkid: 4326 } });
      } else if (geom.type === "MultiPolygon") {
        // flatten into rings
        const rings = (geom.coordinates as any).flat();
        polygonGeom = new Polygon({ rings, spatialReference: { wkid: 4326 } });
      }
    }
    if (!polygonGeom) return;

    if (!this.highlightLayer) {
      this.highlightLayer = new GraphicsLayer({ title: "Selected Plot", id: "selected-plot-red" });
      this.webMap?.add(this.highlightLayer);
    }

    // Ensure the highlight layer is visible and on top
    this.highlightLayer.visible = true;
    this.highlightLayer.removeAll();

    const redSymbol = new SimpleFillSymbol({
      color: [220, 53, 69, 0.12],
      outline: new SimpleLineSymbol({ color: [200, 35, 51, 1], width: 4 }),
    });

    this.highlightLayer.add(new Graphic({ geometry: polygonGeom, symbol: redSymbol }));
  }

  // ─── Screenshot ───────────────────────────────────────────────────────────

  async takeMapScreenshot(width = 1600, height = 900): Promise<string> {
    if (!this.view) throw new Error("Map view is not ready.");
    await this.view.when();
    const screenshot = await this.view.takeScreenshot({ format: "jpg", quality: 90, width, height });
    return screenshot.dataUrl;
  }

  getCurrentViewState(): { zoom: number | null; scale: number | null } {
    return {
      zoom: this.view && Number.isFinite(this.view.zoom) ? this.view.zoom : null,
      scale: this.view && Number.isFinite(this.view.scale) ? this.view.scale : null,
    };
  }

  async takePlotSheetScreenshot(parcel: Parcel, width = 1600, height = 900): Promise<string> {
    if (!this.view || !this.webMap || !this.parcelLayer) {
      throw new Error("Map view is not ready.");
    }

    await this.view.when();

    const originalBasemap = this.webMap.basemap ?? undefined;
    const layerSnapshot = this.webMap.layers.toArray().map((layer) => ({ layer, visible: layer.visible }));
    const blankBasemap = new Basemap({ baseLayers: [], title: "Blank" });

    if (!this.plotSheetOutlineLayer) {
      this.plotSheetOutlineLayer = new GraphicsLayer({ title: "Plot Sheet Outline", id: "plot-sheet-outline" });
    }
    this.plotSheetOutlineLayer.removeAll();
    if (!this.webMap.allLayers.toArray().includes(this.plotSheetOutlineLayer)) {
      this.webMap.add(this.plotSheetOutlineLayer);
    }

    try {
      this.webMap.basemap = blankBasemap;
      for (const { layer } of layerSnapshot) {
        layer.visible = false;
      }

      await this.buildPlotSheetOutlines(parcel);
      await this.view.whenLayerView(this.plotSheetOutlineLayer);
      await reactiveUtils.whenOnce(() => !!this.view && !this.view.updating);
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

      const screenshot = await this.view.takeScreenshot({
        format: "jpg",
        quality: 90,
        width,
        height,
      });
      return screenshot.dataUrl;
    } finally {
      this.plotSheetOutlineLayer?.removeAll();
      if (this.webMap.allLayers.toArray().includes(this.plotSheetOutlineLayer)) {
        this.webMap.remove(this.plotSheetOutlineLayer);
      }

      this.webMap.basemap = originalBasemap;
      for (const { layer, visible } of layerSnapshot) {
        layer.visible = visible;
      }
    }
  }

  async addVertexMarkersAndLabels(
    geometry: { type: string; coordinates: unknown },
    plotLabel: string = ""
  ): Promise<number> {
    if (!this.view || !this.webMap) return 0;

    if (!this.vertexLayer) {
      this.vertexLayer = new GraphicsLayer({ title: "Plot Vertices" });
      this.webMap.add(this.vertexLayer);
    }
    this.vertexLayer.removeAll();

    let rings: number[][][] = [];
    if (geometry.type === "Polygon") {
      rings = geometry.coordinates as number[][][];
    } else if (geometry.type === "MultiPolygon") {
      rings = (geometry.coordinates as number[][][][]).flat();
    } else {
      return 0;
    }
    if (!rings.length) return 0;

    const ring = rings[0];
    const points =
      ring.length > 1 &&
      ring[0][0] === ring[ring.length - 1][0] &&
      ring[0][1] === ring[ring.length - 1][1]
        ? ring.slice(0, -1)
        : ring;

    // Draw segment edges in red and label each segment length (meters).
    for (let i = 0; i < points.length; i++) {
      const from = points[i];
      const to = points[(i + 1) % points.length];

      const segment = new Polyline({
        paths: [[[from[0], from[1]], [to[0], to[1]]]],
        spatialReference: { wkid: 4326 },
      });

      const lengthMeters = geometryEngine.geodesicLength(segment, "meters");
      const segmentLabel = Number.isFinite(lengthMeters) ? `${Math.round(lengthMeters as number)}` : "-";

      this.vertexLayer?.add(
        new Graphic({
          geometry: segment,
          symbol: {
            type: "simple-line",
            style: "dash",
            color: [222, 45, 38, 1],
            width: 1.2,
          } as any,
        })
      );

      const midPoint = new Point({
        x: (from[0] + to[0]) / 2,
        y: (from[1] + to[1]) / 2,
        spatialReference: { wkid: 4326 },
      });

      this.vertexLayer?.add(
        new Graphic({
          geometry: midPoint,
          symbol: new TextSymbol({
            text: segmentLabel,
            color: [222, 45, 38, 1],
            haloColor: [255, 255, 255, 0.95],
            haloSize: 2,
            font: { size: 13, weight: "normal", family: "Arial" },
            yoffset: 10,
          }),
        })
      );
    }

    points.forEach((coord, idx) => {
      const pt = new Point({
        x: coord[0],
        y: coord[1],
        spatialReference: { wkid: 4326 },
      });

      const marker = new Graphic({
        geometry: pt,
        symbol: {
          type: "simple-marker",
          style: "circle",
          color: [255, 255, 255, 1],
          size: 12,
          outline: { color: [0, 0, 0, 1], width: 2.2 },
        } as any,
      });

      const label = new Graphic({
        geometry: pt,
        symbol: new TextSymbol({
          text: String(idx + 1),
          color: [20, 20, 20, 1],
          haloColor: [255, 255, 255, 0.9],
          haloSize: 2,
          font: { size: 14, weight: "normal", family: "Arial" },
          yoffset: -20,
        }),
      });

      this.vertexLayer?.add(marker);
      this.vertexLayer?.add(label);
    });

    console.log("Plot Sheet: vertex markers/labels added", {
      plot: plotLabel,
      vertices: points.length,
      points,
    });

    // Wait for the graphics layer to render before taking screenshot.
    await this.view.whenLayerView(this.vertexLayer);
    await reactiveUtils.whenOnce(() => !!this.view && !this.view.updating);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    return points.length;
  }

  removeVertexMarkersAndLabels(): void {
    this.vertexLayer?.removeAll();
  }

  private async buildPlotSheetOutlines(parcel: Parcel): Promise<void> {
    if (!this.plotSheetOutlineLayer || !this.parcelLayer || !this.view) return;

    const query = this.parcelLayer.createQuery();
    query.where = "1=1";
    query.outFields = ["*"];
    query.returnGeometry = true;
    query.num = 2000;
    if (this.view.extent) {
      query.geometry = this.view.extent;
      query.spatialRelationship = "intersects";
    }

    const result = await this.parcelLayer.queryFeatures(query);
    const selectedKey = this.normalizeParcelKey(parcel);
    const blackOutline = new SimpleFillSymbol({
      color: [0, 0, 0, 0],
      outline: new SimpleLineSymbol({ color: [0, 0, 0, 1], width: 1 }),
    });
    const redOutline = new SimpleFillSymbol({
      color: [0, 0, 0, 0],
      outline: new SimpleLineSymbol({ color: [222, 45, 38, 1], width: 2, style: "dash" as any }),
    });
    const selectedHatchFill = new SimpleFillSymbol({
      color: [0, 0, 0, 1],
      outline: new SimpleLineSymbol({ color: [0, 0, 0, 0], width: 0 }),
      style: "diagonal-cross" as any,
    });
    const grayBackdrop = new SimpleFillSymbol({
      color: [235, 235, 235, 1],
      outline: new SimpleLineSymbol({ color: [235, 235, 235, 0], width: 0 }),
    });

    if (this.view.extent) {
      this.plotSheetOutlineLayer.add(
        new Graphic({
          geometry: this.extentToPolygon(this.view.extent),
          symbol: grayBackdrop,
        })
      );
    }

    let selectedGeometry: any | undefined;
    for (const feature of result.features) {
      const featureKey = this.normalizeFeatureKey(feature.attributes);
      if (featureKey && selectedKey && featureKey === selectedKey) {
        selectedGeometry = feature.geometry;
        continue;
      }

      if (feature.geometry) {
        this.plotSheetOutlineLayer.add(
          new Graphic({
            geometry: feature.geometry,
            symbol: blackOutline,
          })
        );
      }
    }

    const selectedPolygon = this.parcelGeometryToPolygon(parcel.geometry as any);
    const geometryToDraw = selectedPolygon ?? selectedGeometry;
    if (geometryToDraw) {
      let labelPolygon = geometryToDraw as Polygon;

      // Draw red dashed outline for original parcel (no hatch fill)
      this.plotSheetOutlineLayer.add(
        new Graphic({
          geometry: geometryToDraw,
          symbol: redOutline,
        })
      );

      await this.addSelectedParcelAnnotations(parcel, geometryToDraw);

      // Add 3-meter inward buffer polygon in blue with hatch fill
      try {
        console.log("Creating 3-meter buffer from geometry:", geometryToDraw);
        // Project geometry to Web Mercator for accurate meter-based buffering
        const projectedGeom = webMercatorUtils.geographicToWebMercator(geometryToDraw) as Polygon;
        const bufferedProjected = geometryEngine.buffer(projectedGeom, -3, "meters") as Polygon;
        // Project back to geographic (WGS84)
        const bufferedGeometry = webMercatorUtils.webMercatorToGeographic(bufferedProjected) as Polygon;
        
        console.log("Buffered geometry result:", bufferedGeometry);
        if (bufferedGeometry) {
          // Add hatch fill inside the blue buffer polygon
          this.plotSheetOutlineLayer.add(
            new Graphic({
              geometry: bufferedGeometry,
              symbol: selectedHatchFill,
            })
          );

          // Add blue outline for the buffer polygon
          const blueBufferOutline = new SimpleFillSymbol({
            color: [0, 0, 0, 0],
            outline: new SimpleLineSymbol({ color: [0, 112, 192, 1], width: 2.5 }),
          });
          this.plotSheetOutlineLayer.add(
            new Graphic({
              geometry: bufferedGeometry,
              symbol: blueBufferOutline,
            })
          );
          labelPolygon = bufferedGeometry;
          console.log("Blue buffer polygon with hatch fill added to layer");
        } else {
          console.warn("Buffer geometry is null or undefined");
        }
      } catch (e) {
        console.warn("Failed to create buffer polygon:", e);
      }

      // Draw cover-area label last so it stays in front of all polygon graphics.
      this.addCoverAreaLabel(parcel, labelPolygon);
    }

    // Draw north arrow + scale bar last so they appear on top of all map graphics.
    if (this.view?.extent) {
      this.addPlotSheetMapElements(this.view.extent);
    }
  }

  private async addSelectedParcelAnnotations(parcel: Parcel, polygon: Polygon): Promise<void> {
    if (!this.plotSheetOutlineLayer) return;

    const rings = polygon.rings?.[0] ?? [];
    if (!rings.length) return;

    const points =
      rings.length > 1 &&
      rings[0][0] === rings[rings.length - 1][0] &&
      rings[0][1] === rings[rings.length - 1][1]
        ? rings.slice(0, -1)
        : rings;

    for (let i = 0; i < points.length; i++) {
      const from = points[i];
      const to = points[(i + 1) % points.length];

      if (
        !Number.isFinite(from[0]) ||
        !Number.isFinite(from[1]) ||
        !Number.isFinite(to[0]) ||
        !Number.isFinite(to[1])
      ) {
        console.warn("Skipping invalid plot segment coordinates", { from, to });
        continue;
      }

      const segment = new Polyline({
        paths: [[[from[0], from[1]], [to[0], to[1]]]],
        spatialReference: polygon.spatialReference,
      });

      let segmentLabel = "-";
      try {
        const lengthMeters = geometryEngine.geodesicLength(segment, "meters");
        if (Number.isFinite(lengthMeters)) {
          segmentLabel = `${Math.round(lengthMeters as number)}`;
        }
      } catch (err) {
        console.warn("geometryEngine.geodesicLength failed for plot segment", err, { from, to, spatialReference: polygon.spatialReference });
      }

      this.plotSheetOutlineLayer.add(
        new Graphic({
          geometry: segment,
          symbol: {
            type: "simple-line",
            style: "dash",
            color: [222, 45, 38, 1],
            width: 1.2,
          } as any,
        })
      );

      const midPoint = new Point({
        x: (from[0] + to[0]) / 2,
        y: (from[1] + to[1]) / 2,
        spatialReference: polygon.spatialReference,
      });

      this.plotSheetOutlineLayer.add(
        new Graphic({
          geometry: midPoint,
          symbol: new TextSymbol({
            text: segmentLabel,
            color: [222, 45, 38, 1],
            haloColor: [235, 235, 235, 1],
            haloSize: 2,
            font: { size: 12, weight: "normal", family: "Arial" },
            yoffset: 10,
          }),
        })
      );
    }

    points.forEach((coord, idx) => {
      const pt = new Point({
        x: coord[0],
        y: coord[1],
        spatialReference: polygon.spatialReference,
      });

      this.plotSheetOutlineLayer?.add(
        new Graphic({
          geometry: pt,
          symbol: {
            type: "simple-marker",
            style: "circle",
            color: [255, 255, 255, 1],
            size: 11,
            outline: { color: [0, 0, 0, 1], width: 2 },
          } as any,
        })
      );

      this.plotSheetOutlineLayer?.add(
        new Graphic({
          geometry: pt,
          symbol: new TextSymbol({
            text: String(idx + 1),
            color: [0, 0, 0, 1],
            haloColor: [235, 235, 235, 1],
            haloSize: 2,
            font: { size: 13, weight: "normal", family: "Arial" },
            yoffset: -18,
          }),
        })
      );
    });

  }

  private addCoverAreaLabel(parcel: Parcel, polygon: Polygon): void {
    if (!this.plotSheetOutlineLayer) return;

    const center = polygon.centroid ?? polygon.extent?.center;
    if (!center) return;

    const areaText = this.formatParcelArea(parcel);
    const typeText = this.pickParcelType(parcel);
    const labelText = `${areaText}\n${typeText}`.trim();

    const extent = polygon.extent;
    const labelPoint = extent
      ? new Point({
          x: extent.center.x,
          y: extent.ymax - (extent.height * 0.45),
          spatialReference: polygon.spatialReference,
        })
      : center;

    this.plotSheetOutlineLayer.add(
      new Graphic({
        geometry: labelPoint,
        symbol: new TextSymbol({
          text: labelText,
          color: [90, 90, 90, 1],
          haloColor: [255, 255, 255, 1],
          haloSize: 5,
          font: { size: 18, weight: "normal", family: "Arial" },
          yoffset: 0,
        }),
      })
    );
  }

  private extentToPolygon(extent: Extent): Polygon {
    return new Polygon({
      rings: [[
        [extent.xmin, extent.ymin],
        [extent.xmin, extent.ymax],
        [extent.xmax, extent.ymax],
        [extent.xmax, extent.ymin],
        [extent.xmin, extent.ymin],
      ]],
      spatialReference: extent.spatialReference,
    });
  }

  private addPlotSheetMapElements(extent: Extent): void {
    if (!this.plotSheetOutlineLayer) return;

    const width = extent.xmax - extent.xmin;
    const height = extent.ymax - extent.ymin;
    if (!width || !height) return;

    console.log("[PlotSheet] Drawing north arrow + scale bar on extent:", {
      xmin: extent.xmin, ymin: extent.ymin, xmax: extent.xmax, ymax: extent.ymax,
      width, height,
    });

    // North arrow near top-left.
    const northX = extent.xmin + width * 0.12;
    const northTipY = extent.ymax - height * 0.12;
    const northBaseY = northTipY - height * 0.1;

    this.plotSheetOutlineLayer.add(
      new Graphic({
        geometry: new Polyline({
          paths: [[[northX, northBaseY], [northX, northTipY - height * 0.015]]],
          spatialReference: extent.spatialReference,
        }),
        symbol: {
          type: "simple-line",
          style: "solid",
          color: [20, 20, 20, 1],
          width: 2,
        } as any,
      })
    );

    this.plotSheetOutlineLayer.add(
      new Graphic({
        geometry: new Point({ x: northX, y: northTipY, spatialReference: extent.spatialReference }),
        symbol: {
          type: "simple-marker",
          style: "triangle",
          color: [20, 20, 20, 1],
          size: 10,
          outline: { color: [20, 20, 20, 1], width: 1 },
        } as any,
      })
    );

    this.plotSheetOutlineLayer.add(
      new Graphic({
        geometry: new Point({ x: northX, y: northTipY, spatialReference: extent.spatialReference }),
        symbol: new TextSymbol({
          text: "N",
          color: [20, 20, 20, 1],
          haloColor: [255, 255, 255, 1],
          haloSize: 1.5,
          font: { size: 12, weight: "bold", family: "Arial" },
          yoffset: 15,
        }),
      })
    );

    // Scale bar near bottom-left.
    const barY = extent.ymin + height * 0.12;
    const barX0 = extent.xmin + width * 0.12;

    const fullWidthLine = new Polyline({
      paths: [[[extent.xmin, barY], [extent.xmax, barY]]],
      spatialReference: extent.spatialReference,
    });
    const fullWidthMeters = Number(geometryEngine.geodesicLength(fullWidthLine, "meters") || 0);
    if (!Number.isFinite(fullWidthMeters) || fullWidthMeters <= 0) return;

    // Use a shorter, normal-length scale bar.
    const targetMeters = fullWidthMeters * 0.12;
    const niceMeters = this.roundScaleLength(targetMeters);
    const barWidthMapUnits = (niceMeters / fullWidthMeters) * width;
    const barX1 = barX0 + barWidthMapUnits;
    const tickSize = height * 0.012;

    this.plotSheetOutlineLayer.add(
      new Graphic({
        geometry: new Polyline({
          paths: [[[barX0, barY], [barX1, barY]]],
          spatialReference: extent.spatialReference,
        }),
        symbol: {
          type: "simple-line",
          style: "solid",
          color: [20, 20, 20, 1],
          width: 2,
        } as any,
      })
    );

    this.plotSheetOutlineLayer.add(
      new Graphic({
        geometry: new Polyline({
          paths: [[[barX0, barY - tickSize], [barX0, barY + tickSize]]],
          spatialReference: extent.spatialReference,
        }),
        symbol: {
          type: "simple-line",
          style: "solid",
          color: [20, 20, 20, 1],
          width: 2,
        } as any,
      })
    );

    this.plotSheetOutlineLayer.add(
      new Graphic({
        geometry: new Polyline({
          paths: [[[barX1, barY - tickSize], [barX1, barY + tickSize]]],
          spatialReference: extent.spatialReference,
        }),
        symbol: {
          type: "simple-line",
          style: "solid",
          color: [20, 20, 20, 1],
          width: 2,
        } as any,
      })
    );

    const barLabelPoint = new Point({
      x: (barX0 + barX1) / 2,
      y: barY + tickSize + height * 0.015,
      spatialReference: extent.spatialReference,
    });

    this.plotSheetOutlineLayer.add(
      new Graphic({
        geometry: barLabelPoint,
        symbol: new TextSymbol({
          text: `0   ${Math.round(niceMeters)} m`,
          color: [20, 20, 20, 1],
          haloColor: [255, 255, 255, 1],
          haloSize: 1.5,
          font: { size: 11, weight: "normal", family: "Arial" },
          yoffset: 0,
        }),
      })
    );

    console.log("[PlotSheet] North arrow + scale bar drawn. Scale bar length:", Math.round(niceMeters), "m");
  }

  private roundScaleLength(meters: number): number {
    if (!Number.isFinite(meters) || meters <= 0) return 10;
    const magnitude = Math.pow(10, Math.floor(Math.log10(meters)));
    const normalized = meters / magnitude;

    let rounded = 1;
    if (normalized > 5) rounded = 10;
    else if (normalized > 2) rounded = 5;
    else if (normalized > 1) rounded = 2;

    return rounded * magnitude;
  }

  private normalizeParcelKey(parcel: Parcel): string {
    return [parcel.displayName, parcel.id, parcel.objectId]
      .map((value) => `${value ?? ""}`.trim().toUpperCase())
      .find((value) => value.length > 0) ?? "";
  }

  private normalizeFeatureKey(attributes: Record<string, unknown> | undefined): string {
    if (!attributes) return "";
    const candidates = [attributes[PLOT_ID_FIELD], attributes["OBJECTID"], attributes["ObjectID"]];
    for (const candidate of candidates) {
      const normalized = `${candidate ?? ""}`.trim().toUpperCase();
      if (normalized) return normalized;
    }
    return "";
  }

  private parcelGeometryToPolygon(geometry?: { type: string; coordinates: unknown }): Polygon | undefined {
    if (!geometry) return undefined;

    if ((geometry as any).rings) {
      return geometry as unknown as Polygon;
    }

    let rings: number[][][] = [];
    if (geometry.type === "Polygon") {
      rings = geometry.coordinates as number[][][];
    } else if (geometry.type === "MultiPolygon") {
      rings = (geometry.coordinates as number[][][][]).flat();
    } else {
      return undefined;
    }

    return new Polygon({ rings, spatialReference: { wkid: 4326 } });
  }

  private pickParcelType(parcel: Parcel): string {
    const attrs = (parcel.attributes ?? {}) as Record<string, unknown>;
    const candidates = [
      attrs["Landuse (English)"],
      attrs["Sub Landuse"],
      attrs["LandUseCategory"],
      attrs["Land Use"],
      attrs["Plot Status"],
    ];

    for (const candidate of candidates) {
      const value = `${candidate ?? ""}`.trim();
      if (value) return value;
    }

    return "Residential";
  }

  private formatParcelArea(parcel: Parcel): string {
    const attrs = (parcel.attributes ?? {}) as Record<string, unknown>;
    const candidates = [attrs["PSh Area (m²)"], attrs["Shape_Area"], attrs["Area"]];

    for (const candidate of candidates) {
      if (candidate === undefined || candidate === null) continue;
      const numeric = Number(String(candidate).replace(/,/g, ""));
      if (Number.isFinite(numeric)) {
        return `${numeric.toFixed(2)} sq m`;
      }
      const text = String(candidate).trim();
      if (text) {
        return text;
      }
    }

    return "—";
  }

  // ─── 3D Scene ─────────────────────────────────────────────────────────────

  async initializeScene(container: HTMLDivElement): Promise<void> {
    if (this.sceneView) {
      if (this.sceneView.container !== container) {
        try {
          this.sceneView.container = container;
        } catch (err) {
          console.warn('[dq-basemap] failed to reattach SceneView container, recreating scene view', err);
          this.sceneView.destroy();
          this.sceneView = undefined;
          this.sceneInitPromise = undefined;
          return this.initializeScene(container);
        }
      }
      return;
    }
    if (!this.mapConfig) throw new Error("MapConfig not initialized.");

    if (!this.sceneInitPromise) {
      this.sceneInitPromise = (async () => {
        const sceneId = this.mapConfig!.webSceneId ?? (await this.resolveWebSceneId());
        if (!sceneId) {
          throw new Error("Could not resolve a WebScene id (set webSceneId or instantAppId in MapConfig).");
        }
        this.webScene = new WebScene({
          portalItem: {
            id: sceneId,
            portal: { url: this.mapConfig!.portalUrl },
          },
        });
        this.sceneView = new SceneView({ container, map: this.webScene });
        await this.sceneView.when();
        this.sceneHighlightLayer = new GraphicsLayer({ title: "Selected Plot (3D)" });
        this.webScene.add(this.sceneHighlightLayer);
      })();
    }
    await this.sceneInitPromise;
  }

  // Expose the current SceneView for consumers that need to reuse the main view.
  getSceneView(): SceneView | undefined {
    return this.sceneView;
  }

  // Expose the current MapView for external services that need to add layers or navigate.
  getMapView(): MapView | undefined {
    return this.view;
  }

  /**
   * Get utility category counts from King Fahd utilities layer.
   * Returns a Map of category name -> count.
   */
  getKingFahdUtilityCategoryCounts(): Map<string, number> {
    return new Map(this.kingFahdUtilityCategoryCounts);
  }

  // Expose the current WebMap for external services that need to add layers.
  getWebMap(): WebMap | undefined {
    return this.webMap;
  }

  syncMapToScene(): void {
    if (this.view && this.sceneView && this.view.viewpoint) {
      try { this.sceneView.viewpoint = this.view.viewpoint.clone(); } catch { /* ignore */ }
    }
  }

  syncSceneToMap(): void {
    if (this.view && this.sceneView && this.sceneView.viewpoint) {
      try { this.view.viewpoint = this.sceneView.viewpoint.clone(); } catch { /* ignore */ }
    }
  }

  async zoomSceneToParcel(parcel: Parcel): Promise<void> {
    if (!this.sceneView || !parcel.geometry) return;
    const geom = parcel.geometry as { type: string; coordinates: unknown };
    let rings: number[][][] = [];
    if (geom.type === "Polygon")      rings = geom.coordinates as number[][][];
    else if (geom.type === "MultiPolygon") rings = (geom.coordinates as number[][][][]).flat();
    else return;

    const polygon = new Polygon({ rings, spatialReference: { wkid: 4326 } });
    if (this.sceneHighlightLayer) {
      this.sceneHighlightLayer.removeAll();
      this.sceneHighlightLayer.add(
        new Graphic({ geometry: polygon, symbol: this.createHighlightSymbol(parcel, 0.45) })
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

  // ─── Kroki mini-map ───────────────────────────────────────────────────────

  async initializeKrokiMap(
    container: HTMLDivElement,
    parcel: Parcel,
    basemap: "satellite" | "blank" = "satellite"
  ): Promise<void> {
    this.destroyKrokiMap();
    this.krokiMap = new EsriMap({
      basemap: basemap === "satellite"
        ? this.getSatelliteBasemap()
        : new Basemap({ baseLayers: [], title: "Blank", id: "blank" }),
    });
    this.krokiHighlightLayer = new GraphicsLayer({ title: "Kroki Plot" });
    this.krokiMap.add(this.krokiHighlightLayer);
    this.krokiView = new MapView({ container, map: this.krokiMap, ui: { components: ["zoom"] } });
    await this.krokiView.when();
    this.drawKrokiParcel(parcel);
  }

  setKrokiBasemap(basemap: "satellite" | "blank"): void {
    if (!this.krokiMap) return;
    this.krokiMap.basemap = basemap === "satellite"
      ? this.getSatelliteBasemap()
      : new Basemap({ baseLayers: [], title: "Blank", id: "blank" });
  }

  private getSatelliteBasemap(): Basemap {
    return this.getGoogleSatelliteBasemap();
  }

  private getGoogleStreetsBasemap(): Basemap {
    if (!this.googleStreetsBasemap) {
      this.googleStreetsBasemap = new Basemap({
        baseLayers: [
          new WebTileLayer({
            urlTemplate: "https://mt{subDomain}.google.com/vt/lyrs=m&x={col}&y={row}&z={level}",
            subDomains: ["0", "1", "2", "3"],
            copyright: "Map data © Google",
          }),
        ],
        title: "Google Streets",
        id: "google-streets",
      });
    }
    return this.googleStreetsBasemap;
  }

  private getGoogleSatelliteBasemap(): Basemap {
    if (!this.googleSatelliteBasemap) {
      this.googleSatelliteBasemap = new Basemap({
        baseLayers: [
          new WebTileLayer({
            urlTemplate: "https://mt{subDomain}.google.com/vt/lyrs=s&x={col}&y={row}&z={level}",
            subDomains: ["0", "1", "2", "3"],
            copyright: "Map data © Google",
          }),
        ],
        title: "Google Satellite",
        id: "google-satellite",
      });
    }
    return this.googleSatelliteBasemap;
  }

  private getGoogleHybridBasemap(): Basemap {
    if (!this.googleHybridBasemap) {
      this.googleHybridBasemap = new Basemap({
        baseLayers: [
          new WebTileLayer({
            urlTemplate: "https://mt{subDomain}.google.com/vt/lyrs=y&x={col}&y={row}&z={level}",
            subDomains: ["0", "1", "2", "3"],
            copyright: "Map data © Google",
          }),
        ],
        title: "Google Hybrid",
        id: "google-hybrid",
      });
    }
    return this.googleHybridBasemap;
  }

  destroyKrokiMap(): void {
    if (this.krokiView) { this.krokiView.destroy(); this.krokiView = undefined; }
    this.krokiMap = undefined;
    this.krokiHighlightLayer = undefined;
  }

  destroy(): void {
    this.view?.destroy();
    this.view = undefined;
    this.sceneView?.destroy();
    this.sceneView = undefined;
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

  // ─── Private helpers ──────────────────────────────────────────────────────

  private bindClickSelection(): void {
    if (!this.view || !this.parcelLayer) return;

    const handleHit = async (event: any, zoomIn: boolean) => {
      const hit   = await this.view!.hitTest(event);
      const match = (hit.results as Array<{ graphic?: Graphic }>).find(
        (item) => item.graphic?.layer === this.parcelLayer
      );
      if (!match?.graphic) return;

      // Use the FeatureServer/28 hit only to identify the plot id + geometry.
      const baseParcel = this.graphicToParcel(match.graphic);
      const geometry   = match.graphic.geometry as any;

      // Keep the FeatureServer parcel attributes as authoritative for cards.
      // Do not enrich from local masterplan GeoJSON for click-selected parcels.
      const parcel = baseParcel;

      if (geometry?.type === "polygon") {
        const poly = geometry as Polygon;
        if (this.highlightLayer) {
          this.highlightLayer.removeAll();
          const g = new Graphic({ geometry: poly, symbol: this.createHighlightSymbol(parcel, 0.35) });
          this.highlightLayer.add(g);
          if (zoomIn) {
            try { await this.view!.goTo({ target: geometry, zoom: 17 }); } catch { /* ignore */ }
            try { this.flashGraphic(g, 2, 320); } catch {}
          } else {
            try { this.flashGraphic(g, 2, 320); } catch {}
          }
        }
        this.currentSelectedPolygon = poly;
        this.currentSelectedLabel   = parcel.displayName || parcel.id;
        this.applyLabelsForCurrentMode();
      }
      this.selectedParcelSubject.next(parcel);
      if (zoomIn && geometry) {
        try { await this.view!.goTo({ target: geometry, zoom: 17 }); } catch { /* ignore */ }
      }
    };

    this.view.on("click",        (e) => void handleHit(e, true));
    this.view.on("double-click", (e) => { e.stopPropagation(); void handleHit(e, true); });
  }

  private bindDashboardHoverTooltip(): void {
    if (!this.view) {
      return;
    }
    const view = this.view;

    view.on("pointer-move", async (event) => {
      if (!this.dashboardHighlightLayer) {
        return;
      }

      const requestId = ++this.dashboardHoverHitRequest;
      let hit;
      try {
        hit = await view.hitTest(event, { include: [this.dashboardHighlightLayer] as any });
      } catch {
        return;
      }
      if (requestId !== this.dashboardHoverHitRequest) {
        return;
      }

      const match = (hit.results as Array<{ graphic?: Graphic }>).find((item) => {
        const geometryType = String(item.graphic?.geometry?.type ?? "").toLowerCase();
        return item.graphic?.layer === this.dashboardHighlightLayer && geometryType === "point";
      });

      const graphic = match?.graphic;
      if (!graphic) {
        view.closePopup?.();
        return;
      }

      const attrs = (graphic.attributes ?? {}) as Record<string, unknown>;
      const siteName = String(attrs["Site_Name"] ?? "").trim();
      const branchName = String(attrs["Branch_Name"] ?? "").trim();
      const fallbackName = String(
        attrs["name"] ??
        attrs["ATM_ID"] ??
        attrs["Branch_ID"] ??
        attrs["id"] ??
        ""
      ).trim();
      const displayName = siteName || branchName || fallbackName;
      if (!displayName) {
        view.closePopup?.();
        return;
      }

      const title = siteName ? "ATM Site_Name" : branchName ? "Branch_Name" : "Location";
      view.openPopup?.({
        title,
        content: displayName,
        location: graphic.geometry as Point,
      });
    });

    view.on("pointer-leave", () => {
      try {
        view.closePopup?.();
      } catch {
        // ignore popup close errors
      }
    });
  }

  /**
   * Resolve the rich masterplan attributes for a clicked plot.
   *
   * Strategy (in order):
   *   1. Spatial lookup — if a click point is provided, find the masterplan
   *      GeoJSON polygon that contains it (most reliable, since FeatureServer/28
   *      `PlotID` values like "14" do not match GeoJSON ids like "A148").
   *   2. ID match — fall back to matching `base.id` against "Master Plan Plot No".
   *   3. Return `base` unchanged when no match is found.
   */
  private async enrichParcelFromMasterplan(
    base: Parcel,
    clickPoint?: Point,
  ): Promise<Parcel> {
    try {
      await this.ensureMasterplanLoaded();
    } catch {
      return base;
    }

    let feat = this.findMasterplanFeatureAtPoint(clickPoint);

    if (!feat) {
      const idRaw = (base.id ?? base.displayName ?? "").trim();
      if (idRaw) {
        const idUpper = idRaw.toUpperCase();
        feat = this.masterplanFeatures.find((f) => {
          const v = f.properties?.[MASTERPLAN_PLOT_FIELD];
          return v != null && String(v).trim().toUpperCase() === idUpper;
        });
      }
    }

    if (!feat) return base;

    const enriched = this.masterplanFeatureToParcel(feat, MASTERPLAN_PLOT_FIELD, "2026");

    // Merge strategy: keep live FeatureServer attributes as the authoritative base
    // (they contain ParkingArea, RearSetback, UserEnglishName, etc.).
    // Only fill in fields that are absent or null on the live record from the
    // local masterplan GeoJSON (e.g. Zone English Name, Landuse, Sub Landuse).
    const mergedAttributes: Record<string, unknown> = { ...enriched.attributes };
    for (const [key, value] of Object.entries(base.attributes ?? {})) {
      if (value !== null && value !== undefined && value !== "") {
        mergedAttributes[key] = value;
      }
    }

    return {
      ...enriched,
      attributes: mergedAttributes,
      // Prefer WGS84 masterplan geometry for plot-sheet / screenshot operations;
      // fall back to the live FeatureServer geometry if masterplan has none.
      geometry: enriched.geometry ?? base.geometry,
    };
  }

  /** Point-in-polygon search against the masterplan GeoJSON features. */
  private findMasterplanFeatureAtPoint(clickPoint?: Point): MasterplanFeature | undefined {
    if (!clickPoint) return undefined;

    // Convert click to WGS84 because GeoJSON rings are WKID 4326.
    let geoPoint: Point;
    if (clickPoint.spatialReference?.isWebMercator) {
      geoPoint = webMercatorUtils.webMercatorToGeographic(clickPoint) as Point;
    } else {
      geoPoint = clickPoint;
    }

    const px = geoPoint.x;
    const py = geoPoint.y;

    for (const feat of this.masterplanFeatures) {
      const rings = this.featureRings(feat);
      if (!rings.length) continue;
      // Quick bbox reject for speed.
      const polygon = new Polygon({ rings, spatialReference: { wkid: 4326 } });
      const ext = polygon.extent;
      if (ext && (px < ext.xmin || px > ext.xmax || py < ext.ymin || py > ext.ymax)) {
        continue;
      }
      try {
        if (geometryEngine.contains(polygon, geoPoint)) {
          return feat;
        }
      } catch {
        /* ignore individual containment failures */
      }
    }
    return undefined;
  }

  private graphicToParcel(graphic: Graphic): Parcel {
    const attributes = (graphic.attributes ?? {}) as Record<string, unknown>;
    const plotId     = String(attributes[MASTERPLAN_PLOT_NO_FIELD] ?? attributes[PLOT_ID_FIELD] ?? attributes["OBJECTID"] ?? "unknown").trim();
    const objectId   = Number(attributes["OBJECTID"] ?? 0);
    return {
      id:          plotId || `plot-${objectId}`,
      objectId,
      displayName: plotId || `Plot ${objectId}`,
      attributes,
      geometry:    graphic.geometry,
    };
  }

  private createHighlightSymbol(_parcel: Parcel, alpha: number): SimpleFillSymbol {
    // Use a strong green highlight for go-to / selection
    return new SimpleFillSymbol({
      color: [31, 138, 90, alpha], // green fill
      outline: new SimpleLineSymbol({ color: [15, 90, 55, 1], width: 4 }),
    });
  }

  private createPointHighlightSymbol(): SimpleMarkerSymbol {
    return new SimpleMarkerSymbol({
      style: "circle",
      size: 16,
      color: [31, 138, 90, 0.65],
      outline: {
        color: [15, 90, 55, 1],
        width: 2.2,
      },
    });
  }

  /**
   * Flash a graphic in-place by toggling a stronger/softer symbol.
   * Keeps the original symbol and restores it after the pulse finishes.
   */
  private flashGraphic(graphic: Graphic, pulses = 3, intervalMs = 400): void {
    if (!graphic) return;
    const orig = graphic.symbol as any;
    // Fallback colors for pulse (green)
    const fill = [31, 138, 90];
    // Use red outline during flash so the pulsing border is obvious
    const outline = [200, 35, 51, 1];

    const strong = new SimpleFillSymbol({
      color: [fill[0], fill[1], fill[2], 0.28],
      outline: new SimpleLineSymbol({ color: outline, width: 6 }),
    });

    const weak = new SimpleFillSymbol({
      color: [fill[0], fill[1], fill[2], 0.10],
      outline: new SimpleLineSymbol({ color: outline, width: 2 }),
    });

    let toggle = false;
    let count = 0;
    const maxCycles = pulses * 2;
    const handle = window.setInterval(() => {
      try {
        graphic.symbol = toggle ? strong : weak;
      } catch (e) {
        // ignore rendering errors
      }
      toggle = !toggle;
      count++;
      if (count >= maxCycles) {
        window.clearInterval(handle);
        // leave a persistent red outline after flashing so the selection remains obvious
        try {
          graphic.symbol = strong;
        } catch (e) {}
      }
    }, intervalMs);
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
    const point = new Point({ x: center.x, y: center.y, spatialReference: center.spatialReference });
    const symbol = new TextSymbol({
      text,
      color:     [20, 20, 20, 1],
      haloColor: [255, 255, 255, 0.9],
      haloSize:  1.5,
      font:      { size: 11, weight: "bold", family: "Arial" },
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
        this.extentDebounceTimer = setTimeout(() => void this.refreshExtentLabels(), 400);
      }
    );
  }

  private stopExtentWatcher(): void {
    this.extentWatchHandle?.remove();
    this.extentWatchHandle = undefined;
    if (this.extentDebounceTimer) { clearTimeout(this.extentDebounceTimer); this.extentDebounceTimer = undefined; }
  }

  /**
   * "All Labels" mode — iterate the local masterplan GeoJSON (same source used
   * by "Current" selection) and render a text label for every plot whose
   * centroid falls inside the current map extent.
   * Only runs when scale ≤ 8 000 to avoid flooding the view.
   */
  private async refreshExtentLabels(): Promise<void> {
    if (this.labelMode !== "all" || !this.labelsLayer || !this.view) return;
    this.labelsLayer.removeAll();

    // Hide labels when zoomed too far out — unreadable and too many features.
    if (this.view.scale > 8000) return;

    await this.ensureMasterplanLoaded();

    const rawExtent = this.view.extent;
    if (!rawExtent) return;

    // The MapView extent is in the map's spatial reference (Web Mercator WKID 3857).
    // GeoJSON centroids are WGS84 (WKID 4326). Convert extent to geographic for comparison.
    let geoExtent: Extent;
    if (rawExtent.spatialReference?.isWebMercator) {
      geoExtent = webMercatorUtils.webMercatorToGeographic(rawExtent) as Extent;
    } else {
      geoExtent = rawExtent;
    }
    const { xmin, xmax, ymin, ymax } = geoExtent;

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
      if (++count >= 300) break;
    }
  }

  private featureRings(feat: MasterplanFeature): number[][][] {
    const geom = feat.geometry;
    if (!geom) return [];
    if (geom.type === "Polygon")      return geom.coordinates as number[][][];
    if (geom.type === "MultiPolygon") return (geom.coordinates as number[][][][]).flat();
    return [];
  }

  private drawKrokiParcel(parcel: Parcel): void {
    if (!this.krokiView || !this.krokiHighlightLayer || !parcel.geometry) return;
    const geom = parcel.geometry as { type: string; coordinates: unknown };
    let rings: number[][][] = [];
    if (geom.type === "Polygon")           rings = geom.coordinates as number[][][];
    else if (geom.type === "MultiPolygon") rings = (geom.coordinates as number[][][][]).flat();
    else return;
    const polygon = new Polygon({ rings, spatialReference: { wkid: 4326 } });
    this.krokiHighlightLayer.removeAll();
    this.krokiHighlightLayer.add(
      new Graphic({ geometry: polygon, symbol: this.createHighlightSymbol(parcel, 0.55) })
    );
    const target = polygon.extent ? polygon.extent.clone().expand(1.4) : polygon;
    this.krokiView.goTo(target, { animate: false }).catch(() => undefined);
  }

  private async ensureMasterplanLoaded(): Promise<void> {
    if (this.masterplanFeatures.length) return;
    if (!this.masterplanLoadPromise) {
      this.masterplanLoadPromise = (async () => {
        const res = await fetch(MASTERPLAN_URL);
        if (!res.ok) throw new Error(`Failed to load ${MASTERPLAN_URL}: ${res.status}`);
        const json = (await res.json()) as { features?: MasterplanFeature[] };
        this.masterplanFeatures = json.features ?? [];
      })();
    }
    await this.masterplanLoadPromise;
  }

  private async ensureMasterplan2018Loaded(): Promise<void> {
    if (this.masterplan2018Features.length) return;
    if (!this.masterplan2018LoadPromise) {
      this.masterplan2018LoadPromise = (async () => {
        const res = await fetch(MASTERPLAN_2018_URL);
        if (!res.ok) throw new Error(`Failed to load ${MASTERPLAN_2018_URL}: ${res.status}`);
        const json = (await res.json()) as { features?: MasterplanFeature[] };
        this.masterplan2018Features = json.features ?? [];
      })();
    }
    await this.masterplan2018LoadPromise;
  }

  private getLiveMasterplanSearchField(layer: FeatureLayer): string {
    const fields = layer.fields ?? [];
    const normalize = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, "");
    const preferred = [
      "masterplanplotno",
      "masterplanplotnumber",
      "plotid",
      "plotno",
      "plotnumber",
      "parcelno",
      "parcelnumber",
    ];

    for (const candidate of preferred) {
      for (const field of fields) {
        const name = normalize(field.name);
        const alias = normalize(field.alias ?? "");
        if (name === candidate || alias === candidate) {
          return field.name;
        }
      }
    }

    const fallback = fields.find((field) => {
      const name = normalize(field.name);
      const alias = normalize(field.alias ?? "");
      return name.includes("plot") || alias.includes("plot") || name.includes("parcel") || alias.includes("parcel");
    });

    return fallback?.name ?? layer.objectIdField;
  }

  private async loadGeoJsonFeatures(
    relativeUrl: string
  ): Promise<Array<{ properties?: Record<string, unknown>; geometry?: { type?: string; coordinates?: unknown } }>> {
    const cached = this.geoJsonFeatureCache.get(relativeUrl);
    if (cached) {
      return cached;
    }

    const url = new URL(relativeUrl, document.baseURI).toString();
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to load ${relativeUrl}: ${res.status}`);
    }

    const json = (await res.json()) as { features?: Array<{ properties?: Record<string, unknown>; geometry?: { type?: string; coordinates?: unknown } }> };
    const features = Array.isArray(json.features) ? json.features : [];
    this.geoJsonFeatureCache.set(relativeUrl, features);
    return features;
  }

  private geoJsonFeatureToLocationParcel(
    feature: { properties?: Record<string, unknown>; geometry?: { type?: string; coordinates?: unknown } },
    locationType: "atm" | "branch"
  ): Parcel | null {
    const props = feature.properties ?? {};
    const coords = feature.geometry?.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) {
      return null;
    }

    const longitude = Number(coords[0]);
    const latitude = Number(coords[1]);
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
      return null;
    }

    const idField = locationType === "branch" ? "Branch_ID" : "id";
    const nameField = locationType === "branch" ? "Branch_Name" : "name";
    const id = String(props[idField] ?? "").trim();
    if (!id) {
      return null;
    }

    const name = String(props[nameField] ?? "").trim();
    const label = name ? `${id} - ${name}` : id;
    return {
      id,
      objectId: Number(props["OBJECTID"] ?? 0),
      displayName: label,
      attributes: props,
      geometry: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
    };
  }

  private masterplanFeatureToParcel(
    feat: MasterplanFeature,
    plotField = MASTERPLAN_PLOT_FIELD,
    dataset: "2026" | "2018" = "2026"
  ): Parcel {
    const props    = feat.properties ?? {};
    const plotNo   = String(props[plotField] ?? "").trim();
    const objectId = Number(props["OBJECTID"] ?? props["ObjectID"] ?? 0);
    return {
      id:          plotNo || `plot-${objectId}`,
      objectId,
      displayName: plotNo || `Plot ${objectId}`,
      attributes:  props,
      geometry:    feat.geometry,
      sourceDataset: dataset,
    };
  }

  private async resolveWebSceneId(): Promise<string | undefined> {
    const cfg = this.mapConfig!;
    if (!cfg.instantAppId) return undefined;
    const url = `${cfg.portalUrl.replace(/\/$/, "")}/sharing/rest/content/items/${cfg.instantAppId}/data?f=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load Instant App config (${res.status}).`);
    const data: any = await res.json();
    return (
      data?.values?.webscene ??
      data?.values?.webmap   ??
      data?.webscene         ??
      data?.map?.itemId      ??
      undefined
    );
  }

  /**
   * Adds a point to the map.
   * @param coordinates - The coordinates of the point.
   * @param properties - Additional properties for the point.
   */
  addPointToMap(coordinates: [number, number], properties: Record<string, any>): void {
    if (!this.view) {
      console.error('Map view is not initialized.');
      return;
    }

    const point = new Point({
      longitude: coordinates[0],
      latitude: coordinates[1],
      spatialReference: this.view.spatialReference,
    });

    const graphic = new Graphic({
      geometry: point,
      symbol: {
        type: 'simple-marker',
        color: 'red',
        size: '8px',
        outline: {
          color: [255, 255, 255],
          width: 1,
        },
      },
      attributes: properties,
    });

    if (!this.panoramicPointsLayer) {
      this.panoramicPointsLayer = new GraphicsLayer({ title: 'Panoramic Points', visible: true });
      this.webMap?.add(this.panoramicPointsLayer);
    }

    this.panoramicPointsLayer.add(graphic);
    this.panoramicPointGraphics.push(graphic);
  }

  /**
   * Show or hide the set of panoramic points previously added via `addPointToMap`.
   * When hidden the graphics remain in `panoramicPointGraphics` so they can be
   * efficiently re-added when visible again. This provides a simple visibility
   * toggle without destroying the graphics.
   */
  setPanoramicPointsVisibility(visible: boolean): void {
    if (!this.panoramicPointsLayer) {
      console.warn('[DqBasemapService] panoramic points visibility change requested but layer not initialized.');
      return;
    }
    try {
      this.panoramicPointsLayer.visible = visible;
      console.log('[DqBasemapService] panoramic points layer visibility set ->', visible, 'graphics:', this.panoramicPointGraphics.length);
    } catch (err) {
      console.warn('[DqBasemapService] setPanoramicPointsVisibility failed', err);
    }
  }

  clearPanoramicPoints(): void {
    if (this.panoramicPointsLayer) {
      this.panoramicPointsLayer.removeAll();
    }
    this.panoramicPointGraphics = [];
  }
}
