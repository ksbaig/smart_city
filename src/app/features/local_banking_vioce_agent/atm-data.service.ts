import { Injectable } from "@angular/core";
import { NaturalLanguageQueryService } from "./natural-language-query.service";
import { AtmQueryResponse, DataLoadInfo, LocationRecord } from "./local-banking-vioce-agent.models";

type GeoJsonFeature = {
  properties?: Record<string, unknown>;
  geometry?: { type?: string; coordinates?: unknown };
};

@Injectable({ providedIn: "root" })
export class AtmDataService {
  private atmRecords: LocationRecord[] = [];
  private branchRecords: LocationRecord[] = [];
  private loadInfo: DataLoadInfo | null = null;
  private dataLoadPromise?: Promise<void>;

  constructor(private readonly queryService: NaturalLanguageQueryService) {}

  async ensureLoaded(): Promise<void> {
    if (this.dataLoadPromise) {
      return this.dataLoadPromise;
    }

    this.dataLoadPromise = (async () => {
      const atmResult = await this.loadAtmRecords();
      const branchResult = await this.loadBranchRecords();

      this.atmRecords = atmResult.records;
      this.branchRecords = branchResult.records;
      this.loadInfo = {
        atmSourceUrl: atmResult.source,
        branchSourceUrl: branchResult.source,
        fallbackUsed: atmResult.fallbackUsed || branchResult.fallbackUsed,
      };
    })();

    await this.dataLoadPromise;
  }

  getLoadInfo(): DataLoadInfo | null {
    return this.loadInfo;
  }

