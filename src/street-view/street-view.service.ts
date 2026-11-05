import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
// import { ViewChangeEvent } from '@egjs/ngx-view360'; // Removed: module not installed
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StreetViewService {

  private panoramicViewQuerySubject: BehaviorSubject<any> = new BehaviorSubject<any>(null!);
  panoramicViewQueryObservable: Observable<any> = this.panoramicViewQuerySubject.asObservable();

  private panoramicViewCameraChangeSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null!);
  panoramicViewCameraChangeObservable: Observable<any> = this.panoramicViewCameraChangeSubject.asObservable();

  private panoramicViewNavigateSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null!);
  panoramicViewNavigateObservable: Observable<any> = this.panoramicViewNavigateSubject.asObservable();

  constructor(private http: HttpClient) { }


  getPanoramicImage(missionName: string, imageName: string, yawDeg: any, currentPoint: any, aroundFeatures: any) {
    this.http.get(`${environment.BACKEND.BASR_URL}/${environment.BACKEND.PANORAMIC_IMAGE_URL}`, {
      params: {
        missionName: missionName,
        imageName: imageName
      },
      responseType: 'blob'
    }).subscribe({
      next: (data: any) => {
        const payload = {
          data: data,
          yawDeg: yawDeg,
          currentPoint: currentPoint,
          aroundFeatures: aroundFeatures
        }
        this.panoramicViewQuerySubject.next(payload);
      },
      error: (error: any) => {
        console.log(error);
      },
      complete: () => {

      }
    });
  }

  notifyCameraChange(payload: any) {
    this.panoramicViewCameraChangeSubject.next(payload);
  }

  notifyLocationChange(payload: any) {
    this.panoramicViewNavigateSubject.next(payload);
  }

}
