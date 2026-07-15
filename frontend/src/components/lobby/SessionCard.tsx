import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { IRoom } from '../../../../shared/types/index';

interface SessionCardProps {
  room: IRoom;
}

export function SessionCard({ room }: SessionCardProps): React.ReactElement {
  const navigate = useNavigate();
  
  // Додано безпечну перевірку
  const slots = room.playerSlots || [];
  const playerCount = slots.filter((s) => s.userId).length;
  const totalSlots = slots.length;

  return (
    <button
      onClick={() => navigate(`/session/${room._id}`)}
      className="surface-card rounded-[var(--radius-lg)] p-4 text-left transition-all hover:glow-amber cursor-pointer group w-full"
    >
      {/* Title Row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-heading text-parchment text-base truncate group-hover:text-amber-glow transition-colors">
            {room.name}
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Код: <span className="text-amber font-mono">{room.roomCode}</span>
          </p>
        </div>
        <span className="text-2xl ml-2">🎲</span>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-4 text-xs text-text-secondary">
        <div className="flex items-center gap-1">
          <span>👥</span>
          <span>
            {playerCount}/{totalSlots}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span>📅</span>
          <span>
            День {room.gameTime?.day || 1}, Рік {room.gameTime?.year || 1490}
          </span>
        </div>
      </div>

      {/* Player bar */}
      <div className="mt-3 h-1.5 rounded-full bg-iron overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber to-gold transition-all"
          style={{ width: `${totalSlots > 0 ? (playerCount / totalSlots) * 100 : 0}%` }}
        />
      </div>
    </button>
  );
}