  getKnownDistricts(): string[] {
    const set = new Set<string>();
    for (const row of this.atmRecords) {
      if (row.district) {
        set.add(row.district);
      }
    }
    for (const row of this.branchRecords) {
      if (row.district) {
        set.add(row.district);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  async runNaturalLanguageQuery(question: string): Promise<AtmQueryResponse> {
    await this.ensureLoaded();

    const districts = this.getKnownDistricts();
    const query = this.queryService.parse(question, districts);
    const sourceRecords = this.pickRecords(query.target);

    if (query.intent === "unknown") {
      return {
        intent: query.intent,
        matchedRecords: [],
        count: 0,
        appliedFilters: {},
        message: "I could not understand that request. Try: Show all ATMs in Al Malaz.",
      };
    }

    if (query.intent === "find-atm-id") {
      const matched = this.atmRecords.filter((record) => this.normalizeId(record.id) === this.normalizeId(query.atmId));
      return this.buildResponse(query.intent, matched, { atmId: query.atmId }, matched.length ? `${matched.length} ATM record found.` : `No ATM found with ID ${query.atmId}.`);
    }

    if (query.intent === "find-branch-id") {
      const matched = this.branchRecords.filter((record) => this.normalizeId(record.id) === this.normalizeId(query.branchId));
      return this.buildResponse(query.intent, matched, { branchId: query.branchId }, matched.length ? `${matched.length} branch record found.` : `No branch found with ID ${query.branchId}.`);
    }

    let matched = [...sourceRecords];
    const appliedFilters: Record<string, unknown> = {};

    if (query.districtNames?.length) {
      const districtSet = new Set(query.districtNames.map((item) => this.normalizeText(item)));
      matched = matched.filter((record) => districtSet.has(this.normalizeText(record.district)));
      appliedFilters["districts"] = query.districtNames;
    } else if (query.unresolvedDistrictText) {
      return this.buildResponse(
        query.intent,
        [],
        { requestedDistrict: query.unresolvedDistrictText },
        `District not recognized: "${query.unresolvedDistrictText}". Please use a district name from the loaded data.`
      );
    }

    if (query.category) {
      const needle = this.normalizeText(query.category);
      matched = matched.filter((record) => {
        const category = this.normalizeText(record.category);
        const performance = this.normalizeText(record.performanceStatus);
        return category.includes(needle) || performance.includes(needle);
      });
      appliedFilters["category"] = query.category;
    }

    if (query.intent === "show-all") {
      const message = `${matched.length} ${this.describeTarget(query.target)} records loaded.`;
      return this.buildResponse(query.intent, matched, appliedFilters, message);
    }

    if (query.intent === "compare-districts") {
      const districtCounts = (query.districtNames ?? []).map((district) => {
        const count = matched.filter((item) => this.normalizeText(item.district) === this.normalizeText(district)).length;
        return `${district}: ${count}`;
      });
      const message = districtCounts.length ? `Comparison results - ${districtCounts.join(" | ")}` : "No district comparison results found.";
      return this.buildResponse(query.intent, matched, appliedFilters, message);
    }

    if (query.intent === "count") {
      return this.buildResponse(query.intent, matched, appliedFilters, `${matched.length} matching ${this.describeTarget(query.target)} records found.`);
    }

    return this.buildResponse(query.intent, matched, appliedFilters, `${matched.length} matching ${this.describeTarget(query.target)} records found.`);
  }

  private pickRecords(target: "atm" | "branch" | "either"): LocationRecord[] {
    if (target === "branch") {
      return this.branchRecords;
    }
    if (target === "atm") {
      return this.atmRecords;
    }
    return this.atmRecords;
  }

  private describeTarget(target: "atm" | "branch" | "either"): string {
    if (target === "branch") {
      return "branch";
    }
    return "ATM";
  }

  private buildResponse(
    intent: AtmQueryResponse["intent"],
    matchedRecords: LocationRecord[],
    appliedFilters: Record<string, unknown>,
    message: string
  ): AtmQueryResponse {
    return {
      intent,
      matchedRecords,
      count: matchedRecords.length,
      appliedFilters,
      message,
    };
  }

  private async loadAtmRecords(): Promise<{ records: LocationRecord[]; source: string; fallbackUsed: boolean }> {
    const primaryCandidates = [
      "RAG/Riyadh_ATM_Locations.geojson",
      "geojson/Riyadh_ATM_Locations.geojson",
    ];
    const fallbackCandidates = ["RAG/Riyadh_ATMs_and_Branches.geojson", "geojson/Riyadh_ATMs_and_Branches.geojson"];

    const primary = await this.tryLoadFromCandidates(primaryCandidates, "atm");
    if (primary.records.length) {
      return { ...primary, fallbackUsed: false };
    }

    const fallback = await this.tryLoadFromCandidates(fallbackCandidates, "atm");
    return { ...fallback, fallbackUsed: true };
  }

  private async loadBranchRecords(): Promise<{ records: LocationRecord[]; source: string; fallbackUsed: boolean }> {
    const primaryCandidates = [
      "RAG/Riyadh_Branch_Locations.geojson",
      "geojson/Riyadh_Branch_Locations.geojson",
    ];
    const fallbackCandidates = ["RAG/Riyadh_ATMs_and_Branches.geojson", "geojson/Riyadh_ATMs_and_Branches.geojson"];

    const primary = await this.tryLoadFromCandidates(primaryCandidates, "branch");
    if (primary.records.length) {
      return { ...primary, fallbackUsed: false };
    }

    const fallback = await this.tryLoadFromCandidates(fallbackCandidates, "branch");
    return { ...fallback, fallbackUsed: true };
  }

  private async tryLoadFromCandidates(
    candidates: string[],
    target: "atm" | "branch"
  ): Promise<{ records: LocationRecord[]; source: string }> {
    for (const relativeUrl of candidates) {
      const records = await this.loadLocationRecords(relativeUrl, target);
      if (records.length) {
        return { records, source: relativeUrl };
      }
    }
    return { records: [], source: candidates[candidates.length - 1] ?? "" };
  }

  private async loadLocationRecords(relativeUrl: string, target: "atm" | "branch"): Promise<LocationRecord[]> {
    try {
      const url = new URL(relativeUrl, document.baseURI).toString();
      const response = await fetch(url);
      if (!response.ok) {
        return [];
      }

      const json = (await response.json()) as { features?: GeoJsonFeature[] };
      const features = Array.isArray(json.features) ? json.features : [];

      return features
        .map((feature) => this.toLocationRecord(feature, target))
        .filter((record): record is LocationRecord => !!record);
    } catch {
      return [];
    }
  }

  private toLocationRecord(feature: GeoJsonFeature, target: "atm" | "branch"): LocationRecord | null {
    const coords = feature.geometry?.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) {
      return null;
    }

    const longitude = Number(coords[0]);
    const latitude = Number(coords[1]);
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
      return null;
    }

    const props = feature.properties ?? {};
    const inferredType = this.inferType(props);
    if (target !== inferredType) {
      return null;
    }

    const id = this.readString(props, inferredType === "atm" ? ["ATM_ID", "id"] : ["Branch_ID", "id"]);
    if (!id) {
      return null;
    }

    return {
      locationType: inferredType,
      id,
      name: this.readString(props, inferredType === "atm" ? ["Site_Name", "name"] : ["Branch_Name", "name"]),
      district: this.readString(props, ["District", "district"]),
      category: this.readString(props, inferredType === "atm" ? ["ATM_Type", "atm_type"] : ["Location_Type"]),
      performanceStatus: this.readString(props, ["Performance_Status"]),
      longitude,
      latitude,
      rawProperties: props,
    };
  }

  private inferType(properties: Record<string, unknown>): "atm" | "branch" {
    const featureType = this.readString(properties, ["feature_type"]).toLowerCase();
    if (featureType === "branch") {
      return "branch";
    }
    if (featureType === "atm") {
      return "atm";
    }
    if (this.readString(properties, ["Branch_ID"])) {
      return "branch";
    }
    return "atm";
  }

  private readString(properties: Record<string, unknown>, keys: string[]): string {
    for (const key of keys) {
      const value = properties[key];
      if (value == null) {
        continue;
      }
      const text = String(value).trim();
      if (text) {
        return text;
      }
    }
    return "";
  }

  private normalizeId(value: string | undefined): string {
    return String(value ?? "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "")
      .replace(/(ATM|BR)(\d+)/, "$1-$2");
  }

  private normalizeText(value: string): string {
    return value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9\s-]/g, " ")
      .replace(/[\s_-]+/g, " ")
      .trim();
  }
}