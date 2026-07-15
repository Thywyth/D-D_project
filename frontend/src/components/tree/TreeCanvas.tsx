import React, { useState, useRef, useCallback, useMemo } from 'react';
import type { IFamilyTree, ITreeNode } from '../../../../shared/types/index';
import { TreeNodeCard } from './TreeNodeCard';
import { useTreeStore } from '../../stores/treeStore';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { showToast } from '../ui/Toast';

interface TreeCanvasProps {
  tree: IFamilyTree;
  isDM: boolean;
  onNodeSelect: (node: ITreeNode | null) => void;
  selectedNodeId: string | null;
}

export function TreeCanvas({
  tree,
  isDM,
  onNodeSelect,
  selectedNodeId,
}: TreeCanvasProps): React.ReactElement {
  const [viewBox, setViewBox] = useState({ x: -200, y: -100, w: 800, h: 600 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isAddNodeModalOpen, setIsAddNodeModalOpen] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const addNode = useTreeStore((s) => s.addNode);

  const visibleNodes = isDM
    ? tree.nodes
    : tree.nodes.filter((n) => !n.hidden);

  const sortedNodes = useMemo(() => [...visibleNodes].sort((a, b) => a.name.localeCompare(b.name)), [visibleNodes]);

  // Build parent→child edge map
  const edges: { from: ITreeNode; to: ITreeNode }[] = [];
  for (const node of visibleNodes) {
    for (const parentId of node.parentIds) {
      const parent = visibleNodes.find((n) => n.id === parentId);
      if (parent) {
        edges.push({ from: parent, to: node });
      }
    }
  }

  // Pan handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as Element).closest('g')) return; // Don't pan when clicking nodes
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanning) return;
    const dx = (e.clientX - panStart.x) * (viewBox.w / (svgRef.current?.clientWidth || 800));
    const dy = (e.clientY - panStart.y) * (viewBox.h / (svgRef.current?.clientHeight || 600));
    setViewBox((v) => ({ ...v, x: v.x - dx, y: v.y - dy }));
    setPanStart({ x: e.clientX, y: e.clientY });
  }, [isPanning, panStart, viewBox]);

  const handlePointerUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.1 : 0.9;
    setViewBox((v) => ({
      x: v.x + (v.w * (1 - factor)) / 2,
      y: v.y + (v.h * (1 - factor)) / 2,
      w: v.w * factor,
      h: v.h * factor,
    }));
  }, []);

  const AddNodeModal = () => {
    const [name, setName] = useState('');
    const [type, setType] = useState<'pc' | 'npc'>('npc');
    const [age, setAge] = useState<number | ''>('');
    const [parentIds, setParentIds] = useState<string[]>([]);

    const handleSubmit = () => {
      if (!name.trim()) {
        showToast('Ім\'я вузла не може бути порожнім.', 'error');
        return;
      }
      if (age === '') {
        showToast('Вік персонажа є обов\'язковим.', 'error');
        return;
      }
      // A simple heuristic to place the new node near the center of the current view
      const posX = viewBox.x + viewBox.w / 2 + (Math.random() * 100 - 50);
      const posY = viewBox.y + viewBox.h / 2 + (Math.random() * 100 - 50);

      addNode(tree._id, { name, type, parentIds, posX, posY, age: Number(age) });
      setIsAddNodeModalOpen(false);
      showToast(`Вузол "${name}" створено!`, 'success');
    };

    return (
      <Modal isOpen={isAddNodeModalOpen} onClose={() => setIsAddNodeModalOpen(false)} title="Додати вузол">
        <div className="flex flex-col gap-4">
          <Input label="Ім'я" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input
            label="Вік (років)"
            type="number"
            value={age.toString()}
            onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
            required
          />
          <div>
            <label className="text-xs font-heading font-semibold uppercase tracking-wider text-parchment mb-1.5 block">Тип</label>
            <select value={type} onChange={(e) => setType(e.target.value as 'pc' | 'npc')} className="w-full bg-surface-elevated border border-border-default rounded px-3 py-2 text-text-primary focus:border-amber outline-none">
              <option value="npc">НПС (Неігровий персонаж)</option>
              <option value="pc">Гравець</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-heading font-semibold uppercase tracking-wider text-parchment mb-1.5 block">Батьки (опціонально)</label>
            <select multiple value={parentIds} onChange={(e) => setParentIds(Array.from(e.target.selectedOptions, option => option.value))} className="w-full h-32 bg-surface-elevated border border-border-default rounded px-3 py-2 text-text-primary focus:border-amber outline-none">
              {sortedNodes.map(node => (
                <option key={node.id} value={node.id}>{node.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 mt-2">
            <Button type="button" variant="secondary" onClick={() => setIsAddNodeModalOpen(false)} fullWidth>Скасувати</Button>
            <Button onClick={handleSubmit} fullWidth>Додати</Button>
          </div>
        </div>
      </Modal>
    );
  };

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-[var(--radius-lg)] overflow-hidden bg-surface border border-border-default">
      {/* Title */}
      <div className="absolute top-3 left-3 z-10 glass rounded-[var(--radius-md)] px-3 py-1.5">
        <h3 className="font-heading text-parchment text-sm">
          🌳 {tree.treeName}
        </h3>
        <p className="text-[10px] text-text-muted">
          {visibleNodes.length} вузлів
        </p>
      </div>

      {/* DM Controls */}
      {isDM && (
        <div className="absolute top-3 right-3 z-10">
          <Button size="sm" onClick={() => setIsAddNodeModalOpen(true)}>
            ➕ Додати вузол
          </Button>
        </div>
      )}

      <svg
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
      >
        {/* Grid */}
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path
              d="M 50 0 L 0 0 0 50"
              fill="none"
              stroke="rgba(42,42,62,0.5)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect
          x={viewBox.x}
          y={viewBox.y}
          width={viewBox.w}
          height={viewBox.h}
          fill="url(#grid)"
        />

        {/* Edges (bezier curves) */}
        {edges.map((edge, i) => {
          const midY = (edge.from.posY + edge.to.posY) / 2;
          return (
            <path
              key={`edge-${i}`}
              d={`M ${edge.from.posX} ${edge.from.posY + 30}
                  C ${edge.from.posX} ${midY},
                    ${edge.to.posX} ${midY},
                    ${edge.to.posX} ${edge.to.posY - 30}`}
              fill="none"
              stroke={selectedNodeId === edge.from.id || selectedNodeId === edge.to.id
                ? '#f59e0b'
                : '#3a3a52'
              }
              strokeWidth={selectedNodeId === edge.from.id || selectedNodeId === edge.to.id ? 2 : 1}
              strokeDasharray={edge.to.hidden && isDM ? '4 4' : undefined}
              className="transition-all"
            />
          );
        })}

        {/* Nodes */}
        {visibleNodes.map((node) => (
          <TreeNodeCard
            key={node.id}
            treeId={tree._id}
            node={node}
            isDM={isDM}
            isSelected={selectedNodeId === node.id}
            onClick={() => onNodeSelect(
              selectedNodeId === node.id ? null : node,
            )}
          />
        ))}
      </svg>

      {isDM && <AddNodeModal />}
    </div>
  );
}
