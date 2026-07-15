import React from 'react';
import type { ICharacter } from '../../../../shared/types/character';

interface CharacterHeaderProps {
  character: ICharacter;
}

export function CharacterHeader({ character }: CharacterHeaderProps): React.ReactElement {
  const hpPercent = character.maxHP > 0
    ? Math.round((character.currentHP / character.maxHP) * 100)
    : 0;

  const hpColor =
    hpPercent > 60 ? 'from-emerald to-emerald-dark'
    : hpPercent > 25 ? 'from-amber to-gold'
    : 'from-blood to-blood-dark';

  return (
    <div className="surface-parchment rounded-[var(--radius-lg)] p-4 animate-fade-in">
      {/* Top Row: Name + Level */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h2 className="font-heading text-xl text-parchment-light truncate">
            {character.name}
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            {character.race} · {character.class} · Рівень {character.level}
          </p>
        </div>
        <div className="flex flex-col items-center ml-3">
          <div className="stat-block px-3 py-1">
            <span className="stat-block-label text-[8px]">Рів</span>
            <span className="stat-block-value text-lg">{character.level}</span>
          </div>
        </div>
      </div>

      {/* HP Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-heading uppercase tracking-wider text-text-muted">
            Здоров'я
          </span>
          <span className="text-xs font-mono text-text-secondary">
            {character.currentHP}/{character.maxHP}
            {character.tempHP > 0 && (
              <span className="text-ice ml-1">(+{character.tempHP})</span>
            )}
          </span>
        </div>
        <div className="hp-bar">
          <div
            className={`hp-bar-fill bg-gradient-to-r ${hpColor}`}
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        <div className="stat-block flex-shrink-0">
          <span className="stat-block-label">КЗ</span>
          <span className="stat-block-value text-base">{character.armorClass}</span>
        </div>
        <div className="stat-block flex-shrink-0">
          <span className="stat-block-label">Ініц</span>
          <span className="stat-block-value text-base">
            {character.initiative >= 0 ? '+' : ''}{character.initiative}
          </span>
        </div>
        <div className="stat-block flex-shrink-0">
          <span className="stat-block-label">Швид</span>
          <span className="stat-block-value text-base">{character.speed}</span>
        </div>
        <div className="stat-block flex-shrink-0">
          <span className="stat-block-label">Бонус</span>
          <span className="stat-block-value text-base">+{character.proficiencyBonus}</span>
        </div>
        {character.inspiration && (
          <div className="stat-block flex-shrink-0 border-amber/30">
            <span className="stat-block-label text-amber">Натх</span>
            <span className="text-amber text-lg">✨</span>
          </div>
        )}
      </div>
    </div>
  );
}
