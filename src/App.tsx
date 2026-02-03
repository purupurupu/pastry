import { useState, useEffect } from 'react';
import { ClipboardItem } from './types';
import { ClipboardList } from './components/ClipboardList';
import { Settings } from './components/Settings';

export function App() {
  const [items, setItems] = useState<ClipboardItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Load initial history
    window.electronAPI.getHistory().then(setItems);

    // Subscribe to clipboard changes
    const unsubscribe = window.electronAPI.onClipboardChange((item) => {
      setItems((prev) => [item, ...prev]);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const filteredItems = items.filter((item) =>
    item.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (item: ClipboardItem) => {
    window.electronAPI.copyToClipboard(item.content);
  };

  const handleDelete = (id: string) => {
    window.electronAPI.deleteItem(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  if (showSettings) {
    return <Settings onClose={() => setShowSettings(false)} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <input
          type="text"
          className="search-input"
          placeholder="Search clipboard history..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button
          className="settings-btn"
          onClick={() => setShowSettings(true)}
          title="Settings"
        >
          ⚙
        </button>
      </header>
      <main className="app-main">
        <ClipboardList
          items={filteredItems}
          onSelect={handleSelect}
          onDelete={handleDelete}
        />
      </main>
    </div>
  );
}
