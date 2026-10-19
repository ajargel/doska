import { eq } from "drizzle-orm"
import { cards } from "../../schema"
import type { Tx } from "../core/counter"
import type { CardRow } from "./merge-card-body"

/** Past this many hops the chain is treated as a cycle: stored data is acyclic. */
const MAX_DEPTH = 1000

/**
 * Keeps sub-task links a tree on one board. Two offline devices can each make
 * a valid link that together form a loop, so a bad link can't be refused on
 * push: the device already holds it. Instead the stored parent is put back,
 * stamped past the push so the pushing device takes it on pull.
 *
 * A parent that isn't on the server yet passes: it may arrive later in the
 * same push, or in the next one. Clients read a missing parent as top-level.
 */
export async function guardParent(
  tx: Tx,
  boardId: string,
  stored: CardRow | undefined,
  merged: CardRow
): Promise<CardRow> {
  const before = stored?.parentId ?? null
  if (merged.parentId === before) return merged
  if (await isValidParent(tx, boardId, merged.id, merged.parentId))
    return merged

  const stamps = { ...merged.stamps }
  stamps.parent = (stamps.parent ?? merged.updatedAt) + 1
  return {
    ...merged,
    parentId: before,
    stamps,
    updatedAt: Math.max(...Object.values(stamps)),
  }
}

async function isValidParent(
  tx: Tx,
  boardId: string,
  id: string,
  parentId: string | null
): Promise<boolean> {
  let next = parentId
  for (let depth = 0; next !== null; depth++) {
    if (next === id || depth > MAX_DEPTH) return false
    const [row] = await tx
      .select({ boardId: cards.boardId, parentId: cards.parentId })
      .from(cards)
      .where(eq(cards.id, next))
    if (!row) return true
    if (row.boardId !== boardId) return false
    next = row.parentId
  }
  return true
}
