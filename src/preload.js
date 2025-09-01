const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Clipboard operations
  getClipboardHistory: () => ipcRenderer.invoke('get-clipboard-history'),
  copyToClipboard: (item) => ipcRenderer.invoke('copy-to-clipboard', item),
  deleteHistoryItem: (index) => ipcRenderer.invoke('delete-history-item', index),
  clearHistory: () => ipcRenderer.invoke('clear-history'),

  // Event listeners
  onClipboardHistoryUpdated: (callback) => {
    ipcRenderer.on('clipboard-history-updated', (event, history) => {
      callback(history);
    });
  },

  onShowPreferences: (callback) => {
    ipcRenderer.on('show-preferences', () => {
      callback();
    });
  },

  onShowClipboardHistory: (callback) => {
    ipcRenderer.on('show-clipboard-history', () => {
      callback();
    });
  },

  // Window operations
  closeWindow: () => ipcRenderer.invoke('close-window'),
  
  // Preferences operations
  getPreferences: () => ipcRenderer.invoke('get-preferences'),
  savePreferences: (preferences) => ipcRenderer.invoke('save-preferences', preferences),
  
  // Remove listeners (important for cleanup)
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});