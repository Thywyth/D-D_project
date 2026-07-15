import React, { useState, useEffect } from 'react';
import type { ITreeNode } from '../../../../shared/types/index';
import { Button } from '../ui/Button';
import { useTreeStore } from '../../stores/treeStore';
import { Input } from '../ui/Input';

interface NodeDetailProps {
  node: ITreeNode;
  isDM: boolean;
  onClose: () => void;
  onToggleVisibility?: () => void;
}

export function NodeDetail({
  node,
  isDM,
  onClose,
  onToggleVisibility,
}: NodeDetailProps): React.ReactElement {
  const { updateNode, deleteNode, activeTree } = useTreeStore();
  const [isEditing, setIsEditing] = useState(false);

  // Local state for form fields
  const [editName, setEditName] = useState(node.name);
  const [editAge, setEditAge] = useState(String(node.age ?? ''));
  const [editType, setEditType] = useState(node.type);
  const [editDescription, setEditDescription] = useState(node.description ?? '');

  // Sync local state when the selected node changes
  useEffect(() => {
    setEditName(node.name);
    setEditAge(String(node.age ?? ''));
    setEditType(node.type);
    setEditDescription(node.description ?? '');
    setIsEditing(false); // Exit edit mode when node changes
  }, [node]);

  const handleSave = () => {
    if (!activeTree || !editName.trim()) return;
    const ageValue = editAge.trim() === '' ? null : parseInt(editAge, 10);
    void updateNode(activeTree._id, node.id, {
      name: editName.trim(),
      age: isNaN(ageValue as number) ? node.age : ageValue,
      type: editType,
      description: editDescription.trim(),
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (!activeTree) return;
    if (window.confirm(`Ви впевнені, що хочете видалити вузол "${node.name}"? Цю дію неможливо скасувати.`)) {
      void deleteNode(activeTree._id, node.id);
      onClose();
    }
  };

  return (
    <div className="surface-card rounded-[var(--radius-lg)] p-4 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={[
                'px-2 py-0.5 text-[10px] font-heading rounded-full',
                node.type === 'pc'
                  ? 'bg-amber/15 text-amber border border-amber/30'
                  : 'bg-arcane/15 text-arcane-glow border border-arcane/30',
              ].join(' ')}
            >
              {node.type === 'pc' ? 'Гравець' : 'НПС'}
            </span>
            {node.hidden && (
              <span className="px-2 py-0.5 text-[10px] bg-iron/30 text-text-muted rounded-full">
                👁️ Приховано
              </span>
            )}
          </div>
          <h3 className="font-heading text-parchment text-lg">{node.name}</h3>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-full text-ash hover:text-text-primary hover:bg-iron/40 transition-colors cursor-pointer text-xs"
        >
          ✕
        </button>
      </div>

      {isEditing ? (
        // EDITING VIEW
        <div className="flex flex-col gap-3">
          <Input label="Ім'я" value={editName} onChange={(e) => setEditName(e.target.value)} />
          <Input label="Вік" type="number" value={editAge} onChange={(e) => setEditAge(e.target.value)} placeholder="Невідомо" />
          <div>
            <label className="text-xs font-heading font-semibold uppercase tracking-wider text-parchment mb-1.5 block">Тип</label>
            <select value={editType} onChange={(e) => setEditType(e.target.value as 'pc' | 'npc')} className="w-full bg-surface-elevated border border-border-default rounded px-3 py-2 text-text-primary focus:border-amber outline-none">
              <option value="npc">НПС (Неігровий персонаж)</option>
              <option value="pc">Гравець</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-heading font-semibold uppercase tracking-wider text-parchment mb-1.5 block">Опис</label>
            <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={4} className="w-full bg-surface-elevated border border-border-default rounded px-3 py-2 text-text-primary focus:border-amber outline-none" />
          </div>
          <div className="flex gap-2 mt-2">
            <Button size="sm" variant="secondary" onClick={() => setIsEditing(false)} fullWidth>Скасувати</Button>
            <Button size="sm" onClick={handleSave} fullWidth>Зберегти</Button>
          </div>
        </div>
      ) : (
        // DISPLAY VIEW
        <>
          <div className="flex flex-col gap-2 mb-4">
            {node.age !== null && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-text-muted">Вік:</span>
                <span className="text-text-primary font-semibold">{node.age} років</span>
              </div>
            )}
            {node.description && (
              <div className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">
                {node.description}
              </div>
            )}
            {node.parentIds.length > 0 && (
              <div className="text-[10px] text-text-muted">
                Батьків: {node.parentIds.length}
              </div>
            )}
          </div>

          {/* DM Actions */}
          {isDM && (
            <div className="pt-3 border-t border-border-default flex flex-col gap-2">
              {onToggleVisibility && (
                <Button
                  size="sm"
                  variant={node.hidden ? 'primary' : 'secondary'}
                  onClick={onToggleVisibility}
                  fullWidth
                >
                  {node.hidden ? '👁️ Показати гравцям' : '🔒 Приховати від гравців'}
                </Button>
              )}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setIsEditing(true)}
                  fullWidth
                >
                  ✏️ Редагувати
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={handleDelete}
                  fullWidth
                >
                  🗑️ Видалити
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
