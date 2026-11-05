# 360° Street View Integration

**GitHub Copilot implementation prompt for an existing Angular 21 +
ArcGIS Maps SDK application**

## Project context

I have an existing Angular 21 Smart Banking AI Information System. My
application already uses:

-   Angular 21
-   ArcGIS Maps SDK for JavaScript
-   ArcGIS MapView
-   Existing GIS search and zoom functionality
-   Existing vertical left-side toolbar
-   Existing green corporate theme

I want to integrate Google Street View 360° without replacing or
redesigning my existing GIS application.

## 1. Required workflow

Implement this exact workflow:

1.  The user searches for any location using the existing search
    functionality (for example Riyadh, Al Malaz, Olaya, King Fahd Road,
    Diplomatic Quarter, an ATM location or a bank branch).
2.  The existing ArcGIS functionality finds the selected location,
    extracts its latitude and longitude, zooms to it, and displays it on
    the map.
3.  The user clicks a new dedicated **360° Street View** button in the
    existing left vertical GIS toolbar.
4.  The application retrieves the currently selected location
    coordinates, calls Google `StreetViewService`, finds the nearest
    available panorama, and displays Google `StreetViewPanorama` in a
    large panel above the ArcGIS map.
5.  The ArcGIS map remains available underneath. The user controls when
    Street View opens; it must not open automatically after a search.
6.  Use the selected search result coordinates, never the user's current
    GPS location.

## 2. Viewer layout

Create a large expandable/collapsible 360° viewer.

-   Suggested initial layout: viewer approximately 45% of available
    height and ArcGIS map approximately 55%.
-   Provide close, full-screen, zoom, 360° rotation, current panorama
    location, and imagery-date controls (when available).
-   When closed, return to the original full-size ArcGIS map and
    preserve its map extent, selected layers and graphics.

## 3. Google Street View integration

Use the official Google Maps JavaScript API with:

-   `google.maps.StreetViewService`
-   `google.maps.StreetViewPanorama`

Search for nearby panoramas using the selected ArcGIS coordinates.

-   Start with a 100-metre radius.
-   If unavailable, retry at 250 metres and then 500 metres.
-   Display the actual distance between the selected location and the
    panorama.
-   Do not present a distant panorama as if it were at the searched
    location.
-   If imagery is unavailable, display: **"Street View imagery is not
    available near this location."**

## 4. Button behaviour

-   If no location has been selected, display: **"Please search and
    select a location first."**
-   If a location is selected, open the Street View viewer and search
    for its nearest panorama.
-   When another location is selected, update the selected coordinates.
    Clicking 360° View again must show the panorama for the newly
    selected location.
-   If the viewer is already open, update the existing panorama instance
    instead of creating another one.

## 5. Angular architecture

Inspect the existing project before creating files. Create or reuse the
following structure, adapting it to the current architecture:

``` text
src/app/services/google-maps-loader.service.ts
src/app/services/google-street-view.service.ts
src/app/components/street-view/street-view.component.ts
src/app/components/street-view/street-view.component.html
src/app/components/street-view/street-view.component.scss
```

Avoid duplicate services and follow the existing project conventions.

## 6. Integration with existing ArcGIS search

-   Identify the existing search component and ArcGIS MapView component.
-   Reuse the selected search result's latitude and longitude.
-   Maintain a shared selected-location state using the existing
    state-management approach. If none exists, use an Angular service or
    signals.
-   Connect the new 360° button to this selected-location state.

Illustrative data structure (use actual coordinates from the selected
result, not these placeholder values):

``` typescript
{
  name: 'Al Malaz',
  latitude: 24.65,
  longitude: 46.72
}
```

## 7. Visual design

Follow the existing Smart Banking GIS interface:

-   Corporate green
-   Light-green gradients
-   Beige backgrounds
-   Rounded toolbar buttons
-   Professional enterprise GIS appearance

Place the 360° button in the existing left vertical toolbar without
removing or changing existing buttons.

Add tooltip: **"Open 360° Street View"**.

## 8. Technical requirements

-   Load Google Maps API only once.
-   Reuse the `StreetViewPanorama` instance.
-   Handle API loading errors and missing imagery.
-   Clean up event listeners.
-   Avoid unnecessary API calls.
-   Preserve the existing ArcGIS `MapView` instance.
-   Do not interfere with search, layers, popups or dashboards.
-   Keep the Google API key in environment configuration.
-   Apply Google Maps API key restrictions and billing configuration.

## 9. Final testing

Test this workflow:

1.  Open the existing GIS application.
2.  Search for Al Malaz.
3.  Confirm ArcGIS zooms to Al Malaz.
4.  Click the new 360° Street View button.
5.  Confirm the top panorama viewer opens.
6.  Rotate the panorama.
7.  Close the panorama.
8.  Search for another location.
9.  Click 360° Street View again.
10. Confirm the new panorama corresponds to the new search location.

## 10. Final expected result

Keep the existing GIS dashboard as it is. The only major UI addition
should be a new 360° Street View button in the left vertical toolbar.
The user controls when to open Street View.

**Search → Zoom to location → Click 360° View → Display Google Street
View panorama above ArcGIS map.**

Implement this functionality without breaking existing Angular 21 or
ArcGIS JS SDK features.

------------------------------------------------------------------------

## Implementation instruction for GitHub Copilot

Before modifying files:

1.  Inspect the existing project structure.
2.  Identify how the current search returns coordinates.
3.  Identify the existing ArcGIS `MapView` component and toolbar.
4.  Reuse existing services and interfaces wherever possible.
5.  Do not create duplicate map or search functionality.
6.  Implement incrementally and verify that the existing dashboard
    continues working.
7.  Report which files were created or modified and explain any required
    Google Cloud configuration.
