import React, { useState, useEffect, useCallback } from 'react';
import ClipboardItem from './ClipboardItem';
import EmptyState from './EmptyState';
import Header from './Header';
import StatusBar from './StatusBar';
import Preferences from './Preferences';
import type { ClipboardHistoryItem } from '../types';

const App: React.FC = () => {
  const [clipboardHistory, setClipboardHistory] = useState<ClipboardHistoryItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [showPreferences, setShowPreferences] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Date utility function
  const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  // Simple date format searching  
  const searchDateByTerm = (timestamp: string, searchTermParam: string): boolean => {
    try {
      // Only handle specific date formats: M/D/YYYY, MM/DD/YYYY, M-D-YYYY, MM-DD-YYYY
      const dateFormats = [
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // M/D/YYYY or MM/DD/YYYY
        /^(\d{1,2})-(\d{1,2})-(\d{4})$/,   // M-D-YYYY or MM-DD-YYYY
      ];
      
      for (const format of dateFormats) {
        const match = searchTermParam.match(format);
        if (match) {
          const [, month, day, year] = match;
          
          // Parse the search date
          const searchDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          if (isNaN(searchDate.getTime())) {
            return false;
          }
          
          // Parse the item timestamp
          const itemDate = new Date(timestamp);
          if (isNaN(itemDate.getTime())) {
            return false;
          }
          
          // Compare dates (same day)
          return isSameDay(itemDate, searchDate);
        }
      }
      
      return false;
    } catch (error) {
      return false;
    }
  };

  // Filter clipboard history based on search term
  const filteredHistory = React.useMemo(() => {
    try {
      if (!searchTerm.trim()) {
        return clipboardHistory;
      }
      
      const searchLower = searchTerm.toLowerCase().trim();
      
      return clipboardHistory.filter(item => {
        try {
          // Search in preview text for both text and image items
          const previewMatch = item.preview.toLowerCase().includes(searchLower);
          
          // For text items, also search in the full content
          const contentMatch = item.type === 'text' && 
            item.content.toLowerCase().includes(searchLower);
          
          // Search in timestamp/date
          const timestampMatch = item.timestamp.toLowerCase().includes(searchLower);
          
          // Search by item type (e.g., "text", "image")
          const typeMatch = item.type.toLowerCase().includes(searchLower);
          
          // Enhanced date searching with relative terms and formats
          const dateMatch = searchDateByTerm(item.timestamp, searchLower);
          
          return previewMatch || contentMatch || timestampMatch || typeMatch || dateMatch;
        } catch (error) {
          console.error('Error filtering item:', error);
          // Fallback to basic content matching if date parsing fails
          return item.preview.toLowerCase().includes(searchLower) ||
                 (item.type === 'text' && item.content.toLowerCase().includes(searchLower));
        }
      });
    } catch (error) {
      console.error('Error in search filtering:', error);
      // Return unfiltered history if there's a major error
      return clipboardHistory;
    }
  }, [clipboardHistory, searchTerm]);

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
      // Reset preferences view when clipboard history is updated (normal window open)
      setShowPreferences(false);
    };

    const handleShowPreferences = () => {
      setShowPreferences(true);
    };

    const handleShowClipboardHistory = () => {
      setShowPreferences(false);
      setSelectedIndex(clipboardHistory.length > 0 ? 0 : -1);
    };

    window.electronAPI.onClipboardHistoryUpdated(handleHistoryUpdate);
    window.electronAPI.onShowPreferences?.(handleShowPreferences);
    window.electronAPI.onShowClipboardHistory?.(handleShowClipboardHistory);

    // Cleanup function
    return () => {
      window.electronAPI.removeAllListeners('clipboard-history-updated');
      window.electronAPI.removeAllListeners('show-preferences');
      window.electronAPI.removeAllListeners('show-clipboard-history');
    };
  }, [selectedIndex]);

  // Auto-select first item when window opens or when search changes
  useEffect(() => {
    if (filteredHistory.length > 0 && (selectedIndex === -1 || selectedIndex >= filteredHistory.length)) {
      setSelectedIndex(0);
    } else if (filteredHistory.length === 0) {
      setSelectedIndex(-1);
    }
  }, [filteredHistory, selectedIndex]);

  // Reset selection when search term changes
  useEffect(() => {
    if (searchTerm) {
      setSelectedIndex(filteredHistory.length > 0 ? 0 : -1);
    }
  }, [searchTerm, filteredHistory.length]);

  const handleCopyToClipboard = useCallback(async (filteredIndex: number) => {
    const item = filteredHistory[filteredIndex];
    if (item) {
      try {
        // Find the original index in the full clipboard history
        const originalIndex = clipboardHistory.findIndex(historyItem => historyItem.id === item.id);
        if (originalIndex !== -1) {
          await window.electronAPI.copyToClipboard(clipboardHistory[originalIndex]);
        }
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
      }
    }
  }, [filteredHistory, clipboardHistory]);

  const handleDeleteItem = useCallback(async (filteredIndex: number) => {
    const item = filteredHistory[filteredIndex];
    if (item) {
      try {
        // Find the original index in the full clipboard history
        const originalIndex = clipboardHistory.findIndex(historyItem => historyItem.id === item.id);
        if (originalIndex !== -1) {
          await window.electronAPI.deleteHistoryItem(originalIndex);
        }
      } catch (error) {
        console.error('Failed to delete item:', error);
      }
    }
  }, [filteredHistory, clipboardHistory]);

  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearchTerm('');
  }, []);

  const handleOpenPreferences = useCallback(() => {
    setShowPreferences(true);
  }, []);

  const handleSelectItem = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Check if we're typing in the search input
      const isInputFocused = document.activeElement?.tagName === 'INPUT';
      
      if (e.key === 'Escape') {
        if (searchTerm && isInputFocused) {
          // Clear search if we're in search mode
          handleSearchClear();
          e.preventDefault();
        } else {
          try {
            await window.electronAPI.closeWindow();
          } catch (error) {
            console.error('Failed to close window:', error);
          }
        }
      } else if (e.key === '/' && !isInputFocused) {
        // Focus search input when "/" is pressed
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        if (!isInputFocused && selectedIndex >= 0) {
          handleDeleteItem(selectedIndex);
        }
      } else if (e.key >= '1' && e.key <= '9' && !isInputFocused) {
        const index = parseInt(e.key) - 1;
        if (index < filteredHistory.length) {
          handleCopyToClipboard(index);
        }
      } else if (e.key === 'ArrowUp' && !isInputFocused) {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowDown' && !isInputFocused) {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(filteredHistory.length - 1, prev + 1));
      } else if (e.key === 'Enter') {
        if (isInputFocused) {
          // If in search input, blur it to allow navigation
          (document.activeElement as HTMLElement)?.blur();
        } else if (selectedIndex >= 0) {
          handleCopyToClipboard(selectedIndex);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, filteredHistory.length, handleCopyToClipboard, handleDeleteItem, searchTerm, handleSearchClear]);

  // Show preferences screen or main clipboard view
  if (showPreferences) {
    return <Preferences onClose={() => {
      setShowPreferences(false);
      // Ensure we show clipboard history when preferences are closed
      setSelectedIndex(clipboardHistory.length > 0 ? 0 : -1);
    }} />;
  }

  return (
    <div className="font-system bg-gradient-primary text-gray-800 h-screen overflow-hidden">
      <div className="h-screen flex flex-col bg-white bg-opacity-95 backdrop-blur-sm">
        <Header 
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          onSearchClear={handleSearchClear}
        />
        
        <div className="history-container flex-1 overflow-y-auto p-2">
          {clipboardHistory.length === 0 ? (
            <EmptyState />
          ) : filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <div className="text-4xl mb-4">🔍</div>
              <div className="text-lg font-medium mb-2">No results found</div>
              <div className="text-sm">Try a different search term</div>
            </div>
          ) : (
            filteredHistory.map((item, index) => (
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

        <StatusBar 
          itemCount={searchTerm ? filteredHistory.length : clipboardHistory.length}
          totalCount={searchTerm ? clipboardHistory.length : undefined}
          isSearching={!!searchTerm}
          onOpenPreferences={handleOpenPreferences}
        />
      </div>
    </div>
  );
};

export default App;
