import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSessionStore } from '../../stores/sessionStore';

interface BottomNavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}

const BOTTOM_ITEMS: BottomNavItem[] = [
  { id: 'lobby', label: 'Лобі', icon: '🏰', path: '/lobby' },
  { id: 'character', label: 'Герой', icon: '⚔️', path: '/session' },
  { id: 'map', label: 'Карта', icon: '🗺️', path: '/session' },
  { id: 'tree', label: 'Родовід', icon: '🌳', path: '/session' },
];

export function BottomNav(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const currentRoom = useSessionStore((s) => s.currentRoom);

  // Визначаємо, яка кнопка зараз активна, читаючи URL
  const checkIsActive = (item: BottomNavItem) => {
    if (item.id === 'lobby') return location.pathname.startsWith('/lobby');
    
    const searchParams = new URLSearchParams(location.search);
    const currentTab = searchParams.get('tab') || 'character';
    return location.pathname.startsWith('/session') && currentTab === item.id;
  };

  const handleNav = (item: BottomNavItem) => {
    if (item.id === 'lobby') {
      navigate('/lobby');
    } else if (currentRoom) {
      // Передаємо ID вкладки як параметр ?tab=...
      navigate(`/session/${currentRoom._id}?tab=${item.id}`);
    } else {
      // Запобіжник: якщо кімната невідома, повертаємо в лобі замість 404
      navigate('/lobby');
    }
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 h-16 bg-charcoal/95 backdrop-blur-md border-t border-border-default">
      <div className="flex items-center justify-around h-full px-2">
        {BOTTOM_ITEMS.map((item) => {
          const isActive = checkIsActive(item);
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item)}
              className={[
                'flex flex-col items-center gap-0.5 py-1 px-3 rounded-[var(--radius-md)]',
                'transition-all duration-[var(--transition-fast)] cursor-pointer min-w-[60px]',
                isActive
                  ? 'text-amber'
                  : 'text-text-muted hover:text-text-secondary',
              ].join(' ')}
            >
              <span className={[
                'text-xl transition-transform',
                isActive ? 'scale-110' : '',
              ].join(' ')}>
                {item.icon}
              </span>
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-amber mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}