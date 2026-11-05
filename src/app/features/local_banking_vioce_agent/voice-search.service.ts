import { Injectable } from "@angular/core";
import { BehaviorSubject, Subject } from "rxjs";

export type VoiceSearchState = "idle" | "listening" | "processing" | "error" | "unsupported";

interface SpeechRecognitionResultLike {
  0: { transcript: string };
  isFinal: boolean;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: SpeechRecognitionResultLike[];
}

interface SpeechRecognitionErrorEventLike {
  error: string;
  message?: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start(): void;
  stop(): void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

@Injectable({ providedIn: "root" })
export class VoiceSearchService {
  private recognition?: SpeechRecognitionLike;
  private manuallyStopped = false;

  private readonly stateSubject = new BehaviorSubject<VoiceSearchState>("idle");
  readonly state$ = this.stateSubject.asObservable();

  private readonly transcriptSubject = new Subject<string>();
  readonly transcript$ = this.transcriptSubject.asObservable();

  private readonly errorSubject = new Subject<string>();
  readonly error$ = this.errorSubject.asObservable();

  isSupported(): boolean {
    return !!this.getSpeechRecognitionCtor();
  }

  start(lang = "en-US"): boolean {
    const ctor = this.getSpeechRecognitionCtor();
    if (!ctor) {
      this.stateSubject.next("unsupported");
      return false;
    }

    this.disposeRecognition();
    this.manuallyStopped = false;

    const recognition = new ctor();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      this.stateSubject.next("listening");
    };

    recognition.onresult = (event) => {
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result?.[0]?.transcript ?? "";
        if (result?.isFinal && transcript.trim()) {
          finalText += transcript;
        }
      }

      if (finalText.trim()) {
        this.transcriptSubject.next(finalText.trim());
      }
    };

    recognition.onerror = (event) => {
      this.stateSubject.next("error");
      const message = event?.message?.trim() || event?.error || "Speech recognition failed.";
      this.errorSubject.next(message);
    };

    recognition.onend = () => {
      this.stateSubject.next(this.manuallyStopped ? "idle" : "processing");
      if (!this.manuallyStopped) {
        this.stateSubject.next("idle");
      }
    };

    this.recognition = recognition;

    try {
      recognition.start();
      return true;
    } catch (error) {
      this.stateSubject.next("error");
      this.errorSubject.next(`Unable to start speech recognition: ${String(error)}`);
      return false;
    }
  }

  stop(): void {
    this.manuallyStopped = true;
    this.recognition?.stop();
  }

  destroy(): void {
    this.disposeRecognition();
    this.stateSubject.next("idle");
  }

  private disposeRecognition(): void {
    if (!this.recognition) {
      return;
    }
    this.recognition.onstart = null;
    this.recognition.onend = null;
    this.recognition.onresult = null;
    this.recognition.onerror = null;
    try {
      this.recognition.stop();
    } catch {
      // Ignore stop errors during cleanup.
    }
    this.recognition = undefined;
  }

  private getSpeechRecognitionCtor(): SpeechRecognitionCtor | undefined {
    const windowAny = window as unknown as {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    return windowAny.SpeechRecognition ?? windowAny.webkitSpeechRecognition;
  }
}