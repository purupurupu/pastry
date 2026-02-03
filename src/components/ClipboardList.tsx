import { useEffect, useRef } from 'react';
import { ClipboardItem } from '../types';
import { ClipboardCard } from './ClipboardCard';

interface Props {
  items: ClipboardItem[];
  selectedIndex: number;
  onSelect: (item: ClipboardItem) => void;
  onDelete: (id: string) => void;
  onHover: (index: number) => void;
}

export function ClipboardList({ items, selectedIndex, onSelect, onDelete, onHover }: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLDivElement>(null);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedRef.current && listRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedIndex]);

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <p>No clipboard history yet</p>
        <p className="hint">Copy something to get started</p>
      </div>
    );
  }

  return (
    <div className="clipboard-list" ref={listRef}>
      {items.map((item, index) => (
        <ClipboardCard
          key={item.id}
          ref={index === selectedIndex ? selectedRef : null}
          item={item}
          isSelected={index === selectedIndex}
          shortcutKey={index < 9 ? index + 1 : undefined}
          onSelect={() => onSelect(item)}
          onDelete={() => onDelete(item.id)}
          onMouseEnter={() => onHover(index)}
        />
      ))}
    </div>
  );
}
