import { CommonModule } from "@angular/common";
import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { PendingUpdateRecord } from "../../shared/models/pending-update.model";

type BadgeKind = "pending" | "investment" | "developed" | "lease" | "sold" | "allotted";

interface PendingUpdateAttributeDefinition {
  label: string;
  iconClass: string;
  readValue: (record: PendingUpdateRecord, index: number) => string;
}

interface PendingUpdateAttributeRow {
  label: string;
  iconClass: string;
  values: string[];
  badgeKinds: Array<BadgeKind | null>;
}

@Component({
  selector: "app-pending-updates",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./pending-updates.component.html",
  styleUrl: "./pending-updates.component.scss",
})
export class PendingUpdatesComponent implements OnChanges {
  @Input() records: PendingUpdateRecord[] = [];
  @Input() loading = false;
  @Input() error = "";

  readonly maxEditColumns = 3;

  visibleRecords: PendingUpdateRecord[] = [];
  attributeRows: PendingUpdateAttributeRow[] = [];
  editHeaders: string[] = [];

  readonly attributes: PendingUpdateAttributeDefinition[] = [
    { label: "CEO (Chief Executive Officer)", iconClass: "bi bi-person", readValue: (record) => record.ceo },
    { label: "GM (General Manager)", iconClass: "bi bi-people", readValue: (record) => record.gm },
    { label: "PM", iconClass: "bi bi-building", readValue: (record) => record.pm },
    { label: "Editor", iconClass: "bi bi-pencil", readValue: (record) => record.editor },
    { label: "PlotID", iconClass: "bi bi-hash", readValue: (record) => record.plotId },
    { label: "Landbank Area", iconClass: "bi bi-geo", readValue: (record) => record.landbankArea },
    { label: "Landbank GFA", iconClass: "bi bi-bounding-box", readValue: (record) => record.landbankGfa },
    { label: "Plot Status", iconClass: "bi bi-layers", readValue: (record) => record.status },
    { label: "English Ownership Type", iconClass: "bi bi-file-earmark-text", readValue: (record) => record.ownershipTypeEnglish },
    { label: "English Contract Status", iconClass: "bi bi-file-earmark-check", readValue: (record) => record.contractStatusEnglish },
    { label: "EnglishDeveloper", iconClass: "bi bi-globe", readValue: (record) => record.developerEnglish },
    { label: "English Lease Type", iconClass: "bi bi-clock", readValue: (record) => record.leaseTypeEnglish },
    { label: "English User Name", iconClass: "bi bi-person", readValue: (record) => record.userEnglishName },
    { label: "Contract No", iconClass: "bi bi-file-earmark-text", readValue: (record) => record.contractNo },
    { label: "Date Edit", iconClass: "bi bi-calendar3", readValue: (record) => this.formatSavedDate(record.savedAt) },
    { label: "Date Approval", iconClass: "bi bi-calendar-check", readValue: () => "-" },
    { label: "Edit Reference Number", iconClass: "bi bi-link-45deg", readValue: (_record, index) => `Editref${String(index + 1).padStart(2, "0")}` },
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["records"]) {
      this.buildViewModel();
    }
  }

  private buildViewModel(): void {
    const orderedRecords = [...this.records];
    const firstIndex = Math.max(0, orderedRecords.length - this.maxEditColumns);
    this.visibleRecords = orderedRecords.slice(firstIndex);

    this.editHeaders = Array.from({ length: this.maxEditColumns }, (_value, index) => `Edit ${index + 1}`);
    this.attributeRows = this.attributes.map((attribute) => {
      const values = this.editHeaders.map((_header, index) => {
        const record = this.visibleRecords[index];
        if (!record) {
          return "-";
        }
        return this.normalizeValue(attribute.readValue(record, index));
      });

      return {
        label: attribute.label,
        iconClass: attribute.iconClass,
        values,
        badgeKinds: values.map((value) => this.getBadgeKind(value)),
      };
    });
  }

  private normalizeValue(value: unknown): string {
    if (value === null || value === undefined || value === "") {
      return "-";
    }
    return String(value);
  }

  private formatSavedDate(isoDate: string): string {
    if (!isoDate) {
      return "-";
    }

    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private getBadgeKind(value: string): BadgeKind | null {
    switch (value.trim().toLowerCase()) {
      case "pending":
        return "pending";
      case "investment":
        return "investment";
      case "developed":
        return "developed";
      case "lease":
        return "lease";
      case "sold":
        return "sold";
      case "allotted":
        return "allotted";
      default:
        return null;
    }
  }
}