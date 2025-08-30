import React from 'react';

const EmptyState: React.FC = () => {
  return (
    <div className="text-center py-15 px-5 text-gray-500">
      <h3 className="text-lg mb-2 text-primary">No clipboard history yet</h3>
      <p className="text-sm leading-6">
        Copy some text to see it appear here.<br />
        Your last 25 items will be saved.
      </p>
    </div>
  );
};

export default EmptyState;
