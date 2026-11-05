import { inject, Injectable } from "@angular/core";
import Graphic from "@arcgis/core/Graphic";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Point from "@arcgis/core/geometry/Point";
import Polygon from "@arcgis/core/geometry/Polygon";
import WebMap from "@arcgis/core/WebMap";
import MapView from "@arcgis/core/views/MapView";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import { Subject } from 'rxjs';
import { Parcel } from "../../shared/models/parcel.model";
import { PanoramicPoint } from "../../shared/models/panoramic-point.model";
import { StreetViewService } from "./street-view.service";

@Injectable({ providedIn: "root" })
export class PanoramicPointsService {
  private panoramicLayer?: GraphicsLayer;
  private clickListener: any | null = null;
  private readonly streetViewService = inject(StreetViewService);
  private readonly panoramicPointClickSubject = new Subject<{ missionName: string; imageName: string }>();
  readonly panoramicPointClick$ = this.panoramicPointClickSubject.asObservable();
  private readonly pointSymbol = new SimpleMarkerSymbol({
    style: "circle",
    color: [0, 173, 255, 0.9],
    outline: {
      color: [255, 255, 255, 0.9],
      width: 1.5,
    },
    size: 12,
  });

  showPointsForParcel(parcel: Parcel, map: WebMap, view: MapView): void {
    if (!parcel || !parcel.geometry) {
      console.warn("[panoramic points] No selected parcel geometry available.");
      return;
    }

    const polygon = this.toPolygon(parcel.geometry);
    if (!polygon) {
      console.warn("[panoramic points] Selected parcel geometry is not a polygon.");
      return;
    }

    const graphics = this.createPanoramicPointGraphics(polygon, parcel);
    if (!graphics.length) {
      console.warn("[panoramic points] Could not generate any panoramic point graphics.");
      return;
    }

    this.ensureLayer(map);
    this.panoramicLayer?.removeAll();
    this.panoramicLayer?.addMany(graphics);

    if (this.clickListener) {
      try { this.clickListener.remove?.(); } catch {}
      this.clickListener = null;
    }

    // Wait for the layer to be ready before attaching the click handler to avoid race conditions
    const layer = this.panoramicLayer;
    if (layer) {
      try {
        layer.when().then(() => {
            try {
              const graphicsArray = layer.graphics?.toArray?.() ?? [];
              console.log('[panoramic points] layer.when resolved; graphics count ->', graphicsArray.length);
              const sample = graphicsArray.slice(0, 6).map((g: any) => g.attributes ?? {});
              console.log('[panoramic points] sample graphic attributes ->', sample);
          } catch (err) {
            console.warn('[panoramic points] sample attributes logging failed', err);
          }
          // attach click handler now that the layer is ready
          this.attachPointClickHandler(view);
        }).catch((err) => {
          console.warn('[panoramic points] layer.when() failed', err);
          // fallback: attach handler anyway
          this.attachPointClickHandler(view);
        });
      } catch (err) {
        console.warn('[panoramic points] error waiting for layer readiness', err);
        this.attachPointClickHandler(view);
      }
    } else {
      this.attachPointClickHandler(view);
    }

    if (view && graphics[0]?.geometry) {
      view.goTo({ target: graphics[0].geometry, zoom: 18 }).catch(() => undefined);
    }
  }

  clearPoints(): void {
    this.panoramicLayer?.removeAll();
  }

  /**
   * Toggle visibility of the single panoramic points layer.
   * If the layer does not yet exist this is a no-op (the layer
   * will be created when `showPointsForParcel` is next called).
   */
  setLayerVisibility(visible: boolean): void {
    if (!this.panoramicLayer) {
      return;
    }
    try {
      this.panoramicLayer.visible = !!visible;
      console.log('[panoramic points] layer visibility set ->', this.panoramicLayer.visible);
    } catch (err) {
      console.warn('[panoramic points] failed to set layer visibility', err);
    }
  }

  getLayerVisibility(): boolean {
    return !!this.panoramicLayer?.visible;
  }

