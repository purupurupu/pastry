import { ClipboardItem } from '../types';

interface Props {
  item: ClipboardItem;
  onSelect: () => void;
  onDelete: () => void;
}

export function ClipboardCard({ item, onSelect, onDelete }: Props) {
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
    <div className="clipboard-card" onClick={onSelect}>
      <div className="card-content">
        {item.type === 'text' && (
          <p className="text-preview">{truncateContent(item.content)}</p>
        )}
        {item.type === 'image' && (
          <div className="image-preview">
            <img src={item.preview} alt="Clipboard image" />
          </div>
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
