import { spawn, ChildProcess } from 'child_process';

export interface PcmChunk {
  data: ArrayBuffer;
  timestamp: number;
  sequence: number;
  sampleRate?: number;
}

export class WhisperCppStreamer {
  private proc: ChildProcess | null = null;
  private ready = false;
  private buffer: Buffer[] = [];
  private onPartial?: (text: string) => void;
  private onFinal?: (text: string) => void;

  constructor(
    private opts: {
      whisperExePath: string; // path to main.exe (whisper.cpp)
      modelPath: string;      // path to ggml model
      language?: string;      // e.g. 'en'
    }
  ) {}

  static validateConfig(opts: { whisperExePath: string; modelPath: string }): { ok: boolean; message?: string } {
    try {
      const fs = require('fs');
      if (!opts.whisperExePath || !fs.existsSync(opts.whisperExePath)) {
        return { ok: false, message: `Whisper executable not found at ${opts.whisperExePath}` };
      }
      if (!opts.modelPath || !fs.existsSync(opts.modelPath)) {
        return { ok: false, message: `Whisper model not found at ${opts.modelPath}` };
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, message: `Validation error: ${(e as Error).message}` };
    }
  }

  start(): void {
    if (this.proc) return;
    const args = [
      '-m', this.opts.modelPath,
      '--language', this.opts.language || 'en',
      '--no-timestamps',
      '--output-rt', // real-time JSON lines
      '-', // read PCM from stdin
    ];
    this.proc = spawn(this.opts.whisperExePath, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    this.proc.stdout?.on('data', (d: Buffer) => {
      const lines = d.toString().split(/\r?\n/).filter(Boolean);
      for (const line of lines) {
        try {
          const obj = JSON.parse(line);
          if (obj.type === 'partial' && typeof obj.text === 'string') {
            this.onPartial?.(obj.text);
          } else if (obj.type === 'final' && typeof obj.text === 'string') {
            this.onFinal?.(obj.text);
          }
        } catch {
          // ignore non-JSON output
        }
      }
    });
    this.proc.stderr?.on('data', () => {});
    this.proc.on('close', () => {
      this.proc = null;
      this.ready = false;
    });
    this.ready = true;
  }

  stop(): void {
    if (this.proc) {
      this.proc.kill();
      this.proc = null;
      this.ready = false;
    }
  }

  setHandlers(onPartial?: (t: string) => void, onFinal?: (t: string) => void): void {
    this.onPartial = onPartial;
    this.onFinal = onFinal;
  }

  feedPcm(chunk: PcmChunk): void {
    if (!this.proc || !this.proc.stdin) return;
    const buf = Buffer.from(chunk.data);
    // whisper.cpp expects 16-bit PCM little-endian at the agreed sample rate; resampling is out of scope here
    this.proc.stdin.write(buf);
  }
}


