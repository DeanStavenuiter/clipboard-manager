import React from 'react';
import type { ClipboardHistoryItem } from '../types';

interface ClipboardItemProps {
  item: ClipboardHistoryItem;
  index: number;
  isSelected: boolean;
  onCopy: () => void;
  onDelete: () => void;
  onSelect: () => void;
}

const ClipboardItem: React.FC<ClipboardItemProps> = ({
  item,
  index,
  isSelected,
  onCopy,
  onDelete,
  onSelect,
}) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  const baseClasses = "bg-white rounded-xl mb-2 p-4 shadow-md cursor-pointer transition-all duration-200 border-2 relative hover:-translate-y-0.5 hover:shadow-lg hover:border-primary animate-fade-in";
  const selectedClasses = isSelected ? "border-primary bg-gradient-primary-light" : "border-transparent";

  const renderContent = () => {
    if (item.type === 'image') {
      return (
        <div className="mb-2">
          <img 
            src={item.content} 
            alt="Clipboard image" 
            className="max-w-full max-h-32 object-contain rounded border border-gray-200 mb-2"
            style={{ maxHeight: '8rem' }}
          />
          <div className="text-xs text-gray-600">
            {item.preview}
          </div>
        </div>
      );
    } else {
      return (
        <div className="text-sm leading-6 break-words whitespace-pre-wrap mb-2 text-gray-700">
          {item.preview}
        </div>
      );
    }
  };

  return (
    <div
      className={`${baseClasses} ${selectedClasses}`}
      onClick={onCopy}
      onMouseEnter={onSelect}
    >
      {renderContent()}
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span className="bg-gradient-index text-white px-1.5 py-0.5 rounded font-semibold flex items-center gap-1">
          {item.type === 'image' && <span>🖼️</span>}
          {item.type === 'text' && <span>📝</span>}
          {index < 9 ? index + 1 : ''}
        </span>
        <span>{item.timestamp}</span>
        <button
          className="bg-red-500 text-white border-none rounded px-2 py-1 text-xs cursor-pointer transition-colors duration-200 opacity-70 hover:bg-red-600 hover:opacity-100"
          onClick={handleDelete}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default ClipboardItem;
