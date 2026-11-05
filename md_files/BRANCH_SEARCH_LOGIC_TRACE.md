# Branch Search Implementation - Detailed Logic Trace

## Example 1: "Show strong branches"

### Step 1: Query Parsing
```typescript
question = "Show strong branches"
normalizedQuestion = "show strong branches"

// In NaturalLanguageQueryService.parse()
target = resolveTarget("show strong branches")
  // No /\batm\b/ match, has /\bbranch\b/ match → target = "branch"
  
category = extractCategory("show strong branches")
  // Checks: "strong", "weak", "moderate", "profit", "loss", etc.
  // MATCH: "strong" found in normalized question
  // Returns: "strong"

isPerformanceStatus("strong")
  // Checks if "strong" is in ["strong", "weak", "moderate"]
  // Returns: true
  
// Since target="branch" (explicit), no change needed
// But if it was "either", it would become "branch" here
```

### Step 2: Query Response
```typescript
// In AtmDataService.runNaturalLanguageQuery()
query = {
  intent: "filter",      // or "show-all" depending on other conditions
  target: "branch",
  districtNames: [],
  category: "strong",
  originalQuestion: "Show strong branches"
}

sourceRecords = pickRecords("branch")
  // Returns: this.branchRecords (all ~30 branch records)

matched = sourceRecords  // All branch records
```

### Step 3: Category Filtering
```typescript
// Since query.category = "strong"
needle = normalizeText("strong")
  // Result: "strong"

matched = matched.filter((record) => {
  category = normalizeText(record.category)     // e.g., "Branch"
  performance = normalizeText(record.performanceStatus)  // e.g., "Strong"
  
  return category.includes(needle) || performance.includes(needle)
})

// For each record:
// Record 1: performanceStatus="Strong" → performance="strong" → MATCH ✓
// Record 2: performanceStatus="Weak" → performance="weak" → NO MATCH ✗
// Record 3: performanceStatus="Moderate" → performance="moderate" → NO MATCH ✗
// Record 4: performanceStatus="Strong" → performance="strong" → MATCH ✓
// ...

// Result: All records with Performance_Status="Strong"
```

### Step 4: Response Building
```typescript
return {
  intent: "filter",
  matchedRecords: [BR-20101, BR-20102, BR-20105, BR-20108, ...],  // All strong branches
  count: 12,  // Example count
  appliedFilters: { category: "strong" },
  message: "12 matching branch records found."
}
```

### Step 5: UI Display
```html
<!-- Table shows all 12 strong branch records -->
<tr>
  <td>branch</td>
  <td>BR-20101</td>
  <td>Al Murabba Demo Branch</td>
  <td>Al Murabba</td>
  <td>Strong</td>
  <td><button>Zoom</button></td>
</tr>
<!-- ... more rows ... -->
```

---

## Example 2: "Show weak branches"

Same flow as Example 1, but:
- `extractCategory()` finds "weak"
- `isPerformanceStatus("weak")` returns true
- Filter matches records where `performanceStatus="Weak"`
- Result: All records with Performance_Status="Weak"

---

## Example 3: "Show moderate branches"

Same flow as Example 1, but:
- `extractCategory()` finds "moderate"
- `isPerformanceStatus("moderate")` returns true
- Filter matches records where `performanceStatus="Moderate"`
- Result: All records with Performance_Status="Moderate"

---

## Example 4: "Show strong branches in Al Murabba"

### Step 1: Query Parsing
```typescript
question = "Show strong branches in Al Murabba"
normalizedQuestion = "show strong branches in al murabba"

target = "branch"  // From explicit "branch" keyword

category = "strong"  // From extractCategory()

districtNames = resolveDistricts(...)
  // Matches "al murabba" against knownDistricts
  // Returns: ["Al Murabba"]
```

### Step 2: Filtering
```typescript
// First filter by district
matched = matched.filter((record) => {
  return "al murabba".has("al murabba")  // Normalized comparison
})
// Result: All branch records in Al Murabba district

// Then filter by category/performance
needle = "strong"
matched = matched.filter((record) => {
  performance = "strong" (for strong branches)
  return performance.includes("strong")  // true
})

// Final result: All strong branches in Al Murabba district
```

---

