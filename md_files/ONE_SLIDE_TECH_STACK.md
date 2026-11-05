# Smart Banking – Technology Stack (One Slide)

## Core Application Technologies

- **Frontend Framework:** Angular **21** (Standalone components, Angular CLI)
- **Language:** TypeScript **5.9**
- **Reactive Programming:** RxJS
- **Mapping / GIS Engine:** ArcGIS Maps SDK for JavaScript (`@arcgis/core`)
- **UI Icons:** Bootstrap Icons
- **360 / Panorama Viewer:** Photo Sphere Viewer (`@photo-sphere-viewer/core`)
- **Export & Reporting:** `html2canvas` + `jsPDF` (JPG/PDF generation)
- **Build & Dev Tools:** Angular Build System (`@angular/build`), npm
- **Testing:** Vitest (via `ng test`)
- **Formatting:** Prettier
- **Data Sources:** GeoJSON datasets (ATM / Branch / map layers)
- **AI Query / RAG (GeoJSON):** AI requests are resolved by searching/filtering GeoJSON feature properties (e.g., ATM/Branch IDs, names, district, attributes), then returning matched records and highlighting them on the ArcGIS map.

## AI + GeoJSON RAG Flow (High Level)

1. User enters a natural-language or ID-based query.
2. Query is mapped to searchable GeoJSON fields (ID, name, district, type, attributes).
3. Matching GeoJSON features are retrieved.
4. Results are rendered in UI panels and highlighted on the map layer.
5. Selected result is used for dashboard, details, and export actions (JPG/PDF).

## Runtime & Delivery

- **Local Development:** `ng serve` on `http://localhost:4200`
- **Production Build:** `ng build` (optimized Angular production bundle)
