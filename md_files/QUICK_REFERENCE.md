# Smart Banking AI System - Quick Reference Guide

**Last Updated:** October 27, 2026

---

## 📍 Project Location
```
d:\2026\Demo_ksb_2026\frontend1\frontend
```

---

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Run development server
npm start
# Access at: http://localhost:4200

# Build for production
npm run build

# Run tests
npm test

# Watch mode (auto-rebuild on file changes)
npm run watch
```

---

## 📁 Critical Directory Map

```
src/app/
├── core/
│   ├── services/           ← All data & business logic services
│   │   ├── map.service.ts  ← Map initialization & operations
│   │   ├── voice-search.service.ts
│   │   ├── atm-data.service.ts
│   │   └── archive.service.ts
│   └── models/
│
├── features/
│   ├── local_banking_vioce_agent/  ← Voice AI components
│   ├── plot-attributes-panel/
│   ├── comments/
│   └── login-overlay/
│
├── components/
│   └── custom-esri-toolbar/  ← Esri map toolbar
│
└── app.ts                    ← Root component (Main UI)

public/
├── geojson/                  ← ATM/Branch location data
│   ├── Riyadh_ATM_Locations.geojson
│   └── Riyadh_Branch_Locations.geojson
└── data/
    └── PbMasterplan2026.json ← Master plan data
```

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────┐
│         User Interface (HTML/CSS)       │ ← Visual layer
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│     Angular Components                  │ ← Logic layer
│  (Maps, Voice Agent, Panels, etc.)      │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  Services + RxJS Observables            │ ← Data layer
│  (Map, Voice, ATM Data, Archive)        │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│   External APIs & Data                  │ ← Integration
│   (Esri, Voice APIs, GeoJSON files)     │
└─────────────────────────────────────────┘
```

---

## 🔑 Key Technologies

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Angular** | 21.2.0 | Frontend framework |
| **TypeScript** | 5.9.2 | Type-safe JavaScript |
| **Esri/ArcGIS** | 5.0.19 | Map & geospatial features |
| **Photo Sphere Viewer** | 5.14.1 | 360° panoramic views |
| **RxJS** | 7.8.0 | Reactive programming |
| **Bootstrap Icons** | 1.13.1 | UI icons |
| **jsPDF + html2canvas** | Latest | PDF export |

---

## 🎯 Core Services & Their Roles

### MapService
- **File**: `src/app/core/services/map.service.ts`
- **Purpose**: Manage Esri map lifecycle, layers, and interactions
- **Key Methods**: 
  - `initializeMap()` - Set up map
  - `loadLayers()` - Add data layers
  - `highlightFeature()` - Visual feedback

### VoiceSearchService
- **File**: `src/app/features/local_banking_vioce_agent/voice-search.service.ts`
- **Purpose**: Capture and process voice input
- **Key Methods**:
  - `captureVoiceInput()` - Listen to microphone
  - `convertSpeechToText()` - Voice-to-text conversion

### NaturalLanguageQueryService
- **File**: `src/app/features/local_banking_vioce_agent/natural-language-query.service.ts`
- **Purpose**: Understand user intent from text
- **Key Methods**:
  - `parseQuery()` - Extract meaning
  - `classifyIntent()` - Determine action type

### ATMDataService
- **File**: `src/app/features/local_banking_vioce_agent/atm-data.service.ts`
- **Purpose**: Load and query banking location data
- **Key Methods**:
  - `loadATMLocations()` - Fetch GeoJSON
  - `findNearest()` - Geographic search

### ArchiveService
- **File**: `src/app/core/services/archive.service.ts`
- **Purpose**: Manage data persistence and updates
- **Key Methods**:
  - `saveData()` - Store user changes
  - `loadArchive()` - Retrieve stored data

---

## 📊 Data Flow: Voice Query Example

```
User says: "Find me an ATM near Al Nakheel"
     │
     ▼
VoiceSearchService captures audio
     │
     ▼
Speech-to-text: "Find me an ATM near Al Nakheel"
     │
     ▼
NaturalLanguageQueryService parses:
  Intent: FIND_ATM
  Location: Al Nakheel
     │
     ▼
ATMDataService queries:
  All ATMs + distances from Al Nakheel
     │
     ▼
MapService updates:
  Highlights nearest ATM on map
     │
     ▼
ComponentComponent displays:
  Table with results + map marker
     │
     ▼
Voice response played: "Found 3 ATMs, nearest is..."
```

---

## 🗂️ GeoJSON Data Files

### Location
```
public/geojson/
```

### Files & Their Content

| File | Format | Records | Use Case |
|------|--------|---------|----------|
| **Riyadh_ATM_Locations.geojson** | GeoJSON | ATM points | Find nearest ATM |
| **Riyadh_Branch_Locations.geojson** | GeoJSON | Branch points | Find branches |
| **Riyadh_ATMs_and_Branches.geojson** | GeoJSON | Combined | Map overlay |
| **PBMasterplan2026.geojson** | GeoJSON | Polygons | Urban planning |

