import { useState, useEffect } from 'react';

interface Settings {
  maxHistory: number;
  shortcut: string;
}

interface Props {
  onClose: () => void;
}

export function Settings({ onClose }: Props) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [maxHistory, setMaxHistory] = useState('100');
  const [shortcut, setShortcut] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    window.electronAPI.getSettings().then((s) => {
      setSettings(s);
      setMaxHistory(s.maxHistory.toString());
      setShortcut(s.shortcut);
    });
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isRecording) return;

    e.preventDefault();
    const keys: string[] = [];

    if (e.metaKey) keys.push('CommandOrControl');
    if (e.ctrlKey && !e.metaKey) keys.push('Control');
    if (e.altKey) keys.push('Option');
    if (e.shiftKey) keys.push('Shift');

    const key = e.key.toUpperCase();
    if (key.length === 1 && !['META', 'CONTROL', 'ALT', 'SHIFT'].includes(key)) {
      keys.push(key);
    }

    if (keys.length > 1) {
      setShortcut(keys.join('+'));
      setIsRecording(false);
    }
  };

  const handleSave = async () => {
    const newMaxHistory = parseInt(maxHistory, 10);
    if (isNaN(newMaxHistory) || newMaxHistory < 10 || newMaxHistory > 1000) {
      return;
    }

    await window.electronAPI.saveSettings({
      maxHistory: newMaxHistory,
      shortcut,
    });

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const formatShortcut = (s: string) => {
    return s
      .replace('CommandOrControl', '⌘')
      .replace('Control', '⌃')
      .replace('Option', '⌥')
      .replace('Shift', '⇧')
      .replace(/\+/g, ' ');
  };

  if (!settings) {
    return <div className="settings">Loading...</div>;
  }

  return (
    <div className="settings">
      <div className="settings-header">
        <h2>Settings</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="settings-content">
        <div className="setting-item">
          <label htmlFor="maxHistory">History Limit</label>
          <input
            id="maxHistory"
            type="number"
            min="10"
            max="1000"
            value={maxHistory}
            onChange={(e) => setMaxHistory(e.target.value)}
          />
          <span className="hint">10 - 1000 items</span>
        </div>

        <div className="setting-item">
          <label htmlFor="shortcut">Global Shortcut</label>
          <div
            className={`shortcut-input ${isRecording ? 'recording' : ''}`}
            tabIndex={0}
            onClick={() => setIsRecording(true)}
            onKeyDown={handleKeyDown}
            onBlur={() => setIsRecording(false)}
          >
            {isRecording ? 'Press keys...' : formatShortcut(shortcut)}
          </div>
          <span className="hint">Click to record new shortcut</span>
        </div>

        <div className="setting-item">
          <label>Clear History</label>
          <button
            className="danger-btn"
            onClick={() => {
              if (confirm('Are you sure you want to clear all history?')) {
                window.electronAPI.clearHistory();
              }
            }}
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="settings-footer">
        <button className="save-btn" onClick={handleSave}>
          {saved ? 'Saved!' : 'Save'}
        </button>
      </div>
    </div>
  );
}
