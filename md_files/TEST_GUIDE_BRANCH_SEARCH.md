# Branch Search Implementation - Testing Guide

## Pre-Test Checklist

- [ ] Application builds successfully
- [ ] No TypeScript compilation errors related to natural-language-query.service.ts
- [ ] Application runs in browser without console errors
- [ ] GeoJSON files are accessible:
  - [ ] public/geojson/Riyadh_Branch_Locations.geojson
  - [ ] public/geojson/Riyadh_ATM_Locations.geojson

---

## Test Suite 1: Basic Performance Status Queries

### Test 1.1: Strong Branches Query
```
Input: "strong branches"
Expected Behavior:
  - Intent: filter or show-all
  - Target: branch
  - Matched Records: ~13 branches
  - All records should have Performance_Status = "Strong"
  - Message: Should show count of matching records
  
Verification Steps:
  1. Enter query text or speak "strong branches"
  2. Check status message shows a non-zero count
  3. Verify table displays branch records
  4. Verify all branches shown have "Strong" in performance column
  5. Check map highlights show correct locations
```

### Test 1.2: Weak Branches Query
```
Input: "weak branches"
Expected Behavior:
  - Intent: filter or show-all
  - Target: branch
  - Matched Records: ~10 branches
  - All records should have Performance_Status = "Weak"
  
Verification Steps:
  1. Enter query text or speak "weak branches"
  2. Check status message shows a non-zero count (~10)
  3. Verify table displays branch records
  4. Verify all branches shown have "Weak" in performance
  5. Compare with previous test - should be different branches
```

### Test 1.3: Moderate Branches Query
```
Input: "moderate branches"
Expected Behavior:
  - Intent: filter or show-all
  - Target: branch
  - Matched Records: ~7 branches
  - All records should have Performance_Status = "Moderate"
  
Verification Steps:
  1. Enter query text or speak "moderate branches"
  2. Check status message shows count (~7)
  3. Verify table displays branch records
  4. Verify all branches shown have "Moderate" in performance
  5. Verify different branches than strong/weak queries
```

### Test 1.4: Query Without "Branches" Keyword
```
Input: "strong"
Expected Behavior:
  - Intent: filter
  - Target: branch (auto-detected)
  - Matched Records: ~13 branches
  - Same results as Test 1.1
  
Verification Steps:
  1. Enter just "strong"
  2. Verify system auto-targets branches
  3. Verify results match Test 1.1
  4. No explicit "branch" keyword needed
```

---

## Test Suite 2: Performance Status with District Filters

### Test 2.1: Strong Branches in Specific District
```
Input: "strong branches in Al Murabba"
Expected Behavior:
  - Target: branch
  - District filter applied: Al Murabba
  - Matched Records: Strong branches only in Al Murabba
  - Should be subset of Test 1.1 results
  
Verification Steps:
  1. Enter the query
  2. Check status message shows matching count
  3. Verify all displayed branches are in Al Murabba
  4. Verify all displayed branches have Strong status
  5. Verify count is less than or equal to total strong branches
```

### Test 2.2: Weak Branches in Another District
```
Input: "weak branches in Al Olaya"
Expected Behavior:
  - Target: branch
  - District filter applied: Al Olaya
  - Matched Records: Weak branches only in Al Olaya
  
Verification Steps:
  1. Enter the query
  2. Verify all results are from Al Olaya district
  3. Verify all results have Weak status
  4. Compare with Test 1.2 - should be subset
```

### Test 2.3: Moderate Branches in Third District
```
Input: "moderate branches in Riyadh Center"
Expected Behavior:
  - Target: branch
  - District filter applied: Riyadh Center
  - Matched Records: Moderate branches only in that district
  
Verification Steps:
  1. Verify results exist for this combination
  2. Verify district filter applied correctly
  3. Verify performance status filter applied correctly
```

---

## Test Suite 3: Count Queries with Performance Status

### Test 3.1: Count of Strong Branches
```
Input: "how many strong branches?"
Expected Behavior:
  - Intent: count
  - Message: Should explicitly state count (e.g., "12 matching branch records found.")
  - Matched Records: All 12 strong branches shown
  
Verification Steps:
  1. Check message contains a number
  2. Verify table shows all strong branches
  3. Verify count in message matches table row count
```

### Test 3.2: Count of Weak Branches
```
Input: "count weak branches"
Expected Behavior:
  - Intent: count
  - Message: Should state count of weak branches
  
Verification Steps:
  1. Verify message shows count
  2. Verify count is ~10 (based on data)
  3. Verify results shown in table
```

