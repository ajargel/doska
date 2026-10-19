import type { Card, Lanes } from "../types"
import type { CardTree } from "./card-tree"

type Tagged = Pick<Card, "id" | "parentId" | "deletedAt" | "tags">

/** The "Other" lane: cards carrying none of the lane tags. */
export const OTHER_LANE = null

export type LaneKey = string | typeof OTHER_LANE

const sameTag = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()

/**
 * The lane a card sits in: the first lane tag its top-level card carries, so a
 * sub-task always rides with its tree. `OTHER_LANE` when it carries none.
 */
export function laneOf<T extends Tagged>(
  card: T,
  lanes: Lanes,
  tree: CardTree<T>
): LaneKey {
  const root = tree.rootOf(card.id) ?? card
  const tags = root.tags ?? []
  return lanes.tags.find((lane) => tags.some((t) => sameTag(t, lane))) ?? null
}

/**
 * Every lane in order, "Other" last, each with its cards. Empty lanes stay in
 * so a card can be dropped into them.
 */
export function groupByLane<T extends Tagged>(
  cards: readonly T[],
  lanes: Lanes,
  tree: CardTree<T>
): { lane: LaneKey; cards: T[] }[] {
  const groups = new Map<LaneKey, T[]>(
    [...lanes.tags, OTHER_LANE].map((lane) => [lane, []])
  )
  for (const card of cards) groups.get(laneOf(card, lanes, tree))?.push(card)
  return [...groups].map(([lane, cards]) => ({ lane, cards }))
}

/**
 * The tags that move a card from its lane to `target`: its current lane tag
 * comes off, as does every lane tag ranked above `target`, or the card would
 * stay in the first of those. Tags ranked below can stay, since `target` wins.
 */
export function retagForLane(
  tags: readonly string[],
  lanes: Lanes,
  target: LaneKey
): string[] {
  const rank =
    target === OTHER_LANE ? lanes.tags.length : lanes.tags.indexOf(target)
  const current = lanes.tags.find((lane) => tags.some((t) => sameTag(t, lane)))
  const off = [...lanes.tags.slice(0, rank), ...(current ? [current] : [])]
  const kept = tags.filter(
    (t) =>
      !off.some((lane) => sameTag(t, lane)) ||
      (target !== OTHER_LANE && sameTag(t, target))
  )
  if (target === OTHER_LANE || kept.some((t) => sameTag(t, target))) return kept
  return [...kept, target]
}
