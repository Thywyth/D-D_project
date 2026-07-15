import React from 'react';
import type { ICharacter } from '../../../../shared/types/character';
import { Button } from '../ui/Button';

interface PlayerCardProps {
  character: ICharacter;
  onClick?: () => void;
}

export function PlayerCard({ character, onClick }: PlayerCardProps): React.ReactElement {
  const hpPercent = character.maxHP > 0
    ? Math.round((character.currentHP / character.maxHP) * 100)
    : 0;

  const hpColor =
    hpPercent > 60 ? 'from-emerald to-emerald-dark'
    : hpPercent > 25 ? 'from-amber to-gold'
    : 'from-blood to-blood-dark';

  const statusEmoji =
    character.status === 'alive' ? '💚'
    : character.status === 'dead' ? '💀'
    : '😴';

  return (
    <div
      onClick={onClick}
      className={`surface-card rounded-[var(--radius-lg)] p-3 hover:glow-amber transition-all ${onClick ? 'cursor-pointer' : ''}`}
      role={onClick ? 'button' : undefined}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-parchment-dark to-parchment flex items-center justify-center text-void font-heading font-bold text-sm flex-shrink-0">
          {character.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-text-primary truncate">
              {character.name}
            </span>
            <span className="text-xs">{statusEmoji}</span>
          </div>
          <p className="text-[10px] text-text-muted">
            {character.race} · {character.class} · Рів. {character.level}
          </p>
        </div>
      </div>

      {/* HP Bar */}
      <div className="mb-2">
        <div className="flex justify-between items-center mb-0.5">
          <span className="text-[9px] text-text-muted uppercase font-heading">ОЗ</span>
          <span className="text-[10px] font-mono text-text-secondary">
            {character.currentHP}/{character.maxHP}
          </span>
        </div>
        <div className="hp-bar h-1.5">
          <div
            className={`hp-bar-fill bg-gradient-to-r ${hpColor}`}
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="flex gap-1.5">
        <div className="flex-1 text-center py-1 bg-surface-elevated rounded-[var(--radius-sm)]">
          <p className="text-[8px] text-text-muted font-heading uppercase">КЗ</p>
          <p className="text-sm font-bold text-text-primary">{character.armorClass}</p>
        </div>
        <div className="flex-1 text-center py-1 bg-surface-elevated rounded-[var(--radius-sm)]">
          <p className="text-[8px] text-text-muted font-heading uppercase">Ініц</p>
          <p className="text-sm font-bold text-text-primary">
            {character.initiative >= 0 ? '+' : ''}{character.initiative}
          </p>
        </div>
        <div className="flex-1 text-center py-1 bg-surface-elevated rounded-[var(--radius-sm)]">
          <p className="text-[8px] text-text-muted font-heading uppercase">ПМ</p>
          <p className="text-sm font-bold text-text-primary">{character.passiveWisdom}</p>
        </div>
      </div>
    </div>
  );
}

interface PlayerCodeCardProps {
  slotIndex: number;
  playerCode: string;
  hasPlayer: boolean;
  onRegenerate: () => void;
}

export function PlayerCodeCard({
  slotIndex,
  playerCode,
  hasPlayer,
  onRegenerate,
}: PlayerCodeCardProps): React.ReactElement {
  return (
    <div className={[
      'surface-card rounded-[var(--radius-lg)] p-3',
      hasPlayer ? 'border-emerald/20' : 'border-dashed border-border-accent',
    ].join(' ')}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-text-muted">
          Слот {slotIndex + 1}
        </span>
        <span className={[
          'px-1.5 py-0.5 text-[9px] rounded-full',
          hasPlayer
            ? 'bg-emerald/15 text-emerald'
            : 'bg-iron/30 text-text-muted',
        ].join(' ')}>
          {hasPlayer ? 'Зайнято' : 'Вільний'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <code className="flex-1 px-2 py-1.5 bg-void rounded-[var(--radius-sm)] font-mono text-amber text-sm tracking-widest text-center select-all">
          {playerCode}
        </code>
        {!hasPlayer && (
          <Button size="sm" variant="ghost" onClick={onRegenerate} className="flex-shrink-0">
            🔄
          </Button>
        )}
      </div>
    </div>
  );
}
