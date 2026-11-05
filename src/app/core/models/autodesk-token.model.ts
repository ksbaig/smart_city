/** Model for the APS access token response */
export interface AutodeskToken {
  access_token: string;
  expires_in: number;
  /** Local timestamp (ms) when the token was fetched */
  fetchedAt: number;
}
