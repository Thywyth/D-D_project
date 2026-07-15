import React, { useMemo } from 'react';
import { useAuthStore } from '../../stores/authStore';

function getGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Доброго ранку';
  if (hour >= 12 && hour < 18) return 'Доброго дня';
  if (hour >= 18 && hour < 22) return 'Доброго вечора';
  return 'Доброї ночі';
}

interface DashboardProps {
  onCreateSession: () => void;
  onJoinSession: () => void;
  children?: React.ReactNode;
}

export function Dashboard({
  onCreateSession,
  onJoinSession,
  children,
}: DashboardProps): React.ReactElement {
  const user = useAuthStore((s) => s.user);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    return getGreeting(hour);
  }, []);

  const hasRooms = React.Children.count(children) > 0;

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto animate-fade-in-up">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="font-heading text-2xl lg:text-3xl text-parchment">
          {greeting}, {user?.username || 'Мандрівнику'} ⚔️
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Обери або створи сесію для гри
        </p>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={onCreateSession}
          className="surface-parchment rounded-[var(--radius-lg)] p-4 flex flex-col items-center gap-2 hover:bg-amber/10 transition-all cursor-pointer group"
        >
          <span className="text-3xl group-hover:scale-110 transition-transform">
            🏰
          </span>
          <span className="text-sm font-heading text-parchment">
            Створити сесію
          </span>
          <span className="text-[10px] text-text-muted">Як Данжн Майстер</span>
        </button>

        <button
          onClick={onJoinSession}
          className="surface-parchment rounded-[var(--radius-lg)] p-4 flex flex-col items-center gap-2 hover:bg-amber/10 transition-all cursor-pointer group"
        >
          <span className="text-3xl group-hover:scale-110 transition-transform">
            ⚔️
          </span>
          <span className="text-sm font-heading text-parchment">
            Приєднатися
          </span>
          <span className="text-[10px] text-text-muted">До існуючої гри</span>
        </button>
      </div>

      {/* Active Sessions */}
      <div>
        <h2 className="font-heading text-lg text-parchment mb-3 flex items-center gap-2">
          <span>📋</span>
          Активні сесії
        </h2>

        {hasRooms ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {children}
          </div>
        ) : (
          /* Empty State */
          <div className="surface-card rounded-[var(--radius-xl)] p-8 text-center">
            <div className="text-5xl mb-4 animate-float">🐉</div>
            <p className="font-heading text-lg text-parchment mb-2">
              Поки що тихо...
            </p>
            <p className="text-sm text-text-muted max-w-xs mx-auto">
              Успішних походів у данжі! Створіть нову сесію або приєднайтесь до
              існуючої, щоб почати пригоду.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
