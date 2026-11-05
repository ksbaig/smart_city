
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Subject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StreetViewService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.BACKEND.BASR_URL}/${environment.BACKEND.PANORAMIC_IMAGE_URL}`;
  private readonly localIisUrl = environment.BACKEND.PANORAMIC_IMAGE_LOCAL_IIS_URL;
  private readonly panoramaBlobSubject = new Subject<{ blob: Blob; missionName: string; imageName: string }>();
  readonly panoramaBlob$ = this.panoramaBlobSubject.asObservable();

  getPanoramicImage(missionName: string, imageName: string) {
    const params = new HttpParams()
      .set('missionName', missionName || '')
      .set('imageName', imageName || '');

    const requestUrl = `${this.apiUrl}?missionName=${encodeURIComponent(missionName)}&imageName=${encodeURIComponent(imageName)}`;
    console.log('[street view] sending request to', requestUrl);

    return this.http.get(this.apiUrl, {
      params,
      responseType: 'blob' as const,
    }).pipe(
      tap((blob) => {
        console.log('[street view] API response blob', { blob, missionName, imageName });
        this.panoramaBlobSubject.next({ blob, missionName, imageName });
      }),
      catchError((apiError) => {
        const fallbackUrl = this.getLocalFallbackUrl(imageName);
        console.warn('[street view] network path not available, getting from local IIS fallback', { fallbackUrl, apiError });

        return this.http.get(fallbackUrl, {
          responseType: 'blob' as const,
        }).pipe(
          tap((blob) => {
            console.log('[street view] local IIS fallback image blob received', {
              blob,
              fallbackUrl,
              missionName,
              imageName,
            });
            this.panoramaBlobSubject.next({ blob, missionName, imageName });
          }),
          catchError((fallbackError) => {
            const defaultFallbackUrl = this.getDefaultFallbackUrl();
            console.warn('[street view] IIS fallback not available, using default local IIS fallback image', {
              fallbackUrl,
              defaultFallbackUrl,
              fallbackError,
            });

            return this.http.get(defaultFallbackUrl, {
              responseType: 'blob' as const,
            }).pipe(
              tap((blob) => {
                console.log('[street view] default local IIS fallback image blob received', {
                  blob,
                  defaultFallbackUrl,
                  missionName,
                  imageName,
                });
                this.panoramaBlobSubject.next({ blob, missionName, imageName });
              }),
              catchError((defaultError) => {
                console.error('[street view] default local IIS fallback failed', {
                  defaultFallbackUrl,
                  defaultError,
                });
                return throwError(() => defaultError);
              })
            );
          })
        );
      })
    );
  }


  private getLocalFallbackUrl(imageName: string): string {
    const normalizedImageName = imageName?.trim() || '';
    if (!normalizedImageName) {
      return this.getDefaultFallbackUrl();
    }

    if (normalizedImageName.toLowerCase().startsWith('http://') || normalizedImageName.toLowerCase().startsWith('https://')) {
      return normalizedImageName;
    }

    if (/\.(jpg|jpeg|png|webp)$/i.test(normalizedImageName)) {
      return `${this.localIisUrl}/${normalizedImageName}`;
    }

    return `${this.localIisUrl}/${normalizedImageName}.jpg`;
  }

  private getDefaultFallbackUrl(): string {
    return `${this.localIisUrl}/pano_000000_000008.jpg`;
  }

  getApiUrl(): string {
    return this.apiUrl;
  }
}
