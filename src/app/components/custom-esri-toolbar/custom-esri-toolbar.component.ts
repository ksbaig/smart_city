import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, EventEmitter, Input, NgZone, OnDestroy, Output } from "@angular/core";
import MapView from "@arcgis/core/views/MapView";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Sketch from "@arcgis/core/widgets/Sketch";
import Viewpoint from "@arcgis/core/Viewpoint";
import Polyline from "@arcgis/core/geometry/Polyline";
import Polygon from "@arcgis/core/geometry/Polygon";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";

@Component({
  selector: "custom-esri-toolbar",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./custom-esri-toolbar.component.html",
  styleUrls: ["./custom-esri-toolbar.component.scss"],
})
export class CustomEsriToolbarComponent implements OnDestroy {
  private readonly fixedLeftOffset = 24;
    @Output() openPlotSheetDialog = new EventEmitter<void>();
    openPlotSheet(): void {
      this.openPlotSheetDialog.emit();
      this.setActive("plotSheet");
    }
  private _view?: MapView;

  constructor(private readonly zone: NgZone, private readonly cdr: ChangeDetectorRef) {}
  private initialViewpoint?: Viewpoint;
  private drawGraphicsLayer?: GraphicsLayer;
  private sketchWidget?: Sketch;
  private mapContextMenuListener?: (event: MouseEvent) => void;

  drawTypeMenuOpen = false;
  selectedDrawType: "point" | "polyline" | "polygon" | "rectangle" = "polygon";
  selectedMeasurementDrawType: "polyline" | "polygon" | "rectangle" = "polyline";
  measurementTypeMenuOpen = false;
  currentDrawMode: "draw" | "measure" | null = null;
  measurementActive = false;
  selectedDistanceUnit: "meters" | "kilometers" | "feet" | "miles" = "meters";
  measurementResult: string | null = null;
  measurementContextMenuOpen = false;
  measurementContextMenuLeft = 0;
  measurementContextMenuTop = 0;
  private measurementMenuDragging = false;
  private measurementMenuDragStart = { x: 0, y: 0 };
  private measurementMenuPointerStart = { x: 0, y: 0 };
  private lastMeasurementGeometry: Polyline | Polygon | null = null;

  readonly distanceUnits = [
    { key: "meters", label: "Meters" },
    { key: "kilometers", label: "Kilometers" },
    { key: "feet", label: "Feet" },
    { key: "miles", label: "Miles" },
  ];

  @Input() set view(value: MapView | undefined) {
    this._view = value;
    if (!value) {
      return;
    }

    this.ensureMapContextMenuListener();
    if (this.initialViewpoint) {
      return;
    }

    value.when(() => {
      if (!this.initialViewpoint && value.viewpoint) {
        try {
          this.initialViewpoint = value.viewpoint.clone();
        } catch {
          this.initialViewpoint = undefined;
        }
      }
    }).catch(() => {
      if (!this.initialViewpoint && value.viewpoint) {
        try {
          this.initialViewpoint = value.viewpoint.clone();
        } catch {
          this.initialViewpoint = undefined;
        }
      }
    });
  }
  get view(): MapView | undefined {
    return this._view;
  }

  @Output() toggleLayer = new EventEmitter<void>();
  @Output() startMeasurement = new EventEmitter<void>();
  @Output() startDrawPolygon = new EventEmitter<void>();
  @Output() clearGraphics = new EventEmitter<void>();
  @Output() openGeoAISearch = new EventEmitter<void>();
  @Output() openLegend = new EventEmitter<void>();

  activeButton: string | null = null;
  collapsed = true;
  dragging = false;
  position = { left: this.fixedLeftOffset, top: 415 };
  private dragStart = { y: 0 };
  private pointerStart = { y: 0 };

  zoomIn(): void {
    const view = this.view;
    if (!view) {
      console.warn("Zoom In ignored: view not ready.");
      return;
    }
    const scale = view.scale ?? 10000;
    view.goTo({ scale: scale / 2 }).catch(() => undefined);
    this.setActive("zoomIn");
  }

  zoomOut(): void {
    const view = this.view;
    if (!view) {
      console.warn("Zoom Out ignored: view not ready.");
      return;
    }
    const scale = view.scale ?? 10000;
    view.goTo({ scale: scale * 2 }).catch(() => undefined);
    this.setActive("zoomOut");
  }

