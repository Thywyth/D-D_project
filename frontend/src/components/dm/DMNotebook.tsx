import React, { useState, useMemo, useEffect } from 'react';
import { useNotebookStore } from '../../stores/notebookStore';
import { useAuthStore } from '../../stores/authStore';
import { useSessionStore } from '../../stores/sessionStore';
import type { IToDoItem } from '../../../../shared/types';

export function DMNotebook(): React.ReactElement {
  const user = useAuthStore((state) => state.user);
  const currentRoom = useSessionStore((state) => state.currentRoom);

  const {
    dmNotebook,
    fetchNotebook,
    addTodo,
    toggleTodoStatus,
    toggleTodoFavorite,
    deleteTodo,
    isLoading,
  } = useNotebookStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');

  useEffect(() => {
    if (currentRoom && user) {
      void fetchNotebook(currentRoom._id);
    }
  }, [currentRoom, user, fetchNotebook]);

  const filteredTodos = useMemo(() => {
    return dmNotebook
      .filter(todo => (showFavoritesOnly ? todo.isFavorite : true))
      .filter(todo => todo.text.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [dmNotebook, searchQuery, showFavoritesOnly]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskText.trim()) {
      void addTodo(newTaskText.trim());
      setNewTaskText('');
    }
  };

  if (isLoading) {
    return (
      <div className="surface-card rounded-[var(--radius-lg)] p-8 text-center text-text-muted animate-pulse">
        Завантаження завдань...
      </div>
    );
  }

  const ToDoItem = ({ todo }: { todo: IToDoItem }) => (
    <div className="flex items-center gap-3 p-3 border-b border-border-default last:border-b-0 hover:bg-surface-elevated transition-colors">
      <button onClick={() => void toggleTodoStatus(todo.id)} className="text-xl">
        {todo.isCompleted ? '✅' : '⚪️'}
      </button>
      <span className={`flex-1 text-sm ${todo.isCompleted ? 'line-through text-text-muted' : 'text-text-primary'}`}>
        {todo.text}
      </span>
      <button onClick={() => void toggleTodoFavorite(todo.id)} className="text-lg transition-transform hover:scale-125">
        {todo.isFavorite ? '❤️' : '🤍'}
      </button>
      <button onClick={() => void deleteTodo(todo.id)} className="text-ash hover:text-blood transition-colors">
        🗑️
      </button>
    </div>
  );

  return (
    <div className="animate-fade-in-up">
      <div className="surface-card rounded-[var(--radius-lg)] flex flex-col">
        {/* Header with Controls */}
        <div className="sticky top-0 z-10 p-3 border-b border-border-default flex flex-col sm:flex-row items-center gap-3 bg-surface-card/80 backdrop-blur-sm rounded-t-[var(--radius-lg)]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Пошук завдань..."
            className="w-full sm:flex-1 bg-surface-elevated border border-border-default rounded-md px-3 py-2 text-sm text-text-primary focus:border-amber outline-none"
          />
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`px-4 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${
              showFavoritesOnly
                ? 'bg-amber/20 text-amber'
                : 'bg-surface-elevated hover:bg-iron/50 text-text-secondary'
            }`}
          >
            {showFavoritesOnly ? '❤️' : '🤍'}
            <span>Обрані</span>
          </button>
        </div>

        {/* Add Task Form */}
        <form onSubmit={handleAddTask} className="p-3 border-b border-border-default flex gap-3">
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="Нове завдання (напр. 'Підготувати пастку в печері')"
            className="flex-1 bg-surface-elevated border border-border-default rounded-md px-3 py-2 text-sm text-text-primary focus:border-amber outline-none"
          />
          <button type="submit" className="px-4 py-2 bg-amber text-void font-bold rounded-md hover:bg-gold transition-colors">
            Додати
          </button>
        </form>

        {/* To-Do List */}
        <div className="min-h-[300px] max-h-[60vh] overflow-y-auto">
          {filteredTodos.length > 0 ? (
            filteredTodos.map(todo => <ToDoItem key={todo.id} todo={todo} />)
          ) : (
            <div className="p-8 text-center text-text-muted">
              <p className="text-4xl mb-2">🎉</p>
              <p>Немає завдань, що відповідають фільтру.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}