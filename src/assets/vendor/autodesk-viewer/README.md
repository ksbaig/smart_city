# Local Autodesk Viewer SDK assets

This folder should contain the offline/local copies of the Autodesk Viewer SDK files used by the frontend app.

Required files:
- `viewer3D.min.js`
- `style.min.css`

Place the downloaded files here and then build/serve the Angular app.

Example:
- `src/assets/vendor/autodesk-viewer/viewer3D.min.js`
- `src/assets/vendor/autodesk-viewer/style.min.css`

If the app cannot load the Autodesk Viewer SDK, the console will show an error from `viewer.service.ts`.
