import { clipboard } from 'electron';
import crypto from 'node:crypto';

export interface ClipboardEntry {
  id: string;
  content: string;
  type: 'text' | 'image';
  timestamp: number;
  preview?: string;
}

type ClipboardChangeCallback = (entry: ClipboardEntry) => void;

export class ClipboardMonitor {
  private intervalId: NodeJS.Timeout | null = null;
  private lastTextHash: string = '';
  private lastImageHash: string = '';
  private callback: ClipboardChangeCallback | null = null;

  start(callback: ClipboardChangeCallback, intervalMs = 500): void {
    this.callback = callback;
    this.updateHashes();

    this.intervalId = setInterval(() => {
      this.check();
    }, intervalMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private check(): void {
    const text = clipboard.readText();
    const image = clipboard.readImage();

    if (text) {
      const textHash = this.hash(text);
      if (textHash !== this.lastTextHash) {
        this.lastTextHash = textHash;
        this.lastImageHash = '';
        this.emitEntry({
          id: crypto.randomUUID(),
          content: text,
          type: 'text',
          timestamp: Date.now(),
        });
      }
    } else if (!image.isEmpty()) {
      const imageBuffer = image.toPNG();
      const imageHash = this.hash(imageBuffer);
      if (imageHash !== this.lastImageHash) {
        this.lastImageHash = imageHash;
        this.lastTextHash = '';
        const dataUrl = image.toDataURL();
        this.emitEntry({
          id: crypto.randomUUID(),
          content: `[Image ${image.getSize().width}x${image.getSize().height}]`,
          type: 'image',
          timestamp: Date.now(),
          preview: dataUrl,
        });
      }
    }
  }

  private updateHashes(): void {
    const text = clipboard.readText();
    const image = clipboard.readImage();

    if (text) {
      this.lastTextHash = this.hash(text);
    }
    if (!image.isEmpty()) {
      this.lastImageHash = this.hash(image.toPNG());
    }
  }

  private hash(data: string | Buffer): string {
    return crypto.createHash('md5').update(data).digest('hex');
  }

  private emitEntry(entry: ClipboardEntry): void {
    if (this.callback) {
      this.callback(entry);
    }
  }
}
