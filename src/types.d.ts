// Global type definitions for the renderer process

// Asset type declarations
declare module "*.png" {
  const value: string;
  export default value;
}

declare module "*.jpg" {
  const value: string;
  export default value;
}

declare module "*.jpeg" {
  const value: string;
  export default value;
}

declare module "*.gif" {
  const value: string;
  export default value;
}

declare module "*.svg" {
  const value: string;
  export default value;
}

// Absolute path imports from public directory
declare module "/trex.png" {
  const value: string;
  export default value;
}

declare global {
  interface Window {
    electronAPI: {
      getClipboardHistory: () => Promise<ClipboardHistoryItem[]>;
      copyToClipboard: (item: ClipboardHistoryItem) => Promise<void>;
      deleteHistoryItem: (index: number) => Promise<void>;
      clearHistory: () => Promise<void>;
      onClipboardHistoryUpdated: (callback: (history: ClipboardHistoryItem[]) => void) => void;
      closeWindow: () => Promise<void>;
      removeAllListeners: (channel: string) => void;
      // Preferences API
      getPreferences?: () => Promise<PreferencesData>;
      savePreferences?: (preferences: PreferencesData) => Promise<void>;
      onShowPreferences?: (callback: () => void) => void;
      onShowClipboardHistory?: (callback: () => void) => void;
    };
  }
}

interface PreferencesData {
  maxHistoryItems: number;
  launchAtStartup: boolean;
  showNotifications: boolean;
  hotkey: string;
  autoClearInterval: number;
  excludePasswords: boolean;
}

interface ClipboardHistoryItem {
  id: string;
  type: 'text' | 'image';
  content: string; // For text: the actual text, for images: base64 data URL
  timestamp: string;
  preview: string; // For text: truncated text, for images: thumbnail or filename
  size?: number; // For images: file size in bytes
}

// Re-export for components
export type { ClipboardHistoryItem };

export {};
