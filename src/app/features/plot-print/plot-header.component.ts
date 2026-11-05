import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

// Handler for the Show Panoramic button can be used inside the component class

export interface PlotData {
  plotNo: string;
  gisRef: string;      // e.g. '01021702'
  date: string;        // e.g. 'Jan - 2025'
  revision: string | number;
}

@Component({
  selector: 'app-plot-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './plot-header.component.html',
  styleUrls: ['./plot-header.component.scss']
})
export class PlotHeaderComponent implements OnInit {

  /** Pass your plot data from the parent component */
  @Input() plotData: PlotData = {
    plotNo:   'A1',
    gisRef:   '01021702',
    date:     'Jan - 2025',
    revision: '0'
  };

  /** Path to your logo image — place logo.jpg in src/assets/ */
  @Input() logoPath: string = 'plotlogo.jpg';

  /** Array of 10 digit slots derived from gisRef */
  gisDigits: string[] = [];

  ngOnInit(): void {
    this.buildGisDigits();
  }

  onShowPanoramicClick(): void {
    console.log('[showpanoramic] Header button clicked.');
    // Here you can call your panoramic logic, e.g. open a modal or trigger the feature layer logic
  }

  onPanoramoramicClick(): void {
    console.log('[panoramoramic] Button clicked.');
    // Add logic for Panoramoramic button here
  }

  private buildGisDigits(): void {
    const totalSlots = 10;
    const digits = this.plotData.gisRef.split('');
    this.gisDigits = Array.from({ length: totalSlots }, (_, i) =>
      i < digits.length ? digits[i] : ''
    );
  }
}