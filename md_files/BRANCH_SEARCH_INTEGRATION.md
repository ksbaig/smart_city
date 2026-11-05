# Branch Search Integration Guide

**Purpose:** Guide for adding branch search capability to the voice agent  
**Status:** Implementation Ready  
**Date:** October 27, 2026

---

## 📍 Branch Locations Data File

### File Location
```
public/geojson/Riyadh_Branch_Locations.geojson
```

### File Size & Records
- **Format:** GeoJSON FeatureCollection
- **Total Records:** 30+ branch locations
- **Data Type:** Synthetic Demo Data (for testing)
- **As of Date:** 2026-10-01

---

## 📊 Branch Properties Structure

Each branch feature includes comprehensive banking metrics:

```json
{
  "type": "Feature",
  "geometry": {
    "type": "Point",
    "coordinates": [46.708807, 24.654661]
  },
  "properties": {
    // Identification
    "Branch_ID": "BR-20101",
    "Bank_Name": "Demo Riyadh Bank (Fictional)",
    "Branch_Name": "Al Murabba Demo Branch",
    "Location_Type": "Branch",
    
    // Location
    "District": "Al Murabba",
    
    // Performance Metrics
    "Performance_Status": "Strong",          // ⭐ KEY SEARCH FIELD
    "Monthly_Customer_Visits": 5346,
    "Monthly_Transactions": 25985,
    
    // Financial Data (SAR)
    "Monthly_Deposits_SAR": 21716449.56,
    "Monthly_Revenue_SAR": 273133.36,
    "Monthly_Operating_Cost_SAR": 91375.97,
    "Net_Profit_Loss_SAR": 181757.39,
    
    // Data Status
    "Data_Type": "SYNTHETIC DEMO DATA",
    "As_Of_Date": "2026-10-01",
    "Data_Status": "SYNTHETIC DEMONSTRATION DATA — fictional records"
  }
}
```

---

## 🔑 Key Branch Properties

### Performance_Status
**Type:** String  
**Possible Values:**
- `Strong` - High-performing branch
- `Average` - Standard performance
- `Needs_Improvement` - Low performance

**Use Case:** Filter branches by performance level

### Branch_ID
**Type:** String  
**Format:** `BR-XXXXX`  
**Example:** `BR-20101`  
**Use Case:** Unique identifier for branches

### District
**Type:** String  
**Examples:** `Al Murabba`, `Al Nakheel`, `Al Narjis`  
**Use Case:** Geographic filtering and location queries

### Monthly Metrics
- `Monthly_Customer_Visits` - Footfall count
- `Monthly_Transactions` - Transaction volume
- `Monthly_Deposits_SAR` - Deposit volume
- `Monthly_Revenue_SAR` - Revenue generated
- `Monthly_Operating_Cost_SAR` - Operating expenses
- `Net_Profit_Loss_SAR` - Profit/loss

**Use Case:** Business analytics and reporting

---

## 🎯 Sample Queries for Branch Search

```
User: "Show me strong performing branches in Riyadh"
Intent: FIND_BRANCHES_BY_PERFORMANCE
Filter: Performance_Status = "Strong"
Result: List of all strong-performing branches

User: "Which branch has the most customer visits?"
Intent: FIND_BRANCH_BY_METRIC
Filter: MAX(Monthly_Customer_Visits)
Result: Top-performing branch by footfall

User: "Find branch in Al Nakheel"
Intent: FIND_BRANCH_BY_LOCATION
Filter: District = "Al Nakheel"
Result: Al Nakheel branch details

User: "Show branches with highest revenue"
Intent: FIND_BRANCH_BY_METRIC
Filter: ORDER BY Monthly_Revenue_SAR DESC
Result: Top revenue-generating branches

User: "Which branches need improvement?"
Intent: FIND_BRANCHES_BY_STATUS
Filter: Performance_Status = "Needs_Improvement"
Result: Underperforming branches
```

---

## 🔄 Voice Agent Integration Steps

### Step 1: Update ATMDataService to Include Branches

