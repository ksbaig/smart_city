import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from "@angular/core";
import { FormsModule } from "@angular/forms";

export interface AddedAttributeField {
  id: string;
  label: string;
  value: string;
  inputType?: "text" | "number";
}

@Component({
  selector: "app-added-attributes-editor",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./added-attributes-editor.component.html",
  styleUrl: "./added-attributes-editor.component.scss",
})
export class AddedAttributesEditorComponent implements OnChanges {
  @Input() title = "Added Attributes";
  @Input() fields: AddedAttributeField[] = [];
  @Input() saving = false;

  @Output() saveRequested = new EventEmitter<Record<string, string>>();
  @Output() deleteRequested = new EventEmitter<void>();
  @Output() cancelRequested = new EventEmitter<void>();

  editableFields: AddedAttributeField[] = [];
  private initialValues = new Map<string, string>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["fields"]) {
      this.editableFields = this.fields.map((field) => ({ ...field }));
      this.initialValues = new Map(this.editableFields.map((field) => [field.id, field.value ?? ""]));
    }
  }

  get hasChanges(): boolean {
    return this.editableFields.some((field) => (field.value ?? "") !== (this.initialValues.get(field.id) ?? ""));
  }

  requestSave(): void {
    const payload: Record<string, string> = {};
    for (const field of this.editableFields) {
      payload[field.id] = field.value ?? "";
    }
    this.saveRequested.emit(payload);
  }

  requestDelete(): void {
    this.deleteRequested.emit();
  }

  requestCancel(): void {
    this.cancelRequested.emit();
  }
}
