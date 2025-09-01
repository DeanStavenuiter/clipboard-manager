import React from "react";

interface HeaderProps {
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  onSearchClear?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  searchTerm = "", 
  onSearchChange, 
  onSearchClear 
}) => {
  return (
    <div className="px-5 py-4 bg-white bg-opacity-90 border-b border-black border-opacity-10 backdrop-blur-lg">
      <div className="flex items-center gap-2">
        <img src="./trex.png" alt="Trex" className="w-10 h-10" />
        <h1 className="text-lg font-semibold text-primary mb-1">
          Trex your clipboard manager
        </h1>
      </div>
      
      {/* Search Input */}
      {onSearchChange && (
        <div className="mt-3 relative">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search clipboard history..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white bg-opacity-80 backdrop-blur-sm"
              autoFocus={false}
            />
            {searchTerm && (
              <button
                onClick={onSearchClear}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 mt-3">
        Click any item to copy it to your clipboard or use the keyboard shortcuts
      </p>
      <div className="text-xs text-gray-400 mt-2">
        <strong>⌘+Shift+V</strong> Toggle window • <strong>⌫</strong> Delete
        selected • <strong>ESC</strong> Close • <strong>/</strong> Search
      </div>
    </div>
  );
};

export default Header;
