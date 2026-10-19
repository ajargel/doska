import type { Card } from "../../types"
import { CardTree } from "../../utils"
import { db } from "../db/db"

/**
 * Every card on a board, tombstones included, as a sub-task tree: deleting
 * and restoring a subtree has to see the trashed half of it too. Columns are
 * walked tombstoned or not, since a column's delete doesn't unlink its cards.
 */
export async function boardTree(dashboardId: string): Promise<CardTree<Card>> {
  const columns = (await db.getColumns()).filter(
    (c) => c.dashboardId === dashboardId
  )
  const cards = await Promise.all(columns.map((c) => db.getCards(c.id)))
  return new CardTree(cards.flat())
}
