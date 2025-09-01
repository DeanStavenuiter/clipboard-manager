import { app, BrowserWindow, globalShortcut, clipboard, ipcMain, Menu, Tray, nativeImage, Notification, screen } from 'electron';
import { autoUpdater } from 'electron-updater';
import * as path from 'path';
import * as fs from 'fs';

interface ClipboardHistoryItem {
  id: string;
  type: 'text' | 'image';
  content: string; // For text: the actual text, for images: base64 data URL
  timestamp: string;
  preview: string; // For text: truncated text, for images: thumbnail or filename
  size?: number; // For images: file size in bytes
}

interface PreferencesData {
  maxHistoryItems: number;
  launchAtStartup: boolean;
  showNotifications: boolean;
  hotkey: string;
  autoClearInterval: number;
  excludePasswords: boolean;
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
  private tray: Tray | null = null;
  private clipboardHistory: ClipboardHistoryItem[] = [];
  private lastClipboardContent = '';
  private lastNotifiedContent = ''; // Track last content we showed notification for
  private clipboardMonitorInterval: NodeJS.Timeout | null = null;
  private preferences: PreferencesData = {
    maxHistoryItems: 25,
    launchAtStartup: false,
    showNotifications: true,
    hotkey: 'CommandOrControl+Shift+V',
    autoClearInterval: 0,
    excludePasswords: true,
  };
  private preferencesPath: string;
  private historyPath: string;

  constructor() {
    // Set up file paths
    this.preferencesPath = path.join(app.getPath('userData'), 'preferences.json');
    this.historyPath = path.join(app.getPath('userData'), 'clipboardHistory.json');
    this.loadPreferences();
    this.loadClipboardHistory();
    this.setupApp();
    this.setupAutoUpdater();
  }

  // Load preferences from file
  private loadPreferences(): void {
    try {
      if (fs.existsSync(this.preferencesPath)) {
        const data = fs.readFileSync(this.preferencesPath, 'utf8');
        this.preferences = { ...this.preferences, ...JSON.parse(data) };
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  } 

  // Save preferences to file
  private savePreferencesToFile(): void {
    try {
      const dir = path.dirname(this.preferencesPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.preferencesPath, JSON.stringify(this.preferences, null, 2));
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  }

  // Load clipboard history from file
  private loadClipboardHistory(): void {
    try {
      if (fs.existsSync(this.historyPath)) {
        const data = fs.readFileSync(this.historyPath, 'utf8');
        const history = JSON.parse(data);
        
        // Validate the loaded data
        if (Array.isArray(history)) {
          this.clipboardHistory = history.filter(item => 
            item && 
            typeof item.id === 'string' && 
            typeof item.type === 'string' && 
            typeof item.content === 'string' &&
            typeof item.timestamp === 'string' &&
            (item.type === 'text' || item.type === 'image')
          );
          console.log(`Loaded ${this.clipboardHistory.length} clipboard items from storage`);
        }
      }
    } catch (error) {
      console.error('Failed to load clipboard history:', error);
      this.clipboardHistory = []; // Reset to empty on error
    }
  }

  // Save clipboard history to file
  private saveClipboardHistory(): void {
    try {
      const dir = path.dirname(this.historyPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.historyPath, JSON.stringify(this.clipboardHistory, null, 2));
    } catch (error) {
      console.error('Failed to save clipboard history:', error);
    }
  }

  // Setup the app
  private setupApp(): void {
    // Hide from dock on macOS (make it a tray-only app)
    if (process.platform === 'darwin') {
      app.dock.hide();
    }

    app.whenReady().then(() => {
      this.createWindow();
      this.createTray();
      this.registerGlobalShortcuts();
      this.startClipboardMonitoring();
      this.setupIpcHandlers();
    });

    app.on('window-all-closed', this.onWindowAllClosed.bind(this));
    app.on('activate', this.onActivate.bind(this));
    app.on('will-quit', this.onWillQuit.bind(this));
  }

  // Create the main window
  private createWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 500,
      height: 600,
      show: false,
      frame: true,
      resizable: true,
      alwaysOnTop: true,
      skipTaskbar: true,  // Hide from dock/taskbar
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

  // Create the tray icon
  private createTray(): void {
    const iconPath = 'assets/trex.png';
    
    let icon = nativeImage.createFromPath(iconPath)
    
    // Resize to proper tray icon size if needed
    if (!icon.isEmpty()) {
      icon = icon.resize({ width: 22, height: 22 });
    }
    
    // Don't use template image to preserve the original emoji colors
    icon.setTemplateImage(false);
    
    this.tray = new Tray(icon);
    this.tray.setToolTip('Trex');
    
    // Create context menu for tray
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Open Trex',
        accelerator: 'CommandOrControl+Shift+V',
        click: () => {
          this.toggleWindow();
        }
      },
      {
        label: 'Clear History...',
        click: () => {
          this.clipboardHistory = [];
          this.lastClipboardContent = '';
          this.lastNotifiedContent = '';
          this.saveClipboardHistory();
          this.mainWindow?.webContents.send('clipboard-history-updated', this.clipboardHistory);
        }
      },
      {
        label: 'Preferences...',
        click: () => {
          this.showPreferences();
        }
      },
      { type: 'separator' },
      {
        label: 'Check for Updates...',
        click: () => {
          if (process.env.NODE_ENV !== 'development') {
            autoUpdater.checkForUpdatesAndNotify();
          }
        }
      },
      {
        label: 'Quit Trex',
        accelerator: 'CommandOrControl+Q',
        click: () => {
          app.isQuiting = true;
          app.quit();
        }
      }
    ]);
    
    this.tray.setContextMenu(contextMenu);
    
    // Click to toggle window
    
  }

