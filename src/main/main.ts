import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, shell, NativeImage } from 'electron';
import path from 'path';
import { GatewayManager } from './gateway';
import { setStartup, getStartup } from './startup';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let gatewayManager: GatewayManager;

const isDev = !app.isPackaged;

function createWindow() {
  const iconPath = isDev
    ? path.join(__dirname, '../../assets/icon.ico')
    : path.join(process.resourcesPath, 'assets/icon.ico');

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 700,
    minHeight: 500,
    backgroundColor: '#18181b',
    icon: iconPath,
    show: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Always open DevTools in dev so we can see errors
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('close', (e) => {
    if (tray) {
      e.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  const iconPath = isDev
    ? path.join(__dirname, '../../assets/tray-icon.png')
    : path.join(process.resourcesPath, 'assets/tray-icon.png');

  let icon: NativeImage;
  try {
    icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  } catch {
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  tray.setToolTip('OpenClaw Desktop');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show OpenClaw',
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        tray?.destroy();
        tray = null;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
}

// ── IPC Handlers ──

function setupIPC() {
  ipcMain.handle('gateway:health', async () => {
    return gatewayManager.checkHealth();
  });

  ipcMain.handle('gateway:start', async () => {
    return gatewayManager.startGateway();
  });

  ipcMain.handle('gateway:restart', async () => {
    return gatewayManager.restartGateway();
  });

  ipcMain.handle('gateway:getConfig', () => {
    return gatewayManager.getConfig();
  });

  ipcMain.handle('gateway:updateConfig', (_e, config: { url?: string; token?: string }) => {
    gatewayManager.updateConfig(config);
    return true;
  });

  ipcMain.handle('startup:get', () => {
    return getStartup();
  });

  ipcMain.handle('startup:set', (_e, enabled: boolean) => {
    setStartup(enabled);
    return true;
  });

  ipcMain.handle('window:minimize', () => mainWindow?.minimize());
  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.handle('window:close', () => mainWindow?.close());

  ipcMain.handle('shell:openExternal', (_e, url: string) => {
    shell.openExternal(url);
  });
}

// ── App lifecycle ──

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    gatewayManager = new GatewayManager();
    setupIPC();
    createWindow();
    createTray();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      // keep running with tray
    }
  });

  app.on('activate', () => {
    if (!mainWindow) createWindow();
  });
}
