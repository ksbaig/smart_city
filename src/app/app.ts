// ...existing code...
// ...existing code...

import { CommonModule } from "@angular/common";
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from "@angular/core";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { FormsModule } from "@angular/forms";
import { firstValueFrom } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Viewer } from "@photo-sphere-viewer/core";
import "@photo-sphere-viewer/core/index.css";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { ArchiveService } from "./core/services/archive.service";
import { DqBasemapService } from "./core/services/dq-basemap.service";
import { PanoramicPointsService } from "./core/services/panoramic-points.service";
import { StreetViewService } from "./core/services/street-view.service";
import { ArchiveFile, ArchiveFileGroup } from "./shared/models/archive.model";
import { MapConfig, Parcel } from "./shared/models/parcel.model";
import { CommentsComponent } from "./features/comments/comments.component";
import { PlotPrintComponent } from "./features/plot-print/plot-print.component";
import { PresentationPlotComponent } from "./features/presentation-plot/presentation-plot.component";
import { CustomEsriToolbarComponent } from "./components/custom-esri-toolbar/custom-esri-toolbar.component";
import { AddedAttributeField, AddedAttributesEditorComponent } from "./features/added-attributes-editor/added-attributes-editor.component";
import { LoginOverlayComponent } from "./features/login-overlay/login-overlay.component";
import { LocalBankingVioceAgentComponent } from "./features/local_banking_vioce_agent/local_banking_vioce_agent.component";
import { ComponentDownloadComponent, SelectedLocation } from "./features/component-download/component-download.component";
import { Component_Atm_Dashboard } from "./features/component_atm_dashboard/component_atm_dashboard.component";
import { Component_Branches_Dashboard } from "./features/component_branches_dashboard/component_branches_dashboard.component";
import { PendingUpdatesService } from "./core/services/pending-updates.service";
import { PendingUpdateRecord, PendingUpdateValues } from "./shared/models/pending-update.model";
import WebScene from "@arcgis/core/WebScene";
import SceneView from "@arcgis/core/views/SceneView";
import esriConfig from "@arcgis/core/config";
import MapView from "@arcgis/core/views/MapView";
import EsriMap from "@arcgis/core/Map";
import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import Legend from "@arcgis/core/widgets/Legend";

// Map for user-friendly plot detail labels
const PLOT_DETAIL_LABELS: Record<string, string> = {
  CurrentUse: 'Current Use',
  OwnershipType: 'Ownership Type',
  LeaseType: 'Lease Type',
  PermittedGFA: 'Permitted Gross Floor Area (GFA)',
  ExistingGFA: 'Existing Gross Floor Area (GFA)',
  PermittedFAR: 'Permitted Floor Area Ratio (FAR)',
  ExistingFAR: 'Existing Floor Area Ratio (FAR)',
  PermittedNoofFloors: 'Permitted Number of Floors',
  ExistingNoofFloors: 'Existing Number of Floors',
  PermittedHeight: 'Permitted Height (m)',
  ExistingHeight: 'Existing Height (m)',
  Developer: 'Developer',
  UserEnglishName: 'User Name',
  FrontSetback: 'Front Setback',
  SideSetback: 'Side Setback',
  RearSetback: 'Rear Setback',
  ParkingArea: 'Parking Area',
  PermittedParkingSpaces: 'Permitted Parking Spaces',
  ExistingParkingSpaces: 'Existing Parking Spaces (Per/Dwelling)',
  PermittedPlotCoverage: 'Permitted Plot Coverage',
  ExistingPlotCoverage: 'Existing Plot Coverage',
  PremittedParkingType: 'Premitted Parking Type',
};

interface ArchiveSource {
  code: string;
  title: string;
  subtitle: string;
  iconClass: string;
}

type ThemeKey =
  | "current"
  | "light"
  | "dark"
  | "meadow"
  | "forest"
  | "contrast"
  | "daytime"
  | "midnight"
  | "bright"
  | "classic";

interface ThemeOption {
  key: ThemeKey;
  label: string;
  note: string;
}

interface PlotDetailRow {
  label: string;
  value: string;
  tone?: "status";
  icon?: string;
}

interface PlotStatusChartSlice {
  label: string;
  value: number;
  color: string;
  dashArray: string;
  dashOffset: number;
}

type BranchPerformanceCategory = "Strong" | "Moderate" | "Weak";
type AtmPerformanceCategory = "Profit" | "Loss" | "Break-even";
const BRANCH_DASHBOARD_GEOJSON_URL = new URL("geojson/Riyadh_Branch_Locations.geojson", document.baseURI).toString();
const ATM_DASHBOARD_GEOJSON_URL = new URL("geojson/Riyadh_ATM_Locations.geojson", document.baseURI).toString();

interface BranchReportRow {
  Entity_ID: string;
  Bank_Name: string;
  District: string;
  Entity_Name: string;
  Performance_Status: string;
}
type ReportsDataset = "branch" | "atm";

interface AddedAttributeFieldConfig {
  id: string;
  label: string;
  inputType?: "text" | "number";
  keys: string[];
}

type UiLanguage = "en" | "ar";
type RightPanelSection = "result" | "scene" | "panorama" | "cctv" | "kroki" | "sources" | "files" | "uploads" | "comments" | "dashboard" | "legend" | "reports" | "voiceAgent";
type TranslationKey =
  | "appTitle"
  | "noParcelSelected"
  | "loadingMap"
  | "mapReady"
  | "mapLoadFailed"
  | "noMatch"
  | "searchMasterplanFailed"
  | "panoramaLoadFailed"
  | "panoramaOpenFailed"
  | "loading360"
  | "selectParcel"
  | "plotId"
  | "searchByParcel"
  | "search"
  | "current"
  | "allLabels"
  | "matchingResults"
  | "apply"
  | "reset"
  | "moreOptions"
  | "addNewDocument"
  | "classifyDocumentType"
  | "addDescription"
  | "describeDocument"
  | "smartSearch"
  | "searchDocumentText"
  | "find"
  | "filters"
  | "parcelRoadName"
  | "searchParcelRoad"
  | "clearGraphics"
  | "basemapSatellite"
  | "basemapWebmap"
  | "attributes"
  | "kroki"
  | "cctv"
  | "view360"
  | "view3d"
  | "plotSheet"
  | "downloadPdf"
  | "downloadJpg"
  | "generatedOn"
  | "generatingPlotSheet"
  | "plotSheetFailed"
  | "open3dScene"
  | "currentSearchResult"
  | "plotAttributes"
  | "field"
  | "data"
  | "view3dPanel"
  | "view3dHint"
  | "loading3d"
  | "panel360Title"
  | "panel360Hint"
  | "cctvPanelTitle"
  | "cctvHint"
  | "archiveDataSources"
  | "archiveDataDesc"
  | "parcelArchiveFiles"
  | "uploadedDocuments"
  | "languageButton";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, FormsModule, CommentsComponent, PlotPrintComponent, PresentationPlotComponent, CustomEsriToolbarComponent, AddedAttributesEditorComponent, LoginOverlayComponent, ComponentDownloadComponent, Component_Atm_Dashboard, Component_Branches_Dashboard],
  templateUrl: "./app.html",
  styleUrl: "./app.css",
})
export class App implements OnInit {
  readonly localBankingVioceAgentComponent = LocalBankingVioceAgentComponent;

  loginRequired = true;
  loggedInUser = "";

  onLoginSuccess(user: string): void {
    this.loggedInUser = user;
    this.loginRequired = false;
  }

  rightPanelSceneOpen = false;
  rightPanelWidth = 680;
  rightPanelCollapsed = true;
  parcelHintVisible = false;
  parcelHintTimer?: ReturnType<typeof setTimeout>;
  // Track if Panaromic View1 is active
  isPanaromicView1Active = false;
  // List of valid legend labels (from screenshot)
  private readonly legendLabels = [
    "Embassy & Ambassador's Residence",
    "Embassy",
    "Ambassador's Residence",
    "International / Regional Organization",
    "Residential Low Density",
    "Residential Medium Density",
    "Residential High Density",
    "Commercial",
    "Cultural / Recreational",
    "Government Building",
    "Educational",
    "Health",
    "Mosque",
    "Utilities",
    "Plaza",
    "Public Park",
    "Green Corridor",
    "Extensive Landscaping",
    "Parking"
  ];
  // Context menu toggle: show panoramic points when true
  showPanoramicPointsInContext = false;

  // Handler for Panaromic View1 button
  onPanaromicView1(): void {
    if (this.isPanaromicView1Active) {
      console.log('Panaromic View1 already active (yellow); hiding panoramic layer now.');
      this.hidePanoramicLayerAction();
      this.isPanaromicView1Active = false;
      return;
    }

    if (!this.isOnline || !this.panoramicServiceAvailable) {
      this.panoramicServiceUnavailableMessage = this.isOnline
        ? 'Panoramic portal is unavailable. Internet access is required for this feature.'
        : 'Offline mode: panoramic portal unavailable.';
      console.warn('[Panaromic View1] prevented while offline/unavailable:', this.panoramicServiceUnavailableMessage);
      this.refreshView();
      return;
    }

    this.isPanaromicView1Active = true;
    console.log('Panaromic View1 button activated (yellow). Showing panoramic points.');
    void this.onPanoramicJson();

    if (this.selectedParcel) {
      const mapView = this.mapService.getMapView();
      const webMap = this.mapService.getWebMap();
      if (mapView && webMap) {
        // Only show generated panoramic points if the context checkbox is enabled
        if (this.showPanoramicPointsInContext) {
          this.panoramicPointsService.showPointsForParcel(this.selectedParcel, webMap, mapView);
          this.panoramicPointLayerVisible = true;
        }
      }
    }
  }

  onPanoramicPointsCheckboxChange(event: Event): void {
    const checked = !!(event.target as HTMLInputElement).checked;
    console.log('[panoramic points checkbox] changed ->', checked);
    console.log('[panoramic points checkbox] desired visibility ->', checked ? 'visible' : 'hidden');
    if (!checked) {
      // Hide any existing panoramic points by turning the dedicated layer off
      this.panoramicPointsService.setLayerVisibility(false);
      this.panoramicPointLayerVisible = false;
      // Hide any GeoServer/added red points tracked by the basemap service
      this.mapService.setPanoramicPointsVisibility?.(false);
      return;
    }

    // If checked, show generated panoramic points for the currently selected parcel (if any).
    if (checked) {
      if (!this.selectedParcel) {
        console.warn('[panoramic points checkbox] checked but no parcel selected');
        return;
      }
      const mapView = this.mapService.getMapView();
      const webMap = this.mapService.getWebMap();
      if (!mapView || !webMap) {
        console.warn('[panoramic points checkbox] map not ready to show panoramic points');
        return;
      }
      this.panoramicPointsService.showPointsForParcel(this.selectedParcel, webMap, mapView);
      // Ensure the layer is visible after populating it
      this.panoramicPointsService.setLayerVisibility(true);
      this.panoramicPointLayerVisible = true;
      // Also ensure any GeoServer red points are visible
      this.mapService.setPanoramicPointsVisibility?.(true);
    }
  }

  public async checkPanoramicServiceAvailability(): Promise<void> {
    this.panoramicServiceAvailable = false;
    this.panoramicServiceUnavailableMessage =
      'Panoramic portal data is unavailable. Use the local panoramic image or generated local points.';
  }

  onPanoramicViewButton(): void {
    this.isPanaromicView1Active = false;
    this.panoramicPointsService.clearPoints();
    void this.onPanoramicJson();
  }

  showPanoramicClickMessage(message: string, durationMs = 5000): void {
    this.panoramicClickMessage = message;
    window.clearTimeout(this.panoramicClickMessageTimer);
    this.panoramicClickMessageTimer = window.setTimeout(() => {
      this.panoramicClickMessage = "";
      this.refreshView();
    }, durationMs);
    this.refreshView();
  }

  showCardsButton = false;
  ngDoCheck() {
    this.updateThemeClass();
  }
  updateThemeClass() {
    if (typeof document !== 'undefined') {
      if (this.currentTheme === 'current') {
        document.body.classList.add('theme-current-active');
      } else {
        document.body.classList.remove('theme-current-active');
      }
    }
  }
  plotShapeMode: 'filled' | 'outline' | 'cards1' = 'filled';
  setPlotShapeMode(mode: 'filled' | 'outline' | 'cards1') {
    this.plotShapeMode = mode;
  }
  getIconForLabel(label: string): string {
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const l = normalize(label);

    // Explicit per-label icon overrides to keep icons unique and meaningful
    const LABEL_ICON_OVERRIDES: Record<string, string> = {
      'permittedgrossfloorareagfa': 'ruler',
      'existinggrossfloorareagfa': 'emoji-valley',
      'permittedfloorarearatiofar': 'emoji-hash',
      'existingfloorarearatiofar': 'document',
      'permittednumberoffloors': 'building',
      'existingnumberoffloors': 'emoji-m',
      'premittedparkingtype': 'emoji-temple',
      'permittedheightm': 'emoji-slider',
      'existingheightm': 'map',
      'developer': 'emoji-flower',
      'userenglishname': 'document',
      'frontsetback': 'emoji-mail',
      'sidesetback': 'emoji-temple2',
      'rearsetback': 'ruler',
      'parkingarea': 'emoji-parking',
      'permittedparkingspaces': 'emoji-anchor',
      'existingparkingspacesperdwelling': 'emoji-spark',
      'permittedplotcoverage': 'emoji-bolt',
      'existingplotcoverage': 'emoji-info',
    };

    if (LABEL_ICON_OVERRIDES[l]) return LABEL_ICON_OVERRIDES[l];
    if (l.includes('masterplan') || l.includes('masterplan')) return 'map';
    if (l.includes('zone')) return 'location';
    if (l.includes('sector')) return 'building';
    if (l.includes('landuse') || l.includes('landuse')) return 'home';
    if (l.includes('subland') || l.includes('subland')) return 'layers';
    if (l.includes('area') || l.includes('frontage') || l.includes('depth')) return 'ruler';
    if (l.includes('landcategory') || l.includes('category')) return 'grid';
    if (l.includes('contract')) return 'document';
    if (l.includes('plotstatus') || l.includes('status')) return 'flag';
    if (l.includes('currentuse')) return 'home';
    if (l.includes('ownership')) return 'document';
    if (l.includes('lease')) return 'document';
    if (l.includes('floor') || l.includes('gfa') || l.includes('far')) return 'building';
    if (l.includes('parking')) return 'grid';
    return 'document';
  }

  getIconGlyph(icon: string): string {
    switch (icon) {
      case 'map': return '🗺️';
      case 'location': return '📍';
      case 'building': return '🏢';
      case 'home': return '🏠';
      case 'layers': return '🗂️';
      case 'ruler': return '📏';
      case 'grid': return '🧱';
      case 'document': return '📄';
      case 'flag': return '🏁';
      case 'emoji-spark': return '✨';
      case 'emoji-bolt': return '⚡';
      case 'emoji-info': return 'ℹ️';
      case 'emoji-mail': return '✉️';
      case 'emoji-temple2': return '🛕';
      case 'emoji-hash': return '#';
      case 'emoji-slider': return '🎚️';
      case 'emoji-m': return 'Ⓜ️';
      case 'emoji-flower': return '🏵️';
      case 'emoji-valley': return '⛰️';
      case 'emoji-temple': return '🏛️';
      case 'emoji-parking': return '🅿️';
      case 'emoji-anchor': return '⚓';
      default: return '📄';
    }
  }

  getSearchResultIconClass(icon: string): string {
    switch (icon) {
      case "map":
        return "bi bi-map";
      case "location":
        return "bi bi-geo-alt";
      case "building":
        return "bi bi-building";
      case "home":
        return "bi bi-house";
      case "layers":
        return "bi bi-layers";
      case "ruler":
        return "bi bi-rulers";
      case "grid":
        return "bi bi-grid-3x3-gap";
      case "flag":
        return "bi bi-flag";
      case "emoji-hash":
        return "bi bi-hash";
      case "emoji-slider":
        return "bi bi-sliders";
      case "emoji-mail":
        return "bi bi-envelope";
      case "emoji-flower":
        return "bi bi-flower1";
      case "emoji-temple":
      case "emoji-temple2":
        return "bi bi-bank";
      case "emoji-parking":
        return "bi bi-p-circle";
      case "emoji-anchor":
        return "bi bi-anchor";
      case "emoji-spark":
        return "bi bi-stars";
      case "emoji-bolt":
        return "bi bi-lightning";
      case "emoji-info":
        return "bi bi-info-circle";
      case "emoji-m":
        return "bi bi-building";
      case "emoji-valley":
        return "bi bi-triangle";
      default:
        return "bi bi-file-earmark-text";
    }
  }

  get plotDetailSummaryRows(): PlotDetailRow[] {
    return this.plotDetailRows.slice(0, 4);
  }

  private readonly defaultRightPanelWidth = 680;
  private readonly maxRightPanelWidthOffset = 200;
  private rightPanelDragRightEdge = 0;
  private removeRightPanelDragListeners?: () => void;

  @ViewChild("mapHost", { static: true })
  private readonly mapHost?: ElementRef<HTMLDivElement>;

  @ViewChild("rightPanelHost", { static: false })
  private readonly rightPanelHost?: ElementRef<HTMLElement>;

  @ViewChild("krokiMapHost", { static: false })
  private readonly krokiMapHost?: ElementRef<HTMLDivElement>;

  @ViewChild("panoramaHost", { static: false })
  private readonly panoramaHost?: ElementRef<HTMLDivElement>;
  @ViewChild("panoramaOverlayHost", { static: false })
  private readonly panoramaOverlayHost?: ElementRef<HTMLDivElement>;
  @ViewChild("panoramaOverlay", { static: false })
  private readonly panoramaOverlayElement?: ElementRef<HTMLDivElement>;
  @ViewChild("mapSearchOverlay", { static: false })
  private readonly mapSearchOverlayElement?: ElementRef<HTMLDivElement>;
  @ViewChild("sceneOverlayHost", { static: false })
  private readonly sceneOverlayHost?: ElementRef<HTMLDivElement>;

  @ViewChild("sceneHost", { static: false })
  private readonly sceneHost?: ElementRef<HTMLDivElement>;

  @ViewChild("legendHost", { static: false })
  private readonly legendHost?: ElementRef<HTMLDivElement>;

  @ViewChild("docFileInput", { static: true })
  private readonly docFileInput?: ElementRef<HTMLInputElement>;

  @ViewChild("plotSheetTemplate", { static: false })
  private readonly plotSheetTemplate?: ElementRef<HTMLDivElement>;

  @ViewChild("plotSheetMapWrap", { static: false })
  private readonly plotSheetMapWrap?: ElementRef<HTMLDivElement>;

  @ViewChild("plotSheet1Template", { static: false })
  private readonly plotSheet1Template?: ElementRef<HTMLDivElement>;

  @ViewChild("plotSheet1MapWrap", { static: false })
  private readonly plotSheet1MapWrap?: ElementRef<HTMLDivElement>;

  @ViewChild("divlocationHost", { static: false })
  private readonly divlocationHost?: ElementRef<HTMLDivElement>;

  @ViewChild("plotPrintTemplate", { static: false })
  private readonly plotPrintTemplate?: ElementRef<HTMLDivElement>;

  private readonly mapService: DqBasemapService = inject(DqBasemapService);
  private readonly panoramicPointsService = inject(PanoramicPointsService);
  private readonly streetViewService = inject(StreetViewService);
  private readonly archiveService = inject(ArchiveService);
  private readonly pendingUpdatesService = inject(PendingUpdatesService);

  public get mapView(): MapView | undefined {
    return this.mapService.getMapView();
  }
  private readonly sanitizer = inject(DomSanitizer);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  showPopupOnMapClick = false;
  isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  panoramicServiceAvailable = true;
  panoramicServiceUnavailableMessage = "";
  private onlineListener?: (event: Event) => void;
  private offlineListener?: (event: Event) => void;
  private globalMapClickHandle?: any;
  private panoramaViewer: Viewer | null = null;
  private panoramicJsonClickHandle: any;
  private panoramaBlobUrl: string | null = null;
  panoramaFallbackUrl: string | null = null;
  panoramaIframeOpen = false;
  panoramaIframeUrl: SafeResourceUrl | null = null;
  private plotSheetWebScene: any | undefined;
  private plotSheetSceneViews: any[] = [];
  private readonly moreDetailFieldConfigs: Array<{ label: string; keys: string[]; tone?: "status" }> = [
    { label: "Current Use", keys: ["CurrentUse", "Current Use"] },
    { label: "Ownership Type", keys: ["OwnershipType", "Ownership Type"] },
    { label: "Lease Type", keys: ["LeaseType", "Lease Type"] },
    { label: "Permitted Gross Floor Area (GFA)", keys: ["PermittedGFA", "Permitted GFA"] },
    { label: "Existing Gross Floor Area (GFA)", keys: ["ExistingGFA", "Existing GFA"] },
    { label: "Permitted Floor Area Ratio (FAR)", keys: ["PermittedFAR", "Permitted FAR"] },
    { label: "Existing Floor Area Ratio (FAR)", keys: ["ExistingFAR", "Existing FAR"] },
    { label: "Permitted Number of Floors", keys: ["PermittedNoofFloors", "Permitted NoofFloors", "Permitted No of Floors"] },
    { label: "Existing Number of Floors", keys: ["ExistingNoofFloors", "Existing NoofFloors", "Existing No of Floors"] },
    { label: "Premitted Parking Type", keys: ["PremittedParkingType", "PermittedParkingType", "Premitted Parking Type", "Permitted Parking Type"] },
    { label: "Permitted Height (m)", keys: ["PermittedHeight", "Permitted Height", "Permitted Height (m)", "PermittedHeight_m"] },
    { label: "Existing Height (m)", keys: ["ExistingHeight", "Existing Height", "Existing Height (m)", "ExistingHeight_m"] },
    { label: "Developer", keys: ["Developer", "developer"] },
    { label: "User Name", keys: ["UserEnglishName", "User English Name", "UserName", "User Name"] },
    { label: "Front Setback", keys: ["FrontSetback", "Front Setback"] },
    { label: "Side Setback", keys: ["SideSetback", "Side Setback"] },
    { label: "Rear Setback", keys: ["RearSetback", "Rear Setback"] },
    { label: "Parking Area", keys: ["ParkingArea", "Parking Area"] },
    { label: "Permitted Parking Spaces", keys: ["PermittedParkingSpaces", "Permitted Parking Spaces"] },
    { label: "Existing Parking Spaces (Per/Dwelling)", keys: ["ExistingParkingSpaces", "Existing Parking Spaces", "ExistingParkingSpacesPerDwelling", "Existing Parking Spaces (Per/Dwelling)"] },
    { label: "Permitted Plot Coverage", keys: ["PermittedPlotCoverage", "Permitted Plot Coverage"] },
    { label: "Existing Plot Coverage", keys: ["ExistingPlotCoverage", "Existing Plot Coverage"] },
    { label: "ArabicNameZone", keys: ["ArabicNameZone"] },
    { label: "DQArabicNam", keys: ["DQArabicNam"] },
    { label: "ArabicNameLanduse", keys: ["ArabicNameLanduse"] },
    { label: "DeveloperArabic", keys: ["DeveloperArabic"] },
    { label: "OwnershipTypeArabic", keys: ["OwnershipTypeArabic"] },
    { label: "LeaseTypeArabic", keys: ["LeaseTypeArabic"] },
    { label: "CurrentUseArabic", keys: ["CurrentUseArabic"] },
    { label: "SubLanduseArabic", keys: ["SubLanduseArabic"] },
    // Add other fields as needed, using user-friendly labels
  ];
  isPlotSheet3DLoading = false;
  readonly plotDetailPreviewLimit = 6;
  showMoreDetails = false;

  readonly contractStatusChartData = [
    { label: "Allotted", value: 1243, color: "#2196f3" },
    { label: "Available", value: 428, color: "#fdd835" },
    { label: "In Progress", value: 27, color: "#ff9800" },
    { label: "Developed", value: 12, color: "#9e9e9e" },
  ];

  readonly leaseTypeChartData = [
    { label: "Low lease rate", value: 912, color: "#8bc34a" },
    { label: "Low Sell rate", value: 372, color: "#ffeb3b" },
    { label: "Free", value: 62, color: "#2196f3" },
    { label: "Competitive priced", value: 26, color: "#ff9800" },
    { label: "Reciprocal", value: 8, color: "#9e9e9e" },
  ];

