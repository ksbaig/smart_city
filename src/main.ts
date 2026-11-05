import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import esriConfig from '@arcgis/core/config';

// Force ArcGIS runtime/component assets to resolve from local build output.
esriConfig.assetsPath = new URL('assets/arcgis', document.baseURI).toString();

function getResourceOrigin(url: string): string {
  try {
    const absoluteUrl = new URL(url, window.location.origin);
    return absoluteUrl.origin === window.location.origin ? 'internal' : 'external/CDN';
  } catch {
    return 'unknown';
  }
}

function logResourceRequest(label: string, url: string, method?: string): void {
  const origin = getResourceOrigin(url);
  console.log(`[resource] ${label}: ${origin} -> ${url}`, method ? { method } : undefined);
}

if (typeof window !== 'undefined') {
  const win = window as any;
  if (typeof win.fetch === 'function') {
    const originalFetch = win.fetch.bind(win);
    win.fetch = async (input: RequestInfo, init?: RequestInit) => {
      const requestUrl = typeof input === 'string' ? input : input.url;
      logResourceRequest('fetch', requestUrl, init?.method || 'GET');
      return originalFetch(input, init);
    };
  }

  if (typeof win.XMLHttpRequest !== 'undefined') {
    const originalOpen = win.XMLHttpRequest.prototype.open;
    win.XMLHttpRequest.prototype.open = function (...args: any[]) {
      logResourceRequest('XHR', String(args[1]), String(args[0]));
      return originalOpen.apply(this, args as any);
    };
  }
}

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
