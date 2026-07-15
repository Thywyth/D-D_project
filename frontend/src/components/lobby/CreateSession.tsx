import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { api } from '../../services/api';
import { showToast } from '../ui/Toast';
import type { IRoom } from '../../../../shared/types/index';

interface CreateSessionProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateSession({ isOpen, onClose }: CreateSessionProps): React.ReactElement {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [playerCount, setPlayerCount] = useState('4');
  const [startingYear, setStartingYear] = useState('1490');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsLoading(true);

    try {
      const room = await api.post<IRoom>('/rooms', {
        name: name.trim(),
        playerSlotCount: parseInt(playerCount, 10),
        startingYear: parseInt(startingYear, 10)
      });
      showToast('Сесію створено!', 'success');
      onClose();
      navigate(`/session/${room._id}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Помилка створення сесії.';
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Створити нову сесію">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Назва кампанії"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Загублені шахти Фанделвера"
          icon={<span>🏰</span>}
          required
        />

        <Input
          label="Кількість гравців"
          type="number"
          value={playerCount}
          onChange={(e) => setPlayerCount(e.target.value)}
          placeholder="4"
          icon={<span>👥</span>}
          min="1"
          max="8"
        />

        <Input
          label="Рік початку подій"
          type="number"
          value={startingYear}
          onChange={(e) => setStartingYear(e.target.value)}
          placeholder="1490"
          icon={<span>📅</span>}
          min="1"
          required
        />

        <div className="surface-parchment rounded-[var(--radius-md)] p-3 mt-1">
          <p className="text-xs text-text-secondary">
            💡 Після створення ви отримаєте унікальний <strong className="text-amber">код кімнати</strong>{' '}
            та <strong className="text-amber">коди гравців</strong> для кожного слота.
          </p>
        </div>

        <div className="flex gap-3 mt-2">
          <Button type="button" variant="secondary" onClick={onClose} fullWidth>
            Скасувати
          </Button>
          <Button type="submit" isLoading={isLoading} fullWidth>
            Створити
          </Button>
        </div>
      </form>
    </Modal>
  );
}
