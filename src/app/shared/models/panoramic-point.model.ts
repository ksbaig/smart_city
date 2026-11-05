import Point from "@arcgis/core/geometry/Point";

export interface PanoramicPoint {
  id: string;
  label: string;
  geometry: Point;
  missionName?: string;
  imageName?: string;
}
