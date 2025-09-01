import React from 'react';

interface StatusBarProps {
  itemCount: number;
  totalCount?: number;
  isSearching?: boolean;
}

const StatusBar: React.FC<StatusBarProps> = ({ itemCount, totalCount, isSearching }) => {
  const itemText = isSearching && totalCount !== undefined
    ? `${itemCount} of ${totalCount} item${totalCount !== 1 ? 's' : ''}`
    : `${itemCount} item${itemCount !== 1 ? 's' : ''}`;

  return (
    <div className="px-5 py-2 bg-white bg-opacity-90 border-t border-black border-opacity-10 text-xs text-gray-500 flex justify-between items-center">
      <span>{itemText}</span>
      <span>Press number keys 1-9 for quick access</span>
    </div>
  );
};

export default StatusBar;
