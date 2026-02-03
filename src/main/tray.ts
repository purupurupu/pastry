import { Tray, Menu, nativeImage, BrowserWindow } from 'electron';

let tray: Tray | null = null;

// 16x16 clipboard icon (Template image for macOS menu bar)
const iconBase64 = `
iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlz
AAALEwAACxMBAJqcGAAAAFVJREFUOI1jYBgFgw4wMjIy/Gdg+M/AwMDAwMTExPCfkZGRkQGJz8TE
xPSfkZHxPyMj438GBgaG/0xMTP+ZmJj+MzEx/WdiYvrPxMT0n4mJ6T8NXQMA0OAMCN1bLAQAAAAA
SUVORK5CYII=
`.trim();

export function createTray(mainWindow: BrowserWindow, onQuit: () => void): Tray {
  // Create icon from base64
  const icon = nativeImage.createFromDataURL(`data:image/png;base64,${iconBase64}`);
  icon.setTemplateImage(true);

  tray = new Tray(icon);
  tray.setToolTip('Pastry - Clipboard Manager');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Pastry',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      },
    },
    { type: 'separator' },
    {
      label: 'Preferences...',
      accelerator: 'CmdOrCtrl+,',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
        mainWindow.webContents.send('open-settings');
      },
    },
    { type: 'separator' },
    {
      label: 'Quit Pastry',
      accelerator: 'CmdOrCtrl+Q',
      click: onQuit,
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  return tray;
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}
