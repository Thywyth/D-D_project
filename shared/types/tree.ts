/** Family Tree / Lineage types */

export type TreeNodeType = 'npc' | 'pc';

export interface ITreeNode {
  id: string;
  name: string;
  age: number | null;
  type: TreeNodeType;
  parentIds: string[];     // References to parent node IDs within the same tree
  hidden: boolean;         // DM "Fog of War" — hidden from player view
  description: string;
  /** Position on the canvas (for rendering) */
  posX: number;
  posY: number;
}

/** Player-specific private note attached to a tree node */
export interface ITreeNodeNote {
  nodeId: string;
  userId: string;
  content: string;
  updatedAt: string;
}

export interface IFamilyTree {
  _id: string;
  roomId: string;
  treeName: string;
  nodes: ITreeNode[];
  nodeNotes: ITreeNodeNote[];
  createdAt: string;
  updatedAt: string;
}

/** Tree creation payload */
export interface CreateTreePayload {
  roomId: string;
  treeName: string;
}

/** Add node payload */
export interface AddTreeNodePayload {
  treeId: string;
  name: string;
  age: number | null;
  type: TreeNodeType;
  parentIds: string[];
  description?: string;
  posX?: number;
  posY?: number;
}

/** Update node payload */
export interface UpdateTreeNodePayload {
  name?: string;
  age?: number | null;
  type?: TreeNodeType;
  parentIds?: string[];
  hidden?: boolean;
  description?: string;
  posX?: number;
  posY?: number;
}

/** Player note payload */
export interface SaveNodeNotePayload {
  treeId: string;
  nodeId: string;
  content: string;
}
