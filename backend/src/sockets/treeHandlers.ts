/**
 * Family Tree Socket Handlers — Real-time tree mutations, visibility toggle
 */

import { v4 as uuidv4 } from 'uuid';
import type { TypedServer, TypedSocket } from './index.js';
import { FamilyTree } from '../models/FamilyTree.js';
import { getUserRoleInRoom } from '../middleware/rbac.js';

export function registerTreeHandlers(
  io: TypedServer,
  socket: TypedSocket,
): void {
  const userId = socket.data['userId'] as string;

  // ── tree:add-node (DM only) ──
  socket.on('tree:add-node', async (data) => {
    const tree = await FamilyTree.findById(data.treeId);
    if (!tree) return;

    const roleInfo = await getUserRoleInRoom(userId, tree.roomId.toString());
    if (!roleInfo || roleInfo.role !== 'dm') return;

    tree.nodes.push({
      id: uuidv4(),
      name: data.name,
      age: data.age,
      type: data.type,
      parentIds: data.parentIds,
      hidden: false,
      description: data.description ?? '',
      posX: data.posX ?? 0,
      posY: data.posY ?? 0,
    });

    tree.markModified('nodes');
    await tree.save();

    io.to(tree.roomId.toString()).emit('tree:updated', {
      tree: tree.toJSON() as unknown as import('../../../shared/types/tree.js').IFamilyTree,
    });
  });

  // ── tree:update-node (DM only) ──
  socket.on('tree:update-node', async (data) => {
    const tree = await FamilyTree.findById(data.treeId);
    if (!tree) return;

    const roleInfo = await getUserRoleInRoom(userId, tree.roomId.toString());
    if (!roleInfo || roleInfo.role !== 'dm') return;

    const node = tree.nodes.find((n) => n.id === data.nodeId);
    if (!node) return;

    const updates = data.updates;
    if (updates.name !== undefined) node.name = updates.name;
    if (updates.age !== undefined) node.age = updates.age ?? null;
    if (updates.type !== undefined) node.type = updates.type;
    if (updates.parentIds !== undefined) node.parentIds = updates.parentIds;
    if (updates.hidden !== undefined) node.hidden = updates.hidden;
    if (updates.description !== undefined) node.description = updates.description;
    if (updates.posX !== undefined) node.posX = updates.posX;
    if (updates.posY !== undefined) node.posY = updates.posY;

    tree.markModified('nodes');
    await tree.save();

    io.to(tree.roomId.toString()).emit('tree:updated', {
      tree: tree.toJSON() as unknown as import('../../../shared/types/tree.js').IFamilyTree,
    });
  });

  // ── tree:remove-node (DM only) ──
  socket.on('tree:remove-node', async (data) => {
    const tree = await FamilyTree.findById(data.treeId);
    if (!tree) return;

    const roleInfo = await getUserRoleInRoom(userId, tree.roomId.toString());
    if (!roleInfo || roleInfo.role !== 'dm') return;

    tree.nodes = tree.nodes.filter((n) => n.id !== data.nodeId);
    tree.nodeNotes = tree.nodeNotes.filter((n) => n.nodeId !== data.nodeId);

    tree.markModified('nodes');
    tree.markModified('nodeNotes');
    await tree.save();

    io.to(tree.roomId.toString()).emit('tree:updated', {
      tree: tree.toJSON() as unknown as import('../../../shared/types/tree.js').IFamilyTree,
    });
  });

  // ── tree:toggle-visibility (DM only) ──
  socket.on('tree:toggle-visibility', async (data) => {
    const tree = await FamilyTree.findById(data.treeId);
    if (!tree) return;

    const roleInfo = await getUserRoleInRoom(userId, tree.roomId.toString());
    if (!roleInfo || roleInfo.role !== 'dm') return;

    const node = tree.nodes.find((n) => n.id === data.nodeId);
    if (!node) return;

    node.hidden = data.hidden;
    tree.markModified('nodes');
    await tree.save();

    io.to(tree.roomId.toString()).emit('tree:node-visibility-changed', {
      treeId: data.treeId,
      nodeId: data.nodeId,
      hidden: data.hidden,
    });
  });

  // ── tree:save-note (any room member) ──
  socket.on('tree:save-note', async (data) => {
    const tree = await FamilyTree.findById(data.treeId);
    if (!tree) return;

    const roleInfo = await getUserRoleInRoom(userId, tree.roomId.toString());
    if (!roleInfo) return;

    const existingIndex = tree.nodeNotes.findIndex(
      (n) => n.nodeId === data.nodeId && n.userId.toString() === userId,
    );

    if (existingIndex >= 0) {
      tree.nodeNotes[existingIndex]!.content = data.content;
      tree.nodeNotes[existingIndex]!.updatedAt = new Date();
    } else {
      tree.nodeNotes.push({
        nodeId: data.nodeId,
        userId: userId as unknown as import('mongoose').Types.ObjectId,
        content: data.content,
        updatedAt: new Date(),
      });
    }

    tree.markModified('nodeNotes');
    await tree.save();

    // No broadcast — notes are private per player
  });
}
