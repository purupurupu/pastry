export interface ClipboardItem {
  id: string;
  content: string;
  type: 'text' | 'image';
  timestamp: number;
  preview?: string;
}
