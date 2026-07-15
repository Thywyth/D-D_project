import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useNotebookStore } from '../../stores/notebookStore';
import { useAuthStore } from '../../stores/authStore';
import { useSessionStore } from '../../stores/sessionStore';

interface ToolbarButtonProps {
  onClick: () => void;
  isActive: boolean;
  children: React.ReactNode;
}

const ToolbarButton = ({ onClick, isActive, children }: ToolbarButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-2.5 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${
      isActive
        ? 'bg-amber/20 text-amber'
        : 'bg-surface-elevated hover:bg-iron/50 text-text-secondary'
    }`}
  >
    {children}
  </button>
);

export function PlayerNotebook(): React.ReactElement {
  const user = useAuthStore((s) => s.user);
  const currentRoom = useSessionStore((s) => s.currentRoom);
  const playerNotebook = useNotebookStore((s) => s.playerNotebook);
  const playerNotebookId = useNotebookStore((s) => s.playerNotebookId);
  const fetchNotebook = useNotebookStore((s) => s.fetchNotebook);
  const updateNotebook = useNotebookStore((s) => s.updateNotebook);
  const isLoading = useNotebookStore((s) => s.isLoading);

  // Auto-save timer ref
  const saveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
    ],
    // Player notebook content is IToDoItem[] in the store, but here we use Tiptap
    // for rich text. We convert to/from Tiptap JSON doc format.
    content: '',
    editorProps: {
      attributes: {
        class:
          'prose prose-sm prose-invert max-w-none focus:outline-none p-4 bg-surface-card rounded-b-[var(--radius-lg)] min-h-[300px]',
      },
    },
    onUpdate: ({ editor: ed }) => {
      // Debounced auto-save (1.5s after last keystroke)
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        if (playerNotebookId) {
          const json = ed.getJSON();
          // Store the Tiptap JSON as a single IToDoItem wrapping the content
          void updateNotebook(playerNotebookId, [{
            id: 'tiptap-content',
            text: JSON.stringify(json),
            isCompleted: false,
            isFavorite: false,
            createdAt: new Date().toISOString(),
          }]);
        }
      }, 1500);
    },
  });

  // Fetch on mount
  useEffect(() => {
    if (currentRoom && user) {
      void fetchNotebook(currentRoom._id);
    }
  }, [currentRoom, user, fetchNotebook]);

  // Load content from store into editor
  useEffect(() => {
    if (editor && playerNotebook.length > 0 && !editor.isFocused) {
      const first = playerNotebook[0];
      if (first && first.id === 'tiptap-content') {
        try {
          const parsed = JSON.parse(first.text) as Record<string, unknown>;
          editor.commands.setContent(parsed);
        } catch {
          // Fallback: render as plain text
          editor.commands.setContent(`<p>${first.text}</p>`);
        }
      }
    }
  }, [playerNotebook, editor]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="surface-card rounded-[var(--radius-lg)] p-8 text-center animate-fade-in">
        <div className="text-3xl mb-2 animate-float">📝</div>
        <p className="text-text-muted text-sm">Завантаження нотатника...</p>
      </div>
    );
  }

  return (
    <div className="surface-card rounded-[var(--radius-lg)] overflow-hidden animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
        <h3 className="font-heading text-parchment text-sm flex items-center gap-2">
          <span>📝</span> Нотатник гравця
        </h3>
        <span className="text-[9px] text-text-muted">Автозбереження</span>
      </div>

      {/* Toolbar */}
      {editor && (
        <div className="flex flex-wrap gap-1 px-4 py-2 border-b border-border-default bg-surface-elevated/30">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
          >
            <strong>Ж</strong>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
          >
            <em>К</em>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
          >
            Н2
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
          >
            Н3
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
          >
            • Список
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
          >
            1. Список
          </ToolbarButton>
        </div>
      )}

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}