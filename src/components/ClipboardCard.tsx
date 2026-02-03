import { forwardRef } from 'react';
import { ClipboardItem } from '../types';

interface Props {
  item: ClipboardItem;
  isSelected: boolean;
  shortcutKey?: number;
  onSelect: () => void;
  onDelete: () => void;
  onMouseEnter: () => void;
}

export const ClipboardCard = forwardRef<HTMLDivElement, Props>(
  ({ item, isSelected, shortcutKey, onSelect, onDelete, onMouseEnter }, ref) => {
    const formatTime = (timestamp: number) => {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now.getTime() - date.getTime();

      if (diff < 60000) return 'Just now';
      if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
      return date.toLocaleDateString();
    };

    const truncateContent = (content: string, maxLength = 100) => {
      if (content.length <= maxLength) return content;
      return content.slice(0, maxLength) + '...';
    };

    return (
      <div
        ref={ref}
        className={`clipboard-card ${isSelected ? 'selected' : ''}`}
        onClick={onSelect}
        onMouseEnter={onMouseEnter}
      >
        {shortcutKey && (
          <div className="shortcut-badge">⌘{shortcutKey}</div>
        )}
        <div className="card-content">
          {item.type === 'text' && (
            <p className="text-preview">{truncateContent(item.content)}</p>
          )}
          {item.type === 'image' && (
            <div className="image-preview">
              <img src={item.preview} alt="Clipboard image" />
            </div>
          )}
          {item.type === 'file' && (
            <p className="file-preview">{item.content}</p>
          )}
        </div>
        <div className="card-footer">
          <span className="timestamp">{formatTime(item.timestamp)}</span>
          <button
            className="delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            ×
          </button>
        </div>
      </div>
    );
  }
);

ClipboardCard.displayName = 'ClipboardCard';
