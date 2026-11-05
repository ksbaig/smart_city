import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { Parcel } from "../../shared/models/parcel.model";
import { PlotHeaderComponent } from "./plot-header.component";

@Component({
  selector: "app-plot-print",
  standalone: true,
  imports: [CommonModule, PlotHeaderComponent],
  template: `
    <div class="plot-print-shell">
      <app-plot-header [plotData]="plotData" [logoPath]="logoPath"></app-plot-header>

      <div class="plot-print-body">
        <aside class="ppi-side-panel">
          <section class="ppi-card ppi-id-card">
            <div class="ppi-card-title">UNIQUE PLOT ID</div>
            <div class="ppi-card-content">{{ uniquePlotId || plotId || '-' }}</div>
          </section>

          <section class="ppi-card ppi-box-small">
            <div class="ppi-card-title">MASTERPLAN PLOT NO</div>
            <div class="ppi-card-content">{{ masterplanPlotNo || '-' }}</div>
          </section>

          <section class="ppi-card ppi-box-small">
            <div class="ppi-card-title">DATE</div>
            <div class="ppi-card-content">{{ dateString }}</div>
          </section>

          <section class="ppi-card ppi-box-map">
            <div class="ppi-card-title">LOCATION PLAN</div>
            <div class="ppi-map-placeholder">
              <svg *ngIf="plotLocationPoints" viewBox="0 0 320 220" class="ppi-location-svg">
                <rect x="0" y="0" width="320" height="220" fill="#f9fdfc" />
                <polygon
                  [attr.points]="plotLocationPoints"
                  fill="rgba(49, 143, 105, 0.18)"
                  stroke="#1f6e55"
                  stroke-width="2"
                />
              </svg>
              <div *ngIf="!plotLocationPoints">No parcel shape available</div>
            </div>
          </section>

          <section class="ppi-card ppi-box-coords">
            <div class="ppi-card-title">PLOT COORDINATES TABLE</div>
            <div class="ppi-coords-table-wrap">
              <table class="ppi-coords-table">
                <thead>
                  <tr>
                    <th>POINT</th>
                    <th>EAST</th>
                    <th>NORTH</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let row of plotCoordinates">
                    <td>{{ row.idx }}</td>
                    <td>{{ row.east }}</td>
                    <td>{{ row.north }}</td>
                  </tr>
                  <tr *ngIf="!plotCoordinates.length">
                    <td colspan="3">No parcel coordinates available</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="ppi-card ppi-box-small">
            <div class="ppi-card-title">CONTRACTUAL DETAILS</div>
            <div class="ppi-detail-row"><span class="label">USERNAME</span><span>{{ contractUsername }}</span></div>
            <div class="ppi-detail-row"><span class="label">DEVELOPER</span><span>{{ contractDeveloper }}</span></div>
            <div class="ppi-detail-row"><span class="label">OWNERSHIP TYPE</span><span>{{ ownershipType }}</span></div>
            <div class="ppi-detail-row"><span class="label">CONTRACT STATUS</span><span>{{ contractStatus }}</span></div>
          </section>

          <section class="ppi-card ppi-box-notes">
            <div class="ppi-card-title">NOTES</div>
            <div class="ppi-notes-grid"></div>
          </section>
        </aside>

        <div class="ppi-main-panel">
          <section class="ppi-card ppi-big-map-card">
            <div class="ppi-card-title">PLOT SITE PLAN</div>
            <div class="ppi-big-map-placeholder">
                <svg *ngIf="plotSitePoints" viewBox="0 0 1120 560" class="ppi-location-svg">
                  <defs>
                    <pattern id="hatch" patternUnits="userSpaceOnUse" width="8" height="8">
                      <path d="M-1,1 l2,-2 M0,8 l8,-8 M7,9 l2,-2" stroke="rgba(0,0,0,0.06)" stroke-width="1"/>
                    </pattern>
                  </defs>
                  <rect x="0" y="0" width="1120" height="560" fill="#f9fdfc" />
                  <!-- outer solid site polygon -->
                  <polygon
                    [attr.points]="plotSitePoints"
                    class="ppi-site-outline"
                  />
                  <!-- inner dashed polygon (simulated setback) -->
                  <polygon
                    [attr.points]="plotSitePoints"
                    class="ppi-site-inner-dashed"
                  />
                  <!-- hatch fill overlay -->
                  <polygon
                    [attr.points]="plotSitePoints"
                    fill="url(#hatch)"
                    opacity="0.6"
                  />
                  <!-- centered label -->
                  <text *ngIf="plotSiteCentroid" [attr.x]="plotSiteCentroid.x" [attr.y]="plotSiteCentroid.y" class="ppi-site-label">
                    {{ buildingType || 'RESIDENTIAL' }}
                  </text>
                </svg>
                <div *ngIf="!plotSitePoints">Parcel preview unavailable</div>
              </div>
          </section>

          <section class="ppi-card ppi-details-table">
            <div class="ppi-card-title">PLOT DETAILS & GUIDELINES</div>
            <div class="ppi-details-grid">
              <div class="ppi-grid-head">NO. OF PARKING SPACES</div>
              <div class="ppi-grid-head">PARKING TYPE</div>
              <div class="ppi-grid-head">MAX HEIGHT</div>
              <div class="ppi-grid-head">MAX NO. OF FLOORS</div>
              <div class="ppi-grid-head">PLOT COVERAGE</div>
              <div class="ppi-grid-head">FAR</div>
              <div class="ppi-grid-head">GFA</div>
              <div class="ppi-grid-head">PLOT AREA</div>
              <div class="ppi-grid-head">BUILDING TYPE</div>
              <div class="ppi-grid-head">SUB LANDUSE</div>
              <div class="ppi-grid-head">LAND USE</div>
              <div class="ppi-grid-row">{{ plotArea }}</div>
              <div class="ppi-grid-row">{{ buildingType }}</div>
              <div class="ppi-grid-row">{{ subLanduse }}</div>
              <div class="ppi-grid-row">{{ landUse }}</div>
            </div>
          </section>
        </div>

        <aside class="ppi-vertical-label">PERMITTED / EXISTING USE</aside>
      </div>
    </div>
  `,
  styles: [
    `
      .plot-print-shell {
        width: 1600px;
        min-height: 1130px;
        border: 1px solid #c4d3d1;
        background: #fff;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 18px rgba(0, 0, 0, 0.08);
      }
      .plot-print-header {
        display: grid;
        grid-template-columns: minmax(160px, 1.3fr) minmax(260px, 2fr) minmax(200px, 1.2fr);
        gap: 10px;
        align-items: center;
        background: #1b7761;
        color: #ffffff;
        /* fixed header height restored to previous value */
        height: 80px;
        min-height: 80px;
        padding: 6px 12px;
        margin-top: 0;
        border-top-left-radius: 12px;
        border-top-right-radius: 12px;
        box-sizing: border-box;
      }

      .ppi-header-left,
      .ppi-header-center,
      .ppi-header-right {
        display: grid;
        gap: 6px;
      }

      /* Position left header content at the top of the header */
      .ppi-header-left {
        align-self: start;
        padding-top: 2px;
      }

      .ppi-header-office {
        margin-bottom: 4px;
      }

      .ppi-header-title {
        margin-top: 0;
        line-height: 1.0;
      }

      .ppi-header-office {
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 1px;
        opacity: 0.85;
        text-transform: uppercase;
      }

      .ppi-header-title {
        font-size: 18px;
        font-weight: 900;
        letter-spacing: 1px;
        text-transform: uppercase;
        line-height: 1.05;
      }

      .ppi-header-center {
        grid-template-rows: auto auto;
        transform: translateY(-10px) scaleY(0.5);
        transform-origin: top;
        /* reduce spacing inside center to match scaled size */
        gap: 4px;
      }

      .ppi-header-block {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 14px;
        padding: 10px 12px;
        font-size: 35px; /* Updated size */
        height: 37px; /* Updated height */
        width: 700px; /* Updated width */
      }

      .ppi-header-field-label {
        display: block;
        font-size: 10px;
        letter-spacing: 1px;
        text-transform: uppercase;
        opacity: 0.82;
        margin-bottom: 6px;
      }

      .ppi-header-field-value {
        font-size: 18px;
        font-weight: 900;
        letter-spacing: 1px;
      }

      /* Compact single-line plot number block */
      .ppi-header-plotno {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 10px;
        border-radius: 10px;
        min-width: 120px;
        max-width: 220px;
      }

      .ppi-header-plotno .ppi-header-field-label {
        display: inline-block;
        margin-bottom: 0;
        font-size: 9px;
        opacity: 0.9;
      }

      .ppi-header-plotno .ppi-header-field-value {
        font-size: 16px;
        font-weight: 900;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .ppi-header-gis .ppi-header-field-value {
        font-size: 14px;
      }

      .ppi-gis-ref-boxes {
        display: grid;
        grid-template-columns: repeat(10, minmax(26px, 1fr));
        gap: 6px;
      }

      .ppi-gis-box {
        min-height: 30px;
        border: 1px solid rgba(255, 255, 255, 0.24);
        border-radius: 8px;
        display: grid;
        place-items: center;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.85px;
      }

      .ppi-header-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
      }

      /* Compact the right header row to sit at ~50% height visually */
      .ppi-header-row {
        transform: translateY(-6px) scaleY(0.5);
        transform-origin: top;
        gap: 8px;
      }

      .ppi-header-row .ppi-header-block {
        padding: 6px 8px;
        border-radius: 10px;
        font-size: 35px; /* Updated size */
        height: 37px; /* Updated height */
        width: 700px; /* Updated width */
      }

      .ppi-header-row .ppi-header-field-label {
        font-size: 9px;
        margin-bottom: 4px;
      }

      .ppi-header-row .ppi-header-field-value {
        font-size: 14px;
      }

      .ppi-header-logos {
        display: none !important;
      }

      .ppi-logo-small {
        width: 96px;
        height: 60px;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.14);
        display: grid;
        place-items: center;
        font-size: 12px;
        line-height: 1.2;
        text-transform: uppercase;
      }
      .plot-print-body {
        display: grid;
        grid-template-columns: 320px 1fr 60px;
        gap: 12px;
        padding: 16px;
        background: #eef4f3;
      }
      .ppi-side-panel,
      .ppi-main-panel {
        display: grid;
        gap: 12px;
      }
      .ppi-side-panel {
        grid-auto-rows: min-content;
      }
      .ppi-card {
        background: #ffffff;
        border: 1px solid #cbd7d4;
        border-radius: 12px;
        overflow: hidden;
      }
      .ppi-card-title {
        background: #1b7761;
        color: #f8fcfb;
        font-size: 11px;
        letter-spacing: 0.6px;
        font-weight: 800;
        padding: 10px 12px;
      }
      .ppi-card-content,
      .ppi-detail-row,
      .ppi-coords-row {
        padding: 10px 12px;
        font-size: 12px;
        color: #1f3a37;
      }
      .ppi-id-card .ppi-card-content,
      .ppi-box-small .ppi-card-content {
        font-weight: 700;
      }
      .ppi-box-small {
        min-height: 82px;
      }
      .ppi-box-map {
        min-height: 180px;
      }
      .ppi-map-placeholder,
      .ppi-big-map-placeholder {
        background: #f6faf8;
        border: 1px dashed #96b4ad;
        border-radius: 12px;
        min-height: 140px;
        display: grid;
        place-items: center;
        color: #6b8b82;
        font-size: 12px;
        text-align: center;
        margin: 10px;
      }
      .ppi-box-coords {
        display: grid;
        gap: 6px;
      }
      .ppi-coords-table-wrap {
        overflow: hidden;
      }
      .ppi-coords-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 11px;
      }
      .ppi-coords-table th,
      .ppi-coords-table td {
        border: 1px solid #dce4e2;
        padding: 8px 10px;
        text-align: left;
      }
      .ppi-coords-table th {
        background: #0f5d50;
        color: #ffffff;
        font-weight: 800;
        text-transform: uppercase;
        font-size: 10px;
      }
      .ppi-coords-table td {
        background: #fbfdfc;
        color: #1f3a37;
      }
      .ppi-coords-row {
        display: none;
      }
      .ppi-detail-row {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 8px;
        border-top: 1px solid #ecf2f1;
      }
      .ppi-detail-row:first-child {
        border-top: none;
      }
      .ppi-detail-row .label {
        opacity: 0.8;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
      }
      .ppi-box-notes {
        min-height: 160px;
      }
      .ppi-notes-grid {
        min-height: 120px;
        background: repeating-linear-gradient(
          0deg,
          rgba(16, 74, 61, 0.02),
          rgba(16, 74, 61, 0.02) 1px,
          transparent 1px,
          transparent 24px
        );
      }
      .ppi-big-map-card {
        min-height: 320px;
      }
      .ppi-details-table {
        min-height: 260px;
      }
      .ppi-details-grid {
        display: grid;
        grid-template-columns: repeat(11, minmax(0, 1fr));
        gap: 4px;
        padding: 12px;
      }
      .ppi-grid-head,
      .ppi-grid-row {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 40px;
        border: 1px solid #d9e5e3;
        font-size: 10px;
        text-align: center;
        padding: 0 6px;
      }
      .ppi-grid-head {
        background: #1b7761;
        color: #fff;
        font-weight: 800;
      }
      .ppi-grid-row {
        background: #f8fbfb;
        color: #2f4540;
      }
      .ppi-site-outline {
        fill: rgba(255, 204, 51, 0.12);
        stroke: #d97706;
        stroke-width: 4;
      }

      .ppi-site-inner-dashed {
        fill: none;
        stroke: #d4002b;
        stroke-width: 4;
        stroke-dasharray: 12 8;
        stroke-linejoin: round;
      }

      .ppi-site-label {
        font-size: 22px;
        font-weight: 800;
        fill: #b01f1f;
        text-anchor: middle;
        dominant-baseline: middle;
      }
      .ppi-vertical-label {
        writing-mode: vertical-rl;
        text-orientation: mixed;
        background: #1b7761;
        color: #fff;
        border-radius: 12px;
        display: grid;
        place-items: center;
        font-size: 12px;
        font-weight: 800;
        padding: 14px 6px;
      }
    `,
  ],
})
export class PlotPrintComponent {
  @Input() parcel: Parcel | null = null;
  @Input() generatedAt = "";