  readonly plotStatusChartData = [
    { label: "Developed", value: 1250, color: "#4caf50" },
    { label: "Available", value: 410, color: "#fdd835" },
    { label: "Allotted", value: 76, color: "#2196f3" },
    { label: "In Progress", value: 24, color: "#ff9800" },
    { label: "null", value: 8, color: "#9e9e9e" },
  ];

  plotStatusChartSlices: PlotStatusChartSlice[] = [];
  contractStatusChartSlices: PlotStatusChartSlice[] = [];
  leaseTypeChartSlices: PlotStatusChartSlice[] = [];
  selectedContractStatusSlice: string | null = null;

  // Dashboard zone filter
  readonly dashboardZones = [
    'Faifa Area',
    'External Area',
    'Main Boulevard Area',
    'Al Faw Area',
    'Leenah Area',
  ];
  dashboardZoneOpen = false;
  dashboardSelectedZone: string | null = null;
  dashboardSelectedContractStatus = '';
  dashboardZoneField?: string;
  dashboardMode: "default" | "server1" = "default";
  dashboard1Loading = false;
  dashboard1Error = "";
  // Last pressed dashboard action: 'selection' | 'defination' | null
  dashboardAction: string | null = null;
  dashboard1Summary: {
    totalFeatures: number;
    contractStatusCounts: Record<string, number>;
    plotStatusCounts: Record<string, number>;
    leaseTypeCounts: Record<string, number>;
    zoneCounts: Record<string, number>;
    contractStatusField?: string;
    plotStatusField?: string;
  } | null = null;
  dashboardPlotStatusField?: string;
  private readonly dashboardChartColors = ["#4caf50", "#fdd835", "#2196f3", "#ff9800", "#9e9e9e", "#8bc34a", "#ff5722", "#9c27b0"];
  readonly branchPerformanceCategoryOrder: readonly BranchPerformanceCategory[] = ["Strong", "Moderate", "Weak"];
  readonly branchPerformanceChartPalette: Readonly<Record<BranchPerformanceCategory, string>> = {
    Strong: "#16a34a",
    Moderate: "#f59e0b",
    Weak: "#ef4444",
  };
  branchPerformanceCounts: Record<BranchPerformanceCategory, number> = {
    Strong: 0,
    Moderate: 0,
    Weak: 0,
  };
  branchPerformanceChartSlices: PlotStatusChartSlice[] = [];
  branchPerformanceLoading = false;
  branchPerformanceError = "";
  readonly atmPerformanceCategoryOrder: readonly AtmPerformanceCategory[] = ["Profit", "Loss", "Break-even"];
  readonly atmPerformanceChartPalette: Readonly<Record<AtmPerformanceCategory, string>> = {
    Profit: "#16a34a",
    Loss: "#ef4444",
    "Break-even": "#2563eb",
  };
  atmPerformanceCounts: Record<AtmPerformanceCategory, number> = {
    Profit: 0,
    Loss: 0,
    "Break-even": 0,
  };
  atmPerformanceChartSlices: PlotStatusChartSlice[] = [];
  atmPerformanceLoading = false;
  atmPerformanceError = "";

  toggleDashboardZoneList(): void {
    this.dashboardZoneOpen = !this.dashboardZoneOpen;
  }

  selectDashboardZone(zone: string): void {
    this.dashboardSelectedZone = zone;
  }

  applyDashboardZoneFilter(): void {
    if (!this.dashboardSelectedZone) return;
    // Diagnostic: log current selections and resolved dashboard fields
    console.log(
      '[DASHBOARD] ApplyFilter zone=',
      this.dashboardSelectedZone,
      'status=',
      this.dashboardSelectedContractStatus,
      'statusField=',
      this.dashboardContractStatusField,
      'zoneField=',
      this.dashboardZoneField
    );
    // If a contract status is selected, apply combined Zone+Status filter
    if (this.dashboardSelectedContractStatus) {
      // pass suppressFlash=true so dashboard selection doesn't flash
      void this.mapService.highlightParcelsByContractStatusWithZone(
        this.dashboardSelectedZone,
        this.dashboardSelectedContractStatus,
        '#de3b3b',
        this.dashboardContractStatusField,
        this.dashboardZoneField,
        true
      );
      return;
    }
    // No status selected — apply zone-only filter
    // Use the resolved zone field name if already known, otherwise fall back to common substrings
    const zoneFieldSubstrings = this.dashboardZoneField
      ? [this.dashboardZoneField]
      : ['zone english name', 'zone name', 'zone', 'area', 'sector', 'masterplan'];
    void this.mapService.highlightParcelsByAttribute(
      this.dashboardSelectedZone,
      '#2fae5a',
      zoneFieldSubstrings
    );
    void this.refreshDashboardSummary();
  }

  async refreshDashboardSummary(): Promise<void> {
    this.dashboard1Loading = true;
    try {
      const summary = await this.mapService.getDashboard1Summary(
        this.dashboardSelectedZone,
        this.dashboardSelectedContractStatus || null
      );
      this.dashboard1Summary = summary;
      this.plotStatusChartSlices = this.createPieChartSlicesFromCounts(summary.plotStatusCounts, this.plotStatusChartData);
      this.contractStatusChartSlices = this.createPieChartSlicesFromCounts(summary.contractStatusCounts, this.contractStatusChartData);
      this.leaseTypeChartSlices = this.createPieChartSlicesFromCounts(summary.leaseTypeCounts, this.leaseTypeChartData);
      this.dashboardContractStatusField = summary.contractStatusField;
      this.dashboardPlotStatusField = summary.plotStatusField;
      this.dashboardZoneField = summary.zoneField;
    } catch (err: any) {
      console.error('Dashboard summary refresh failed', err);
    } finally {
      this.dashboard1Loading = false;
      this.refreshView();
    }
  }

  clearDashboardFilter(): void {
    this.dashboardSelectedZone = null;
    this.dashboardSelectedContractStatus = '';
    void this.mapService.clearDashboardHighlights();
    void this.refreshDashboardSummary();
  }
  
  onSelectionClick(): void {
    this.dashboardAction = 'selection';
    console.log('Dashboard action: selection');
  }

  onDefinationClick(): void {
    this.dashboardAction = 'defination';
    console.log('Dashboard action: defination');
  }

  async openDashboard1Panel(): Promise<void> {
    // Toggle logic: if right panel is open and dashboard is active, hide/collapse it
    if (!this.rightPanelCollapsed && this.activeRightPanelSection === "dashboard") {
      this.rightPanelCollapsed = true;
      this.activeRightPanelSection = null;
      this.rightPanelDashboardOpen = false;
      this.refreshView();
      return;
    }
    // Otherwise, open dashboard as usual
    this.dashboardMode = "server1";
    this.dashboard1Loading = true;
    this.dashboard1Error = "";
    this.dashboard1Summary = null;
    this.expandRightPanel();
    this.resetRightPanelSections();
    this.activeRightPanelSection = "dashboard";
    this.rightPanelDashboardOpen = true;

    try {
      const summary = await this.mapService.getDashboard1Summary();
      this.dashboard1Summary = summary;
      this.plotStatusChartSlices = this.createPieChartSlicesFromCounts(summary.plotStatusCounts, this.plotStatusChartData);
      this.contractStatusChartSlices = this.createPieChartSlicesFromCounts(summary.contractStatusCounts, this.contractStatusChartData);
      this.leaseTypeChartSlices = this.createPieChartSlicesFromCounts(summary.leaseTypeCounts, this.leaseTypeChartData);
      // remember which fields the service used so highlights use the same fields
      this.dashboardContractStatusField = summary.contractStatusField;
      this.dashboardPlotStatusField = summary.plotStatusField;
      this.dashboardZoneField = summary.zoneField;
      console.log('[DASHBOARD] summary fields:', {
        contractStatusField: summary.contractStatusField,
        plotStatusField: summary.plotStatusField,
        zoneField: summary.zoneField,
      });
    } catch (err: any) {
      console.error("Dashboard1 summary failed", err);
      this.dashboard1Error = err?.message ?? "Failed to load Dashboard1 data.";
    } finally {
      this.dashboard1Loading = false;
      this.refreshView();
    }
  }

  private normalizeBranchPerformanceStatus(value: unknown): BranchPerformanceCategory | null {
    const normalized = String(value ?? "").trim().toLowerCase();
    if (!normalized) {
      return null;
    }
    if (normalized === "strong") {
      return "Strong";
    }
    if (normalized === "moderate") {
      return "Moderate";
    }
    if (normalized === "weak") {
      return "Weak";
    }
    return null;
  }

  private normalizeAtmPerformanceStatus(value: unknown): AtmPerformanceCategory | null {
    const normalized = String(value ?? "").trim().toLowerCase();
    if (!normalized) {
      return null;
    }
    if (normalized === "profit") {
      return "Profit";
    }
    if (normalized === "loss") {
      return "Loss";
    }
    if (normalized === "break-even" || normalized === "breakeven" || normalized === "break even") {
      return "Break-even";
    }
    return null;
  }

  get branchPerformanceTotal(): number {
    return this.branchPerformanceCategoryOrder.reduce((sum, key) => sum + (this.branchPerformanceCounts[key] ?? 0), 0);
  }

  get atmPerformanceTotal(): number {
    return this.atmPerformanceCategoryOrder.reduce((sum, key) => sum + (this.atmPerformanceCounts[key] ?? 0), 0);
  }

  private updateBranchPerformanceChartSlices(): void {
    const items = this.branchPerformanceCategoryOrder.map((category) => ({
      label: category,
      value: this.branchPerformanceCounts[category] ?? 0,
      color: this.branchPerformanceChartPalette[category],
    }));
    this.branchPerformanceChartSlices = this.createPieChartSlices(items);
  }

  private updateAtmPerformanceChartSlices(): void {
    const items = this.atmPerformanceCategoryOrder.map((category) => ({
      label: category,
      value: this.atmPerformanceCounts[category] ?? 0,
      color: this.atmPerformanceChartPalette[category],
    }));
    this.atmPerformanceChartSlices = this.createPieChartSlices(items);
  }

  private async loadBranchPerformanceDashboard(force = false): Promise<void> {
    if (this.branchPerformanceLoading) {
      return;
    }
    if (!force && this.branchPerformanceTotal > 0) {
      return;
    }

    this.branchPerformanceLoading = true;
    this.branchPerformanceError = "";
    try {
      const response = await fetch(BRANCH_DASHBOARD_GEOJSON_URL);
      if (!response.ok) {
        throw new Error(`Failed to load branch dashboard data: ${response.status}`);
      }

      const json = (await response.json()) as {
        features?: Array<{ properties?: Record<string, unknown> }>;
      };
      const features = Array.isArray(json.features) ? json.features : [];

      const nextCounts: Record<BranchPerformanceCategory, number> = {
        Strong: 0,
        Moderate: 0,
        Weak: 0,
      };

      for (const feature of features) {
        const category = this.normalizeBranchPerformanceStatus(feature?.properties?.["Performance_Status"]);
        if (!category) {
          continue;
        }
        nextCounts[category] += 1;
      }

      this.branchPerformanceCounts = nextCounts;
      this.updateBranchPerformanceChartSlices();
    } catch (error) {
      console.error("Failed to load branch performance dashboard", error);
      this.branchPerformanceError = "Failed to load branch performance data.";
    } finally {
      this.branchPerformanceLoading = false;
      this.refreshView();
    }
  }

  private async loadAtmPerformanceDashboard(force = false): Promise<void> {
    if (this.atmPerformanceLoading) {
      return;
    }
    if (!force && this.atmPerformanceTotal > 0) {
      return;
    }

    this.atmPerformanceLoading = true;
    this.atmPerformanceError = "";
    try {
      const response = await fetch(ATM_DASHBOARD_GEOJSON_URL);
      if (!response.ok) {
        throw new Error(`Failed to load ATM dashboard data: ${response.status}`);
      }

      const json = (await response.json()) as {
        features?: Array<{ properties?: Record<string, unknown> }>;
      };
      const features = Array.isArray(json.features) ? json.features : [];

      const nextCounts: Record<AtmPerformanceCategory, number> = {
        Profit: 0,
        Loss: 0,
        "Break-even": 0,
      };

      for (const feature of features) {
        const category = this.normalizeAtmPerformanceStatus(feature?.properties?.["Performance_Status"]);
        if (!category) {
          continue;
        }
        nextCounts[category] += 1;
      }

      this.atmPerformanceCounts = nextCounts;
      this.updateAtmPerformanceChartSlices();
    } catch (error) {
      console.error("Failed to load ATM performance dashboard", error);
      this.atmPerformanceError = "Failed to load ATM performance data.";
    } finally {
      this.atmPerformanceLoading = false;
      this.refreshView();
    }
  }

  showParcelHint(): void {
    this.parcelHintVisible = true;
    clearTimeout(this.parcelHintTimer);
    this.parcelHintTimer = setTimeout(() => {
      this.parcelHintVisible = false;
      this.refreshView();
    }, 2500);
  }

  readonly archiveSources: ArchiveSource[] = [
    { code: "DEED", title: "Deeds Sequence", subtitle: "Ownership & Title Deeds", iconClass: "deed" },
    { code: "SRV", title: "Survey Kroki / Plans", subtitle: "Survey Sketches & Site Plans", iconClass: "survey" },
    { code: "REG", title: "Regulation Kroki", subtitle: "Zoning & Regulatory Sketches", iconClass: "regulation" },
    { code: "PRM", title: "Permits", subtitle: "Building & Activity Permits", iconClass: "permit" },
    { code: "X", title: "Excel / CSV", subtitle: "Asset Lists, Road Data, etc.", iconClass: "excel" },
    { code: "CAD", title: "CAD / DWG", subtitle: "Infrastructure Drawings", iconClass: "cad" },
    { code: "PDF", title: "PDF", subtitle: "Approved Plans, Reports", iconClass: "pdf" },
    { code: "MAP", title: "Scanned Maps", subtitle: "Old Maps, Diagrams", iconClass: "map" },
    { code: "A", title: "Access / MDB", subtitle: "Maintenance Records", iconClass: "access" },
    { code: "DOC", title: "Other Documents", subtitle: "Word, Image, Reports", iconClass: "doc" },
  ];

  readonly themeOptions: ThemeOption[] = [
    { key: "current", label: "Current Theme", note: "Existing dashboard look" },
    { key: "light", label: "Light", note: "Bright neutral panels" },
    { key: "dark", label: "Dark", note: "Low-light charcoal mode" },
    { key: "meadow", label: "Meadow", note: "Soft green workspace" },
    { key: "forest", label: "Forest", note: "Deep green atlas" },
    { key: "contrast", label: "Enhanced Contrast", note: "High-contrast accessibility" },
    { key: "daytime", label: "Daytime Blue", note: "Clear daylight cyan" },
    { key: "midnight", label: "Midnight Blue", note: "Dark navy dashboard" },
    { key: "bright", label: "Bright Atlas", note: "Pastel atlas palette" },
    { key: "classic", label: "Classic Atlas", note: "Traditional map-room tones" },
  ];

  readonly mapConfig: MapConfig = {
    portalUrl: "https://www.arcgis.com",
    // NEW WebMap (view only) — Landuse&Transportation_WebMap
    webMapId: "dd12f69323894efd92f6ca63b62ed672",
    // 3D Map of the Diplomatic Quarter — WebScene item id.
    webSceneId: "db2221945864476caa603fb93f2c6de5",
    // Instant App (3D Viewer) — used as fallback to auto-discover the WebScene id.
    instantAppId: "d78c9bcf204e4810b95d67cb50a8303b",
  };

  currentTheme: ThemeKey = "current";
  themeMenuOpen = false;

  isSceneLoading = false;
  sceneError = "";
  panoramaLoading = false;
  panoramaError = "";
  panoramicClickMessage = "";
  private panoramicClickMessageTimer?: number;

  panoramaImageUrl = "/pano_000037_000005.jpg";

  // Overlay viewer for header->360 context action
  panoramaOverlayOpen = false;
  private panoramaOverlayViewer: any = null;
  private panoramaOverlayInitAttempts = 0;

  private panoramaOverlayDragActive = false;
  private panoramaOverlayDragOffset = { x: 0, y: 0 };

  private panoramaOverlayDragMove = (event: MouseEvent | TouchEvent): void => {
    if (!this.panoramaOverlayDragActive) {
      return;
    }
    event.preventDefault();
    const overlay = this.panoramaOverlayElement?.nativeElement;
    if (!overlay) {
      return;
    }
    const clientX = this.getPointerClientX(event);
    const clientY = this.getPointerClientY(event);
    const left = clientX - this.panoramaOverlayDragOffset.x;
    const top = clientY - this.panoramaOverlayDragOffset.y;
    const maxLeft = Math.max(0, window.innerWidth - overlay.offsetWidth);
    const maxTop = Math.max(0, window.innerHeight - overlay.offsetHeight);
    overlay.style.left = `${Math.min(Math.max(0, left), maxLeft)}px`;
    overlay.style.top = `${Math.min(Math.max(0, top), maxTop)}px`;
    overlay.style.transform = "none";
  };

  private panoramaOverlayDragEnd = (): void => {
    if (!this.panoramaOverlayDragActive) {
      return;
    }
    this.panoramaOverlayDragActive = false;
    document.removeEventListener("mousemove", this.panoramaOverlayDragMove);
    document.removeEventListener("mouseup", this.panoramaOverlayDragEnd);
    document.removeEventListener("touchmove", this.panoramaOverlayDragMove as any);
    document.removeEventListener("touchend", this.panoramaOverlayDragEnd as any);
  };

  private panoramaOverlayAutoTriggerTimers: number[] = [];

  private clearPanoramaOverlayAutoTriggerTimers(): void {
    for (const timer of this.panoramaOverlayAutoTriggerTimers) {
      window.clearTimeout(timer);
    }
    this.panoramaOverlayAutoTriggerTimers = [];
  }

  private schedulePanoramaOverlayHeaderButtonClicks(): void {
    this.clearPanoramaOverlayAutoTriggerTimers();
    if (!this.panoramaOverlayOpen) {
      return;
    }

    const clickOverlayButton = (count: number): void => {
      const button = document.querySelector<HTMLButtonElement>(
        ".panorama-overlay-header .btn-360-arrow"
      );
      if (button) {
        button.click();
        console.log(`Auto-triggered panorama overlay button click #${count}`);
      } else {
        console.warn("Panorama overlay header button not ready yet to auto-click.");
      }
    };

    this.panoramaOverlayAutoTriggerTimers.push(window.setTimeout(() => clickOverlayButton(1), 1000));
    this.panoramaOverlayAutoTriggerTimers.push(window.setTimeout(() => clickOverlayButton(2), 2000));
  }

  private mapSearchOverlayDragActive = false;
  private mapSearchOverlayDragStarted = false;
  private mapSearchOverlayDragThreshold = 6;
  private mapSearchOverlayDragOffset = { x: 0, y: 0 };
  private mapSearchOverlayDragStart = { x: 0, y: 0 };

  private mapSearchOverlayDragMove = (event: MouseEvent | TouchEvent): void => {
    if (!this.mapSearchOverlayDragActive) {
      return;
    }
    const clientX = this.getPointerClientX(event);
    const clientY = this.getPointerClientY(event);

    const deltaX = clientX - this.mapSearchOverlayDragStart.x;
    const deltaY = clientY - this.mapSearchOverlayDragStart.y;
    if (!this.mapSearchOverlayDragStarted) {
      if (Math.hypot(deltaX, deltaY) < this.mapSearchOverlayDragThreshold) {
        return;
      }
      this.mapSearchOverlayDragStarted = true;
    }

    event.preventDefault();
    const overlay = this.mapSearchOverlayElement?.nativeElement;
    if (!overlay) {
      return;
    }
    const left = clientX - this.mapSearchOverlayDragOffset.x;
    const top = clientY - this.mapSearchOverlayDragOffset.y;
    const maxLeft = Math.max(0, window.innerWidth - overlay.offsetWidth);
    const maxTop = Math.max(0, window.innerHeight - overlay.offsetHeight);
    overlay.style.left = `${Math.min(Math.max(0, left), maxLeft)}px`;
    overlay.style.top = `${Math.min(Math.max(0, top), maxTop)}px`;
    overlay.style.transform = "none";
  };

  private mapSearchOverlayDragEnd = (): void => {
    if (!this.mapSearchOverlayDragActive) {
      return;
    }
    this.mapSearchOverlayDragActive = false;
    document.removeEventListener("mousemove", this.mapSearchOverlayDragMove);
    document.removeEventListener("mouseup", this.mapSearchOverlayDragEnd);
    document.removeEventListener("touchmove", this.mapSearchOverlayDragMove as any);
    document.removeEventListener("touchend", this.mapSearchOverlayDragEnd as any);
  };

  // If a 3D overlay is active, this flag tracks it (uses same overlay host)
  sceneOverlayOpen = false;
  readonly cctvVideoUrl = "/cctv.mp4";

  language: UiLanguage = "en";
  readonly i18n: Record<UiLanguage, Record<TranslationKey, string>> = {
    en: {
      appTitle: "Smart city",
      noParcelSelected: "No parcel selected",
      loadingMap: "Loading map...",
      mapReady: "Map ready. Search parcel/road name or click map.",
      mapLoadFailed: "Map failed to load. Check portal/WebMap access.",
      noMatch: "No matching parcel or road found.",
      searchMasterplanFailed: "Failed to search masterplan plots.",
      panoramaLoadFailed: "Could not load the 360 image.",
      panoramaOpenFailed: "Could not open the 360 viewer.",
      loading360: "Loading 360 view...",
      selectParcel: "Select Parcel",
      plotId: "Plot ID",
      searchByParcel: "Search by plot ID",
      search: "Search",
      current: "Current",
      allLabels: "All Labels",
      matchingResults: "MATCHING RESULTS",
      apply: "Apply",
      reset: "Reset",
      moreOptions: "More Options",
      addNewDocument: "Add New Document",
      classifyDocumentType: "Classify document type",
      addDescription: "Add Description",
      describeDocument: "Describe the document",
      smartSearch: "SMART SEARCH",
      searchDocumentText: "Search document or certain text",
      find: "Find",
      filters: "Filters",
      parcelRoadName: "PARCEL / ROAD NAME",
      searchParcelRoad: "Search parcel or road",
      clearGraphics: "Clear Graphics",
      basemapSatellite: "Satellite",
      basemapWebmap: "Webmap",
      attributes: "Attributes",
      kroki: "Kroki",
      cctv: "CCTV",
      view360: "360 view",
      view3d: "3D",
      plotSheet: "Plot Sheet",
      downloadPdf: "Download PDF",
      downloadJpg: "Download JPG",
      generatedOn: "Generated on",
      generatingPlotSheet: "Generating plot sheet preview...",
      plotSheetFailed: "Failed to generate plot sheet preview.",
      open3dScene: "Open 3D scene",
      currentSearchResult: "CURRENT SEARCH RESULT",
      plotAttributes: "Plot Attributes",
      field: "Field",
      data: "Data",
      view3dPanel: "3D VIEW",
      view3dHint: "3D viewer synced to the current map location and selected parcel.",
      loading3d: "Loading 3D scene...",
      panel360Title: "360 VIEW",
      panel360Hint: "Drag with the mouse to look around the site.",
      cctvPanelTitle: "CCTV",
      cctvHint: "Continuous playback is enabled for the CCTV video.",
      archiveDataSources: "ARCHIVE DATA SOURCES",
      archiveDataDesc: "Existing data is stored in different formats and systems",
      parcelArchiveFiles: "PARCEL ARCHIVE FILES",
      uploadedDocuments: "UPLOADED DOCUMENTS",
      languageButton: "Arabic",
    },
    ar: {
      appTitle: "معلومات أراضي الحي الدبلوماسي",
      noParcelSelected: "لم يتم تحديد قطعة",
      loadingMap: "جاري تحميل الخريطة...",
      mapReady: "الخريطة جاهزة. ابحث عن العقار/الشارع أو انقر على الخريطة.",
      mapLoadFailed: "فشل تحميل الخريطة. تحقق من صلاحية البوابة/الخريطة.",
      noMatch: "لا توجد نتائج مطابقة للعقار أو الشارع.",
      searchMasterplanFailed: "فشل البحث في المخطط العام.",
      panoramaLoadFailed: "تعذر تحميل صورة 360.",
      panoramaOpenFailed: "تعذر فتح عارض 360.",
      loading360: "جاري تحميل عرض 360...",
      selectParcel: "اختيار العقار",
      plotId: "رقم القطعة",
      searchByParcel: "ابحث برقم القطعة",
      search: "بحث",
      current: "الحالي",
      allLabels: "كل التسميات",
      matchingResults: "النتائج المطابقة",
      apply: "تطبيق",
      reset: "إعادة تعيين",
      moreOptions: "خيارات إضافية",
      addNewDocument: "إضافة مستند جديد",
      classifyDocumentType: "تصنيف نوع المستند",
      addDescription: "إضافة وصف",
      describeDocument: "وصف المستند",
      smartSearch: "بحث ذكي",
      searchDocumentText: "ابحث عن مستند أو نص محدد",
      find: "بحث",
      filters: "المرشحات",
      parcelRoadName: "اسم العقار / الطريق",
      searchParcelRoad: "ابحث عن عقار أو طريق",
      clearGraphics: "مسح الرسومات",
      basemapSatellite: "صورة جوية",
      basemapWebmap: "خريطة ويب",
      attributes: "الخصائص",
      kroki: "كروكي",
      cctv: "كاميرات",
      view360: "عرض 360",
      view3d: "ثلاثي الأبعاد",
      plotSheet: "ورقة القطعة",
      downloadPdf: "تنزيل PDF",
      downloadJpg: "تنزيل JPG",
      generatedOn: "تاريخ الإنشاء",
      generatingPlotSheet: "جار إنشاء معاينة ورقة القطعة...",
      plotSheetFailed: "فشل إنشاء معاينة ورقة القطعة.",
      open3dScene: "فتح المشهد ثلاثي الأبعاد",
      currentSearchResult: "نتيجة البحث الحالية",
      plotAttributes: "خصائص القطعة",
      field: "الحقل",
      data: "البيانات",
      view3dPanel: "عرض ثلاثي الأبعاد",
      view3dHint: "عارض ثلاثي الأبعاد متزامن مع موقع الخريطة والعقار المحدد.",
      loading3d: "جاري تحميل المشهد ثلاثي الأبعاد...",
      panel360Title: "عرض 360",
      panel360Hint: "اسحب بالماوس للتجول في الموقع.",
      cctvPanelTitle: "كاميرات",
      cctvHint: "تشغيل مستمر مفعّل لفيديو كاميرات المراقبة.",
      archiveDataSources: "مصادر بيانات الأرشيف",
      archiveDataDesc: "البيانات الحالية مخزنة بصيغ وأنظمة مختلفة",
      parcelArchiveFiles: "ملفات أرشيف القطعة",
      uploadedDocuments: "المستندات المرفوعة",
      languageButton: "English",
    },
  };

