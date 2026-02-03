import { app, BrowserWindow, ipcMain, clipboard, globalShortcut } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { ClipboardMonitor, ClipboardEntry } from './main/clipboard-monitor';
import { getHistory, saveHistory, getSettings, saveSettings } from './main/store';
import { createTray, destroyTray } from './main/tray';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;
const clipboardMonitor = new ClipboardMonitor();
let history: ClipboardEntry[] = [];
let isQuitting = false;

const createWindow = () => {
  const settings = getSettings();

  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    minWidth: 300,
    minHeight: 400,
    frame: false,
    transparent: true,
    vibrancy: 'under-window',
    visualEffectState: 'active',
    show: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('blur', () => {
    // Hide window when it loses focus (like Paste app)
    if (!MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      mainWindow?.hide();
    }
  });

  // Prevent window from being closed, just hide it
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // Register global shortcut
  globalShortcut.register(settings.shortcut, () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow?.show();
      mainWindow?.focus();
    }
  });

  // Create tray icon
  createTray(mainWindow, () => {
    isQuitting = true;
    app.quit();
  });
};

const setupClipboardMonitor = () => {
  const settings = getSettings();

  clipboardMonitor.start((entry) => {
    // Add to beginning of history
    history.unshift(entry);

    // Limit history size
    if (history.length > settings.maxHistory) {
      history.pop();
    }

    // Save to disk
    saveHistory(history);

    // Send to renderer
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('clipboard:change', entry);
    }
  });
};

const setupIPC = () => {
  ipcMain.handle('clipboard:get-history', () => {
    return history;
  });

  ipcMain.on('clipboard:copy', (_event, content: string) => {
    clipboard.writeText(content);
  });

  ipcMain.on('clipboard:delete', (_event, id: string) => {
    const index = history.findIndex((item) => item.id === id);
    if (index !== -1) {
      history.splice(index, 1);
      saveHistory(history);
    }
  });

  ipcMain.on('clipboard:clear', () => {
    history = [];
    saveHistory(history);
  });

  // Settings
  ipcMain.handle('settings:get', () => {
    return getSettings();
  });

  ipcMain.handle('settings:save', (_event, newSettings: { maxHistory?: number; shortcut?: string }) => {
    const oldSettings = getSettings();
    saveSettings(newSettings);

    // Re-register shortcut if changed
    if (newSettings.shortcut && newSettings.shortcut !== oldSettings.shortcut) {
      globalShortcut.unregister(oldSettings.shortcut);
      globalShortcut.register(newSettings.shortcut, () => {
        if (mainWindow?.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow?.show();
          mainWindow?.focus();
        }
      });
    }
  });
};

app.on('ready', () => {
  // Load history from disk
  history = getHistory();

  // Hide dock icon on macOS (menu bar app)
  if (process.platform === 'darwin' && app.dock) {
    app.dock.hide();
  }

  createWindow();
  setupIPC();
  setupClipboardMonitor();
});

app.on('window-all-closed', () => {
  // Don't quit on macOS when window is closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else {
    mainWindow?.show();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('will-quit', () => {
  clipboardMonitor.stop();
  globalShortcut.unregisterAll();
  destroyTray();
});
