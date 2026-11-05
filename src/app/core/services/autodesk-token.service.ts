import { Injectable } from '@angular/core';
import { AutodeskToken } from '../models/autodesk-token.model';

/**
 * Fetches a 2-legged APS access token from the local Express backend.
 * Caches the token until it is within 60 s of expiry.
 */
@Injectable({ providedIn: 'root' })
export class AutodeskTokenService {
  private cached: AutodeskToken | null = null;
  /** Margin (ms) before expiry to treat the token as stale */
  private readonly marginMs = 60_000;

  async getToken(): Promise<string> {
    if (this.cached && this.isValid(this.cached)) {
      return this.cached.access_token;
    }

    const response = await fetch('/api/token');
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`APS token request failed (${response.status}): ${text}`);
    }

    const data: { access_token: string; expires_in: number } = await response.json();
    this.cached = {
      access_token: data.access_token,
      expires_in: data.expires_in,
      fetchedAt: Date.now(),
    };
    return this.cached.access_token;
  }

  private isValid(t: AutodeskToken): boolean {
    const expiresAt = t.fetchedAt + t.expires_in * 1_000;
    return Date.now() < expiresAt - this.marginMs;
  }
}
