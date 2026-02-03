import Store from 'electron-store';
import { ClipboardEntry } from './clipboard-monitor';

interface StoreSchema {
  history: ClipboardEntry[];
  settings: {
    maxHistory: number;
    shortcut: string;
  };
}

const store = new Store<StoreSchema>({
  defaults: {
    history: [],
    settings: {
      maxHistory: 100,
      shortcut: 'CommandOrControl+Option+V',
    },
  },
});

export function getHistory(): ClipboardEntry[] {
  return store.get('history');
}

export function saveHistory(history: ClipboardEntry[]): void {
  store.set('history', history);
}

export function getSettings(): StoreSchema['settings'] {
  return store.get('settings');
}

export function saveSettings(settings: Partial<StoreSchema['settings']>): void {
  const current = store.get('settings');
  store.set('settings', { ...current, ...settings });
}

export { store };
