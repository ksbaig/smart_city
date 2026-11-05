import { CommonModule } from "@angular/common";
import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, OnDestroy, ViewChild } from "@angular/core";

@Component({
  selector: "app-comp-bank-voice-agent",
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: "./comp_bank_voice_agent.component.html",
  styleUrl: "./comp_bank_voice_agent.component.scss",
})
export class Comp_bank_voice_agent implements AfterViewInit, OnDestroy {
  @ViewChild("widget", { static: true }) widget!: ElementRef<HTMLElement>;

  async ngAfterViewInit(): Promise<void> {
    await customElements.whenDefined("elevenlabs-convai");
    const widget = this.widget.nativeElement as HTMLElement & { startConversation?: () => Promise<void> };
    try {
      await widget.startConversation?.();
    } catch (error) {
      console.warn("ElevenLabs conversation could not be started", error);
    }
  }

  ngOnDestroy(): void {
    const widget = this.widget?.nativeElement as (HTMLElement & { endConversation?: () => void }) | undefined;
    widget?.endConversation?.();
  }
}

