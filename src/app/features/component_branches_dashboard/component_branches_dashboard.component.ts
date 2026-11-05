import { Component, Input, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

export interface BranchProperties {
  Branch_ID: string;
  Bank_Name: string;
  District: string;
  Branch_Name: string;
  Monthly_Customer_Visits: number;
  Monthly_Transactions: number;
  Monthly_Deposits_SAR: number;
  Monthly_Revenue_SAR: number;
  Monthly_Operating_Cost_SAR: number;
  Net_Profit_Loss_SAR: number;
  Performance_Status: string;
  Data_Type?: string;
  As_Of_Date?: string;
  Location_Type?: string;
  Data_Status?: string;
}

export interface BranchFeature {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: BranchProperties;
}

export interface BranchFeatureCollection {
  type: 'FeatureCollection';
  features: BranchFeature[];
}

export interface BranchRow extends BranchProperties {
  longitude: number;
  latitude: number;
}

export interface DashboardMetric {
  label: string;
  value: string;
  unit?: string;
  icon: string;
}

const GEOJSON_URL = 'geojson/Riyadh_Branch_Locations.geojson';

@Component({
  selector: 'app-component-branches-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './component_branches_dashboard.component.html',
  styleUrl: './component_branches_dashboard.component.scss',
})
export class Component_Branches_Dashboard {
  private readonly http = inject(HttpClient);
  private readonly sanitizer = inject(DomSanitizer);

  readonly searchId = signal('');

  @Input() set initialSearch(value: string | null | undefined) {
    this.searchId.set((value ?? '').trim().toUpperCase());
  }

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly branches = signal<BranchRow[]>([]);

  readonly branch = computed(() => {
    const id = this.searchId();
    return this.branches().find((b) => b.Branch_ID.toUpperCase() === id) ?? null;
  });

  readonly mapUrl = computed<SafeResourceUrl | null>(() => {
    const b = this.branch();
    if (!b) return null;
    const dx = 0.011;
    const dy = 0.007;
    const bbox = [b.longitude - dx, b.latitude - dy, b.longitude + dx, b.latitude + dy]
      .map((n) => n.toFixed(6))
      .join('%2C');
    const marker = `${b.latitude.toFixed(6)}%2C${b.longitude.toFixed(6)}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker}`
    );
  });

  readonly marginText = computed(() => {
    const b = this.branch();
    if (!b || b.Monthly_Revenue_SAR <= 0) return '0.0';
    return ((b.Net_Profit_Loss_SAR / b.Monthly_Revenue_SAR) * 100).toFixed(1);
  });

  readonly metrics = computed<DashboardMetric[]>(() => {
    const b = this.branch();
    if (!b) return [];
    return [
      { label: 'Customer Visits', value: this.num(b.Monthly_Customer_Visits), icon: 'bi-people' },
      { label: 'Transactions', value: this.num(b.Monthly_Transactions), icon: 'bi-arrow-left-right' },
      { label: 'Deposits', value: this.sar(b.Monthly_Deposits_SAR), unit: 'SAR', icon: 'bi-wallet2' },
      { label: 'Revenue', value: this.sar(b.Monthly_Revenue_SAR), unit: 'SAR', icon: 'bi-coin' },
      { label: 'Operating Cost', value: this.sar(b.Monthly_Operating_Cost_SAR), unit: 'SAR', icon: 'bi-receipt' },
    ];
  });

  constructor() {
    this.loadBranches();
  }

  loadBranches(): void {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<BranchFeatureCollection>(GEOJSON_URL).subscribe({
      next: (collection) => {
        const rows = (collection.features ?? []).map<BranchRow>((f) => ({
          ...f.properties,
          longitude: f.geometry.coordinates[0],
          latitude: f.geometry.coordinates[1],
        }));
        this.branches.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load branch data.');
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
