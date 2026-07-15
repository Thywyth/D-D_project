import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useSessionStore } from '../../stores/sessionStore';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  dmOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'lobby', label: 'Лобі', icon: '🏰', path: '/lobby' },
  { id: 'characters', label: 'Персонажі', icon: '⚔️', path: '/session/:roomId' },
  { id: 'map', label: 'Карта', icon: '🗺️', path: '/session/:roomId' },
  { id: 'tree', label: 'Родовід', icon: '🌳', path: '/session/:roomId' },
  { id: 'notes', label: 'Нотатки', icon: '📜', path: '/session/:roomId' },
  { id: 'audio', label: 'Аудіо', icon: '🎵', path: '/session/:roomId', dmOnly: true },
  { id: 'settings', label: 'Налаштування', icon: '⚙️', path: '/session/:roomId', dmOnly: true },
];

export function Sidebar({ isOpen, onClose }: SidebarProps): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const currentRoom = useSessionStore((s) => s.currentRoom);
  const isDM = currentRoom?.dmUserId === user?._id;

  const handleNav = (item: NavItem) => {
    if (item.path.includes(':roomId') && currentRoom) {
      navigate(item.path.replace(':roomId', currentRoom._id));
    } else {
      navigate(item.path);
    }
    onClose();
  };

  const filteredItems = NAV_ITEMS.filter(
    (item) => (!item.path.includes(':roomId') || currentRoom) && (!item.dmOnly || isDM),
  );

  return (
    <>
      {/* Overlay */}
      <div
        className={`drawer-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <nav className={`drawer ${isOpen ? 'open' : ''}`}>
        {/* User Info */}
        <div className="p-5 border-b border-border-default">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber to-gold flex items-center justify-center text-void font-heading font-bold text-lg">
              {user?.username?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-parchment truncate">
                {user?.username || 'Мандрівник'}
              </p>
              <p className="text-xs text-text-muted">
                {isDM ? '🎭 Данжн Майстер' : '⚔️ Гравець'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="py-2">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNav(item)}
              className={[
                'w-full flex items-center gap-3 px-5 py-3 text-sm transition-colors cursor-pointer',
                location.pathname.includes(item.id)
                  ? 'bg-amber/10 text-amber border-r-2 border-amber'
                  : 'text-text-secondary hover:bg-iron/30 hover:text-text-primary',
              ].join(' ')}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Logout */}
        <div className="mt-auto p-4 border-t border-border-default">
          <button
            onClick={() => {
              useAuthStore.getState().logout();
              navigate('/auth');
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-blood hover:bg-blood/10 rounded-[var(--radius-md)] transition-colors cursor-pointer"
          >
            <span>🚪</span>
            <span>Вийти</span>
          </button>
        </div>
      </nav>
    </>
  );
}
