import { db } from "../db/db"
import { recordHistory } from "../history/record-history"
import { sync } from "../sync"
import { boardTree } from "./board-tree"
import { live } from "./live"

/**
 * Tombstones a card, then its live sub-tasks after it, so each carries a
 * `deletedAt` past the card's and {@link restore} brings them back together.
 */
export async function deleteCard(_deckId: string, id: string): Promise<void> {
  const existing = await db.getCard(id)
  if (!existing) return
  await db.softDeleteCard(existing)
  sync.markDirty("cards", id)

  const column = await db.getColumn(existing.columnId)
  if (!column) return

  const tree = await boardTree(column.dashboardId)
  for (const sub of tree.descendantsOf(id).filter(live)) {
    await db.softDeleteCard(sub)
    sync.markDirty("cards", sub.id)
  }
  await recordHistory.card(column.dashboardId, id, existing.title, "delete")
}