**File:** `src/app/features/local_banking_vioce_agent/atm-data.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface BranchLocation {
  Branch_ID: string;
  Bank_Name: string;
  Branch_Name: string;
  District: string;
  Monthly_Customer_Visits: number;
  Monthly_Transactions: number;
  Monthly_Deposits_SAR: number;
  Monthly_Revenue_SAR: number;
  Monthly_Operating_Cost_SAR: number;
  Net_Profit_Loss_SAR: number;
  Performance_Status: "Strong" | "Average" | "Needs_Improvement";
  Data_Type: string;
  As_Of_Date: string;
  Location_Type: string;
  Data_Status: string;
}

export interface ATMLocation {
  id: string;
  name: string;
  type: "ATM";
  district: string;
  address: string;
  services: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ATMDataService {
  private branchLocations: BranchLocation[] = [];
  private atmLocations: ATMLocation[] = [];
  
  private branchLocationsSubject = new BehaviorSubject<BranchLocation[]>([]);
  public branchLocations$ = this.branchLocationsSubject.asObservable();
  
  private atmLocationsSubject = new BehaviorSubject<ATMLocation[]>([]);
  public atmLocations$ = this.atmLocationsSubject.asObservable();

  constructor() {
    this.loadBranchLocations();
    this.loadATMLocations();
  }

  // Load branches from GeoJSON
  loadBranchLocations(): void {
    // Implementation will load from public/geojson/Riyadh_Branch_Locations.geojson
    // Convert GeoJSON features to BranchLocation array
    this.branchLocationsSubject.next(this.branchLocations);
  }

  // Load ATMs from GeoJSON
  loadATMLocations(): void {
    // Implementation will load from public/geojson/Riyadh_ATM_Locations.geojson
    this.atmLocationsSubject.next(this.atmLocations);
  }

  // Find branches by performance status
  findBranchesByPerformance(status: string): BranchLocation[] {
    return this.branchLocations.filter(
      branch => branch.Performance_Status.toLowerCase() === status.toLowerCase()
    );
  }

  // Find branches by district
  findBranchesByDistrict(district: string): BranchLocation[] {
    return this.branchLocations.filter(
      branch => branch.District.toLowerCase().includes(district.toLowerCase())
    );
  }

  // Find top performing branches
  getTopPerformingBranches(limit: number = 5): BranchLocation[] {
    return this.branchLocations
      .filter(b => b.Performance_Status === "Strong")
      .sort((a, b) => b.Monthly_Revenue_SAR - a.Monthly_Revenue_SAR)
      .slice(0, limit);
  }

  // Find nearest ATM to location
  findNearestATM(lat: number, lng: number): ATMLocation {
    // Haversine distance calculation
    // Returns closest ATM
  }

  // Find nearest branch to location
  findNearestBranch(lat: number, lng: number): BranchLocation {
    // Haversine distance calculation
    // Returns closest branch
  }

  // Get all branches
  getAllBranches(): BranchLocation[] {
    return this.branchLocations;
  }

  // Get all ATMs
  getAllATMs(): ATMLocation[] {
    return this.atmLocations;
  }
}
```

---

### Step 2: Update NaturalLanguageQueryService

**File:** `src/app/features/local_banking_vioce_agent/natural-language-query.service.ts`

Add branch-related intent detection:

```typescript
private detectBranchIntents(query: string): string {
  const lowerQuery = query.toLowerCase();
  
  // Branch-specific intents
  if (lowerQuery.includes('branch')) {
    if (lowerQuery.includes('strong') || lowerQuery.includes('best')) {
      return 'FIND_STRONG_BRANCHES';
    }
    if (lowerQuery.includes('improvement') || lowerQuery.includes('low')) {
      return 'FIND_WEAK_BRANCHES';
    }
    if (lowerQuery.includes('nearest') || lowerQuery.includes('closest')) {
      return 'FIND_NEAREST_BRANCH';
    }
    if (lowerQuery.includes('revenue') || lowerQuery.includes('highest')) {
      return 'FIND_BRANCHES_BY_REVENUE';
    }
    if (lowerQuery.includes('customer') || lowerQuery.includes('visits')) {
      return 'FIND_BRANCHES_BY_FOOTFALL';
    }
    return 'FIND_BRANCH_BY_LOCATION';
  }
  
  return 'UNKNOWN_INTENT';
}

// Extract location/district from query
private extractDistrict(query: string): string {
  const districts = ['Al Murabba', 'Al Nakheel', 'Al Narjis', ...];
  // Match and return district from query
}

// Extract performance criteria
private extractPerformanceStatus(query: string): string {
  const lowerQuery = query.toLowerCase();
  if (lowerQuery.includes('strong') || lowerQuery.includes('best')) {
    return 'Strong';
  }
  if (lowerQuery.includes('average') || lowerQuery.includes('medium')) {
    return 'Average';
  }
  if (lowerQuery.includes('improvement') || lowerQuery.includes('weak')) {
    return 'Needs_Improvement';
  }
  return null;
}
```

