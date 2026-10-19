import { db } from "../db/db"
import { createCard } from "./create-card"
import { live } from "./live"

/** Creates an empty sub-task of `parentId` in the parent's column. */
export async function createSubtask(parentId: string): Promise<string> {
  const parent = await db.getCard(parentId)
  if (!parent || !live(parent))
    throw new Error(`createSubtask: no live card ${parentId}`)
  return createCard(parent.columnId, parentId)
}