  toggleMeasurementTypeMenu(): void {
    this.measurementTypeMenuOpen = !this.measurementTypeMenuOpen;
    this.drawTypeMenuOpen = false;
    this.setActive("measure");
  }

  selectMeasurementType(type: "polyline" | "polygon" | "rectangle"): void {
    this.selectedMeasurementDrawType = type;
    this.measurementTypeMenuOpen = false;
    this.startMeasurementAction(type);
  }

  goHome(): void {
    const view = this.view;
    if (!view) {
      console.warn("Home ignored: view not ready.");
      return;
    }

    if (this.initialViewpoint) {
      view.goTo(this.initialViewpoint).catch(() => undefined);
    } else {
      const target = view.extent ?? view.center;
      if (!target) {
        console.warn("Home ignored: no target available.");
        return;
      }
      view.goTo({ target, zoom: view.zoom ?? 12 }).catch(() => undefined);
    }

    this.setActive("home");
  }

  locateUser(): void {
    const view = this.view;
    if (!view) {
      console.warn("Locate ignored: view not ready.");
      return;
    }
    if (!navigator.geolocation) {
      console.warn("Locate ignored: geolocation unavailable.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        view
          .goTo({ center: [position.coords.longitude, position.coords.latitude], zoom: 15 })
          .catch(() => undefined);
        this.setActive("locate");
      },
      (error) => {
        console.warn("Locate failed:", error);
      }
    );
  }

  toggleLayerAction(): void {
    this.toggleLayer.emit();
    this.setActive("layerToggle");
  }

  toggleDrawTypeMenu(): void {
    this.drawTypeMenuOpen = !this.drawTypeMenuOpen;
    this.setActive("draw");
  }

  openLegendAction(): void {
    this.openLegend.emit();
    this.setActive("legend");
  }

  selectDrawType(type: "point" | "polyline" | "polygon"): void {
    this.selectedDrawType = type;
    this.drawTypeMenuOpen = false;
    this.startDrawAction();
  }

  private startDrawAction(): void {
    this.currentDrawMode = "draw";
    this.startSketchAction(this.selectedDrawType);
    this.startDrawPolygon.emit();
    this.setActive("draw");
  }

  private startSketchAction(drawType: "point" | "polyline" | "polygon" | "rectangle"): void {
    const view = this.view;
    if (!view) {
      console.warn("Draw ignored: view not ready.");
      return;
    }

    if (!this.drawGraphicsLayer) {
      const map = view.map;
      if (!map) {
        console.warn("Draw ignored: view map is not ready.");
        return;
      }
      this.drawGraphicsLayer = new GraphicsLayer({ title: "Drawn Graphics" });
      map.add(this.drawGraphicsLayer);
    }

    if (!this.sketchWidget) {
      this.sketchWidget = new Sketch({
        view,
        layer: this.drawGraphicsLayer,
        creationMode: "single",
      });
      this.sketchWidget.on("create", (event: any) => this.onSketchCreate(event));
      this.sketchWidget.on("update", (event: any) => this.onSketchUpdate(event));
    }

    this.sketchWidget.create(drawType);
  }

  startMeasurementAction(type: "polyline" | "polygon" | "rectangle" = "polyline"): void {
    const view = this.view;
    if (!view) {
      console.warn("Measure ignored: view not ready.");
      return;
    }

    this.selectedMeasurementDrawType = type;
    this.clearMeasurementGraphics();
    this.currentDrawMode = "measure";
    this.measurementActive = true;
    this.measurementResult = null;
    this.measurementContextMenuOpen = false;
    this.startSketchAction(type);
    this.startMeasurement.emit();
    this.setActive("measure");
  }

  private clearMeasurementGraphics(): void {
    this.drawGraphicsLayer?.removeAll();
    this.measurementResult = null;
    this.measurementActive = false;
    this.measurementContextMenuOpen = false;
    this.currentDrawMode = null;
    this.lastMeasurementGeometry = null;
  }

  clearGraphicsAction(): void {
    this.clearGraphics.emit();
    this.drawGraphicsLayer?.removeAll();
    this.measurementResult = null;
    this.measurementActive = false;
    this.measurementContextMenuOpen = false;
    this.currentDrawMode = null;
    this.setActive("clear");
  }

  toggleFullscreen(): void {
    const element = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
    Promise.resolve(element).catch(() => undefined);
    this.setActive("fullscreen");
  }

