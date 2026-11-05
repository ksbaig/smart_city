import { Injectable } from "@angular/core";
import { Observable, from } from "rxjs";
import { PendingUpdateRecord } from "../../shared/models/pending-update.model";

@Injectable({ providedIn: "root" })
export class PendingUpdatesService {
  private readonly apiUrl = "/api/updates";
  private readonly fallbackUrl = "/data/updates.json";

  getPendingUpdates(): Observable<PendingUpdateRecord[]> {
    return from(this.getPendingUpdatesWithFallback());
  }

  addPendingUpdate(record: PendingUpdateRecord): Observable<PendingUpdateRecord> {
    return from(this.request<PendingUpdateRecord>(this.apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    }));
  }

  private async request<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      cache: "no-store",
      ...init,
    });
    if (!response.ok) {
      throw new Error(`Pending updates request failed with status ${response.status}`);
    }
    return response.json() as Promise<T>;
  }

  private async getPendingUpdatesWithFallback(): Promise<PendingUpdateRecord[]> {
    try {
      return await this.request<PendingUpdateRecord[]>(this.apiUrl);
    } catch {
      // Allow the grid to render saved rows even when backend is temporarily down.
      return this.request<PendingUpdateRecord[]>(this.fallbackUrl);
    }
  }
}