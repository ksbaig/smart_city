# Component Download - Implementation Guide

## Overview
The `ComponentDownloadComponent` is a standalone Angular component that displays a modal popup when you click a download button. It shows selected ATM or Branch location details with attributes and provides multiple download/export options.

## Component Location
```
src/app/features/component-download/
├── component-download.component.ts
├── component-download.component.html
├── component-download.component.scss
```

## Features
✅ Modal popup display with backdrop blur
✅ Shows ATM or Branch details
✅ Displays location attributes with icons
✅ Download as JSON
✅ Download as CSV
✅ Print details
✅ Copy to clipboard
✅ Responsive design
✅ Smooth animations

## Data Structure

### SelectedLocation Interface
```typescript
export interface SelectedLocation {
  type: 'branch' | 'atm';        // Type of location
  id: string;                      // Branch_ID or ATM_ID
  bankName: string;                // Bank_Name
  district: string;                // District
  name: string;                    // Branch_Name or Site_Name
  attributes?: LocationAttribute[]; // Generated automatically
  rawData?: any;                   // Optional raw data for additional fields
}
```

### LocationAttribute Interface
```typescript
export interface LocationAttribute {
  label: string;        // Display label
  value: string | number; // Attribute value
  icon?: string;        // Bootstrap icon class (e.g., 'bi-hash', 'bi-bank')
}
```

## Usage in Your App

### 1. Import the Component
In your main `app.ts` or the component where you'll use it:

```typescript
import { ComponentDownloadComponent } from './features/component-download/component-download.component';
```

### 2. Add to Template
In your component template (e.g., `app.html`):

```html
<!-- Add this where you want the modal to appear -->
<app-component-download 
  [selectedLocation]="selectedLocationSignal"
  (closeModal)="onDownloadModalClose()">
</app-component-download>

<!-- Your download button -->
<button (click)="openDownloadModal(branchData)">
  <i class="bi bi-download"></i> Download
</button>
```

### 3. Add to Component Logic
In your component class:

```typescript
import { signal } from '@angular/core';
import { SelectedLocation } from './features/component-download/component-download.component';

export class AppComponent {
  selectedLocationSignal = signal<SelectedLocation | null>(null);

  openDownloadModal(location: any) {
    // For Branch
    this.selectedLocationSignal.set({
      type: 'branch',
      id: location.Branch_ID,
      bankName: location.Bank_Name,
      district: location.District,
      name: location.Branch_Name,
      rawData: location
    });

    // For ATM
    this.selectedLocationSignal.set({
      type: 'atm',
      id: location.ATM_ID,
      bankName: location.Bank_Name,
      district: location.District,
      name: location.Site_Name,
      rawData: location
    });
  }

  onDownloadModalClose() {
    this.selectedLocationSignal.set(null);
  }
}
```

### 4. Add Component to App Imports
If using standalone, add to your app imports:

```typescript
import { ComponentDownloadComponent } from './features/component-download/component-download.component';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    // ... other providers
  ],
};
```

Or import directly in your component:

```typescript
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    ComponentDownloadComponent,
    // ... other imports
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent { }
```

## Example: Adding Download Button to Map

### In your map feature component:

```typescript
import { ComponentDownloadComponent } from '../component-download/component-download.component';

@Component({
  selector: 'app-map-viewer',
  standalone: true,
  imports: [CommonModule, ComponentDownloadComponent],
  template: `
    <!-- Map content -->
    <div id="map" #mapContainer></div>
    
    <!-- Download modal -->
    <app-component-download 
      [selectedLocation]="selectedLocation"
      (closeModal)="selectedLocation.set(null)">
    </app-component-download>

    <!-- Download button on marker popup -->
    <div class="popup-actions" *ngIf="activePopup">
      <button (click)="handleDownload(activePopup)">
        <i class="bi bi-download"></i> Download
      </button>
    </div>
  `
})
export class MapViewerComponent {
  selectedLocation = signal<SelectedLocation | null>(null);
  activePopup: any;

  handleDownload(location: any) {
    this.selectedLocation.set({
      type: location.type === 'branch' ? 'branch' : 'atm',
      id: location.type === 'branch' ? location.Branch_ID : location.ATM_ID,
      bankName: location.Bank_Name,
      district: location.District,
      name: location.type === 'branch' ? location.Branch_Name : location.Site_Name,
      rawData: location
    });
  }
}
```

## Styling Customization

The component uses CSS variables and can be customized by modifying the SCSS file:

```scss
// Modify primary color
$primary-color: #4CAF50;

// Modify modal width
max-width: 500px;

// Modify animation
animation: slideIn 0.3s ease-out;
```

## Download Formats

### JSON Download
Creates a structured JSON file with:
- Location type
- ID
- Bank name
- District
- Name
- All attributes
- Download timestamp

### CSV Download
Creates a two-column CSV:
```
Label,Value
Branch ID,BR-20103
Bank Name,"Demo Riyadh Bank (Fictional)"
District,Al Narjis
...
```

### Print
Opens a print dialog with:
- Logo placeholder area
- Location details
- Formatted attribute table
- Timestamp

### Copy to Clipboard
Copies attributes as plain text in format:
```
Branch ID: BR-20103
Bank Name: Demo Riyadh Bank (Fictional)
District: Al Narjis
...
```

## GeoJSON Integration

When using with your GeoJSON files:

### From Riyadh_Branch_Locations.geojson:
```typescript
const branch = feature.properties;
this.selectedLocation.set({
  type: 'branch',
  id: branch.Branch_ID,
  bankName: branch.Bank_Name,
  district: branch.District,
  name: branch.Branch_Name,
  rawData: branch
});
```

### From Riyadh_ATM_Locations.geojson:
```typescript
const atm = feature.properties;
this.selectedLocation.set({
  type: 'atm',
  id: atm.ATM_ID,
  bankName: atm.Bank_Name,
  district: atm.District,
  name: atm.Site_Name,
  rawData: atm
});
```

## Icon Classes Available
The component uses Bootstrap Icons (bi). Popular options:

- `bi-hash` - ID
- `bi-bank` - Bank
- `bi-building` - Building/Branch
- `bi-geo-alt` - Location/District
- `bi-map` - Address
- `bi-telephone` - Phone
- `bi-clock` - Hours
- `bi-credit-card` - ATM Type
- `bi-gear` - Services
- `bi-clock-history` - Availability

## Accessibility
- Keyboard navigation support
- ARIA labels
- Semantic HTML
- High contrast colors
- Screen reader friendly

## Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers

## Performance
- Signal-based reactivity
- No external dependencies beyond Angular
- Smooth CSS animations
- Optimized file downloads
- Memory-efficient scrolling

## Troubleshooting

### Modal not showing?
- Ensure `selectedLocation` signal is set with valid data
- Check z-index (1000) isn't overridden by higher values

### Download not working?
- Check browser console for errors
- Ensure file download permissions are enabled
- Try a different file format

### Styling issues?
- Verify Bootstrap Icons CSS is loaded
- Check z-index conflicts with other modals
- Test in different browsers

## Future Enhancements
- [ ] Multiple location selection
- [ ] Batch downloads
- [ ] Email export
- [ ] Custom templates
- [ ] QR code generation
- [ ] Geolocation distance calculation
