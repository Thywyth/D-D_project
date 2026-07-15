/**
 * Family Tree Controller — CRUD for trees and nodes, visibility toggle
 */

import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { FamilyTree } from '../models/FamilyTree.js';
import { getUserRoleInRoom } from '../middleware/rbac.js';

/** POST /api/trees — Create a new family tree (DM only) */
export async function createTree(req: Request, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Не авторизовано.' }); return; }

  const { roomId, treeName } = req.body as { roomId?: string; treeName?: string };
  if (!roomId || !treeName) {
    res.status(400).json({ error: "roomId та назва дерева обов'язкові." });
    return;
  }

  const roleInfo = await getUserRoleInRoom(req.user.userId, roomId);
  if (!roleInfo || roleInfo.role !== 'dm') {
    res.status(403).json({ error: 'Тільки ДМ може створювати родоводи.' });
    return;
  }

  const tree = new FamilyTree({
    roomId,
    treeName: treeName.trim(),
  });

  await tree.save();
  res.status(201).json(tree.toJSON());
}

/** GET /api/trees/room/:roomId — List trees in a room */
export async function listTrees(req: Request, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Не авторизовано.' }); return; }

  const roomId = req.params['roomId'] as string;
  const roleInfo = await getUserRoleInRoom(req.user.userId, roomId);
  if (!roleInfo) { res.status(403).json({ error: 'Немає доступу.' }); return; }

  const trees = await FamilyTree.find({ roomId }).lean();

  // Filter hidden nodes for players
  if (roleInfo.role === 'player') {
    for (const tree of trees) {
      tree.nodes = tree.nodes.filter((node) => !node.hidden);
      // Only include this player's notes
      tree.nodeNotes = tree.nodeNotes.filter(
        (note) => note.userId.toString() === req.user!.userId,
      );
    }
  }

  res.json(trees);
}

/** GET /api/trees/:id — Get a single tree */
export async function getTree(req: Request, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Не авторизовано.' }); return; }

  const tree = await FamilyTree.findById(req.params['id']);
  if (!tree) { res.status(404).json({ error: 'Родовід не знайдено.' }); return; }

  const roleInfo = await getUserRoleInRoom(req.user.userId, tree.roomId.toString());
  if (!roleInfo) { res.status(403).json({ error: 'Немає доступу.' }); return; }

  const result = tree.toJSON();

  // Filter for players
  if (roleInfo.role === 'player') {
    result.nodes = result.nodes.filter((n: { hidden: boolean }) => !n.hidden);
    result.nodeNotes = result.nodeNotes.filter(
      (n: { userId: { toString(): string } }) =>
        n.userId.toString() === req.user!.userId,
    );
  }

  res.json(result);
}

/** POST /api/trees/:id/nodes — Add a node (DM only) */
export async function addNode(req: Request, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Не авторизовано.' }); return; }

  const tree = await FamilyTree.findById(req.params['id']);
  if (!tree) { res.status(404).json({ error: 'Родовід не знайдено.' }); return; }

  const roleInfo = await getUserRoleInRoom(req.user.userId, tree.roomId.toString());
  if (!roleInfo || roleInfo.role !== 'dm') {
    res.status(403).json({ error: 'Тільки ДМ може додавати вузли.' });
    return;
  }

  const body = req.body as Record<string, unknown>;

  tree.nodes.push({
    id: uuidv4(),
    name: (body['name'] as string) ?? 'Невідомий',
    age: (body['age'] as number) ?? null,
    type: (body['type'] as 'npc' | 'pc') ?? 'npc',
    parentIds: (body['parentIds'] as string[]) ?? [],
    hidden: false,
    description: (body['description'] as string) ?? '',
    posX: (body['posX'] as number) ?? 0,
    posY: (body['posY'] as number) ?? 0,
  });

  tree.markModified('nodes');
  await tree.save();
  res.status(201).json(tree.toJSON());
}

