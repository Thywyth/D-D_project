import React, { useState } from 'react';
import { DieButton } from './DieButton';
import { DiceAnimation } from './DiceAnimation';
import type { DieType } from '../../../../shared/types/index';

interface DiceOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const DICE: { die: DieType; label: string }[] = [
  { die: 'd4', label: 'D4' },
  { die: 'd6', label: 'D6' },
  { die: 'd8', label: 'D8' },
  { die: 'd12', label: 'D12' },
  { die: 'd20', label: 'D20' },
  { die: 'd100', label: 'D100' },
];

export function DiceOverlay({ isOpen, onClose }: DiceOverlayProps): React.ReactElement | null {
  // Локальні стани для керування анімацією
  const [selectedDie, setSelectedDie] = useState<DieType>('d20');
  const [isRolling, setIsRolling] = useState(false);
  const [localResult, setLocalResult] = useState<number | null>(null);

  if (!isOpen) return null;

  // Повністю локальна функція кидка
  const handleRoll = (die: DieType) => {
    setSelectedDie(die);
    setIsRolling(true);
    setLocalResult(null); // Очищаємо попередній результат

    // Витягуємо максимальне число (наприклад, 20 з 'd20')
    const max = parseInt(die.replace(/\D/g, ''), 10) || 20;

    // Браузер генерує випадкове число миттєво
    const finalResult = Math.floor(Math.random() * max) + 1;

    // Чекаємо 1.5 секунди, поки покрутиться красива анімація
    setTimeout(() => {
      setLocalResult(finalResult);
      setIsRolling(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-void/90 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      />

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full glass text-ash hover:text-text-primary transition-colors cursor-pointer"
          aria-label="Закрити"
        >
          ✕
        </button>

        {/* Title */}
        <h2 className="font-heading text-2xl text-parchment mb-6 animate-fade-in-down">
          🎲 Кидок кісток
        </h2>

        {/* Animation Area */}
        <div className="mb-8">
          <DiceAnimation
            isRolling={isRolling}
            result={localResult}
            dieType={selectedDie}
          />
        </div>

        {/* Die Selector Grid */}
        <div className="flex flex-wrap justify-center gap-3 mb-8 animate-fade-in-up">
          {DICE.map(({ die, label }) => (
            <DieButton
              key={die}
              die={die}
              label={label}
              onClick={handleRoll}
              isDisabled={isRolling}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
