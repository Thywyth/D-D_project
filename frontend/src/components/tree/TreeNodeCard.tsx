import React, { useState } from 'react';
import type { ITreeNode } from '../../../../shared/types/index';
import { useTreeStore } from '../../stores/treeStore'; // Додай цей імпорт

interface TreeNodeCardProps {
  treeId: string; // Додай treeId в пропси
  node: ITreeNode;
  isSelected: boolean;
  isDM: boolean;
  onClick: () => void;
}

export function TreeNodeCard({
  treeId,
  node,
  isSelected,
  isDM,
  onClick,
}: TreeNodeCardProps): React.ReactElement {
  const isHidden = node.hidden && !isDM;
  const updateNode = useTreeStore((s) => s.updateNode);
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isDM) return;
    setIsDragging(true);
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;

    // Множник швидкості: 2.0 означає, що блок рухатиметься вдвічі швидше за курсор.
    // Якщо буде зашвидко — зменш до 1.5, якщо повільно — збільш до 3.0
    const sensitivity = 10.0; 

    updateNode(treeId, node.id, { 
      posX: node.posX + (e.movementX * sensitivity), 
      posY: node.posY + (e.movementY * sensitivity) 
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  if (isHidden) return <></>;

  return (
    <g
      transform={`translate(${node.posX}, ${node.posY})`}
      onClick={onClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={isDM ? "cursor-move" : "cursor-pointer"}
    >
      {/* Node card background */}
      <rect
        x={-60}
        y={-30}
        width={120}
        height={60}
        rx={8}
        ry={8}
        fill={isSelected ? '#2a2a3e' : '#1a1a2e'}
        stroke={
          isSelected
            ? '#f59e0b'
            : node.type === 'pc'
              ? '#d4a574'
              : '#3a3a52'
        }
        strokeWidth={isSelected ? 2 : 1}
        className="transition-all"
      />

      {/* Hidden indicator (DM only) */}
      {node.hidden && isDM && (
        <text
          x={50}
          y={-20}
          textAnchor="middle"
          className="text-[10px]"
          fill="#6b7280"
        >
          👁️‍🗨️
        </text>
      )}

      {/* Type badge */}
      <circle
        cx={-45}
        cy={-15}
        r={8}
        fill={node.type === 'pc' ? '#f59e0b' : '#8b5cf6'}
      />
      <text
        x={-45}
        y={-11}
        textAnchor="middle"
        fill="#0a0a14"
        className="text-[8px] font-bold"
      >
        {node.type === 'pc' ? 'ГР' : 'НП'}
      </text>

      {/* Name */}
      <text
        x={0}
        y={-5}
        textAnchor="middle"
        fill="#d4a574"
        className="text-[11px] font-semibold"
      >
        {node.name.length > 14 ? node.name.substring(0, 13) + '…' : node.name}
      </text>

      {/* Age */}
      {node.age !== null && (
        <text
          x={0}
          y={12}
          textAnchor="middle"
          fill="#9ca3af"
          className="text-[9px]"
        >
          {node.age} років
        </text>
      )}

      {/* Selection glow */}
      {isSelected && (
        <rect
          x={-62}
          y={-32}
          width={124}
          height={64}
          rx={10}
          ry={10}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={1}
          opacity={0.3}
        />
      )}
    </g>
  );
}