  // Calculate optimal window position based on cursor location
  private calculateWindowPosition(): { x: number; y: number } {
    try {
      // Get cursor position
      const cursorPoint = screen.getCursorScreenPoint();
      
      // Get the display where the cursor is located
      const currentDisplay = screen.getDisplayNearestPoint(cursorPoint);
      
      // Get window dimensions
      const windowWidth = 500;
      const windowHeight = 600;
      
      // Calculate position to center window on the current screen
      const screenBounds = currentDisplay.workArea;
      
      // Position window in the center of the current screen
      let x = screenBounds.x + Math.round((screenBounds.width - windowWidth) / 2);
      let y = screenBounds.y + Math.round((screenBounds.height - windowHeight) / 2);
      
      // Ensure window doesn't go outside screen bounds
      x = Math.max(screenBounds.x, Math.min(x, screenBounds.x + screenBounds.width - windowWidth));
      y = Math.max(screenBounds.y, Math.min(y, screenBounds.y + screenBounds.height - windowHeight));
      
      return { x, y };
    } catch (error) {
      console.error('Failed to calculate window position:', error);
      // Fallback to default positioning (center of primary display)
      const primaryDisplay = screen.getPrimaryDisplay();
      const screenBounds = primaryDisplay.workArea;
      return {
        x: screenBounds.x + Math.round((screenBounds.width - 500) / 2),
        y: screenBounds.y + Math.round((screenBounds.height - 600) / 2)
      };
    }
  }

  // Toggle the window
  private toggleWindow(): void {
    if (this.mainWindow?.isVisible()) {
      this.mainWindow.hide();
    } else {
      // Calculate position based on cursor location before showing
      const position = this.calculateWindowPosition();
      this.mainWindow?.setPosition(position.x, position.y);
      this.mainWindow?.show();
      this.mainWindow?.focus();
      // Send current history when window opens and reset to clipboard view
      this.mainWindow?.webContents.send('clipboard-history-updated', this.clipboardHistory);
      this.mainWindow?.webContents.send('show-clipboard-history'); // New event to ensure clipboard view
    }
  }
 
  // Show the preferences
  private showPreferences(): void {
    if (!this.mainWindow?.isVisible()) {
      // Calculate position based on cursor location before showing
      const position = this.calculateWindowPosition();
      this.mainWindow?.setPosition(position.x, position.y);
      this.mainWindow?.show();
      this.mainWindow?.focus();
    }
    // Always send show-preferences event when this method is called
    this.mainWindow?.webContents.send('show-preferences');
  }