---

### Step 3: Update Voice Search Service

**File:** `src/app/features/local_banking_vioce_agent/voice-search.service.ts`

Add branch search result handling:

```typescript
async handleBranchQuery(intent: string, filters: any): Promise<QueryResult> {
  switch (intent) {
    case 'FIND_STRONG_BRANCHES':
      return this.atmDataService.findBranchesByPerformance('Strong');
      
    case 'FIND_WEAK_BRANCHES':
      return this.atmDataService.findBranchesByPerformance('Needs_Improvement');
      
    case 'FIND_BRANCH_BY_LOCATION':
      return this.atmDataService.findBranchesByDistrict(filters.district);
      
    case 'FIND_NEAREST_BRANCH':
      return this.atmDataService.findNearestBranch(
        filters.userLat, 
        filters.userLng
      );
      
    case 'FIND_BRANCHES_BY_REVENUE':
      return this.atmDataService.getTopPerformingBranches(5);
      
    default:
      return [];
  }
}
```

---

### Step 4: Update Component to Display Branch Results

**File:** `src/app/features/local_banking_vioce_agent/local_banking_vioce_agent.component.ts`

```typescript
processBranchResults(branches: BranchLocation[]): void {
  // Display branch results in table
  this.displayResults = branches.map(branch => ({
    id: branch.Branch_ID,
    name: branch.Branch_Name,
    district: branch.District,
    performance: branch.Performance_Status,
    visits: branch.Monthly_Customer_Visits,
    revenue: branch.Monthly_Revenue_SAR,
    transactions: branch.Monthly_Transactions,
    type: 'BRANCH'
  }));
  
  // Highlight on map
  this.mapService.highlightBranches(branches);
}
```

---

## 📋 Branch Properties Reference Table

| Property | Type | Example | Purpose |
|----------|------|---------|---------|
| `Branch_ID` | String | BR-20101 | Unique identifier |
| `Branch_Name` | String | Al Murabba Demo Branch | Display name |
| `District` | String | Al Murabba | Location filtering |
| `Performance_Status` | String | Strong | Search & filter |
| `Monthly_Customer_Visits` | Number | 5346 | Footfall metric |
| `Monthly_Transactions` | Number | 25985 | Transaction volume |
| `Monthly_Deposits_SAR` | Number | 21716449.56 | Deposit metric |
| `Monthly_Revenue_SAR` | Number | 273133.36 | Revenue metric |
| `Monthly_Operating_Cost_SAR` | Number | 91375.97 | Cost metric |
| `Net_Profit_Loss_SAR` | Number | 181757.39 | Profitability |
| `As_Of_Date` | String | 2026-10-01 | Data currency |
| `Data_Status` | String | SYNTHETIC | Data origin |

---

## 🗺️ Map Integration

### Branch Markers on Map

```typescript
// Different colors for different performance levels
const branchColors = {
  'Strong': '#00AA00',        // Green
  'Average': '#FFAA00',       // Orange
  'Needs_Improvement': '#CC0000' // Red
};

// Add branch markers to map
branches.forEach(branch => {
  const marker = new esri.Graphic({
    geometry: {
      type: 'point',
      longitude: coordinates[0],
      latitude: coordinates[1]
    },
    symbol: {
      type: 'simple-marker',
      color: branchColors[branch.Performance_Status],
      size: 10,
      outline: { color: 'white', width: 2 }
    },
    popupTemplate: {
      title: branch.Branch_Name,
      content: `
        <b>Performance:</b> ${branch.Performance_Status}<br>
        <b>Visits:</b> ${branch.Monthly_Customer_Visits}<br>
        <b>Revenue:</b> ${branch.Monthly_Revenue_SAR.toFixed(2)} SAR<br>
        <b>Profit:</b> ${branch.Net_Profit_Loss_SAR.toFixed(2)} SAR
      `
    }
  });
  
  map.add(marker);
});
```

---

## 🎤 Voice Query Examples

### Query: "Show me strong performing branches"

```
Input:  "Show me strong performing branches"
↓
Intent Recognition: FIND_STRONG_BRANCHES
↓
Filter Applied: Performance_Status = "Strong"
↓
Results: 8 strong branches
↓
Output: 
  ✓ Al Murabba Demo Branch (5,346 monthly visits)
  ✓ Al Nakheel Demo Branch (4,328 monthly visits)
  ✓ [6 more...]
↓
Map Action: Highlight all strong branches in GREEN
```

