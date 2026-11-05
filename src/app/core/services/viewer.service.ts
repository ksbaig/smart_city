import { Injectable } from '@angular/core';

/**
 * Thin wrapper around the Autodesk Viewer SDK loaded from CDN.
 *
 * IMPORTANT: The CDN script (viewer3D.min.js) must be loaded in index.html
 * BEFORE Angular bootstraps. Do NOT lazy-load it here.
 *
 * Typical usage:
 *   const token = await tokenSvc.getToken();
 *   await viewerSvc.initViewer(containerEl, token);
 *   viewerSvc.loadModel('urn:...<base64-urn>...');
 */
@Injectable({ providedIn: 'root' })
export class ViewerService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private viewer: any = null;

  /**
   * Initialise the Autodesk Viewer inside the given container element.
   * Resolves when the viewer is ready.
   */
  initViewer(container: HTMLDivElement, accessToken: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AV = (window as any).Autodesk?.Viewing;
      if (!AV) {
        reject(new Error('Autodesk Viewer SDK not loaded. Add local viewer3D.min.js and style.min.css files to src/assets/vendor/autodesk-viewer/ and update index.html if needed.'));
        return;
      }

      const options = {
        env: 'AutodeskProduction2',
        api: 'streamingV2',
        getAccessToken: (cb: (t: string, e: number) => void) => cb(accessToken, 3600),
      };

      AV.Initializer(options, () => {
        this.viewer = new AV.GuiViewer3D(container);
        const startCode = this.viewer.start();
        if (startCode > 0) {
          reject(new Error(`Viewer start() returned error code ${startCode}`));
          return;
        }
        resolve();
      });
    });
  }

  /**
   * Load a model by its APS URN (base64-encoded DXF/RVT/DWG URN from Model Derivative API).
   * Example URN: 'urn:adsk.objects:os.object:my-bucket/A1.dwg'  →  base64-encode it first.
   */
  loadModel(urn: string): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AV = (window as any).Autodesk?.Viewing;
    if (!AV || !this.viewer) {
      console.warn('ViewerService.loadModel: viewer not initialised yet.');
      return;
    }
    AV.Document.load(
      urn,
      (doc: any) => {
        const viewable = doc.getRoot().getDefaultGeometry();
        this.viewer.loadDocumentNode(doc, viewable);
      },
      (code: number, msg: string) => {
        console.error(`ViewerService: failed to load model (${code}): ${msg}`);
      }
    );
  }

  /** Destroy the viewer and free GPU / memory resources. */
  destroyViewer(): void {
    if (this.viewer) {
      this.viewer.finish();
      this.viewer = null;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AV = (window as any).Autodesk?.Viewing;
    if (AV) {
      try { AV.shutdown(); } catch { /* ignore */ }
    }
  }

  get isReady(): boolean {
    return !!this.viewer;
  }
}
