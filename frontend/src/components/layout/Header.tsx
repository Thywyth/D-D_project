import React from 'react';
import { useOnline } from '../../hooks/useOnline';
import { useSessionStore } from '../../stores/sessionStore';

interface HeaderProps {
  onMenuToggle: () => void;
  roomName?: string;
}

export function Header({ onMenuToggle, roomName }: HeaderProps): React.ReactElement {
  const isOnline = useOnline();
  const currentRoom = useSessionStore((s) => s.currentRoom);
  const displayName = roomName || currentRoom?.name || 'DnD Mobile VTT';

  return (
    <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-4 bg-charcoal/95 backdrop-blur-md border-b border-border-default">
      {/* Left: Hamburger + Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden w-9 h-9 flex flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] hover:bg-iron/40 transition-colors cursor-pointer"
          aria-label="Меню"
        >
          <span className="block w-5 h-0.5 bg-parchment rounded-full" />
          <span className="block w-4 h-0.5 bg-parchment rounded-full" />
          <span className="block w-5 h-0.5 bg-parchment rounded-full" />
        </button>

        <h1 className="font-heading text-parchment text-base tracking-wide truncate max-w-[200px]">
          {displayName}
        </h1>
      </div>

      {/* Right: Connection Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div
            className={[
              'w-2.5 h-2.5 rounded-full transition-colors',
              isOnline
                ? 'bg-emerald shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                : 'bg-blood shadow-[0_0_8px_rgba(220,38,38,0.5)] animate-pulse',
            ].join(' ')}
          />
          <span className="text-xs text-text-muted hidden sm:inline">
            {isOnline ? 'Онлайн' : 'Офлайн'}
          </span>
        </div>
      </div>
    </header>
  );
}
