import React, { useState } from 'react';
import { useCharacterStore } from '../../stores/characterStore';
import { api } from '../../services/api';
import { useSessionStore } from '../../stores/sessionStore';
import { showToast } from '../ui/Toast';

interface CreateCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
}

const STATS = [
  { key: 'str', label: 'STR', name: 'Сила' },
  { key: 'dex', label: 'DEX', name: 'Спритність' },
  { key: 'con', label: 'CON', name: 'Статура' },
  { key: 'int', label: 'INT', name: 'Інтелект' },
  { key: 'wis', label: 'WIS', name: 'Мудрість' },
  { key: 'cha', label: 'CHA', name: 'Харизма' },
];

const initialFormData = {
  name: '', race: '', class: '', background: '', alignment: 'Нейтральний', age: '',
  maxHP: 10, armorClass: 10, speed: 30,
  str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
  personalityTraits: '', ideals: '', bonds: '', flaws: ''
};

export function CreateCharacterModal({ isOpen, onClose, roomId }: CreateCharacterModalProps): React.ReactElement | null {
  const fetchCharacters = useCharacterStore((s) => s.fetchCharacters);
  const fetchRoom = useSessionStore((s) => s.fetchRoom);
  const [isLoading, setIsLoading] = useState(false);

  // Стан для всіх полів форми
  const [formData, setFormData] = useState(initialFormData);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Функція для вирахування модифікатора (напр. 16 Сили = +3 модифікатор)
  const calcMod = (score: number | string) => Math.floor((Number(score) - 10) / 2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Форматуємо характеристики під вимоги твоєї бази даних (score та modifier)
    const attributes = {
      STR: { score: Number(formData.str), modifier: calcMod(formData.str) },
      DEX: { score: Number(formData.dex), modifier: calcMod(formData.dex) },
      CON: { score: Number(formData.con), modifier: calcMod(formData.con) },
      INT: { score: Number(formData.int), modifier: calcMod(formData.int) },
      WIS: { score: Number(formData.wis), modifier: calcMod(formData.wis) },
      CHA: { score: Number(formData.cha), modifier: calcMod(formData.cha) },
    };

    try {
      await api.post('/characters', {
        roomId,
        name: formData.name,
        race: formData.race,
        class: formData.class,
        background: formData.background,
        alignment: formData.alignment,
        age: Number(formData.age),
        maxHP: Number(formData.maxHP),
        armorClass: Number(formData.armorClass),
        speed: Number(formData.speed),
        personalityTraits: formData.personalityTraits,
        ideals: formData.ideals,
        bonds: formData.bonds,
        flaws: formData.flaws,
        attributes
      });
      
      await fetchCharacters(roomId);
      await fetchRoom(roomId); // Refresh room to show new player code
      showToast('Персонажа створено! Код згенеровано.', 'success');
      setFormData(initialFormData); // Reset form for next character
    } catch (error) {
      console.error('Помилка створення персонажа:', error);
      showToast('Помилка створення персонажа.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-void/90 backdrop-blur-sm overflow-y-auto">
      <div className="surface-card w-full max-w-2xl rounded-[var(--radius-xl)] p-6 border border-border-default shadow-glow-amber my-auto">
        
        <div className="flex justify-between items-center mb-6 border-b border-border-default pb-3">
          <h2 className="font-heading text-2xl text-parchment flex items-center gap-2">
            <span>⚔️</span> Створення персонажа
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-amber text-xl cursor-pointer">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Базова інформація */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] font-heading text-text-muted uppercase mb-1">Ім'я</label>
              <input required name="name" value={formData.name} onChange={handleChange} className="w-full bg-surface-elevated border border-border-default rounded px-3 py-2 text-text-primary focus:border-amber outline-none" placeholder="Гімлі" />
            </div>
            <div>
              <label className="block text-[10px] font-heading text-text-muted uppercase mb-1">Раса</label>
              <input required name="race" value={formData.race} onChange={handleChange} className="w-full bg-surface-elevated border border-border-default rounded px-3 py-2 text-text-primary focus:border-amber outline-none" placeholder="Дворф" />
            </div>
            <div>
              <label className="block text-[10px] font-heading text-text-muted uppercase mb-1">Клас</label>
              <input required name="class" value={formData.class} onChange={handleChange} className="w-full bg-surface-elevated border border-border-default rounded px-3 py-2 text-text-primary focus:border-amber outline-none" placeholder="Воїн" />
            </div>
            <div>
              <label className="block text-[10px] font-heading text-text-muted uppercase mb-1">Вік</label>
              <input 
                type="number" 
                required 
                min="1" 
                name="age" 
                value={formData.age} 
                onChange={handleChange} 
                className="w-full bg-surface-elevated border border-border-default rounded px-3 py-2 text-text-primary focus:border-amber outline-none" 
                placeholder="25" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-heading text-text-muted uppercase mb-1">Передісторія</label>
              <input required name="background" value={formData.background} onChange={handleChange} className="w-full bg-surface-elevated border border-border-default rounded px-3 py-2 text-text-primary focus:border-amber outline-none" placeholder="Солдат" />
            </div>
            <div>
              <label className="block text-[10px] font-heading text-text-muted uppercase mb-1">Світогляд</label>
              <select name="alignment" value={formData.alignment} onChange={handleChange} className="w-full bg-surface-elevated border border-border-default rounded px-3 py-2 text-text-primary focus:border-amber outline-none">
                <option value="Законно-добрий">Законно-добрий</option>
                <option value="Нейтрально-добрий">Нейтрально-добрий</option>
                <option value="Хаотично-добрий">Хаотично-добрий</option>
                <option value="Законно-нейтральний">Законно-нейтральний</option>
                <option value="Істинно-нейтральний">Істинно-нейтральний</option>
                <option value="Хаотично-нейтральний">Хаотично-нейтральний</option>
                <option value="Законно-злий">Законно-злий</option>
                <option value="Нейтрально-злий">Нейтрально-злий</option>
                <option value="Хаотично-злий">Хаотично-злий</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-heading text-text-muted uppercase mb-1 text-center">ОЗ (Здоров'я)</label>
              <input type="number" required min="1" name="maxHP" value={formData.maxHP} onChange={handleChange} className="w-full bg-void border border-border-default rounded px-3 py-2 text-emerald text-center font-bold focus:border-emerald outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-heading text-text-muted uppercase mb-1 text-center">Клас Броні (КЗ)</label>
              <input type="number" required min="1" name="armorClass" value={formData.armorClass} onChange={handleChange} className="w-full bg-void border border-border-default rounded px-3 py-2 text-amber text-center font-bold focus:border-amber outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-heading text-text-muted uppercase mb-1 text-center">Швидкість</label>
              <input type="number" required min="0" step="5" name="speed" value={formData.speed} onChange={handleChange} className="w-full bg-void border border-border-default rounded px-3 py-2 text-text-primary text-center font-bold focus:border-amber outline-none" />
            </div>
          </div>

          {/* Головні Характеристики */}
          <div>
            <h3 className="text-parchment font-heading text-sm border-b border-border-default pb-2 mb-3">Характеристики</h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {STATS.map(stat => (
                <div key={stat.key} className="flex flex-col items-center bg-surface-elevated p-2 rounded-[var(--radius-md)] border border-border-default">
                  <span className="text-[9px] text-text-muted font-heading uppercase">{stat.name}</span>
                  <span className="text-xs font-bold text-parchment mb-1">{stat.label}</span>
                  <input
                    type="number" required min="1" max="30"
                    name={stat.key} value={formData[stat.key as keyof typeof formData]} onChange={handleChange}
                    className="w-full text-center bg-void border border-border-default rounded text-text-primary py-1 outline-none focus:border-amber"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Personality Traits */}
          <div>
            <h3 className="text-parchment font-heading text-sm border-b border-border-default pb-2 mb-3">Особистість</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-heading text-text-muted uppercase mb-1">Риси характеру</label>
                <textarea name="personalityTraits" value={formData.personalityTraits} onChange={handleChange} rows={3} className="w-full bg-surface-elevated border border-border-default rounded px-3 py-2 text-text-primary focus:border-amber outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-heading text-text-muted uppercase mb-1">Ідеали</label>
                <textarea name="ideals" value={formData.ideals} onChange={handleChange} rows={3} className="w-full bg-surface-elevated border border-border-default rounded px-3 py-2 text-text-primary focus:border-amber outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-heading text-text-muted uppercase mb-1">Прив'язаності</label>
                <textarea name="bonds" value={formData.bonds} onChange={handleChange} rows={3} className="w-full bg-surface-elevated border border-border-default rounded px-3 py-2 text-text-primary focus:border-amber outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-heading text-text-muted uppercase mb-1">Слабкості</label>
                <textarea name="flaws" value={formData.flaws} onChange={handleChange} rows={3} className="w-full bg-surface-elevated border border-border-default rounded px-3 py-2 text-text-primary focus:border-amber outline-none" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="w-full bg-amber text-void font-bold font-heading uppercase py-3 rounded-[var(--radius-md)] hover:bg-gold transition-colors shadow-glow-amber disabled:opacity-50 mt-2 cursor-pointer">
            {isLoading ? 'Створення...' : 'Створити персонажа'}
          </button>
        </form>
      </div>
    </div>
  );
}