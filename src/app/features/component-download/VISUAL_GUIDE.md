# 🎨 Component Download - Visual Guide & Screenshots

## Modal Appearance

### Desktop View
```
┌────────────────────────────────────────────────────────────────┐
│  (Blurred Map Background)                                      │
│                                                                 │
│    ┌──────────────────────────────────────────────────────┐   │
│    │                                                      │   │
│    │  ┌────────────────────────────────────────────────┐  │   │
│    │  │  Logo here                               [×]  │  │   │
│    │  │  Branch Details                              │  │   │
│    │  └────────────────────────────────────────────────┘  │   │
│    │                                                      │   │
│    │  Al Narjis Demo Branch                             │   │
│    │  Demo Riyadh Bank (Fictional)                      │   │
│    │  Branch ID: BR-20103                              │   │
│    │                                                      │   │
│    │  Attributes                                        │   │
│    │  ┌──────────────────────────────────────────────┐  │   │
│    │  │ 📋 Branch ID      │       BR-20103       │  │   │
│    │  ├──────────────────────────────────────────────┤  │   │
│    │  │ 🏦 Bank Name      │ Demo Riyadh Bank...  │  │   │
│    │  ├──────────────────────────────────────────────┤  │   │
│    │  │ 🏢 Branch Name    │ Al Narjis Demo...    │  │   │
│    │  ├──────────────────────────────────────────────┤  │   │
│    │  │ 📍 District       │       Al Narjis      │  │   │
│    │  └──────────────────────────────────────────────┘  │   │
│    │                                                      │   │
│    │  ┌────────────────────────────────────────────────┐  │   │
│    │  │ [📥 JSON] [📊 CSV] [🖨️ Print] [📋 Copy] │  │   │
│    │  └────────────────────────────────────────────────┘  │   │
│    │                                                      │   │
│    └──────────────────────────────────────────────────────┘   │
│                                                                 │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Mobile View (Portrait)
```
┌──────────────────────────────┐
│ (Blurred Map Background)     │
│                              │
│  ┌────────────────────────┐  │
│  │ Logo          [×]      │  │
│  │ Branch Details         │  │
│  ├────────────────────────┤  │
│  │ Al Narjis Demo Branch  │  │
│  │ Demo Riyadh Bank...    │  │
│  │ Branch ID: BR-20103    │  │
│  │                        │  │
│  │ Attributes             │  │
│  │ ┌────────────────────┐ │  │
│  │ │📋 Branch ID│BR-201│ │  │
│  │ ├────────────────────┤ │  │
│  │ │🏦 Bank Name│Demo...│ │  │
│  │ ├────────────────────┤ │  │
│  │ │🏢 Branch│Al Narjis│ │  │
│  │ ├────────────────────┤ │  │
│  │ │📍 District│Al Narj│ │  │
│  │ └────────────────────┘ │  │
│  │                        │  │
│  │ ┌────────────────────┐ │  │
│  │ │ [📥 JSON][📊 CSV]  │ │  │
│  │ │ [🖨️ Print][📋 Copy]│ │  │
│  │ └────────────────────┘ │  │
│  └────────────────────────┘  │
│                              │
└──────────────────────────────┘
```

## Component States

### State 1: Closed (Initial)
```
Modal: Hidden
selectedLocation signal: null
isVisible computed: false
Visibility: Hidden
```

### State 2: Opening Animation
```
Time: 0ms
Transform: translateY(-50px)
Opacity: 0
Backdrop blur: Applying

Time: 150ms
Transform: translateY(0)
Opacity: Transitioning

Time: 300ms
Transform: translateY(0)
Opacity: 1
Animation: Complete ✓
```

### State 3: Open
```
Modal: Visible
Attributes: Displayed
Action buttons: Interactive
Status: Ready for user action
```

### State 4: Closing Animation
```
Transform: Reverse slideIn
Opacity: Fading out
Duration: 300ms
Result: Modal removed
```

## User Interactions

### Scenario 1: Download as JSON
```
1. User clicks [📥 JSON] button
   ↓
2. Component calls downloadAsJSON()
   ├─ Prepares data object
   ├─ Converts to JSON string
   ├─ Creates Blob
   └─ Triggers download
   ↓
3. Browser download dialog appears
   ↓
4. File saved: branch-BR-20103-details.json
   ↓
5. User can import/view in text editor
```

### Scenario 2: Download as CSV
```
1. User clicks [📊 CSV] button
   ↓
2. Component calls downloadAsCSV()
   ├─ Formats attributes as CSV
   ├─ Adds header row
   └─ Creates Blob
   ↓
