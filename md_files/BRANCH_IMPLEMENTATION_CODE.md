# Branch Search - Quick Implementation Guide

**Status:** Ready to code  
**Priority:** High  
**Files to Update:** 3 service files

---

## 🚀 Implementation Steps

### STEP 1: Update ATM Data Service

**File:** `src/app/features/local_banking_vioce_agent/atm-data.service.ts`

**Add these imports and interfaces:**

```typescript
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

// Branch interface
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
  Performance_Status: 'Strong' | 'Average' | 'Needs_Improvement';
  Data_Type: string;
  As_Of_Date: string;
  Location_Type: string;
  Data_Status: string;
}

// ATM interface
export interface ATMLocation {
  id: string;
  name: string;
  type: 'ATM';
  district: string;
  address: string;
  services: string[];
}

@Injectable({ providedIn: 'root' })
export class ATMDataService {
  private branchLocations: BranchLocation[] = [];
  private atmLocations: ATMLocation[] = [];

  constructor(private http: HttpClient) {
    this.loadBranchLocations();
    this.loadATMLocations();
  }

  // Load branches from GeoJSON file
  async loadBranchLocations(): Promise<void> {
    try {
      const response = await this.http
        .get('assets/geojson/Riyadh_Branch_Locations.geojson')
        .toPromise();
      
      if (response && response.features) {
        this.branchLocations = response.features.map(feature => ({
          ...feature.properties,
          geometry: feature.geometry
        }));
      }
    } catch (error) {
      console.error('Error loading branch locations:', error);
    }
  }

  // Load ATMs from GeoJSON file
  async loadATMLocations(): Promise<void> {
    try {
      const response = await this.http
        .get('assets/geojson/Riyadh_ATM_Locations.geojson')
        .toPromise();
      
      if (response && response.features) {
        this.atmLocations = response.features.map(feature => ({
          ...feature.properties,
          geometry: feature.geometry
        }));
      }
    } catch (error) {
      console.error('Error loading ATM locations:', error);
    }
  }

  // ========== BRANCH SEARCH METHODS ==========

  /**
   * Find branches by performance status
   * @param status 'Strong' | 'Average' | 'Needs_Improvement'
   */
  findBranchesByPerformance(status: string): BranchLocation[] {
    return this.branchLocations.filter(
      branch => branch.Performance_Status === status
    );
  }

  /**
   * Find branches by district
   */
  findBranchesByDistrict(district: string): BranchLocation[] {
    return this.branchLocations.filter(
      branch => branch.District.toLowerCase().includes(district.toLowerCase())
    );
  }

  /**
   * Find branches by both performance and district
   */
  findBranchesByPerformanceAndLocation(
    performance: string,
    district: string
  ): BranchLocation[] {
    return this.branchLocations.filter(
      branch =>
        branch.Performance_Status === performance &&
        branch.District.toLowerCase().includes(district.toLowerCase())
    );
  }

  /**
   * Get top performing branches sorted by revenue
   */
  getTopPerformingBranches(limit: number = 5): BranchLocation[] {
    return this.branchLocations
      .filter(b => b.Performance_Status === 'Strong')
      .sort((a, b) => b.Monthly_Revenue_SAR - a.Monthly_Revenue_SAR)
      .slice(0, limit);
  }

  /**
   * Get branches sorted by monthly customer visits
   */
  getBranchesByFootfall(limit: number = 5): BranchLocation[] {
    return this.branchLocations
      .sort((a, b) => b.Monthly_Customer_Visits - a.Monthly_Customer_Visits)
      .slice(0, limit);
  }

  /**
   * Get branches needing improvement
   */
  getUnderperformingBranches(): BranchLocation[] {
    return this.branchLocations.filter(
      b => b.Performance_Status === 'Needs_Improvement'
    );
  }

  /**
   * Find nearest branch to coordinates (Haversine)
   */
  findNearestBranch(userLat: number, userLng: number): BranchLocation | null {
    if (this.branchLocations.length === 0) return null;

    let nearest = this.branchLocations[0];
    let minDistance = this.calculateDistance(
      userLat,
      userLng,
      nearest.geometry?.coordinates[1] || 0,
      nearest.geometry?.coordinates[0] || 0
    );

    this.branchLocations.forEach(branch => {
      const distance = this.calculateDistance(
        userLat,
        userLng,
        branch.geometry?.coordinates[1] || 0,
        branch.geometry?.coordinates[0] || 0
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearest = branch;
      }
    });

    return nearest;
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // ========== ATM SEARCH METHODS ==========

  /**
   * Find nearest ATM to coordinates
   */
  findNearestATM(userLat: number, userLng: number): ATMLocation | null {
    if (this.atmLocations.length === 0) return null;

    let nearest = this.atmLocations[0];
    let minDistance = this.calculateDistance(
      userLat,
      userLng,
      nearest.geometry?.coordinates[1] || 0,
      nearest.geometry?.coordinates[0] || 0
    );

    this.atmLocations.forEach(atm => {
      const distance = this.calculateDistance(
        userLat,
        userLng,
        atm.geometry?.coordinates[1] || 0,
        atm.geometry?.coordinates[0] || 0
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearest = atm;
      }
    });

    return nearest;
  }

  /**
   * Get all branches
   */
  getAllBranches(): BranchLocation[] {
    return this.branchLocations;
  }

  /**
   * Get all ATMs
   */
  getAllATMs(): ATMLocation[] {
    return this.atmLocations;
  }
}
```

