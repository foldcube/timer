const { app, BrowserWindow, globalShortcut, ipcMain, screen } = require('electron');
const path = require('path');
const Store = require('./store');

// Initialize data store
const store = new Store({
  configName: 'horizon-data',
  defaults: {
    captures: [],
    sessions: [],
    settings: {
      timerDuration: 25 * 60 * 1000, // 25 minutes default
      hoverDelay: 400,
      quickCaptureHotkey: 'Alt+Space',
      brownNoiseEnabled: false,
      brownNoiseVolume: 0.3
    }
  }
});

let mainWindow = null;
let quickCaptureWindow = null;

function createMainWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width } = primaryDisplay.workAreaSize;

  mainWindow = new BrowserWindow({
    width: width,
    height: 120, // Small height for the horizon line + controls
    x: 0,
    y: 0,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    focusable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Enable click-through by default
  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // Handle hover detection for click-through toggle
  ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
    if (mainWindow) {
      mainWindow.setIgnoreMouseEvents(ignore, options);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createQuickCaptureWindow() {
  if (quickCaptureWindow && !quickCaptureWindow.isDestroyed()) {
    quickCaptureWindow.focus();
    return;
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  quickCaptureWindow = new BrowserWindow({
    width: 600,
    height: 60,
    x: Math.floor((width - 600) / 2),
    y: Math.floor(height / 3),
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  quickCaptureWindow.loadFile(path.join(__dirname, '../renderer/quick-capture.html'));

  quickCaptureWindow.on('blur', () => {
    if (quickCaptureWindow && !quickCaptureWindow.isDestroyed()) {
      quickCaptureWindow.close();
    }
  });

  quickCaptureWindow.on('closed', () => {
    quickCaptureWindow = null;
  });
}

function registerGlobalShortcuts() {
  // Quick Capture hotkey
  globalShortcut.register('Alt+Space', () => {
    createQuickCaptureWindow();
  });

  // Alternative hotkey
  globalShortcut.register('CommandOrControl+J', () => {
    createQuickCaptureWindow();
  });
}

// IPC Handlers
ipcMain.handle('get-settings', () => {
  return store.get('settings');
});

ipcMain.handle('save-settings', (event, settings) => {
  store.set('settings', settings);
  return true;
});

ipcMain.handle('save-capture', (event, text) => {
  const captures = store.get('captures') || [];
  captures.push({
    id: Date.now(),
    text: text,
    timestamp: new Date().toISOString()
  });
  store.set('captures', captures);
  return captures.length;
});

ipcMain.handle('get-captures', () => {
  return store.get('captures') || [];
});

ipcMain.handle('save-session', (event, session) => {
  const sessions = store.get('sessions') || [];
  sessions.push({
    ...session,
    id: Date.now(),
    timestamp: new Date().toISOString()
  });
  store.set('sessions', sessions);
  return true;
});

ipcMain.handle('get-sessions', () => {
  return store.get('sessions') || [];
});

ipcMain.handle('get-analytics', () => {
  const sessions = store.get('sessions') || [];
  const captures = store.get('captures') || [];

  return {
    totalSessions: sessions.length,
    totalCaptures: captures.length,
    averageRating: sessions.length > 0
      ? sessions.reduce((sum, s) => sum + (s.rating || 0), 0) / sessions.length
      : 0,
    sessionsThisWeek: sessions.filter(s => {
      const sessionDate = new Date(s.timestamp);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return sessionDate >= weekAgo;
    }).length,
    capturesThisWeek: captures.filter(c => {
      const captureDate = new Date(c.timestamp);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return captureDate >= weekAgo;
    }).length
  };
});

ipcMain.on('close-quick-capture', () => {
  if (quickCaptureWindow && !quickCaptureWindow.isDestroyed()) {
    quickCaptureWindow.close();
  }
});

// App lifecycle
app.whenReady().then(() => {
  createMainWindow();
  registerGlobalShortcuts();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
