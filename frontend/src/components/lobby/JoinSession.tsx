import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { api } from '../../services/api';
import { showToast } from '../ui/Toast';

interface JoinSessionProps {
  isOpen: boolean;
  onClose: () => void;
}

interface JoinResponse {
  roomId: string;
}

export function JoinSession({ isOpen, onClose }: JoinSessionProps): React.ReactElement {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState('');
  const [playerCode, setPlayerCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim() || !playerCode.trim()) return;
    setIsLoading(true);

    try {
      const result = await api.post<JoinResponse>('/rooms/join', {
        roomCode: roomCode.trim().toUpperCase(),
        playerCode: playerCode.trim().toUpperCase(),
      });
      showToast('Приєднано до сесії!', 'success');
      onClose();
      navigate(`/session/${result.roomId}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Невірний код. Спробуйте ще.';
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Приєднатися до сесії">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Код кімнати"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          placeholder="ABCD12"
          icon={<span>🏰</span>}
          className="font-mono uppercase tracking-widest"
          required
          maxLength={8}
        />

        <Input
          label="Код гравця"
          value={playerCode}
          onChange={(e) => setPlayerCode(e.target.value.toUpperCase())}
          placeholder="XYZ789"
          icon={<span>🎫</span>}
          className="font-mono uppercase tracking-widest"
          required
          maxLength={8}
        />

        <div className="surface-parchment rounded-[var(--radius-md)] p-3 mt-1">
          <p className="text-xs text-text-secondary">
            🔑 Отримайте <strong className="text-amber">код кімнати</strong> та{' '}
            <strong className="text-amber">код гравця</strong> від вашого Данжн Майстра.
          </p>
        </div>

        <div className="flex gap-3 mt-2">
          <Button type="button" variant="secondary" onClick={onClose} fullWidth>
            Скасувати
          </Button>
          <Button type="submit" isLoading={isLoading} fullWidth>
            Приєднатися
          </Button>
        </div>
      </form>
    </Modal>
  );
}