  private ensureMapContextMenuListener(): void {
    if (this.mapContextMenuListener || !this.view) {
      return;
    }
    const container = this.view.container as HTMLElement | null;
    if (!container) {
      return;
    }
    this.mapContextMenuListener = (event: MouseEvent) => this.onMapContextMenu(event);
    container.addEventListener("contextmenu", this.mapContextMenuListener);
  }

  private onMapContextMenu(event: MouseEvent): void {
    if (!this.measurementActive || this.currentDrawMode !== "measure") {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    this.measurementContextMenuLeft = Math.min(window.innerWidth - 260, Math.max(12, event.clientX));
    this.measurementContextMenuTop = Math.min(window.innerHeight - 120, Math.max(12, event.clientY));
    this.measurementContextMenuOpen = true;
  }

  onMeasurementMenuDragStart(event: MouseEvent): void {
    if (!this.measurementContextMenuOpen) {
      return;
    }
    event.preventDefault();
    this.measurementMenuDragging = true;
    this.measurementMenuPointerStart = { x: event.clientX, y: event.clientY };
    this.measurementMenuDragStart = { x: this.measurementContextMenuLeft, y: this.measurementContextMenuTop };

    const move = (moveEvent: MouseEvent) => this.onMeasurementMenuDragMove(moveEvent);
    const up = () => this.onMeasurementMenuDragEnd(move, up);

    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  }

  private onMeasurementMenuDragMove(event: MouseEvent): void {
    if (!this.measurementMenuDragging) {
      return;
    }
    event.preventDefault();

    const dx = event.clientX - this.measurementMenuPointerStart.x;
    const dy = event.clientY - this.measurementMenuPointerStart.y;
    this.measurementContextMenuLeft = Math.max(8, Math.min(window.innerWidth - 260, this.measurementMenuDragStart.x + dx));
    this.measurementContextMenuTop = Math.max(8, Math.min(window.innerHeight - 120, this.measurementMenuDragStart.y + dy));
  }

  private onMeasurementMenuDragEnd(move: (event: MouseEvent) => void, up: () => void): void {
    this.measurementMenuDragging = false;
    document.removeEventListener("mousemove", move);
    document.removeEventListener("mouseup", up);
  }

  finishMeasurement(): void {
    this.measurementContextMenuOpen = false;
    if (this.sketchWidget) {
      this.sketchWidget.complete();
    }
    this.zone.run(() => this.cdr.detectChanges());
  }

  changeDistanceUnit(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    if (!target) {
      return;
    }
    this.selectedDistanceUnit = target.value as "meters" | "kilometers" | "feet" | "miles";
    if (this.lastMeasurementGeometry) {
      this.updateMeasurementResult(this.lastMeasurementGeometry);
    }
  }

  continueMeasurement(): void {
    this.measurementContextMenuOpen = false;
  }

  private onSketchCreate(event: any): void {
    if (this.currentDrawMode !== "measure") {
      return;
    }

    this.zone.run(() => {
      const geometry = event.graphic?.geometry as Polyline | Polygon | null;
      if (geometry) {
        this.lastMeasurementGeometry = geometry;
        this.updateMeasurementResult(geometry);
      }

      if (event.state === "complete") {
        // Keep the measurement session active so later edits still update the label.
        this.currentDrawMode = "measure";
      }
    });
  }

  private onSketchUpdate(event: any): void {
    if (this.currentDrawMode !== "measure") {
      return;
    }

    this.zone.run(() => {
      const geometry = event.graphics?.[0]?.geometry as Polyline | Polygon | null;
      if (geometry) {
        this.lastMeasurementGeometry = geometry;
        this.updateMeasurementResult(geometry);
      }

      if (event.state === "complete") {
        // Keep the measurement session active so later edits still update the label.
        this.currentDrawMode = "measure";
      }
    });
  }

  refreshMeasurement(): void {
    if (!this.lastMeasurementGeometry) {
      return;
    }
    this.updateMeasurementResult(this.lastMeasurementGeometry);

    if (!this.measurementContextMenuOpen) {
      this.measurementContextMenuLeft = Math.min(window.innerWidth - 260, Math.max(12, window.innerWidth / 2 - 130));
      this.measurementContextMenuTop = 140;
      this.measurementContextMenuOpen = true;
    }
  }

  private updateMeasurementResult(geometry: Polyline | Polygon): void {
    if (geometry.type === "polygon") {
      const areaUnit = this.getAreaUnitForSelectedDistance();
      const area = geometryEngine.geodesicArea(geometry, areaUnit as any);
      if (area == null || Number.isNaN(area)) {
        this.measurementResult = null;
        this.zone.run(() => this.cdr.detectChanges());
        return;
      }

      const unitLabel = this.getAreaLabelForSelectedDistance();
      this.measurementResult = `${area.toFixed(2)} ${unitLabel}`;
    } else {
      const distance = geometryEngine.geodesicLength(geometry, this.selectedDistanceUnit as any);
      if (distance == null || Number.isNaN(distance)) {
        this.measurementResult = null;
        this.zone.run(() => this.cdr.detectChanges());
        return;
      }

      const unitLabel = this.distanceUnits.find((u) => u.key === this.selectedDistanceUnit)?.label ?? this.selectedDistanceUnit;
      this.measurementResult = `${distance.toFixed(2)} ${unitLabel}`;
    }

    this.zone.run(() => {
      this.cdr.detectChanges();
      window.requestAnimationFrame(() => this.cdr.detectChanges());
    });
  }

  private getAreaUnitForSelectedDistance(): string {
    switch (this.selectedDistanceUnit) {
      case "meters":
        return "square-meters";
      case "kilometers":
        return "square-kilometers";
      case "feet":
        return "square-feet";
      case "miles":
        return "square-miles";
    }
  }

  private getAreaLabelForSelectedDistance(): string {
    switch (this.selectedDistanceUnit) {
      case "meters":
        return "Sq Meters";
      case "kilometers":
        return "Sq Kilometers";
      case "feet":
        return "Sq Feet";
      case "miles":
        return "Sq Miles";
    }
  }

  openGeoAISearchAction(): void {
    this.openGeoAISearch.emit();
    this.setActive("aiSearch");
  }

  private setActive(name: string): void {
    this.activeButton = name;
    window.setTimeout(() => {
      if (this.activeButton === name) {
        this.activeButton = null;
      }
    }, 900);
  }

  toggleCollapsed(): void {
    this.collapsed = !this.collapsed;
  }

  onDragStart(event: MouseEvent | TouchEvent): void {
    event.preventDefault();
    this.dragging = true;

    const clientY = this.getClientY(event);
    this.pointerStart = { y: clientY };
    this.dragStart = { y: this.position.top };

    const move = (moveEvent: MouseEvent | TouchEvent) => this.onDragMove(moveEvent);
    const up = () => this.onDragEnd(move, up);

    document.addEventListener("mousemove", move);
    document.addEventListener("touchmove", move, { passive: false });
    document.addEventListener("mouseup", up);
    document.addEventListener("touchend", up);
  }

  private onDragMove(event: MouseEvent | TouchEvent): void {
    if (!this.dragging) {
      return;
    }
    event.preventDefault();

    const clientY = this.getClientY(event);
    const deltaY = clientY - this.pointerStart.y;
    this.position.top = Math.max(8, Math.min(window.innerHeight - 80, this.dragStart.y + deltaY));
    this.position.left = this.fixedLeftOffset;
  }

  private onDragEnd(move: (event: MouseEvent | TouchEvent) => void, up: () => void): void {
    this.dragging = false;
    document.removeEventListener("mousemove", move);
    document.removeEventListener("touchmove", move);
    document.removeEventListener("mouseup", up);
    document.removeEventListener("touchend", up);
  }

  ngOnDestroy(): void {
    if (this.view) {
      if (this.sketchWidget) {
        this.view.ui.remove(this.sketchWidget);
      }
      if (this.mapContextMenuListener) {
        const container = this.view.container as HTMLElement | null;
        if (container) {
          container.removeEventListener("contextmenu", this.mapContextMenuListener);
        }
      }
    }
    this.sketchWidget = undefined;
    this.mapContextMenuListener = undefined;
  }

  private getClientX(event: MouseEvent | TouchEvent): number {
    return event instanceof MouseEvent ? event.clientX : event.touches[0]?.clientX ?? 0;
  }

  private getClientY(event: MouseEvent | TouchEvent): number {
    return event instanceof MouseEvent ? event.clientY : event.touches[0]?.clientY ?? 0;
  }
}
