// Global type definitions for the renderer process

declare global {
  interface Window {
    electronAPI: {
      getClipboardHistory: () => Promise<ClipboardHistoryItem[]>;
      copyToClipboard: (item: ClipboardHistoryItem) => Promise<void>;
      deleteHistoryItem: (index: number) => Promise<void>;
      onClipboardHistoryUpdated: (callback: (history: ClipboardHistoryItem[]) => void) => void;
      closeWindow: () => Promise<void>;
      removeAllListeners: (channel: string) => void;
    };
  }
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
