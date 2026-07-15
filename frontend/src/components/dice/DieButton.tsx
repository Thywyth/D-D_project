import React from 'react';
import type { DieType } from '../../../../shared/types/index';

interface DieButtonProps {
  die: DieType;
  label: string;
  onClick: (die: DieType) => void;
  isDisabled?: boolean;
}

const DIE_EMOJIS: Record<DieType, string> = {
  d4: '🔺',
  d6: '🎲',
  d8: '💎',
  d12: '⬡',
  d20: '⭐',
  d100: '💯',
};

export function DieButton({ die, label, onClick, isDisabled }: DieButtonProps): React.ReactElement {
  return (
    <button
      onClick={() => onClick(die)}
      disabled={isDisabled}
      className={[
        'flex flex-col items-center justify-center gap-1',
        'w-16 h-16 rounded-[var(--radius-lg)]',
        'bg-surface-elevated border border-border-default',
        'hover:border-amber hover:glow-amber hover:scale-105',
        'active:scale-95',
        'transition-all duration-[var(--transition-fast)] cursor-pointer',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:border-border-default',
      ].join(' ')}
    >
      <span className="text-xl">{DIE_EMOJIS[die]}</span>
      <span className="text-[10px] font-heading font-semibold text-parchment uppercase tracking-wider">
        {label}
      </span>
    </button>
  );
}
