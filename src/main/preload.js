const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('horizon', {
  // Mouse events for click-through
  setIgnoreMouseEvents: (ignore, options) => {
    ipcRenderer.send('set-ignore-mouse-events', ignore, options);
  },

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
  getAnalytics: () => ipcRenderer.invoke('get-analytics')
});
