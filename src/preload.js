const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Clipboard operations
  getClipboardHistory: () => ipcRenderer.invoke('get-clipboard-history'),
  copyToClipboard: (item) => ipcRenderer.invoke('copy-to-clipboard', item),
  deleteHistoryItem: (index) => ipcRenderer.invoke('delete-history-item', index),

  // Event listeners
  onClipboardHistoryUpdated: (callback) => {
    ipcRenderer.on('clipboard-history-updated', (event, history) => {
      callback(history);
    });
  },

  // Window operations
  closeWindow: () => ipcRenderer.invoke('close-window'),
  
  // Remove listeners (important for cleanup)
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

// Optional: Expose a limited set of Node.js APIs if needed
// contextBridge.exposeInMainWorld('nodeAPI', {
//   platform: process.platform,
//   version: process.version
// });