  // Add text to history
  private addTextToHistory(content: string): void {
    if (!content || content.trim() === '' || content === this.lastClipboardContent) {
      return;
    }

    // Check if content looks like a password and should be excluded
    if (this.preferences.excludePasswords && this.looksLikePassword(content)) {
      // Only show notification if we haven't already notified about this content
      if (this.preferences.showNotifications && content !== this.lastNotifiedContent) {
        this.showNotification('Password Detected', 'Password was not added to clipboard history for security.');
        this.lastNotifiedContent = content;
      }
      // Update lastClipboardContent to prevent re-processing this same password
      this.lastClipboardContent = content;
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
    
    // Clear notification tracking since we have new valid content
    this.lastNotifiedContent = '';

    // Save to disk and send updated history to renderer
    this.saveClipboardHistory();
    this.mainWindow?.webContents.send('clipboard-history-updated', this.clipboardHistory);
  }

  // Add image to history
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
    
    // Clear notification tracking since we have new valid content
    this.lastNotifiedContent = '';

    // Save to disk and send updated history to renderer
    this.saveClipboardHistory();
    this.mainWindow?.webContents.send('clipboard-history-updated', this.clipboardHistory);
  }

  // Limit the history size
  private limitHistorySize(): void {
    if (this.clipboardHistory.length > this.preferences.maxHistoryItems) {
      this.clipboardHistory = this.clipboardHistory.slice(0, this.preferences.maxHistoryItems);
      // Note: We don't save here since this is called from add methods that already save
    }
  }

  // Format the file size
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Monitor the clipboard
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

  // Start clipboard monitoring
  private startClipboardMonitoring(): void {
    // Initial clipboard check
    this.monitorClipboard();
    
    // Start monitoring clipboard every 1000ms (reduced frequency to avoid excessive notifications)
    this.clipboardMonitorInterval = setInterval(() => {
      this.monitorClipboard();
    }, 1000);

    // Set up auto-cleanup if enabled
    this.setupAutoCleanup();
  }

  // Setup auto-cleanup
  private setupAutoCleanup(): void {
    if (this.preferences.autoClearInterval > 0) {
      // Convert hours to milliseconds
      const interval = this.preferences.autoClearInterval * 60 * 60 * 1000;
      
      setInterval(() => {
        const cutoffTime = new Date(Date.now() - interval);
        this.clipboardHistory = this.clipboardHistory.filter(item => {
          const itemTime = new Date(item.timestamp);
          return itemTime > cutoffTime;
        });
        this.mainWindow?.webContents.send('clipboard-history-updated', this.clipboardHistory);
      }, 60000); // Check every minute
    }
  }

  // Stop clipboard monitoring
  private stopClipboardMonitoring(): void {
    if (this.clipboardMonitorInterval) {
      clearInterval(this.clipboardMonitorInterval);
      this.clipboardMonitorInterval = null;
    }
  }

  // Register global shortcuts
  private registerGlobalShortcuts(): void {
    // Unregister any existing shortcuts first
    globalShortcut.unregisterAll();

    const ret = globalShortcut.register(this.preferences.hotkey, () => {
      this.toggleWindow();
    });

    if (!ret) {
      console.log('Registration of global shortcut failed');
      // Try to register the default shortcut as fallback
      const defaultRet = globalShortcut.register('CommandOrControl+Shift+V', () => {
        this.toggleWindow();
      });
      if (defaultRet) {
        this.preferences.hotkey = 'CommandOrControl+Shift+V';
      }
    }
  }