### Query: "Which branch has the highest revenue?"

```
Input:  "Which branch has the highest revenue?"
↓
Intent Recognition: FIND_BRANCHES_BY_REVENUE
↓
Processing: Sort by Monthly_Revenue_SAR DESC
↓
Results: Top 5 branches by revenue
↓
Output:
  1. Branch Name (SAR 850,000+)
  2. Branch Name (SAR 780,000+)
  [...]
↓
Map Action: Center on top branch, show info popup
```

### Query: "Find branches in Al Nakheel"

```
Input:  "Find branches in Al Nakheel"
↓
District Extraction: "Al Nakheel"
↓
Intent Recognition: FIND_BRANCH_BY_LOCATION
↓
Filter Applied: District = "Al Nakheel"
↓
Results: 2 branches in Al Nakheel
↓
Output:
  Al Nakheel Demo Branch (Strong performance)
  Al Nakheel Secondary Branch (Average)
↓
Map Action: Center map on Al Nakheel, highlight branches
```

---

## 📈 Performance Metrics Display

When displaying branch data, show:

```
Branch Performance Card:
┌─────────────────────────────────────┐
│ Branch Name                         │
│ District: Al Murabba                │
│ Status: ✅ Strong                   │
├─────────────────────────────────────┤
│ Monthly Metrics:                    │
│ • Visits: 5,346                     │
│ • Transactions: 25,985              │
│ • Revenue: 273,133.36 SAR           │
│ • Profit: 181,757.39 SAR            │
└─────────────────────────────────────┘
```

---

## 🔄 Data Flow: Branch Query

```
USER QUERY
    ↓
"Find strong branches in Al Nakheel"
    ↓
VOICE CAPTURE
    ↓
VoiceSearchService.captureVoiceInput()
    ↓
Speech-to-Text Conversion
    ↓
"Find strong branches in Al Nakheel"
    ↓
INTENT DETECTION
    ↓
NaturalLanguageQueryService.parseQuery()
    ├─ Intent: FIND_STRONG_BRANCHES
    ├─ Filter: Performance_Status = "Strong"
    └─ Location: District = "Al Nakheel"
    ↓
DATA RETRIEVAL
    ↓
ATMDataService.findBranchesByPerformance("Strong")
    + ATMDataService.findBranchesByDistrict("Al Nakheel")
    ↓
RESULT PROCESSING
    ↓
Load Riyadh_Branch_Locations.geojson
Apply filters
Calculate distances
Return matching branches
    ↓
MAP HIGHLIGHTING
    ↓
MapService.highlightBranches(results)
Add markers with performance colors
Display popup on click
    ↓
RESULT DISPLAY
    ↓
Component renders table:
  Branch_Name | District | Performance | Revenue | Profit
    ↓
VOICE RESPONSE
    ↓
"Found 2 strong branches in Al Nakheel:
 1. Al Nakheel Demo Branch
    Revenue: 278,765 SAR
    Profit: 240,654 SAR
 2. [Next branch]..."
```

---

## ✅ Implementation Checklist

- [ ] Update ATMDataService with branch interfaces
- [ ] Add loadBranchLocations() method
- [ ] Implement branch search methods
- [ ] Update NaturalLanguageQueryService with branch intents
- [ ] Add Performance_Status detection in query parsing
- [ ] Update VoiceSearchService with branch handling
- [ ] Update component to display branch results
- [ ] Add branch markers to map with color coding
- [ ] Create branch info popups
- [ ] Test all branch query types
- [ ] Update documentation with branch queries
- [ ] Add branch performance legend on map
- [ ] Test voice input for branch queries

---

## 🎯 Success Criteria

✅ User can search for branches by performance status  
✅ User can find branches by district/location  
✅ User can ask for top-performing branches  
✅ Branch data displays on map with color coding  
✅ Voice agent responds with branch information  
✅ Results include financial metrics  
✅ Map highlights matching branches  
✅ All voice queries return accurate results  

---

## 📞 Quick Reference

**File to Modify:** `src/app/features/local_banking_vioce_agent/`  
**Data Source:** `public/geojson/Riyadh_Branch_Locations.geojson`  
**Key Property:** `Performance_Status` ("Strong", "Average", "Needs_Improvement")  
**Integration Points:** 
- ATMDataService (data loading)
- NaturalLanguageQueryService (intent detection)
- VoiceSearchService (query processing)
- MapService (visualization)

---

**Ready to implement! Let me know if you need help with any specific step.**

Generated: October 27, 2026
