import { Injectable } from "@angular/core";
import { AtmQuery, VoiceAgentTarget } from "./local-banking-vioce-agent.models";

@Injectable({ providedIn: "root" })
export class NaturalLanguageQueryService {
  private readonly districtAliases: Record<string, string[]> = {
    "Al Malaz": ["almulaz", "al mulaz", "al-malaz"],
    "Al Olaya": ["olaya", "alolaya", "al-olaya"],
  };

  parse(question: string, knownDistricts: string[]): AtmQuery {
    const originalQuestion = question.trim();
    const normalizedQuestion = this.normalize(originalQuestion);

    let target = this.resolveTarget(normalizedQuestion);
    const districtNames = this.resolveDistricts(normalizedQuestion, knownDistricts);
    const unresolvedDistrictText = districtNames.length ? undefined : this.extractRequestedDistrictHint(normalizedQuestion);

    const atmId = this.extractAtmId(originalQuestion, normalizedQuestion);
    if (atmId) {
      return {
        intent: "find-atm-id",
        target: "atm",
        atmId,
        districtNames,
        originalQuestion,
      };
    }

    const branchId = this.extractBranchId(originalQuestion, normalizedQuestion);
    if (branchId) {
      return {
        intent: "find-branch-id",
        target: "branch",
        branchId,
        districtNames,
        originalQuestion,
      };
    }

    const category = this.extractCategory(normalizedQuestion);
    
    // If performance status is detected and no explicit target was specified, target branches
    if (category && this.isPerformanceStatus(category) && target === "either") {
      target = "branch";
    }

    const isCompare = this.isCompareIntent(normalizedQuestion) && districtNames.length >= 2;
    if (isCompare) {
      return {
        intent: "compare-districts",
        target,
        districtNames,
        category,
        originalQuestion,
      };
    }

    if (this.isShowAllIntent(normalizedQuestion) && !districtNames.length) {
      return {
        intent: "show-all",
        target,
        category,
        originalQuestion,
      };
    }

    if (this.isCountIntent(normalizedQuestion)) {
      return {
        intent: "count",
        target,
        districtNames,
        category,
        unresolvedDistrictText,
        originalQuestion,
      };
    }

    if (districtNames.length || category) {
      return {
        intent: "filter",
        target,
        districtNames,
        category,
        unresolvedDistrictText,
        originalQuestion,
      };
    }

    if (this.isShowAllIntent(normalizedQuestion)) {
      return {
        intent: "show-all",
        target,
        originalQuestion,
      };
    }

    return {
      intent: "unknown",
      target,
      unresolvedDistrictText,
      originalQuestion,
    };
  }

  private resolveTarget(normalizedQuestion: string): VoiceAgentTarget {
    const hasAtm = /\batm\b/.test(normalizedQuestion);
    const hasBranch = /\bbranch\b/.test(normalizedQuestion);

    if (hasAtm && !hasBranch) {
      return "atm";
    }
    if (hasBranch && !hasAtm) {
      return "branch";
    }
    return "either";
  }

  private resolveDistricts(normalizedQuestion: string, knownDistricts: string[]): string[] {
    const normalizedDistricts = new Map<string, string>();
    for (const district of knownDistricts) {
      normalizedDistricts.set(this.normalize(district), district);
    }

    for (const [canonical, aliases] of Object.entries(this.districtAliases)) {
      const canonicalMatch = knownDistricts.find((item) => this.normalize(item) === this.normalize(canonical));
      if (!canonicalMatch) {
        continue;
      }
      for (const alias of aliases) {
        normalizedDistricts.set(this.normalize(alias), canonicalMatch);
      }
    }

    const found = new Set<string>();
    const haystack = normalizedQuestion.replace(/\s+/g, " ").trim();
    const compactHaystack = haystack.replace(/\s+/g, "");

    for (const [normalizedDistrict, canonicalDistrict] of normalizedDistricts.entries()) {
      const compactDistrict = normalizedDistrict.replace(/\s+/g, "");
      if (!compactDistrict) {
        continue;
      }
      if (haystack.includes(normalizedDistrict) || compactHaystack.includes(compactDistrict)) {
        found.add(canonicalDistrict);
      }
    }

    return Array.from(found);
  }

  private extractAtmId(originalQuestion: string, normalizedQuestion: string): string | undefined {
    const explicitAtm = originalQuestion.match(/ATM\s*-?\s*(\d{3,})/i);
    if (explicitAtm) {
      return `ATM-${explicitAtm[1]}`;
    }

    const atmContextNumber = normalizedQuestion.match(/\batm(?:\s+id)?\s*(\d{3,})\b/);
    if (atmContextNumber) {
      return `ATM-${atmContextNumber[1]}`;
    }

    return undefined;
  }

  private extractBranchId(originalQuestion: string, normalizedQuestion: string): string | undefined {
    const explicitBranch = originalQuestion.match(/BR\s*-?\s*(\d{3,})/i);
    if (explicitBranch) {
      return `BR-${explicitBranch[1]}`;
    }

    const branchContextNumber = normalizedQuestion.match(/\bbranch(?:\s+id)?\s*(\d{3,})\b/);
    if (branchContextNumber) {
      return `BR-${branchContextNumber[1]}`;
    }

    return undefined;
  }

  private extractCategory(normalizedQuestion: string): string | undefined {
    const performanceStatusValues = ["strong", "weak", "moderate"];
    const atmCategories = [
      "profit",
      "loss",
      "break even",
      "break-even",
      "drive through",
      "drive-through",
      "on site",
      "on-site",
      "off site",
      "off-site",
    ];
    const allCategories = [...performanceStatusValues, ...atmCategories];

    return allCategories.find((item) => normalizedQuestion.includes(this.normalize(item)));
  }

  private isPerformanceStatus(category: string | undefined): boolean {
    if (!category) {
      return false;
    }
    const performanceStatusValues = ["strong", "weak", "moderate"];
    const normalized = this.normalize(category);
    return performanceStatusValues.some((item) => normalized.includes(this.normalize(item)));
  }

  private extractRequestedDistrictHint(normalizedQuestion: string): string | undefined {
    const inMatch = normalizedQuestion.match(/\bin\s+([a-z0-9\s-]{3,})$/i);
    return inMatch?.[1]?.trim() || undefined;
  }

  private isCountIntent(normalizedQuestion: string): boolean {
    return /\bhow many\b|\bcount\b|\bnumber of\b/.test(normalizedQuestion);
  }

  private isCompareIntent(normalizedQuestion: string): boolean {
    return /\bcompare\b|\bversus\b|\bvs\b|\bbetween\b/.test(normalizedQuestion);
  }

  private isShowAllIntent(normalizedQuestion: string): boolean {
    return /\bshow all\b|\ball atms\b|\ball branches\b|\bshow atms\b|\bshow branches\b/.test(normalizedQuestion);
  }

  private normalize(value: string): string {
    return value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9\s-]/g, " ")
      .replace(/[\s_-]+/g, " ")
      .trim();
  }
}