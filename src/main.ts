import { app, BrowserWindow, globalShortcut, clipboard, ipcMain, Menu } from 'electron';
import * as path from 'path';

interface ClipboardHistoryItem {
  id: string;
  type: 'text' | 'image';
  content: string; // For text: the actual text, for images: base64 data URL
  timestamp: string;
  preview: string; // For text: truncated text, for images: thumbnail or filename
  size?: number; // For images: file size in bytes
}

// Extend the app interface to include our custom property
declare global {
  namespace Electron {
    interface App {
      isQuiting?: boolean;
    }
  }
}

class ClipboardManager {
  private mainWindow: BrowserWindow | null = null;
  private clipboardHistory: ClipboardHistoryItem[] = [];
  private readonly MAX_HISTORY = 25;
  private lastClipboardContent = '';
  private clipboardMonitorInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.setupApp();
  }

  private setupApp(): void {
    app.whenReady().then(() => {
      this.createWindow();
      this.registerGlobalShortcuts();
      this.startClipboardMonitoring();
      this.createMenuBar();
      this.setupIpcHandlers();
    });

    app.on('window-all-closed', this.onWindowAllClosed.bind(this));
    app.on('activate', this.onActivate.bind(this));
    app.on('will-quit', this.onWillQuit.bind(this));
  }

  private createWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 500,
      height: 600,
      show: false,
      frame: true,
      resizable: true,
      alwaysOnTop: true,
      skipTaskbar: false,
      webPreferences: {
        nodeIntegration: false,           // Disabled for security
        contextIsolation: true,           // Enabled for security
        preload: path.join(__dirname, 'preload.js'),
        sandbox: false // Keep false to allow preload script access
      }
    });

    // Load from Vite dev server in development, built files in production
    if (process.env.NODE_ENV === 'development') {
      this.mainWindow.loadURL('http://localhost:5173');
    } else {
      this.mainWindow.loadFile(path.join(__dirname, 'index.html'));
    }

    // Hide window when it loses focus
    this.mainWindow.on('blur', () => {
      this.mainWindow?.hide();
    });

    // Prevent window from being destroyed when closed
    this.mainWindow.on('close', (event) => {
      if (!app.isQuiting) {
        event.preventDefault();
        this.mainWindow?.hide();
      }
    });

    // Development: Open DevTools
    if (process.env.NODE_ENV === 'development') {
      this.mainWindow.webContents.openDevTools();
    }
  }

  private addTextToHistory(content: string): void {
    if (!content || content.trim() === '' || content === this.lastClipboardContent) {
      return;
    }

    // Remove if already exists to move it to top
    this.clipboardHistory = this.clipboardHistory.filter(item => 
      !(item.type === 'text' && item.content === content)
    );
    
    // Add to beginning
    const newItem: ClipboardHistoryItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type: 'text',
      content: content,
      timestamp: new Date().toLocaleString(),
      preview: content.length > 100 ? content.substring(0, 97) + '...' : content
    };
    
    this.clipboardHistory.unshift(newItem);
    this.limitHistorySize();
    this.lastClipboardContent = content;

    // Send updated history to renderer
    this.mainWindow?.webContents.send('clipboard-history-updated', this.clipboardHistory);
  }

  private addImageToHistory(imageDataUrl: string): void {
    if (!imageDataUrl || imageDataUrl === this.lastClipboardContent) {
      return;
    }

    // Calculate approximate size
    const sizeInBytes = Math.round((imageDataUrl.length * 3) / 4);
    
    // Remove if already exists to move it to top
    this.clipboardHistory = this.clipboardHistory.filter(item => 
      !(item.type === 'image' && item.content === imageDataUrl)
    );

    // Add to beginning
    const newItem: ClipboardHistoryItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type: 'image',
      content: imageDataUrl,
      timestamp: new Date().toLocaleString(),
      preview: `Image (${this.formatFileSize(sizeInBytes)})`,
      size: sizeInBytes
    };

    this.clipboardHistory.unshift(newItem);
    this.limitHistorySize();
    this.lastClipboardContent = imageDataUrl;

    // Send updated history to renderer
    this.mainWindow?.webContents.send('clipboard-history-updated', this.clipboardHistory);
  }

  private limitHistorySize(): void {
    if (this.clipboardHistory.length > this.MAX_HISTORY) {
      this.clipboardHistory = this.clipboardHistory.slice(0, this.MAX_HISTORY);
    }
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private monitorClipboard(): void {
    // Check for images first
    const image = clipboard.readImage();
    if (!image.isEmpty()) {
      const imageDataUrl = `data:image/png;base64,${image.toPNG().toString('base64')}`;
      this.addImageToHistory(imageDataUrl);
      return;
    }

    // If no image, check for text
    const textContent = clipboard.readText();
    if (textContent) {
      this.addTextToHistory(textContent);
    }
  }

  private startClipboardMonitoring(): void {
    // Initial clipboard check
    this.monitorClipboard();
    
    // Start monitoring clipboard every 500ms
    this.clipboardMonitorInterval = setInterval(() => {
      this.monitorClipboard();
    }, 500);
  }

  private stopClipboardMonitoring(): void {
    if (this.clipboardMonitorInterval) {
      clearInterval(this.clipboardMonitorInterval);
      this.clipboardMonitorInterval = null;
    }
  }

  private registerGlobalShortcuts(): void {
    const ret = globalShortcut.register('CommandOrControl+Shift+V', () => {
      if (this.mainWindow?.isVisible()) {
        this.mainWindow.hide();
      } else {
        this.mainWindow?.show();
        this.mainWindow?.focus();
        // Send current history when window opens
        this.mainWindow?.webContents.send('clipboard-history-updated', this.clipboardHistory);
      }
    });

    if (!ret) {
      console.log('Registration of global shortcut failed');
    }
  }

  private createMenuBar(): void {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'Clipboard Manager',
        submenu: [
          {
            label: 'Show Clipboard History',
            accelerator: 'CommandOrControl+Shift+V',
            click: () => {
              this.mainWindow?.show();
              this.mainWindow?.focus();
            }
          },
          { type: 'separator' },
          {
            label: 'Clear History',
            click: () => {
              this.clipboardHistory = [];
              this.lastClipboardContent = '';
              this.mainWindow?.webContents.send('clipboard-history-updated', this.clipboardHistory);
            }
          },
          { type: 'separator' },
          {
            label: 'Quit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              app.isQuiting = true;
              app.quit();
            }
          }
        ]
      }
    ];

    if (process.platform === 'darwin') {
      // macOS specific menu handling
      const menu = Menu.buildFromTemplate(template);
      Menu.setApplicationMenu(menu);
    }
  }

  private setupIpcHandlers(): void {
    // Handle IPC messages
    ipcMain.handle('get-clipboard-history', () => {
      return this.clipboardHistory;
    });

    ipcMain.handle('copy-to-clipboard', (event, item: ClipboardHistoryItem) => {
      if (item.type === 'text') {
        clipboard.writeText(item.content);
      } else if (item.type === 'image') {
        // Convert base64 back to image and write to clipboard
        const base64Data = item.content.replace(/^data:image\/[a-z]+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');
        const nativeImage = require('electron').nativeImage.createFromBuffer(imageBuffer);
        clipboard.writeImage(nativeImage);
      }
      this.mainWindow?.hide();
    });

    ipcMain.handle('delete-history-item', (event, index: number) => {
      if (index >= 0 && index < this.clipboardHistory.length) {
        this.clipboardHistory.splice(index, 1);
        this.mainWindow?.webContents.send('clipboard-history-updated', this.clipboardHistory);
      }
    });

    ipcMain.handle('close-window', () => {
      this.mainWindow?.hide();
    });
  }

  private onWindowAllClosed(): void {
    // On macOS, keep the app running even when all windows are closed
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }

  private onActivate(): void {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      this.createWindow();
    }
  }

  private onWillQuit(): void {
    // Cleanup
    globalShortcut.unregisterAll();
    this.stopClipboardMonitoring();
  }
}

// Initialize the application
new ClipboardManager();
