#!/usr/bin/env markdown
# 🎯 QUICK REFERENCE CARD

## ⚡ 30-Second Setup

```typescript
// 1. Import
import { ComponentDownloadComponent, SelectedLocation } 
  from './features/component-download/component-download.component';

// 2. Add to imports array
imports: [ComponentDownloadComponent]

// 3. Add signal
selectedLocation = signal<SelectedLocation | null>(null);

// 4. Add to template
<app-component-download 
  [selectedLocation]="selectedLocation"
  (closeModal)="selectedLocation.set(null)">
</app-component-download>

// 5. Open modal on click
openDownload(data: any) {
  this.selectedLocation.set({
    type: 'branch',
    id: data.Branch_ID,
    bankName: data.Bank_Name,
    district: data.District,
    name: data.Branch_Name,
    rawData: data
  });
}
```

## 📁 Files Created

| File | Purpose | Lines |
|------|---------|-------|
| `component-download.component.ts` | Component logic | 120 |
| `component-download.component.html` | Template | 60 |
| `component-download.component.scss` | Styles | 220 |
| `README.md` | Quick start | - |
| `COMPONENT_DOWNLOAD_GUIDE.md` | Full docs | - |
| `INTEGRATION_EXAMPLES.ts` | Code examples | - |
| `INTEGRATION_STEPS.ts` | Setup guide | - |
| `VISUAL_SUMMARY.md` | Architecture | - |

## 🎨 Features Checklist

- ✅ Modal popup with backdrop
- ✅ Display branch/ATM details
- ✅ Show attributes with icons
- ✅ Download as JSON
- ✅ Download as CSV
- ✅ Print formatted details
- ✅ Copy to clipboard
- ✅ Responsive design
- ✅ Smooth animations
- ✅ Accessibility support
- ✅ No extra dependencies

## 💻 SelectedLocation Data Model

```typescript
interface SelectedLocation {
  type: 'branch' | 'atm';        // Location type
  id: string;                     // BR-XXXXX or ATM-XXXXX
  bankName: string;               // Demo Riyadh Bank...
  district: string;               // Al Narjis, Al Olaya...
  name: string;                   // Branch/Site name
  attributes?: LocationAttribute[];  // Auto-generated
  rawData?: any;                  // Original properties
}

interface LocationAttribute {
  label: string;                  // Display label
  value: string | number;         // Value to show
  icon?: string;                  // Bootstrap icon class
}
```

## 🚀 Usage Examples

### Branch Example
```typescript
this.selectedLocation.set({
  type: 'branch',
  id: 'BR-20103',
  bankName: 'Demo Riyadh Bank (Fictional)',
  district: 'Al Narjis',
  name: 'Al Narjis Demo Branch',
  rawData: {
    Address: 'King Fahd Road',
    Phone: '+966 11 XXX XXXX',
    Hours: '09:00 AM - 05:00 PM'
  }
});
```

### ATM Example
```typescript
this.selectedLocation.set({
  type: 'atm',
  id: 'ATM-10201',
  bankName: 'Demo Riyadh Bank (Fictional)',
  district: 'Al Olaya',
  name: 'Al Olaya Demo Site 01',
  rawData: {
    ATM_Type: 'Drive-through',
    Services: 'Deposit, Withdrawal',
    Availability: '24/7'
  }
});
```

## 🎯 Common Operations

### Open Modal
```typescript
this.selectedLocation.set(location);
```

### Close Modal
```typescript
this.selectedLocation.set(null);
```

### Download JSON Trigger
```typescript
// Done automatically by component
// File: {type}-{id}-details.json
```

### Download CSV Trigger
```typescript
// Done automatically by component
// File: {type}-{id}-details.csv
```

### Print
```typescript
// Opens print dialog with formatted content
```

### Copy
```typescript
// Copies attributes as text to clipboard
```

## 📊 Export Formats