  get isArabic(): boolean {
    return this.language === "ar";
  }

  t(key: TranslationKey): string {
    return this.i18n[this.language][key] ?? this.i18n.en[key] ?? key;
  }

  toggleLanguage(): void {
    this.language = this.language === "en" ? "ar" : "en";
    this.syncLanguageSensitiveTexts();
  }

  private syncLanguageSensitiveTexts(): void {
    const en = this.i18n.en;
    const ar = this.i18n.ar;
    if (this.selectedRoadLabel === en.noParcelSelected || this.selectedRoadLabel === ar.noParcelSelected) {
      this.selectedRoadLabel = this.t("noParcelSelected");
    }
    if (
      this.statusText === en.loadingMap ||
      this.statusText === ar.loadingMap ||
      this.statusText === en.mapReady ||
      this.statusText === ar.mapReady ||
      this.statusText === en.noMatch ||
      this.statusText === ar.noMatch ||
      this.statusText === en.mapLoadFailed ||
      this.statusText === ar.mapLoadFailed
    ) {
      this.statusText = this.t("mapReady");
    }
    if (this.parcelStatusText === en.noMatch || this.parcelStatusText === ar.noMatch) {
      this.parcelStatusText = this.t("noMatch");
    }
    this.refreshView();
  }

  openPanoramaDialog(): void {
    // Load the bundled panoramic image for 360-degree viewing
    this.panoramaImageUrl = "/assets/img/panoramic/bank360view.jpg";
    // close overlay if open
    if (this.panoramaOverlayOpen) {
      this.closePanoramaOverlay();
    }
    this.focusPanoramaPanel();
    this.panoramaLoading = true;
    this.panoramaError = "";

    setTimeout(() => {
      void this.initializePanoramaViewer();
      // Auto-click the overlay button after the panel is visible and stable.
      setTimeout(() => {
        // Open in overlay for better 360 experience
        this.openPanoramaOverlay();
      }, 500);
    }, 0);
  }

  private triggerPanoramaOverlayButton(): void {
    if (this.panoramaOverlayOpen) {
      return;
    }

    try {
      this.openPanoramaOverlay();
    } catch (err) {
      console.warn("Auto-trigger panorama overlay button failed", err);
    }
  }

  closePanoramaDialog(): void {
    this.rightPanelPanoramaOpen = false;
    this.panoramaLoading = false;
    this.panoramaError = "";
    this.destroyPanoramaViewer();
  }

  // Street view button handler
  streetViewOpen = false;
  streetViewLoading = false;
  streetViewError: string | null = null;
  streetViewDistance = 0;
  streetViewDistanceText = '';
  streetViewPanoramaHost: ElementRef | null = null;
  private streetViewSceneView?: SceneView;

  openStreetView(): void {
    console.log('Street 360 view button clicked');
    
    // Check if a parcel is selected
    if (!this.selectedParcel) {
      this.showParcelHint();
      return;
    }
    
    // Get coordinates from selected parcel
    const geometry = this.selectedParcel.geometry as any;
    if (!geometry || !geometry.coordinates) {
      console.warn('No geometry found for selected parcel');
      this.showParcelHint();
      return;
    }
    
    // For Polygon or MultiPolygon, get the first coordinate
    let lng = 0, lat = 0;
    if (geometry.type === 'Polygon') {
      const coords = geometry.coordinates[0];
      lng = coords[0][0];
      lat = coords[0][1];
    } else if (geometry.type === 'MultiPolygon') {
      const coords = geometry.coordinates[0][0];
      lng = coords[0][0];
      lat = coords[0][1];
    } else if (geometry.type === 'Point') {
      lng = geometry.coordinates[0];
      lat = geometry.coordinates[1];
    }
    
    // Toggle the street view panel
    if (this.streetViewOpen) {
      this.closeStreetView();
    } else {
      this.openStreetViewPanel(lat, lng);
    }
  }

  private openStreetViewPanel(lat: number, lng: number): void {
    this.streetViewOpen = true;
    this.streetViewLoading = true;
    this.streetViewError = null;
    this.refreshView();
    
    // Wait for the DOM to update, then load street view
    setTimeout(() => {
      this.loadStreetViewPanorama(lat, lng);
    }, 100);
  }

  private async loadStreetViewPanorama(lat: number, lng: number): Promise<void> {
    try {
      // Your ArcGIS Online 3D web scene (must be shared as "Everyone (public)")
      const sceneId = 'f5340806ed064453ae456dd6751c8226';
      const portalUrl = 'https://indiff2e0cd0793d.maps.arcgis.com';

      this.destroyStreetViewScene();

      // The host div is only rendered once loading is false, so clear the flag and render it first
      this.streetViewLoading = false;
      this.refreshView();

      const container = document.getElementById('street-view-panorama-host') as HTMLDivElement | null;
      if (!container) {
        this.streetViewError = 'The 3D scene could not be displayed. Please try again.';
        this.refreshView();
        return;
      }

      const webScene = new WebScene({
        portalItem: {
          id: sceneId,
          portal: { url: portalUrl },
        },
      });
      this.streetViewSceneView = new SceneView({ container, map: webScene });
      await this.streetViewSceneView.when();

      // Red marker on the selected parcel, matching the 2D map highlight
      // Lift the marker above the buildings so it is not hidden at ground level
      const target = new Point({ longitude: lng, latitude: lat, z: 150, spatialReference: { wkid: 4326 } });
      const markerLayer = new GraphicsLayer({
        id: 'selected-parcel-marker',
        elevationInfo: { mode: 'absolute-height' },
      });
      markerLayer.add(new Graphic({
        geometry: target,
        symbol: {
          type: 'simple-marker',
          style: 'circle',
          color: [255, 0, 0, 1],
          size: 14,
          outline: { color: [255, 255, 255, 1], width: 2 },
        } as any,
      }));
      webScene.add(markerLayer);

      // Fly the camera to the selected parcel at street-level tilt
      await this.streetViewSceneView.goTo(
        { target, scale: 1500, tilt: 70, heading: 0 },
        { duration: 1000 }
      );
    } catch (err) {
      console.error('Failed to load 3D scene:', err);
      this.streetViewError = 'Failed to load the 3D scene. Please try again.';
      this.streetViewLoading = false;
      this.refreshView();
    }
  }

  private destroyStreetViewScene(): void {
    this.streetViewSceneView?.destroy();
    this.streetViewSceneView = undefined;
  }

  closeStreetView(): void {
    this.destroyStreetViewScene();
    this.streetViewOpen = false;
    this.streetViewLoading = false;
    this.streetViewError = null;
    this.streetViewDistance = 0;
    this.streetViewDistanceText = '';
    this.refreshView();
  }

  // Open panorama as an overlay on top of the map
  openPanoramaOverlay(): void {
    // close right-panel panorama if open
    if (this.rightPanelPanoramaOpen) {
      this.closePanoramaDialog();
    }
    if (this.panoramaIframeOpen) {
      this.closePanoramaIframe();
    }
    // close scene overlay if it is currently open
    if (this.sceneOverlayOpen) {
      this.sceneOverlayOpen = false;
    }

    if (this.panoramaOverlayOpen) {
      // Keep the overlay visible and reload the viewer when the button is pressed again.
      this.panoramaLoading = true;
      this.panoramaError = "";
      this.panoramaOverlayInitAttempts = 0;
      this.destroyPanoramaOverlayViewer();
      this.refreshView();
      setTimeout(() => void this.initializePanoramaOverlayViewer(), 0);
      return;
    }

    this.panoramaOverlayOpen = true;
    this.panoramaLoading = true;
    this.panoramaError = "";
    this.panoramaOverlayInitAttempts = 0;
    setTimeout(() => {
      const overlay = this.panoramaOverlayElement?.nativeElement;
      if (overlay) {
        overlay.style.left = "50%";
        overlay.style.top = "80px";
        overlay.style.transform = "translateX(-50%)";
      }
      void this.initializePanoramaOverlayViewer();
      this.schedulePanoramaOverlayHeaderButtonClicks();
    }, 0);
  }

  startPanoramaOverlayDrag(event: MouseEvent | TouchEvent): void {
    if (!this.panoramaOverlayElement) {
      return;
    }

    const target = (event.target as HTMLElement | null);
    if (target?.closest("button")) {
      return;
    }

    const overlay = this.panoramaOverlayElement.nativeElement;
    const rect = overlay.getBoundingClientRect();
    const clientX = this.getPointerClientX(event);
    const clientY = this.getPointerClientY(event);

    this.panoramaOverlayDragActive = true;
    this.panoramaOverlayDragOffset = {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };

    overlay.style.left = `${rect.left}px`;
    overlay.style.top = `${rect.top}px`;
    overlay.style.transform = "none";

    document.addEventListener("mousemove", this.panoramaOverlayDragMove);
    document.addEventListener("mouseup", this.panoramaOverlayDragEnd);
    document.addEventListener("touchmove", this.panoramaOverlayDragMove as any, { passive: false });
    document.addEventListener("touchend", this.panoramaOverlayDragEnd as any);
  }

  startMapSearchDrag(event: MouseEvent | TouchEvent): void {
    // Temporarily disable drag interaction so clicks do not relocate the overlay.
    return;
  }

  private getPointerClientX(event: MouseEvent | TouchEvent): number {
    return event instanceof MouseEvent ? event.clientX : event.touches[0]?.clientX ?? 0;
  }

  private getPointerClientY(event: MouseEvent | TouchEvent): number {
    return event instanceof MouseEvent ? event.clientY : event.touches[0]?.clientY ?? 0;
  }

