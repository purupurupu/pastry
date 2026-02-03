import { clipboard } from 'electron';
import crypto from 'node:crypto';
import path from 'node:path';

export interface ClipboardEntry {
  id: string;
  content: string;
  type: 'text' | 'image' | 'file';
  timestamp: number;
  preview?: string;
  filePath?: string;
}

type ClipboardChangeCallback = (entry: ClipboardEntry) => void;

// File type icons for common extensions
const FILE_TYPE_ICONS: Record<string, string> = {
  pdf: '📄',
  doc: '📝',
  docx: '📝',
  xls: '📊',
  xlsx: '📊',
  ppt: '📽️',
  pptx: '📽️',
  zip: '📦',
  rar: '📦',
  '7z': '📦',
  mp3: '🎵',
  wav: '🎵',
  mp4: '🎬',
  mov: '🎬',
  avi: '🎬',
  default: '📎',
};

function getFileIcon(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase().slice(1);
  return FILE_TYPE_ICONS[ext] || FILE_TYPE_ICONS.default;
}

export class ClipboardMonitor {
  private intervalId: NodeJS.Timeout | null = null;
  private lastTextHash: string = '';
  private lastImageHash: string = '';
  private lastFileHash: string = '';
  private callback: ClipboardChangeCallback | null = null;
  private skipNextDetection = false;


  /**
   * Skip the next clipboard change detection.
   * Used when the app itself copies something to avoid duplicate history entries.
   */
  public skipNext(): void {
    this.skipNextDetection = true;
    // Reset after 600ms (polling interval 500ms + margin)
    setTimeout(() => {
      this.skipNextDetection = false;
    }, 600);
  }

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
    // If skip flag is set, just update hashes without emitting
    const shouldSkip = this.skipNextDetection;
    if (shouldSkip) {
      this.skipNextDetection = false;
      this.updateHashes();
      return;
    }

    // Check for files first (macOS uses 'public.file-url' format)
    const fileBuffer = clipboard.readBuffer('public.file-url');
    if (fileBuffer && fileBuffer.length > 0) {
      const fileUrl = fileBuffer.toString('utf8').trim();
      if (fileUrl.startsWith('file://')) {
        const filePath = decodeURIComponent(fileUrl.replace('file://', ''));
        const fileHash = this.hash(filePath);
        if (fileHash !== this.lastFileHash) {
          this.lastFileHash = fileHash;
          this.lastTextHash = '';
          this.lastImageHash = '';
          const fileName = path.basename(filePath);
          const icon = getFileIcon(filePath);
          this.emitEntry({
            id: crypto.randomUUID(),
            content: `${icon} ${fileName}`,
            type: 'file',
            timestamp: Date.now(),
            filePath: filePath,
          });
          return;
        }
      }
    }

    const text = clipboard.readText();
    const image = clipboard.readImage();

    if (text) {
      const textHash = this.hash(text);
      if (textHash !== this.lastTextHash) {
        this.lastTextHash = textHash;
        this.lastImageHash = '';
        this.lastFileHash = '';
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
        this.lastFileHash = '';
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
    const fileBuffer = clipboard.readBuffer('public.file-url');

    if (fileBuffer && fileBuffer.length > 0) {
      const fileUrl = fileBuffer.toString('utf8').trim();
      if (fileUrl.startsWith('file://')) {
        const filePath = decodeURIComponent(fileUrl.replace('file://', ''));
        this.lastFileHash = this.hash(filePath);
      }
    }
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
