const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('horizon', {
  // Mouse events for click-through
  setIgnoreMouseEvents: (ignore, options) => {
    ipcRenderer.send('set-ignore-mouse-events', ignore, options);
  },

  // Window bounds for hover detection
  getWindowBounds: () => ipcRenderer.invoke('get-window-bounds'),
  getDisplayInfo: () => ipcRenderer.invoke('get-display-info'),
  setWindowHeight: (height) => ipcRenderer.invoke('set-window-height', height),

  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),

  // Quick Capture
  saveCapture: (text) => ipcRenderer.invoke('save-capture', text),
  getCaptures: () => ipcRenderer.invoke('get-captures'),
  closeQuickCapture: () => ipcRenderer.send('close-quick-capture'),

  // Sessions
  saveSession: (session) => ipcRenderer.invoke('save-session', session),
  getSessions: () => ipcRenderer.invoke('get-sessions'),

  // Analytics
  getAnalytics: () => ipcRenderer.invoke('get-analytics'),
// Add these methods to the contextBridge in preload.js (after line 26, in the analytics section)

  // Session Analytics
  saveSessionAnalytics: (sessionData) => ipcRenderer.invoke('save-session-analytics', sessionData),
  getAllSessions: () => ipcRenderer.invoke('get-all-sessions'),
  getSessionsByDateRange: (startDate, endDate) => ipcRenderer.invoke('get-sessions-by-date-range', startDate, endDate),
  exportSessions: (format) => ipcRenderer.invoke('export-sessions', format),

  // Display mode
  setDisplayMode: (mode) => ipcRenderer.invoke('set-display-mode', mode),
  onDisplayModeChanged: (callback) => {
    ipcRenderer.on('display-mode-changed', (event, mode) => callback(mode));
  },

  // Auto-start
  setAutoStart: (enabled) => ipcRenderer.invoke('set-auto-start', enabled),
  getAutoStart: () => ipcRenderer.invoke('get-auto-start')
});
