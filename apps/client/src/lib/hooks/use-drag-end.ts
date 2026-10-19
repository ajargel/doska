import type { DropResult } from "@hello-pangea/dnd"
import {
  type Board,
  type Card,
  CardTree,
  byPosition,
  dropNeighbours,
  filterByTags,
  filterByUsers,
  keyBetween,
  laneOf,
  retagForLane,
  sortCards,
  topLevelOnly,
  type Lanes,
} from "@doska/core"
import { parseDropId } from "@/lib/lane-cell"

/** A board split into tag lanes, and how a lane change is written. */
export interface DragLanes {
  lanes: Lanes
  onRetag: (id: string, tags: string[]) => void
}

/**
 * Builds the drop handler for the board: translates a drag result into the
 * single moved card with a freshly minted fractional position, then persists it.
 * With `lanes`, a drop into another lane swaps the card's lane tag too.
 */
export function useDragEnd(
  board: Board | undefined,
  moveCard: (changed: Card[]) => void,
  sort: string[],
  tagFilters: string[] = [],
  userFilters: string[] = [],
  hideSubtasks = false,
  lanes?: DragLanes
) {
  return function handleDragEnd({
    source,
    destination,
    draggableId,
  }: DropResult) {
    if (!destination || !board) return
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return

    const moved = board.cards.find((c) => c.id === draggableId)
    if (!moved) return

    const target = parseDropId(destination.droppableId)
    const columnId = target.columnId
    const inLanes = lanes && target.lane !== undefined ? lanes : undefined
    const tree = new CardTree(board.cards)

    let retag: string[] | undefined
    if (inLanes) {
      const from = laneOf(moved, inLanes.lanes, tree)
      if (from !== target.lane) {
        // A sub-task rides in its top-level card's lane.
        if (!tree.isRoot(moved.id)) return
        retag = retagForLane(
          moved.tags ?? [],
          inLanes.lanes,
          target.lane ?? null
        )
      }
    }

    const column = board.cards
      .filter((c) => c.columnId === columnId && c.id !== moved.id)
      .sort(byPosition)

    // The destination column as rendered, minus the card being dropped, so the
    // insertion index lines up with the neighbors at the drop site.
    const filtered = filterByUsers(
      filterByTags(column, tagFilters),
      userFilters
    )
    const shown = hideSubtasks ? topLevelOnly(filtered, tree) : filtered
    const destCards = sortCards(
      inLanes
        ? shown.filter((c) => laneOf(c, inLanes.lanes, tree) === target.lane)
        : shown,
      sort
    )

    let [prev, next] = dropNeighbours(destCards, destination.index, moved, sort)

    if (
      tagFilters.length > 0 ||
      userFilters.length > 0 ||
      hideSubtasks ||
      inLanes
    ) {
      if (prev) next = column[column.indexOf(prev) + 1]
      else if (next) prev = column[column.indexOf(next) - 1]
    }

    const position = keyBetween(prev, next)
    if (position === null) return

    moveCard([{ ...moved, columnId, position }])
    if (retag) inLanes?.onRetag(moved.id, retag)
  }
}
