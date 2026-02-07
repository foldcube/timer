const { app, BrowserWindow, globalShortcut, ipcMain, screen } = require('electron');
const path = require('path');
const Store = require('./store');
const AutoLaunch = require('auto-launch');

// Initialize auto-launch
const autoLauncher = new AutoLaunch({
  name: 'Horizon Timer',
  path: app.getPath('exe')
});

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
      brownNoiseVolume: 0.3,
      displayMode: 'all-screens' // 'all-screens' or 'primary-screen'
    }
  }
});

let mainWindow = null;
let quickCaptureWindow = null;

function getWindowBounds() {
  const settings = store.get('settings');
  const displayMode = settings.displayMode || 'all-screens';
  const displays = screen.getAllDisplays();
  const windowHeight = 120; // Small height for the horizon line + controls

  if (displayMode === 'primary-screen') {
    // Use only the primary display
    const primaryDisplay = screen.getPrimaryDisplay();
    const { x, y, width } = primaryDisplay.bounds;
    return { width, height: windowHeight, x, y };
  } else {
    // Use all displays (all-screens mode)
    let minX = Infinity, minY = Infinity, maxX = -Infinity;

    displays.forEach(display => {
      const { x, y, width } = display.bounds;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width);
    });

    const totalWidth = maxX - minX;
    return { width: totalWidth, height: windowHeight, x: minX, y: minY };
  }
}

function createMainWindow() {
  const bounds = getWindowBounds();

  mainWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
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

  // Don't enable click-through initially - let the renderer control it
  // This allows initial clicks to work. The hover controller will enable
  // click-through after hiding controls for the first time.
  // mainWindow.setIgnoreMouseEvents(true, { forward: true });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // Open DevTools for debugging
  mainWindow.webContents.openDevTools({ mode: 'detach' });

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

function updateWindowBounds() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  
  // Auto-detect display mode based on number of displays
  const displays = screen.getAllDisplays();
  const settings = store.get('settings');
  let displayMode = settings.displayMode || 'all-screens';
  
  // Auto-switch to primary-screen when only one monitor is detected
  if (displays.length === 1 && displayMode === 'all-screens') {
    displayMode = 'primary-screen';
    settings.displayMode = displayMode;
    store.set('settings', settings);
    console.log('Auto-switched to primary-screen mode (single monitor detected)');
    
    // Notify renderer to update UI
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('display-mode-changed', displayMode);
    }
  }
  // Auto-switch to all-screens when multiple monitors are detected (if user prefers)
  // Note: We don't auto-switch back to all-screens to respect user preference
  // User can manually switch if they want to span multiple screens
  
  const bounds = getWindowBounds();
  mainWindow.setBounds(bounds);
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
// Add these IPC handlers to main.js after line 218 (after get-analytics handler)

// New session analytics handlers
ipcMain.handle('save-session-analytics', (event, sessionData) => {
  return store.saveSessionData(sessionData);
});

ipcMain.handle('get-all-sessions', () => {
  return store.getAllSessions();
});

ipcMain.handle('get-sessions-by-date-range', (event, startDate, endDate) => {
  return store.getSessionsByDateRange(startDate, endDate);
});

ipcMain.handle('export-sessions', (event, format) => {
  return store.exportSessions(format);
});

ipcMain.on('close-quick-capture', () => {
  if (quickCaptureWindow && !quickCaptureWindow.isDestroyed()) {
    quickCaptureWindow.close();
  }
});

ipcMain.handle('get-window-bounds', () => {
  if (mainWindow) {
    return mainWindow.getBounds();
  }
  return null;
});

ipcMain.handle('get-display-info', () => {
  const displays = screen.getAllDisplays();
  const primaryDisplay = screen.getPrimaryDisplay();
  const settings = store.get('settings');
  
  return {
    numDisplays: displays.length,
    primaryBounds: primaryDisplay.bounds,
    displayMode: settings.displayMode || 'all-screens',
    allDisplays: displays.map(d => ({
      id: d.id,
      bounds: d.bounds,
      isPrimary: d.id === primaryDisplay.id
    }))
  };
});

ipcMain.handle('set-display-mode', (event, mode) => {
  const settings = store.get('settings');
  settings.displayMode = mode;
  store.set('settings', settings);
  
  // Update window bounds immediately
  updateWindowBounds();
  return true;
});

// Auto-start handlers
ipcMain.handle('set-auto-start', async (event, enabled) => {
  try {
    if (enabled) {
      await autoLauncher.enable();
    } else {
      await autoLauncher.disable();
    }
    
    const settings = store.get('settings');
    settings.autoStart = enabled;
    store.set('settings', settings);
    return true;
  } catch (error) {
    console.error('Auto-start error:', error);
    return false;
  }
});

// Resize window for analytics panel
ipcMain.handle('set-window-height', (event, height) => {
  if (!mainWindow || mainWindow.isDestroyed()) return false;
  
  const bounds = mainWindow.getBounds();
  mainWindow.setBounds({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: height
  });
  return true;
});

ipcMain.handle('get-auto-start', async () => {
  try {
    return await autoLauncher.isEnabled();
  } catch (error) {
    console.error('Get auto-start error:', error);
    return false;
  }
});

// App lifecycle
app.whenReady().then(() => {
  createMainWindow();
  registerGlobalShortcuts();

  // Listen for display configuration changes
  screen.on('display-added', updateWindowBounds);
  screen.on('display-removed', updateWindowBounds);
  screen.on('display-metrics-changed', updateWindowBounds);

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
