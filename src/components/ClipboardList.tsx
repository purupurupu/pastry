import { ClipboardItem } from '../types';
import { ClipboardCard } from './ClipboardCard';

interface Props {
  items: ClipboardItem[];
  onSelect: (item: ClipboardItem) => void;
  onDelete: (id: string) => void;
}

export function ClipboardList({ items, onSelect, onDelete }: Props) {
  if (items.length === 0) {
    return (
      <div className="empty-state">
        <p>No clipboard history yet</p>
        <p className="hint">Copy something to get started</p>
      </div>
    );
  }

  return (
    <div className="clipboard-list">
      {items.map((item) => (
        <ClipboardCard
          key={item.id}
          item={item}
          onSelect={() => onSelect(item)}
          onDelete={() => onDelete(item.id)}
        />
      ))}
    </div>
  );
}
