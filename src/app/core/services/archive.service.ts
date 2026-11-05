import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";
import { delay } from "rxjs/operators";
import { ArchiveFile } from "../../shared/models/archive.model";

@Injectable({ providedIn: "root" })
export class ArchiveService {
  getByParcel(parcelId: string): Observable<ArchiveFile[]> {
    const files: ArchiveFile[] = [
      {
        id: 1,
        parcelId,
        fileType: "DWG",
        fileName: "site_plan.dwg",
        filePath: "/files/dwg/site_plan.dwg",
        category: "Drawing",
      },
      {
        id: 2,
        parcelId,
        fileType: "Excel",
        fileName: "building_details.xlsx",
        filePath: "/files/excel/building_details.xlsx",
        category: "Buildings",
      },
      {
        id: 3,
        parcelId,
        fileType: "PDF",
        fileName: "approval_certificate.pdf",
        filePath: "/files/pdf/approval_certificate.pdf",
        category: "Approval",
      },
      {
        id: 4,
        parcelId,
        fileType: "Image",
        fileName: "pre_construction.jpg",
        filePath: "/files/images/pre_construction.jpg",
        category: "PreConstruction",
      },
      {
        id: 5,
        parcelId,
        fileType: "Image",
        fileName: "post_construction.jpg",
        filePath: "/files/images/post_construction.jpg",
        category: "PostConstruction",
      },
    ];

    return of(files).pipe(delay(160));
  }
}