### Test 3.3: Count with District Filter
```
Input: "how many strong branches in Al Murabba?"
Expected Behavior:
  - Intent: count
  - District filter applied
  - Message: Should show count for that specific district
  
Verification Steps:
  1. Verify message shows count
  2. Verify results are filtered to district
  3. Verify count is less than total strong branches
```

---

## Test Suite 4: Voice Input Tests

### Test 4.1: Voice Input - "Strong Branches"
```
Steps:
  1. Click "Start Mic" button
  2. Speak: "strong branches"
  3. Stop mic
  
Expected:
  - Recognized text appears in "Last transcript" field
  - Same results as Test 1.1 (typed input)
  - ~13 branches displayed
```

### Test 4.2: Voice Input - Performance Status with District
```
Steps:
  1. Click "Start Mic"
  2. Speak: "weak branches in Al Olaya"
  3. Stop mic
  
Expected:
  - Transcript appears
  - Results match Test 2.2
  - Correct filtering applied
```

### Test 4.3: Voice Input - Count Query
```
Steps:
  1. Click "Start Mic"
  2. Speak: "how many moderate branches?"
  3. Stop mic
  
Expected:
  - Transcript appears
  - Count shown in message
  - Results displayed in table
```

---

## Test Suite 5: Combination and Edge Cases

### Test 5.1: Compare Intent with Performance Status
```
Input: "compare strong and weak branches"
Expected Behavior:
  - Intent: compare-districts (if districts found) or filter
  - May show comparison message if districts in query
  
Verification Steps:
  1. Verify system recognizes both performance statuses
  2. Verify appropriate results returned
```

### Test 5.2: Show All with Performance Status
```
Input: "show all strong branches"
Expected Behavior:
  - Intent: show-all
  - Target: branch
  - Shows all strong branches
  
Verification Steps:
  1. Verify results show all strong branches
  2. Verify message format appropriate for show-all
```

### Test 5.3: Clear Results
```
Input: (After previous query) Click "Clear"
Expected Behavior:
  - Query text cleared
  - Results table cleared
  - Status message reset
  - "Last transcript" cleared
  
Verification Steps:
  1. Verify all UI fields cleared
  2. Verify ready for new query
```

### Test 5.4: Invalid Performance Status
```
Input: "excellent branches"
Expected Behavior:
  - No match for "excellent"
  - May return unknown intent or default behavior
  - No branch records filtered
  
Verification Steps:
  1. Verify system doesn't recognize "excellent"
  2. Verify appropriate error message or no results
```

---

## Test Suite 6: ATM Functionality (Regression Tests)

### Test 6.1: ATM Query Still Works
```
Input: "strong atms"
Expected Behavior:
  - Should still work for ATMs (not branches)
  - Or return no results if ATMs don't have performance status
  
Verification Steps:
  1. Verify ATM search functionality unaffected
  2. Verify no errors thrown
```

### Test 6.2: ATM District Query
```
Input: "atms in Al Malaz"
Expected Behavior:
  - Should show ATMs from Al Malaz
  - Not affected by branch changes
  
Verification Steps:
  1. Verify ATM functionality works
  2. Verify district filter works for ATMs
```

### Test 6.3: Mixed Query - ATM First
```
Input: "show atms"
Expected Behavior:
  - Should show all ATMs
  - Should not be affected by branch code changes
  
Verification Steps:
  1. Verify ATMs displayed correctly
  2. Verify no cross-contamination with branch search
```

---

## Data Validation

### Known Branch Data Reference

```
Performance_Status: "Strong"
Count: ~13 branches
Examples:
  - BR-20101 (Al Murabba)
  - BR-20102 (Al Nakheel)
  - BR-20105 (Al Olaya)
  - BR-20108 (Riyadh Center)

Performance_Status: "Weak"
Count: ~10 branches
Examples:
  - BR-20103 (Al Narjis)
  - BR-20104 (Olaya)
  - BR-20107 (Shaabah)
  - BR-20111 (Riyadh Center)

Performance_Status: "Moderate"
Count: ~7 branches
Examples:
  - BR-20106 (Malaz)
  - BR-20109 (Narjis)
  - BR-20110 (Al Quraish)
```

Use this data to verify query results are correct.

---

## Browser Console Verification

During testing, open Browser DevTools (F12) and check:

