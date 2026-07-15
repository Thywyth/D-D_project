/**
 * Tree Store — Family tree state with fog-of-war for players
 */

import { create } from 'zustand';
import { api, APIError } from '../services/api';
import { db, type OfflineFamilyTree } from '../db/dexie';
import type { IFamilyTree } from '../../../shared/types/index';

interface TreeState {
  trees: IFamilyTree[];
  activeTree: IFamilyTree | null;
  isLoading: boolean;
  error: string | null;
}

interface TreeActions {
  fetchTrees: (roomId: string) => Promise<void>;
  fetchTree: (treeId: string) => Promise<void>;
  createTree: (roomId: string, treeName: string) => Promise<string | null>;
  addNode: (treeId: string, node: {
    name: string;
    age: number | null;
    type: 'npc' | 'pc';
    parentIds: string[];
    description?: string;
    posX?: number;
    posY?: number;
  }) => Promise<void>;
  updateNode: (treeId: string, nodeId: string, updates: Record<string, unknown>) => Promise<void>;
  deleteNode: (treeId: string, nodeId: string) => Promise<void>;
  toggleNodeVisibility: (treeId: string, nodeId: string, hidden: boolean) => Promise<void>;
  saveNodeNote: (treeId: string, nodeId: string, content: string) => Promise<void>;
  setActiveTree: (tree: IFamilyTree | null) => void;
  applyTreeUpdate: (tree: IFamilyTree) => void;
  clearError: () => void;
}

export const useTreeStore = create<TreeState & TreeActions>()((set, get) => ({
  // State
  trees: [],
  activeTree: null,
  isLoading: false,
  error: null,

  // Actions
  fetchTrees: async (roomId) => {
    set({ isLoading: true, error: null });
    try {
      const trees = await api.get<IFamilyTree[]>(`/trees/room/${roomId}`);
      set({ trees, isLoading: false });

      for (const tree of trees) {
        await db.familyTrees.put({
          id: tree._id,
          roomId: tree.roomId,
          treeName: tree.treeName,
          nodes: tree.nodes,
          nodeNotes: tree.nodeNotes as OfflineFamilyTree['nodeNotes'],
          updatedAt: tree.updatedAt ?? new Date().toISOString(),
          _syncStatus: 'synced',
        });
      }
    } catch (err: unknown) {
      const cached = await db.familyTrees
        .where('roomId')
        .equals(roomId)
        .toArray();

      if (cached.length > 0) {
        set({
          trees: cached.map((t) => ({
            _id: t.id,
            roomId: t.roomId,
            treeName: t.treeName,
            nodes: t.nodes,
            nodeNotes: t.nodeNotes,
          }) as unknown as IFamilyTree),
          isLoading: false,
          error: 'Завантажено з кешу (офлайн).',
        });
      } else {
        const message =
          err instanceof APIError
            ? (err.data?.error ?? err.message)
            : 'Помилка завантаження родоводів.';
        set({ isLoading: false, error: message });
      }
    }
  },

  fetchTree: async (treeId) => {
    set({ isLoading: true, error: null });
    try {
      const tree = await api.get<IFamilyTree>(`/trees/${treeId}`);
      set({
        activeTree: tree,
        isLoading: false,
        trees: get().trees.map((t) => (t._id === treeId ? tree : t)),
      });
    } catch (err: unknown) {
      const message =
        err instanceof APIError
          ? (err.data?.error ?? err.message)
          : 'Помилка завантаження родоводу.';
      set({ isLoading: false, error: message });
    }
  },

  createTree: async (roomId, treeName) => {
    set({ isLoading: true, error: null });
    try {
      const tree = await api.post<IFamilyTree>('/trees', { roomId, treeName });
      set((state) => ({
        trees: [...state.trees, tree],
        activeTree: tree,
        isLoading: false,
      }));
      return tree._id;
    } catch (err: unknown) {
      const message =
        err instanceof APIError
          ? (err.data?.error ?? err.message)
          : 'Помилка створення родоводу.';
      set({ isLoading: false, error: message });
      return null;
    }
  },

  addNode: async (treeId, node) => {
    try {
      const tree = await api.post<IFamilyTree>(
        `/trees/${treeId}/nodes`,
        node,
      );
      set((state) => ({
        trees: state.trees.map((t) => (t._id === treeId ? tree : t)),
        activeTree: state.activeTree?._id === treeId ? tree : state.activeTree,
      }));
    } catch (err: unknown) {
      const message =
        err instanceof APIError
          ? (err.data?.error ?? err.message)
          : 'Помилка додавання вузла.';
      set({ error: message });
    }
  },

  updateNode: async (treeId, nodeId, updates) => {
    try {
      const tree = await api.patch<IFamilyTree>(
        `/trees/${treeId}/nodes/${nodeId}`,
        updates,
      );
      set((state) => ({
        trees: state.trees.map((t) => (t._id === treeId ? tree : t)),
        activeTree: state.activeTree?._id === treeId ? tree : state.activeTree,
      }));
    } catch (err: unknown) {
      const message =
        err instanceof APIError
          ? (err.data?.error ?? err.message)
          : 'Помилка оновлення вузла.';
      set({ error: message });
    }
  },

  deleteNode: async (treeId, nodeId) => {
    try {
      await api.delete(`/trees/${treeId}/nodes/${nodeId}`);
      // Optimistic removal
      set((state) => {
        const updateTree = (t: IFamilyTree) =>
          t._id === treeId
            ? {
                ...t,
                nodes: t.nodes.filter((n) => n.id !== nodeId),
                nodeNotes: t.nodeNotes.filter((n) => n.nodeId !== nodeId),
              }
            : t;
        return {
          trees: state.trees.map(updateTree),
          activeTree: state.activeTree
            ? updateTree(state.activeTree)
            : null,
        };
      });
    } catch (err: unknown) {
      const message =
        err instanceof APIError
          ? (err.data?.error ?? err.message)
          : 'Помилка видалення вузла.';
      set({ error: message });
    }
  },

  toggleNodeVisibility: async (treeId, nodeId, hidden) => {
    try {
      await api.patch(`/trees/${treeId}/nodes/${nodeId}/visibility`, {
        hidden,
      });
    } catch (err: unknown) {
      const message =
        err instanceof APIError
          ? (err.data?.error ?? err.message)
          : 'Помилка зміни видимості.';
      set({ error: message });
    }
  },

  saveNodeNote: async (treeId, nodeId, content) => {
    try {
      await api.post(`/trees/${treeId}/nodes/${nodeId}/notes`, { content });
    } catch (err: unknown) {
      const message =
        err instanceof APIError
          ? (err.data?.error ?? err.message)
          : 'Помилка збереження нотатки.';
      set({ error: message });
    }
  },

  setActiveTree: (tree) => set({ activeTree: tree }),

  applyTreeUpdate: (tree) =>
    set((state) => ({
      trees: state.trees.map((t) => (t._id === tree._id ? tree : t)),
      activeTree:
        state.activeTree?._id === tree._id ? tree : state.activeTree,
    })),

  clearError: () => set({ error: null }),
}));
