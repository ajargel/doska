import { CARD_GROUPS } from "@doska/contract"
import { generateKeyBetween } from "fractional-indexing"
import { byPosition } from "../../utils"
import { db } from "../db/db"
import { recordHistory } from "../history/record-history"
import { sync } from "../sync"
import { touchCard } from "../sync/touch"
import type { Card } from "../../types"
import { boardTree } from "./board-tree"
import { live } from "./live"
import { newId } from "./new-id"

/**
 * Moves a card to the top of another column, for callers that know the
 * destination but not what's in it — the digest loads no board, so it can't
 * mint a position the way a drag does. Returns the id of the card that now
 * holds the content.
 *
 * Across boards that is a fresh id: the server files a card under the board it
 * was first pushed to and never re-files it, so the card is copied onto the new
 * board and the original tombstoned. Its sub-tasks are copied along with it.
 */
export async function moveCardToColumn(
  id: string,
  columnId: string
): Promise<string> {
  const card = await db.getCard(id)
  if (!card) return id

  const to = await db.getColumn(columnId)
  if (!to || !live(to)) return id

  const cards = (await db.getCards(columnId)).filter(live).sort(byPosition)
  const position = generateKeyBetween(null, cards[0]?.position ?? null)

  const from = await db.getColumn(card.columnId)
  if (!from || from.dashboardId === to.dashboardId) {
    await db.setCard(touchCard({ ...card, columnId, position }, ["place"]))
    sync.markDirty("cards", id)
    if (from && from.id !== to.id)
      await recordHistory.card(to.dashboardId, id, card.title, "move", {
        from: from.title,
        to: to.title,
      })
    return id
  }

  // Read before the move: the copies below would join the old board's tree.
  const subtasks = (await boardTree(from.dashboardId))
    .descendantsOf(id)
    .filter(live)

  // Its parent stays behind on the old board.
  const copyId = await copyAcross(card, { columnId, position, parentId: null })

  // Sub-tasks follow into the same-named column, else wherever the card went.
  const toColumns = (await db.getColumns()).filter(
    (c) => c.dashboardId === to.dashboardId && live(c)
  )
  const fromColumns = new Map(
    (await db.getColumns()).map((c) => [c.id, c.title])
  )
  const copies = new Map([[id, copyId]])
  for (const sub of subtasks) {
    const title = fromColumns.get(sub.columnId)
    const target = toColumns.find((c) => c.title === title) ?? to
    const top = (await db.getCards(target.id)).filter(live).sort(byPosition)[0]
    copies.set(
      sub.id,
      await copyAcross(sub, {
        columnId: target.id,
        position: generateKeyBetween(null, top?.position ?? null),
        parentId: sub.parentId ? (copies.get(sub.parentId) ?? null) : null,
      })
    )
  }

  const fromBoard = await db.getDashboard(from.dashboardId)
  const toBoard = await db.getDashboard(to.dashboardId)
  const move = {
    from: from.title,
    to: to.title,
    fromBoard: fromBoard?.title ?? "",
    toBoard: toBoard?.title ?? "",
  }
  await recordHistory.card(from.dashboardId, id, card.title, "move", {
    ...move,
    toCard: copyId,
  })
  await recordHistory.card(to.dashboardId, copyId, card.title, "move", {
    ...move,
    fromCard: id,
  })
  return copyId
}

/**
 * Copies a card onto another board under a fresh id and tombstones the
 * original, emptied first. Returns the copy's id.
 */
async function copyAcross(
  card: Card,
  place: Pick<Card, "columnId" | "position" | "parentId">
): Promise<string> {
  const copyId = newId("card")
  await db.setCard(
    touchCard({ ...card, ...place, id: copyId, number: null }, CARD_GROUPS)
  )
  sync.markDirty("cards", copyId)
  // Emptied first
  await db.softDeleteCard(
    touchCard({ ...card, title: "", body: "", attachments: [] }, [
      "title",
      "body",
      "attachments",
    ])
  )
  sync.markDirty("cards", card.id)
  return copyId
}
