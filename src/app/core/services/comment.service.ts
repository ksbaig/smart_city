import { Injectable } from '@angular/core';
import { Comment } from '../../shared/models/comment.model';

const STORAGE_KEY = 'dq_comments';

@Injectable({ providedIn: 'root' })
export class CommentService {

  /** Load all comments from localStorage */
  getAll(): Comment[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Comment[]) : [];
    } catch {
      return [];
    }
  }

  /** Save a new comment; auto-assigns srno */
  add(entry: Omit<Comment, 'srno'>): Comment {
    const list = this.getAll();
    const next = list.length > 0 ? Math.max(...list.map(c => c.srno)) + 1 : 1;
    const created: Comment = { srno: next, ...entry };
    list.push(created);
    this.persist(list);
    return created;
  }

  /** Update an existing comment by srno */
  update(srno: number, changes: Partial<Omit<Comment, 'srno'>>): void {
    const list = this.getAll().map(c =>
      c.srno === srno ? { ...c, ...changes } : c
    );
    this.persist(list);
  }

  /** Delete a comment by srno */
  delete(srno: number): void {
    const list = this.getAll().filter(c => c.srno !== srno);
    this.persist(list);
  }

  /** Search comments by text across all text fields */
  search(query: string): Comment[] {
    const q = query.trim().toLowerCase();
    if (!q) return this.getAll();
    return this.getAll().filter(c =>
      c.comments.toLowerCase().includes(q) ||
      c.update.toLowerCase().includes(q) ||
      c.status.toLowerCase().includes(q) ||
      c.attachment.toLowerCase().includes(q) ||
      c.date.includes(q)
    );
  }

  /** Export all comments as a JSON file download */
  downloadJson(): void {
    const data = JSON.stringify(this.getAll(), null, 2);
    this.triggerDownload(data, 'comments.json', 'application/json');
  }

  /** Export all comments as a plain-text file download */
  downloadText(): void {
    const list = this.getAll();
    const lines = list.map(c =>
      `[${c.srno}] ${c.date} | ${c.status}\n` +
      `  Comment   : ${c.comments}\n` +
      `  Update    : ${c.update}\n` +
      `  Attachment: ${c.attachment}\n`
    );
    this.triggerDownload(lines.join('\n'), 'comments.txt', 'text/plain');
  }

  private persist(list: Comment[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  private triggerDownload(content: string, filename: string, mime: string): void {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
