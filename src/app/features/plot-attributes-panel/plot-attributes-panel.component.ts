import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ViewMode = 'cards' | 'cards1' | 'presentation';

interface PlotAttribute {
  icon: string;
  label: string;
  value: string;
  isBadge?: boolean;
  badgeType?: 'available' | 'developed' | 'allotted';
}

@Component({
  selector: 'app-plot-attributes-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './plot-attributes-panel.component.html',
  styleUrl: './plot-attributes-panel.component.scss',
})
export class PlotAttributesPanelComponent {
  viewMode = signal<ViewMode>('cards');

  plotId = 'A147';
  status: 'developed' | 'available' | 'allotted' = 'developed';
  lastUpdated = 'May 11, 2025';

  attributes: PlotAttribute[] = [
    { icon: 'map', label: 'Master Plan', value: 'PB Master Plan 2026' },
    { icon: 'location', label: 'Zone', value: 'Residential High Density' },
    { icon: 'building', label: 'Sector', value: 'Leenah Area' },
    { icon: 'home', label: 'Land Use', value: 'Residential' },
    { icon: 'layers', label: 'Sub Landuse', value: 'High Density' },
    { icon: 'ruler', label: 'Area (m²)', value: '537' },
    { icon: 'grid', label: 'Land Category', value: 'Residential High Density' },
    { icon: 'document', label: 'Contract Status', value: 'Allotted', isBadge: true, badgeType: 'allotted' },
    { icon: 'flag', label: 'Plot Status', value: 'Developed', isBadge: true, badgeType: 'developed' },
  ];

  quickActions = [
    { icon: 'map-pin', label: 'View on Map' },
    { icon: 'file-text', label: 'Plot Sheet' },
    { icon: 'printer', label: 'Print' },
    { icon: 'download', label: 'Export' },
    { icon: 'share', label: 'Share' },
  ];

  setView(mode: ViewMode) {
    this.viewMode.set(mode);
  }
}
