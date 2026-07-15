import { create } from 'zustand';
import { api } from '../services/api';
import type { INotebook, IToDoItem } from '../../../shared/types';

export interface NotebookState {
  dmNotebook: IToDoItem[];
  playerNotebook: IToDoItem[];
  dmNotebookId: string | null;
  playerNotebookId: string | null;
  isLoading: boolean;
  fetchNotebook: (roomId: string) => Promise<void>;
  updateNotebook: (notebookId: string, content: IToDoItem[]) => Promise<void>;
  // New actions for To-Do list
  addTodo: (text: string) => Promise<void>;
  toggleTodoStatus: (todoId: string) => Promise<void>;
  toggleTodoFavorite: (todoId: string) => Promise<void>;
  deleteTodo: (todoId: string) => Promise<void>;
}

export const useNotebookStore = create<NotebookState>((set, get) => ({
  dmNotebook: [],
  playerNotebook: [],
  dmNotebookId: null,
  playerNotebookId: null,
  isLoading: false,

  fetchNotebook: async (roomId) => {
    set({ isLoading: true });
    try {
      const notebooks = await api.get<INotebook[]>(`/notebooks/room/${roomId}`);
      const dmNotebook = notebooks.find(n => n.type === 'dm');
      const playerNotebook = notebooks.find(n => n.type === 'player');
      set({
        dmNotebook: dmNotebook ? dmNotebook.content : [],
        playerNotebook: playerNotebook ? playerNotebook.content : [],
        dmNotebookId: dmNotebook ? dmNotebook._id : null,
        playerNotebookId: playerNotebook ? playerNotebook._id : null,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to fetch notebooks", error);
      set({ isLoading: false });
    }
  },

  updateNotebook: async (notebookId, content) => {
    try {
      await api.patch(`/notebooks/${notebookId}`, { content });
    } catch (error) {
      console.error("Failed to sync notebook", error);
      // In a real app, you might want to revert the state here
    }
  },

  addTodo: async (text) => {
    const { dmNotebook, dmNotebookId, updateNotebook } = get();
    if (!dmNotebookId) return;

    const newTodo: IToDoItem = { 
      id: crypto.randomUUID(),
      text,
      isCompleted: false,
      isFavorite: false,
      createdAt: new Date().toISOString(),
    };

    const updatedContent = [newTodo, ...dmNotebook];
    set({ dmNotebook: updatedContent }); // Optimistic update
    await updateNotebook(dmNotebookId, updatedContent);
  },

  toggleTodoStatus: async (todoId) => {
    const { dmNotebook, dmNotebookId, updateNotebook } = get();
    if (!dmNotebookId) return;

    const updatedContent = dmNotebook.map(todo =>
      todo.id === todoId ? { ...todo, isCompleted: !todo.isCompleted } : todo
    );

    set({ dmNotebook: updatedContent });
    await updateNotebook(dmNotebookId, updatedContent);
  },

  toggleTodoFavorite: async (todoId) => {
    const { dmNotebook, dmNotebookId, updateNotebook } = get();
    if (!dmNotebookId) return;

    const updatedContent = dmNotebook.map(todo =>
      todo.id === todoId ? { ...todo, isFavorite: !todo.isFavorite } : todo
    );

    set({ dmNotebook: updatedContent });
    await updateNotebook(dmNotebookId, updatedContent);
  },

  deleteTodo: async (todoId) => {
    const { dmNotebook, dmNotebookId, updateNotebook } = get();
    if (!dmNotebookId) return;

    const updatedContent = dmNotebook.filter(todo => todo.id !== todoId);

    set({ dmNotebook: updatedContent });
    await updateNotebook(dmNotebookId, updatedContent);
  },
}));