## Example 5: "How many weak branches in Al Olaya?"

### Step 1: Query Parsing
```typescript
target = "branch"
category = "weak"
districtNames = ["Al Olaya"]
intent = "count"  // From isCountIntent()
```

### Step 2: Message Generation
```typescript
return {
  intent: "count",
  matchedRecords: [BR-20XX, BR-20YY, ...],  // Weak branches in Al Olaya
  count: 3,  // Example
  appliedFilters: { districts: ["Al Olaya"], category: "weak" },
  message: "3 matching branch records found."
}
```

---

## Key Points in Implementation

### 1. Performance Status Recognition
```typescript
// In natural-language-query.service.ts
private extractCategory(normalizedQuestion: string): string | undefined {
  const performanceStatusValues = ["strong", "weak", "moderate"];
  const atmCategories = ["profit", "loss", "break even", ...];
  const allCategories = [...performanceStatusValues, ...atmCategories];
  
  return allCategories.find((item) => 
    normalizedQuestion.includes(this.normalize(item))
  );
}
```

### 2. Smart Target Resolution
```typescript
// If performance status detected, automatically target branches
if (category && this.isPerformanceStatus(category) && target === "either") {
  target = "branch";
}
```

### 3. Filtering Logic
```typescript
// In atm-data.service.ts
if (query.category) {
  const needle = this.normalizeText(query.category);
  matched = matched.filter((record) => {
    const category = this.normalizeText(record.category);
    const performance = this.normalizeText(record.performanceStatus);
    return category.includes(needle) || performance.includes(needle);
  });
  appliedFilters["category"] = query.category;
}
```

### 4. Data Mapping
```typescript
// In atm-data.service.ts toLocationRecord()
performanceStatus: this.readString(props, ["Performance_Status"])
// Reads "Performance_Status" from GeoJSON and maps to performanceStatus
```

---

## Text Normalization Examples

```typescript
normalizeText("Strong")
  → toLowerCase() → "strong"
  → NFKD normalize → "strong"
  → replace special chars → "strong"
  → replace whitespace → "strong"
  Result: "strong"

normalizeText("Performance_Status")
  → toLowerCase() → "performance_status"
  → NFKD normalize → "performance_status"
  → replace special chars → "performance status"  // underscore replaced with space
  → replace whitespace → "performance status"
  Result: "performance status"

normalizeText("Branch")
  → "branch"

// Matching logic:
"branch".includes("strong") = false
"strong".includes("strong") = true  ✓
```

---

## Flow Diagram

```
User Query: "Show strong branches"
        ↓
Parse Query
├─ Extract Target: "branch" ✓
├─ Extract Category: "strong" ✓
└─ Resolve Districts: [] (none specified)
        ↓
Is Performance Status?
└─ isPerformanceStatus("strong") = true ✓
        ↓
Pick Records by Target
└─ pickRecords("branch") → returns branchRecords array
        ↓
Apply Filters
├─ Districts: (none) → no filtering
├─ Category/Performance: normalize and match
│  └─ For each branch:
│     └─ If performanceStatus.includes("strong") → INCLUDE
└─ Result: filtered list of strong branches
        ↓
Build Response
└─ intent: "filter"
   matchedRecords: [strong branches]
   count: N
   message: "N matching branch records found."
        ↓
Display in Component
└─ Render table with results
   Highlight on map
   Update status message
```

---

## Verification Checklist

- ✅ Performance status values recognized: "strong", "weak", "moderate"
- ✅ Target correctly set to "branch" when performance status detected
- ✅ Filter correctly matches performanceStatus field
- ✅ Text normalization handles case and special characters
- ✅ District filtering works in combination with performance status
- ✅ Count intent works with performance status filters
- ✅ All branch records loaded from GeoJSON
- ✅ Results displayed in UI table
- ✅ No hardcoded district restrictions

---

## Testing Commands

Try these queries in the voice agent:

1. "strong branches"
2. "weak branches"
3. "moderate branches"
4. "show all strong branches"
5. "strong branches in Al Murabba"
6. "how many weak branches?"
7. "weak branches in Al Olaya"
8. "moderate"
9. "Find strong branches"
10. "Show me weak branches"

All should return appropriate branch results matching the performance status.