---

### STEP 2: Update Natural Language Query Service

**File:** `src/app/features/local_banking_vioce_agent/natural-language-query.service.ts`

**Add these methods:**

```typescript
/**
 * Detect branch-related intents
 */
detectBranchIntent(query: string): string {
  const lowerQuery = query.toLowerCase();

  if (!lowerQuery.includes('branch')) {
    return null;
  }

  // Strong performing branches
  if (
    lowerQuery.includes('strong') ||
    lowerQuery.includes('best') ||
    lowerQuery.includes('top') ||
    lowerQuery.includes('high performance')
  ) {
    return 'FIND_STRONG_BRANCHES';
  }

  // Weak performing branches
  if (
    lowerQuery.includes('improvement') ||
    lowerQuery.includes('weak') ||
    lowerQuery.includes('poor') ||
    lowerQuery.includes('low performance')
  ) {
    return 'FIND_WEAK_BRANCHES';
  }

  // Branch by revenue
  if (
    lowerQuery.includes('revenue') ||
    lowerQuery.includes('highest earning') ||
    lowerQuery.includes('most profitable')
  ) {
    return 'FIND_BRANCHES_BY_REVENUE';
  }

  // Branch by footfall/visits
  if (
    lowerQuery.includes('customer visits') ||
    lowerQuery.includes('footfall') ||
    lowerQuery.includes('most visited')
  ) {
    return 'FIND_BRANCHES_BY_FOOTFALL';
  }

  // Nearest branch
  if (
    lowerQuery.includes('nearest') ||
    lowerQuery.includes('closest') ||
    lowerQuery.includes('near me')
  ) {
    return 'FIND_NEAREST_BRANCH';
  }

  // Default: find by location
  return 'FIND_BRANCH_BY_LOCATION';
}

/**
 * Extract district/location from query
 */
extractDistrict(query: string): string {
  const districts = [
    'Al Murabba',
    'Al Nakheel',
    'Al Narjis',
    'Al Suwaidi',
    'Al Qusour',
    // Add all other districts from the data
  ];

  for (const district of districts) {
    if (
      query.toLowerCase().includes(district.toLowerCase())
    ) {
      return district;
    }
  }

  return null;
}

/**
 * Extract performance criteria from query
 */
extractPerformanceStatus(query: string): string {
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes('strong') || lowerQuery.includes('best')) {
    return 'Strong';
  }

  if (lowerQuery.includes('average') || lowerQuery.includes('medium')) {
    return 'Average';
  }

  if (
    lowerQuery.includes('improvement') ||
    lowerQuery.includes('weak') ||
    lowerQuery.includes('poor')
  ) {
    return 'Needs_Improvement';
  }

  return null;
}

/**
 * Parse complete branch query
 */
parseBranchQuery(
  query: string
): {
  intent: string;
  performance?: string;
  district?: string;
} {
  const intent = this.detectBranchIntent(query);
  const performance = this.extractPerformanceStatus(query);
  const district = this.extractDistrict(query);

  return {
    intent,
    ...(performance && { performance }),
    ...(district && { district }),
  };
}
```

---

### STEP 3: Update Component

**File:** `src/app/features/local_banking_vioce_agent/local_banking_vioce_agent.component.ts`

**Add this method:**

```typescript
/**
 * Handle branch search based on voice query
 */
async handleBranchQuery(parsedQuery: any): Promise<any[]> {
  const { intent, performance, district } = parsedQuery;
  let results: BranchLocation[] = [];

  switch (intent) {
    case 'FIND_STRONG_BRANCHES':
      if (district) {
        results = this.atmDataService.findBranchesByPerformanceAndLocation(
          'Strong',
          district
        );
      } else {
        results = this.atmDataService.findBranchesByPerformance('Strong');
      }
      this.voiceResponse = `Found ${results.length} strong performing branches`;
      break;

    case 'FIND_WEAK_BRANCHES':
      results = this.atmDataService.getUnderperformingBranches();
      this.voiceResponse = `Found ${results.length} branches needing improvement`;
      break;

    case 'FIND_BRANCH_BY_LOCATION':
      if (district) {
        results = this.atmDataService.findBranchesByDistrict(district);
        this.voiceResponse = `Found ${results.length} branches in ${district}`;
      }
      break;

    case 'FIND_BRANCHES_BY_REVENUE':
      results = this.atmDataService.getTopPerformingBranches(5);
      this.voiceResponse = 'Top 5 branches by revenue';
      break;

    case 'FIND_BRANCHES_BY_FOOTFALL':
      results = this.atmDataService.getBranchesByFootfall(5);
      this.voiceResponse = 'Top 5 branches by customer visits';
      break;

    case 'FIND_NEAREST_BRANCH':
      const nearest = this.atmDataService.findNearestBranch(
        this.userLat,
        this.userLng
      );
      results = nearest ? [nearest] : [];
      this.voiceResponse = nearest
        ? `Nearest branch is ${nearest.Branch_Name}`
        : 'No branches found';
      break;
  }

  // Display results
  if (results.length > 0) {
    this.displayBranchResults(results);
    this.mapService.highlightBranches(results);
  }

  return results;
}

/**
 * Display branch results in table
 */
displayBranchResults(branches: BranchLocation[]): void {
  this.displayResults = branches.map(branch => ({
    id: branch.Branch_ID,
    name: branch.Branch_Name,
    district: branch.District,
    performance: branch.Performance_Status,
    visits: branch.Monthly_Customer_Visits,
    revenue: `${(branch.Monthly_Revenue_SAR / 1000).toFixed(0)}K`,
    profit: `${(branch.Net_Profit_Loss_SAR / 1000).toFixed(0)}K`,
    type: 'BRANCH',
  }));
}
```

