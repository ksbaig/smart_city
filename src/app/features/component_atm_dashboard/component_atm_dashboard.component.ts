import { Component, Input, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

export interface AtmProperties {
  ATM_ID: string;
  Bank_Name: string;
  ATM_Type: string;
  District: string;
  Site_Name: string;
  Monthly_Transactions: number;
  Own_Network_Revenue_SAR: number;
  Interbank_Revenue_SAR: number;
  Total_Revenue_SAR: number;
  Operating_Cost_SAR: number;
  Cash_Replenishment_Cost_SAR: number;
  Maintenance_Cost_SAR: number;
  Total_Cost_SAR: number;
  Net_Profit_Loss_SAR: number;
  Performance_Status: string;
  Data_Type?: string;
  As_Of_Date?: string;
  Data_Status?: string;
}

export interface AtmFeature {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: AtmProperties;
}

export interface AtmFeatureCollection {
  type: 'FeatureCollection';
  features: AtmFeature[];
}

export interface AtmRow extends AtmProperties {
  longitude: number;
  latitude: number;
}

export interface DashboardMetric {
  label: string;
  value: string;
  unit?: string;
  icon: string;
}

const GEOJSON_URL = 'geojson/Riyadh_ATM_Locations.geojson';

@Component({
  selector: 'app-component-atm-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './component_atm_dashboard.component.html',
  styleUrl: './component_atm_dashboard.component.scss',
})
export class Component_Atm_Dashboard {
  private readonly http = inject(HttpClient);
  private readonly sanitizer = inject(DomSanitizer);

  readonly searchId = signal('');

  @Input() set initialSearch(value: string | null | undefined) {
    this.searchId.set((value ?? '').trim().toUpperCase());
  }

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly atms = signal<AtmRow[]>([]);

  readonly atm = computed(() => {
    const id = this.searchId();
    return this.atms().find((a) => a.ATM_ID.toUpperCase() === id) ?? null;
  });

  readonly mapUrl = computed<SafeResourceUrl | null>(() => {
    const a = this.atm();
    if (!a) return null;
    const dx = 0.011;
    const dy = 0.007;
    const bbox = [a.longitude - dx, a.latitude - dy, a.longitude + dx, a.latitude + dy]
      .map((n) => n.toFixed(6))
      .join('%2C');
    const marker = `${a.latitude.toFixed(6)}%2C${a.longitude.toFixed(6)}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker}`
    );
  });

  readonly marginText = computed(() => {
    const a = this.atm();
    if (!a || a.Total_Revenue_SAR <= 0) return '0.0';
    return ((a.Net_Profit_Loss_SAR / a.Total_Revenue_SAR) * 100).toFixed(1);
  });

  readonly metrics = computed<DashboardMetric[]>(() => {
    const a = this.atm();
    if (!a) return [];
    return [
      { label: 'Transactions', value: this.num(a.Monthly_Transactions), icon: 'bi-arrow-left-right' },
      { label: 'Own Network Revenue', value: this.sar(a.Own_Network_Revenue_SAR), unit: 'SAR', icon: 'bi-credit-card' },
      { label: 'Interbank Revenue', value: this.sar(a.Interbank_Revenue_SAR), unit: 'SAR', icon: 'bi-bank' },
      { label: 'Total Revenue', value: this.sar(a.Total_Revenue_SAR), unit: 'SAR', icon: 'bi-coin' },
      { label: 'Operating Cost', value: this.sar(a.Operating_Cost_SAR), unit: 'SAR', icon: 'bi-receipt' },
      { label: 'Cash Replenishment', value: this.sar(a.Cash_Replenishment_Cost_SAR), unit: 'SAR', icon: 'bi-cash-stack' },
      { label: 'Maintenance', value: this.sar(a.Maintenance_Cost_SAR), unit: 'SAR', icon: 'bi-tools' },
      { label: 'Total Cost', value: this.sar(a.Total_Cost_SAR), unit: 'SAR', icon: 'bi-calculator' },
    ];
  });

  constructor() {
    this.loadAtms();
  }

  loadAtms(): void {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<AtmFeatureCollection>(GEOJSON_URL).subscribe({
      next: (collection) => {
        const rows = (collection.features ?? []).map<AtmRow>((f) => ({
          ...f.properties,
          longitude: f.geometry.coordinates[0],
          latitude: f.geometry.coordinates[1],
        }));
        this.atms.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load ATM data.');
        this.loading.set(false);
      },
    });
  }

  num(value: number): string {
    return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  sar(value: number): string {
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