3. Browser download dialog appears
   ↓
4. File saved: branch-BR-20103-details.csv
   ↓
5. User opens in Excel/Sheets
```

### Scenario 3: Print
```
1. User clicks [🖨️ Print] button
   ↓
2. Component calls printDetails()
   ├─ Opens new window
   ├─ Writes HTML content
   ├─ Applies print styles
   └─ Calls window.print()
   ↓
3. Browser print dialog appears
   ↓
4. User selects printer/PDF
   ↓
5. Professional document printed
```

### Scenario 4: Copy to Clipboard
```
1. User clicks [📋 Copy] button
   ↓
2. Component calls copyToClipboard()
   ├─ Formats text
   ├─ Uses navigator.clipboard
   └─ Shows confirmation
   ↓
3. Data copied to clipboard
   ↓
4. User can paste anywhere
   ├─ Text documents
   ├─ Email
   ├─ Chat apps
   └─ Notes
```

## Color States & Interactions

### Button Hover States
```
Default State
┌─────────────┐
│ [📥 JSON]   │ (Gray border, white bg)
└─────────────┘

Hover State
┌─────────────┐
│ [📥 JSON]   │ (Green border, light green bg)
└─────────────┘

Active State
┌─────────────┐
│ [📥 JSON]   │ (Scale 0.95)
└─────────────┘
```

### Attribute Item Styling
```
┌─────────────────────────────────────┐
│ 📋 Branch ID  │  BR-20103           │  Default
└─────────────────────────────────────┘
  Green left border, light gray background

┌─────────────────────────────────────┐
│ 📋 Branch ID  │  BR-20103           │  Hover
└─────────────────────────────────────┘
  Darker border, emphasized
```

## Icon Set for Branch

```
📋 Branch ID      - bi-hash
🏦 Bank Name      - bi-bank
🏢 Branch Name    - bi-building
📍 District       - bi-geo-alt
🗺️  Address       - bi-map
☎️  Phone         - bi-telephone
🕐 Hours          - bi-clock
```

## Icon Set for ATM

```
📋 ATM ID         - bi-hash
🏦 Bank Name      - bi-bank
🏢 Site Name      - bi-building
📍 District       - bi-geo-alt
💳 ATM Type       - bi-credit-card
⚙️  Services      - bi-gear
🕐 Availability   - bi-clock-history
```

## Responsive Breakpoints

### Extra Large (> 1200px)
```
Modal Width: 500px
Modal Height: 85vh
Buttons: 4 columns
Font Size: 14px
Padding: 20px
```

### Large (992px - 1200px)
```
Modal Width: 90% (max 500px)
Modal Height: 85vh
Buttons: 4 columns
Font Size: 14px
Padding: 20px
```

### Medium (768px - 992px)
```
Modal Width: 90% (max 500px)
Modal Height: 85vh
Buttons: 4 columns
Font Size: 13px
Padding: 18px
```

### Small (600px - 768px)
```
Modal Width: 90%
Modal Height: 85vh
Buttons: 2 columns
Font Size: 12px
Padding: 15px
```

### Extra Small (< 600px)
```
Modal Width: 95%
Modal Height: 90vh
Buttons: 2 columns
Font Size: 11px
Padding: 12px
Attributes: Stacked vertically
```

## Animation Timeline

### Modal Entry (slideIn)
```
Frame 0% (0ms)
├─ Transform: translateY(-50px)
├─ Opacity: 0
└─ Backdrop: blur(0px)

Frame 50% (150ms)
├─ Transform: translateY(-25px)
├─ Opacity: 0.5
└─ Backdrop: blur(1px)

Frame 100% (300ms)
├─ Transform: translateY(0px)
├─ Opacity: 1
└─ Backdrop: blur(2px) ✓ Complete
```

### Button Interaction
```
Hover (200ms transition)
├─ Border: Gray → Green
├─ Background: White → Light Green
└─ Color: Gray → Green

