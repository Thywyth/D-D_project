/**
 * Auto-Aging Calculator Service
 *
 * When the DM advances game time, this service parses all living
 * characters and NPC tree nodes in the room and increments their
 * Age parameter based on the time delta.
 */

import { Character } from '../models/Character.js';
import { FamilyTree } from '../models/FamilyTree.js';
import type { IGameTime } from '../../../shared/types/room.js';

// ─── Time Delta Calculation ───────────────────────────────────────

/**
 * Convert a game time to total days for comparison.
 * Assumes 30 days/month for simplicity (fantasy calendar).
 */
function gameTimeToDays(time: IGameTime): number {
  return time.year * 360 + (time.month - 1) * 30 + (time.day - 1);
}

/**
 * Calculate the number of full years elapsed between two game times.
 */
export function calculateYearsElapsed(
  oldTime: IGameTime,
  newTime: IGameTime,
): number {
  const oldDays = gameTimeToDays(oldTime);
  const newDays = gameTimeToDays(newTime);
  const deltaDays = newDays - oldDays;
  return Math.floor(deltaDays / 360);
}

// ─── Age Processing ───────────────────────────────────────────────

export interface AgedCharacterResult {
  characterId: string;
  newAge: number;
}

export interface AgedNodeResult {
  treeId: string;
  nodeId: string;
  newAge: number;
}

export interface AgeAdvanceResult {
  agedCharacters: AgedCharacterResult[];
  agedNodes: AgedNodeResult[];
}

/**
 * Advance ages for all living characters and NPC tree nodes in a room.
 * Only increments age for entities that have a defined age.
 *
 * @param roomId - The room to process
 * @param oldTime - Previous game time
 * @param newTime - New game time after advancement
 */
export async function advanceAges(
  roomId: string,
  oldTime: IGameTime,
  newTime: IGameTime,
): Promise<AgeAdvanceResult> {
  const yearsElapsed = calculateYearsElapsed(oldTime, newTime);

  // No full year elapsed → no aging
  if (yearsElapsed <= 0) {
    return { agedCharacters: [], agedNodes: [] };
  }

  const agedCharacters: AgedCharacterResult[] = [];
  const agedNodes: AgedNodeResult[] = [];

  // ── Age living characters ──
  const characters = await Character.find({
    roomId,
    status: 'alive',
    age: { $ne: null, $exists: true },
  });

  for (const character of characters) {
    if (character.age !== null && character.age !== undefined) {
      const newAge = character.age + yearsElapsed;
      character.age = newAge;
      await character.save();
      agedCharacters.push({
        characterId: character._id.toString(),
        newAge,
      });
    }
  }

  // ── Age NPC/PC tree nodes ──
  const trees = await FamilyTree.find({ roomId });

  for (const tree of trees) {
    let treeModified = false;

    for (const node of tree.nodes) {
      if (node.age !== null && node.age !== undefined) {
        node.age += yearsElapsed;
        treeModified = true;
        agedNodes.push({
          treeId: tree._id.toString(),
          nodeId: node.id,
          newAge: node.age,
        });
      }
    }

    if (treeModified) {
      tree.markModified('nodes');
      await tree.save();
    }
  }

  return { agedCharacters, agedNodes };
}

// ─── Time Advancement ─────────────────────────────────────────────

/**
 * Calculate new game time after adding days and months.
 */
export function advanceGameTime(
  current: IGameTime,
  days: number,
  months: number,
): IGameTime {
  let totalDays = current.day + days;
  let totalMonths = current.month + months;
  let totalYears = current.year;

  // Normalize months → years
  while (totalMonths > 12) {
    totalMonths -= 12;
    totalYears += 1;
  }

  // Normalize days → months (30 days/month fantasy calendar)
  while (totalDays > 30) {
    totalDays -= 30;
    totalMonths += 1;
    if (totalMonths > 12) {
      totalMonths -= 12;
      totalYears += 1;
    }
  }

  return {
    day: totalDays,
    month: totalMonths,
    year: totalYears,
  };
}
