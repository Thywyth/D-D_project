import React, { useState } from 'react';
import type { ICharacter } from '../../../../shared/types/character';
import { useCharacterStore } from '../../stores/characterStore';
import { useSessionStore } from '../../stores/sessionStore';
import { PlayerCard, PlayerCodeCard } from './PlayerCards';
import { api } from '../../services/api';
import { showToast } from '../ui/Toast';
import { Button } from '../ui/Button';
import { CreateCharacterModal } from '../character/CreateCharacterModal';
import { Modal } from '../ui/Modal';
import { CharacterSheet } from '../character/CharacterSheet';

export function DMDashboard(): React.ReactElement {
  const characters = useCharacterStore((s) => s.characters);
  const currentRoom = useSessionStore((s) => s.currentRoom);
  const updateRoom = useSessionStore((s) => s.updateRoom);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);

  const charList = Object.values(characters) as ICharacter[];
  const aliveCount = charList.filter((c) => c.status === 'alive').length;
  const avgHP = charList.length > 0
    ? Math.round(charList.reduce((sum, c) => sum + (c.maxHP > 0 ? (c.currentHP / c.maxHP) * 100 : 0), 0) / charList.length)
    : 0;

  const handleRegenerateCode = async (slotIndex: number) => {
    if (!currentRoom) return;
    try {
      const result = await api.post<{ playerCode: string }>(
        `/rooms/${currentRoom._id}/regenerate-code`,
        { slotIndex },
      );
      const updatedSlots = [...currentRoom.playerSlots];
      const slot = updatedSlots[slotIndex];
      if (slot) {
        updatedSlots[slotIndex] = { ...slot, playerCode: result.playerCode };
        updateRoom({ playerSlots: updatedSlots });
      }
      showToast('Новий код гравця згенеровано!', 'success');
    } catch {
      showToast('Помилка генерації коду.', 'error');
    }
  };
  const handleAddPlayerSlot = async () => {
    if (!currentRoom) return;
    try {
      // Відправляємо POST запит на бекенд для створення нового слота
      const result = await api.post<{ playerCode: string; newSlot: any }>(
        `/rooms/${currentRoom._id}/add-slot`
      );

      // Оновлюємо локальний стан кімнати
      const updatedSlots = [...currentRoom.playerSlots, result.newSlot];
      updateRoom({ playerSlots: updatedSlots });

      showToast('Новий слот гравця створено!', 'success');
    } catch {
      showToast('Помилка створення слота.', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in-up">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="surface-parchment rounded-[var(--radius-lg)] p-3 text-center">
          <p className="text-2xl font-bold text-parchment">{charList.length}</p>
          <p className="text-[10px] text-text-muted font-heading uppercase">Персонажів</p>
        </div>
        <div className="surface-parchment rounded-[var(--radius-lg)] p-3 text-center">
          <p className="text-2xl font-bold text-emerald">{aliveCount}</p>
          <p className="text-[10px] text-text-muted font-heading uppercase">Живих</p>
        </div>
        <div className="surface-parchment rounded-[var(--radius-lg)] p-3 text-center">
          <p className={[
            'text-2xl font-bold',
            avgHP > 60 ? 'text-emerald' : avgHP > 25 ? 'text-amber' : 'text-blood',
          ].join(' ')}>
            {avgHP}%
          </p>
          <p className="text-[10px] text-text-muted font-heading uppercase">Сер. ОЗ</p>
        </div>
      </div>

      {/* Active Characters */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading text-parchment text-sm flex items-center gap-2">
            <span>⚔️</span> Персонажі гравців
          </h3>
          <Button size="sm" onClick={() => setIsCreateModalOpen(true)} className="bg-amber text-void">
            ➕ Створити персонажа
          </Button>
        </div>
        {charList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {charList.map((char) => (
              <PlayerCard
                key={char._id}
                character={char}
                onClick={() => setSelectedCharacterId(char._id)}
              />
            ))}
          </div>
        ) : (
          <div className="surface-card rounded-[var(--radius-lg)] p-6 text-center">
            <p className="text-text-muted text-sm">Ще немає персонажів у цій сесії</p>
          </div>
        )}
      </div>

      {/* Player Codes */}
      {currentRoom && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading text-parchment text-sm flex items-center gap-2">
              <span>🎫</span> Коди гравців
            </h3>
            {/* НОВА КНОПКА ОСЬ ТУТ */}
            <Button size="sm" onClick={handleAddPlayerSlot} className="bg-amber text-void">
              ➕ Додати слот
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {currentRoom.playerSlots.map((slot: any, i: number) => (
              <PlayerCodeCard
                key={i}
                slotIndex={i}
                playerCode={slot.playerCode}
                hasPlayer={!!slot.userId}
                onRegenerate={() => void handleRegenerateCode(i)}
              />
            ))}
          </div>
        </div>
      )}

      {currentRoom && (
        <CreateCharacterModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          roomId={currentRoom._id}
        />
      )}

      {selectedCharacterId && (
        <Modal
          isOpen={!!selectedCharacterId}
          onClose={() => setSelectedCharacterId(null)}
          title="Аркуш персонажа"
        >
          <CharacterSheet characterId={selectedCharacterId} />
        </Modal>
      )}
    </div>
  );
}
