import React, { useState, useRef, useEffect } from 'react';
import { useAudioStore, AUDIO_PRESETS } from '../../stores/audioStore';
import { useSessionStore } from '../../stores/sessionStore';
import { socketService } from '../../services/socket';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { showToast } from '../ui/Toast';

// SFX presets with Ukrainian labels
const SFX_PRESETS = [
  { key: 'dragon_roar', name: 'Рев дракона', icon: '🐉', url: '/audio/effects/dragon-roar.wav' },
  { key: 'sword_clash', name: 'Зіткнення мечів', icon: '⚔️', url: '/audio/effects/sword-01.wav' },
  { key: 'thunder', name: 'Грім', icon: '⚡', url: '/audio/effects/thunder.wav' },
  { key: 'magic_cast', name: 'Заклинання', icon: '✨', url: '/audio/effects/magic-spell.wav' },
  { key: 'door_open', name: 'Двері', icon: '🚪', url: '/audio/effects/door-knocking.wav' },
  { key: 'explosion', name: 'Вибух', icon: '💥', url: '/audio/effects/explosion_01.wav' },
  { key: 'healing', name: 'Зцілення', icon: '💚', url: '/audio/effects/health-pickup.wav' },
  { key: 'death', name: 'Смерть', icon: '💀', url: '/audio/effects/death.wav' },
  { key: 'coins', name: 'Монети', icon: '🪙', url: '/audio/effects/coin-dropping.wav' },
  { key: 'bell', name: 'Дзвін', icon: '🔔', url: '/audio/effects/door_bell.wav' },
  { key: 'scream', name: 'Крик', icon: '😱', url: '/audio/effects/scream.mp3' },
  { key: 'footsteps', name: 'Кроки', icon: '👣', url: '/audio/effects/footsteps-1.wav' },
  { key: 'fireball', name: 'Файрбол', icon: '🔥', url: '/audio/effects/fireball-skill.wav' }
];

