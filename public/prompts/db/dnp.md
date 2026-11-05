# MASTER PROMPT: REDESIGN ATM DASHBOARD – ANGULAR 21 SMART BANKING GIS

## 1. PROJECT OBJECTIVE

I have an existing Angular 21 Smart Banking AI Information System.

I want to redesign my existing ATM Dashboard using a professional enterprise banking interface with a greenish gradient theme.

Use the attached redesigned ATM Dashboard image as the visual reference.

IMPORTANT:
Modify my existing ATM Dashboard. Do not create a separate demo dashboard or a new application.

Maintain all existing GIS functionality, ATM data, ArcGIS map, event handlers and export functionality.

## 2. DESIGN REQUIREMENTS

Apply the following corporate design:

- Light green gradient background.
- Dark corporate green headings.
- White rounded dashboard panels.
- Green icons.
- Soft shadows.
- Modern card layouts.
- Rounded corners.
- Professional typography.
- Smooth hover effects.
- Responsive design.

Use these color variables:

```css
:root {
  --bank-primary: #087A43;
  --bank-primary-dark: #064E32;
  --bank-secondary: #22A06B;
  --bank-gradient-start: #F0FAF0;
  --bank-gradient-middle: #DDF2DF;
  --bank-gradient-end: #BDE5C2;
  --bank-surface: #FFFFFF;
  --bank-surface-soft: #F6FBF6;
  --bank-border: #D8EBDD;
  --bank-text: #173D2B;
  --bank-text-secondary: #68776D;
  --bank-shadow: 0 8px 22px rgba(20,100,55,0.12);
  --bank-radius: 16px;
}
```

## 3. DASHBOARD STRUCTURE

Create a full-height responsive dashboard with two columns.

### LEFT COLUMN – MAP PREVIEW

Width: approximately 49%.

Requirements:

- MAP PREVIEW heading.
- Green gradient heading background.
- Existing ArcGIS satellite map.
- Existing ATM marker.
- Existing selected ATM location.
- Rounded map container.
- Subtle border and shadow.

CRITICAL:
Preserve the existing ArcGIS MapView instance.

Do not replace the ArcGIS map with an image, screenshot or static map.

Preserve all existing GIS layers, graphics, map interactions and functionality.

### RIGHT COLUMN – ATM INFORMATION

Width: approximately 51%.

Create these sections:

A. ATM SUMMARY CARD

Display:
- ATM icon.
- ATM site name.
- Bank name.
- ATM ID.

Use the existing dynamic Angular data model.

Design:
- Light green gradient background.
- Dark green ATM title.
- Green ATM icon.
- Rounded corners.

B. ATTRIBUTES SECTION

Display four attribute rows:

1. ATM ID
2. Bank Name
3. Site Name
4. District

Each row should include:
- Green icon.
- Attribute label.
- Vertical divider.
- Dynamic attribute value.

Use suitable Lucide icons if already available:
- credit-card
- landmark
- building-2
- map-pin

C. EXPORT BUTTONS

Create two large buttons:

- DOWNLOAD JPG
- DOWNLOAD PDF

Design:
- Light green gradient background.
- Green border.
- Green icons.
- Dark green text.
- Rounded corners.
- Hover animation.
- Subtle shadow.

IMPORTANT:
Keep the existing JPG and PDF export functions and event handlers.

Do not create dummy export functionality.

D. CLOSE BUTTON

Retain the existing close button functionality.

Style it as a modern rounded white button with a green border.

## 4. ANGULAR IMPLEMENTATION

First inspect my complete existing ATM Dashboard implementation.

Identify:
- ATM dashboard component.
- HTML template.
- CSS or SCSS file.
- TypeScript file.
- ATM data model/interface.
- ArcGIS MapView initialization.
- Map container ID.
- Existing close handler.
- Existing JPG export handler.
- Existing PDF export handler.

Then modify the existing component files.

Use my actual property names and existing methods.

Do not assume that my existing properties are named selectedAtm, atmId, bankName or siteName without checking the source code.

Preserve existing Angular bindings.

