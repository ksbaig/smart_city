export interface Parcel {
  id: string;
  displayName: string;
  objectId: number;
  attributes: Record<string, unknown>;
  geometry?: unknown;
  sourceDataset?: "2026" | "2018";
}

export interface MapConfig {
  portalUrl: string;
  webMapId: string;
  webSceneId?: string;
  /** Optional Instant App (3D Viewer) item id — used to auto-discover webSceneId. */
  instantAppId?: string;
  center?: [number, number];
  zoom?: number;
}