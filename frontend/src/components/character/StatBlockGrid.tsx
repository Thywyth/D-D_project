import React from 'react';
import type { AbilityScores, AbilityName } from '../../../../shared/types/character';

interface StatBlockGridProps {
  abilities: AbilityScores;
  onAbilityClick?: (ability: AbilityName) => void;
}

const ABILITY_LABELS: Record<AbilityName, string> = {
  STR: 'Сила',
  DEX: 'Спрт',
  CON: 'Стат',
  INT: 'Інтл',
  WIS: 'Мудр',
  CHA: 'Хрзм',
};

export function StatBlockGrid({
  abilities,
  onAbilityClick,
}: StatBlockGridProps): React.ReactElement {
  const abilityKeys = Object.keys(abilities) as AbilityName[];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      {abilityKeys.map((key) => {
        const ability = abilities[key];
        const modStr =
          ability.modifier >= 0 ? `+${ability.modifier}` : String(ability.modifier);

        return (
          <button
            key={key}
            onClick={() => onAbilityClick?.(key)}
            className={[
              'stat-block relative group transition-all cursor-pointer',
              'hover:border-amber/40 hover:shadow-glow-amber',
            ].join(' ')}
          >
            {/* Ability abbreviation */}
            <span className="stat-block-label">{ABILITY_LABELS[key]}</span>

            {/* Score */}
            <span className="stat-block-value">{ability.score}</span>

            {/* Modifier */}
            <span className="stat-block-modifier">{modStr}</span>

            {/* Full name tooltip */}
            <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-void text-[10px] text-parchment rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {key}
            </span>
          </button>
        );
      })}
    </div>
  );
}
