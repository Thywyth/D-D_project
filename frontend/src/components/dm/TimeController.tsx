import React, { useState } from 'react';
import { useSessionStore } from '../../stores/sessionStore';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { showToast } from '../ui/Toast';
import type { IGameTime } from '../../../../shared/types/index';

interface AdvanceTimeResponse {
  gameTime: IGameTime;
  agedCharacters: Array<{ characterId: string; newAge: number }>;
  agedNodes: Array<{ treeId: string; nodeId: string; newAge: number }>;
}

const MONTHS = [
  'Хаммер',     'Алтуріак',   'Чеш',        'Тарсах',
  'Міртул',     'Кайтйас',    'Флеймрул',    'Елеасіас',
  'Елеінт',     'Маркеш',     'Укттар',      'Найтал',
];

export function TimeController(): React.ReactElement {
  const currentRoom = useSessionStore((s) => s.currentRoom);
  const gameTime = useSessionStore((s) => s.gameTime);
  const updateGameTime = useSessionStore((s) => s.updateGameTime);
  const [showCustom, setShowCustom] = useState(false);
  const [customDays, setCustomDays] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const monthName = MONTHS[(gameTime.month - 1) % 12] ?? `Місяць ${gameTime.month}`;

  const advanceTime = async (days: number) => {
    if (!currentRoom || isLoading) return;
    setIsLoading(true);

    try {
      const result = await api.post<AdvanceTimeResponse>(
        `/rooms/${currentRoom._id}/advance-time`,
        { days },
      );
      updateGameTime(result.gameTime);

      const agingCount = result.agedCharacters.length + result.agedNodes.length;
      if (agingCount > 0) {
        showToast(`Час просунуто. ${agingCount} сутностей постаріли.`, 'info');
      } else {
        showToast(`Час просунуто на ${days} ${days === 1 ? 'день' : 'днів'}.`, 'success');
      }
    } catch {
      showToast('Помилка просування часу.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomAdvance = () => {
    const days = parseInt(customDays, 10);
    if (isNaN(days) || days < 1) {
      showToast('Введіть коректну кількість днів.', 'error');
      return;
    }
    void advanceTime(days);
    setCustomDays('');
    setShowCustom(false);
  };

  return (
    // Додано relative та z-10
    <div className="relative z-10000 surface-card rounded-[var(--radius-lg)] p-4 animate-fade-in-up">
      <h3 className="font-heading text-parchment text-sm mb-4 flex items-center gap-2">
        <span>⏳</span> Час у грі
      </h3>

      {/* Current Time Display */}
      <div className="flex items-center justify-center gap-4 mb-5">
        <div className="text-center">
          <p className="text-3xl font-heading font-bold text-parchment-light">
            {gameTime.day}
          </p>
          <p className="text-[9px] text-text-muted uppercase font-heading">День</p>
        </div>

        <div className="w-px h-10 bg-border-default" />

        <div className="text-center">
          <p className="text-lg font-heading font-semibold text-amber">
            {monthName}
          </p>
          <p className="text-[9px] text-text-muted uppercase font-heading">Місяць</p>
        </div>

        <div className="w-px h-10 bg-border-default" />

        <div className="text-center">
          <p className="text-3xl font-heading font-bold text-parchment-light">
            {gameTime.year}
          </p>
          <p className="text-[9px] text-text-muted uppercase font-heading">Рік</p>
        </div>
      </div>

      {/* Quick Advance Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => void advanceTime(1)}
          isLoading={isLoading}
          fullWidth
        >
          +1 День
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => void advanceTime(7)}
          isLoading={isLoading}
          fullWidth
        >
          +7 Днів
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => void advanceTime(30)}
          isLoading={isLoading}
          fullWidth
        >
          +1 Місяць
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowCustom(true)}
          fullWidth
        >
          ✏️ Інше
        </Button>
      </div>

      {/* Auto-aging Notice */}
      <div className="surface-parchment rounded-[var(--radius-md)] p-2.5 mt-2">
        <p className="text-[10px] text-text-secondary">
          ⚙️ Просування часу автоматично оновлює <strong className="text-amber">вік персонажів</strong>{' '}
          та <strong className="text-amber">вузлів родоводу</strong> через сервіс ageCalculator.
        </p>
      </div>

      {/* Custom Advance Modal */}
      <Modal
        isOpen={showCustom}
        onClose={() => setShowCustom(false)}
        title="Просунути час"
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Кількість днів"
            type="number"
            value={customDays}
            onChange={(e) => setCustomDays(e.target.value)}
            placeholder="365"
            icon={<span>📅</span>}
            min="1"
          />
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowCustom(false)} fullWidth>
              Скасувати
            </Button>
            <Button onClick={handleCustomAdvance} isLoading={isLoading} fullWidth>
              Просунути
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