/** PATCH /api/trees/:id/nodes/:nodeId — Update a node (DM only) */
export async function updateNode(req: Request, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Не авторизовано.' }); return; }

  const tree = await FamilyTree.findById(req.params['id']);
  if (!tree) { res.status(404).json({ error: 'Родовід не знайдено.' }); return; }

  const roleInfo = await getUserRoleInRoom(req.user.userId, tree.roomId.toString());
  if (!roleInfo || roleInfo.role !== 'dm') {
    res.status(403).json({ error: 'Тільки ДМ може редагувати вузли.' });
    return;
  }

  const nodeId = req.params['nodeId'] as string;
  const node = tree.nodes.find((n) => n.id === nodeId);
  if (!node) { res.status(404).json({ error: 'Вузол не знайдено.' }); return; }

  const updates = req.body as Record<string, unknown>;
  if (updates['name'] !== undefined) node.name = updates['name'] as string;
  if (updates['age'] !== undefined) node.age = updates['age'] as number | null;
  if (updates['type'] !== undefined) node.type = updates['type'] as 'npc' | 'pc';
  if (updates['parentIds'] !== undefined) node.parentIds = updates['parentIds'] as string[];
  if (updates['hidden'] !== undefined) node.hidden = updates['hidden'] as boolean;
  if (updates['description'] !== undefined) node.description = updates['description'] as string;
  if (updates['posX'] !== undefined) node.posX = updates['posX'] as number;
  if (updates['posY'] !== undefined) node.posY = updates['posY'] as number;

  tree.markModified('nodes');
  await tree.save();
  res.json(tree.toJSON());
}

/** DELETE /api/trees/:id/nodes/:nodeId — Remove a node (DM only) */
export async function deleteNode(req: Request, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Не авторизовано.' }); return; }

  const tree = await FamilyTree.findById(req.params['id']);
  if (!tree) { res.status(404).json({ error: 'Родовід не знайдено.' }); return; }

  const roleInfo = await getUserRoleInRoom(req.user.userId, tree.roomId.toString());
  if (!roleInfo || roleInfo.role !== 'dm') {
    res.status(403).json({ error: 'Тільки ДМ може видаляти вузли.' });
    return;
  }

  const nodeId = req.params['nodeId'] as string;
  tree.nodes = tree.nodes.filter((n) => n.id !== nodeId);
  tree.nodeNotes = tree.nodeNotes.filter((n) => n.nodeId !== nodeId);

  tree.markModified('nodes');
  tree.markModified('nodeNotes');
  await tree.save();
  res.json({ message: 'Вузол видалено.' });
}

/** PATCH /api/trees/:id/nodes/:nodeId/visibility — Toggle hidden (DM only) */
export async function toggleVisibility(req: Request, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Не авторизовано.' }); return; }

  const tree = await FamilyTree.findById(req.params['id']);
  if (!tree) { res.status(404).json({ error: 'Родовід не знайдено.' }); return; }

  const roleInfo = await getUserRoleInRoom(req.user.userId, tree.roomId.toString());
  if (!roleInfo || roleInfo.role !== 'dm') {
    res.status(403).json({ error: 'Тільки ДМ може змінювати видимість.' });
    return;
  }

  const nodeId = req.params['nodeId'] as string;
  const node = tree.nodes.find((n) => n.id === nodeId);
  if (!node) { res.status(404).json({ error: 'Вузол не знайдено.' }); return; }

  const { hidden } = req.body as { hidden?: boolean };
  node.hidden = hidden ?? !node.hidden;

  tree.markModified('nodes');
  await tree.save();

  res.json({ nodeId, hidden: node.hidden });
}

/** POST /api/trees/:id/nodes/:nodeId/notes — Save a player note */
export async function saveNodeNote(req: Request, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: 'Не авторизовано.' }); return; }

  const tree = await FamilyTree.findById(req.params['id']);
  if (!tree) { res.status(404).json({ error: 'Родовід не знайдено.' }); return; }

  const roleInfo = await getUserRoleInRoom(req.user.userId, tree.roomId.toString());
  if (!roleInfo) { res.status(403).json({ error: 'Немає доступу.' }); return; }

  const nodeId = req.params['nodeId'] as string;
  const { content } = req.body as { content?: string };

  // Find existing note or create new one
  const existingIndex = tree.nodeNotes.findIndex(
    (n) => n.nodeId === nodeId && n.userId.toString() === req.user!.userId,
  );

  if (existingIndex >= 0) {
    tree.nodeNotes[existingIndex]!.content = content ?? '';
    tree.nodeNotes[existingIndex]!.updatedAt = new Date();
  } else {
    tree.nodeNotes.push({
      nodeId,
      userId: req.user.userId as unknown as import('mongoose').Types.ObjectId,
      content: content ?? '',
      updatedAt: new Date(),
    });
  }

  tree.markModified('nodeNotes');
  await tree.save();
  res.json({ message: 'Нотатку збережено.' });
}