  // Setup IPC handlers
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
        this.saveClipboardHistory();
        this.mainWindow?.webContents.send('clipboard-history-updated', this.clipboardHistory);
      }
    });

    ipcMain.handle('close-window', () => {
      this.mainWindow?.hide();
    });

    ipcMain.handle('clear-history', () => {
      this.clipboardHistory = [];
      this.lastClipboardContent = '';
      this.lastNotifiedContent = '';
      this.saveClipboardHistory();
      this.mainWindow?.webContents.send('clipboard-history-updated', this.clipboardHistory);
    });

    // Preferences handlers
    ipcMain.handle('get-preferences', () => {
      return this.preferences;
    });

    ipcMain.handle('save-preferences', async (event, newPreferences: PreferencesData) => {
      const oldPreferences = { ...this.preferences };
      this.preferences = { ...newPreferences };
      
      // Save to file
      this.savePreferencesToFile();
      
      // Update max history if changed
      if (this.clipboardHistory.length > this.preferences.maxHistoryItems) {
        this.clipboardHistory = this.clipboardHistory.slice(0, this.preferences.maxHistoryItems);
        this.saveClipboardHistory();
        this.mainWindow?.webContents.send('clipboard-history-updated', this.clipboardHistory);
      }

      // Update keyboard shortcut if changed
      if (oldPreferences.hotkey !== this.preferences.hotkey) {
        this.registerGlobalShortcuts();
      }

      // Update launch at startup if changed
      if (oldPreferences.launchAtStartup !== this.preferences.launchAtStartup) {
        this.updateLaunchAtStartup();
      }

      // Update auto-cleanup if interval changed
      if (oldPreferences.autoClearInterval !== this.preferences.autoClearInterval) {
        this.setupAutoCleanup();
      }

      // Show notification about saved preferences if enabled
      if (this.preferences.showNotifications) {
        this.showNotification('Preferences Saved', 'Your clipboard manager settings have been updated.');
      }
    });
  }

  // On window all closed
  private onWindowAllClosed(): void {
    // Don't quit the app when windows are closed - it's a tray app
    // User needs to explicitly quit from tray menu
  }

  // On activate
  private onActivate(): void {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      this.createWindow();
    }
  }

  // On will quit
  private onWillQuit(): void {
    // Cleanup
    globalShortcut.unregisterAll();
    this.stopClipboardMonitoring();
  }

  // Update launch at startup
  private updateLaunchAtStartup(): void {
    if (!app.isPackaged) return; // Skip in development

    app.setLoginItemSettings({
      openAtLogin: this.preferences.launchAtStartup,
      path: app.getPath('exe')
    });
  }

  // check if the text looks like a password
  private looksLikePassword(text: string): boolean {
    // Basic password detection heuristics
    const minLength = 8;
    const hasNumber = /\d/.test(text);
    const hasLetter = /[a-zA-Z]/.test(text);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(text);
    const noSpaces = !/\s/.test(text);
    
    return text.length >= minLength && 
           hasNumber && 
           hasLetter && 
           hasSpecial && 
           noSpaces;
  }

  // Show a notification
  private showNotification(title: string, body: string): void {
    if (!this.preferences.showNotifications) return;

    new Notification({
      title,
      body,
      silent: true // Don't play a sound
    }).show();
  }

  // Setup auto-updater
  private setupAutoUpdater(): void {
    // Don't check for updates in development
    if (process.env.NODE_ENV === 'development') {
      return;
    }

    // Configure auto-updater
    autoUpdater.checkForUpdatesAndNotify();

    // Auto-updater events
    autoUpdater.on('checking-for-update', () => {
      console.log('Checking for update...');
    });

    autoUpdater.on('update-available', (info) => {
      console.log('Update available:', info);
      if (this.preferences.showNotifications) {
        this.showNotification('Update Available', 'A new version of Trex is being downloaded.');
      }
    });

    autoUpdater.on('update-not-available', (info) => {
      console.log('Update not available:', info);
    });

    autoUpdater.on('error', (err) => {
      console.error('Update error:', err);
    });

    autoUpdater.on('download-progress', (progressObj) => {
      const percent = Math.round(progressObj.percent);
      console.log(`Download progress: ${percent}%`);
    });

    autoUpdater.on('update-downloaded', (info) => {
      console.log('Update downloaded:', info);
      if (this.preferences.showNotifications) {
        this.showNotification('Update Ready', 'Update has been downloaded. Restart Trex to apply the update.');
      }
      
      // Auto-restart after 5 seconds
      setTimeout(() => {
        autoUpdater.quitAndInstall();
      }, 5000);
    });

    // Check for updates every hour
    setInterval(() => {
      autoUpdater.checkForUpdatesAndNotify();
    }, 60 * 60 * 1000);
  }
}

// Initialize the application
new ClipboardManager();
