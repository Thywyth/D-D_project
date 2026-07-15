/** Notebook types (DM Notebook & Player Diary) */

export type NotebookType = 'dm' | 'player';
export interface IToDoItem {
  id: string;
  text: string;
  isCompleted: boolean;
  isFavorite: boolean;
  createdAt: string;
}

export interface INotebook {
  _id: string;
  userId: string;
  roomId: string;
  type: NotebookType;
  title: string;
  content: IToDoItem[];
  createdAt: string;
  updatedAt: string;
}

/** Notebook save payload */
export interface SaveNotebookPayload {
  title: string;
  content: IToDoItem[];
}