  get plotData(): any {
    return {
      plotNo: this.plotId || 'A1',
      gisRef: this.plotId || '01021702',
      date: this.dateString || 'Jan - 2025',
      revision: '0'
    };
  }

  get logoPath(): string {
    return 'plotlogo.jpg';
  }

  get attributes(): Record<string, unknown> {
    return (this.parcel?.attributes ?? {}) as Record<string, unknown>;
  }

  get plotId(): string {
    const raw = this.attributes["PlotID"] ?? this.parcel?.displayName ?? this.parcel?.id ?? "";
    return String(raw).trim();
  }

  get masterplanPlotNo(): string {
    return String((this.attributes["PlotID"] ?? this.attributes["MasterPlanPlotNo"] ?? this.plotId) || "");
  }

  get dateString(): string {
    return this.generatedAt || this.formatHumanDateTime(new Date());
  }

  get uniquePlotId(): string {
    const doc = String(this.attributes["DocNo"] ?? this.attributes["DocumentNumber"] ?? "");
    const neighbourhood = String(this.attributes["Neighbourhood"] ?? this.attributes["NeighbourhoodName"] ?? "");
    const block = String(this.attributes["Block"] ?? this.attributes["BlockNo"] ?? "");
    const plot = this.plotId;
    return [doc, neighbourhood, block, plot].filter((v) => v).join(" / ");
  }