Click (Active state)
└─ Transform: scale(0.95)
```

## Component Structure Diagram

```
ComponentDownloadComponent
├─ Input Signal
│  └─ selectedLocation: SelectedLocation | null
├─ Output Emitter
│  └─ closeModal: EventEmitter<void>
├─ Computed Properties
│  └─ isVisible(): boolean
├─ Template
│  ├─ Overlay Div (.download-modal-overlay)
│  ├─ Modal Container (.download-modal-container)
│  │  ├─ Header Section
│  │  │  ├─ Logo Area
│  │  │  ├─ Title
│  │  │  └─ Close Button
│  │  ├─ Content Section
│  │  │  ├─ Location Info
│  │  │  └─ Attributes List
│  │  └─ Actions Section
│  │     ├─ JSON Download Button
│  │     ├─ CSV Download Button
│  │     ├─ Print Button
│  │     └─ Copy Button
│  └─ Event Bindings
│     ├─ (click)="onClose()"
│     ├─ (click)="downloadAsJSON()"
│     ├─ (click)="downloadAsCSV()"
│     ├─ (click)="printDetails()"
│     └─ (click)="copyToClipboard()"
└─ Styles
   ├─ Modal animations
   ├─ Button styles
   ├─ Responsive layouts
   └─ Color scheme
```

## Data Display Example

### Input Data
```typescript
{
  type: 'branch',
  id: 'BR-20103',
  bankName: 'Demo Riyadh Bank (Fictional)',
  district: 'Al Narjis',
  name: 'Al Narjis Demo Branch',
  rawData: {
    Branch_ID: 'BR-20103',
    Bank_Name: 'Demo Riyadh Bank (Fictional)',
    Branch_Name: 'Al Narjis Demo Branch',
    District: 'Al Narjis',
    Address: 'King Fahd Road, Riyadh',
    Phone: '+966 11 XXX XXXX',
    Hours: '09:00 AM - 05:00 PM'
  }
}
```

### Generated Attributes
```
Label: Branch ID
Value: BR-20103
Icon: bi-hash
---
Label: Bank Name
Value: Demo Riyadh Bank (Fictional)
Icon: bi-bank
---
Label: Branch Name
Value: Al Narjis Demo Branch
Icon: bi-building
---
Label: District
Value: Al Narjis
Icon: bi-geo-alt
---
Label: Address
Value: King Fahd Road, Riyadh
Icon: bi-map
---
Label: Phone
Value: +966 11 XXX XXXX
Icon: bi-telephone
---
Label: Hours
Value: 09:00 AM - 05:00 PM
Icon: bi-clock
```

## Accessibility Features

### Keyboard Navigation
```
Tab       → Navigate to next button
Shift+Tab → Navigate to previous button
Enter     → Activate button
Escape    → Close modal (future enhancement)
```

### ARIA Labels
```html
<button aria-label="Close modal">X</button>
<div role="dialog" aria-modal="true">...</div>
<div aria-label="Location attributes list">...</div>
```

### Color Contrast
```
Text on White: #333333 (WCAG AAA compliant)
Link Colors: #4CAF50 (High contrast)
Border Colors: #DDD (Clear separation)
```

### Screen Reader Support
```
Modal announces: "Branch Details Modal"
Location announces: Location name and type
Attributes: Read as list items
Buttons: Read with action labels
```

## File Format Samples

### JSON Export Sample
```json
{
  "type": "branch",
  "id": "BR-20103",
  "bankName": "Demo Riyadh Bank (Fictional)",
  "district": "Al Narjis",
  "name": "Al Narjis Demo Branch",
  "attributes": [
    {
      "label": "Branch ID",
      "value": "BR-20103",
      "icon": "bi-hash"
    },
    {
      "label": "Bank Name",
      "value": "Demo Riyadh Bank (Fictional)",
      "icon": "bi-bank"
    }
  ],
  "downloadedAt": "2026-10-28T20:16:17.269Z"
}
```

### CSV Export Sample
```csv
Label,Value
Branch ID,BR-20103
Bank Name,"Demo Riyadh Bank (Fictional)"
Branch Name,Al Narjis Demo Branch
District,Al Narjis
Address,King Fahd Road, Riyadh
Phone,+966 11 XXX XXXX
Hours,09:00 AM - 05:00 PM
```

### Print Document Sample
```
┌─────────────────────────────────────┐
│        (Logo Placeholder)           │
│                                     │
│        Branch Details               │
│                                     │
│   Al Narjis Demo Branch             │
├─────────────────────────────────────┤
│ Attribute            Value           │
├─────────────────────────────────────┤
│ Branch ID            BR-20103       │
│ Bank Name            Demo Riyadh... │
│ Branch Name          Al Narjis...   │
│ District             Al Narjis      │
│ Address              King Fahd Road │
│ Phone                +966 11 XXXXX  │
│ Hours                09:00-05:00 PM │
├─────────────────────────────────────┤
│ Printed on: 28/10/2026 20:16:17     │
└─────────────────────────────────────┘
```

---

**Visual Guide Complete** ✅

All visual elements, interactions, and responsive layouts documented.
Ready for implementation and testing!
