import React, { useState, useEffect } from 'react';

interface PreferencesProps {
  onClose: () => void;
}

interface PreferencesData {
  maxHistoryItems: number;
  launchAtStartup: boolean;
  showNotifications: boolean;
  hotkey: string;
  autoClearInterval: number; // in hours, 0 = never
  excludePasswords: boolean;
}

const Preferences: React.FC<PreferencesProps> = ({ onClose }) => {
  const [preferences, setPreferences] = useState<PreferencesData>({
    maxHistoryItems: 25,
    launchAtStartup: false,
    showNotifications: true,
    hotkey: 'CommandOrControl+Shift+V',
    autoClearInterval: 0,
    excludePasswords: true,
  });

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Load preferences from main process
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await window.electronAPI.getPreferences?.();
      if (prefs) {
        setPreferences(prefs);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  };

  const savePreferences = async () => {
    try {
      await window.electronAPI.savePreferences?.(preferences);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  };

  const handleChange = (key: keyof PreferencesData, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    await savePreferences();
    onClose();
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <div className="font-system bg-gradient-primary text-gray-800 h-screen overflow-hidden">
      <div className="h-screen flex flex-col bg-white bg-opacity-95 backdrop-blur-sm">
        {/* Header */}
        <div className="px-5 py-4 bg-white bg-opacity-90 border-b border-black border-opacity-10 backdrop-blur-lg">
          <h1 className="text-lg font-semibold text-primary mb-1">⚙️ Preferences</h1>
          <p className="text-xs text-gray-500">Customize your clipboard manager settings</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-md mx-auto space-y-6">
            
            {/* General Settings */}
            <div className="bg-white rounded-xl p-4 shadow-md">
              <h3 className="text-md font-semibold text-primary mb-3">General</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum History Items
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={preferences.maxHistoryItems}
                    onChange={(e) => handleChange('maxHistoryItems', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary"
                  />
                  <p className="text-xs text-gray-500 mt-1">Number of clipboard items to keep (5-100)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Keyboard Shortcut
                  </label>
                  <input
                    type="text"
                    value={preferences.hotkey}
                    onChange={(e) => handleChange('hotkey', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary"
                    placeholder="CommandOrControl+Shift+V"
                  />
                  <p className="text-xs text-gray-500 mt-1">Global shortcut to open clipboard manager</p>
                </div>
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="bg-white rounded-xl p-4 shadow-md">
              <h3 className="text-md font-semibold text-primary mb-3">Privacy</h3>
              
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.excludePasswords}
                    onChange={(e) => handleChange('excludePasswords', e.target.checked)}
                    className="mr-3 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Exclude passwords</span>
                    <p className="text-xs text-gray-500">Don't save clipboard items that look like passwords</p>
                  </div>
                </label>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Auto-clear history
                  </label>
                  <select
                    value={preferences.autoClearInterval}
                    onChange={(e) => handleChange('autoClearInterval', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary"
                  >
                    <option value={0}>Never</option>
                    <option value={1}>After 1 hour</option>
                    <option value={6}>After 6 hours</option>
                    <option value={24}>After 24 hours</option>
                    <option value={168}>After 1 week</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Automatically clear old clipboard items</p>
                </div>
              </div>
            </div>

            {/* System Settings */}
            <div className="bg-white rounded-xl p-4 shadow-md">
              <h3 className="text-md font-semibold text-primary mb-3">System</h3>
              
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.launchAtStartup}
                    onChange={(e) => handleChange('launchAtStartup', e.target.checked)}
                    className="mr-3 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Launch at startup</span>
                    <p className="text-xs text-gray-500">Start clipboard manager when you log in</p>
                  </div>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.showNotifications}
                    onChange={(e) => handleChange('showNotifications', e.target.checked)}
                    className="mr-3 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Show notifications</span>
                    <p className="text-xs text-gray-500">Get notified when new items are copied</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-white bg-opacity-90 border-t border-black border-opacity-10 flex justify-between items-center">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <div className="space-x-3">
            <button
              onClick={() => loadPreferences()}
              className="px-4 py-2 text-primary hover:text-primary-dark transition-colors"
              disabled={!hasChanges}
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              className={`px-4 py-2 rounded-md transition-colors ${
                hasChanges
                  ? 'bg-primary text-white hover:bg-primary-dark'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={!hasChanges}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preferences;
