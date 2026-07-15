import React, { useEffect, useState } from 'react';

interface DiceAnimationProps {
  isRolling: boolean;
  result: number | null;
  dieType: string;
}

export function DiceAnimation({ isRolling, result, dieType }: DiceAnimationProps): React.ReactElement {
  const [displayValue, setDisplayValue] = useState<string>('?');
  const [phase, setPhase] = useState<'idle' | 'rolling' | 'reveal'>('idle');

  useEffect(() => {
    if (isRolling) {
      setPhase('rolling');
      setDisplayValue('?');

      // Simulate randomized numbers during roll animation
      const max = parseInt(dieType.replace('d', ''), 10) || 20;
      const interval = setInterval(() => {
        setDisplayValue(String(Math.floor(Math.random() * max) + 1));
      }, 80);

      return () => clearInterval(interval);
    }
    return undefined; // <--- ДОДАНО ЦЕЙ РЯДОК
  }, [isRolling, dieType]);

  useEffect(() => {
    if (!isRolling && result !== null) {
      // Brief delay after roll stops, then reveal
      const timer = setTimeout(() => {
        setDisplayValue(String(result));
        setPhase('reveal');
      }, 200);
      return () => clearTimeout(timer);
    }
    return undefined; // <--- ДОДАНО ЦЕЙ РЯДОК
  }, [isRolling, result]);

  useEffect(() => {
    if (phase === 'reveal') {
      const timer = setTimeout(() => setPhase('idle'), 2000);
      return () => clearTimeout(timer);
    }
    return undefined; // <--- ДОДАНО ЦЕЙ РЯДОК
  }, [phase]);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Die display */}
      <div
        className={[
          'relative w-28 h-28 flex items-center justify-center',
          'rounded-[var(--radius-xl)] border-2',
          'transition-all',
          phase === 'rolling'
            ? 'animate-dice-roll border-amber bg-amber/10 shadow-glow-amber'
            : phase === 'reveal'
              ? 'animate-bounce-in border-gold bg-gold/10 shadow-[0_0_30px_rgba(245,158,11,0.3)]'
              : 'border-border-default bg-surface-elevated',
        ].join(' ')}
      >
        <span
          className={[
            'font-heading font-bold transition-all',
            phase === 'reveal'
              ? 'text-4xl text-amber-glow'
              : phase === 'rolling'
                ? 'text-3xl text-parchment'
                : 'text-3xl text-text-muted',
          ].join(' ')}
        >
          {displayValue}
        </span>

        {/* Particle burst on reveal */}
        {phase === 'reveal' && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full bg-amber"
                style={{
                  top: '50%',
                  left: '50%',
                  animation: `particleBurst 0.6s ease-out forwards`,
                  animationDelay: `${i * 50}ms`,
                  transform: `rotate(${i * 60}deg) translateY(-40px)`,
                  opacity: 0,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Label */}
      <p className="text-xs text-text-muted font-heading uppercase tracking-widest">
        {phase === 'rolling'
          ? 'Кидок...'
          : phase === 'reveal'
            ? `Результат ${dieType}`
            : dieType.toUpperCase()}
      </p>
    </div>
  );
}