### GeoJSON Structure Example
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "id": "ATM-001",
        "name": "Al Nakheel ATM",
        "type": "ATM",
        "district": "Al Nakheel",
        "address": "Al Nakheel District, Riyadh",
        "services": ["withdrawal", "deposit", "balance_inquiry"]
      },
      "geometry": {
        "type": "Point",
        "coordinates": [46.7275, 24.7585]
      }
    }
  ]
}
```

---

## 🎨 UI Components Structure

### Main Layout
```
AppComponent
├── Left Sidebar
│   ├── Search bar
│   ├── Layer controls
│   └── Tools
├── Main Map Area
│   └── Esri Map + overlays
└── Right Panel
    ├── Details panel
    ├── Comments
    └── Updates queue
```

### Voice Agent Panel
```
VoiceAgentComponent
├── Microphone controls (Start/Stop)
├── Input text display
├── Search button
└── Results
    ├── Table (ATM/Branch details)
    └── Map integration
```

---

## ⚙️ Configuration Files

### `angular.json`
- Build configuration
- Asset mappings (ArcGIS, icons)
- CSS/SCSS inclusion
- Bundle size limits

### `tsconfig.json`
- TypeScript compiler options
- Strict mode enabled
- Module resolution

### `package.json`
- All dependencies listed
- npm scripts (start, build, test)
- Version 0.0.0 (dev project)

### `proxy.conf.json`
- Development proxy rules
- Routes API requests to backend

---

## 🔍 Finding Things

### To find a specific feature:
```
"Need voice agent?" 
→ src/app/features/local_banking_vioce_agent/

"Need map functions?"
→ src/app/core/services/map.service.ts

"Need ATM locations?"
→ public/geojson/Riyadh_ATM_Locations.geojson

"Need styling?"
→ src/app/*.scss or search for "glass-card.scss"

"Need models/interfaces?"
→ src/app/core/models/

"Need authentication?"
→ src/app/core/services/active-directory-sso.service.ts
```

---

## 📈 File Statistics

```
TypeScript Files:   25+
Component Templates: 15+
Service Files:       10+
GeoJSON Files:       4
Configuration Files: 6
Style Files:         8+
Test Files:          2+
Total Package Size:  ~500MB (with node_modules)
Dist Bundle Size:    ~2-3MB (minified production)
```

---

## ✅ Common Tasks

### 1. Add a new banking location to map
```
1. Edit: public/geojson/Riyadh_ATM_Locations.geojson
2. Add feature to FeatureCollection
3. Refresh browser (automatic hot-reload in dev mode)
4. New marker appears on map
```

### 2. Modify voice agent responses
```
1. Edit: src/app/features/local_banking_vioce_agent/
2. Update: NaturalLanguageQueryService or responses templates
3. Rebuild: npm run build
4. Test changes in dev server
```

### 3. Add new map layer
```
1. Edit: src/app/core/services/map.service.ts
2. Add: loadNewLayer() method
3. Call: in map initialization
4. Style: in component CSS
```

### 4. Update styling
```
Global styles:  src/styles.css or src/styles.scss
Component styles: src/app/**/*.scss
Icons: bootstrap-icons (bootstrap-icons.css)
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Map not loading | Check ArcGIS API key, verify internet connection |
| Voice agent silent | Check microphone permissions, audio output enabled |
| Styles not applied | Run `npm start` fresh build, clear browser cache |
| Build fails | `rm -r node_modules` + `npm install` |
| Port 4200 in use | `ng serve --port 4201` |

---

## 📚 Documentation Structure

```
PROJECT_DOCUMENTATION.md
├── Overview & tech stack
├── Complete directory structure
├── Architecture diagrams
├── Data flow diagrams
├── SDLC process
├── Code snapshots
└── Features overview

QUICK_REFERENCE.md (this file)
├── Quick commands
├── Directory map
├── Key technologies
├── Services overview
├── Data flow examples
└── Troubleshooting
```

---

## 🎓 Learning Path

1. **Day 1**: Read project overview, explore directory structure
2. **Day 2**: Understand architecture & component hierarchy
3. **Day 3**: Study core services (MapService, VoiceSearchService)
4. **Day 4**: Explore components & their interactions
5. **Day 5**: Review GeoJSON data & data models
6. **Day 6+**: Make modifications & test locally

---

## 📞 Quick Links

- **Main Component**: [app.ts](d:\2026\Demo_ksb_2026\frontend1\frontend\src\app\app.ts)
- **Map Service**: [map.service.ts](d:\2026\Demo_ksb_2026\frontend1\frontend\src\app\core\services\map.service.ts)
- **Voice Agent**: [local_banking_vioce_agent](d:\2026\Demo_ksb_2026\frontend1\frontend\src\app\features\local_banking_vioce_agent)
- **ATM Data**: [Riyadh_ATM_Locations.geojson](d:\2026\Demo_ksb_2026\frontend1\frontend\public\geojson\Riyadh_ATM_Locations.geojson)
- **Config**: [angular.json](d:\2026\Demo_ksb_2026\frontend1\frontend\angular.json)

---

## ✨ Key Highlights

✅ **Fully Functional** - App runs and displays maps with voice agent  
✅ **Well-Organized** - Clear separation of concerns (services, components, features)  
✅ **Scalable** - RxJS Observables for state management  
✅ **Responsive** - Works on desktop and mobile  
✅ **Modern** - Angular 21 + latest dependencies  
✅ **Documented** - This documentation + inline code  

---

**Generated: October 27, 2026**  
**For questions: See PROJECT_DOCUMENTATION.md**
