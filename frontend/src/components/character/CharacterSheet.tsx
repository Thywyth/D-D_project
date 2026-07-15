import React from 'react';
/* CharacterSheet types come from sub-components */
import type { IInventoryItem } from '../../../../shared/types/character';
import { useCharacterStore } from '../../stores/characterStore';
import { useRBAC } from '../../hooks/useRBAC';
import { useAuthStore } from '../../stores/authStore';
import { useSessionStore } from '../../stores/sessionStore';
import { CharacterHeader } from './CharacterHeader';
import { StatBlockGrid } from './StatBlockGrid';
import { SkillsPanel } from './SkillsPanel';
import { InventoryPanel } from './InventoryPanel';
import { Tabs, TabPanel } from '../ui/Tabs';

interface CharacterSheetProps {
  characterId: string;
}

const TABS = [
  { id: 'stats', label: 'Статистика', icon: '📊' },
  { id: 'skills', label: 'Навички', icon: '🎯' },
  { id: 'inventory', label: 'Інвентар', icon: '🎒' },
  { id: 'traits', label: 'Риси', icon: '📜' },
];

export function CharacterSheet({ characterId }: CharacterSheetProps): React.ReactElement {
  const characters = useCharacterStore((s) => s.characters);
  const updateCharacter = useCharacterStore((s) => s.updateCharacter);
  // NOTE: The 'transferCoins' action needs to be added to the characterStore as explained in the response.
  const transferCoins = useCharacterStore((s) => s.transferCoins);

  const user = useAuthStore((s) => s.user);
  const currentRoom = useSessionStore((s) => s.currentRoom);
  const [activeTab, setActiveTab] = React.useState('stats');

  const character = characters[characterId];
  const isDM = currentRoom?.dmUserId === user?._id;
  const isOwner = character?.userId === user?._id;

  const { canEdit } = useRBAC({
    role: isDM ? 'dm' : 'player',
    isOwner,
  });

  const availableCharacters = Object.values(characters)
    .filter(c => c._id !== characterId && c.status === 'alive')
    .map(c => ({ id: c._id, name: c.name }));

  const handleAddItem = (newItem: IInventoryItem) => {
    if (!character) return;
    updateCharacter(character._id, { inventory: [...character.inventory, newItem] });
  };

  const handleRemoveItem = (itemId: string) => {
    if (!character) return;
    updateCharacter(character._id, { inventory: character.inventory.filter(i => i.id !== itemId) });
  };

  const handleTransferItem = (itemId: string, targetCharacterId: string, amount: number) => {
    const sourceCharacter = character;
    const targetCharacter = characters[targetCharacterId];
    const sourceItem = sourceCharacter?.inventory.find(i => i.id === itemId);

    if (!sourceCharacter || !targetCharacter || !sourceItem || amount <= 0 || amount > sourceItem.quantity) {
      console.error("Invalid transfer parameters");
      return;
    }

    // 1. Update source character's inventory
    const newSourceInventory = sourceCharacter.inventory
      .map(i => (i.id === itemId ? { ...i, quantity: i.quantity - amount } : i))
      .filter(i => i.quantity > 0);
    updateCharacter(sourceCharacter._id, { inventory: newSourceInventory });

    // 2. Update target character's inventory
    const newTargetInventory = [...targetCharacter.inventory];
    const existingTargetItemIndex = newTargetInventory.findIndex(i => i.name === sourceItem.name);

    if (existingTargetItemIndex > -1) {
      const existingItem = newTargetInventory[existingTargetItemIndex];
      if(existingItem) {
        newTargetInventory[existingTargetItemIndex] = { ...existingItem, quantity: existingItem.quantity + amount };
      }
    } else {
      // Add as a new item stack
      newTargetInventory.push({ ...sourceItem, id: crypto.randomUUID(), quantity: amount });
    }
    updateCharacter(targetCharacterId, { inventory: newTargetInventory });
  };

  const handleTransferCoins = async ({ targetCharacterId, coinType, amount }: { targetCharacterId: string, coinType: 'cp' | 'sp' | 'ep' | 'gp' | 'pp', amount: number }) => {
    if (!character || !transferCoins) return;
    
    // Передаємо 4 окремі аргументи без фігурних дужок всередині
    await transferCoins(
      character._id,
      targetCharacterId,
      coinType,
      amount
    );
  };

  if (!character) {
    return (
      <div className="p-4 text-center animate-fade-in">
        <div className="text-4xl mb-3">🔍</div>
        <p className="text-text-muted text-sm">Персонажа не знайдено</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-in-up">
      <CharacterHeader character={character} />

      {canEdit('currentHP') && (
        <div className="flex items-center gap-4 bg-surface-card p-3 rounded-lg border border-border-default">
          <span className="text-sm font-bold text-parchment">HP: {character.currentHP} / {character.maxHP}</span>
          <button onClick={() => updateCharacter(character._id, { currentHP: Math.max(0, character.currentHP - 1) })} className="px-3 py-1 bg-blood rounded text-white">-1</button>
          <button onClick={() => updateCharacter(character._id, { currentHP: Math.min(character.maxHP, character.currentHP + 1) })} className="px-3 py-1 bg-emerald rounded text-white">+1</button>
        </div>
      )}


      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      <TabPanel isActive={activeTab === 'stats'}>
        <div className="flex flex-col gap-4">
          <StatBlockGrid abilities={character.attributes} />

          {/* Saving Throws */}
          <div className="surface-card rounded-[var(--radius-lg)] p-4">
            <h3 className="font-heading text-parchment text-sm mb-3 flex items-center gap-2">
              <span>🛡️</span> Рятівні кидки
            </h3>
            <div className="grid grid-cols-2 gap-1">
              {(Object.entries(character.savingThrows) as [string, { proficient: boolean; bonus: number }][]).map(
                ([key, st]) => (
                  <div
                    key={key}
                    className={[
                      'flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-sm)] text-xs',
                      st.proficient ? 'bg-amber/5 text-text-primary' : 'text-text-secondary',
                    ].join(' ')}
                  >
                    <div
                      className={[
                        'w-2 h-2 rounded-full',
                        st.proficient ? 'bg-amber' : 'bg-ash/30',
                      ].join(' ')}
                    />
                    <span className="font-mono text-[10px]">{key}</span>
                    <span className="ml-auto font-mono font-semibold">
                      {st.bonus >= 0 ? `+${st.bonus}` : st.bonus}
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>

          {/* Death Saves & Hit Dice */}
          <div className="grid grid-cols-2 gap-3">
            <div className="surface-card rounded-[var(--radius-lg)] p-3">
              <h4 className="font-heading text-parchment text-xs mb-2">💀 Рятівні від смерті</h4>
              <div className="flex flex-col gap-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-emerald">✓</span>
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <button
                        key={i}
                        disabled={!canEdit('deathSaves')}
                        onClick={() => {
                          const newSuccesses = character.deathSaves.successes === i + 1 ? i : i + 1;
                          updateCharacter(character._id, { deathSaves: { ...character.deathSaves, successes: newSuccesses } });
                        }}
                        className={[
                          'w-3.5 h-3.5 rounded-full border',
                          i < character.deathSaves.successes
                            ? 'bg-emerald border-emerald'
                            : 'border-ash',
                          canEdit('deathSaves') ? 'cursor-pointer' : '',
                        ].join(' ')}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-blood">✗</span>
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <button
                        key={i}
                        disabled={!canEdit('deathSaves')}
                        onClick={() => {
                          const newFailures = character.deathSaves.failures === i + 1 ? i : i + 1;
                          updateCharacter(character._id, { deathSaves: { ...character.deathSaves, failures: newFailures } });
                        }}
                        className={[
                          'w-3.5 h-3.5 rounded-full border',
                          i < character.deathSaves.failures
                            ? 'bg-blood border-blood'
                            : 'border-ash',
                          canEdit('deathSaves') ? 'cursor-pointer' : '',
                        ].join(' ')}
                      />
                    ))}
                  </div>
                </div>

              </div>
            </div>

            <div className="surface-card rounded-[var(--radius-lg)] p-3">
              <h4 className="font-heading text-parchment text-xs mb-2">🎲 Кістки здоров'я</h4>
              <div className="text-center">
                <span className="text-lg font-mono font-bold text-text-primary">
                  {character.hitDice.current}
                </span>
                <span className="text-text-muted text-xs">
                  /{character.hitDice.total} {character.hitDice.dieType}
                </span>
              </div>
            </div>
          </div>
        </div>
      </TabPanel>

      <TabPanel isActive={activeTab === 'skills'}>
        <SkillsPanel skills={character.skills} proficiencyBonus={character.proficiencyBonus} />
      </TabPanel>

      <TabPanel isActive={activeTab === 'inventory'}>
        <InventoryPanel
          inventory={character.inventory}
          coins={character.coins}
          canEdit={canEdit('inventory')}
          onUpdateCoins={(newCoins) => updateCharacter(character._id, { coins: newCoins })}
          onAddItem={handleAddItem}
          onRemoveItem={handleRemoveItem}
          onTransferItem={handleTransferItem}
          onTransferCoins={handleTransferCoins}
          availableCharacters={availableCharacters}
        />
      </TabPanel>

      <TabPanel isActive={activeTab === 'traits'}>
        <div className="flex flex-col gap-3">
          {/* Personality */}
          <div className="surface-card rounded-[var(--radius-lg)] p-4">
            <h3 className="font-heading text-parchment text-sm mb-2">🎭 Особистість</h3>
            <div className="flex flex-col gap-2 text-xs text-text-secondary">
              <div>
                <span className="text-parchment-dark font-semibold">Риси: </span>
                {character.personalityTraits || '—'}
              </div>
              <div>
                <span className="text-parchment-dark font-semibold">Ідеали: </span>
                {character.ideals || '—'}
              </div>
              <div>
                <span className="text-parchment-dark font-semibold">Зв'язки: </span>
                {character.bonds || '—'}
              </div>
              <div>
                <span className="text-parchment-dark font-semibold">Вади: </span>
                {character.flaws || '—'}
              </div>
            </div>
          </div>

          {/* Features & Traits */}
          <div className="surface-card rounded-[var(--radius-lg)] p-4">
            <h3 className="font-heading text-parchment text-sm mb-2">⚡ Здібності та риси</h3>
            {character.featuresTraits.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {character.featuresTraits.map((feat: string, i: number) => (
                  <span
                    key={i}
                    className="px-2 py-1 text-xs bg-arcane/10 text-arcane-glow border border-arcane/20 rounded-full"
                  >
                    {feat}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted">Немає здібностей</p>
            )}
          </div>

          {/* Languages & Tool Proficiencies */}
          <div className="grid grid-cols-2 gap-3">
            <div className="surface-card rounded-[var(--radius-lg)] p-3">
              <h4 className="font-heading text-parchment text-xs mb-2">🗣️ Мови</h4>
              <div className="flex flex-wrap gap-1">
                {character.languages.map((lang: string, i: number) => (
                  <span key={i} className="px-2 py-0.5 text-[10px] bg-iron/30 text-text-secondary rounded-full">
                    {lang}
                  </span>
                ))}
              </div>
            </div>
            <div className="surface-card rounded-[var(--radius-lg)] p-3">
              <h4 className="font-heading text-parchment text-xs mb-2">🔧 Інструменти</h4>
              <div className="flex flex-wrap gap-1">
                {character.toolProficiencies.map((tool: string, i: number) => (
                  <span key={i} className="px-2 py-0.5 text-[10px] bg-iron/30 text-text-secondary rounded-full">
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </TabPanel>
    </div>
  );
}
