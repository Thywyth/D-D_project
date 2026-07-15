import React from 'react';
import type { IMapMarker } from '../../../../shared/types/index';

interface MapMarkerProps {
  marker: IMapMarker;
  isSelected: boolean;
  onClick: () => void;
  onRemove?: () => void;
}

export function MapMarker({
  marker,
  isSelected,
  onClick,
  onRemove,
}: MapMarkerProps): React.ReactElement {
  return (
    <div
      className="absolute group"
      style={{
        left: `${marker.xPercent}%`,
        top: `${marker.yPercent}%`,
        transform: 'translate(-50%, -100%)',
      }}
    >
      {/* Pin */}
      <button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className={[
          'relative flex flex-col items-center cursor-pointer transition-transform',
          isSelected ? 'scale-125 z-10' : 'hover:scale-110',
        ].join(' ')}
      >
        {/* Pin head */}
        <div
          className={[
            'w-5 h-5 rounded-full border-2 border-white/80 shadow-lg transition-shadow',
            isSelected ? 'shadow-[0_0_12px_rgba(245,158,11,0.6)]' : '',
          ].join(' ')}
          style={{ backgroundColor: marker.color || '#f59e0b' }}
        />
        {/* Pin tail */}
        <div
          className="w-0.5 h-2 rounded-b-full"
          style={{ backgroundColor: marker.color || '#f59e0b' }}
        />

        {/* Label */}
        <span className={[
          'absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5',
          'bg-void/90 text-[9px] text-parchment-light rounded whitespace-nowrap',
          'opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none',
          isSelected ? 'opacity-100' : '',
        ].join(' ')}>
          {marker.name}
        </span>
      </button>

      {/* Remove button */}
      {isSelected && onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute -top-2 -right-2 w-4 h-4 flex items-center justify-center bg-blood rounded-full text-white text-[8px] shadow-md cursor-pointer hover:bg-blood/80 transition-colors animate-bounce-in"
        >
          ✕
        </button>
      )}
    </div>
  );
}
