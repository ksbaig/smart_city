import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Comment } from '../../shared/models/comment.model';
import { CommentService } from '../../core/services/comment.service';

@Component({
  selector: 'app-comments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './comments.component.html',
  styleUrls: ['./comments.component.css'],
})
export class CommentsComponent implements OnInit {
  @Input() showCloseButton = false;
  @Output() closeRequested = new EventEmitter<void>();

  rows: Comment[] = [];

  /** Currently selected row srno (null = none) */
  selectedSrno: number | null = null;

  searchQuery = '';

  showForm = false;

  /** Form model – used for both New and Update */
  form: Omit<Comment, 'srno'> = this.emptyForm();

  /** Attachment filename preview */
  attachmentName = '';
  attachmentError = '';

  /** Lightbox */
  lightboxUrl = '';
  lightboxName = '';
  lightboxOpen = false;

  constructor(private svc: CommentService) {}

  ngOnInit(): void {
    this.load();
  }

  requestClose(): void {
    this.closeRequested.emit();
  }

  // ── Data ─────────────────────────────────────────────────────────────

  load(): void {
    this.rows = this.svc.getAll();
  }

  get selected(): Comment | undefined {
    return this.rows.find(r => r.srno === this.selectedSrno);
  }

  select(row: Comment): void {
    if (this.selectedSrno === row.srno) {
      this.selectedSrno = null;
    } else {
      this.selectedSrno = row.srno;
    }
  }

  // ── CRUD ─────────────────────────────────────────────────────────────

  openNew(): void {
    this.selectedSrno = null;
    this.form = this.emptyForm();
    this.attachmentName = '';
    this.attachmentError = '';
    this.showForm = true;
  }

  openUpdate(): void {
    const row = this.selected;
    if (!row) return;
    this.form = {
      date: row.date,
      comments: row.comments,
      update: row.update,
      status: row.status,
      attachment: row.attachment,
      attachmentDataUrl: row.attachmentDataUrl,
    };
    this.attachmentName = row.attachment;
    this.attachmentError = '';
    this.showForm = true;
  }

  save(): void {
    if (!this.form.comments.trim()) return;
    if (this.selectedSrno !== null) {
      this.svc.update(this.selectedSrno, this.form);
    } else {
      const created = this.svc.add(this.form);
      this.selectedSrno = created.srno;
    }
    this.showForm = false;
    this.load();
  }

  deleteSelected(): void {
    if (this.selectedSrno === null) return;
    if (!confirm('Delete this comment record?')) return;
    this.svc.delete(this.selectedSrno);
    this.selectedSrno = null;
    this.load();
  }

  // ── Search ───────────────────────────────────────────────────────────

  onSearch(): void {
    this.rows = this.svc.search(this.searchQuery);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.load();
  }

  // ── Attachment ───────────────────────────────────────────────────────

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (ext !== 'jpg' && ext !== 'jpeg' && ext !== 'png') {
      this.attachmentError = 'Only .jpg and .png files are allowed.';
      this.attachmentName = '';
      this.form.attachment = '';
      this.form.attachmentDataUrl = '';
      input.value = '';
      return;
    }

    this.attachmentError = '';
    this.attachmentName = file.name;
    this.form.attachment = file.name;

    const reader = new FileReader();
    reader.onload = () => {
      this.form.attachmentDataUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  openAttachment(row: Comment, event: MouseEvent): void {
    event.stopPropagation();
    if (!row.attachmentDataUrl) return;
    this.lightboxUrl = row.attachmentDataUrl;
    this.lightboxName = row.attachment;
    this.lightboxOpen = true;
  }

  closeLightbox(): void {
    this.lightboxOpen = false;
    this.lightboxUrl = '';
    this.lightboxName = '';
  }

  // ── Download ─────────────────────────────────────────────────────────

  downloadJson(): void {
    this.svc.downloadJson();
  }

  downloadText(): void {
    this.svc.downloadText();
  }

  // ── Helpers ──────────────────────────────────────────────────────────

  private emptyForm(): Omit<Comment, 'srno'> {
    return {
      date: new Date().toISOString().slice(0, 10),
      comments: '',
      update: '',
      status: '',
      attachment: '',
      attachmentDataUrl: '',
    };
  }
}