Do not introduce static sample data.

## 5. CSS / SCSS IMPLEMENTATION

Implement a complete professional styling system.

Required CSS classes can include:

- atm-dashboard
- atm-dashboard-header
- atm-dashboard-content
- atm-map-panel
- atm-map-container
- atm-info-panel
- atm-info-card
- atm-info-details
- atm-attributes-heading
- atm-attributes
- atm-attribute-row
- atm-attribute-icon
- atm-attribute-label
- atm-attribute-value
- atm-export-actions
- atm-export-btn
- atm-close-btn

Use the following layout:

Desktop:
- Two columns.
- Map on left.
- ATM details on right.

Tablet:
- Two columns when sufficient space is available.
- Reduce padding and font sizes.

Mobile:
- Single-column layout.
- Map first.
- ATM details below.
- Export buttons remain usable.
- No horizontal overflow.

Use CSS Grid and Flexbox.

Use responsive breakpoints around 1000px and 600px.

Use component-scoped CSS/SCSS wherever possible.

Do not introduce conflicting global CSS rules.

## 6. EXISTING GIS FUNCTIONALITY MUST BE PRESERVED

This is a critical requirement.

Do not modify or break:

- ArcGIS MapView.
- ArcGIS satellite basemap.
- ATM point graphics.
- ATM selection.
- Popup functionality.
- Existing map navigation.
- Existing map extent.
- GIS data queries.
- Existing ATM filtering.
- JPG export.
- PDF export.
- Dashboard closing functionality.

If the map is initialized inside a specific container, preserve its existing container ID.

If the map requires a fixed height, ensure the redesigned layout provides sufficient height.

Do not recreate the map unnecessarily.

## 7. ICONS

Inspect the existing project to identify its icon library.

Reuse the installed icon library if available.

Preferred icons:
- ATM: credit-card or landmark.
- Map preview: map-pinned.
- ATM ID: hash.
- Bank: landmark.
- Site: building-2.
- District: map-pin.
- JPG: image.
- PDF: file-pdf.
- Close: x.

Do not install unnecessary icon libraries if an appropriate one already exists.

## 8. RESPONSIVE DESIGN

Ensure the dashboard works correctly on:

- Desktop monitors.
- Laptop screens.
- Tablets.
- Mobile devices.

Avoid:
- Horizontal scrolling.
- Text overflow.
- Clipped ATM names.
- Overlapping buttons.
- Map container collapsing.
- Export buttons becoming inaccessible.

## 9. DEVELOPMENT AND QUALITY CHECKS

After implementation:

1. Run the Angular build.
2. Resolve TypeScript errors.
3. Resolve CSS/SCSS errors.
4. Verify all Angular data bindings.
5. Verify the ArcGIS map renders.
6. Verify ATM markers remain visible.
7. Verify JPG export.
8. Verify PDF export.
9. Verify close button.
10. Test responsive desktop and mobile layouts.

Do not declare success if the build fails.

## 10. FILE MANAGEMENT

Modify only the files required for the ATM dashboard redesign.

Prefer updating the existing:

- atm-dashboard.component.html
- atm-dashboard.component.scss or .css
- atm-dashboard.component.ts

Update shared styles only if necessary.

Do not create duplicate ATM dashboard components.

Do not modify unrelated banking dashboards.

## 11. FINAL EXPECTED RESULT

I want a premium enterprise banking dashboard matching the attached reference image.

LEFT:
Beautiful satellite map preview with existing ATM location marker.

RIGHT:
Modern ATM summary card, four green-themed attribute rows, and prominent JPG/PDF download buttons.

TOP:
Corporate green gradient header with Dashboard ATM title and close button.

OVERALL:
Light green gradient theme, professional banking UI, smooth interactions, responsive layout and consistent enterprise GIS styling.

IMPORTANT FINAL INSTRUCTION:

Inspect the existing code before making changes. Implement the complete redesign in my actual Angular 21 project. Preserve all existing business logic and ArcGIS functionality. Use the attached reference image as the visual target. Build and verify the application before finishing.