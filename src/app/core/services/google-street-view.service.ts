import { Injectable } from '@angular/core';
import { GoogleMapsLoaderService } from './google-maps-loader.service';

export interface StreetViewLocation {
  lat: number;
  lng: number;
  distance?: number;
  description?: string;
}

// Subset of google.maps.StreetViewPanoramaData used by this service
interface StreetViewPanoramaData {
  location?: {
    latLng?: { lat(): number; lng(): number };
  };
}

@Injectable({ providedIn: 'root' })
export class GoogleStreetViewService {
  private streetViewPanorama: any = null;
  private currentLocation: StreetViewLocation | null = null;
  private searchRadii = [100, 250, 500]; // meters

  constructor(private googleMapsLoader: GoogleMapsLoaderService) {}

  async initializePanorama(
    container: HTMLElement,
    location: StreetViewLocation
  ): Promise<{ panorama: any; distance: number; message?: string }> {
    await this.googleMapsLoader.loadGoogleMaps();

    const google = (window as any).google;
    const streetViewService = new google.maps.StreetViewService();
    const locationLatLng = new google.maps.LatLng(location.lat, location.lng);

    // Try to find a panorama at the specified location with increasing radius
    let result: StreetViewPanoramaData | null = null;
    let foundDistance = 0;

    for (const radius of this.searchRadii) {
      try {
        result = await new Promise<StreetViewPanoramaData | null>((resolve, reject) => {
          streetViewService.getPanorama(
            { location: locationLatLng, radius },
            (data: StreetViewPanoramaData | null, status: string) => {
              if (status === google.maps.StreetViewStatus.OK) {
                resolve(data);
              } else if (status === google.maps.StreetViewStatus.ZERO_RESULTS) {
                resolve(null);
              } else {
                reject(new Error(`Street View error: ${status}`));
              }
            }
          );
        });

        if (result) {
          foundDistance = radius;
          break;
        }
      } catch (err) {
        console.warn(`Failed to search Street View at radius ${radius}m:`, err);
      }
    }

    if (!result?.location?.latLng) {
      return {
        panorama: null,
        distance: 0,
        message: 'Street View imagery is not available near this location.',
      };
    }

    // Calculate actual distance from search location to panorama
    const panoramaLatLng = result.location.latLng;
    const actualDistance = this.calculateDistance(
      location.lat,
      location.lng,
      panoramaLatLng.lat(),
      panoramaLatLng.lng()
    );

    // Destroy existing panorama if any
    if (this.streetViewPanorama) {
      this.streetViewPanorama = null;
    }

    // Create new panorama
    this.streetViewPanorama = new google.maps.StreetViewPanorama(container, {
      position: panoramaLatLng,
      pov: {
        heading: 0,
        pitch: 0,
      },
      zoom: 1,
      disableDefaultUI: false,
      fullscreenControl: true,
      panControl: true,
      zoomControl: true,
    });

    this.currentLocation = {
      ...location,
      distance: actualDistance,
    };

    return {
      panorama: this.streetViewPanorama,
      distance: actualDistance,
    };
  }

  getPanorama(): any {
    return this.streetViewPanorama;
  }

  getCurrentLocation(): StreetViewLocation | null {
    return this.currentLocation;
  }

  updateLocation(location: StreetViewLocation): Promise<{ panorama: any; distance: number; message?: string }> {
    if (!this.streetViewPanorama) {
      return Promise.reject(new Error('Panorama not initialized'));
    }

    const google = (window as any).google;
    const streetViewService = new google.maps.StreetViewService();
    const locationLatLng = new google.maps.LatLng(location.lat, location.lng);

    return new Promise((resolve, reject) => {
      streetViewService.getPanorama(
        { location: locationLatLng, radius: 100 },
        (data: StreetViewPanoramaData | null, status: string) => {
          if (status === google.maps.StreetViewStatus.OK) {
            const panoramaLatLng = data?.location?.latLng;
            if (!panoramaLatLng) {
              reject(new Error('Street View returned no location'));
              return;
            }
            this.streetViewPanorama.setPosition(panoramaLatLng);
            this.currentLocation = {
              ...location,
              distance: 0,
            };

            resolve({
              panorama: this.streetViewPanorama,
              distance: 0,
            });
          } else if (status === google.maps.StreetViewStatus.ZERO_RESULTS) {
            resolve({
              panorama: null,
              distance: 0,
              message: 'Street View imagery is not available near this location.',
            });
          } else {
            reject(new Error(`Street View error: ${status}`));
          }
        }
      );
    });
  }

  closePanorama(): void {
    this.streetViewPanorama = null;
    this.currentLocation = null;
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance * 1000); // Return distance in meters
  }
}
