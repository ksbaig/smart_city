import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Subscription } from "rxjs";
import { DqBasemapService } from "../../core/services/dq-basemap.service";
import { Parcel } from "../../shared/models/parcel.model";
import { AtmDataService } from "./atm-data.service";
import { AtmQueryResponse, DataLoadInfo, LocationRecord } from "./local-banking-vioce-agent.models";
import { VoiceSearchService, VoiceSearchState } from "./voice-search.service";

@Component({
  selector: "app-local-banking-vioce-agent",
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./local_banking_vioce_agent.component.html",
  styleUrl: "./local_banking_vioce_agent.component.scss",
})
export class LocalBankingVioceAgentComponent implements OnInit, OnDestroy {
  private readonly voiceService = inject(VoiceSearchService);
  private readonly dataService = inject(AtmDataService);
  private readonly mapService = inject(DqBasemapService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly subscriptions = new Subscription();

  queryText = "";
  recognizedTranscript = "";
  voiceState: VoiceSearchState = "idle";
  statusMessage = "Ready. Ask about ATMs or branches in natural language.";
  loadInfo: DataLoadInfo | null = null;
  loadingData = true;

  response: AtmQueryResponse | null = null;
  rows: LocationRecord[] = [];
  selectedFeature: LocationRecord | null = null;

  async ngOnInit(): Promise<void> {
    this.subscriptions.add(
      this.voiceService.state$.subscribe((state) => {
        this.voiceState = state;
      })
    );

    this.subscriptions.add(
      this.voiceService.transcript$.subscribe((transcript) => {
        this.recognizedTranscript = transcript;
        this.queryText = transcript;
        void this.runQuery();
      })
    );

    this.subscriptions.add(
      this.voiceService.error$.subscribe((errorMessage) => {
        this.statusMessage = errorMessage;
      })
    );

    try {
      await this.dataService.ensureLoaded();
      this.loadInfo = this.dataService.getLoadInfo();
      this.statusMessage = "Voice agent ready. You can type or use the microphone.";
    } catch (error) {
      this.statusMessage = `Failed to load local GeoJSON data: ${String(error)}`;
    } finally {
      this.loadingData = false;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.voiceService.destroy();
  }

  startVoiceCapture(): void {
    const started = this.voiceService.start("en-US");
    if (!started) {
      this.statusMessage = "Voice input is unsupported in this browser. Typed search still works.";
    }
  }

  stopVoiceCapture(): void {
    this.voiceService.stop();
  }

  async runQuery(): Promise<void> {
    const question = this.queryText.trim();
    if (!question) {
      this.statusMessage = "Type or speak a request first.";
      return;
    }

    this.statusMessage = "Processing query...";
    const response = await this.dataService.runNaturalLanguageQuery(question);
    this.response = response;
    this.rows = response.matchedRecords;
    this.statusMessage = response.message;

    if (!this.rows.length) {
      this.mapService.clearDashboardHighlights();
      return;
    }

    const parcels = this.rows.map((row) => this.toParcel(row));
    await this.mapService.highlightLocationParcels(parcels);
  }

  clearResults(): void {
    this.queryText = "";
    this.recognizedTranscript = "";
    this.response = null;
    this.rows = [];
    this.selectedFeature = null;
    this.statusMessage = "Cleared. Ask a new question.";
    this.mapService.clearDashboardHighlights();
  }

  async zoomToRow(row: LocationRecord): Promise<void> {
    await this.mapService.zoomToMasterplanParcel(this.toParcel(row));
  }

  downloadFeature(row: LocationRecord): void {
    this.selectedFeature = row;
    this.cdr.markForCheck();
    // Zoom to the selected feature on the map
    void this.mapService.zoomToMasterplanParcel(this.toParcel(row));
  }

  downloadReport(): void {
    if (this.selectedFeature) {
      this.generateDownloadReport(this.selectedFeature);
    }
  }

  clearSelectedFeature(): void {
    this.selectedFeature = null;
    this.cdr.markForCheck();
  }

  private generateDownloadReport(feature: LocationRecord): void {
    const timestamp = new Date().toLocaleString();
    const featureType = feature.locationType === 'atm' ? 'ATM' : 'Branch';

    const reportContent = `
================================================================================
SMART BANKING AI INFORMATION SYSTEM - ${featureType.toUpperCase()} REPORT
================================================================================

Generated: ${timestamp}
Report Type: ${featureType} Details with Map View

================================================================================
${featureType.toUpperCase()} INFORMATION
================================================================================

Type:               ${featureType}
ID:                 ${feature.id}
Name:               ${feature.name || 'N/A'}
District:           ${feature.district || 'N/A'}
Category:           ${feature.category || 'N/A'}
${feature.performanceStatus ? `Performance Status: ${feature.performanceStatus}` : ''}

Location Coordinates:
  Latitude:         ${feature.latitude}
  Longitude:        ${feature.longitude}

================================================================================
ADDITIONAL PROPERTIES
================================================================================
${this.formatRawProperties(feature.rawProperties)}

================================================================================
MAP INFORMATION
================================================================================

Current Map View:
  Center: [${feature.longitude}, ${feature.latitude}]
  Base Map: Multiple layers available
  Selected Feature: Highlighted at location coordinates

================================================================================
INSTRUCTIONS FOR USE
================================================================================

1. Map View:
   - The map shows the base layers and highlighted feature location
   - Green/Blue markers indicate ATMs or Branches
   - Use zoom controls to navigate the map
   - Click on features for additional details

2. Feature Details:
   - All property information is listed above
   - Coordinates can be used in navigation systems
   - Performance status applicable for branches

3. Data Source:
   - ATM Data: Riyadh_ATM_Locations.geojson
   - Branch Data: Riyadh_Branch_Locations.geojson
   - Data as of: ${new Date().getFullYear()}

================================================================================
DISCLAIMER
================================================================================

This is a synthetic demonstration of the Smart Banking AI Information System.
All data is fictional and for demonstration purposes only.

System Version: 1.0
Generated on: ${new Date().toISOString()}

================================================================================
    `.trim();

    this.downloadAsFile(reportContent, `${featureType}_Report_${feature.id}.txt`);
  }

  private formatRawProperties(props: Record<string, unknown>): string {
    return Object.entries(props)
      .map(([key, value]) => `${key}: ${this.formatPropertyValue(value)}`)
      .join('\n');
  }

  private formatPropertyValue(value: unknown): string {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    return String(value);
  }

  private downloadAsFile(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private toParcel(row: LocationRecord): Parcel {
    const displayName = row.name ? `${row.id} - ${row.name}` : row.id;
    return {
      id: row.id,
      displayName,
      objectId: Number(row.rawProperties["OBJECTID"] ?? 0),
      attributes: {
        ...row.rawProperties,
        _locationType: row.locationType,
      },
      geometry: {
        type: "Point",
        coordinates: [row.longitude, row.latitude],
      },
    };
  }
}