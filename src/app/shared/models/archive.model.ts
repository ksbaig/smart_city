export type ArchiveFileType = "DWG" | "Excel" | "PDF" | "Image";

export interface ArchiveFile {
  id: number;
  parcelId: string;
  fileType: ArchiveFileType;
  fileName: string;
  filePath: string;
  category: string;
}

export interface ArchiveFileGroup {
  type: ArchiveFileType;
  files: ArchiveFile[];
}