  private attachPointClickHandler(view: MapView): void {
    if (!this.panoramicLayer || this.clickListener) {
      return;
    }

    this.clickListener = view.on("click", async (event: any) => {
      const hit = await view.hitTest(event, { include: [this.panoramicLayer!] });
      const graphic = (hit.results as Array<{ graphic?: Graphic }>)[0]?.graphic;
      console.log('[panoramic points] click handler invoked; hit results ->', (hit.results as Array<any>).map(r=> ({ layerId: r.graphic?.layer?.id, layerTitle: r.graphic?.layer?.title })));
      console.log('[panoramic points] clicked graphic raw attributes ->', graphic?.attributes ?? null);
      if (!graphic) {
        return;
      }

      const missionName =
        graphic.attributes?.missionName ||
        graphic.attributes?.mission ||
        graphic.attributes?.MISSION ||
        "unknown";
      const imageName =
        graphic.attributes?.imageName ||
        graphic.attributes?.file_name ||
        graphic.attributes?.fileName ||
        "unknown";

      const requestUrl = `${this.streetViewService.getApiUrl()}?missionName=${encodeURIComponent(missionName)}&imageName=${encodeURIComponent(imageName)}`;
      console.log("[panoramic point click] Request URL:", requestUrl);
      console.log("[panoramic point click] API query parameters:");
      console.log(`  missionName: ${missionName}`);
      console.log(`  imageName: ${imageName}`);

      this.panoramicPointClickSubject.next({ missionName, imageName });

      this.streetViewService.getPanoramicImage(missionName, imageName).subscribe({
        next: (blob) => {
          console.log("[panoramic point click] Panorama API request succeeded.");
          console.log(`  blob size: ${blob?.size ?? 0} bytes`);
        },
        error: (err) => {
          console.error("[panoramic point click] Panorama API request failed", err);
        },
      });
    });
  }

  private ensureLayer(map: WebMap): void {
    if (this.panoramicLayer) {
      return;
    }

    this.panoramicLayer = new GraphicsLayer({
      title: "Panoramic Points",
      listMode: "show",
      visible: true,
    });

    map.add(this.panoramicLayer);
  }

  private createPanoramicPointGraphics(polygon: Polygon, parcel?: Parcel): Graphic[] {
    const buffered = geometryEngine.geodesicBuffer(polygon, 5, "meters") as Polygon;
    if (!buffered?.rings?.length) {
      return [];
    }

    const ring = buffered.rings[0] ?? [];
    if (!ring.length) {
      return [];
    }

    const parcelBase = parcel?.displayName
      ? parcel.displayName.replace(/[\s\W]+/g, "_").toLowerCase()
      : String(parcel?.id ?? "unknown");

    const step = Math.max(1, Math.floor(ring.length / 8));
    const points: PanoramicPoint[] = ring
      .filter((_, index) => index % step === 0)
      .map((coords, index) => ({
        id: `panoramic-${index}`,
        label: `Panoramic Point ${index + 1}`,
        geometry: new Point({
          x: coords[0],
          y: coords[1],
          spatialReference: buffered.spatialReference,
        }),
        missionName: `mission_${parcelBase}`,
        imageName: `pano_${(index + 1).toString().padStart(6, "0")}`,
      }));

    return points.map((point) =>
      new Graphic({
        geometry: point.geometry,
        symbol: this.pointSymbol,
        attributes: {
          id: point.id,
          label: point.label,
          missionName: point.missionName,
          imageName: point.imageName,
          file_name: point.imageName,
        },
      })
    );
  }

  private toPolygon(geometry: unknown): Polygon | undefined {
    if (!geometry) {
      return undefined;
    }

    const geom: any = geometry;
    if (geom.type === "Polygon" && geom.rings) {
      return geom as Polygon;
    }

    if (geom.type === "Polygon" && Array.isArray(geom.coordinates)) {
      return new Polygon({
        rings: geom.coordinates as number[][][],
        spatialReference: { wkid: 4326 },
      });
    }

    if (geom.type === "MultiPolygon" && Array.isArray(geom.coordinates)) {
      return new Polygon({
        rings: (geom.coordinates as number[][][][]).flat(),
        spatialReference: { wkid: 4326 },
      });
    }

    return undefined;
  }
}
