import React from 'react';
import type { Skills, SkillName } from '../../../../shared/types/character';

interface SkillsPanelProps {
  skills: Skills;
  proficiencyBonus: number;
}

const SKILL_LABELS: Record<SkillName, { ua: string; ability: string }> = {
  acrobatics:     { ua: 'Акробатика',      ability: 'DEX' },
  animalHandling: { ua: 'Поводж. з тварин', ability: 'WIS' },
  arcana:         { ua: 'Арканістика',      ability: 'INT' },
  athletics:      { ua: 'Атлетика',         ability: 'STR' },
  deception:      { ua: 'Обман',            ability: 'CHA' },
  history:        { ua: 'Історія',          ability: 'INT' },
  insight:        { ua: 'Проникливість',    ability: 'WIS' },
  intimidation:   { ua: 'Залякування',      ability: 'CHA' },
  investigation:  { ua: 'Розслідування',    ability: 'INT' },
  medicine:       { ua: 'Медицина',         ability: 'WIS' },
  nature:         { ua: 'Природа',          ability: 'INT' },
  perception:     { ua: 'Сприйняття',       ability: 'WIS' },
  performance:    { ua: 'Виступ',           ability: 'CHA' },
  persuasion:     { ua: 'Переконання',      ability: 'CHA' },
  religion:       { ua: 'Релігія',          ability: 'INT' },
  sleightOfHand:  { ua: 'Спритність рук',   ability: 'DEX' },
  stealth:        { ua: 'Непомітність',     ability: 'DEX' },
  survival:       { ua: 'Виживання',        ability: 'WIS' },
};

export function SkillsPanel({ skills }: SkillsPanelProps): React.ReactElement {
  const skillKeys = Object.keys(SKILL_LABELS) as SkillName[];

  return (
    <div className="surface-card rounded-[var(--radius-lg)] p-4">
      <h3 className="font-heading text-parchment text-sm mb-3 flex items-center gap-2">
        <span>🎯</span> Навички
      </h3>
      <div className="flex flex-col gap-0.5">
        {skillKeys.map((key) => {
          const skill = skills[key];
          const label = SKILL_LABELS[key];
          const bonusStr = skill.bonus >= 0 ? `+${skill.bonus}` : String(skill.bonus);

          return (
            <div
              key={key}
              className={[
                'flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-sm)]',
                'text-xs transition-colors',
                skill.proficient
                  ? 'bg-amber/5 text-text-primary'
                  : 'text-text-secondary hover:bg-iron/20',
              ].join(' ')}
            >
              {/* Proficiency dot */}
              <div
                className={[
                  'w-2.5 h-2.5 rounded-full border flex-shrink-0',
                  skill.proficient
                    ? 'bg-amber border-amber'
                    : 'border-ash bg-transparent',
                ].join(' ')}
              />

              {/* Skill name */}
              <span className="flex-1 truncate">{label.ua}</span>

              {/* Ability tag */}
              <span className="text-[9px] text-text-muted font-mono">
                {label.ability}
              </span>

              {/* Bonus */}
              <span
                className={[
                  'font-mono font-semibold min-w-[2rem] text-right',
                  skill.proficient ? 'text-amber' : '',
                ].join(' ')}
              >
                {bonusStr}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
