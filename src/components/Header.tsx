import React from "react";
import trexLogo from "../assets/trex.png";

interface HeaderProps {
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  onSearchClear?: () => void;
  showFavoritesOnly?: boolean;
  onToggleFavoritesFilter?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  searchTerm = "",
  onSearchChange,
  onSearchClear,
  showFavoritesOnly = false,
  onToggleFavoritesFilter,
}) => {
  return (
    <div className="px-5 py-4 bg-white bg-opacity-90 border-b border-black border-opacity-10 backdrop-blur-lg">
      <div className="flex items-center gap-2">
        <img src={trexLogo} alt="Trex" className="w-10 h-10" />
        <h1 className="text-lg font-semibold text-primary mb-1">
          Trex your clipboard manager
        </h1>
      </div>

      {/* Search Input and Favorites Button */}
      {onSearchChange && (
        <div className="mt-3 flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by content, type, or dates"
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

          {/* Favorites Filter Button */}
          {onToggleFavoritesFilter && (
            <button
              onClick={onToggleFavoritesFilter}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-colors duration-200 ${
                showFavoritesOnly
                  ? "bg-yellow-500 text-white hover:bg-yellow-600"
                  : "bg-gray-100 text-gray-600 hover:bg-yellow-100 hover:text-yellow-700"
              }`}
              title={
                showFavoritesOnly ? "Show all items" : "Show favorites only"
              }
            >
              {showFavoritesOnly ? "★" : "☆"}
            </button>
          )}
        </div>
      )}

      <p className="text-xs text-gray-500 mt-3">
        Click any item to copy it to your clipboard. Search by content, type
        (text/image), or dates (1/9/2025)
      </p>
      <div className="text-xs text-gray-400 mt-2">
        <strong>⌘+Shift+V</strong> Toggle window • <strong>⌫</strong> Delete
        selected • <strong>ESC</strong> Close • <strong>/</strong> Search
      </div>
    </div>
  );
};

export default Header;