---

## 📊 Test Cases

### Test 1: Find Strong Branches
```
Input:  "Show strong performing branches"
Expected: List of all branches with Performance_Status = "Strong"
Verify: Results shown in table + highlighted on map (GREEN)
```

### Test 2: Find Branches by Location
```
Input:  "Find branches in Al Nakheel"
Expected: All branches in Al Nakheel district
Verify: Results show district = "Al Nakheel"
```

### Test 3: Top Revenue Branches
```
Input:  "Which branches have highest revenue"
Expected: Top 5 branches sorted by Monthly_Revenue_SAR (descending)
Verify: First result has highest revenue value
```

### Test 4: Nearest Branch
```
Input:  "Find nearest branch"
Expected: Single branch closest to user location
Verify: Calculate distance and verify correct branch returned
```

### Test 5: Weak Branches
```
Input:  "Which branches need improvement"
Expected: All branches with Performance_Status = "Needs_Improvement"
Verify: Results shown with red markers on map
```

---

## 🎨 Map Color Coding

```typescript
const performanceColors = {
  'Strong': '#00AA00',              // Green
  'Average': '#FFAA00',             // Orange
  'Needs_Improvement': '#CC0000'    // Red
};
```

---

## 📝 Sample Output

### Query: "Show strong branches in Al Murabba"

**Console Output:**
```
Processing query: "Show strong branches in Al Murabba"
Detected Intent: FIND_STRONG_BRANCHES
Extracted Performance: Strong
Extracted District: Al Murabba
Applying filters...
  ✓ Performance_Status = "Strong"
  ✓ District = "Al Murabba"
Results: 1 branch found
  - BR-20101: Al Murabba Demo Branch
    Performance: Strong
    Monthly Revenue: 273,133.36 SAR
    Monthly Profit: 181,757.39 SAR
    Customer Visits: 5,346
```

**Voice Response:**
```
"Found 1 strong performing branch in Al Murabba: 
Al Murabba Demo Branch with monthly revenue of 273 thousand SAR"
```

**Table Display:**
```
┌─────────────────────────────────────────────────────────────┐
│ Branch Name          │ District   │ Performance │ Revenue   │
├─────────────────────────────────────────────────────────────┤
│ Al Murabba Demo      │ Al Murabba │ Strong ✅   │ 273K SAR  │
└─────────────────────────────────────────────────────────────┘
```

**Map:**
```
Map centered on Al Murabba with green marker for the branch
Popup shows: "Al Murabba Demo Branch - Strong"
```

---

## ✅ Verification Steps

1. **Data Loading:**
   - [ ] Riyadh_Branch_Locations.geojson loads successfully
   - [ ] Branch data populated in service
   - [ ] All 30+ branches loaded

2. **Query Processing:**
   - [ ] Intent detection working
   - [ ] District extraction working
   - [ ] Performance status detection working

3. **Results:**
   - [ ] Branches displayed in table
   - [ ] Correct filtering applied
   - [ ] Financial metrics visible

4. **Map Integration:**
   - [ ] Branches displayed as markers
   - [ ] Color coding applied correctly
   - [ ] Popups show branch info

5. **Voice:**
   - [ ] Voice responses generated
   - [ ] Information accurate
   - [ ] Audio played correctly

---

## 🐛 Debugging Tips

**Check if branches loading:**
```typescript
console.log('Branches loaded:', this.atmDataService.getAllBranches());
```

**Test performance filter:**
```typescript
console.log('Strong branches:', 
  this.atmDataService.findBranchesByPerformance('Strong'));
```

**Test location filter:**
```typescript
console.log('Al Murabba branches:', 
  this.atmDataService.findBranchesByDistrict('Al Murabba'));
```

**Test combined filter:**
```typescript
console.log('Strong in Al Murabba:', 
  this.atmDataService.findBranchesByPerformanceAndLocation('Strong', 'Al Murabba'));
```

---

**Ready to implement! Good luck! 🚀**
