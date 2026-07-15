import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import type { IMapMarker } from '../../../../shared/types/index';
import { useMapStore } from '../../stores/mapStore';
import { useSessionStore } from '../../stores/sessionStore';
import { MapMarker } from './MapMarker';
import { MarkerForm } from './MarkerForm';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface InteractiveMapProps {
  roomId: string;
  canEdit: boolean;
}

export function InteractiveMap({ roomId, canEdit }: InteractiveMapProps): React.ReactElement {
  const markers = useMapStore((s) => s.markers);
  const maps = useMapStore((s) => s.maps);
  const activeMapId = useMapStore((s) => s.activeMapId);
  const setRoomMapData = useMapStore((s) => s.setRoomMapData);
  const addMarker = useMapStore((s) => s.addMarker);
  const removeMarker = useMapStore((s) => s.removeMarker);
  const addMap = useMapStore((s) => s.addMap);
  const setActiveMap = useMapStore((s) => s.setActiveMap);
  const deleteMap = useMapStore((s) => s.deleteMap);

  const currentRoom = useSessionStore((s) => s.currentRoom);

  const activeMap = useMemo(() => maps.find(m => m.id === activeMapId), [maps, activeMapId]);
  const mapImageUrl = activeMap?.imageUrl;

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ mouseX: 0, mouseY: 0, offsetX: 0, offsetY: 0 });
  const [selectedMarker, setSelectedMarker] = useState<IMapMarker | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [tapPosition, setTapPosition] = useState({ x: 0, y: 0 });
  const [isMapManagerOpen, setMapManagerOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  // Sync map data from session store to map store
  useEffect(() => {
    if (currentRoom) {
      setRoomMapData({ maps: currentRoom.maps, activeMapId: currentRoom.activeMapId });
    }
  }, [currentRoom, setRoomMapData]);

  // Pan handlers
  const PAN_SPEED = 10; // МНОЖНИК ЧУТЛИВОСТІ: 2 означає, що карта рухається вдвічі швидше за палець. Можеш поставити 1.5, 2.5 тощо.

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    // Запам'ятовуємо точну позицію кліку та поточний відступ карти
    setDragStart({ 
      mouseX: e.clientX, 
      mouseY: e.clientY, 
      offsetX: offset.x, 
      offsetY: offset.y 
    });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [offset]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    
    // Рахуємо нову позицію: старий відступ + (різниця руху * чутливість)
    setOffset({
      x: dragStart.offsetX + (e.clientX - dragStart.mouseX) * PAN_SPEED,
      y: dragStart.offsetY + (e.clientY - dragStart.mouseY) * PAN_SPEED,
    });
  }, [isDragging, dragStart]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale((prev) => Math.min(3, Math.max(0.5, prev - e.deltaY * 0.001)));
  }, []);

  // Place marker on double-tap/click
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (!canEdit || !imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
    setTapPosition({ x: Math.round(xPercent * 10) / 10, y: Math.round(yPercent * 10) / 10 });
    setShowAddForm(true);
  }, [canEdit]);

  const handleAddMarker = (data: { name: string; description: string; color: string }) => {
    void addMarker(roomId, {
      xPercent: tapPosition.x,
      yPercent: tapPosition.y,
      name: data.name,
      description: data.description,
      color: data.color,
    });
    setShowAddForm(false);
  };

  const MapManager = () => {
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');

    const handleAddMap = () => {
      if (!name.trim() || !url.trim()) return;
      void addMap(roomId, { name, imageUrl: url });
      setName('');
      setUrl('');
    };

    return (
      <Modal isOpen={isMapManagerOpen} onClose={() => setMapManagerOpen(false)} title="Керування картами">
        <div className="flex flex-col gap-4">
          <h4 className="font-heading text-parchment text-sm">Активні карти</h4>
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
            {maps.map(map => (
              <div key={map.id} className={`flex items-center gap-2 p-2 rounded-md ${map.id === activeMapId ? 'bg-amber/10' : 'bg-surface-elevated'}`}>
                <Button size="sm" onClick={() => void setActiveMap(roomId, map.id)} disabled={map.id === activeMapId}>Обрати</Button>
                <span className="flex-1 truncate text-sm text-text-primary">{map.name}</span>
                <Button size="sm" variant="danger" onClick={() => void deleteMap(roomId, map.id)}>✕</Button>
              </div>
            ))}
          </div>
          <div className="border-t border-border-default pt-4 flex flex-col gap-3">
            <h4 className="font-heading text-parchment text-sm">Додати нову карту</h4>
            <Input label="Назва карти" value={name} onChange={e => setName(e.target.value)} placeholder="Ліс Невервінтер" />
            <Input label="URL зображення" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." />
            <Button onClick={handleAddMap}>Додати карту</Button>
          </div>
        </div>
      </Modal>
    );
  };

  return (
    <div className="relative w-full h-full min-h-[400px] overflow-hidden rounded-[var(--radius-lg)] bg-surface border border-border-default">
      {/* Zoom Controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
        <button
          onClick={() => setScale((s) => Math.min(3, s + 0.25))}
          className="w-8 h-8 flex items-center justify-center glass rounded-[var(--radius-sm)] text-text-primary hover:bg-iron/40 transition-colors cursor-pointer text-lg"
        >
          +
        </button>
        <button
          onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
          className="w-8 h-8 flex items-center justify-center glass rounded-[var(--radius-sm)] text-text-primary hover:bg-iron/40 transition-colors cursor-pointer text-lg"
        >
          −
        </button>
        <button
          onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }); }}
          className="w-8 h-8 flex items-center justify-center glass rounded-[var(--radius-sm)] text-text-muted hover:text-text-primary hover:bg-iron/40 transition-colors cursor-pointer text-xs"
          title="Скинути"
        >
          ⟳
        </button>
      </div>

      {/* DM Map Controls */}
      {canEdit && (
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
          <Button size="sm" onClick={() => setMapManagerOpen(true)}>
            🗺️ Карти
          </Button>
        </div>
      )}

      {/* Info hint */}
      {canEdit && (
        <div className="absolute bottom-3 left-3 z-10 px-3 py-1.5 glass rounded-full text-[10px] text-text-muted">
          Подвійний клік — додати маркер
        </div>
      )}

      {/* Pan/Zoom Container */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
      >
        <div
          ref={imageRef}
          className="relative w-full h-full transition-transform"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: 'center center',
          }}
        >
          {mapImageUrl ? (
            <img
              src={mapImageUrl}
              alt="Карта"
              className="w-full h-full object-contain pointer-events-none select-none"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <span className="text-5xl block mb-3">🗺️</span>
                <p className="text-text-muted text-sm">Карту ще не завантажено</p>
              </div>
            </div>
          )}

          {/* Markers */}
          {markers.map((marker) => (
            <MapMarker
              key={marker._id}
              marker={marker}
              isSelected={selectedMarker?._id === marker._id}
              onClick={() => setSelectedMarker(
                selectedMarker?._id === marker._id ? null : marker,
              )}
              onRemove={canEdit ? () => void removeMarker(roomId, marker._id) : undefined}
            />
          ))}
        </div>
      </div>

      {/* Selected Marker Info */}
      {selectedMarker && (
        <div className="absolute bottom-3 right-3 z-10 glass rounded-[var(--radius-lg)] p-3 max-w-[200px] animate-fade-in-up">
          <div className="flex items-start justify-between mb-1">
            <h4 className="font-heading text-parchment text-sm">{selectedMarker.name}</h4>
            <button
              onClick={() => setSelectedMarker(null)}
              className="text-ash hover:text-text-primary text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>
          {selectedMarker.description && (
            <p className="text-[10px] text-text-secondary">{selectedMarker.description}</p>
          )}
        </div>
      )}

      {/* Add Marker Modal */}
      <MarkerForm
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSubmit={handleAddMarker}
        position={tapPosition}
      />

      {canEdit && <MapManager />}
    </div>
  );
}
