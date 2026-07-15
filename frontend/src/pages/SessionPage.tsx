import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { TabPanel } from '../components/ui/Tabs';
import { CharacterSheet } from '../components/character/CharacterSheet';
import { InteractiveMap } from '../components/map/InteractiveMap';
import { TreeCanvas } from '../components/tree/TreeCanvas';
import { NodeDetail } from '../components/tree/NodeDetail';
import { DMDashboard } from '../components/dm/DMDashboard';
import { AudioMixer } from '../components/dm/AudioMixer';
import { TimeController } from '../components/dm/TimeController';
import { DMNotebook } from '../components/dm/DMNotebook';
import { PlayerNotebook } from '../components/dm/PlayerNotebook';
import { useSessionStore } from '../stores/sessionStore';
import { useCharacterStore } from '../stores/characterStore';
import { useMapStore } from '../stores/mapStore';
import { useTreeStore } from '../stores/treeStore';
import { useAuthStore } from '../stores/authStore';
import { useNotebookStore } from '../stores/notebookStore';
import type { ITreeNode } from '../../../shared/types/index';

type TabId = 'dm-panel' | 'character' | 'map' | 'tree' | 'notebook';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

const SESSION_TABS: Tab[] = [
  { id: 'character', label: 'Персонаж', icon: '⚔️' },
  { id: 'map', label: 'Карта', icon: '🗺️' },
  { id: 'tree', label: 'Родовід', icon: '🌳' },
  { id: 'notebook', label: 'Нотатки', icon: '📝' },
];

const DM_TABS: Tab[] = [
  { id: 'dm-panel', label: 'DM Панель', icon: '👑' },
];