  get plotIdBoxes(): string[] {
    const raw = this.plotId || "";
    const chars = raw.split("").slice(0, 10);
    while (chars.length < 10) {
      chars.push("");
    }
    return chars;
  }

  get contractUsername(): string {
    return String(this.attributes["Username"] ?? this.attributes["USER_NAME"] ?? "-");
  }

  get contractDeveloper(): string {
    return String(this.attributes["Developer"] ?? this.attributes["DEVELOPER"] ?? "-");
  }

  get ownershipType(): string {
    return String(this.attributes["OwnershipType"] ?? this.attributes["OWNERSHIP_TYPE"] ?? "-");
  }

  get contractStatus(): string {
    return String(this.attributes["ContractStatus"] ?? this.attributes["CONTRACT_STATUS"] ?? "-");
  }

  get buildingType(): string {
    return String(this.attributes["BuildingType"] ?? this.attributes["BUILDING_TYPE"] ?? "-");
  }

  get subLanduse(): string {
    return String(this.attributes["SubLanduse"] ?? this.attributes["SUB_LANDUSE"] ?? this.attributes["Landuse (English)"] ?? "-");
  }

  get landUse(): string {
    return String(this.attributes["LandUse"] ?? this.attributes["LAND_USE"] ?? this.attributes["LandUseCategory"] ?? "-");
  }