### Network Tab
- [ ] `Riyadh_Branch_Locations.geojson` loads successfully (200 status)
- [ ] `Riyadh_ATM_Locations.geojson` loads successfully (200 status)
- [ ] No 404 errors for GeoJSON files

### Console Tab
- [ ] No JavaScript errors
- [ ] No TypeErrors
- [ ] No "Cannot find" warnings
- [ ] Load info messages appear correctly
- [ ] No fetch failures

### Application Tab
- [ ] Component renders without errors
- [ ] State updates after queries
- [ ] No memory leaks detected

---

## Failure Scenarios and Solutions

### Scenario 1: "0 matching records" for all queries
**Possible Causes:**
- GeoJSON file not loading
- Performance_Status field not recognized
- Filter logic broken

**Solutions:**
1. Check Network tab - is GeoJSON loading?
2. Check Console - any fetch errors?
3. Reload page and retry
4. Try basic query: just "strong"
5. Check that Performance_Status field exists in raw JSON

### Scenario 2: Only ATM results, no branch results
**Possible Causes:**
- pickRecords() returning wrong data
- Target not being set to "branch"
- GeoJSON loading but data not processed correctly

**Solutions:**
1. Check that query explicitly says "branch"
2. Try: "show strong branches" (not just "strong")
3. Check console for errors
4. Verify branchRecords array has data

### Scenario 3: Wrong performance status returned
**Possible Causes:**
- Text normalization not working
- performanceStatus field not mapped correctly
- Filter logic inverted

**Solutions:**
1. Check raw GeoJSON values
2. Verify normalize() method behavior
3. Log filter results to console
4. Verify field mapping: Performance_Status → performanceStatus

---

## Performance Metrics

### Expected Performance
- Query response time: < 100ms
- UI update: < 200ms
- Map highlighting: < 500ms

### Test Measurement
1. Open DevTools → Performance tab
2. Start recording
3. Run a branch search query
4. Stop recording
5. Verify response times are within expected range

---

## Test Results Template

Use this template to document test results:

```markdown
## Test Results - [Date]

### Test Suite 1: Basic Performance Status Queries
- [ ] Test 1.1 Strong Branches: PASS / FAIL - Notes: ___
- [ ] Test 1.2 Weak Branches: PASS / FAIL - Notes: ___
- [ ] Test 1.3 Moderate Branches: PASS / FAIL - Notes: ___
- [ ] Test 1.4 Query Without Keyword: PASS / FAIL - Notes: ___

### Test Suite 2: Performance Status with Districts
- [ ] Test 2.1 Strong in District: PASS / FAIL - Notes: ___
- [ ] Test 2.2 Weak in District: PASS / FAIL - Notes: ___
- [ ] Test 2.3 Moderate in District: PASS / FAIL - Notes: ___

### Test Suite 3: Count Queries
- [ ] Test 3.1 Count Strong: PASS / FAIL - Notes: ___
- [ ] Test 3.2 Count Weak: PASS / FAIL - Notes: ___
- [ ] Test 3.3 Count with District: PASS / FAIL - Notes: ___

### Test Suite 4: Voice Input
- [ ] Test 4.1 Voice Strong: PASS / FAIL - Notes: ___
- [ ] Test 4.2 Voice with District: PASS / FAIL - Notes: ___
- [ ] Test 4.3 Voice Count: PASS / FAIL - Notes: ___

### Test Suite 5: Combinations and Edge Cases
- [ ] Test 5.1 Compare Intent: PASS / FAIL - Notes: ___
- [ ] Test 5.2 Show All: PASS / FAIL - Notes: ___
- [ ] Test 5.3 Clear Results: PASS / FAIL - Notes: ___
- [ ] Test 5.4 Invalid Status: PASS / FAIL - Notes: ___

### Test Suite 6: Regression Tests
- [ ] Test 6.1 ATM Query: PASS / FAIL - Notes: ___
- [ ] Test 6.2 ATM District: PASS / FAIL - Notes: ___
- [ ] Test 6.3 ATM Show All: PASS / FAIL - Notes: ___

### Overall Result: [PASS / FAIL]
### Issues Found: [List any issues]
### Notes: [Additional observations]
```

---

## Sign-Off

Once all tests pass:

- [ ] All 19 test cases passed
- [ ] No console errors
- [ ] No performance issues
- [ ] ATM functionality preserved
- [ ] Branch search working as expected
- [ ] Ready for production deployment

---

## Support

For test failures or issues:
1. Review the Failure Scenarios section
2. Check the documentation files
3. Examine browser console logs
4. Review code changes in natural-language-query.service.ts
