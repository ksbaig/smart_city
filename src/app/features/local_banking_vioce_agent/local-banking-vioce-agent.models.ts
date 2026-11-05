export type VoiceAgentIntent =
  | "filter"
  | "count"
  | "find-atm-id"
  | "find-branch-id"
  | "compare-districts"
  | "show-all"
  | "unknown";

export type VoiceAgentTarget = "atm" | "branch" | "either";

export interface AtmQuery {
  intent: VoiceAgentIntent;
  target: VoiceAgentTarget;
  districtNames?: string[];
  atmId?: string;
  branchId?: string;
  category?: string;
  unresolvedDistrictText?: string;
  originalQuestion: string;
}

export interface LocationRecord {
  locationType: "atm" | "branch";
  id: string;
  name: string;
  district: string;
  category: string;
  performanceStatus: string;
  longitude: number;
  latitude: number;
  rawProperties: Record<string, unknown>;
}

export interface AtmQueryResponse {
  intent: VoiceAgentIntent;
  matchedRecords: LocationRecord[];
  count: number;
  appliedFilters: Record<string, unknown>;
  message: string;
}

export interface DataLoadInfo {
  atmSourceUrl: string;
  branchSourceUrl: string;
  fallbackUsed: boolean;
}