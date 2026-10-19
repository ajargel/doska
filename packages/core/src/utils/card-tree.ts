import type { Card } from "../types"

type Linked = Pick<Card, "id" | "parentId" | "deletedAt">

/**
 * Sub-task links over one board's cards. A link to a card that isn't in
 * `cards` reads as top-level, so pass live cards for what the board shows and
 * every card, tombstones included, for what a delete or restore sweeps.
 *
 * The server keeps links acyclic, but a device can briefly hold a loop until
 * it pulls the fix; every walk stops on a card it has already seen.
 */
export class CardTree<T extends Linked> {
  private readonly byId = new Map<string, T>()
  private readonly children = new Map<string, T[]>()

  constructor(cards: readonly T[]) {
    for (const card of cards) this.byId.set(card.id, card)
    for (const card of cards) {
      const parentId = this.parentOf(card.id)?.id
      if (parentId === undefined) continue
      const siblings = this.children.get(parentId)
      if (siblings) siblings.push(card)
      else this.children.set(parentId, [card])
    }
  }

  get(id: string): T | undefined {
    return this.byId.get(id)
  }

  parentOf(id: string): T | undefined {
    const parentId = this.byId.get(id)?.parentId
    if (!parentId || parentId === id) return undefined
    return this.byId.get(parentId)
  }

  isRoot(id: string): boolean {
    return this.parentOf(id) === undefined
  }

  childrenOf(id: string): T[] {
    return this.children.get(id) ?? []
  }

  /** Nearest first, ending at the top-level card. */
  ancestorsOf(id: string): T[] {
    const out: T[] = []
    const seen = new Set([id])
    for (
      let p = this.parentOf(id);
      p && !seen.has(p.id);
      p = this.parentOf(p.id)
    ) {
      seen.add(p.id)
      out.push(p)
    }
    return out
  }

  rootOf(id: string): T | undefined {
    return this.ancestorsOf(id).at(-1) ?? this.byId.get(id)
  }

  /** Every card below `id`, parents before their children. */
  descendantsOf(id: string): T[] {
    const out: T[] = []
    const seen = new Set([id])
    const queue = [id]
    for (let next = queue.shift(); next !== undefined; next = queue.shift()) {
      for (const child of this.childrenOf(next)) {
        if (seen.has(child.id)) continue
        seen.add(child.id)
        out.push(child)
        queue.push(child.id)
      }
    }
    return out
  }

  /** Whether pointing `id` at `parentId` would close a loop. */
  wouldCycle(id: string, parentId: string): boolean {
    if (id === parentId) return true
    return this.ancestorsOf(parentId).some((a) => a.id === id)
  }
}

/** Direct children done (in a `done` column) out of all direct children. */
export function subtaskProgress(
  children: readonly Pick<Card, "columnId">[],
  doneColumnIds: ReadonlySet<string>
): { done: number; total: number } {
  const done = children.filter((c) => doneColumnIds.has(c.columnId)).length
  return { done, total: children.length }
}
