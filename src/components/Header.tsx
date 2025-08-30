import React from 'react';

const Header: React.FC = () => {
  return (
    <div className="px-5 py-4 bg-white bg-opacity-90 border-b border-black border-opacity-10 backdrop-blur-lg">
      <h1 className="text-lg font-semibold text-primary mb-1">📋 Clipboard Manager</h1>
      <p className="text-xs text-gray-500">Click any item to copy it to clipboard</p>
      <div className="text-xs text-gray-400 mt-2">
        <strong>⌘+Shift+V</strong> Toggle window • <strong>⌫</strong> Delete selected • <strong>ESC</strong> Close
      </div>
    </div>
  );
};

export default Header;
