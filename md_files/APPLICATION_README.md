# Smart Banking System: Application Documentation

> **Demo notice:** All banks, ATMs, branches, revenues, costs, and profit figures in this application are **synthetic demo data** (fictional records). They are not verified Riyad Bank locations or real financial results.

---

## Table of Contents

1. [What This Application Is](#1-what-this-application-is)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Data Sources](#4-data-sources)
5. [Getting Started](#5-getting-started)
6. [Login](#6-login)
7. [Main Screen Layout](#7-main-screen-layout)
8. [Base Map Options](#8-base-map-options)
9. [Searching](#9-searching)
10. [Dashboard](#10-dashboard)
11. [ATM Dashboard](#11-atm-dashboard)
12. [Branches Dashboard](#12-branches-dashboard)
13. [Query (AI Agent) Search and Map Display](#13-query-ai-agent-search-and-map-display)
14. [3D Scene View](#14-3d-scene-view)
15. [Other Features](#15-other-features)
16. [Known Limitations and Security Notes](#16-known-limitations-and-security-notes)

---

## 1. What This Application Is

The **Smart Banking System** (also called *Smart Banking Network System*) is a single-page web application for exploring bank branch and ATM coverage across **Riyadh, Saudi Arabia**. It combines an interactive GIS map with dashboards and a natural-language query tool so operations users can:

- Locate ATMs and branches on a map.
- Filter them by district, type, and performance status.
- Review per-ATM and per-branch financial and operational metrics.
- Ask questions in plain language (typed or spoken) and see the results highlighted on the map.
- View the area in a 3D scene.

The application's login screen describes its capabilities as:

- Branch & ATM Locator
- Service and Accessibility Filters
- Network Coverage Analytics
- District-Level Demand Planning
- Map-Based Reporting

The application is built on **Angular** with the **ArcGIS Maps SDK for JavaScript**. It is a client-side app: all data is loaded from static files in the `public/` folder.

---

## 2. Technology Stack

| Area | Technology |
|---|---|
| Front-end framework | Angular 21 (standalone components, signals, `*ngIf`/`*ngFor`) |
| GIS / maps | `@arcgis/core` 5.x (MapView, SceneView, WebMap, GraphicsLayer) |
| Base map imagery | ArcGIS web map, Google Streets (fallback), satellite imagery |
| Panoramas | `@photo-sphere-viewer/core` |
| PDF / print | `jspdf`, `html2canvas` |
| Icons | `bootstrap-icons` |
| Reactive streams | RxJS 7.8 |
| Build and dev server | Angular CLI (`ng build`, `ng serve`) |
| Unit tests | Vitest (`ng test`) |
| Dev proxy | `proxy.conf.json` (routes `/api`, `/portal-api`, `/360view`) |

---

## 3. Project Structure

```
smart_banking/
├── public/
│   ├── geojson/                  # Map data (ATM, branch, combined layers)
│   │   ├── Riyadh_ATM_Locations.geojson        # 150 ATM points
│   │   ├── Riyadh_Branch_Locations.geojson     # 25 branch points
│   │   └── Riyadh_ATMs_and_Branches.geojson    # 175 combined points
│   ├── data/                     # Master plan and update data
│   └── assets/                   # Images, icons, vendor files
├── src/
│   ├── app/
│   │   ├── app.ts / app.html     # Main shell: header, sidebar, map, right panel
│   │   ├── app.config.ts         # Application providers
│   │   ├── core/
│   │   │   └── services/
│   │   │       ├── dq-basemap.service.ts          # Map, basemap, layers, highlighting
│   │   │       ├── active-directory-sso.service.ts # SSO login (demo)
│   │   │       ├── street-view.service.ts         # Street view helpers
│   │   │       └── ...
│   │   ├── features/
│   │   │   ├── login-overlay/                     # Login screen
│   │   │   ├── component_atm_dashboard/           # ATM dashboard
│   │   │   ├── component_branches_dashboard/      # Branch dashboard
│   │   │   ├── local_banking_vioce_agent/         # Query / AI agent (text + voice)
│   │   │   │   ├── natural-language-query.service.ts
│   │   │   │   ├── voice-search.service.ts
│   │   │   │   └── atm-data.service.ts
│   │   │   ├── bank-voice-agent/                  # Voice agent component
│   │   │   ├── comments/                          # Comments panel
│   │   │   ├── plot-print/                        # Print / PDF sheets
│   │   │   └── viewer/                            # Autodesk (APS) viewer
│   │   ├── components/custom-esri-toolbar/        # Map drawing toolbar
│   │   └── shared/models/                         # TypeScript data models
│   ├── environments/
│   └── index.html / main.ts / styles.scss
├── proxy.conf.json
├── angular.json
└── package.json
```

---

## 4. Data Sources

All map and dashboard data is read from GeoJSON files in `public/geojson/`. There is no live database in this front-end.

### 4.1 ATM data: `Riyadh_ATM_Locations.geojson`

- **150 ATM features** (Point geometry, `[longitude, latitude]`).
- Each ATM has an `ATM_ID` in the form `ATM-10201`, `ATM-10202`, and so on. The ATM dashboard searches by this ID.

| Property | Meaning |
|---|---|
| `ATM_ID` | Unique ATM identifier (e.g., `ATM-10201`) |
| `Bank_Name` | Bank name (demo) |
| `ATM_Type` | Type, e.g., Drive-through |
| `District` | Riyadh district |
| `Site_Name` | Site name |
| `Monthly_Transactions` | Transactions per month |
| `Own_Network_Revenue_SAR` / `Interbank_Revenue_SAR` / `Total_Revenue_SAR` | Revenue in SAR |
| `Operating_Cost_SAR` / `Cash_Replenishment_Cost_SAR` / `Maintenance_Cost_SAR` / `Total_Cost_SAR` | Costs in SAR |
| `Net_Profit_Loss_SAR` | Net result in SAR |
| `Performance_Status` | `Profit` (120), `Break-even` (10), or `Loss` (20) |
| `Data_Type`, `As_Of_Date` | Marks data as synthetic; reference date (e.g., 2026-10-01) |

### 4.2 Branch data: `Riyadh_Branch_Locations.geojson`

- **25 branch features**.
- Each branch has a `Branch_ID` (e.g., `BR-20101`) and a `Branch_Name`.

| Property | Meaning |
|---|---|
| `Branch_ID` | Unique branch identifier |
| `Branch_Name` | Branch name |
| `District` | Riyadh district |
| `Monthly_Customer_Visits` | Customer visits per month |
| `Monthly_Transactions` | Transactions per month |
| `Monthly_Deposits_SAR` | Deposits per month in SAR |
| `Monthly_Revenue_SAR` / `Monthly_Operating_Cost_SAR` / `Net_Profit_Loss_SAR` | Financials in SAR |
| `Performance_Status` | `Strong` (10), `Moderate` (4), or `Weak` (11) |
| `Data_Status` | Disclaimer that records are synthetic |

### 4.3 Combined data: `Riyadh_ATMs_and_Branches.geojson`

- **175 features** (150 ATMs + 25 branches) used for the combined map layer.
- Uses a generic schema: `feature_type` (`atm` or `branch`), `id`, `name`, `district`, `atm_type`, and so on.

### 4.4 Districts

The data covers **about 60 Riyadh districts**, including Al Olaya, Al Malaz, Al Murabba, Al Yasmin, Diplomatic Quarter, Granada, Qurtubah, Tuwaiq, and King Fahd District.

---

## 5. Getting Started

### Prerequisites

- Node.js and npm (the project uses npm 11, per `package.json`).
- Internet access, because the map uses ArcGIS and Google map services.

### Install and run

```powershell
npm install
npm start          # runs "ng serve"; open http://localhost:4200
```

### Other commands

| Command | Purpose |
|---|---|
| `npm run build` | Production build (`ng build`) |
| `npm run watch` | Development build with file watching |
| `npm test` | Unit tests (`ng test`) |

### Proxy

`proxy.conf.json` forwards:

- `/api` to `http://localhost:3001` (a local back-end, if running)
- `/portal-api` to the ArcGIS geoportal (rewritten to `/geoportal`)
- `/360view` to `http://localhost` (360° panorama content)

---

## 6. Login

When the app opens, a full-screen **login overlay** is displayed. The main screen stays hidden until the user signs in.

### 6.1 Login screen layout

- **Top bar:** application title *Smart Banking System* and the current role label *User - Operations*.
- **Left rail:** decorative icon buttons (home, location, bank, chart, map, reports, settings).
- **Sign-in card:**
  - **Domain** dropdown with six options: `Banking` (default), `Smart city`, `Mining`, `Utility`, `Housing`, `Tourisam`.
  - **Password** field with a show/hide toggle.
  - **Remember me** checkbox.
  - **Forgot Password?** link (decorative in this version).
  - **Sign in** button.
  - **Active Directory SSO** button.
- **Welcome panel:** lists the five capabilities shown in section 1.

### 6.2 Signing in with a password

1. Choose a **Domain** (default is `Banking`).
2. Enter the password.
3. Click **Sign in**.

If the domain is not in the list, or the password is wrong, the message *Invalid user or password.* appears.

### 6.3 Signing in with Active Directory SSO

1. Choose a **Domain**.
2. Click **Active Directory SSO**.
3. The app shows *Signed in with Active Directory SSO as <domain>* and enters the main screen.

> The SSO service in this version is a demonstration. It does not contact a real Active Directory server (see section 16).

### 6.4 After sign-in

The header shows **User - <domain>** (for example, `User - Banking`). The main map and left toolbar become available.

---

## 7. Main Screen Layout

After login, the screen has four main areas:

| Area | Location | Purpose |
|---|---|---|
| **Header** | Top | App title *Smart Banking*, user label, and a right-click menu |
| **Left sidebar** | Left edge | Icon buttons that open tools (search, AI agent, dashboard, legend, reports, draw, clear, plot sheet) |
| **Map** | Centre | ArcGIS map with ATM and branch markers |
| **Right panel** | Right side | Opens the selected tool: AI Agent, Dashboard, Legend, Reports, 3D view, 360° view, CCTV, KROKI, archive files, comments, and so on |

### Left sidebar buttons

| Button | Icon | Action |
|---|---|---|
| Search | magnifier | Shows or hides the **search overlay** on the map |
| AI agent | microphone | Opens the **AI Agent** (query) panel |
| Dashboard | layers | Opens the **Dashboard** panel (performance charts, ATM and branch dashboards) |
| Legend | document | Opens the **Legend** panel |
| ATM Reports | cash stack | Opens the ATM reports view |
| Reports | map | Opens the **Reports** panel |
| Draw | pencil | Starts drawing a polygon on the map |
| Clear graphics | X | Removes drawn graphics and highlights |
| Plot Sheet 1 | printer | Opens the printable plot sheet |

---

## 8. Base Map Options

The map supports two base map views and a few helper layers.

### 8.1 Base map toggle

A button in the map area switches the base map:

- **Webmap** (default): the ArcGIS web map used for the Riyadh area. If the web map cannot be loaded, the app falls back to a **Google Streets** base map.
- **Satellite**: satellite imagery.

The button label changes to show the other option. For example, when the map is in Webmap mode, the button reads *Satellite*. When the map is in Satellite mode, it reads *Webmap*.

### 8.2 Map layers

- **ATM markers** (from `Riyadh_ATM_Locations.geojson`)
- **Branch markers** (from `Riyadh_Branch_Locations.geojson`)
- **Highlighted results** (from the query and search tools)
- **Drawn graphics** (from the Draw tool)

### 8.3 Map navigation

- Pan by dragging, zoom with the mouse wheel or the zoom controls.
- Click a marker to see its details.
- Right-click on the header opens a small context menu with **Comments**, **How to use**, and **About**.
- Double-clicking the user label in the header is also wired to a handler (`onSelectedRoadDoubleClick`).

---

## 9. Searching

There are two search tools.

### 9.1 Map search overlay

1. Click the **magnifier** button in the left sidebar. A search card appears on the map. It can be dragged, collapsed, and expanded using its arrow button.
2. Type an identifier in the **Search ATM / Branch ID** box (for example, `ATM-10201` or `BR-20101`).
3. The matching location is highlighted on the map.

The search card can be dragged, collapsed, and expanded. Hide it by clicking the magnifier button again.

### 9.2 Search by ID in the Dashboards

Both dashboards accept an ID as input:

- ATM dashboard: an **ATM_ID** such as `ATM-10201`.
- Branch dashboard: a **Branch_ID** such as `BR-20101`.

The search is case-insensitive. The ID is converted to uppercase before matching.

### 9.3 Search by natural language

For questions such as *"show all ATMs in Al Malaz"*, use the AI Agent described in section 13.

---

## 10. Dashboard

Click the **Dashboard** button (layers icon) in the left sidebar. The right panel opens a **Dashboard** section with two sub-views:

- **ATM Dashboard**: details for a single ATM (section 11).
- **Branches Dashboard**: details for a single branch (section 12).

The **Dashboard** panel also contains two summary cards:

- **Branch Performance Status**: a donut chart and legend of branches by status (`Strong`, `Moderate`, `Weak`), with a total.
- **ATM Performance Status**: a donut chart and legend of ATMs by status (`Profit`, `Break-even`, `Loss`), with a total.

Clicking a chart slice or a legend item selects that status. The map then shows the matching ATMs or branches (the code filters markers on `Performance_Status`).

---

## 11. ATM Dashboard

The ATM dashboard shows the financial and operational profile of one ATM.

### 11.1 How to use

1. Open the **Dashboard** and select the **ATM** view.
2. Enter an **ATM_ID** such as `ATM-10201`, or select an ATM on the map.
3. The dashboard shows the ATM's name, a location map, and metrics.

### 11.2 Metrics shown

| Metric | Source field | Unit |
|---|---|---|
| Transactions | `Monthly_Transactions` | count |
| Own Network Revenue | `Own_Network_Revenue_SAR` | SAR |
| Interbank Revenue | `Interbank_Revenue_SAR` | SAR |
| Total Revenue | `Total_Revenue_SAR` | SAR |
| Operating Cost | `Operating_Cost_SAR` | SAR |
| Cash Replenishment | `Cash_Replenishment_Cost_SAR` | SAR |
| Maintenance | `Maintenance_Cost_SAR` | SAR |
| Total Cost | `Total_Cost_SAR` | SAR |

Money values are shown with two decimal places. Transactions are shown as whole numbers.

### 11.3 Profit margin

The dashboard calculates a **margin** as:

```
margin (%) = Net_Profit_Loss_SAR / Total_Revenue_SAR × 100
```

If total revenue is zero or less, the margin is shown as `0.0`.

### 11.4 Location map

The dashboard includes a small OpenStreetMap view centred on the ATM, with a marker on its exact coordinates.

### 11.5 Errors

If the ATM data file cannot be loaded, the dashboard shows *Could not load ATM data.*

---

## 12. Branches Dashboard

The branches dashboard works the same way as the ATM dashboard, for branches.

### 12.1 How to use

1. Open the **Dashboard** and select the **Branches** view.
2. Enter a **Branch_ID** such as `BR-20101`, or select a branch on the map.
3. The dashboard shows the branch name, a location map, and performance metrics.

### 12.2 Metrics shown

- Monthly customer visits
- Monthly transactions
- Monthly deposits (SAR)
- Monthly revenue (SAR)
- Monthly operating cost (SAR)
- Net profit or loss (SAR)
- Performance status (`Strong`, `Moderate`, or `Weak`)

### 12.3 Performance status filter

The branch status can be used to filter the map. Branches are matched on `Performance_Status`, which is compared in uppercase. If no branch matches the selected status, the console logs a warning.

---

## 13. Query (AI Agent) Search and Map Display

The **AI Agent** lets users ask a question in plain language, either by typing it or by speaking it. The matching ATMs or branches are then displayed on the map.

### 13.1 Opening the AI Agent

Click the **microphone** button in the left sidebar. The right panel shows **AI Agent** with:

- A text box with the placeholder *"Example: show all ATMs in Al Malaz"*.
- **Search** button: runs the query.
- **Clear** button: clears the results.
- A microphone button for voice input (where the browser supports it).

### 13.2 Typing a query

1. Type a question in the text box.
2. Click **Search**.
3. The results list shows the number of matches, for example *Results (12)*.

### 13.3 Speaking a query

1. Click the microphone button and speak the question.
2. The app uses the browser's speech recognition (`SpeechRecognition` or `webkitSpeechRecognition`). Speech is recognized in **English (en-US)**.
3. The recognized text fills the text box and the query runs.

Voice input works only in browsers that support the Web Speech API (for example, Chrome and Edge). In other browsers, the app shows an *unsupported* message.

### 13.4 Supported question types

The query parser (`natural-language-query.service.ts`) recognizes these intents:

| Intent | Example question | What it does |
|---|---|---|
| **Find ATM by ID** | `ATM-10201` | Finds and highlights one ATM |
| **Find branch by ID** | `BR-20101` | Finds and highlights one branch |
| **Show all** | `show all ATMs` | Shows every ATM (or branch) on the map |
| **Filter** | `ATMs in Al Malaz` | Shows ATMs or branches in the named district(s) |
| **Filter by status** | `loss-making ATMs` or `weak branches` | Shows items with the matching performance status |
| **Count** | `how many ATMs in Al Olaya` | Returns a count of matching items |
| **Compare districts** | `compare Al Olaya and Al Malaz` | Compares two or more districts |

Notes:

- The parser decides whether a question is about **ATMs** or **branches** from the words *ATM* or *branch*. Performance-status words default to **branches** when no target is named.
- District names are matched case-insensitively, and some aliases are recognized (for example, *olaya* for Al Olaya, *malaz* for Al Malaz).
- If the question cannot be understood, the agent returns an *unknown* response and asks the user to rephrase.

### 13.5 Results list

Each result row shows the ATM or branch name, district, and key values. Each row has two buttons:

- **Zoom**: centres the map on that location.
- **Download**: downloads a map image with the feature's details (see section 15.3).

### 13.6 Details popup

Clicking a result opens a **Details** dialog:

- Title: *ATM Details* or *Branch Details*, depending on the item type.
- Shows the details of the selected item.
- Close with the **×** button.

### 13.7 Display on the map

- Matching markers are **highlighted** on the map.
- The map zooms to show the results.
- **Clear graphics** (sidebar) or the **Clear** button removes the highlights.

---

## 14. 3D Scene View

The 3D view shows the map area as a three-dimensional scene. It is a separate tool from the 2D map and is opened from the right panel.

### 14.1 How to open

1. Open the right-hand panel and choose the **3D** view (the panel title is *3D View*).
2. The app loads the 3D scene. A *Loading 3D...* message appears while it loads.
3. If loading fails, an error message is shown in the panel (for example, *The 3D scene could not be displayed. Please try again.*).

### 14.2 What it does

- Uses the ArcGIS **SceneView** (3D) to display the scene. The app loads an ArcGIS Online web scene that must be shared as public.
- Lets the user rotate, tilt, and zoom the 3D view with the standard SceneView navigation.
- Opening the 3D view closes any open overlay panels.

### 14.3 Plot Sheet 3D

The Plot Sheet feature includes its own 3D preview. The **Plot Sheet 1** button opens a printable sheet for a selected location, and it can include a small 3D scene inside the sheet.

### 14.4 Related viewers

The right panel also includes:

- **360° Street View** and panoramas (uses Photo Sphere Viewer).
- **CCTV** video panel.
- **Autodesk (APS) viewer** component for model viewing (present in the codebase).

---

## 15. Other Features

### 15.1 Legend

The **Legend** button opens a **Legend** panel in the right-hand area that explains the map symbols.

### 15.2 Drawing and clearing

- **Draw** starts a polygon drawing tool on the map. Drawn shapes appear as graphics.
- **Clear graphics** removes drawn shapes and query highlights.

### 15.3 Download and print

- **Download** on a query result saves a map image with the feature's details.
- **Plot Sheet 1** creates a printable A1 PDF sheet (using `jspdf` and `html2canvas`).

### 15.4 Reports

The **Reports** panel shows report content for the selected area or item.

### 15.5 Comments

The **Comments** panel lets users leave notes on the current view.

### 15.6 Language and layout

- The interface is available in **English** and **Arabic**. Arabic switches the layout to right-to-left.
- The header right-click menu includes theme and layout options, such as a vertical toolbar.

---

## 16. Known Limitations and Security Notes

These points should be addressed before the application is used beyond a demo.

1. **Hard-coded password.** The login check in `login-overlay.component.ts` accepts the password `123` for any listed domain. This must be replaced with a real authentication service before production use.
2. **Demo SSO.** `ActiveDirectorySsoService` accepts any domain and signs the user in without contacting Active Directory.
3. **Synthetic data.** All ATM, branch, revenue, and cost figures are fictional. The app displays this notice on the login screen.
4. **Static data files.** Data is loaded from GeoJSON files in `public/geojson/`. Changes to ATMs or branches require editing those files.
5. **Speech input.** Voice queries require a browser with the Web Speech API and are recognized in English only.
6. **External services.** The map and 3D scene use third-party ArcGIS and Google services. These need internet access and may require valid keys or portal access.
7. **Dev proxy targets.** `proxy.conf.json` points to a staging geoportal and a local back-end that must be running for those routes to work.

---

*This document describes the application as found in the repository. Feature names, panels, and data counts reflect the data files and components at the time of writing.*
