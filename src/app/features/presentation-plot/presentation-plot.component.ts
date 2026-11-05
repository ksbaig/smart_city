import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, inject } from "@angular/core";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { DqBasemapService } from "../../core/services/dq-basemap.service";
import { Parcel } from "../../shared/models/parcel.model";

interface PresentationRow {
  label: string;
  value: string;
}

interface ViewStateSummary {
  zoom: number | null;
  scale: number | null;
}

@Component({
  selector: "app-presentation-plot",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="presentation-plot-backdrop" (click)="close()">
      <div class="presentation-plot-modal" (click)="$event.stopPropagation()">
        <button type="button" class="presentation-plot-close" (click)="close()" aria-label="Close">Close</button>

        <div #captureRoot class="presentation-plot-sheet">
          <header class="presentation-plot-header">
            <div class="presentation-plot-header-copy">
              <div class="presentation-plot-eyebrow">Presentation Plot</div>
              <h3>{{ parcelTitle }}</h3>
              <p>Current map view with selected plot details</p>
            </div>
            <div class="presentation-plot-header-brand" aria-label="Diplomatic Quarter logo">
              <div class="presentation-plot-logo-badge">
                <img [src]="logoUrl" alt="Diplomatic Quarter logo" class="presentation-plot-logo-image" />
              </div>
            </div>
          </header>

          <div class="presentation-plot-header-bar">
            <span class="presentation-plot-header-chip presentation-plot-header-chip--secondary">Plot {{ parcel?.displayName || parcel?.id }}</span>
          </div>

          <div class="presentation-plot-body">
            <section class="presentation-plot-map-panel">
              <div class="presentation-plot-map-title">Map Preview</div>
              <div class="presentation-plot-map-frame">
                <img *ngIf="mapImageUrl" [src]="mapImageUrl" alt="Current map preview" class="presentation-plot-map-image" />
                <div class="presentation-plot-map-overlay" *ngIf="mapImageUrl">
                  <div class="presentation-plot-north">
                    <span class="presentation-plot-north-arrow">▲</span>
                    <span class="presentation-plot-north-label">N</span>
                  </div>
                  <div class="presentation-plot-scale-bar">
                    <div class="presentation-plot-scale-label">{{ scaleBarLabel }}</div>
                    <div class="presentation-plot-scale-track" [style.width.px]="scaleBarWidth">
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
                <div class="presentation-plot-empty" *ngIf="!mapImageUrl && !loading">Map preview unavailable</div>
                <div class="presentation-plot-loading" *ngIf="loading">Capturing current map view...</div>
              </div>
              <div class="presentation-plot-map-meta">
                <span>Zoom: {{ viewState?.zoom ?? '—' }}</span>
                <span>Captured: {{ generatedAt }}</span>
              </div>
            </section>

            <aside class="presentation-plot-info-panel">
              <div class="presentation-plot-info-title">Selected Plot Details</div>
              <div class="presentation-plot-summary-grid">
                <div class="presentation-plot-summary-card" *ngFor="let summary of presentationSummaryRows">
                  <span class="presentation-plot-summary-label">{{ summary.label }}</span>
                  <span class="presentation-plot-summary-value">{{ summary.value }}</span>
                </div>
              </div>
              <div class="presentation-plot-details-list">
                <div class="presentation-plot-row" *ngFor="let row of presentationDetailRows">
                  <span class="presentation-plot-row-label">{{ row.label }}</span>
                  <span class="presentation-plot-row-value">{{ row.value }}</span>
                </div>
              </div>
            </aside>
          </div>
        </div>

        <div class="presentation-plot-actions">
          <button type="button" class="btn-primary" (click)="downloadPdf()" [disabled]="loading || exporting || !mapImageUrl">Download PDF</button>
          <button type="button" class="btn-secondary" (click)="downloadJpg()" [disabled]="loading || exporting || !mapImageUrl">Download JPG</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .presentation-plot-backdrop {
        position: fixed;
        inset: 0;
        z-index: 1500;
        background: rgba(8, 37, 31, 0.38);
        backdrop-filter: blur(5px);
        display: grid;
        place-items: center;
        padding: 16px;
      }

      .presentation-plot-modal {
        position: relative;
        width: min(1180px, calc(100vw - 32px));
        height: min(840px, calc(100vh - 32px));
        max-height: 100%;
        background: #f7fbf9;
        border-radius: 24px;
        border: 1px solid rgba(0, 0, 0, 0.16);
        box-shadow: 0 30px 80px rgba(4, 20, 17, 0.28);
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .presentation-plot-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        padding: 18px 24px;
        background: linear-gradient(135deg, #0f766e 0%, #115e59 100%);
        color: #fff;
        border-radius: 20px 20px 0 0;
      }

      .presentation-plot-header-copy {
        flex: 1 1 auto;
        min-width: 0;
      }

      .presentation-plot-header-copy h3 {
        margin: 2px 0 0;
        font-size: 30px;
        line-height: 1.05;
        font-weight: 900;
      }

      .presentation-plot-header-copy p {
        margin: 6px 0 0;
        font-size: 13px;
        opacity: 0.92;
      }

      .presentation-plot-eyebrow {
        font-size: 12px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        opacity: 0.9;
      }

      .presentation-plot-close {
        position: absolute;
        top: 12px;
        right: 12px;
        z-index: 3;
        border: none;
        border-radius: 999px;
        padding: 10px 16px;
        font-weight: 800;
        color: #0f766e;
        background: rgba(255, 255, 255, 0.92);
        cursor: pointer;
      }

      .presentation-plot-header-brand {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        flex: 0 0 auto;
      }

      .presentation-plot-logo-badge {
        width: 92px;
        height: 92px;
        border-radius: 18px;
        background: transparent;
        display: grid;
        place-items: center;
        padding: 0;
        box-sizing: border-box;
      }

      .presentation-plot-logo-image {
        width: 100%;
        height: 100%;
        object-fit: contain;
        filter: drop-shadow(0 12px 24px rgba(0, 0, 0, 0.22));
        display: block;
      }

      .presentation-plot-sheet {
        background: #ffffff;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .presentation-plot-body {
        display: grid;
        grid-template-columns: minmax(0, 1.7fr) minmax(310px, 0.9fr);
        gap: 18px;
        padding: 18px 20px 14px;
        flex: 1;
        min-height: 0;
      }

      .presentation-plot-map-panel,
      .presentation-plot-info-panel {
        background: #ffffff;
        border: 1px solid rgba(15, 118, 110, 0.14);
        border-radius: 20px;
        box-shadow: 0 12px 30px rgba(7, 33, 28, 0.06);
        display: flex;
        flex-direction: column;
        min-height: 0;
      }

      .presentation-plot-map-panel {
        padding: 16px;
        gap: 12px;
        min-height: 0;
      }

      .presentation-plot-info-panel {
        padding: 16px;
        gap: 16px;
        min-height: 0;
      }

      .presentation-plot-map-title,
      .presentation-plot-info-title {
        font-size: 14px;
        font-weight: 900;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: #0f766e;
      }

      .presentation-plot-map-frame {
        flex: 1;
        min-height: 0;
        border-radius: 24px;
        overflow: hidden;
        background: linear-gradient(180deg, #eaf5f0 0%, #f9fcfb 100%);
        border: 1px solid rgba(15, 118, 110, 0.14);
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.68), 0 18px 48px rgba(15, 118, 110, 0.08);
        position: relative;
      }

      .presentation-plot-map-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      .presentation-plot-map-overlay {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }

      .presentation-plot-north {
        position: absolute;
        top: 18px;
        left: 18px;
        z-index: 2;
        width: 52px;
        height: 72px;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.92);
        color: #0f766e;
        box-shadow: 0 14px 28px rgba(7, 33, 28, 0.16);
        display: grid;
        place-items: center;
        align-content: center;
        gap: 2px;
        font-weight: 800;
      }

      .presentation-plot-scale-bar {
        position: absolute;
        right: 18px;
        bottom: 18px;
        z-index: 2;
        padding: 12px 14px;
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.94);
        border: 1px solid rgba(15, 118, 110, 0.12);
        box-shadow: 0 12px 24px rgba(7, 33, 28, 0.14);
        display: grid;
        gap: 8px;
      }

      .presentation-plot-scale-label {
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.02em;
        text-transform: uppercase;
        color: #164e45;
      }

      .presentation-plot-scale-track {
        height: 8px;
        border-radius: 999px;
        background: linear-gradient(90deg, #0f766e 0%, #48a78f 100%);
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 4px;
        overflow: hidden;
      }

      .presentation-plot-scale-track span {
        display: block;
        background: rgba(255, 255, 255, 0.55);
        border-radius: 999px;
      }

      .presentation-plot-empty,
      .presentation-plot-loading {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        font-size: 15px;
        color: #1f4f3d;
        padding: 24px;
        text-align: center;
      }

      .presentation-plot-map-meta {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        padding: 10px 0 0;
        color: #1f4f3d;
        font-size: 13px;
      }

      .presentation-plot-info-panel {
        padding: 20px;
        display: grid;
        gap: 16px;
        align-content: start;
        min-height: 0;
      }

      .presentation-plot-summary-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .presentation-plot-summary-card {
        padding: 16px 18px;
        border-radius: 18px;
        background: #f5fdf8;
        border: 1px solid rgba(15, 118, 110, 0.12);
        box-shadow: 0 14px 32px rgba(15, 118, 110, 0.06);
      }

      .presentation-plot-summary-label {
        display: block;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #0f766e;
        margin-bottom: 6px;
      }

      .presentation-plot-summary-value {
        display: block;
        font-size: 16px;
        font-weight: 800;
        color: #0d3f30;
        line-height: 1.2;
      }

      .presentation-plot-details-list {
        flex: 1;
        min-height: 0;
        border-top: 1px solid rgba(15, 118, 110, 0.12);
        padding-top: 12px;
      }

      .presentation-plot-row {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 16px;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid rgba(15, 118, 110, 0.08);
      }

      .presentation-plot-row:last-child {
        border-bottom: none;
      }

      .presentation-plot-row-label {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #0f766e;
      }

      .presentation-plot-row-value {
        text-align: right;
        font-size: 14px;
        font-weight: 600;
        color: #102f27;
      }

      .presentation-plot-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding: 16px 24px 20px;
        background: #f7fbf9;
      }

      .presentation-plot-summary-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .presentation-plot-summary-card {
        padding: 16px 18px;
        border-radius: 18px;
        background: #f5fdf8;
        border: 1px solid rgba(15, 118, 110, 0.12);
        box-shadow: 0 14px 32px rgba(15, 118, 110, 0.06);
      }

      .presentation-plot-header-bar {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        padding: 14px 24px 0;
      }

      .presentation-plot-header-chip {
        display: inline-flex;
        align-items: center;
        padding: 10px 14px;
        border-radius: 999px;
        background: rgba(15, 118, 110, 0.12);
        color: #0f766e;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }

      .presentation-plot-header-chip--secondary {
        background: rgba(15, 118, 110, 0.08);
        color: #164e45;
      }

      .presentation-plot-north-label {
        font-size: 13px;
        font-weight: 900;
        line-height: 1;
      }

      .presentation-plot-north-arrow {
        font-size: 24px;
        line-height: 1;
      }

      .presentation-plot-scale-bar {
        position: absolute;
        right: 16px;
        bottom: 16px;
        z-index: 2;
        padding: 10px 12px;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.92);
        color: #174f4a;
        box-shadow: 0 12px 24px rgba(7, 33, 28, 0.14);
        display: grid;
        gap: 6px;
      }

      .presentation-plot-scale-label {
        font-size: 12px;
        font-weight: 800;
        text-align: right;
        line-height: 1;
      }

      .presentation-plot-scale-track {
        height: 10px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        border: 2px solid #114f4a;
        overflow: hidden;
      }

      .presentation-plot-scale-track span:first-child {
        background: #114f4a;
      }

      .presentation-plot-scale-track span:last-child {
        background: #ffffff;
      }

      .presentation-plot-empty,
      .presentation-plot-loading {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        padding: 24px;
        text-align: center;
        color: #174f4a;
        font-weight: 700;
      }

      .presentation-plot-map-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        font-size: 12px;
        font-weight: 700;
        color: #325c58;
      }

      .presentation-plot-map-meta span {
        background: #eff8f6;
        border: 1px solid rgba(15, 118, 110, 0.12);
        border-radius: 999px;
        padding: 6px 10px;
      }

      .presentation-plot-row {
        display: grid;
        gap: 4px;
        padding: 12px 0;
        border-bottom: 1px solid rgba(15, 118, 110, 0.1);
      }

      .presentation-plot-label {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #6b8a86;
        font-weight: 800;
      }

      .presentation-plot-value {
        font-size: 16px;
        color: #163c39;
        font-weight: 800;
        word-break: break-word;
      }

      .presentation-plot-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding: 0 20px 20px;
      }

      .btn-primary,
      .btn-secondary {
        border: none;
        border-radius: 999px;
        padding: 12px 18px;
        font-weight: 800;
        cursor: pointer;
      }

      .btn-primary {
        color: #fff;
        background: linear-gradient(135deg, #16a34a 0%, #0f766e 100%);
      }

      .btn-secondary {
        color: #0f766e;
        background: #eaf4f2;
      }

      .btn-primary:disabled,
      .btn-secondary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      @media (max-width: 980px) {
        .presentation-plot-body {
          grid-template-columns: 1fr;
        }

        .presentation-plot-map-frame {
          min-height: 420px;
        }

        .presentation-plot-scale-bar {
          right: 12px;
          bottom: 12px;
          padding: 8px 10px;
        }

        .presentation-plot-north {
          top: 12px;
          left: 12px;
          width: 46px;
          height: 64px;
        }

        .presentation-plot-header {
          align-items: flex-start;
          flex-direction: column;
        }

        .presentation-plot-header-brand {
          justify-content: flex-start;
        }

        .presentation-plot-logo-badge {
          width: 76px;
          height: 76px;
        }
      }
    `,
  ],
})
export class PresentationPlotComponent implements OnInit {
  @Input() parcel: Parcel | null = null;
  @Output() closed = new EventEmitter<void>();

  readonly logoUrl = "/dqlogo.png";

  @ViewChild("captureRoot", { static: false })
  private readonly captureRoot?: ElementRef<HTMLDivElement>;

  mapImageUrl = "";
  loading = false;
  exporting = false;
  error = "";
  generatedAt = "";
  viewState: ViewStateSummary | null = null;

  private readonly mapService = inject(DqBasemapService);
  private readonly cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.generatedAt = this.formatHumanDateTime(new Date());
    void this.refreshPreview();
  }

  get parcelTitle(): string {
    return this.parcel?.displayName || this.parcel?.id || "Presentation Plot";
  }

  get presentationRows(): PresentationRow[] {
    const attrs = this.parcel?.attributes ?? {};
    const baseRows: PresentationRow[] = [
      { label: "Master Plan", value: this.parcel?.sourceDataset === "2018" ? "Master Plan 2018" : "PB Master Plan 2026" },
      { label: "Plot Number", value: this.parcel?.displayName || this.parcel?.id || this.pickAttribute(attrs, ["PlotID", "Plot Id", "Plot Number"]) },
      { label: "Neighborhood", value: this.pickAttribute(attrs, ["English Name Zone", "Zone English Name", "Sector"]) },
      { label: "Land Use", value: this.pickAttribute(attrs, ["English Name Landuse", "Landuse (English)", "Land Use", "Landuse"]) },
      { label: "Sub Landuse", value: this.pickAttribute(attrs, ["Sub Landuse English", "Sub Landuse", "Sub Landuse (English)"]) },
      { label: "Area (m²)", value: this.formatArea(this.pickAttribute(attrs, ["PSh Area (m²)", "Shape_Area", "Area", "AREA", "Area_m2", "Area_m²"])) },
      { label: "Frontage (m)", value: this.pickAttribute(attrs, ["Frontage (m)", "Frontage", "Frontage_m"]) },
      { label: "Depth (m)", value: this.pickAttribute(attrs, ["Depth (m)", "Depth", "Depth_m"]) },
      { label: "Land Category", value: this.pickAttribute(attrs, ["Land Category", "LandUseCategory", "LandCategory"]) },
      { label: "Contract Status", value: this.pickAttribute(attrs, ["Contract Status", "Contract Status English", "Status"]) },
      { label: "Plot Status", value: this.pickAttribute(attrs, ["Plot Status English", "Plot Status"]) },
      { label: "User Name", value: this.pickAttribute(attrs, ["User Name", "UserEnglishName", "Username", "Owner Name"]) },
      { label: "Developer", value: this.pickAttribute(attrs, ["Developer", "Developer Name", "developer"]) },
      { label: "Ownership Type", value: this.pickAttribute(attrs, ["Ownership Type", "Ownership"]) },
      { label: "Lease Type", value: this.pickAttribute(attrs, ["Lease Type", "LeaseType"]) },
    ];

    const visibleBaseRows = baseRows.filter(row => row.value !== "—");
    const additionalRows = this.liveAttributeRows().filter((row) => !visibleBaseRows.some(base => base.label === row.label));
    const allRows = [...visibleBaseRows, ...additionalRows.slice(0, 5)];
    return allRows.filter((row) => {
      const text = `${row.label} ${row.value}`.toLowerCase();
      return !text.includes("ttachmwebt") && !text.includes("ttachm webt");
    });
  }

  get presentationSummaryRows(): PresentationRow[] {
    return this.presentationRows.slice(0, 4);
  }

  get presentationDetailRows(): PresentationRow[] {
    return this.presentationRows.slice(4, 12);
  }

  get scaleBarLabel(): string {
    const meters = this.scaleBarMeters;
    if (meters >= 1000) {
      return `${this.trimScaleValue(meters / 1000)} km`;
    }
    return `${this.trimScaleValue(meters)} m`;
  }

  get scaleBarWidth(): number {
    const meters = this.scaleBarMeters;
    if (meters >= 2000) {
      return 140;
    }
    if (meters >= 1000) {
      return 126;
    }
    if (meters >= 500) {
      return 112;
    }
    if (meters >= 200) {
      return 96;
    }
    if (meters >= 100) {
      return 82;
    }
    return 68;
  }

  async downloadPdf(): Promise<void> {
    const dataUrl = await this.captureAsDataUrl("image/jpeg", 0.95);
    if (!dataUrl) {
      return;
    }
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
    pdf.save(`${this.buildFileBaseName()}.pdf`);
  }

  async downloadJpg(): Promise<void> {
    const dataUrl = await this.captureAsDataUrl("image/jpeg", 0.95);
    if (!dataUrl) {
      return;
    }
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${this.buildFileBaseName()}.jpg`;
    link.click();
  }

  close(): void {
    this.closed.emit();
  }

  formatScale(scale: number | null | undefined): string {
    if (!scale || !Number.isFinite(scale)) {
      return "—";
    }
    return `1:${Math.round(scale).toLocaleString()}`;
  }

  private async refreshPreview(): Promise<void> {
    if (!this.parcel) {
      this.error = "No selected parcel.";
      return;
    }

    this.loading = true;
    this.error = "";
    this.generatedAt = this.formatHumanDateTime(new Date());
    this.viewState = this.mapService.getCurrentViewState();
    this.cdr.detectChanges();

    try {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      this.mapImageUrl = await this.mapService.takeMapScreenshot(1600, 900);
    } catch (err) {
      console.error("Presentation plot capture failed", err);
      this.error = "Failed to capture current map view.";
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  private async captureAsDataUrl(mime: "image/png" | "image/jpeg", quality = 0.92): Promise<string | null> {
    if (!this.captureRoot?.nativeElement) {
      return null;
    }
    if (!this.mapImageUrl && !this.loading) {
      await this.refreshPreview();
    }

    this.exporting = true;
    this.cdr.detectChanges();
    try {
      const canvas = await html2canvas(this.captureRoot.nativeElement, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      return canvas.toDataURL(mime, quality);
    } catch (err) {
      console.error("Presentation plot export failed", err);
      return null;
    } finally {
      this.exporting = false;
      this.cdr.detectChanges();
    }
  }

  private pickAttribute(attributes: Record<string, unknown>, keys: string[]): string {
    for (const key of keys) {
      const value = attributes[key];
      if (value !== undefined && value !== null && `${value}`.trim() !== "") {
        return String(value);
      }
    }
    return "—";
  }

  private formatArea(value: string): string {
    if (value === "—") {
      return value;
    }
    const numeric = Number(String(value).replace(/,/g, ""));
    if (Number.isFinite(numeric)) {
      return `${numeric.toLocaleString(undefined, { maximumFractionDigits: 2 })} m²`;
    }
    return value;
  }

  private liveAttributeRows(): PresentationRow[] {
    const attrs = this.parcel?.attributes ?? {};
    const hiddenKeys = new Set(["shape", "geometry", "ttachmwebt"]);

    return Object.entries(attrs)
      .filter(([key, value]) => {
        if (value === null || value === undefined || `${value}`.trim() === "") {
          return false;
        }
        return !hiddenKeys.has(key.toLowerCase());
      })
      .map(([key, value]) => ({
        label: this.humanizeAttributeKey(key),
        value: String(value),
      }));
  }

  private humanizeAttributeKey(key: string): string {
    return key
      .replace(/_/g, " ")
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/\s+/g, " ")
      .trim();
  }

  private buildFileBaseName(): string {
    const idSource = this.parcel?.displayName || this.parcel?.id || "presentation-plot";
    return `presentation-plot-${String(idSource).replace(/[^a-zA-Z0-9_-]/g, "_")}`;
  }

  private formatHumanDateTime(date: Date): string {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }

  private get scaleBarMeters(): number {
    const scale = this.viewState?.scale;
    if (!scale || !Number.isFinite(scale)) {
      return 100;
    }

    const targetMeters = scale / 4500;
    return this.toNiceScaleDistance(targetMeters);
  }

  private toNiceScaleDistance(value: number): number {
    const safeValue = Math.max(1, value);
    const magnitude = 10 ** Math.floor(Math.log10(safeValue));
    const normalized = safeValue / magnitude;

    let niceNormalized = 1;
    if (normalized >= 5) {
      niceNormalized = 5;
    } else if (normalized >= 2) {
      niceNormalized = 2;
    }

    return niceNormalized * magnitude;
  }

  private trimScaleValue(value: number): string {
    if (Number.isInteger(value)) {
      return `${value}`;
    }
    return value.toFixed(1).replace(/\.0$/, "");
  }
}
