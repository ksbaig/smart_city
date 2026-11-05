export interface Comment {
  srno: number;
  date: string;          // ISO date string
  comments: string;
  update: string;
  status: string;
  attachment: string;        // filename or empty string
  attachmentDataUrl: string; // base64 data-URL for .jpg/.png preview
}