  get plotArea(): string {
    const raw = this.attributes["Area"] ?? this.attributes["PSh Area (m²)"] ?? this.attributes["Shape_Area"];
    if (typeof raw === "number") return `${raw.toFixed(2)} m²`;
    if (raw) return String(raw);
    return "-";
  }

  get plotCenter(): { lat: string; lng: string } {
    const ring = this.firstParcelRing();
    if (!ring.length) return { lat: "-", lng: "-" };
    const cx = ring.reduce((sum, p) => sum + p[0], 0) / ring.length;
    const cy = ring.reduce((sum, p) => sum + p[1], 0) / ring.length;
    return { lat: cy.toFixed(6), lng: cx.toFixed(6) };
  }

  get plotCoordinates(): Array<{ idx: number; north: string; east: string }> {
    const ring = this.firstParcelRing();
    if (!ring.length) return [];
    return ring.slice(0, 12).map((p, i) => {
      const [east, north] = this.lonLatToWebMercator(p[0], p[1]);
      return { idx: i + 1, east: east.toFixed(3), north: north.toFixed(3) };
    });
  }

  get plotSitePoints(): string {
    return this.buildPlotPointsSvg(1120, 560);
  }

  get plotSiteCentroid(): { x: number; y: number } | null {
    const ring = this.firstParcelRing();
    if (!ring.length) return null;
    const xs = ring.map((p) => p[0]);
    const ys = ring.map((p) => p[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const w = maxX - minX || 1;
    const h = maxY - minY || 1;
    const padding = 24;
    const width = 1120;
    const height = 560;
    const scale = Math.min((width - padding * 2) / w, (height - padding * 2) / h);
    const mapped = ring.map(([lon, lat]) => {
      const x = (lon - minX) * scale + padding;
      const y = height - ((lat - minY) * scale + padding);
      return { x, y };
    });
    const cx = mapped.reduce((s, p) => s + p.x, 0) / mapped.length;
    const cy = mapped.reduce((s, p) => s + p.y, 0) / mapped.length;
    return { x: cx, y: cy };
  }

  get plotLocationPoints(): string {
    return this.buildPlotPointsSvg(320, 220);
  }

  private buildPlotPointsSvg(width: number, height: number): string {
    const ring = this.firstParcelRing();
    if (!ring.length) return "";
    const xs = ring.map((p) => p[0]);
    const ys = ring.map((p) => p[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const w = maxX - minX || 1;
    const h = maxY - minY || 1;
    const padding = 24;
    const scale = Math.min((width - padding * 2) / w, (height - padding * 2) / h);
    return ring
      .map(([lon, lat]) => {
        const x = (lon - minX) * scale + padding;
        const y = height - ((lat - minY) * scale + padding);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }

  private firstParcelRing(): number[][] {
    const geom = this.parcel?.geometry as { type: string; coordinates: unknown } | undefined;
    if (!geom) return [];
    let ring: number[][] = [];
    if (geom.type === "Polygon") {
      ring = (geom.coordinates as number[][][])[0] ?? [];
    } else if (geom.type === "MultiPolygon") {
      ring = ((geom.coordinates as number[][][][])[0] ?? [[]])[0] ?? [];
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
    const x = (lon * Math.PI) / 180 * R;
    const clamped = Math.max(Math.min(lat, 85.05112878), -85.05112878);
    const y = Math.log(Math.tan(Math.PI / 4 + (clamped * Math.PI) / 180 / 2)) * R;
    return [x, y];
  }

  private formatHumanDateTime(date: Date): string {
    return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;
  }
}