export default function SessionPage(): React.ReactElement {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>('character');
  const [selectedTreeNode, setSelectedTreeNode] = useState<ITreeNode | null>(null);
  const [isCreateTreeModalOpen, setIsCreateTreeModalOpen] = useState(false);
  const [newTreeName, setNewTreeName] = useState('');
  
  const user = useAuthStore((state) => state.user);
  const currentRoom = useSessionStore((state) => state.currentRoom);
  const fetchRoom = useSessionStore((state) => state.fetchRoom);
  const characters = useCharacterStore((state) => state.characters);
  const fetchCharacters = useCharacterStore((state) => state.fetchCharacters);
  const fetchMarkers = useMapStore((state) => state.fetchMarkers);
  const trees = useTreeStore((state) => state.trees);
  const activeTree = useTreeStore((state) => state.activeTree);
  const fetchNotebook = useNotebookStore((state) => state.fetchNotebook);
  const fetchTrees = useTreeStore((state) => state.fetchTrees);
  const fetchTree = useTreeStore((state) => state.fetchTree);
  const createTree = useTreeStore((state) => state.createTree);
  const toggleNodeVisibility = useTreeStore((state) => state.toggleNodeVisibility);

  const isDM = currentRoom?.dmUserId === user?._id;

  // Шукаємо персонажа, який належить поточному юзеру (включаючи Майстра)
  const myCharacterId = Object.keys(characters).find(
    (id) => characters[id]?.userId === user?._id,
  );

  const handleCreateTree = async () => {
    if (!newTreeName.trim() || !roomId) return;
    await createTree(roomId, newTreeName);
    setIsCreateTreeModalOpen(false);
    setNewTreeName('');
  };

 
  // Fetch data on mount
  useEffect(() => {
    if (!roomId) return;

    void fetchRoom(roomId);
    void fetchCharacters(roomId);
    void fetchMarkers(roomId);
    void fetchTrees(roomId);
    if (user) {
      void fetchNotebook(roomId);
    }
  }, [roomId, user, isDM, fetchCharacters, fetchMarkers, fetchTrees, fetchNotebook, fetchRoom]);

  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabId;
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Set default tab for DM
  useEffect(() => {
    if (isDM) setActiveTab('dm-panel');
  }, [isDM]);

  // Load first tree
  useEffect(() => {
    if (trees.length > 0 && !activeTree && trees[0]) {
      void fetchTree(trees[0]._id);
    }
  }, [trees, activeTree, fetchTree]);

  if (!roomId) {
    return (
      <AppShell>
        <div className="p-4 text-center">
          <p className="text-text-muted">Кімнату не знайдено</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col h-full">
        <div className="px-4 pt-2 border-b border-border-default">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {(isDM ? [...DM_TABS, ...SESSION_TABS] : SESSION_TABS).map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchParams({ tab: tab.id });
                }}
                className={`flex-shrink-0 px-3 py-2.5 text-sm font-medium flex items-center gap-2 rounded-t-md border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-amber text-amber'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Character Tab */}
          <TabPanel isActive={activeTab === 'character'}>
            {myCharacterId ? (
              <CharacterSheet characterId={myCharacterId} />
            ) : (
              <div className="surface-card rounded-[var(--radius-xl)] p-8 text-center animate-fade-in">
                <div className="text-5xl mb-4">⚔️</div>
                <h2 className="font-heading text-xl text-parchment mb-2">
                  Персонаж не призначений
                </h2>
                <p className="text-sm text-text-muted max-w-xs mx-auto mb-6">
                  {isDM
                    ? 'Як DM, ви можете створити персонажів для цієї сесії.'
                    : 'Зверніться до Данжн Майстра для призначення персонажа.'}
                </p>
              </div>
            )}
          </TabPanel>

          {/* Map Tab */}
          <TabPanel isActive={activeTab === 'map'}>
            <div className="h-[calc(100dvh-14rem)]">
              <InteractiveMap roomId={roomId} canEdit={isDM} />
            </div>
          </TabPanel>

          {/* Tree Tab */}
          <TabPanel isActive={activeTab === 'tree'}>
            {activeTree ? (
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 h-[calc(100dvh-14rem)]">
                  <TreeCanvas
                    tree={activeTree}
                    isDM={isDM}
                    selectedNodeId={selectedTreeNode?.id ?? null}
                    onNodeSelect={setSelectedTreeNode}
                  />
                </div>
                {selectedTreeNode && (
                  <div className="lg:w-72">
                    <NodeDetail
                      node={selectedTreeNode}
                      isDM={isDM}
                      onClose={() => setSelectedTreeNode(null)}
                      onToggleVisibility={
                        isDM
                          ? () =>
                              void toggleNodeVisibility(
                                activeTree._id,
                                selectedTreeNode.id,
                                !selectedTreeNode.hidden,
                              )
                          : undefined
                      }
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="surface-card rounded-[var(--radius-xl)] p-8 text-center animate-fade-in">
                <div className="text-5xl mb-4 animate-float">🌳</div>
                <h2 className="font-heading text-xl text-parchment mb-2">
                  Родовідне дерево
                </h2>
                <p className="text-sm text-text-muted">
                  {trees.length === 0
                    ? 'Ще немає родоводів для цієї сесії.'
                    : 'Завантаження...'}
                </p>
                {isDM && (
                  <div className="mt-6">
                    <Button onClick={() => setIsCreateTreeModalOpen(true)}>
                      ➕ Створити родовід
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabPanel>

          {/* Notebook Tab */}
          <TabPanel isActive={activeTab === 'notebook'}>
            {isDM ? <DMNotebook /> : <PlayerNotebook />}
          </TabPanel>

          {/* DM Panel Tab */}
          {isDM && (
            <TabPanel isActive={activeTab === 'dm-panel'}>
              <div className="flex flex-col gap-6">
                <DMDashboard />
                <TimeController />
                <AudioMixer />
              </div>
            </TabPanel>
          )}
        </div>
      </div>
      <Modal
        isOpen={isCreateTreeModalOpen}
        onClose={() => setIsCreateTreeModalOpen(false)}
        title="Створити родовід"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Назва родоводу (напр. 'Дім Дракона')"
            value={newTreeName}
            onChange={(e) => setNewTreeName(e.target.value)}
            autoFocus
          />
          <Button onClick={handleCreateTree} fullWidth>Створити</Button>
        </div>
      </Modal>
    </AppShell>
  );
}