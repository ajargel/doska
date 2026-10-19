import { db } from "../db/db"
import { sync } from "../sync"
import { touchCard } from "../sync/touch"
import { boardTree } from "./board-tree"
import { live } from "./live"

/**
 * Makes `id` a sub-task of `parentId`, or top-level with `null`. Refuses a
 * parent on another board, a deleted one, or one that would close a loop.
 */
export async function setCardParent(
  id: string,
  parentId: string | null
): Promise<void> {
  const card = await db.getCard(id)
  if (!card || card.parentId === parentId) return

  if (parentId !== null) {
    const column = await db.getColumn(card.columnId)
    if (!column) return
    const tree = await boardTree(column.dashboardId)
    const parent = tree.get(parentId)
    if (!parent || !live(parent))
      throw new Error("The parent card isn't on this board")
    // Over tombstones too, like the server: a loop through a trashed card
    // would come back on restore.
    if (tree.wouldCycle(id, parentId))
      throw new Error("A card can't be a sub-task of its own sub-task")
  }

  await db.setCard(touchCard({ ...card, parentId }, ["parent"]))
  sync.markDirty("cards", id)
}