### JSON
```json
{
  "type": "branch",
  "id": "BR-20103",
  "bankName": "Demo Riyadh Bank (Fictional)",
  "district": "Al Narjis",
  "name": "Al Narjis Demo Branch",
  "attributes": [...],
  "downloadedAt": "2026-10-28T20:16:17.269Z"
}
```

### CSV
```csv
Label,Value
Branch ID,BR-20103
Bank Name,"Demo Riyadh Bank (Fictional)"
Branch Name,Al Narjis Demo Branch
District,Al Narjis
```

## 🎨 Customization

### Change Primary Color
Edit `component-download.component.scss`:
```scss
$primary-color: #4CAF50;  // Change this
```

### Add Logo
Edit HTML in modal header:
```html
<img src="your-logo.png" alt="Logo">
```

### Change Icons
Use Bootstrap Icons:
```html
<i class="bi bi-your-icon"></i>
```

## 🔧 Integration Methods

### Method 1: Signal + Parent Component
```typescript
selectedLocation = signal(null);
openDownload(data) { this.selectedLocation.set(data); }
```

### Method 2: Service
```typescript
@Injectable() class DownloadService {
  selectedLocation = signal(null);
  open(data) { this.selectedLocation.set(data); }
}
```

### Method 3: Event Emitter
```typescript
@Output() downloadEvent = new EventEmitter();
onMapClick(data) { this.downloadEvent.emit(data); }
```

## 📱 Responsive Breakpoints

```
Desktop:  width > 600px
  • 4-column buttons
  • Max width: 500px
  • Height: 85vh

Mobile:   width ≤ 600px
  • 2-column buttons
  • Width: 95%
  • Height: 90vh
```

## ⌨️ Keyboard Support

| Key | Action |
|-----|--------|
| Tab | Navigate buttons |
| Enter | Activate button |
| Escape | Close modal |
| Shift+Tab | Reverse navigate |

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Modal not showing | Check if `selectedLocation` is set |
| No download | Enable file downloads in browser |
| Icons missing | Bootstrap Icons CSS must be loaded |
| Styling broken | Check SCSS compilation |
| Z-index issue | Modal z-index is 1000 |

## 📞 Documentation Links

- 📖 **Full Guide**: `COMPONENT_DOWNLOAD_GUIDE.md`
- 💻 **Code Examples**: `INTEGRATION_EXAMPLES.ts`
- 🔧 **Setup Steps**: `INTEGRATION_STEPS.ts`
- 🎨 **Architecture**: `VISUAL_SUMMARY.md`
- ⚡ **Quick Start**: `README.md`

## ✅ Verification Checklist

- [ ] Component imported successfully
- [ ] No TypeScript errors
- [ ] Template renders without errors
- [ ] Styles load correctly
- [ ] Modal appears on signal change
- [ ] Close button works
- [ ] JSON download works
- [ ] CSV download works
- [ ] Print dialog opens
- [ ] Copy to clipboard works
- [ ] Responsive on mobile
- [ ] Icons display correctly

## 🎓 Learning Path

1. **Read** `README.md` (5 min)
2. **Review** `INTEGRATION_EXAMPLES.ts` (10 min)
3. **Follow** `INTEGRATION_STEPS.ts` (15 min)
4. **Implement** in your component (10 min)
5. **Test** all features (5 min)
6. **Reference** `COMPONENT_DOWNLOAD_GUIDE.md` as needed

**Total Time: ~45 minutes**

## 🚀 Next Steps

1. Import the component in your app
2. Add modal to your template
3. Create `selectedLocation` signal
4. Add click handler for features
5. Set signal when user clicks
6. Test the download button
7. Customize colors/icons
8. Deploy! 🎉

## 🎁 Bonus Features

```typescript
// You can easily add:
// - Email export
// - SMS sharing
// - QR code generation
// - Geolocation distance
// - Map integration
// - Real-time updates
// - Batch operations
```

---

**Version**: 1.0.0  
**Created**: October 28, 2026  
**Status**: ✅ Production Ready  
**License**: Ready to use in your project