export function AudioMixer(): React.ReactElement {
  const currentPreset = useAudioStore((s) => s.currentPreset);
  const volume = useAudioStore((s) => s.volume);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const setPlaying = useAudioStore((s) => s.setPlaying);
  const setStopped = useAudioStore((s) => s.setStopped);
  const setVolume = useAudioStore((s) => s.setVolume);
  const triggerSfx = useAudioStore((s) => s.triggerSfx);
  const currentRoom = useSessionStore((s) => s.currentRoom);

  const [customUrl, setCustomUrl] = useState('');
  const [sfxFlash, setSfxFlash] = useState<string | null>(null);

  // Web Audio ref
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Volume sync — keep audio element volume in sync with store
  useEffect(() => {
    if (audioElementRef.current) {
      audioElementRef.current.volume = volume;
    }
  }, [volume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioElementRef.current?.pause();
    };
  }, []);

  const playAudioFromUrl = (url: string) => {
    // Stop any existing audio
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.src = '';
      audioElementRef.current = null;
    }
    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = volume;
    audioElementRef.current = audio;
    audio.play().catch((err) => {
      console.error('Audio playback failed:', err);
      showToast('Не вдалося відтворити аудіо. Натисніть будь-де для розблокування.', 'error');
    });
  };

  const handlePlayAmbient = (presetKey: string) => {
    // Socket.IO broadcast to all room clients
    const socket = socketService.instance;
    if (socket?.connected && currentRoom) {
      socket.emit('audio:play-ambient', {
        roomId: currentRoom._id,
        preset: presetKey,
        volume,
      });
    }

    // Local playback — look up the preset URL
    const preset = AUDIO_PRESETS.find((p) => p.key === presetKey);
    if (preset?.url) {
      playAudioFromUrl(preset.url);
    }

    // Optimistic state update
    setPlaying(presetKey, volume);
  };

  const handleStopAmbient = () => {
    const socket = socketService.instance;
    if (socket?.connected && currentRoom) {
      socket.emit('audio:stop-ambient', { roomId: currentRoom._id });
    }
    setStopped();
    audioElementRef.current?.pause();
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    const socket = socketService.instance;
    if (socket?.connected && currentRoom) {
      socket.emit('audio:set-ambient-volume', {
        roomId: currentRoom._id,
        volume: newVolume,
      });
    }
  };

  const handleTriggerSfx = (sfxKey: string) => {
    const socket = socketService.instance;
    if (socket?.connected && currentRoom) {
      socket.emit('audio:trigger-sfx', {
        roomId: currentRoom._id,
        preset: sfxKey,
        volume,
      });
    }

    const sfxObj = SFX_PRESETS.find(s => s.key === sfxKey);
    if (sfxObj?.url) {
      const audio = new Audio(sfxObj.url);
      audio.volume = 0.8;
      audio.play().catch(err => console.error(`Failed to play SFX: ${sfxKey}`, err));
    }

    triggerSfx(sfxKey);
    setSfxFlash(sfxKey);
    setTimeout(() => setSfxFlash(null), 300);
  };

  const handlePlayCustomUrl = () => {
    const url = customUrl.trim();
    if (!url) return;

    // Socket.IO broadcast
    const socket = socketService.instance;
    if (socket?.connected && currentRoom) {
      socket.emit('audio:play-ambient', {
        roomId: currentRoom._id,
        preset: url,
        volume,
      });
    }

    // Local playback from custom URL
    playAudioFromUrl(url);
    setPlaying(url, volume);
    showToast('Зовнішній трек запущено', 'info');
  };

  const activePresetName = AUDIO_PRESETS.find((p) => p.key === currentPreset)?.name || currentPreset;

  return (
    <div className="flex flex-col gap-5 animate-fade-in-up">
      {/* ── Channel 1: Ambient ── */}
      <div className="surface-card rounded-[var(--radius-lg)] p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading text-parchment text-sm flex items-center gap-2">
            <span>🎵</span> Амбієнт
          </h3>
          {isPlaying && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
              <span className="text-[10px] text-emerald">{activePresetName}</span>
            </div>
          )}
        </div>

        {/* Preset Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
          {AUDIO_PRESETS.map((preset) => (
            <button
              key={preset.key}
              onClick={() => handlePlayAmbient(preset.key)}
              className={[
                'px-3 py-2 rounded-[var(--radius-md)] text-xs font-medium',
                'transition-all cursor-pointer',
                currentPreset === preset.key
                  ? 'bg-amber/15 text-amber border border-amber/30 shadow-glow-amber'
                  : 'bg-surface-elevated text-text-secondary hover:text-text-primary hover:bg-iron/40',
              ].join(' ')}
            >
              {preset.name}
            </button>
          ))}
        </div>

        {/* Volume Slider */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs text-text-muted">🔇</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="flex-1 h-1.5 rounded-full appearance-none bg-iron cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber [&::-webkit-slider-thumb]:shadow-md
              [&::-webkit-slider-thumb]:cursor-pointer"
          />
          <span className="text-xs text-text-muted">🔊</span>
          <span className="text-xs font-mono text-text-secondary w-8 text-right">
            {Math.round(volume * 100)}%
          </span>
        </div>

        {/* Custom URL */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://example.com/audio.mp3"
              icon={<span>🔗</span>}
            />
          </div>
          <Button size="md" variant="secondary" onClick={handlePlayCustomUrl} className="flex-shrink-0">
            ▶
          </Button>
        </div>

        {/* Stop Button */}
        {isPlaying && (
          <Button
            variant="danger"
            size="sm"
            onClick={handleStopAmbient}
            fullWidth
            className="mt-3"
          >
            ⏹ Зупинити
          </Button>
        )}
      </div>

      {/* ── Channel 2: SFX ── */}
      <div className="surface-card rounded-[var(--radius-lg)] p-4">
        <h3 className="font-heading text-parchment text-sm mb-3 flex items-center gap-2">
          <span>💥</span> Звукові ефекти
        </h3>
        <p className="text-[10px] text-text-muted mb-3">
          Одноразові звуки, що накладаються поверх амбієнту
        </p>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {SFX_PRESETS.map((sfx) => (
            <button
              key={sfx.key}
              onClick={() => handleTriggerSfx(sfx.key)}
              className={[
                'flex flex-col items-center gap-1 px-2 py-3 rounded-[var(--radius-md)]',
                'bg-surface-elevated text-text-secondary',
                'hover:bg-iron/40 hover:text-text-primary',
                'active:scale-90 transition-all cursor-pointer',
                sfxFlash === sfx.key ? 'ring-2 ring-amber shadow-glow-amber scale-95' : '',
              ].join(' ')}
            >
              <span className="text-xl">{sfx.icon}</span>
              <span className="text-[9px] text-center leading-tight">{sfx.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
