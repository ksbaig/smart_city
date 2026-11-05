# Quick Start Guide - Smart Banking AI Information System

## 🚀 Getting Started (30 seconds)

### 1. Start the Application
```bash
cd frontend
ng serve --open
```
Browser opens automatically at `http://localhost:4200`

### 2. Login
- Use: **Active Directory SSO** button (recommended)
- Or username: Banking / password: Banking (if available)

### 3. Navigate to Voice Agent
- Click the **microphone icon** on the left sidebar
- You'll see "Local Banking Voice Agent" panel

---

## 🔍 How to Search

### Search for Branches by Performance Status
```
Try typing or saying:
  • "strong branches"
  • "weak branches"  
  • "moderate branches"
  • "show strong branches"
```

### Search for Specific Branch
```
Try typing:
  • "BR-20101"
  • "Al Murabba branch"
```

### Results
- 📍 Map automatically zooms to locations
- 📊 See all matching branches/ATMs in results
- 📥 Each result has a "Download" button

---

## 📥 Download Feature (New!)

### How to Download
1. Search for a branch/ATM
2. Find the result in the table
3. Click the blue **"Download"** button in the Action column
4. A **modal popup** appears with:
   - ✅ Map display (left side)
   - ✅ Feature information (right side)
   - ✅ Download Report button

### Modal Details
The popup shows:
- **Type**: ATM or Branch
- **ID**: Unique identifier
- **Name**: Location name
- **District**: Area/District
- **Status**: Performance Status (for branches)
- **Coordinates**: Latitude & Longitude
- **Metrics**: Customer Visits, Transactions (if available)

### Download Report
1. Click the **"📥 Download Report"** button in the modal
2. Text file downloads automatically
3. File contains all feature information + map data

---

## 🎤 Voice Search

### Using Voice Input
1. Click **"Start Mic"** button
2. Speak clearly: "Show strong branches"
3. Click **"Stop Mic"** when done
4. Results appear automatically

### Voice Tips
- Use natural language: "I'm looking for weak branches"
- Mention the type: "Show me branches with strong status"
- Include district: "ATMs in Al Malaz"
- Works best in quiet environment

---

## 🗺️ Map Controls

- **Zoom In/Out**: Use +/- buttons or scroll wheel
- **Pan**: Click and drag on map
- **Reset Orientation**: Click compass icon
- **View Results**: Click markers to see details

---

## 🔧 Troubleshooting

### "No matching records found"
- Check spelling of branch names
- Use performance status keywords: Strong, Weak, Moderate
- Try: "strong branches" instead of "powerful branches"

### Modal doesn't appear when clicking Download
- The modal might be loading the map
- Wait 2-3 seconds and try again
- Check browser console for errors (F12)

### Map shows wrong location
- Map might be loading tiles
- Wait for tiles to load (check network)
- Zoom in/out to refresh

### Voice not working
- Check browser microphone permission (usually at URL bar)
- Close other audio apps
- Use Chrome/Edge for best compatibility
- Works on localhost and HTTPS only

---

## 📊 Data Sources

| Data | Source | Records |
|------|--------|---------|
| **ATM Locations** | Riyadh_ATM_Locations.geojson | ~2000 |
| **Branch Locations** | Riyadh_Branch_Locations.geojson | ~30 |
| **Basemap** | Google Streets | Interactive |

---

## 🎯 Common Tasks

### View All Branches with Specific Status
```
Type: "weak branches"
→ See all branches with Performance_Status = "Weak"
```

### Download Branch Information
```
1. Search: "BR-20101"
2. Click Download button
3. See modal with map
4. Click "Download Report" to get file
```

### Search by District
```
Type: "show ATMs in Al Malaz"
→ See all ATMs in Al Malaz district
```

### Voice Search for Branches
```
1. Click "Start Mic"
2. Say: "I need strong branches"
3. Results appear automatically
```

---

## 📱 Browser Requirements

✅ **Supported**:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

⚠️ **Notes**:
- Voice works on localhost & HTTPS only
- Maps require internet connection
- Modern JavaScript support required

---

## ⚡ Performance Tips

- Initial load: ~3-5 seconds (loads all data)
- Search queries: <500ms typical
- Map rendering: Depends on network speed
- Zoom operations: Usually instant

---

## 🆘 Get Help

1. **Check Console** (F12 → Console tab)
   - Look for red error messages
   - Note any error codes

2. **Verify Data**
   - Check GeoJSON files exist
   - Verify file names in service

3. **Restart Application**
   - Stop server (Ctrl+C)
   - Run: `ng serve --open`

4. **Contact Developer**
   - Share console errors
   - Describe steps to reproduce
   - Include browser version

---

## 📝 Example Workflows

### Workflow 1: Find Weak Branches
```
1. Open app → http://localhost:4200
2. Click Voice Agent icon
3. Type: "weak branches"
4. Click Search
5. ✅ Map shows all weak branches
```

### Workflow 2: Download Branch Details
```
1. Search: "BR-20101" (specific branch)
2. Click Download button in results
3. ✅ Modal popup appears
4. Review map and information
5. Click "Download Report"
6. ✅ File saved with all details
```

### Workflow 3: Voice Search
```
1. Click Voice Agent
2. Click "Start Mic"
3. Say: "Show me strong branches in Olaya"
4. Click "Stop Mic"
5. ✅ Results appear on map
6. Click Download for any result
```

---

## 🎓 Learning Path

**Beginner** (5 min):
- [ ] Start app and login
- [ ] Search "weak branches"
- [ ] Look at map results

**Intermediate** (10 min):
- [ ] Try voice search
- [ ] Click Download button
- [ ] Review modal popup

**Advanced** (20 min):
- [ ] Try complex queries
- [ ] Download multiple reports
- [ ] Explore different districts

---

## 📚 More Information

- **Full Documentation**: See `IMPLEMENTATION_COMPLETE.md`
- **Architecture**: Check project structure in checkpoints/
- **API Details**: See TypeScript interfaces in component files
- **Data Format**: Review GeoJSON files in public/geojson/

---

**Last Updated**: 2026-10-28
**Status**: ✅ Ready to Use
**Version**: 1.0.0