  private async findPanoramaUrl(fileName: string): Promise<string> {
    const cleanName = fileName.trim();
    const imageName = `${cleanName}.jpg`;
    const urls = [
      `http://localhost/360view/${imageName}`,
      `http://localhost/360view1/${imageName}`,
    ];

    for (const url of urls) {
      console.log('[panoramicjson] checking URL:', url);
      const exists = await new Promise<boolean>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
      });
      if (exists) {
        console.log('[panoramicjson] URL found:', url);
        return url;
      }
    }

    throw new Error(`No panorama image found for ${fileName}`);
  }

  private async openPanoramaByFileName(fileName: string): Promise<void> {
    try {
      const url = await this.findPanoramaUrl(fileName);
      console.log('[panoramicjson] opening panorama URL:', url);
      this.panoramaImageUrl = url;
      this.panoramaLoading = true;
      this.panoramaError = "";
      this.openPanoramaOverlay();
    } catch (err) {
      console.error('[panoramicjson] failed to open panorama by file name', err);
      this.panoramaError = `Could not open the 360 viewer. URL tried: ${fileName}.jpg (${String(err)})`;
      this.panoramaLoading = false;
    }
  }

  openPanoramaIframe(url: string): void {
    console.log('[DEBUG] openPanoramaIframe called with URL:', url);
    if (this.panoramaOverlayOpen) {
      this.closePanoramaOverlay();
    }
    if (this.rightPanelPanoramaOpen) {
      this.closePanoramaDialog();
    }
    if (this.sceneOverlayOpen) {
      this.sceneOverlayOpen = false;
    }

    this.panoramaIframeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    console.log('[DEBUG] panoramaIframeUrl set to:', this.panoramaIframeUrl);
    this.panoramaIframeOpen = true;
    console.log('[DEBUG] panoramaIframeOpen set to:', this.panoramaIframeOpen);
    this.panoramaLoading = false;
    this.panoramaError = "";
  }

  closePanoramaIframe(): void {
    this.panoramaIframeOpen = false;
    this.panoramaIframeUrl = null;
    this.panoramaLoading = false;
  }

  closePanoramaOverlay(): void {
    this.panoramaOverlayOpen = false;
    this.sceneOverlayOpen = false;
    this.panoramaIframeOpen = false;
    this.panoramaIframeUrl = null;
    this.panoramaLoading = false;
    this.panoramaError = "";
    this.panoramaFallbackUrl = null;
    this.clearPanoramaOverlayAutoTriggerTimers();
    this.destroyPanoramaOverlayViewer();
    // detach scene from overlay host cleanly so it can be reattached later
    try {
      this.mapService.detachScene();
    } catch {}
  }

  get canOpenCctv(): boolean {
    return !!this.selectedParcel || this.parcelMatches.length > 0 || this.matchingParcels.length > 0;
  }

  openCctvDialog(): void {
    if (!this.canOpenCctv) {
      return;
    }
    this.focusCctvPanel();
  }

  closeCctvDialog(): void {
    this.rightPanelCctvOpen = false;
  }

  private async initializePanoramaViewer(): Promise<void> {
    const host = this.panoramaHost?.nativeElement;
    if (!host || !this.rightPanelPanoramaOpen) {
      return;
    }

    this.destroyPanoramaViewer();

    try {
      this.panoramaViewer = new Viewer({
        container: host,
        panorama: this.panoramaImageUrl,
        loadingTxt: this.t("loading360"),
        mousewheel: true,
        navbar: ["zoom", "move", "fullscreen"],
        touchmoveTwoFingers: false,
        defaultYaw: "130deg",
        defaultPitch: "-5deg",
      });

      this.panoramaViewer.addEventListener("panorama-loaded", () => {
        this.panoramaLoading = false;
        this.refreshView();
      });

      this.panoramaViewer.addEventListener("ready", () => {
        this.panoramaLoading = false;
        this.refreshView();
      });

      // safety fallback: clear loading after 5 s regardless
      setTimeout(() => {
        if (this.panoramaLoading) {
          this.panoramaLoading = false;
          this.refreshView();
        }
      }, 5000);

      this.panoramaViewer.addEventListener("panorama-error", () => {
        this.panoramaLoading = false;
        this.panoramaError = this.t("panoramaLoadFailed");
        this.refreshView();
        // If the inline right-panel viewer fails, retry by opening the overlay
        // so the user does not need to manually click the white arrow.
        try {
          this.openPanoramaOverlay();
        } catch (err) {
          console.warn("Failed to auto-open panorama overlay after inline viewer error", err);
        }
      });
    } catch (error) {
      console.error("Panorama viewer init failed", error);
      this.panoramaLoading = false;
      this.panoramaError = this.t("panoramaOpenFailed");
      try {
        this.openPanoramaOverlay();
      } catch (err) {
        console.warn("Failed to auto-open panorama overlay after initialization exception", err);
      }
      this.destroyPanoramaViewer();
      this.refreshView();
    }
  }

  private async initializePanoramaOverlayViewer(): Promise<void> {
    const host = this.panoramaOverlayHost?.nativeElement;
    if (!host || !this.panoramaOverlayOpen) {
      if (this.panoramaOverlayInitAttempts < 10) {
        this.panoramaOverlayInitAttempts++;
        setTimeout(() => void this.initializePanoramaOverlayViewer(), 100);
      } else {
        this.panoramaLoading = false;
        this.panoramaError = this.t('panoramaOpenFailed');
        this.refreshView();
      }
      return;
    }

    // if a scene is attached, detach it first
    try { this.mapService.detachScene(); } catch {}
    this.destroyPanoramaOverlayViewer();

    try {
      this.panoramaOverlayViewer = new Viewer({
        container: host,
        panorama: this.panoramaImageUrl,
        loadingTxt: this.t("loading360"),
        mousewheel: true,
        navbar: ["zoom", "move", "fullscreen"],
        touchmoveTwoFingers: false,
        defaultYaw: "130deg",
        defaultPitch: "-5deg",
      });

      this.panoramaOverlayViewer.addEventListener("panorama-loaded", () => {
        this.panoramaLoading = false;
        this.panoramaFallbackUrl = null;
        this.refreshView();
      });

      this.panoramaOverlayViewer.addEventListener("ready", () => {
        this.panoramaLoading = false;
        this.panoramaFallbackUrl = null;
        this.refreshView();
      });

      // safety fallback: clear loading after 5 s regardless
      setTimeout(() => {
        if (this.panoramaLoading) {
          this.panoramaLoading = false;
          this.refreshView();
        }
      }, 5000);

      this.panoramaOverlayViewer.addEventListener("panorama-error", () => {
        this.panoramaLoading = false;
        this.panoramaError = `${this.t("panoramaLoadFailed")} URL: ${this.panoramaImageUrl}`;
        this.panoramaFallbackUrl = this.panoramaBlobUrl;
        this.refreshView();
      });
      // reset attempts after successful init
      this.panoramaOverlayInitAttempts = 0;
    } catch (error) {
      console.error("Panorama overlay init failed", error);
      this.panoramaLoading = false;
      this.panoramicServiceUnavailableMessage = 'Panoramic portal is unavailable. Internet access is required for this feature.';
      this.refreshView();
    }
  }

  private destroyPanoramaOverlayViewer(): void {
    try {
      this.panoramaOverlayViewer?.destroy();
    } catch {}
    this.panoramaOverlayViewer = null;
    this.panoramaOverlayInitAttempts = 0;
  }

  private openPanoramaBlob(blob: Blob): void {
    if (this.panoramaBlobUrl) {
      URL.revokeObjectURL(this.panoramaBlobUrl);
      this.panoramaBlobUrl = null;
    }

    this.panoramaBlobUrl = URL.createObjectURL(blob);
    console.log('[street view] panorama object URL', this.panoramaBlobUrl);
    this.panoramaFallbackUrl = null;
    this.panoramaImageUrl = this.panoramaBlobUrl;
    this.panoramaLoading = true;
    this.panoramaError = "";
    this.openPanoramaOverlay();
  }

  // Open 3D Scene in its own overlay host on top of the map
  openSceneOverlay(): void {
    // close any panorama overlay first
    if (this.panoramaOverlayViewer) { this.destroyPanoramaOverlayViewer(); }
    // close right-panel 3D if open
    if (this.rightPanelSceneOpen) {
      this.rightPanelSceneOpen = false;
    }
    this.panoramaOverlayOpen = false;
    this.sceneOverlayOpen = true;
    this.isSceneLoading = true;
    this.sceneError = "";
    setTimeout(() => void this.initializeSceneOverlay(), 0);
  }

  // Arrow button: open 3D in overlay on map
  open3DOverlay(): void {
    this.openSceneOverlay();
  }

  async initializeSceneOverlay(): Promise<void> {
    const host = this.sceneOverlayHost?.nativeElement;
    if (!host || !this.sceneOverlayOpen) return;
    try {
      await this.mapService.initializeScene(host);
      // sync current map viewpoint to scene
      this.mapService.syncMapToScene();
      this.isSceneLoading = false;
      this.refreshView();
    } catch (err) {
      console.error('Scene overlay init failed', err);
      this.sceneError = this.t('loading3d') || 'Failed to open 3D';
      this.isSceneLoading = false;
      this.refreshView();
    }
  }

  private destroyPanoramaViewer(): void {
    this.panoramaViewer?.destroy();
    this.panoramaViewer = null;
  }

  searchText = "";
  selectedParcel: Parcel | null = null;
  dashboardContractStatusField?: string;
  matchingParcels: Parcel[] = [];
  groupedFiles: ArchiveFileGroup[] = [];
  selectedRoadLabel = this.t("noParcelSelected");
  statusText = this.t("loadingMap");
  isSearching = false;
  isLoadingArchive = false;
  leftPanelCollapsed = false;

  // ── Header context menu ────────────────────────────────────────────
  headerContextMenuOpen = false;
  headerContextMenuX = 0;
  headerContextMenuY = 0;

  selectedRoadContextMenuOpen = false;
  selectedRoadContextMenuX = 0;
  selectedRoadContextMenuY = 0;

  // Comments map popup
  commentsPopupOpen = false;

  // Right-panel legend section
  rightPanelLegendOpen = false;
  rightPanelResultOpen = false;
  rightPanelPanoramaOpen = false;
  rightPanelCctvOpen = false;
  rightPanelKrokiOpen = false;
  rightPanelSourcesOpen = false;
  rightPanelFilesOpen = false;
  rightPanelUploadsOpen = false;
  rightPanelCommentsOpen = false;
  rightPanelDashboardOpen = false;
  rightPanelReportsOpen = false;
  rightPanelVoiceAgentOpen = false;
  reportsDataset: ReportsDataset = "branch";
  branchReportRows: BranchReportRow[] = [];
  private branchReportsCache: BranchReportRow[] = [];
  private atmReportsCache: BranchReportRow[] = [];
  branchReportDisplayedRows: BranchReportRow[] = [];
  branchReportQuery = "";
  branchReportsLoading = false;
  branchReportsError = "";
  pendingUpdateRecords: PendingUpdateRecord[] = [];
  pendingUpdatesLoading = false;
  pendingUpdatesError = "";
  activeRightPanelSection: RightPanelSection | null = null;
  private legendWidget: any = null;
  private legendClickHandlerBound: ((ev: MouseEvent) => void) | null = null;

  onHeaderContextMenu(event: MouseEvent): void {
    event.preventDefault();
    this.headerContextMenuX = event.clientX;
    this.headerContextMenuY = event.clientY;
    this.headerContextMenuOpen = true;
    this.selectedRoadContextMenuOpen = false;
  }

  closeHeaderContextMenu(): void {
    this.headerContextMenuOpen = false;
  }

  onSelectedRoadDoubleClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.selectedRoadContextMenuX = event.clientX;
    this.selectedRoadContextMenuY = event.clientY;
    this.selectedRoadContextMenuOpen = true;
    this.headerContextMenuOpen = false;
  }

  closeSelectedRoadContextMenu(): void {
    this.selectedRoadContextMenuOpen = false;
  }

  togglePopupOnMapClick(): void {
    this.showPopupOnMapClick = !this.showPopupOnMapClick;
    console.log('[selected road dblclick] showPopupOnMapClick toggled ->', this.showPopupOnMapClick);
  }

  openCommentsPopup(): void {
    this.headerContextMenuOpen = false;
    this.commentsPopupOpen = true;
  }

  hidePanoramicLayerAction(): void {
    console.log('[selected road dblclick] Hide panoramic layer action');
    this.selectedRoadContextMenuOpen = false;

    const webMap = this.mapService.getWebMap();
    const jsonLayer = webMap?.findLayerById('panoramic-json-layer') as any;
    const jsonLayerVisible = !!jsonLayer?.visible;

    if (jsonLayerVisible) {
      jsonLayer.visible = false;
      this.panoramicJsonLayerVisible = false;
      console.log('[selected road dblclick] Panoramic JSON layer hidden');
    }

    const pointLayerVisible = this.panoramicPointsService.getLayerVisibility?.() ?? false;
    if (pointLayerVisible) {
      this.panoramicPointsService.setLayerVisibility(false);
      this.panoramicPointLayerVisible = false;
      console.log('[selected road dblclick] Generated panoramic points layer hidden');
    }

    if (!jsonLayerVisible && !pointLayerVisible) {
      console.log('[selected road dblclick] No panoramic layer was visible');
    }
  }

  on360vContextAction(): void {
    console.log('[360v] Header context menu action clicked');
    console.log('[360v] Important points:');
    console.log('  1. Use the selected plot polygon or nearest road edge.');
    console.log('  2. Query panorama points near that polygon.');
    console.log('  3. Select the nearest panorama point.');
    console.log('  4. Load the 360 panorama overlay via existing viewer.');
    console.log('  5. If no point is found, inspect the parcel/panorama data or adjust the search area.');
    this.closeHeaderContextMenu();
    this.openPanoramaOverlay();
  }

  panoramicJsonLayerVisible = false;
  panoramicPointLayerVisible = false;

  onPanoramicPointsContextAction(): void {
    console.log('[panoramic points] Header context menu action clicked');
    console.log('[panoramic points] Important points:');
    console.log('  1. Use the selected parcel geometry to generate road-side points.');
    console.log('  2. Create a dedicated panoramic points layer on the map.');
    console.log('  3. Display points near the parcel boundary on the road.');

    this.closeHeaderContextMenu();

    if (!this.isPanaromicView1Active) {
      console.log('[panoramic points] Panaromic View1 is not active; skipping generation of panoramic points.');
      return;
    }

    if (!this.selectedParcel) {
      console.warn('[panoramic points] No parcel selected to generate points.');
      return;
    }

    const mapView = this.mapService.getMapView();
    const webMap = this.mapService.getWebMap();
    if (!mapView || !webMap) {
      console.warn('[panoramic points] Map is not ready yet.');
      return;
    }

    this.panoramicPointsService.showPointsForParcel(this.selectedParcel, webMap, mapView);
  }

  // Header convenience action: run panoramic-points flow and also trigger panoramic JSON loader
  onPanoramicPointsHeaderAction(): void {
    this.closeHeaderContextMenu();
    try {
      // Only run panoramic points generation if Panaromic View1 is active.
      if (this.isPanaromicView1Active) {
        this.onPanoramicPointsContextAction();
      } else {
        console.log('[panoramic points header] Panaromic View1 inactive; skipping panoramic points generation.');
      }
    } catch (e) {
      console.error('[panoramic points header] failed to run panoramic points action', e);
    }
    // also call the panoramic JSON handler (async)
    void this.onPanoramicJson();
  }

  openLegendPanel(): void {
    this.closeHeaderContextMenu();

    if (this.activeRightPanelSection === "legend" && this.rightPanelLegendOpen && !this.rightPanelCollapsed) {
      this.resetRightPanelSections();
      this.rightPanelCollapsed = true;
      return;
    }

    this.focusLegendPanel();
  }

  closeCommentsPopup(): void {
    this.commentsPopupOpen = false;
  }

  // How to Use / About dialogs
  howToUseOpen = false;
  aboutOpen = false;
  plotSheetDialogOpen = false;
  plotSheetLoading = false;
  plotSheetError = "";
  plotSheetImageUrl = "";
  plotSheetGeneratedAt = "";
  plotSheetExporting = false;
  plotSheet1DialogOpen = false;
  plotSheet1Loading = false;
  plotSheet1Error = "";
  plotSheet1ImageUrl = "";
  plotSheet1GeneratedAt = "";
  plotSheet1Exporting = false;
  plotSheet1ContextMenuOpen = false;

  togglePlotSheet1ContextMenu(): void {
    this.plotSheet1ContextMenuOpen = !this.plotSheet1ContextMenuOpen;
  }

  closePlotSheet1ContextMenu(): void {
    this.plotSheet1ContextMenuOpen = false;
  }
  showPlotSheet1Grid = false;
  private locationMapView: MapView | null = null;

  get plotSheetDetails(): { label: string; value: string }[] {
    const attrs = (this.selectedParcel?.attributes ?? {}) as Record<string, unknown>;
    const pick = (...keys: string[]): string => {
      for (const k of keys) {
        const v = attrs[k];
        if (v !== undefined && v !== null && `${v}`.trim() !== "") return String(v);
      }
      return "-";
    };
    const areaRaw = attrs["PSh Area (m\u00b2)"] ?? attrs["Shape_Area"] ?? attrs["Area"];
    const area = typeof areaRaw === "number"
      ? `${areaRaw.toFixed(2)} m\u00b2`
      : areaRaw
        ? `${areaRaw} m\u00b2`
        : "-";
    return [
      { label: "PLOT NUMBER", value: this.selectedParcel?.displayName || this.selectedParcel?.id || "-" },
      { label: "DQ NAME", value: "Diplomatic Quarter" },
      { label: "LANDUSE", value: pick("Landuse (English)", "Sub Landuse", "LandUseCategory") },
      { label: "ZONE NAME", value: pick("Zone English Name", "Zone Name") },
      { label: "USERNAME", value: pick("Username", "User") },
      { label: "PLOT AREA", value: area },
      { label: "CONTRACT STATUS", value: pick("Contract Status", "Plot Status") },
    ];
  }

  get plotSheetCoordinates(): { idx: number; east: string; north: string }[] {
    const ring = this.firstParcelRing();
    if (!ring.length) return [];
    return ring.slice(0, 12).map((p, i) => {
      const [east, north] = this.lonLatToWebMercator(p[0], p[1]);
      return { idx: i + 1, east: east.toFixed(3), north: north.toFixed(3) };
    });
  }

  get plotSheetCoordinatesAll(): { idx: number; east: string; north: string }[] {
    const ring = this.firstParcelRing();
    if (!ring.length) return [];
    return ring.map((p, i) => {
      const [east, north] = this.lonLatToWebMercator(p[0], p[1]);
      return { idx: i + 1, east: east.toFixed(3), north: north.toFixed(3) };
    });
  }

  get plotSheetCenter(): { lat: string; lng: string } {
    const ring = this.firstParcelRing();
    if (!ring.length) return { lat: "-", lng: "-" };
    const cx = ring.reduce((s, p) => s + p[0], 0) / ring.length;
    const cy = ring.reduce((s, p) => s + p[1], 0) / ring.length;
    return { lat: cy.toFixed(6), lng: cx.toFixed(6) };
  }

  private firstParcelRing(): number[][] {
    const geom = this.selectedParcel?.geometry as { type: string; coordinates: unknown; rings?: number[][][] } | undefined;
    if (!geom) return [];
    let ring: number[][] = [];
    // GeoJSON geometry (search-selected or enriched map-click)
    if (geom.type === "Polygon" || geom.type === "polygon") {
      ring = ((geom as any).coordinates as number[][][])?.[0] ?? (geom.rings as number[][][])?.[0] ?? [];
    } else if (geom.type === "MultiPolygon" || geom.type === "multipolygon") {
      ring = (((geom as any).coordinates as number[][][][])?.[0] ?? [[]])?.[0] ?? (geom.rings as number[][][])?.[0] ?? [];
    } else if (geom.rings) {
      // Esri Polygon fallback (map-click geometry not enriched by masterplan)
      ring = geom.rings[0] ?? [];
    }
    if (ring.length > 1) {
      const first = ring[0];
      const last = ring[ring.length - 1];
      if (first[0] === last[0] && first[1] === last[1]) {
        ring = ring.slice(0, -1);
      }
    }
    return ring;
  }

  private lonLatToWebMercator(lon: number, lat: number): [number, number] {
    const R = 6378137;
    const x = (lon * Math.PI / 180) * R;
    const clamped = Math.max(Math.min(lat, 85.05112878), -85.05112878);
    const y = Math.log(Math.tan(Math.PI / 4 + (clamped * Math.PI / 180) / 2)) * R;
    return [x, y];
  }

  ngOnInit(): void {
    this.updateBranchPerformanceChartSlices();
    this.updateAtmPerformanceChartSlices();

    this.panoramicPointsService.panoramicPointClick$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ missionName, imageName }) => {
        console.log('[panoramic point click] opening panorama overlay before API response');
        this.openPanoramaOverlay();
      });

    this.streetViewService.panoramaBlob$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ blob, missionName, imageName }) => {
        console.log('[street view] Panorama blob received for', missionName, imageName);
        console.log('[street view] pasted image', blob);
        this.openPanoramaBlob(blob);
      });

    this.onlineListener = () => {
      this.isOnline = true;
      this.panoramicServiceUnavailableMessage = "";
      void this.checkPanoramicServiceAvailability();
      this.refreshView();
    };
    this.offlineListener = () => {
      this.isOnline = false;
      this.panoramicServiceAvailable = false;
      this.panoramicServiceUnavailableMessage = 'Offline mode: panoramic portal unavailable.';
      this.refreshView();
    };
    window.addEventListener('online', this.onlineListener);
    window.addEventListener('offline', this.offlineListener);

    const params = new URLSearchParams(window.location.search);
    if (params.get("printTemplate") === "1") {
      const plotIdParam = params.get("plotId");
      if (plotIdParam) {
        void this.mapService.searchMasterplanPlots(plotIdParam.trim()).then((matches) => {
          const p = matches[0] ?? null;
          if (p) {
            this.selectedParcel = p;
            this.plotPrintGeneratedAt = this.formatHumanDateTime(new Date());
            this.plotPrintDialogOpen = true;
          } else {
            console.warn("Print template: parcel not found for plotId", plotIdParam);
          }
        }).catch((err) => console.warn("Print template fetch failed", err));
      }
      else {
        console.warn("Print template: plotId is required when cache is disabled.");
      }
    }
  }

  private async refreshSelectedParcelFromLive(parcel: Parcel): Promise<Parcel | null> {
    return this.isLocationIdSearch(parcel.id) ? null : parcel;
  }

  private isLocationIdSearch(value: string | null | undefined): boolean {
    const normalized = String(value ?? "").trim().toUpperCase();
    return normalized.startsWith("ATM-") || normalized.startsWith("BR-");
  }

  private mapSelectedParcelToDownloadLocation(parcel: Parcel | null): SelectedLocation | null {
    if (!parcel) {
      return null;
    }

    const firstNonEmpty = (values: unknown[]): string => {
      for (const value of values) {
        const text = String(value ?? "").trim();
        if (text) {
          return text;
        }
      }
      return "";
    };

    const attrs = (parcel.attributes ?? {}) as Record<string, unknown>;
    const branchId = firstNonEmpty([attrs["Branch_ID"], attrs["branch_id"], attrs["id"]]);
    const atmId = firstNonEmpty([attrs["ATM_ID"], attrs["atm_id"], attrs["id"]]);
    const fallbackId = String(parcel.id ?? "").trim();
    const normalizedFallbackId = fallbackId.toUpperCase();

    const type: "branch" | "atm" | null = branchId
      ? "branch"
      : atmId
      ? "atm"
      : normalizedFallbackId.startsWith("BR-")
      ? "branch"
      : normalizedFallbackId.startsWith("ATM-")
      ? "atm"
      : null;

    if (!type) {
      return null;
    }

    const id = type === "branch" ? (branchId || fallbackId) : (atmId || fallbackId);
    const bankName = firstNonEmpty([attrs["Bank_Name"], attrs["bank_name"], attrs["BankName"], attrs["bankName"]]) || "Unknown bank";
    const district = firstNonEmpty([attrs["District"], attrs["district"]]) || "Unknown district";
    const name = type === "branch"
      ? (firstNonEmpty([attrs["Branch_Name"], attrs["branch_name"], attrs["name"]]) || String(parcel.displayName ?? id))
      : (firstNonEmpty([attrs["Site_Name"], attrs["site_name"], attrs["name"]]) || String(parcel.displayName ?? id));

    return {
      type,
      id,
      bankName,
      district,
      name,
      rawData: attrs,
    };
  }

  selectedDownloadLocation: SelectedLocation | null = null;

  canDownloadSelection(): boolean {
    if (this.mapSelectedParcelToDownloadLocation(this.selectedParcel)) {
      return true;
    }
    const geometry = this.selectedParcel?.geometry as { type?: string; rings?: unknown } | undefined;
    if (!geometry) {
      return false;
    }
    if (Array.isArray(geometry.rings)) {
      return true;
    }
    const type = String(geometry.type ?? "").toLowerCase();
    return type === "polygon" || type === "multipolygon";
  }

  private async captureMapPreviewDataUrl(): Promise<string | null> {
    try {
      const view = this.mapService.getMapView();
      if (view) {
        await view.when();
        if (view.updating) {
          await new Promise<void>((resolve) => setTimeout(() => resolve(), 200));
        }
      }

      return await this.mapService.takeMapScreenshot(1400, 900);
    } catch (error) {
      console.warn("captureMapPreviewDataUrl failed", error);
      return null;
    }
  }

  openHowToUse(): void {
    this.headerContextMenuOpen = false;
    this.howToUseOpen = true;
  }

  openAbout(): void {
    this.headerContextMenuOpen = false;
    this.aboutOpen = true;
  }

  plotPrintDialogOpen = false;
  plotPrintGeneratedAt = "";
  plotPrintExporting = false;

  presentationPlotDialogOpen = false;

  openPlotPrintDialog(): void {
    if (!this.selectedParcel) {
      console.warn("openPlotPrintDialog: no selectedParcel");
      return;
    }

    try {
      console.log("openPlotPrintDialog: selectedParcel", this.selectedParcel);
      this.plotPrintGeneratedAt = this.formatHumanDateTime(new Date());

      const baseUrl = window.location.href.replace(/[#?].*$/, "");
      const plotId = String(this.selectedParcel.displayName || this.selectedParcel.attributes?.["PlotID"] || this.selectedParcel.id || "").trim();
      if (!plotId) {
        console.warn("openPlotPrintDialog: no plotId available for live print fetch");
        return;
      }
      const opened = window.open(`${baseUrl}?printTemplate=1&plotId=${encodeURIComponent(plotId)}`, "_blank");
      if (!opened) {
        // Popup blocked — fallback to opening in same tab
        console.warn("Popup blocked — opening print template in same tab");
        window.location.href = `${baseUrl}?printTemplate=1`;
      }
    } catch (err) {
      console.error("openPlotPrintDialog failed", err);
      try {
        // Best-effort fallback
        const baseUrl = window.location.href.replace(/[#?].*$/, "");
        window.location.href = `${baseUrl}?printTemplate=1`;
      } catch (_) {}
    }
  }

  closePlotPrintDialog(): void {
    this.plotPrintDialogOpen = false;
  }

  async openPresentationPlotDialog(): Promise<void> {
    if (!this.selectedParcel) {
      return;
    }
    const selectedLocation = this.mapSelectedParcelToDownloadLocation(this.selectedParcel);
    if (selectedLocation) {
      const previewUrl = await this.captureMapPreviewDataUrl();
      const rawData = (selectedLocation.rawData && typeof selectedLocation.rawData === "object")
        ? (selectedLocation.rawData as Record<string, unknown>)
        : {};
      selectedLocation.rawData = {
        ...rawData,
        mapPreviewUrl: previewUrl ?? "",
      };
      this.selectedDownloadLocation = selectedLocation;
      return;
    }
    this.presentationPlotDialogOpen = true;
  }

  closePresentationPlotDialog(): void {
    this.presentationPlotDialogOpen = false;
  }

  dashboardComponentOpen = false;
  dashboardComponentType: "atm" | "branch" | null = null;
  dashboardComponentSearch = "";

  openDashboardComponent(): void {
    const term = String(this.parcelSearchText ?? "").trim();
    const termUpper = term.toUpperCase();
    let type: "atm" | "branch" | null = null;

    if (termUpper.startsWith("ATM-")) {
      type = "atm";
    } else if (termUpper.startsWith("BR-")) {
      type = "branch";
    } else if (!term) {
      type = this.mapSelectedParcelToDownloadLocation(this.selectedParcel)?.type ?? null;
    }

    if (!type) {
      this.parcelStatusText = "Enter an ATM or branch ID (ATM-... or BR-...) to open the dashboard.";
      return;
    }

    this.dashboardComponentSearch = term || String(this.selectedParcel?.id ?? "");
    this.dashboardComponentType = type;
    this.dashboardComponentOpen = true;
  }

  closeDashboardComponent(): void {
    this.dashboardComponentOpen = false;
    this.dashboardComponentType = null;
  }

  closeDownloadModal(): void {
    this.selectedDownloadLocation = null;
  }

  async downloadPlotPrintA1Pdf(): Promise<void> {
    const pdf = await this.capturePlotPrintA1Pdf();
    if (!pdf) return;
    pdf.save(`${this.buildPlotPrintFileBaseName()}.pdf`);
  }

  async openPlotPrintA1Preview(): Promise<void> {
    const pdf = await this.capturePlotPrintA1Pdf();
    if (!pdf) return;
    const url = pdf.output("bloburl");
    window.open(url, "_blank");
  }

  async printPlotPrintA1(): Promise<void> {
    const pdf = await this.capturePlotPrintA1Pdf();
    if (!pdf) return;
    const url = pdf.output("bloburl");
    const win = window.open(url, "_blank");
    if (!win) return;
  }

  private async capturePlotPrintA1Pdf(): Promise<jsPDF | null> {
    const dataUrl = await this.capturePlotPrintTemplate("image/jpeg", 0.95);
    if (!dataUrl) return null;
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a1" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const props = pdf.getImageProperties(dataUrl);
    const ratio = props.width / props.height;
    const pageRatio = pageWidth / pageHeight;
    const renderWidth = ratio > pageRatio ? pageWidth : pageHeight * ratio;
    const renderHeight = ratio > pageRatio ? pageWidth / ratio : pageHeight;
    const x = (pageWidth - renderWidth) / 2;
    const y = (pageHeight - renderHeight) / 2;
    pdf.addImage(dataUrl, "JPEG", x, y, renderWidth, renderHeight);
    return pdf;
  }

  private async capturePlotPrintTemplate(mime: "image/png" | "image/jpeg", quality = 0.92): Promise<string | null> {
    const node = this.plotPrintTemplate?.nativeElement;
    if (!node) return null;
    this.plotPrintExporting = true;
    this.refreshView();
    try {
      const canvas = await html2canvas(node, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      return canvas.toDataURL(mime, quality);
    } catch (err) {
      console.error("Plot print capture failed", err);
      return null;
    } finally {
      this.plotPrintExporting = false;
      this.refreshView();
    }
  }

  private buildPlotPrintFileBaseName(): string {
    const idSource = this.selectedParcel?.displayName || this.selectedParcel?.id || "plot-print";
    return `plot-print-${idSource}`;
  }

  // Card collapse state: parcel card open, roads/filters card collapsed by default
  parcelCardOpen = true;
  roadsCardOpen = false;

  // Dataset selector
  activeDataset: '2026' | '2018' = '2026';

  // Label rendering mode for parcels on the map
  labelMode: 'current' | 'all' = 'current';

  onLabelModeChange(): void {
    this.mapService.setLabelMode(this.labelMode);
  }

  // Basemap toggle: "webmap" = full Landuse&Transportation webmap;
  //                 "satellite" = GISDATAOWNER satellite ImageServer only.
  basemapMode: 'webmap' | 'satellite' = 'webmap';

  toggleBasemap(): void {
    this.basemapMode = this.basemapMode === 'webmap' ? 'satellite' : 'webmap';
    this.mapService.setBasemapMode(this.basemapMode);
  }

  // Satellite context menu state
  satelliteMenuOpen = false;

  openSatelliteMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.satelliteMenuOpen = true;
  }

  closeSatelliteMenu(): void {
    this.satelliteMenuOpen = false;
  }

  // Menu actions
  applyDefaultView(): void {
    this.mapService.applyDefaultView();
    this.basemapMode = 'webmap';
    // re-draw the red highlight for the current selection (if any)
    this.mapService.applyRedHighlightForCurrentSelection();
    this.closeSatelliteMenu();
  }

  applyLandAndSatelliteView(): void {
    this.mapService.applyLandAndSatelliteView();
    this.basemapMode = 'satellite';
    this.closeSatelliteMenu();
  }

  applySatelliteAndSelectedParcelView(): void {
    this.mapService.applySatelliteParcelOnlyView();
    this.basemapMode = 'satellite';
    // ensure red highlight is applied over imagery
    this.mapService.applyRedHighlightForCurrentSelection();
    this.closeSatelliteMenu();
  }

  applySatelliteOnlyView(): void {
    this.mapService.applySatelliteOnlyView();
    this.basemapMode = 'satellite';
    // no parcel overlays by default for satellite-only, but if a parcel
    // is selected re-draw it in red so it is visible on imagery
    this.mapService.applyRedHighlightForCurrentSelection();
    this.closeSatelliteMenu();
  }

  toggleThemeMenu(): void {
    this.themeMenuOpen = !this.themeMenuOpen;
  }

  closeThemeMenu(): void {
    this.themeMenuOpen = false;
  }

  applyTheme(theme: ThemeKey): void {
    this.currentTheme = theme;
    this.themeMenuOpen = false;
  }

  setDataset(ds: '2026' | '2018'): void {
    if (this.activeDataset === ds) { return; }
    this.activeDataset = ds;
    this.parcelMatches = [];
    this.parcelSearchText = '';
    this.parcelStatusText = this.t("noMatch");
    this.hasParcelSearchRun = false;
  }

  // Select Parcel card state
  parcelSearchText = "";
  parcelMatches: Parcel[] = [];
  isParcelSearching = false;
  parcelStatusText = this.t("noMatch");
  hasParcelSearchRun = false;
  addedAttributesEditorOpen = false;
  addedAttributesSaving = false;
  addedAttributeFields: AddedAttributeField[] = [];
  private addedAttributeResolvedKeys: Record<string, string> = {};
  approvalConfirmDialogOpen = false;
  pendingAddedAttributeValues: Record<string, string> | null = null;
  readonly approvalStatusRows = [
    { approver: "CEO Mazan", status: "Pending" },
    { approver: "GM Abu Fahad", status: "Pending" },
    { approver: "PM Abdullah Sharif", status: "Pending" },
  ];
  readonly approvalCurrentUser = "Investment";
  private readonly addedAttributeFieldConfigs: AddedAttributeFieldConfig[] = [
    { id: "landbankArea", label: "Landbank Area", inputType: "number", keys: ["Landbank Area", "LandbankArea", "Landbank_Area", "MM Area", "PSh Area (m²)"] },
    { id: "landbankGfa", label: "Landbank GFA", inputType: "number", keys: ["Landbank GFA", "LandbankGFA", "Landbank_GFA", "PermittedGFA", "Permitted GFA"] },
    { id: "plotStatusEnglish", label: "Plot Status English", keys: ["Plot Status English", "PlotStatusEnglish", "Plot Status"] },
    { id: "ownershipTypeEnglish", label: "Ownership Type English", keys: ["Ownership Type English", "OwnershipTypeEnglish", "Ownership Type"] },
    { id: "contractStatusEnglish", label: "Contract Status English", keys: ["Contract Status English", "ContractStatusEnglish", "Contract Status"] },
    { id: "developerEnglish", label: "Developer English", keys: ["Developer English", "DeveloperEnglish", "Developer"] },
    { id: "leaseTypeEnglish", label: "Lease Type English", keys: ["Lease Type English", "LeaseTypeEnglish", "Lease Type"] },
    { id: "userEnglishName", label: "User English Name", keys: ["User English Name", "UserEnglishName", "User Name"] },
    { id: "contractNo", label: "Contract No", keys: ["Contract No", "ContractNo", "Contract_No"] },
  ];

  // More options panel
  moreOptionsOpen = false;
  smartSearchText = "";

  // ── Uploaded documents (Add New Document / Add Description) ────────────────
  uploadedDocuments: { fileName: string; savedName: string; filePath: string; description: string; uploading: boolean }[] = [];
  descriptionDialogOpen = false;
  descriptionTargetIndex = -1;
  descriptionText = "";

  // Attributes dialog
  attributesDialogOpen = false;

  get canEditSelectedParcelAttributes(): boolean {
    return !!this.selectedParcel && this.hasParcelSearchRun;
  }

  get plotDetailsTitle(): string {
    return "Plot Details";
  }

  get plotDetailsSubtitle(): string {
    return this.selectedParcel?.displayName ? `${this.t("plotAttributes")} — ${this.selectedParcel.displayName}` : this.t("plotAttributes");
  }

  get plotDetailRows(): PlotDetailRow[] {
    const datasetLabel = this.selectedParcel?.sourceDataset === "2018"
      ? "Master Plan 2018"
      : "PB Master Plan 2026";

    const hiddenLabels = new Set([
      "masterplan",
      "landcategory",
      "frontagem",
      "depthm",
      "frontsetback",
      "sidesetback",
      "rearsetback",
      "parkingarea",
      "permittedplotcoverage",
      "existingplotcoverage",
      "existingparkingspacesperdwelling",
      "permittedheight",
      "existingheight",
      "permittedheightm",
      "existingheightm",
      "username",
    ]);

    const rows: Array<PlotDetailRow | null> = [
      // Rearranged and without 'Zone'
      { label: "Master Plan", value: datasetLabel },
      this.createPlotDetailRow("Neighborhood", this.pickPlotDetailValue("English Name Zone", "Zone English Name", "Sector")),
      this.createPlotDetailRow("Land Use", this.pickPlotDetailValue("English Name Landuse", "Landuse (English)", "Land Use")),
      this.createPlotDetailRow("Sub Landuse", this.pickPlotDetailValue("Sub Landuse English", "Sub Landuse", "Sub Landuse (English)")),
      this.createPlotDetailRow("Area (m²)", this.formatPlotArea()),
      this.createPlotDetailRow("Frontage (m)", this.pickPlotDetailValue("Frontage (m)", "Frontage", "Frontage_m")),
      this.createPlotDetailRow("Depth (m)", this.pickPlotDetailValue("Depth (m)", "Depth", "Depth_m")),
      this.createPlotDetailRow("Land Category", this.pickPlotDetailValue("Land Category", "LandUseCategory")),
      this.createPlotDetailRow("Contract Status", this.pickPlotDetailValue("Contract Status", "Contract Status English"), "status"),
      this.createPlotDetailRow("Plot Status", this.pickPlotDetailValue("Plot Status English", "Plot Status"), "status"),
    ];

    const baseRows = rows
      .filter((row): row is PlotDetailRow => !!row && !hiddenLabels.has(this.normalizePlotDetailLabel(row.label)))
      .map(row => ({
        ...row,
        label: PLOT_DETAIL_LABELS[row.label] || row.label
      }));
    const meaningfulBaseRows = baseRows.filter((row) => row.value !== "-");
    if (!meaningfulBaseRows.length) {
      const liveRows = this.liveAttributeRows();
      const visibleLiveRows = this.showMoreDetails ? liveRows : liveRows.slice(0, this.plotDetailPreviewLimit);
      return this.assignIconsToRows(visibleLiveRows);
    }
    if (!this.showMoreDetails) {
      return this.assignIconsToRows(baseRows.slice(0, this.plotDetailPreviewLimit));
    }

    const extraRows = this.moreDetailFieldConfigs
      .map((field) => this.createPlotDetailRow(field.label, this.pickPlotDetailValue(...field.keys), field.tone))
      .filter((row): row is PlotDetailRow => !!row);

    const seenLabels = new Set(baseRows.map(row => this.normalizePlotDetailLabel(row.label)));
    const dedupedExtraRows = extraRows.filter((row) => {
      const normalizedLabel = this.normalizePlotDetailLabel(row.label);
      if (seenLabels.has(normalizedLabel)) {
        return false;
      }
      seenLabels.add(normalizedLabel);
      return true;
    }).filter((row) => !hiddenLabels.has(this.normalizePlotDetailLabel(row.label)));

    const allRows = [...baseRows, ...dedupedExtraRows];
    return this.assignIconsToRows(allRows);
  }

  private liveAttributeRows(): PlotDetailRow[] {
    const attrs = (this.selectedParcel?.attributes ?? {}) as Record<string, unknown>;
    const hiddenKeys = new Set(["shape", "geometry"]);
    return Object.entries(attrs)
      .filter(([key, value]) => {
        if (value === null || value === undefined || `${value}`.trim() === "") {
          return false;
        }
        return !hiddenKeys.has(key.toLowerCase());
      })
      .slice(0, 40)
      .map(([key, value]) => ({
        label: this.humanizeAttributeKey(key),
        value: String(value),
      }));
  }

  private humanizeAttributeKey(key: string): string {
    const explicit = PLOT_DETAIL_LABELS[key];
    if (explicit) {
      return explicit;
    }
    return key
      .replace(/_/g, " ")
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/\s+/g, " ")
      .trim();
  }

  private assignIconsToRows(rows: PlotDetailRow[]): PlotDetailRow[] {
    const ICON_PALETTE = ['map','location','building','home','layers','ruler','grid','document','flag'];
    const used = new Set<string>();
    return rows.map(row => {
      // prefer explicit icon for the label
      let icon = this.getIconForLabel(row.label);
      if (used.has(icon)) {
        // pick first available unused icon from palette
        const alt = ICON_PALETTE.find(i => !used.has(i));
        if (alt) icon = alt;
      }
      used.add(icon);
      return { ...row, icon };
    });
  }

  private normalizePlotDetailLabel(label: string): string {
    return label.replace(/[^a-z0-9]/gi, "").toLowerCase();
  }

  private createPlotDetailRow(label: string, value: string, tone?: "status"): PlotDetailRow | null {
    const display = (!value || value === "—") ? "-" : value;
    return { label, value: display, tone };
  }

  pickPlotDetailValue(...keys: string[]): string {
    const attrs = (this.selectedParcel?.attributes ?? {}) as Record<string, unknown>;
    const attrEntries = Object.entries(attrs);

    for (const key of keys) {
      const exact = attrs[key];
      if (exact !== null && exact !== undefined && `${exact}`.trim() !== "") {
        return String(exact);
      }

      // Fallback: normalized key match so values still resolve when source fields
      // vary by spacing/casing/underscores (e.g. MM Area vs mm_area).
      const normalizedRequested = this.normalizePlotDetailLabel(key);
      const match = attrEntries.find(([attrKey, value]) =>
        this.normalizePlotDetailLabel(attrKey) === normalizedRequested &&
        value !== null &&
        value !== undefined &&
        `${value}`.trim() !== ""
      );

      if (match) {
        return String(match[1]);
      }
    }
    return "—";
  }

  formatPlotArea(): string {
    const value = this.pickPlotDetailValue("MM Area", "PSh Area (m²)", "Shape_Area", "Area");
    if (value === "—") {
      return value;
    }
    const numeric = Number(String(value).replace(/,/g, ""));
    if (Number.isFinite(numeric)) {
      return `${numeric}`;
    }
    return value;
  }

  get bannerZoneName(): string {
    return this.pickPlotDetailValue("English Name Zone", "Zone English Name", "Sector");
  }

  get bannerLandUse(): string {
    return this.pickPlotDetailValue("English Name Landuse", "Landuse (English)", "Land Use");
  }

  get bannerPlotStatus(): string {
    return this.pickPlotDetailValue("Plot Status English", "Plot Status", "Contract Status");
  }

  get bannerArea(): string {
    const value = this.pickPlotDetailValue("MM Area", "PSh Area (m²)", "Shape_Area", "Area");
    if (value === "—") {
      return value;
    }
    const numeric = Number(String(value).replace(/,/g, ""));
    if (!Number.isFinite(numeric)) {
      return value;
    }
    return Number.isInteger(numeric) ? `${numeric}` : `${numeric.toFixed(2).replace(/\.00$/, "")}`;
  }

  private updateDashboardChartSlices(): void {
    this.plotStatusChartSlices = this.createPieChartSlices(this.plotStatusChartData);
    this.contractStatusChartSlices = this.createPieChartSlices(this.contractStatusChartData);
    this.leaseTypeChartSlices = this.createPieChartSlices(this.leaseTypeChartData);
    // Set the contract status field for highlight logic (assume chart data is from getDashboard1Summary)
    if (this.dashboard1Summary && 'contractStatusField' in this.dashboard1Summary) {
      this.dashboardContractStatusField = this.dashboard1Summary.contractStatusField;
    }
  }

  onContractStatusSliceClick(slice: PlotStatusChartSlice): void {
    this.selectedContractStatusSlice = slice.label;
    // remember selected contract status for combined dashboard filtering
    this.dashboardSelectedContractStatus = slice.label;
    // Use the same field as the dashboard chart for contract status
    const contractStatusField = this.dashboardContractStatusField;
    if (this.dashboardSelectedZone) {
      void this.mapService.highlightParcelsByContractStatusWithZone(
        this.dashboardSelectedZone,
        slice.label,
        slice.color,
        contractStatusField,
        this.dashboardZoneField,
        true
      );
      void this.refreshDashboardSummary();
    } else {
    }
  }

  onBranchPerformanceSliceClick(slice: PlotStatusChartSlice): void {
    void this.mapService.highlightBranchMarkersByPerformanceStatus(slice.label, slice.color);
  }

  onAtmPerformanceSliceClick(slice: PlotStatusChartSlice): void {
    void this.mapService.highlightAtmMarkersByPerformanceStatus(slice.label, slice.color);
  }

  onLeaseTypeSliceClick(slice: PlotStatusChartSlice): void {
    // LeaseType fields commonly include 'leasetype' or 'lease' in their names (e.g., leasedtypeenglish)
    void this.mapService.highlightParcelsByAttribute(slice.label, slice.color, ["leasetype", "lease"], true);
  }

  onPlotStatusSliceClick(slice: PlotStatusChartSlice): void {
    // Prefer the exact field the server used for plot status; fallback to common names
    const fieldToUse = this.dashboardPlotStatusField ?? undefined;
    void this.mapService.highlightParcelsByContractStatus(slice.label, slice.color, fieldToUse, true);
  }

  private createPieChartSlices(items: readonly { label: string; value: number; color: string }[]): PlotStatusChartSlice[] {
    const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
    const radius = 90;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;
    return items.map((item) => {
      const sliceLength = (item.value / total) * circumference;
      const slice: PlotStatusChartSlice = {
        ...item,
        dashArray: `${sliceLength} ${circumference}`,
        dashOffset: -offset,
      };
      offset += sliceLength;
      return slice;
    });
  }

  private createPieChartSlicesFromCounts(counts: Record<string, number>, defaultData: readonly { label: string; color: string }[]): PlotStatusChartSlice[] {
    const colorMap = new Map(defaultData.map((item) => [item.label, item.color] as const));
    const items = Object.entries(counts)
      .filter(([, value]) => value > 0)
      .map(([label, value], index) => ({
        label,
        value,
        color: colorMap.get(label) ?? this.dashboardChartColors[index % this.dashboardChartColors.length],
      }));
    return this.createPieChartSlices(items);
  }

  private createPieSlicePath(startAngle: number, endAngle: number): string {
    const radius = 120;
    const center = 160;
    const startX = center + radius * Math.cos(startAngle - Math.PI / 2);
    const startY = center + radius * Math.sin(startAngle - Math.PI / 2);
    const endX = center + radius * Math.cos(endAngle - Math.PI / 2);
    const endY = center + radius * Math.sin(endAngle - Math.PI / 2);
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    return `M ${center} ${center} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY} Z`;
  }

  get contractStatusTotal(): number {
    return this.contractStatusChartData.reduce((sum, item) => sum + item.value, 0) || 1;
  }

  get leaseTypeTotal(): number {
    return this.leaseTypeChartData.reduce((sum, item) => sum + item.value, 0) || 1;
  }

  toggleRightPanelSection(section: RightPanelSection): void {
    const currentState = this.getRightPanelSectionState(section);
    if (currentState) {
      if (section === "panorama") {
        this.destroyPanoramaViewer();
      }
      this.resetRightPanelSections();
      return;
    }

    switch (section) {
      case "result":
        this.focusSelectedResultPanel();
        break;
      case "scene":
        this.focusScenePanel();
        break;
      case "panorama":
        this.focusPanoramaPanel();
        setTimeout(() => {
          void this.initializePanoramaViewer();
          // Also open the overlay automatically so the 360 view appears
          // without requiring the user to click the arrow button.
          setTimeout(() => {
            try { this.openPanoramaOverlay(); } catch (e) { /* ignore */ }
          }, 200);
        }, 0);
        break;
      case "cctv":
        this.focusCctvPanel();
        break;
      case "kroki":
        this.focusKrokiPanel();
        break;
      case "sources":
        this.focusSourcesPanel();
        break;
      case "files":
        this.focusFilesPanel();
        break;
      case "uploads":
        this.focusUploadsPanel();
        break;
      case "comments":
        this.focusCommentsPanel();
        break;
      case "dashboard":
        this.focusDashboardPanel();
        break;
      case "legend":
        this.focusLegendPanel();
        break;
      case "reports":
        this.focusReportsPanel(this.reportsDataset);
        break;
      case "voiceAgent":
        this.focusVoiceAgentPanel();
        break;
    }
  }

  isRightPanelSectionVisible(section: RightPanelSection): boolean {
    return this.activeRightPanelSection === section;
  }

  // Keep toolbar vertical by default on application load
  toolbarVertical = true;
  mapOverlayCollapsed = true;
  mapSearchOverlayCollapsed = true;
  locationMode: "coordinates" | "summary" = "coordinates";

  setToolbarVertical(vertical: boolean): void {
    this.toolbarVertical = true;
  }

  toggleMapOverlayCollapse(): void {
    this.mapOverlayCollapsed = !this.mapOverlayCollapsed;
  }

  toggleMapSearchOverlayCollapse(): void {
    this.mapSearchOverlayCollapsed = !this.mapSearchOverlayCollapsed;
  }

  setLocationMode(mode: "coordinates" | "summary"): void {
    this.locationMode = mode;
  }

  toggleToolbarOrientation(event: MouseEvent): void {
    event.preventDefault();
    this.toolbarVertical = true;
  }

  toggleLeftPanelCollapse(): void {
    this.leftPanelCollapsed = !this.leftPanelCollapsed;
  }

  toggleRightPanelCollapse(): void {
    this.rightPanelCollapsed = !this.rightPanelCollapsed;
  }

  startRightPanelResize(event: MouseEvent): void {
    if (this.rightPanelCollapsed) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const panelRect = this.rightPanelHost?.nativeElement.getBoundingClientRect();
    this.rightPanelDragRightEdge = panelRect?.right ?? window.innerWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const maxWidth = Math.max(this.defaultRightPanelWidth, window.innerWidth - this.maxRightPanelWidthOffset);
      const nextWidth = this.rightPanelDragRightEdge - moveEvent.clientX;
      this.rightPanelWidth = Math.min(maxWidth, Math.max(this.defaultRightPanelWidth, nextWidth));
      this.refreshView();
    };

    const stopDragging = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", stopDragging);
      this.removeRightPanelDragListeners = undefined;
    };

    this.removeRightPanelDragListeners?.();
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", stopDragging);
    this.removeRightPanelDragListeners = stopDragging;
  }

  private expandLeftPanel(): void {
    this.leftPanelCollapsed = false;
  }

  private expandRightPanel(): void {
    this.rightPanelCollapsed = false;
  }

  focusSelectedResultPanel(): void {
    if (!this.selectedParcel) {
      return;
    }

    this.expandRightPanel();
    this.resetRightPanelSections();
    this.showMoreDetails = false;
    this.activeRightPanelSection = "result";
    this.rightPanelResultOpen = true;
  }

  private focusPanoramaPanel(): void {
    this.expandRightPanel();
    this.resetRightPanelSections();
    this.activeRightPanelSection = "panorama";
    this.rightPanelPanoramaOpen = true;
  }

  private focusCctvPanel(): void {
    this.expandRightPanel();
    this.resetRightPanelSections();
    this.activeRightPanelSection = "cctv";
    this.rightPanelCctvOpen = true;
  }

  private focusKrokiPanel(): void {
    if (!this.selectedParcel) {
      return;
    }

    this.expandRightPanel();
    this.resetRightPanelSections();
    this.activeRightPanelSection = "kroki";
    this.rightPanelKrokiOpen = true;
  }

  private focusScenePanel(): void {
    this.expandRightPanel();
    this.resetRightPanelSections();
    this.activeRightPanelSection = "scene";
    this.rightPanelSceneOpen = true;
    setTimeout(() => {
      void this.initializeScenePanel();
    }, 0);
  }

  private focusLegendPanel(): void {
    this.expandRightPanel();
    this.resetRightPanelSections();
    this.activeRightPanelSection = "legend";
    this.rightPanelLegendOpen = true;
    setTimeout(async () => {
      try {
        const view = this.mapService.getMapView();
        const host = this.legendHost?.nativeElement;
        if (!host || !view) return;
        // destroy existing widget if any
        try { this.legendWidget?.destroy?.(); } catch {}
        host.replaceChildren();

        const excludedLegendTitles = new Set([
          "global_basemap_jan2026",
          "transportation",
          "dq_basemap - plot boundaries - landuse",
          "landbase",
        ]);
        const map = view.map;
        if (!map) {
          console.warn('[Legend] Map is not available on the view');
          return;
        }

        let foundLanduse = false;
        const allLayers = map.layers.toArray();
        console.log('[Legend] All map layers:', allLayers.map((l: any) => l.title));
        
        const layerInfos = allLayers
          .filter((layer: any) => {
            const title = String(layer.title || "").toLowerCase();
            console.log('[Legend] Evaluating layer:', layer.title, '-> lowercase:', title);
            
            if (excludedLegendTitles.has(title)) {
              console.log('[Legend]   -> excluded by excludedLegendTitles');
              return false;
            }
            // Include King Fahd layers
            if (title.includes("king fahd")) {
              console.log('[Legend]   -> included (King Fahd match)');
              return true;
            }
            // Only keep the first visible Landuse dataset, hide all others
            if (/landuse/.test(title)) {
              if (foundLanduse) {
                console.log('[Legend]   -> excluded (duplicate landuse)');
                return false;
              }
              foundLanduse = true;
              console.log('[Legend]   -> included (first landuse)');
              return true;
            }
            console.log('[Legend]   -> excluded (no match)');
            return false;
          })
          .map((layer: any) => ({ layer, title: layer.title || "" }));
        
        console.log('[Legend] Final layerInfos count:', layerInfos.length);
        
        // If no layers were found, log all available layers for debugging
        if (layerInfos.length === 0) {
          console.log('[Legend] WARNING: No layers matched filter. All map layers:', allLayers.map((l: any) => ({
            title: l.title,
            id: l.id,
            visible: l.visible
          })));
        }

        // Fetch land use counts and map to legend labels
        let landuseCounts: Record<string, number> = {};
        try {
          const result = await this.mapService.getLanduseCounts?.();
          if (result && result.counts) landuseCounts = result.counts;
        } catch (e) {
          console.warn('[Legend] Failed to fetch land use counts', e);
        }

        // Fetch King Fahd utility category counts
        let utilityCategoryCounts: Record<string, number> = {};
        try {
          const counts = this.mapService.getKingFahdUtilityCategoryCounts();
          for (const [category, count] of counts) {
            utilityCategoryCounts[category] = count;
          }
        } catch (e) {
          console.warn('[Legend] Failed to fetch utility category counts', e);
        }

        // Patch legend label rendering to append counts
        // Wait for the widget to render, then update DOM labels
        this.legendWidget = new Legend({ view, container: host, layerInfos });
        setTimeout(() => {
          try {
            const rows = host.querySelectorAll('.esri-legend__layer-cell--info, .esri-legend__layer-caption');
            // Log DOM labels and available counts for debugging
            const domLabels: string[] = [];
            rows.forEach((el: any) => domLabels.push(el.textContent?.trim() || ''));
            console.log('[Legend] DOM labels:', domLabels);
            console.log('[Legend] landuseCounts:', landuseCounts);
            console.log('[Legend] utilityCategoryCounts:', utilityCategoryCounts);
            rows.forEach((el: any) => {
              const orig = el.textContent?.trim();
              if (!orig) return;
              // Flexible match: ignore case, trim, allow partial match
              const match = this.legendLabels.find(l =>
                orig.toLowerCase().replace(/\s+/g, ' ').includes(l.toLowerCase().replace(/\s+/g, ' '))
              );
              let label = match || orig;
              let count = (match && landuseCounts[match] !== undefined)
                ? landuseCounts[match]
                : landuseCounts[orig];
              // Only append if count exists and not already present
              if (count !== undefined && !orig.endsWith(`(${count})`)) {
                el.textContent = `${label} (${count})`;
              }
            });

            // GraphicsLayer instances have no renderer for ArcGIS Legend to inspect,
            // so render their symbols explicitly rather than relying on widget rows.
            const utilityColors: Record<string, string> = {
              streetlight: "#ffc107",
              trash_bin: "#78909c",
              fire_hydrant: "#e53935",
              atm: "#10b981",
              bank_branch: "#2563eb",
              petrol_station: "#f57c00",
              mosque: "#009688",
              bus_stop: "#7c4dff",
              traffic_signal: "#ff9800",
              cctv_camera: "#37474f",
              parking_meter: "#795548",
              public_bench: "#689f38",
              telecom_cabinet: "#3f51b5",
              electrical_transformer: "#ffd600",
              water_valve: "#00bcd4",
              manhole: "#546e7a",
              public_toilet: "#ec407a",
            };
            const customSection = document.createElement('div');
            customSection.style.marginTop = '16px';
            customSection.style.padding = '8px';
            customSection.style.borderTop = '1px solid rgba(0, 0, 0, 0.15)';

            const roadTitle = document.createElement('div');
            roadTitle.style.fontWeight = 'bold';
            roadTitle.style.marginBottom = '8px';
            roadTitle.textContent = 'King Fahd Road';
            customSection.appendChild(roadTitle);

            const roadEntry = document.createElement('div');
            roadEntry.style.display = 'flex';
            roadEntry.style.alignItems = 'center';
            roadEntry.style.gap = '8px';
            roadEntry.style.marginBottom = '12px';
            const roadSwatch = document.createElement('span');
            roadSwatch.style.display = 'inline-block';
            roadSwatch.style.width = '28px';
            roadSwatch.style.borderTop = '4px solid #e65100';
            roadEntry.append(roadSwatch, document.createTextNode('Road'));
            customSection.appendChild(roadEntry);

            const utilityTitle = document.createElement('div');
            utilityTitle.style.fontWeight = 'bold';
            utilityTitle.style.marginBottom = '8px';
            utilityTitle.textContent = 'King Fahd Road Utilities';
            customSection.appendChild(utilityTitle);

            const entries = Object.entries(utilityCategoryCounts)
              .sort((a, b) => a[0].localeCompare(b[0]));
            for (const [category, count] of entries) {
              const entry = document.createElement('div');
              entry.style.display = 'flex';
              entry.style.alignItems = 'center';
              entry.style.gap = '8px';
              entry.style.marginBottom = '4px';
              entry.style.fontSize = '12px';
              const swatch = document.createElement('span');
              swatch.style.display = 'inline-block';
              swatch.style.width = '10px';
              swatch.style.height = '10px';
              swatch.style.borderRadius = '50%';
              swatch.style.backgroundColor = utilityColors[category] || '#2196f3';
              const label = category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ');
              entry.append(swatch, document.createTextNode(`${label} (${count})`));
              customSection.appendChild(entry);
            }
            host.appendChild(customSection);
          } catch (e) {
            console.warn('[Legend] Failed to patch legend labels with counts', e);
          }
        }, 400);

        // Attach delegated click handler so legend items can trigger map highlights
        try {
          this.removeLegendClickListener();
          this.legendClickHandlerBound = (ev: MouseEvent) => this.onLegendClick(ev);
          host.addEventListener('click', this.legendClickHandlerBound as any);
          // Also add a capture-phase document listener as a fallback in case
          // the Legend widget prevents bubbling on its internal nodes.
          try {
            document.addEventListener('click', this.legendClickHandlerBound as any, true);
            console.log('[Legend] document capture listener attached');
          } catch (e) {}
          console.log('[Legend] click listener attached to legend-host');
        } catch (e) {
          console.warn('Failed to attach legend click listener', e);
        }
      } catch (err) {
        console.warn('Failed to create Legend widget', err);
      }
    }, 0);
  }

  openDashboardPanel(): void {
    this.dashboardMode = "default";
    this.dashboard1Summary = null;
    this.dashboard1Error = "";
    this.expandRightPanel();
    this.resetRightPanelSections();
    this.activeRightPanelSection = "dashboard";
    this.rightPanelDashboardOpen = true;
    void this.loadBranchPerformanceDashboard();
    void this.loadAtmPerformanceDashboard();
  }

  dashboard(): void {
    this.openDashboardPanel();
  }

  toggleReportsPanel(): void {
    this.focusReportsPanel("branch");
  }

  openAtmReportsPanel(): void {
    this.focusReportsPanel("atm");
  }

  private focusReportsPanel(dataset: ReportsDataset): void {
    this.expandRightPanel();
    this.resetRightPanelSections();
    this.reportsDataset = dataset;
    this.activeRightPanelSection = "reports";
    this.rightPanelReportsOpen = true;
    void this.loadBranchReports(dataset);
  }

  private focusVoiceAgentPanel(): void {
    this.expandRightPanel();
    this.resetRightPanelSections();
    this.activeRightPanelSection = "voiceAgent";
    this.rightPanelVoiceAgentOpen = true;
  }

  private async loadPendingUpdates(): Promise<void> {
    this.pendingUpdatesLoading = true;
    this.pendingUpdatesError = "";
    try {
      this.pendingUpdateRecords = await firstValueFrom(this.pendingUpdatesService.getPendingUpdates());
    } catch (error) {
      console.error("Failed to load pending updates", error);
      this.pendingUpdatesError = "Unable to load pending updates. Please confirm the backend server is running.";
    } finally {
      this.pendingUpdatesLoading = false;
      this.refreshView();
    }
  }

  private async loadBranchReports(dataset: ReportsDataset, force = false): Promise<void> {
    if (this.branchReportsLoading) {
      return;
    }
    const cachedRows = dataset === "branch" ? this.branchReportsCache : this.atmReportsCache;
    if (!force && cachedRows.length > 0) {
      this.branchReportRows = [...cachedRows];
      this.applyBranchReportsFilter(this.branchReportQuery);
      return;
    }

    this.branchReportsLoading = true;
    this.branchReportsError = "";
    try {
      const sourceUrl = dataset === "branch" ? BRANCH_DASHBOARD_GEOJSON_URL : ATM_DASHBOARD_GEOJSON_URL;
      const response = await fetch(sourceUrl);
      if (!response.ok) {
        throw new Error(`Failed to load ${dataset} reports data: ${response.status}`);
      }

      const json = (await response.json()) as {
        features?: Array<{ properties?: Record<string, unknown> }>;
      };
      const features = Array.isArray(json.features) ? json.features : [];
      this.branchReportRows = features.map((feature) => {
        const properties = feature?.properties ?? {};
        return {
          Entity_ID: String(dataset === "branch" ? properties["Branch_ID"] ?? "" : properties["ATM_ID"] ?? "").trim(),
          Bank_Name: String(properties["Bank_Name"] ?? "").trim(),
          District: String(properties["District"] ?? "").trim(),
          Entity_Name: String(dataset === "branch" ? properties["Branch_Name"] ?? "" : properties["Site_Name"] ?? "").trim(),
          Performance_Status: String(properties["Performance_Status"] ?? "").trim(),
        };
      });
      if (dataset === "branch") {
        this.branchReportsCache = [...this.branchReportRows];
      } else {
        this.atmReportsCache = [...this.branchReportRows];
      }
      this.applyBranchReportsFilter(this.branchReportQuery);
    } catch (error) {
      console.error(`Failed to load ${dataset} reports`, error);
      this.branchReportsError = `Unable to load ${dataset.toUpperCase()} reports.`;
      this.branchReportRows = [];
      this.branchReportDisplayedRows = [];
    } finally {
      this.branchReportsLoading = false;
      this.refreshView();
    }
  }

  onBranchReportsSubmit(): void {
    this.applyBranchReportsFilter(this.branchReportQuery);
  }

  onBranchReportsReset(): void {
    this.branchReportQuery = "";
    this.applyBranchReportsFilter("");
  }

  exportBranchReportsPdf(): void {
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const rowHeight = 8;
    const colWidths = [28, 28, 75, 35, 95];
    const headers = ["Status", this.reportIdHeader, "Bank", "District", this.reportNameHeader];
    const queryLabel = this.branchReportQuery.trim() || "all";

    let y = margin;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text(this.reportsTitle, margin, y);
    y += 7;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text(`Query: ${queryLabel}`, margin, y);
    pdf.text(`Results: ${this.branchReportDisplayedRows.length}`, margin + 95, y);
    pdf.text(`Date: ${this.branchReportDateLabel}`, margin + 145, y);
    y += 7;

    const drawHeader = () => {
      let x = margin;
      pdf.setFillColor(237, 244, 248);
      pdf.setDrawColor(210, 225, 234);
      pdf.setTextColor(15, 23, 42);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      for (let i = 0; i < headers.length; i += 1) {
        pdf.rect(x, y, colWidths[i], rowHeight, "FD");
        pdf.text(headers[i], x + 2, y + 5.3);
        x += colWidths[i];
      }
      y += rowHeight;
    };

    drawHeader();
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);

    for (const row of this.branchReportDisplayedRows) {
      if (y + rowHeight > pageHeight - margin) {
        pdf.addPage();
        y = margin;
        drawHeader();
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8.5);
      }

      const values = [row.Performance_Status, row.Entity_ID, row.Bank_Name, row.District, row.Entity_Name];
      let x = margin;
      for (let i = 0; i < values.length; i += 1) {
        pdf.setDrawColor(230, 236, 242);
        pdf.rect(x, y, colWidths[i], rowHeight, "S");
        const clipped = pdf.splitTextToSize(values[i] || "-", colWidths[i] - 3)[0] || "-";
        pdf.text(clipped, x + 1.5, y + 5.3);
        x += colWidths[i];
      }
      y += rowHeight;
    }

    const safeQuery = queryLabel.replace(/[^a-z0-9_-]+/gi, "_").slice(0, 40) || "all";
    pdf.save(`${this.reportsFilePrefix}_report_${safeQuery}.pdf`);
  }

  get branchReportStatusLabel(): string {
    const normalized = this.extractBranchReportStatusQuery(this.branchReportQuery);
    if (!normalized) {
      return "All";
    }
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }

  get branchReportDistrictCount(): number {
    const districts = new Set(
      this.branchReportDisplayedRows.map((row) => row.District.trim().toLowerCase()).filter(Boolean)
    );
    return districts.size;
  }

  get branchReportDateLabel(): string {
    return new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }

  get reportsTitle(): string {
    return this.reportsDataset === "branch" ? "Branch Performance Report" : "ATM Performance Report";
  }

  get reportEntityPluralLabel(): string {
    return this.reportsDataset === "branch" ? "branches" : "ATMs";
  }

  get reportIdHeader(): string {
    return this.reportsDataset === "branch" ? "Branch ID" : "ATM ID";
  }

  get reportNameHeader(): string {
    return this.reportsDataset === "branch" ? "Branch name" : "Site name";
  }

  get reportQueryExample(): string {
    return this.reportsDataset === "branch" ? "performance_status = weak" : "performance_status = profit";
  }

  get reportQueryHelpText(): string {
    return this.reportsDataset === "branch"
      ? "Search using: performance_status = strong, weak, or moderate."
      : "Search using: performance_status = profit, loss, or break-even.";
  }

  get reportsFilePrefix(): string {
    return this.reportsDataset === "branch" ? "branch" : "atm";
  }

  private applyBranchReportsFilter(query: string): void {
    const normalizedStatus = this.extractBranchReportStatusQuery(query);
    if (!normalizedStatus) {
      this.branchReportDisplayedRows = [...this.branchReportRows];
      return;
    }

    this.branchReportDisplayedRows = this.branchReportRows.filter((row) =>
      row.Performance_Status.trim().toLowerCase() === normalizedStatus
    );
  }

  private extractBranchReportStatusQuery(query: string): string {
    const normalizedQuery = query.trim().toLowerCase();
    return normalizedQuery.replace(/^performance[_\s]*status\s*[:=]\s*/i, "").trim();
  }



  private focusDashboardPanel(): void {
    this.openDashboardPanel();
  }

  private resetRightPanelSections(): void {
    this.rightPanelResultOpen = false;
    this.rightPanelSceneOpen = false;
    this.rightPanelPanoramaOpen = false;
    this.rightPanelCctvOpen = false;
    this.rightPanelKrokiOpen = false;
    this.rightPanelSourcesOpen = false;
    this.rightPanelFilesOpen = false;
    this.rightPanelUploadsOpen = false;
    this.rightPanelCommentsOpen = false;
    this.rightPanelLegendOpen = false;
    this.rightPanelReportsOpen = false;
    this.rightPanelVoiceAgentOpen = false;
    try { this.legendWidget?.destroy?.(); } catch {}
    this.removeLegendClickListener();
    this.legendWidget = null;
    this.rightPanelDashboardOpen = false;
    this.activeRightPanelSection = null;
    this.addedAttributesEditorOpen = false;
    this.addedAttributeFields = [];
    this.addedAttributeResolvedKeys = {};
  }

  private removeLegendClickListener(): void {
    try {
      const host = this.legendHost?.nativeElement;
      if (host && this.legendClickHandlerBound) {
        host.removeEventListener('click', this.legendClickHandlerBound as any);
        try { document.removeEventListener('click', this.legendClickHandlerBound as any, true); } catch (e) {}
        this.legendClickHandlerBound = null;
      }
    } catch (e) {
      console.warn('removeLegendClickListener failed', e);
    }
  }

  private onLegendClick(ev: MouseEvent): void {
    console.log('[Legend] click event', ev);
    try {
      const host = this.legendHost?.nativeElement;
      if (!host) return;

      // Prefer the most specific legend-item element from the event path so we
      // extract the actual swatch label rather than the layer caption/title.
      const path = (ev as any).composedPath ? (ev as any).composedPath() as EventTarget[] : [];
      let itemEl: HTMLElement | null = null;
      if (Array.isArray(path) && path.length) {
        for (const p of path) {
          const node = p as HTMLElement | null;
          if (!node || !node.classList) continue;
          if (
            node.classList.contains('esri-legend__layer-table-row') ||
            node.classList.contains('esri-legend__layer-list__item') ||
            node.classList.contains('esri-legend__layer__item') ||
            node.classList.contains('esri-legend__layer-item') ||
            (node.getAttribute && node.getAttribute('role') === 'listitem')
          ) {
            itemEl = node as HTMLElement;
            break;
          }
        }
      }

      // Fallback: use the clicked element and prefer the most specific legend row/container available
      if (!itemEl) {
        let el = ev.target as HTMLElement | null;
        if (!el) return;
        itemEl = el.closest('.esri-legend__layer-row, .esri-legend__layer-table-row, .esri-legend__layer-list__item, .esri-legend__layer__item, .esri-legend__layer-item, .esri-legend__layer') as HTMLElement | null;
        itemEl = itemEl ?? (el.closest('#legend-host') as HTMLElement | null) ?? el;
      }

      // If the selected element is still a broad layer container, try to narrow to the clicked row
      if (itemEl && itemEl.classList.contains('esri-legend__layer')) {
        const narrowed = (ev.target as HTMLElement).closest('.esri-legend__layer-row, .esri-legend__layer-table-row, .esri-legend__layer-list__item, .esri-legend__layer__item, .esri-legend__layer-item') as HTMLElement | null;
        if (narrowed) {
          itemEl = narrowed;
        }
      }

      console.log('[Legend] chosen item element ->', itemEl);


      let label = this.extractLegendLabelFromElement(itemEl as HTMLElement);
      console.log('[Legend] extracted label ->', label);
      // Only proceed if label matches a known legend entry
      if (!label) return;
      const labelStr = label.trim().toLowerCase();
      // Try to find the best match from the known legend labels
      const match = this.legendLabels.find((l: string) => labelStr === l.trim().toLowerCase()) ||
                    this.legendLabels.find((l: string) => labelStr.includes(l.trim().toLowerCase()));
      if (!match) {
        console.log('[Legend] clicked row is not a valid legend label, ignoring.');
        return;
      }
      label = match;

      // Try to discover a color swatch, otherwise fall back to a default
      let color = '#de3b3b';
      try {
        const swatch = (itemEl as HTMLElement).querySelector('.esri-legend__swatch, .swatch, .legend-swatch') as HTMLElement | null;
        if (swatch) {
          const bg = swatch.style.backgroundColor || swatch.getAttribute('fill') || swatch.getAttribute('data-color');
          if (bg) color = bg;
        } else {
          const svg = itemEl.querySelector('svg');
          if (svg) {
            const path = svg.querySelector('path, rect, polygon, circle') as SVGElement | null;
            const fill = path?.getAttribute('fill');
            if (fill) color = fill;
          }
        }
      } catch (e) {}

      if (label) {
        console.log('[Legend] calling highlightParcelsByAttribute', { label, color });
        void this.mapService.highlightParcelsByAttribute(label, color, [
          'landuse',
          'sub landuse',
          'landuseenglish',
          'landuse (english)',
          'currentuse',
          'buildinguse',
          'building use',
        ]);
      }
    } catch (err) {
      console.warn('onLegendClick failed', err);
    }
  }

  private extractLegendLabelFromElement(el: HTMLElement | null): string | null {
    if (!el) return null;

    // Prefer the most specific legend row or label container
    const target = el.closest('.esri-legend__layer-row, .esri-legend__layer-table-row, .esri-legend__layer-list__item, .esri-legend__layer__item, .esri-legend__layer-item, .esri-legend__layer') as HTMLElement | null || el;

    const labelSelectors = [
      '.esri-legend__layer-item__label',
      '.esri-legend__layer-label',
      '.esri-legend__layer-caption',
      '.esri-legend__layer-table-cell',
      '.esri-legend__layer-table-cell-text',
      '.legend-label',
      'label',
      'span',
    ];

    for (const sel of labelSelectors) {
      const node = target.querySelector(sel) as HTMLElement | null;
      if (node && node.innerText && node.innerText.trim()) {
        const txt = node.innerText.trim();
        if (/landuse|layer|plot boundaries/i.test(txt) && txt.length > 30) continue;
        return txt;
      }
    }

    // Fallback to the shortest direct text line from the target row
    const textCandidates = Array.from(target.querySelectorAll(':scope *'))
      .map((child) => (child as HTMLElement).innerText?.trim())
      .filter((txt): txt is string => !!txt && txt.length > 0);

    if (textCandidates.length) {
      const filtered = textCandidates.filter((txt) => !/landuse|layer|plot boundaries/i.test(txt) || txt.length <= 30);
      filtered.sort((a, b) => a.length - b.length);
      return filtered[0] || textCandidates.sort((a, b) => a.length - b.length)[0] || null;
    }

    const text = (target.textContent || '').trim();
    if (!text) return null;
    const lines = text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    const filteredLines = lines.filter((ln) => !(ln.length > 30 && ln.includes(',')));
    const pick = filteredLines.length ? filteredLines : lines;
    pick.sort((a, b) => a.length - b.length);
    return pick[0] || null;
  }

  private getRightPanelSectionState(section: RightPanelSection): boolean {
    switch (section) {
      case "result":
        return this.rightPanelResultOpen;
      case "scene":
        return this.rightPanelSceneOpen;
      case "panorama":
        return this.rightPanelPanoramaOpen;
      case "cctv":
        return this.rightPanelCctvOpen;
      case "kroki":
        return this.rightPanelKrokiOpen;
      case "sources":
        return this.rightPanelSourcesOpen;
      case "files":
        return this.rightPanelFilesOpen;
      case "uploads":
        return this.rightPanelUploadsOpen;
      case "comments":
        return this.rightPanelCommentsOpen;
      case "dashboard":
        return this.rightPanelDashboardOpen;
      case "legend":
        return this.rightPanelLegendOpen;
      case "reports":
        return this.rightPanelReportsOpen;
      case "voiceAgent":
        return this.rightPanelVoiceAgentOpen;
    }
  }

  private focusSourcesPanel(): void {
    this.expandRightPanel();
    this.resetRightPanelSections();
    this.activeRightPanelSection = "sources";
    this.rightPanelSourcesOpen = true;
  }

  private focusFilesPanel(): void {
    this.expandRightPanel();
    this.resetRightPanelSections();
    this.activeRightPanelSection = "files";
    this.rightPanelFilesOpen = true;
  }

  private focusUploadsPanel(): void {
    this.expandRightPanel();
    this.resetRightPanelSections();
    this.activeRightPanelSection = "uploads";
    this.rightPanelUploadsOpen = true;
  }

  private focusCommentsPanel(): void {
    this.expandRightPanel();
    this.resetRightPanelSections();
    this.activeRightPanelSection = "comments";
    this.rightPanelCommentsOpen = true;
  }

  openAttributesDialog(): void {
    if (!this.selectedParcel) {
      return;
    }
    this.focusSelectedResultPanel();
  }

  openAddedAttributesEditor(): void {
    if (!this.canEditSelectedParcelAttributes || !this.selectedParcel) {
      this.showParcelHint();
      return;
    }

    this.focusSelectedResultPanel();

    const attrs = (this.selectedParcel.attributes ?? {}) as Record<string, unknown>;
    const nextResolvedKeys: Record<string, string> = {};
    this.addedAttributeFields = this.addedAttributeFieldConfigs.map((config) => {
      const resolvedKey = this.resolveAttributeKey(attrs, config.keys);
      if (resolvedKey) {
        nextResolvedKeys[config.id] = resolvedKey;
      }
      const rawValue = resolvedKey ? attrs[resolvedKey] : "";
      return {
        id: config.id,
        label: config.label,
        inputType: config.inputType,
        value: rawValue === null || rawValue === undefined ? "" : String(rawValue),
      };
    });

    this.addedAttributeResolvedKeys = nextResolvedKeys;
    this.addedAttributesEditorOpen = true;
  }

  closeAddedAttributesEditor(): void {
    this.addedAttributesEditorOpen = false;
    this.addedAttributesSaving = false;
  }

  onAddedAttributesSaveClicked(values: Record<string, string>): void {
    this.pendingAddedAttributeValues = values;
    this.approvalConfirmDialogOpen = true;
  }

  cancelAddedAttributesConfirmation(): void {
    this.approvalConfirmDialogOpen = false;
    this.pendingAddedAttributeValues = null;
  }

  async confirmAddedAttributesSave(): Promise<void> {
    if (!this.pendingAddedAttributeValues) {
      this.cancelAddedAttributesConfirmation();
      return;
    }

    const values = this.pendingAddedAttributeValues;
    this.cancelAddedAttributesConfirmation();
    void this.savePendingUpdateRecord(values).catch((error) => {
      console.warn("Failed to save pending update JSON record", error);
    });
    await this.saveAddedAttributes(values);
  }

  async saveAddedAttributes(values: Record<string, string>): Promise<void> {
    if (!this.selectedParcel) {
      return;
    }

    const updates = this.buildEditableAttributeUpdates(values);
    if (!Object.keys(updates).length) {
      window.alert("No editable attributes were found for this parcel.");
      return;
    }

    this.addedAttributesSaving = true;
    this.refreshView();
    try {
      await this.mapService.updateParcelAttributes(this.selectedParcel.objectId, updates);
      const refreshed = await this.refreshSelectedParcelFromLive(this.selectedParcel);
      if (refreshed) {
        this.selectedParcel = refreshed;
      }
      this.openAddedAttributesEditor();
      window.alert("Attributes updated successfully.");
    } catch (error) {
      console.error("Failed to update parcel attributes", error);
      window.alert("Failed to save attributes. Please check layer edit permissions and try again.");
    } finally {
      this.addedAttributesSaving = false;
      this.refreshView();
    }
  }

  private async savePendingUpdateRecord(values: Record<string, string>): Promise<void> {
    if (!this.selectedParcel) {
      return;
    }

    const updateValues: PendingUpdateValues = {
      landbankArea: values["landbankArea"] ?? "",
      landbankGfa: values["landbankGfa"] ?? "",
      plotStatusEnglish: values["plotStatusEnglish"] ?? "",
      ownershipTypeEnglish: values["ownershipTypeEnglish"] ?? "",
      contractStatusEnglish: values["contractStatusEnglish"] ?? "",
      developerEnglish: values["developerEnglish"] ?? "",
      leaseTypeEnglish: values["leaseTypeEnglish"] ?? "",
      userEnglishName: values["userEnglishName"] ?? "",
      contractNo: values["contractNo"] ?? "",
    };

    const savedAt = new Date().toISOString();
    const record: PendingUpdateRecord = {
      id: `${this.selectedParcel.objectId || this.selectedParcel.id}-${Date.now()}`,
      plotId: String(this.selectedParcel.displayName || this.selectedParcel.attributes?.["PlotID"] || this.selectedParcel.id || ""),
      objectId: Number.isFinite(this.selectedParcel.objectId) ? this.selectedParcel.objectId : null,
      editor: this.loggedInUser || this.approvalCurrentUser,
      ceo: "Pending",
      gm: "Pending",
      pm: "Pending",
      status: updateValues.plotStatusEnglish || "Pending",
      savedAt,
      ...updateValues,
    };

    const savedRecord = await firstValueFrom(this.pendingUpdatesService.addPendingUpdate(record));
    this.pendingUpdateRecords = [...this.pendingUpdateRecords, savedRecord];
  }

  async deleteAddedAttributes(): Promise<void> {
    if (!this.selectedParcel) {
      return;
    }

    const confirmDelete = window.confirm("Do you want to clear these editable attributes for the selected plot?");
    if (!confirmDelete) {
      return;
    }

    const clearValues: Record<string, string> = {};
    for (const field of this.addedAttributeFieldConfigs) {
      clearValues[field.id] = "";
    }

    await this.saveAddedAttributes(clearValues);
  }

  private buildEditableAttributeUpdates(values: Record<string, string>): Record<string, unknown> {
    const updates: Record<string, unknown> = {};
    for (const config of this.addedAttributeFieldConfigs) {
      const resolvedKey = this.addedAttributeResolvedKeys[config.id];
      if (!resolvedKey) {
        continue;
      }
      const nextValue = (values[config.id] ?? "").trim();
      if (nextValue === "") {
        updates[resolvedKey] = null;
        continue;
      }
      if (config.inputType === "number") {
        const numeric = Number(nextValue.replace(/,/g, ""));
        updates[resolvedKey] = Number.isFinite(numeric) ? numeric : nextValue;
        continue;
      }
      updates[resolvedKey] = nextValue;
    }
    return updates;
  }

  private resolveAttributeKey(attributes: Record<string, unknown>, candidates: string[]): string | null {
    for (const candidate of candidates) {
      if (Object.prototype.hasOwnProperty.call(attributes, candidate)) {
        return candidate;
      }
    }

    const attrEntries = Object.entries(attributes);
    for (const candidate of candidates) {
      const normalizedCandidate = this.normalizePlotDetailLabel(candidate);
      const match = attrEntries.find(([key]) => this.normalizePlotDetailLabel(key) === normalizedCandidate);
      if (match) {
        return match[0];
      }
    }
    return null;
  }

  closeAttributesDialog(): void {
    this.attributesDialogOpen = false;
  }

  // Sample record dialog
  sampleDialogOpen = false;
  sampleDialogCode: string = "";

  get sampleDialogTitle(): string {
    const src = this.archiveSources.find((s) => s.code === this.sampleDialogCode);
    return src ? `${src.title} — Sample Record` : "Sample Record";
  }

  get sampleParcelNo(): string {
    return this.selectedParcel?.displayName ?? "—";
  }

  get sampleParcelArea(): string {
    const props = (this.selectedParcel?.attributes ?? {}) as Record<string, unknown>;
    const raw = props["PSh Area (m²)"] ?? props["Shape_Area"] ?? props["Area"];
    if (raw === undefined || raw === null || `${raw}`.trim() === "") return "—";
    const n = typeof raw === "number" ? raw : Number(raw);
    return Number.isFinite(n) ? `${n.toFixed(2)} m²` : String(raw);
  }

  readonly sampleAddress = "123 Maple St, Springfield, IL 62701";

  openSampleDialog(code: string): void {
    this.sampleDialogCode = code;
    this.sampleDialogOpen = true;
  }

  closeSampleDialog(): void {
    this.sampleDialogOpen = false;
  }

  // Kroki panel
  krokiMode: 'blank' | 'satellite' | 'dwg' = 'blank';
  readonly krokiDwgUrl = "/A1.dwg";
  readonly krokiPdfUrl: string | null = null;
  readonly krokiSvgUrl: string | null = null;
  krokiCadPreviewUrl: string | null = null;
  krokiCadPreviewKind: "pdf" | "svg" | "none" = "none";
  krokiCadPreviewLoading = false;

  readonly useApsViewer = false;

  /**
   * APS model URN for the DWG/CAD viewer.
   * Replace 'PLACEHOLDER_URN' with the base64-encoded URN after uploading
   * A1.dwg to an APS bucket and running the Model Derivative translation job.
   * Example: 'urn:adsk.objects:os.object:my-bucket%2FA1.dwg' → base64-encode it.
   */
  apsModelUrn = 'PLACEHOLDER_URN';
  apsViewerFallback = !this.useApsViewer;

  get hasConfiguredCadPreview(): boolean {
    return !!this.krokiPdfUrl || !!this.krokiSvgUrl;
  }

  onApsViewerError(msg: string): void {
    console.warn('APS Viewer error – falling back to PDF/SVG:', msg);
    this.apsViewerFallback = true;
  }
  krokiData: {
    viewBox: string;
    width: number;
    height: number;
    polygonPoints: string;
    vertices: { index: number; lat: string; lng: string; labelX: number; labelY: number }[];
    area: string;
    date: string;
    satelliteUrl: string;
  } | null = null;

  openKrokiDialog(): void {
    if (!this.selectedParcel) {
      return;
    }
    this.krokiData = this.buildKrokiData(this.selectedParcel);
    this.focusKrokiPanel();
    if (this.krokiMode === "dwg") {
      this.apsViewerFallback = !this.useApsViewer;
      this.mapService.destroyKrokiMap();
      void this.resolveKrokiCadPreview();
      return;
    }
    // Init the live map after the right-panel host is in the DOM.
    setTimeout(() => {
      const host = this.krokiMapHost?.nativeElement;
      if (host && this.selectedParcel) {
        this.mapService
          .initializeKrokiMap(host, this.selectedParcel, this.krokiMode === "blank" ? "blank" : "satellite")
          .catch((err) => console.error("Kroki map init failed", err));
      }
    }, 0);
  }

  closeKrokiDialog(): void {
    this.rightPanelKrokiOpen = false;
    this.mapService.destroyKrokiMap();
  }

  setKrokiMode(mode: "blank" | "satellite" | "dwg"): void {
    this.krokiMode = mode;
    if (mode === "dwg") {
      this.apsViewerFallback = !this.useApsViewer;
      this.mapService.destroyKrokiMap();
      void this.resolveKrokiCadPreview();
      return;
    }
    if (!this.rightPanelKrokiOpen || !this.selectedParcel) {
      return;
    }
    const host = this.krokiMapHost?.nativeElement;
    if (!host) {
      return;
    }
    this.mapService
      .initializeKrokiMap(host, this.selectedParcel, mode)
      .catch((err) => console.error("Kroki map init failed", err));
  }

  openKrokiCadInNewTab(): void {
    const target = this.krokiCadPreviewUrl || this.krokiDwgUrl;
    window.open(target, "_blank", "noopener");
  }

  private async resolveKrokiCadPreview(): Promise<void> {
    if (!this.hasConfiguredCadPreview) {
      this.krokiCadPreviewLoading = false;
      this.krokiCadPreviewUrl = null;
      this.krokiCadPreviewKind = "none";
      return;
    }

    this.krokiCadPreviewLoading = true;
    this.krokiCadPreviewUrl = null;
    this.krokiCadPreviewKind = "none";
    try {
      if (this.krokiPdfUrl && await this.urlExists(this.krokiPdfUrl)) {
        this.krokiCadPreviewUrl = `${this.krokiPdfUrl}#view=FitH`;
        this.krokiCadPreviewKind = "pdf";
        return;
      }
      if (this.krokiSvgUrl && await this.urlExists(this.krokiSvgUrl)) {
        this.krokiCadPreviewUrl = this.krokiSvgUrl;
        this.krokiCadPreviewKind = "svg";
        return;
      }
    } finally {
      this.krokiCadPreviewLoading = false;
    }
  }

  private async urlExists(url: string): Promise<boolean> {
    try {
      const res = await fetch(url, { method: "HEAD" });
      if (res.ok) {
        return true;
      }
      if (res.status === 405) {
        const getRes = await fetch(url, { method: "GET" });
        return getRes.ok;
      }
      return false;
    } catch {
      return false;
    }
  }

  private buildKrokiData(parcel: Parcel): typeof this.krokiData {
    const geom = parcel.geometry as { type: string; coordinates: unknown } | undefined;
    if (!geom) {
      return null;
    }
    let ring: number[][] = [];
    if (geom.type === "Polygon") {
      ring = (geom.coordinates as number[][][])[0] ?? [];
    } else if (geom.type === "MultiPolygon") {
      ring = ((geom.coordinates as number[][][][])[0] ?? [[]])[0] ?? [];
    }
    if (ring.length < 3) {
      return null;
    }

    // Drop closing duplicate vertex if present.
    const verts = ring.length > 1 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]
      ? ring.slice(0, -1)
      : ring.slice();

    const lons = verts.map((p) => p[0]);
    const lats = verts.map((p) => p[1]);
    const minX = Math.min(...lons);
    const maxX = Math.max(...lons);
    const minY = Math.min(...lats);
    const maxY = Math.max(...lats);
    const w = Math.max(maxX - minX, 1e-9);
    const h = Math.max(maxY - minY, 1e-9);

    const W = 600;
    const H = 420;
    const pad = 50;
    const sx = (W - 2 * pad) / w;
    const sy = (H - 2 * pad) / h;
    const s = Math.min(sx, sy);
    // Center
    const offX = (W - w * s) / 2;
    const offY = (H - h * s) / 2;
    const project = (lon: number, lat: number): [number, number] => [
      offX + (lon - minX) * s,
      // Flip Y so north is up
      H - (offY + (lat - minY) * s),
    ];

    const projected = verts.map((p) => project(p[0], p[1]));
    const polygonPoints = projected.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(" ");

    // Compute centroid for label offset direction
    const cx = projected.reduce((acc, p) => acc + p[0], 0) / projected.length;
    const cy = projected.reduce((acc, p) => acc + p[1], 0) / projected.length;

    const vertices = projected.map((p, i) => {
      const dx = p[0] - cx;
      const dy = p[1] - cy;
      const len = Math.hypot(dx, dy) || 1;
      const offset = 18;
      return {
        index: i + 1,
        lat: verts[i][1].toFixed(6),
        lng: verts[i][0].toFixed(6),
        labelX: p[0] + (dx / len) * offset,
        labelY: p[1] + (dy / len) * offset,
      };
    });

    const props = parcel.attributes ?? {};
    const areaRaw = (props["PSh Area (m²)"] ?? props["Shape_Area"] ?? props["Area"] ?? "") as
      | number
      | string;
    const area = typeof areaRaw === "number" ? areaRaw.toFixed(2) : String(areaRaw || "—");

    const today = new Date();
    const date = `${String(today.getDate()).padStart(2, "0")}-${String(today.getMonth() + 1).padStart(2, "0")}-${today.getFullYear()}`;

    return {
      viewBox: `0 0 ${W} ${H}`,
      width: W,
      height: H,
      polygonPoints,
      vertices,
      area,
      date,
      satelliteUrl: this.buildSatelliteUrl(minX, minY, maxX, maxY, w, h, W, H),
    };
  }

  private buildSatelliteUrl(
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
    w: number,
    h: number,
    W: number,
    H: number
  ): string {
    // The staging imagery service is unavailable; use the bundled image.
    return new URL("sattelite.png", document.baseURI).toString();
  }

  addNewDocument(): void {
    // Open for the last document that has no description, or the last one overall
    let target = this.uploadedDocuments.length - 1;
    for (let i = this.uploadedDocuments.length - 1; i >= 0; i--) {
      if (!this.uploadedDocuments[i].description) { target = i; break; }
    }
    this.openDescriptionFor(target);
  }

  openDescriptionFor(idx: number): void {
    this.descriptionTargetIndex = idx;
    this.descriptionText = this.uploadedDocuments[idx]?.description ?? "";
    this.descriptionDialogOpen = true;
  }

  saveDescription(): void {
    if (this.descriptionTargetIndex >= 0 && this.descriptionTargetIndex < this.uploadedDocuments.length) {
      this.uploadedDocuments[this.descriptionTargetIndex] = {
        ...this.uploadedDocuments[this.descriptionTargetIndex],
        description: this.descriptionText,
      };
    }
    this.descriptionDialogOpen = false;
    this.descriptionText = "";
    this.descriptionTargetIndex = -1;
  }

  cancelDescription(): void {
    this.descriptionDialogOpen = false;
    this.descriptionText = "";
    this.descriptionTargetIndex = -1;
  }

  onSmartSearch(): void {
    const q = this.smartSearchText.trim();
    if (!q) {
      return;
    }
    console.log("Smart search:", q);
    // TODO: call smart search API
  }

  async onParcelSearch(): Promise<void> {
    this.expandLeftPanel();
    this.hasParcelSearchRun = true;
    const term = this.parcelSearchText.trim();
    if (!term) {
      this.parcelMatches = [];
      this.parcelStatusText = "Enter a plot, ATM, or branch ID to search.";
      this.resetRightPanelSections();
      return;
    }
    this.isParcelSearching = true;
    this.parcelStatusText = "Searching...";
    try {
      const normalizedTerm = term.toUpperCase();
      if (this.isLocationIdSearch(normalizedTerm)) {
        this.parcelMatches = await this.mapService.searchAtmAndBranchById(normalizedTerm);
        if (!this.parcelMatches.length) {
          this.parcelStatusText = `No matching ATM/branch found for ${term}.`;
          this.resetRightPanelSections();
        } else if (this.parcelMatches.length === 1) {
          await this.onApplyMasterplan(this.parcelMatches[0]);
          this.parcelStatusText = `Found location ${this.parcelMatches[0].displayName || this.parcelMatches[0].id}.`;
          this.focusSelectedResultPanel();
        } else {
          this.parcelStatusText = `${this.parcelMatches.length} matching ATM/branch records.`;
        }
        return;
      }

      this.parcelMatches = await this.mapService.searchMasterplanPlots(term, this.activeDataset);
      if (!this.parcelMatches.length) {
        const dsLabel = this.activeDataset === '2018' ? 'Master Plan 2018' : 'PB Masterplan 2026';
        this.parcelStatusText = `No matching plot found in ${dsLabel}.`;
        this.resetRightPanelSections();
      } else if (this.parcelMatches.length === 1) {
        // Auto-zoom when a single plot matches.
        await this.onApplyMasterplan(this.parcelMatches[0]);
        this.parcelStatusText = `Found plot ${this.parcelMatches[0].displayName || this.parcelMatches[0].id}.`;
        this.focusSelectedResultPanel();
      } else {
        this.parcelStatusText = `${this.parcelMatches.length} matching plots.`;
      }
    } catch (err) {
      console.error(err);
      this.parcelStatusText = this.t("searchMasterplanFailed");
    } finally {
      this.isParcelSearching = false;
      this.refreshView();
    }
  }

  async onApplyMasterplan(parcel: Parcel): Promise<void> {
    await this.mapService.zoomToMasterplanParcel(parcel);
  }

  resetParcelCard(): void {
    this.parcelSearchText = "";
    this.parcelMatches = [];
    this.parcelStatusText = this.t("noMatch");
    this.hasParcelSearchRun = false;
  }

  async toggle3D(): Promise<void> {
    // close overlay if open before opening right panel
    if (this.sceneOverlayOpen) {
      this.sceneOverlayOpen = false;
      this.panoramaOverlayOpen = false;
    }
    this.focusScenePanel();
  }

  async openPlotSheetDialog(): Promise<void> {
    if (!this.selectedParcel) {
      return;
    }

    // Log to console when Plot Sheet button is pressed
    console.log('Plot Sheet button pressed for parcel:', this.selectedParcel.displayName || this.selectedParcel.id);

    this.plotSheetDialogOpen = true;
    this.plotSheetLoading = true;
    this.plotSheetError = "";
    this.plotSheetImageUrl = "";
    this.plotSheetGeneratedAt = this.formatHumanDateTime(new Date());
    this.refreshView();

    try {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const captureSize = this.resolvePlotSheetCaptureSize();
      this.plotSheetImageUrl = await this.mapService.takePlotSheetScreenshot(
        this.selectedParcel,
        captureSize.width,
        captureSize.height
      );
    } catch (err) {
      console.error("Plot sheet screenshot failed", err);
      this.plotSheetError = this.t("plotSheetFailed");
    } finally {
      this.plotSheetLoading = false;
      this.refreshView();
    }
  }

  private resolvePlotSheetCaptureSize(): { width: number; height: number } {
    const fallback = { width: 1800, height: 1800 };
    const mapWrap = this.plotSheetMapWrap?.nativeElement;
    if (!mapWrap) return fallback;

    const rect = mapWrap.getBoundingClientRect();
    if (!rect.width || !rect.height) return fallback;

    // Force square output: height = width.
    const size = Math.max(1400, Math.round(rect.width * 2));
    return { width: size, height: size };
  }

  closePlotSheetDialog(): void {
    this.plotSheetDialogOpen = false;
    this.plotSheetLoading = false;
    this.plotSheetError = "";
  }

  async downloadPlotSheetJpg(): Promise<void> {
    const dataUrl = await this.captureTemplate("image/jpeg", 0.92);
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${this.buildPlotSheetFileBaseName()}.jpg`;
    link.click();
  }

  async downloadPlotSheetPdf(): Promise<void> {
    const dataUrl = await this.captureTemplate("image/jpeg", 0.95);
    if (!dataUrl) return;
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const props = pdf.getImageProperties(dataUrl);
    const ratio = props.width / props.height;
    const pageRatio = pageWidth / pageHeight;
    const renderWidth = ratio > pageRatio ? pageWidth : pageHeight * ratio;
    const renderHeight = ratio > pageRatio ? pageWidth / ratio : pageHeight;
    const x = (pageWidth - renderWidth) / 2;
    const y = (pageHeight - renderHeight) / 2;
    pdf.addImage(dataUrl, "JPEG", x, y, renderWidth, renderHeight);
    pdf.save(`${this.buildPlotSheetFileBaseName()}.pdf`);
  }

  private async captureTemplate(mime: "image/png" | "image/jpeg", quality = 0.92): Promise<string | null> {
    const node = this.plotSheetTemplate?.nativeElement;
    if (!node) return null;
    this.plotSheetExporting = true;
    this.refreshView();
    try {
      const canvas = await html2canvas(node, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      return canvas.toDataURL(mime, quality);
    } catch (err) {
      console.error("Plot sheet capture failed", err);
      return null;
    } finally {
      this.plotSheetExporting = false;
      this.refreshView();
    }
  }

  private buildPlotSheetFileBaseName(): string {
    const idSource = this.selectedParcel?.displayName || this.selectedParcel?.id || "plot";
    const safeId = idSource.replace(/[^a-zA-Z0-9_-]/g, "_");
    return `${safeId}_${this.formatFileDateTime(new Date())}`;
  }

  // --- Plot Sheet 1 handlers (duplicate behavior of Plot Sheet) ---
  async openPlotSheet1Dialog(): Promise<void> {
    if (!this.selectedParcel) {
      return;
    }

    this.plotSheet1DialogOpen = true;
    this.plotSheet1Loading = true;
    this.plotSheet1Error = "";
    this.plotSheet1ImageUrl = "";
    this.showPlotSheet1Grid = false;
    this.plotSheet1GeneratedAt = this.formatHumanDateTime(new Date());
    this.refreshView();

    try {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const captureSize = this.resolvePlotSheetCaptureSize();
      this.plotSheet1ImageUrl = await this.mapService.takePlotSheetScreenshot(
        this.selectedParcel,
        captureSize.width,
        captureSize.height
      );
      // 3D scene is initialized only when user clicks the 3DV button.
    } catch (err) {
      console.error("Plot sheet 1 screenshot failed", err);
      this.plotSheet1Error = this.t("plotSheetFailed");
    } finally {
      this.plotSheet1Loading = false;
      this.refreshView();
    }

    // Auto-trigger the three action buttons on load: Location Map → Show Grid → Show 3D
    this.onBtnDivLocation();
    this.onBtnShowGrid();
    this.onBtnShow3d();
  }

  closePlotSheet1Dialog(): void {
    this.plotSheet1DialogOpen = false;
    this.plotSheet1Loading = false;
    this.plotSheet1Error = "";
    this.locationMapView?.destroy();
    this.locationMapView = null;
    this.destroyPlotSheetScenes();
  }

  private async initLocationMap(): Promise<void> {
    const container = this.divlocationHost?.nativeElement;
    if (!container) {
      console.warn("divlocationHost not found");
      return;
    }

    // Destroy any previous instance
    this.locationMapView?.destroy();
    this.locationMapView = null;

    const layer = new GeoJSONLayer({
      url: new URL("geojson/PBMasterplan2026.geojson", document.baseURI).toString(),
      renderer: {
        type: "simple",
        symbol: {
          type: "simple-fill",
          color: [0, 0, 0, 0],
          outline: { color: [211, 211, 211, 1], width: 1 },
        },
      } as any,
    });

    const map = new EsriMap({ layers: [layer] });

    this.locationMapView = new MapView({
      container,
      map,
      ui: { components: ["zoom"] },
    });

    try {
      await this.locationMapView.when();
      await layer.load();

      const center = this.plotSheetCenter;
      const lon = Number(center.lng);
      const lat = Number(center.lat);
      const centerPoint = Number.isFinite(lon) && Number.isFinite(lat)
        ? new Point({ longitude: lon, latitude: lat, spatialReference: { wkid: 4326 } })
        : undefined;

      if (layer.fullExtent) {
        await this.locationMapView.goTo(layer.fullExtent);
      } else if (centerPoint) {
        await this.locationMapView.goTo({ target: centerPoint, zoom: 14 });
      }

      // Add highlight for the selected parcel (ring + dot) if available
      try {
        // remove existing highlight layer if present
        const existing = map.findLayerById("ps1-highlight");
        if (existing) {
          map.remove(existing);
        }

        const highlightLayer = new GraphicsLayer({ id: "ps1-highlight" });
        map.add(highlightLayer);

        if (this.selectedParcel) {
          // compute center from selectedParcel geometry
          const center = this.plotSheetCenter; // { lat, lng } as strings
          const lon = parseFloat(center.lng);
          const lat = parseFloat(center.lat);

          if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
            throw new Error(`Invalid center coordinates for plot location map: ${center.lat}, ${center.lng}`);
          }

          const point = new Point({ longitude: lon, latitude: lat, spatialReference: { wkid: 4326 } });

          const ring = new Graphic({
            geometry: point,
            symbol: {
              type: "simple-marker",
              style: "circle",
              color: [0, 0, 0, 0],
              size: 40,
              outline: { color: [255, 0, 0, 1], width: 3 },
            },
          });

          const dot = new Graphic({
            geometry: point,
            symbol: {
              type: "simple-marker",
              style: "circle",
              color: [255, 0, 0, 1],
              size: 8,
              outline: { color: [255, 0, 0, 1], width: 0 },
            },
          });

          highlightLayer.addMany([ring, dot]);
        }
      } catch (err) {
        console.warn("Failed to add parcel highlight", err);
      }
    } catch (err) {
      console.error("Location map init error", err);
    }
  }

  onBtnDivLocation(): void {
    void this.initLocationMap();
  }

  onBtnShowGrid(): void {
    this.showPlotSheet1Grid = true;
    this.refreshView();
  }

  onBtnShow3d(): void {
    void this.loadPlotSheet3D();
  }

  async downloadPlotSheet1Jpg(): Promise<void> {
    const dataUrl = await this.captureTemplate1("image/jpeg", 0.92);
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${this.buildPlotSheet1FileBaseName()}.jpg`;
    link.click();
  }


  async downloadPlotSheet1Pdf(): Promise<void> {
    const dataUrl = await this.captureTemplate1("image/jpeg", 0.95);
    if (!dataUrl) return;
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const props = pdf.getImageProperties(dataUrl);
    const ratio = props.width / props.height;
    const pageRatio = pageWidth / pageHeight;
    const renderWidth = ratio > pageRatio ? pageWidth : pageHeight * ratio;
    const renderHeight = ratio > pageRatio ? pageWidth / ratio : pageHeight;
    const x = (pageWidth - renderWidth) / 2;
    const y = (pageHeight - renderHeight) / 2;
    pdf.addImage(dataUrl, "JPEG", x, y, renderWidth, renderHeight);
    pdf.save(`${this.buildPlotSheet1FileBaseName()}.pdf`);
  }

  private async captureTemplate1(mime: "image/png" | "image/jpeg", quality = 0.92): Promise<string | null> {
    const node = this.plotSheet1Template?.nativeElement;
    if (!node) return null;
    this.plotSheet1Exporting = true;
    this.refreshView();

    // Replace live ArcGIS views with static screenshot <img> overlays so html2canvas
    // (which cannot capture WebGL canvases) renders real map content instead of black.
    const overlays = await this.swapArcgisViewsForScreenshots();

    try {
      // Give the browser a frame to paint the swapped images before capture.
      await new Promise((r) => requestAnimationFrame(() => r(null)));

      const canvas = await html2canvas(node, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      return canvas.toDataURL(mime, quality);
    } catch (err) {
      console.error("Plot sheet 1 capture failed", err);
      return null;
    } finally {
      this.restoreArcgisViews(overlays);
      this.plotSheet1Exporting = false;
      this.refreshView();
    }
  }

  /**
   * Take screenshots of every live ArcGIS view inside the plot-sheet template and
   * overlay them as <img> elements positioned over the live containers. The live
   * canvases are hidden (via visibility) so html2canvas captures the screenshot
   * instead of a blank/black WebGL surface.
   * Returns the list of inserted overlay nodes for later cleanup.
   */
  private async swapArcgisViewsForScreenshots(): Promise<HTMLImageElement[]> {
    const targets: Array<{ host: HTMLElement | null; view: any }> = [
      {
        host: document.getElementById("divlocation"),
        view: this.locationMapView,
      },
      {
        host: document.getElementById("ps1-extra-box-1-scene-host"),
        view: (this.mapService as any).getSceneView?.() ?? null,
      },
      {
        host: document.getElementById("ps1-extra-box-2-preview"),
        view: this.plotSheetSceneViews?.[0] ?? null,
      },
    ];

    const overlays: HTMLImageElement[] = [];

    for (const { host, view } of targets) {
      if (!host || !view || typeof view.takeScreenshot !== "function") continue;
      try {
        // Make sure the view is actually ready to render.
        if (typeof view.when === "function") {
          try { await view.when(); } catch { /* ignore */ }
        }
        const rect = host.getBoundingClientRect();
        const w = Math.max(1, Math.round(rect.width));
        const h = Math.max(1, Math.round(rect.height));
        const shot = await view.takeScreenshot({ width: w * 2, height: h * 2 });
        if (!shot?.dataUrl) continue;

        // Hide the live ArcGIS DOM children (keep them in layout so size doesn't shift).
        const children = Array.from(host.children) as HTMLElement[];
        for (const c of children) {
          (c as any).__prevVisibility = c.style.visibility;
          c.style.visibility = "hidden";
        }

        // Make sure the host can hold an absolutely positioned overlay.
        const prevPosition = host.style.position;
        if (!prevPosition || prevPosition === "static") host.style.position = "relative";
        (host as any).__prevPosition = prevPosition;

        const img = document.createElement("img");
        img.src = shot.dataUrl;
        img.className = "arcgis-print-overlay";
        img.style.position = "absolute";
        img.style.inset = "0";
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "cover";
        img.style.pointerEvents = "none";
        img.style.zIndex = "10";
        host.appendChild(img);
        overlays.push(img);
      } catch (err) {
        console.warn("[export] takeScreenshot failed for", host?.id, err);
      }
    }

    return overlays;
  }

  private restoreArcgisViews(overlays: HTMLImageElement[]): void {
    for (const img of overlays) {
      const host = img.parentElement;
      img.remove();
      if (!host) continue;
      const children = Array.from(host.children) as HTMLElement[];
      for (const c of children) {
        const prev = (c as any).__prevVisibility;
        c.style.visibility = typeof prev === "string" ? prev : "";
        delete (c as any).__prevVisibility;
      }
      const prevPos = (host as any).__prevPosition;
      if (typeof prevPos === "string") {
        host.style.position = prevPos;
        delete (host as any).__prevPosition;
      }
    }
  }

  private buildPlotSheet1FileBaseName(): string {
    const base = this.buildPlotSheetFileBaseName();
    return `${base}_ps1`;
  }

  private formatFileDateTime(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const mi = String(date.getMinutes()).padStart(2, "0");
    const ss = String(date.getSeconds()).padStart(2, "0");
    return `${yyyy}${mm}${dd}_${hh}${mi}${ss}`;
  }

  private formatHumanDateTime(date: Date): string {
    return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;
  }

  ngAfterViewInit(): void {
    this.updateThemeClass();
    if (!this.mapHost?.nativeElement) {
      return;
    }

    this.mapService
      .initializeMap(this.mapHost.nativeElement, this.mapConfig)
      .then(() => {
        this.statusText = this.t("mapReady");
        void this.checkPanoramicServiceAvailability();

        // Register a global map click handler to open panoramas directly from any panoramic point
        const view = this.mapService.getMapView();
        if (view) {
          try {
            // remove previous if any
            this.globalMapClickHandle?.remove?.();
          } catch {}
          this.globalMapClickHandle = view.on('click', async (event: any) => {
            try {
              // Prefer a hitTest against the generated panoramic points layer if present
              const webMap = this.mapService.getWebMap();
              const panoLayer = webMap?.layers?.toArray?.().find((l: any) => l?.title === 'Panoramic Points');
              let hit: any = null;
              let graphic: any = null;

              if (panoLayer) {
                hit = await view.hitTest(event, { include: [panoLayer] });
                graphic = (hit.results as Array<{ graphic?: any }>)[0]?.graphic;
                console.log('[global click] hitTest against Panoramic Points layer ->', !!graphic);
              }

              // fallback to general hitTest if no graphic found on the panoramic layer
              if (!graphic) {
                hit = await view.hitTest(event);
                if (!hit || !hit.results || !hit.results.length) return;
                const found = (hit.results as Array<{ graphic?: any }>).find((r) => {
                  const layer = r.graphic?.layer;
                  return (
                    layer?.id === 'panoramic-json-layer' ||
                    layer?.title === 'Panoramic JSON' ||
                    layer?.title === 'Panoramic Points' ||
                    layer?.listMode === 'show'
                  );
                });
                graphic = found?.graphic;
                if (!graphic) return;
              }

              const rawAttrs = graphic.attributes ?? {};
              const fileName = rawAttrs.file_name ?? rawAttrs.fileName ?? rawAttrs.filename ?? rawAttrs.image_name ?? rawAttrs.imageName ?? rawAttrs.name ?? rawAttrs.NAME;
              const directUrl = rawAttrs.url ?? rawAttrs.image_url ?? rawAttrs.imageUrl ?? rawAttrs.panorama_url ?? rawAttrs.panoramaUrl ?? rawAttrs.full_url ?? rawAttrs.fullUrl ?? rawAttrs.path;
              const missionName = rawAttrs.missionName ?? rawAttrs.mission ?? rawAttrs.MISSION ?? rawAttrs.mission_name ?? rawAttrs.MissionName;
              const imageName = rawAttrs.imageName ?? rawAttrs.image_name ?? rawAttrs.image ?? rawAttrs.file_name ?? rawAttrs.filename ?? rawAttrs.name ?? rawAttrs.NAME;

              if (directUrl) {
                let url = String(directUrl || '').trim();
                if (url && !/^https?:\/\//i.test(url) && url.startsWith('/')) {
                  url = `${this.mapConfig.portalUrl.replace(/\/$/, '')}${url}`;
                }
                this.openPanoramaIframe(url);
                return;
              }

              if (fileName) {
                try {
                  await this.openPanoramaByFileName(String(fileName));
                  return;
                } catch (err) {
                  console.warn('[global click] openPanoramaByFileName failed', err);
                }
              }

              if (missionName && imageName) {
                this.openPanoramaOverlay();
                this.streetViewService.getPanoramicImage(String(missionName), String(imageName)).subscribe({
                  next: (blob) => {},
                  error: (err) => console.error('[global click] mission/image fallback failed', err),
                });
                return;
              }

              // nothing resolved
              this.showPanoramicClickMessage('Could not resolve a panorama file for this point.');
            } catch (err) {
              console.error('[global click] error handling click', err);
            }
          });
        }
      })
      .catch((error) => {
        this.statusText = this.t("mapLoadFailed");
        console.error(error);
      });

    this.mapService.selectedParcel$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((parcel) => {
        if (!parcel) {
          this.selectedParcel = null;
          this.groupedFiles = [];
          this.selectedRoadLabel = this.t("noParcelSelected");
          this.resetRightPanelSections();
          this.refreshView();
          return;
        }

        void this.refreshSelectedParcelFromLive(parcel).then((liveParcel) => {
          const activeParcel = liveParcel ?? parcel;
          this.selectedParcel = activeParcel;
          this.selectedRoadLabel = activeParcel.displayName;
          this.focusSelectedResultPanel();
          this.loadArchive(activeParcel.id);
          if (this.rightPanelSceneOpen) {
            void this.mapService.zoomSceneToParcel(activeParcel).catch((err) =>
              console.warn("zoomSceneToParcel failed", err)
            );
          }
          this.refreshView();
        });
      });
  }

  ngOnDestroy(): void {
    this.removeRightPanelDragListeners?.();
    if (this.onlineListener) {
      window.removeEventListener('online', this.onlineListener);
    }
    if (this.offlineListener) {
      window.removeEventListener('offline', this.offlineListener);
    }
    try { this.globalMapClickHandle?.remove?.(); } catch {}
    this.destroyPanoramaViewer();
    this.mapService.destroy();
  }

  async onSearch(): Promise<void> {
    this.expandLeftPanel();
    this.isSearching = true;
    try {
      this.matchingParcels = await this.mapService.searchParcels(this.searchText);
      if (!this.matchingParcels.length) {
        this.statusText = this.t("noMatch");
        this.resetRightPanelSections();
      }
    } finally {
      this.isSearching = false;
      this.refreshView();
    }
  }

  async onApply(parcel: Parcel): Promise<void> {
    await this.mapService.selectParcelByObjectId(parcel.objectId);
  }

  resetSelection(): void {
    this.searchText = "";
    this.matchingParcels = [];
    this.selectedParcel = null;
    this.groupedFiles = [];
    this.selectedRoadLabel = this.t("noParcelSelected");
    this.statusText = this.t("mapReady");
    this.hasParcelSearchRun = false;
    this.resetRightPanelSections();
  }

  clearGraphics(): void {
    this.mapService.clearHighlight();
    this.panoramicPointsService.clearPoints();
    // Also clear any dashboard/pie-chart highlights and reset dashboard filter state
    this.mapService.clearDashboardHighlights();
    this.dashboardSelectedZone = null;
    this.dashboardSelectedContractStatus = '';
    this.selectedContractStatusSlice = null;
    this.parcelSearchText = "";
    this.parcelMatches = [];
    this.parcelStatusText = this.t("noMatch");
    this.hasParcelSearchRun = false;
    this.selectedParcel = null;
    this.groupedFiles = [];
    this.selectedRoadLabel = this.t("noParcelSelected");
    this.labelMode = "current";
    this.resetRightPanelSections();
    this.rightPanelCollapsed = true;
  }

  toggleLayerToolbar(): void {
    console.log('[custom toolbar] toggle layer clicked');
  }

  startMeasurementToolbar(): void {
    console.log('[custom toolbar] measure distance clicked');
  }

  startDrawPolygonToolbar(): void {
    console.log('[custom toolbar] draw polygon clicked');
  }

  openGeoAISearchToolbar(): void {
    console.log('[custom toolbar] AI search clicked');
  }

  goHomeSidebar(): void {
    this.openAtmReportsPanel();
  }

  private loadArchive(parcelId: string): void {
    this.isLoadingArchive = true;
    this.archiveService
      .getByParcel(parcelId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (files) => {
          this.groupedFiles = this.groupArchiveFiles(files);
          this.isLoadingArchive = false;
          this.refreshView();
        },
        error: () => {
          this.groupedFiles = [];
          this.isLoadingArchive = false;
          this.refreshView();
        },
      });
  }

  private async initializeScenePanel(): Promise<void> {
    const host = this.sceneHost?.nativeElement;
    if (!host) {
      return;
    }

    // Wait for the scene host to be attached and laid out by Angular.
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    for (let i = 0; i < 20; i++) {
      if (host.isConnected && host.clientWidth > 0 && host.clientHeight > 0) {
        break;
      }
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }

    this.isSceneLoading = true;
    this.sceneError = "";
    this.refreshView();
    try {
      await this.mapService.initializeScene(host);
      this.mapService.syncMapToScene();
      if (this.selectedParcel) {
        await this.mapService.zoomSceneToParcel(this.selectedParcel);
      }
    } catch (err: any) {
      console.error("3D scene init failed", err);
      this.sceneError =
        (err && err.message) ||
        "Failed to load 3D scene. Check portal/WebScene access.";
    } finally {
      this.isSceneLoading = false;
      this.refreshView();
    }
  }

  private async resolveWebSceneIdForPlotSheet(): Promise<string | undefined> {
    const cfg = this.mapConfig!;
    if (cfg.webSceneId) return cfg.webSceneId;
    if (!cfg.instantAppId) return undefined;
    const url = `${cfg.portalUrl.replace(/\/$/, "")}/sharing/rest/content/items/${cfg.instantAppId}/data?f=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load Instant App config (${res.status}).`);
    const data: any = await res.json();
    return (
      data?.values?.webscene ??
      data?.values?.webmap ??
      data?.webscene ??
      data?.map?.itemId ??
      undefined
    );
  }

  private async initializePlotSheetScenes(): Promise<void> {
    try {
      const el1 = document.getElementById("ps1-extra-box-1") as HTMLDivElement | null;
      const el2 = document.getElementById("ps1-extra-box-2") as HTMLDivElement | null;
      const sceneHost = document.getElementById("ps1-extra-box-1-scene-host") as HTMLDivElement | null;
      const previewHost = document.getElementById("ps1-extra-box-2-preview") as HTMLDivElement | null;
      console.log('[3DV] plot-sheet containers:', { el1: !!el1, el2: !!el2 });

      // Ensure the extra plot-sheet boxes are visible in case they were hidden
      // by inline styles. Do not alter ArcGIS internal hidden overlay nodes.
      if (el1) {
        el1.style.display = 'block';
        el1.style.visibility = 'visible';
      }
      if (el2) {
        el2.style.display = 'block';
        el2.style.visibility = 'visible';
      }

      if (!sceneHost && !previewHost) { console.log('[3DV] no plot-sheet containers found, aborting'); return; }

      const waitForContainerLayout = async (el: HTMLDivElement | null): Promise<void> => {
        if (!el) return;
        for (let i = 0; i < 20; i++) {
          const w = el.clientWidth;
          const h = el.clientHeight;
          if (w > 0 && h > 0) {
            return;
          }
          await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        }
      };

      await waitForContainerLayout(sceneHost);
      await waitForContainerLayout(previewHost);

      // Dispose any previous secondary plot-sheet SceneViews before creating new ones.
      for (const view of this.plotSheetSceneViews) {
        try {
          view.container = null;
          view.destroy?.();
        } catch {
          // ignore cleanup errors
        }
      }
      this.plotSheetSceneViews = [];
      this.plotSheetWebScene = undefined;

      // Move the main sceneView into the first box (reusing the app's single SceneView)
      try {
        if (sceneHost) {
          console.log('[3DV] attaching main SceneView to', sceneHost.id || sceneHost);
          await this.mapService.initializeScene(sceneHost);
          const sv: any = (this.mapService as any).getSceneView?.() ?? undefined;
          if (sv) {
            try {
              await sv.when();
              if (this.selectedParcel) {
                await this.mapService.zoomSceneToParcel(this.selectedParcel);
              } else {
                this.mapService.syncMapToScene();
              }
              console.log('[3DV] main SceneView ready and attached to', sceneHost.id || sceneHost);
            } catch (werr) { console.warn('[3DV] main SceneView.when() failed', werr); }
          }
        }

        // Render a second live 3D SceneView in the second box.
        if (previewHost) {
          previewHost.innerHTML = "";
          const webSceneId = await this.resolveWebSceneIdForPlotSheet();
          if (!webSceneId) {
            console.warn('[3DV] no WebScene id resolved for second plot-sheet scene');
          } else {
            const webScene2 = new WebScene({
              portalItem: {
                id: webSceneId,
                portal: { url: this.mapConfig.portalUrl },
              },
            });

            const sceneView2 = new SceneView({
              container: previewHost,
              map: webScene2,
              ui: { components: [] },
            });

            await sceneView2.when();

            const mainSv: any = (this.mapService as any).getSceneView?.() ?? undefined;
            if (mainSv?.viewpoint) {
              try {
                sceneView2.viewpoint = mainSv.viewpoint.clone();
              } catch {
                // ignore viewpoint clone failure
              }
            }

            this.plotSheetWebScene = webScene2;
            this.plotSheetSceneViews.push(sceneView2);
            console.log('[3DV] second SceneView ready and attached to', previewHost.id || previewHost);
          }
        }
      } catch (attachErr) {
        console.warn('[3DV] attach main SceneView failed', attachErr);
      }
    } catch (err) {
      console.warn('[3DV] initializePlotSheetScenes failed', err);
    }
  }

  private destroyPlotSheetScenes(): void {
    console.log('[3DV] destroyPlotSheetScenes() called — restoring main SceneView to right panel host');
    (async () => {
      try {
        for (const view of this.plotSheetSceneViews) {
          try {
            view.container = null;
            view.destroy?.();
          } catch {
            // ignore cleanup errors
          }
        }
        const host = this.sceneHost?.nativeElement;
        if (host) {
          try {
            await this.mapService.initializeScene(host);
            console.log('[3DV] restored main SceneView to scene host');
          } catch (err) {
            console.warn('[3DV] failed to restore main SceneView', err);
          }
        }
        // clear static snapshot if present
        const previewHost = document.getElementById("ps1-extra-box-2-preview");
        if (previewHost) previewHost.innerHTML = "";
      } finally {
        this.plotSheetSceneViews = [];
        this.plotSheetWebScene = undefined;
        console.log('[3DV] plotSheet scenes cleared (state reset)');
      }
    })();
  }

  // Public trigger for the template button to load interactive 3D into the plot-sheet boxes
  async loadPlotSheet3D(): Promise<void> {
    console.log('[3DV] loadPlotSheet3D() clicked');
    if (this.isPlotSheet3DLoading) { console.log('[3DV] already loading — abort'); return; }
    this.isPlotSheet3DLoading = true;
    this.refreshView();
    try {
      await this.initializePlotSheetScenes();
      console.log('[3DV] initializePlotSheetScenes returned');
    } catch (err) {
      console.warn('[3DV] loadPlotSheet3D failed', err);
    } finally {
      this.isPlotSheet3DLoading = false;
      this.refreshView();
      console.log('[3DV] loadPlotSheet3D() finished');
    }
  }

  toggleMoreDetails(): void {
    this.showMoreDetails = !this.showMoreDetails;
    const rows = this.plotDetailRows;
    console.log('[MoreDetail] showMoreDetails =', this.showMoreDetails);
    console.table(rows.map((row) => ({
      label: row.label,
      value: row.value,
      tone: row.tone,
      icon: row.icon,
    })));
    this.refreshView();
  }

  private refreshView(): void {
    this.cdr.detectChanges();
  }

  private groupArchiveFiles(files: ArchiveFile[]): ArchiveFileGroup[] {
    const grouped = files.reduce<Record<string, ArchiveFileGroup>>((acc, file) => {
      if (!acc[file.fileType]) {
        acc[file.fileType] = { type: file.fileType, files: [] };
      }
      acc[file.fileType].files.push(file);
      return acc;
    }, {});

    return Object.values(grouped);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) {
      return;
    }
    this.uploadedDocuments.push({
      fileName: file.name,
      savedName: file.name,
      filePath: "",
      description: "",
      uploading: false,
    });
    if (input) {
      input.value = "";
    }
    this.refreshView();
  }

  private async requestArcGisToken(): Promise<string | null> {
    const username = window.prompt('Enter ArcGIS portal username');
    if (!username) {
      return null;
    }

    const password = window.prompt('Enter ArcGIS portal password');
    if (!password) {
      return null;
    }

    const tokenUrl = `${this.mapConfig.portalUrl.replace(/\/$/, '')}/sharing/rest/generateToken`;
    const body = new URLSearchParams({
      username,
      password,
      client: 'requestip',
      f: 'json',
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const data = await response.json();
    if (!response.ok || data?.error) {
      const message = data?.error?.message || `HTTP ${response.status}`;
      throw new Error(`ArcGIS token request failed: ${message}`);
    }

    return data.token ?? null;
  }

  async onPanoramicView(): Promise<void> {
    console.log('Panoramic View button clicked');
    this.showPanoramicClickMessage(
      'The remote panoramic reference service is unavailable. Use the local 360 image.'
    );
  }

  async onPanoramicJson(): Promise<void> {
    console.log('Panoramic JSON button clicked');
    this.closeHeaderContextMenu();

    const webMap = this.mapService.getWebMap();
    const view = this.mapService.getMapView();
    if (!webMap || !view) {
      console.warn('[panoramicjson] Map is not ready yet.');
      return;
    }

    const existingLayer = webMap.findLayerById('panoramic-json-layer');
    if (existingLayer) {
      webMap.remove(existingLayer);
    }

    const geoJsonUrl = '/DQ_PanoramicImagesReferences.geojson';
    const layer = new GeoJSONLayer({
      url: geoJsonUrl,
      title: 'Panoramic JSON',
      id: 'panoramic-json-layer',
      visible: true,
      popupTemplate: {
        title: '{file_name}',
        content: [
          {
            type: 'fields',
            fieldInfos: [
              {
                fieldName: 'file_name',
                label: 'file_name',
              },
            ],
          },
        ],
      },
      renderer: {
        type: 'simple',
        symbol: {
          type: 'simple-marker',
          style: 'circle',
          color: [255, 0, 0, 0.9],
          size: '10px',
          outline: {
            color: [255, 255, 255, 0.9],
            width: 1,
          },
        },
      },
    });

    if (this.panoramicJsonClickHandle) {
      this.panoramicJsonClickHandle.remove?.();
      this.panoramicJsonClickHandle = undefined;
    }

    webMap.add(layer);
    this.panoramicJsonLayerVisible = true;
    try {
      await layer.when();
      const extent = layer.fullExtent;
      if (view.popup) {
        if (typeof (view.popup as any).autoOpenEnabled !== 'undefined') {
          (view.popup as any).autoOpenEnabled = false;
        }
        if (typeof (view.popup as any).close === 'function') {
          (view.popup as any).close();
        } else {
          console.warn('[panoramicjson] view.popup.close is not a function', view.popup);
        }
      }
      if (extent) {
        await view.goTo({ target: extent, zoom: 18 });
      }

      this.panoramicJsonClickHandle = view.on('click', async (event: any) => {
        console.log('[panoramicjson] map click', event.mapPoint && { x: event.mapPoint.x, y: event.mapPoint.y });
        let hit = await view.hitTest(event, { include: [layer] });
        console.log('[panoramicjson] primary hit results count', hit.results.length);

        if (!hit.results.length) {
          hit = await view.hitTest(event);
          console.log('[panoramicjson] fallback hit results count', hit.results.length);
        }

        const result = (hit.results as Array<{ graphic?: any }>).find((item) => {
          const graphicLayer = item.graphic?.layer;
          return graphicLayer === layer || graphicLayer?.id === 'panoramic-json-layer' || graphicLayer?.title === 'Panoramic JSON';
        });
        const graphic = result?.graphic;
        if (!graphic) {
          console.log('[panoramicjson] no panoramic graphic found in hit results', (hit.results as Array<{ graphic?: any }>).map((item) => item.graphic?.layer?.id));
          return;
        }

        const rawAttrs = graphic.attributes ?? {};
        console.log('[panoramicjson] clicked graphic attributes', rawAttrs);

        // Prefer direct URL attributes if present, then fall back to file name, mission/image-name, and objectid lookup.
        const fileName = rawAttrs.file_name ?? rawAttrs.fileName ?? rawAttrs.filename ?? rawAttrs.image_name ?? rawAttrs.imageName ?? rawAttrs.name ?? rawAttrs.NAME;
        const directUrl =
          rawAttrs.url ?? rawAttrs.image_url ?? rawAttrs.imageUrl ?? rawAttrs.panorama_url ?? rawAttrs.panoramaUrl ?? rawAttrs.full_url ?? rawAttrs.fullUrl ?? rawAttrs.path;
        const missionName = rawAttrs.missionName ?? rawAttrs.mission ?? rawAttrs.MISSION ?? rawAttrs.mission_name ?? rawAttrs.MissionName;
        const imageName = rawAttrs.imageName ?? rawAttrs.image_name ?? rawAttrs.image ?? rawAttrs.file_name ?? rawAttrs.filename ?? rawAttrs.name ?? rawAttrs.NAME;

        if (directUrl) {
          try {
            let url = String(directUrl || "").trim();
            if (url && !/^https?:\/\//i.test(url) && url.startsWith('/')) {
              url = `${this.mapConfig.portalUrl.replace(/\/$/, '')}${url}`;
            }
            console.log('[panoramicjson] opening direct panorama URL from attributes:', url);
            this.openPanoramaIframe(url);
            return;
          } catch (err) {
            console.warn('[panoramicjson] failed to open direct URL from attributes, will try fileName/objectid', err);
          }
        }

        if (fileName) {
          try {
            await this.openPanoramaByFileName(String(fileName));
            return;
          } catch (err) {
            console.warn('[panoramicjson] openPanoramaByFileName failed, trying mission/image fallback or objectid query', err);
          }
        }

        if (missionName && imageName) {
          console.log('[panoramicjson] opening panorama from mission/image attributes', { missionName, imageName });
          this.openPanoramaOverlay();
          this.streetViewService.getPanoramicImage(String(missionName), String(imageName)).subscribe({
            next: (blob) => {
              console.log('[panoramicjson] panorama blob received from mission/image fallback', { missionName, imageName, blobSize: blob?.size });
            },
            error: (err) => {
              console.error('[panoramicjson] mission/image fallback failed', err);
            },
          });
          return;
        }

        if (!fileName) {
          console.warn('[panoramicjson] clicked feature has no file name, direct URL, or mission/image attributes', rawAttrs);
        }

        const objectId = rawAttrs?.objectid ?? rawAttrs?.OBJECTID ?? rawAttrs?.ObjectId;
        if (objectId == null) {
          if (!fileName) {
            console.log('[panoramicjson] clicked graphic attrs without objectid or file_name, skipping');
          }
        } else {
          try {
            const query = layer.createQuery();
            query.where = `objectid = ${Number(objectId)}`;
            query.outFields = ['*'];
            query.returnGeometry = false;

            const featureSet = await layer.queryFeatures(query);
            const feature = featureSet.features?.[0];
            if (!feature) {
              console.log('[panoramicjson] no feature returned for objectid lookup:', objectId);
            } else {
              const attrs = feature.attributes ?? rawAttrs;
              console.log('[panoramicjson] resolved feature attributes via query:', attrs);
              const queryFileName = attrs.file_name ?? attrs.fileName ?? attrs.filename;
              if (queryFileName && queryFileName !== fileName) {
                console.log('[panoramicjson] opening alternate file_name from query', queryFileName);
                await this.openPanoramaByFileName(queryFileName);
              }
            }
          } catch (err) {
            console.error('[panoramicjson] objectid lookup failed', err);
          }
        }

        const attrs = rawAttrs;
        const content = Object.entries(attrs)
          .map(([key, value]) => `<b>${key}</b>: ${value}`)
          .join('<br>');

        if (!directUrl && !fileName && !(missionName && imageName) && objectId == null) {
          this.showPanoramicClickMessage('Could not resolve a panorama file for this point. Please verify point metadata.');
        }
      });

      console.log('[panoramicjson] Panoramic JSON layer added to map.');
    } catch (err) {
      console.error('[panoramicjson] Failed to load or zoom to GeoJSON layer.', err);
    }
  }

  
}
