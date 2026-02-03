import { contextBridge, ipcRenderer } from 'electron';

export interface ClipboardItem {
  id: string;
  content: string;
  type: 'text' | 'image';
  timestamp: number;
  preview?: string;
}

const electronAPI = {
  onClipboardChange: (callback: (item: ClipboardItem) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, item: ClipboardItem) => {
      callback(item);
    };
    ipcRenderer.on('clipboard:change', subscription);
    return () => {
      ipcRenderer.removeListener('clipboard:change', subscription);
    };
  },
  copyToClipboard: (content: string) => {
    ipcRenderer.send('clipboard:copy', content);
  },
  getHistory: (): Promise<ClipboardItem[]> => {
    return ipcRenderer.invoke('clipboard:get-history');
  },
  deleteItem: (id: string) => {
    ipcRenderer.send('clipboard:delete', id);
  },
  clearHistory: () => {
    ipcRenderer.send('clipboard:clear');
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}
