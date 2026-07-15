import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface MarkerFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description: string; color: string }) => void;
  position: { x: number; y: number };
}

const MARKER_COLORS: string[] = [
  '#f59e0b', // amber
  '#dc2626', // blood
  '#10b981', // emerald
  '#8b5cf6', // arcane
  '#06b6d4', // ice
  '#ec4899', // pink
  '#f97316', // orange
  '#3b82f6', // blue
];

export function MarkerForm({
  isOpen,
  onClose,
  onSubmit,
  position,
}: MarkerFormProps): React.ReactElement {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(MARKER_COLORS[0] ?? '#f59e0b');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), description: description.trim(), color });
    setName('');
    setDescription('');
    setColor(MARKER_COLORS[0] ?? '#f59e0b');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Новий маркер" size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <p className="text-[10px] text-text-muted">
          Позиція: {position.x.toFixed(1)}%, {position.y.toFixed(1)}%
        </p>

        <Input
          label="Назва"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Таверна «Зламаний Меч»"
          required
        />

        <Input
          label="Опис"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Місце зустрічі з НПС"
        />

        {/* Color Picker */}
        <div>
          <label className="text-xs font-heading font-semibold uppercase tracking-wider text-parchment mb-1.5 block">
            Колір
          </label>
          <div className="flex gap-2 flex-wrap">
            {MARKER_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={[
                  'w-7 h-7 rounded-full border-2 transition-all cursor-pointer',
                  color === c
                    ? 'border-white scale-110 shadow-lg'
                    : 'border-transparent hover:border-white/40',
                ].join(' ')}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-3 mt-2">
          <Button type="button" variant="secondary" onClick={onClose} fullWidth>
            Скасувати
          </Button>
          <Button type="submit" fullWidth>
            Додати
          </Button>
        </div>
      </form>
    </Modal>
  );
}
