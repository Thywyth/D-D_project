import React from 'react';

interface FABProps {
  onClick: () => void;
  icon?: string;
  label?: string;
}

export function FAB({
  onClick,
  icon = '🎲',
  label = 'Кинути кості',
}: FABProps): React.ReactElement {
  return (
    <button
      onClick={onClick}
      className="fab animate-float"
      aria-label={label}
      title={label}
    >
      <span className="text-xl">{icon}</span>
    </button>
  );
}
