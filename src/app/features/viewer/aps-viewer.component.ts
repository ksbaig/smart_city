import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AutodeskTokenService } from '../../core/services/autodesk-token.service';
import { ViewerService } from '../../core/services/viewer.service';

@Component({
  selector: 'app-aps-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './aps-viewer.component.html',
  styleUrls: ['./aps-viewer.component.css'],
})
export class ApsViewerComponent implements OnChanges, OnDestroy {
  /** Base64-encoded APS URN of the model to display. Leave blank to show placeholder. */
  @Input() urn = '';
  /** Emits when an error occurs so the parent can fall back to PDF/SVG. */
  @Output() viewerError = new EventEmitter<string>();

  @ViewChild('viewerHost', { static: true }) viewerHostRef!: ElementRef<HTMLDivElement>;

  state: 'idle' | 'loading' | 'ready' | 'error' | 'no-urn' = 'no-urn';
  errorMessage = '';

  constructor(
    private tokenSvc: AutodeskTokenService,
    private viewerSvc: ViewerService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['urn']) {
      const newUrn: string = changes['urn'].currentValue ?? '';
      if (newUrn && newUrn !== 'PLACEHOLDER_URN') {
        this.initAndLoad(newUrn);
      } else {
        this.state = 'no-urn';
        this.viewerSvc.destroyViewer();
      }
    }
  }

  private async initAndLoad(urn: string): Promise<void> {
    this.state = 'loading';
    this.errorMessage = '';
    try {
      const token = await this.tokenSvc.getToken();
      if (!this.viewerSvc.isReady) {
        await this.viewerSvc.initViewer(this.viewerHostRef.nativeElement, token);
      }
      this.viewerSvc.loadModel(urn);
      this.state = 'ready';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.state = 'error';
      this.errorMessage = msg;
      this.viewerError.emit(msg);
    }
  }

  ngOnDestroy(): void {
    this.viewerSvc.destroyViewer();
  }
}
