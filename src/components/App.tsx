import React, { useState, useEffect, useCallback } from 'react';
import ClipboardItem from './ClipboardItem';
import EmptyState from './EmptyState';
import Header from './Header';
import StatusBar from './StatusBar';
import type { ClipboardHistoryItem } from '../types';

const App: React.FC = () => {
  const [clipboardHistory, setClipboardHistory] = useState<ClipboardHistoryItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  // Load initial history
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await window.electronAPI.getClipboardHistory();
        setClipboardHistory(history);
      } catch (error) {
        console.error('Failed to load clipboard history:', error);
      }
    };

    loadHistory();
  }, []);

  // Listen for clipboard updates
  useEffect(() => {
    const handleHistoryUpdate = (history: ClipboardHistoryItem[]) => {
      setClipboardHistory(history);
      if (selectedIndex >= history.length) {
        setSelectedIndex(history.length - 1);
      }
    };

    window.electronAPI.onClipboardHistoryUpdated(handleHistoryUpdate);

    // Cleanup function
    return () => {
      window.electronAPI.removeAllListeners('clipboard-history-updated');
    };
  }, [selectedIndex]);

  // Auto-select first item when window opens
  useEffect(() => {
    if (clipboardHistory.length > 0 && selectedIndex === -1) {
      setSelectedIndex(0);
    }
  }, [clipboardHistory, selectedIndex]);

  const handleCopyToClipboard = useCallback(async (index: number) => {
    if (clipboardHistory[index]) {
      try {
        await window.electronAPI.copyToClipboard(clipboardHistory[index]);
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
      }
    }
  }, [clipboardHistory]);

  const handleDeleteItem = useCallback(async (index: number) => {
    try {
      await window.electronAPI.deleteHistoryItem(index);
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  }, []);

  const handleSelectItem = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        try {
          await window.electronAPI.closeWindow();
        } catch (error) {
          console.error('Failed to close window:', error);
        }
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        if (selectedIndex >= 0) {
          handleDeleteItem(selectedIndex);
        }
      } else if (e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key) - 1;
        if (index < clipboardHistory.length) {
          handleCopyToClipboard(index);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(clipboardHistory.length - 1, prev + 1));
      } else if (e.key === 'Enter') {
        if (selectedIndex >= 0) {
          handleCopyToClipboard(selectedIndex);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, clipboardHistory.length, handleCopyToClipboard, handleDeleteItem]);

  return (
    <div className="font-system bg-gradient-purple text-gray-800 h-screen overflow-hidden">
      <div className="h-screen flex flex-col bg-white bg-opacity-95 backdrop-blur-sm">
        <Header />
        
        <div className="history-container flex-1 overflow-y-auto p-2">
          {clipboardHistory.length === 0 ? (
            <EmptyState />
          ) : (
            clipboardHistory.map((item, index) => (
              <ClipboardItem
                key={item.id}
                item={item}
                index={index}
                isSelected={index === selectedIndex}
                onCopy={() => handleCopyToClipboard(index)}
                onDelete={() => handleDeleteItem(index)}
                onSelect={() => handleSelectItem(index)}
              />
            ))
          )}
        </div>

        <StatusBar itemCount={clipboardHistory.length} />
      </div>
    </div>
  );
};

export default App;
