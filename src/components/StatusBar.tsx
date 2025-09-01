import React from "react";

interface StatusBarProps {
  itemCount: number;
  totalCount?: number;
  isSearching?: boolean;
  onOpenPreferences?: () => void;
}

const StatusBar: React.FC<StatusBarProps> = ({
  itemCount,
  totalCount,
  isSearching,
  onOpenPreferences,
}) => {
  const itemText =
    isSearching && totalCount !== undefined
      ? `${itemCount} of ${totalCount} item${totalCount !== 1 ? "s" : ""}`
      : `${itemCount} item${itemCount !== 1 ? "s" : ""}`;

  return (
    <div className="px-5 py-2 bg-white bg-opacity-90 border-t border-black border-opacity-10 text-xs text-gray-500 flex justify-between items-center">
      <span>{itemText}</span>
      <div className="flex items-center gap-3">
        <span>Press number keys 1-9 for quick access</span>
        {onOpenPreferences && (
                    <button
            onClick={onOpenPreferences}
            className="p-1.5 rounded-md hover:bg-gray-200 hover:bg-opacity-50 transition-colors duration-200 text-gray-500 hover:text-gray-600 group"
            title="Open Preferences"
          >
            <span className="material-icons text-sm group-hover:rotate-45 transition-transform duration-200">
              settings
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

export default StatusBar;
