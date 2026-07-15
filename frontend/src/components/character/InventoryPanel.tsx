import React, { useState } from 'react';
import type { IInventoryItem, ICoins } from '../../../../shared/types/character';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';

interface InventoryPanelProps {
  inventory: IInventoryItem[];
  coins: ICoins;
  canEdit: boolean;
  onAddItem?: (item: IInventoryItem) => void;
  onRemoveItem?: (itemId: string) => void;
  onUpdateCoins?: (coins: ICoins) => void;
  onTransferItem?: (itemId: string, targetCharacterId: string, amount: number) => void;
  onTransferCoins?: (payload: { targetCharacterId: string; coinType: keyof ICoins; amount: number }) => void;
  availableCharacters?: { id: string; name: string }[];
}

const COIN_LABELS: { key: keyof ICoins; label: string; icon: string }[] = [
  { key: 'pp', label: 'ПЛ', icon: '💎' },
  { key: 'gp', label: 'ЗЛ', icon: '🪙' },
  { key: 'ep', label: 'ЕЛ', icon: '🔶' },
  { key: 'sp', label: 'СР', icon: '⚪' },
  { key: 'cp', label: 'МД', icon: '🟤' },
];

export function InventoryPanel({
  inventory,
  coins,
  canEdit,
  onAddItem,
  onRemoveItem,
  onUpdateCoins,
  onTransferItem,
  onTransferCoins,
  availableCharacters,
}: InventoryPanelProps): React.ReactElement {
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', quantity: 1, weight: 0, description: '' });
  const [transferState, setTransferState] = useState<{ item: IInventoryItem; amount: number; targetId: string } | null>(null);
  const [showCoinTransfer, setShowCoinTransfer] = useState(false);
  const [coinTransferState, setCoinTransferState] = useState({
    targetId: '',
    coinType: 'gp' as keyof ICoins,
    amount: 0,
  });

  const totalWeight = inventory.reduce((sum, item) => sum + item.weight * item.quantity, 0);

  const handleAdd = () => {
    if (!newItem.name.trim() || !onAddItem) return;
    onAddItem({ ...newItem, id: crypto.randomUUID(), name: newItem.name.trim() });
    setNewItem({ name: '', quantity: 1, weight: 0, description: '' });
    setShowAdd(false);
  };

  const handleConfirmCoinTransfer = () => {
    if (!onTransferCoins || !coinTransferState.targetId || coinTransferState.amount <= 0) return;
    onTransferCoins({
      targetCharacterId: coinTransferState.targetId,
      coinType: coinTransferState.coinType,
      amount: coinTransferState.amount,
    });
    setShowCoinTransfer(false);
    setCoinTransferState({ targetId: '', coinType: 'gp', amount: 0 });
  };

  return (
    <div className="surface-card rounded-[var(--radius-lg)] p-4">
      {/* Coins Row */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-1 pr-2 overflow-x-auto scrollbar-none">
        {COIN_LABELS.map(({ key, label, icon }) => (
          <div
            key={key}
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-surface-elevated text-xs flex-shrink-0"
          >
            <span className="text-sm">{icon}</span>
            {canEdit && onUpdateCoins ? (
              <input
                type="number"
                value={coins[key]}
                onChange={(e) => {
                  const newAmount = parseInt(e.target.value, 10);
                  if (!isNaN(newAmount)) {
                    onUpdateCoins({ ...coins, [key]: newAmount });
                  }
                }}
                className="w-12 bg-surface-elevated border border-transparent focus:border-amber rounded px-1 py-0.5 text-center font-mono font-semibold text-text-primary outline-none"
              />
            ) : (
              <span className="font-mono font-semibold text-text-primary">{coins[key]}</span>
            )}
            <span className="text-[9px] text-text-muted">{label}</span>
          </div>
        ))}
        </div>
        {canEdit && onTransferCoins && (
          <Button variant="ghost" size="sm" onClick={() => setShowCoinTransfer(true)} className="flex-shrink-0">
            Передати
          </Button>
        )}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading text-parchment text-sm flex items-center gap-2">
          <span>🎒</span> Інвентар
          <span className="text-[10px] text-text-muted font-body">
            ({totalWeight.toFixed(1)} кг)
          </span>
        </h3>
        {canEdit && (
          <Button size="sm" variant="ghost" onClick={() => setShowAdd(true)}>
            + Додати
          </Button>
        )}
      </div>

      {/* Items List */}
      {inventory.length > 0 ? (
        <div className="flex flex-col gap-1">
          {inventory.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] bg-surface-elevated/50 group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary truncate">{item.name}</p>
                {item.description && (
                  <p className="text-[10px] text-text-muted truncate">{item.description}</p>
                )}
              </div>
              <span className="text-xs text-text-muted font-mono flex-shrink-0">
                ×{item.quantity}
              </span>
              <span className="text-[10px] text-text-muted flex-shrink-0">
                {item.weight}кг
              </span>
              {canEdit && (
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {onTransferItem && availableCharacters && availableCharacters.length > 0 && (
                    <button
                      onClick={() => setTransferState({ item, amount: 1, targetId: '' })}
                      className="text-sky-400 text-xs px-1 cursor-pointer"
                      title="Передати"
                    >
                      ➔
                    </button>
                  )}
                  {onRemoveItem && (
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="text-blood text-xs px-1 cursor-pointer"
                      title="Видалити"
                    >✕</button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-text-muted text-center py-4">
          Інвентар порожній
        </p>
      )}

      {/* Add Item Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Додати предмет" size="sm">
        <div className="flex flex-col gap-3">
          <Input
            label="Назва"
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            placeholder="Зілля зцілення"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Кількість"
              type="number"
              value={String(newItem.quantity)}
              onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value, 10) || 1 })}
              min="1"
            />
            <Input
              label="Вага (кг)"
              type="number"
              value={String(newItem.weight)}
              onChange={(e) => setNewItem({ ...newItem, weight: parseFloat(e.target.value) || 0 })}
              min="0"
              step="0.1"
            />
          </div>
          <Input
            label="Опис"
            value={newItem.description}
            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
            placeholder="Відновлює 2d4+2 ОЗ"
          />
          <Button onClick={handleAdd} fullWidth>
            Додати
          </Button>
        </div>
      </Modal>

      {/* Transfer Item Modal */}
      <Modal
        isOpen={!!transferState}
        onClose={() => setTransferState(null)}
        title={`Передати "${transferState?.item.name}"`}
        size="sm"
      >
        {transferState && (
          <div className="flex flex-col gap-4">
            <Input
              label={`Кількість (макс. ${transferState.item.quantity})`}
              type="number"
              value={String(transferState.amount)}
              onChange={(e) => {
                const amount = parseInt(e.target.value, 10);
                if (!isNaN(amount)) {
                  setTransferState({
                    ...transferState,
                    amount: Math.max(1, Math.min(transferState.item.quantity, amount)),
                  });
                }
              }}
              min="1"
              max={transferState.item.quantity}
            />
            <div className="flex flex-col gap-1">
              <label className="text-xs text-text-muted">Кому</label>
              <select
                value={transferState.targetId}
                onChange={(e) => setTransferState({ ...transferState, targetId: e.target.value })}
                className="w-full bg-surface-elevated border border-border-default rounded px-3 py-2 text-text-primary focus:border-amber outline-none"
              >
                <option value="" disabled>Виберіть персонажа</option>
                {availableCharacters?.map(char => (
                  <option key={char.id} value={char.id}>{char.name}</option>
                ))}
              </select>
            </div>
            <Button onClick={() => { if (onTransferItem && transferState.targetId) { onTransferItem(transferState.item.id, transferState.targetId, transferState.amount); setTransferState(null); } }} disabled={!transferState.targetId || !onTransferItem}>Передати</Button>
          </div>
        )}
      </Modal>

      {/* Transfer Coins Modal */}
      <Modal isOpen={showCoinTransfer} onClose={() => setShowCoinTransfer(false)} title="Переказ монет" size="sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-text-muted">Кому</label>
            <select
              value={coinTransferState.targetId}
              onChange={(e) => setCoinTransferState({ ...coinTransferState, targetId: e.target.value })}
              className="w-full bg-surface-elevated border border-border-default rounded px-3 py-2 text-text-primary focus:border-amber outline-none"
            >
              <option value="" disabled>Виберіть персонажа</option>
              {availableCharacters?.map((char) => (
                <option key={char.id} value={char.id}>{char.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-muted">Валюта</label>
              <select
                value={coinTransferState.coinType}
                onChange={(e) =>
                  setCoinTransferState({ ...coinTransferState, coinType: e.target.value as keyof ICoins, amount: 0 })
                }
                className="w-full bg-surface-elevated border border-border-default rounded px-3 py-2 text-text-primary focus:border-amber outline-none"
              >
                {COIN_LABELS.map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>
            <Input
              label={`Кількість (макс. ${coins[coinTransferState.coinType]})`}
              type="number"
              value={String(coinTransferState.amount)}
              onChange={(e) => {
                const amount = parseInt(e.target.value, 10);
                if (!isNaN(amount)) {
                  setCoinTransferState({
                    ...coinTransferState,
                    amount: Math.max(0, Math.min(coins[coinTransferState.coinType], amount)),
                  });
                }
              }}
              min="0"
              max={coins[coinTransferState.coinType]}
            />
          </div>

          <Button onClick={handleConfirmCoinTransfer} disabled={!coinTransferState.targetId || coinTransferState.amount <= 0}>Підтвердити</Button>
        </div>
      </Modal>
    </div>
  );
}
