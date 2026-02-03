export interface ClipboardItem {
  id: string;
  content: string;
  type: 'text' | 'image' | 'file';
  timestamp: number;
  preview?: string;
}
