import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface LocationAttribute {
  label: string;
  value: string | number;
  icon?: string;
}

export interface SelectedLocation {
  type: 'branch' | 'atm';
  id: string;
  bankName: string;
  district: string;
  name: string; // Branch_Name or Site_Name
  attributes?: LocationAttribute[];
  rawData?: any;
}

@Component({
  selector: 'app-component-download',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './component-download.component.html',
  styleUrl: './component-download.component.scss',
})
export class ComponentDownloadComponent {
  @Input() selectedLocation: SelectedLocation | null = null;
  @Output() closeModal = new EventEmitter<void>();
  @ViewChild('exportContent', { static: false }) exportContent?: ElementRef<HTMLDivElement>;

  ngOnInit() {
    if (this.selectedLocation && !this.selectedLocation.attributes) {
      this.generateAttributes();
    }
  }

  ngOnChanges() {
    if (this.selectedLocation) {
      this.generateAttributes();
    }
  }

  private generateAttributes() {
    const location = this.selectedLocation;
    if (!location) return;

    const attributes: LocationAttribute[] = [];

    if (location.type === 'branch') {
      attributes.push(
        { label: 'Branch ID', value: location.id, icon: 'bi-hash' },
        { label: 'Bank Name', value: location.bankName, icon: 'bi-bank' },
        { label: 'Branch Name', value: location.name, icon: 'bi-building' },
        { label: 'District', value: location.district, icon: 'bi-geo-alt' }
      );

      if (location.rawData?.Address) {
        attributes.push({ label: 'Address', value: location.rawData.Address, icon: 'bi-map' });
      }
      if (location.rawData?.Phone) {
        attributes.push({ label: 'Phone', value: location.rawData.Phone, icon: 'bi-telephone' });
      }
      if (location.rawData?.Hours) {
        attributes.push({ label: 'Hours', value: location.rawData.Hours, icon: 'bi-clock' });
      }
    } else if (location.type === 'atm') {
      attributes.push(
        { label: 'ATM ID', value: location.id, icon: 'bi-hash' },
        { label: 'Bank Name', value: location.bankName, icon: 'bi-bank' },
        { label: 'Site Name', value: location.name, icon: 'bi-building' },
        { label: 'District', value: location.district, icon: 'bi-geo-alt' }
      );

      if (location.rawData?.ATM_Type) {
        attributes.push({ label: 'ATM Type', value: location.rawData.ATM_Type, icon: 'bi-credit-card' });
      }
      if (location.rawData?.Services) {
        attributes.push({ label: 'Services', value: location.rawData.Services, icon: 'bi-gear' });
      }
      if (location.rawData?.Availability) {
        attributes.push({ label: 'Availability', value: location.rawData.Availability, icon: 'bi-clock-history' });
      }
    }

    location.attributes = attributes;
  }

  onClose() {
    this.closeModal.emit();
  }

  getMapPreviewUrl(): string | null {
    const rawData = this.selectedLocation?.rawData as Record<string, unknown> | undefined;
    const value = rawData?.["mapPreviewUrl"];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
    return null;
  }

  downloadAsJSON() {
    const location = this.selectedLocation;
    if (!location) return;

    const dataToDownload = {
      type: location.type,
      id: location.id,
      bankName: location.bankName,
      district: location.district,
      name: location.name,
      attributes: location.attributes,
      downloadedAt: new Date().toISOString(),
    };

    const jsonString = JSON.stringify(dataToDownload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${location.type}-${location.id}-details.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  downloadAsCSV() {
    const location = this.selectedLocation;
    if (!location) return;

    const attributes = location.attributes || [];
    const header = 'Label,Value\n';
    const rows = attributes.map(attr => `"${attr.label}","${attr.value}"`).join('\n');
    const csvContent = header + rows;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${location.type}-${location.id}-details.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  printDetails() {
    const location = this.selectedLocation;
    if (!location) return;

    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;

    const attributesHTML = (location.attributes || [])
      .map(attr => `<tr><td style="border: 1px solid #ddd; padding: 8px;"><strong>${attr.label}</strong></td><td style="border: 1px solid #ddd; padding: 8px;">${attr.value}</td></tr>`)
      .join('');

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${location.type.toUpperCase()} Details</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { margin: 0; color: #333; }
          .header p { margin: 5px 0; color: #666; }
          .logo-placeholder { width: 100px; height: 50px; background-color: #4CAF50; margin: 0 auto 10px; border-radius: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #4CAF50; color: white; padding: 10px; text-align: left; }
          td { padding: 10px; border: 1px solid #ddd; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-placeholder"></div>
          <h1>${location.type === 'branch' ? 'Branch Details' : 'ATM Details'}</h1>
          <p><strong>${location.name}</strong></p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Attribute</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            ${attributesHTML}
          </tbody>
        </table>
        <div class="footer">
          <p>Printed on ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
  }

  copyToClipboard() {
    const location = this.selectedLocation;
    if (!location) return;

    const text = (location.attributes || [])
      .map(attr => `${attr.label}: ${attr.value}`)
      .join('\n');

    navigator.clipboard.writeText(text).then(() => {
      alert('Attributes copied to clipboard!');
    });
  }

  async saveAsJpg() {
    const canvas = await this.captureExportCanvas();
    if (!canvas || !this.selectedLocation) return;

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.download = `${this.selectedLocation.type}-${this.selectedLocation.id}-details.jpg`;
    link.click();
  }

  async saveAsPdf() {
    const canvas = await this.captureExportCanvas();
    if (!canvas || !this.selectedLocation) return;

    const imageData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: canvas.width >= canvas.height ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 8;
    const maxWidth = pageWidth - margin * 2;
    const maxHeight = pageHeight - margin * 2;

    const ratio = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
    const renderWidth = canvas.width * ratio;
    const renderHeight = canvas.height * ratio;
    const x = (pageWidth - renderWidth) / 2;
    const y = (pageHeight - renderHeight) / 2;

    pdf.addImage(imageData, 'JPEG', x, y, renderWidth, renderHeight, undefined, 'FAST');
    pdf.save(`${this.selectedLocation.type}-${this.selectedLocation.id}-details.pdf`);
  }

  private async captureExportCanvas(): Promise<HTMLCanvasElement | null> {
    const target = this.exportContent?.nativeElement;
    if (!target) {
      console.warn('captureExportCanvas: export content element not found');
      return null;
    }

    try {
      return await html2canvas(target, {
        useCORS: true,
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        ignoreElements: (element) => {
          const htmlElement = element as HTMLElement;
          return htmlElement.classList?.contains('modal-actions');
        },
      });
    } catch (error) {
      console.warn('captureExportCanvas failed', error);
      return null;
    }
  }
}
