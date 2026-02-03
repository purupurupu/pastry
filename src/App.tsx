import { useState, useEffect, useCallback, useRef } from 'react';
import { ClipboardItem } from './types';
import { ClipboardList } from './components/ClipboardList';
import { Settings } from './components/Settings';

export function App() {
  const [items, setItems] = useState<ClipboardItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredItems = items.filter((item) =>
    item.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  // Reset selection when filtered items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Focus search input on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const handleSelect = useCallback((item: ClipboardItem) => {
    if (item.type === 'image' && item.preview) {
      window.electronAPI.copyToClipboard(item.preview, 'image');
    } else if (item.type === 'file' && item.filePath) {
      window.electronAPI.copyToClipboard(item.filePath, 'file');
    } else {
      window.electronAPI.copyToClipboard(item.content, 'text');
    }
  }, []);

  const handleDelete = useCallback((id: string) => {
    window.electronAPI.deleteItem(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (showSettings) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          Math.min(prev + 1, filteredItems.length - 1)
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          handleSelect(filteredItems[selectedIndex]);
        }
        break;
      case 'Backspace':
        // Only delete if search is empty and not focused
        if (searchQuery === '' && document.activeElement !== searchInputRef.current) {
          e.preventDefault();
          if (filteredItems[selectedIndex]) {
            handleDelete(filteredItems[selectedIndex].id);
            setSelectedIndex((prev) => Math.max(prev - 1, 0));
          }
        }
        break;
      case 'Escape':
        e.preventDefault();
        if (searchQuery) {
          setSearchQuery('');
        }
        break;
      default:
        // Quick select with number keys (1-9)
        if (e.key >= '1' && e.key <= '9' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          const index = parseInt(e.key, 10) - 1;
          if (filteredItems[index]) {
            handleSelect(filteredItems[index]);
          }
        }
        break;
    }
  }, [showSettings, filteredItems, selectedIndex, searchQuery, handleSelect, handleDelete]);

  if (showSettings) {
    return <Settings onClose={() => setShowSettings(false)} />;
  }

  return (
    <div className="app" onKeyDown={handleKeyDown} tabIndex={-1}>
      <header className="app-header">
        <input
          ref={searchInputRef}
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
          selectedIndex={selectedIndex}
          onSelect={handleSelect}
          onDelete={handleDelete}
          onHover={setSelectedIndex}
        />
      </main>
    </div>
  );
}
