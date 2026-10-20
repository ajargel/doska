import { Droppable } from "@hello-pangea/dnd"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@doska/ui-kit"
import {
  groupByLane,
  laneOf,
  setLaneCollapsed,
  useCollapsedLanes,
  sortCards,
  type Card,
  type CardPatch,
  type CardTree,
  type Column,
  type LaneKey,
  type Lanes,
} from "@doska/core"
import { laneCellId } from "@/lib/lane-cell"
import { DraggableCard } from "../../card/draggable-card"
import { ColumnBox } from "../../column/column-view"
import { ColumnHeader } from "../../column/column-header"

interface IProps {
  boardId: string
  columns: Column[]
  /** The cards the board shows, already filtered. */
  cards: Card[]
  lanes: Lanes
  /** Every live card on the board, so a sub-task finds its top-level card. */
  tree: CardTree<Card>
  sort: string[]
  /** The card being dragged: a sub-task can't leave its tree's lane. */
  draggingId: string | null
  compact: boolean
  vanishOnDrop: boolean
  addCardDisabledReason?: string
  place: (cards: Card[], dropId: string) => Card[]
  onDropSettled: (id: string) => void
  onPatchCard: (id: string, patch: CardPatch) => void
  onAddCard: (columnId: string, lane: LaneKey) => void
  onToggleBody: (columnId: string, collapsed: boolean) => void
  onRenameColumn: (columnId: string, title: string) => void
  onChangeColumnColor: (columnId: string, color: string) => void
  onChangeColumnDone: (columnId: string, done: boolean) => void
  onDeleteColumn: (columnId: string) => void
}

const laneName = (lane: LaneKey) => (lane === null ? "Other" : `#${lane}`)

/** The board split into tag lanes: the column heads once, then a row per lane. */
export function LaneBoard({
  boardId,
  columns,
  cards,
  lanes,
  tree,
  sort,
  draggingId,
  compact,
  vanishOnDrop,
  addCardDisabledReason,
  place,
  onDropSettled,
  onPatchCard,
  onAddCard,
  onToggleBody,
  onRenameColumn,
  onChangeColumnColor,
  onChangeColumnDone,
  onDeleteColumn,
}: IProps) {
  // Remembered per device, like a collapsed sidebar folder.
  const isCollapsed = useCollapsedLanes(boardId)
  const toggle = (lane: LaneKey) =>
    setLaneCollapsed(boardId, lane, !isCollapsed(lane))

  const dragged = draggingId ? tree.get(draggingId) : undefined
  // A sub-task rides with its tree, so only its own lane takes it.
  const lockedLane =
    dragged && !tree.isRoot(dragged.id)
      ? laneOf(dragged, lanes, tree)
      : undefined

  return (
    <div className="flex h-full min-h-0 shrink-0 flex-col overflow-y-auto overscroll-y-contain pb-6">
      <div className="sticky top-0 z-20 flex gap-0 bg-background/80 backdrop-blur-xs xs:gap-6">
        {columns.map((column) => {
          const showBody = !column.collapsed
          return (
            <ColumnHeader
              key={column.id}
              title={column.title}
              color={column.color}
              done={column.done}
              showBody={showBody}
              onToggleBody={() => onToggleBody(column.id, showBody)}
              onRename={(title) => onRenameColumn(column.id, title)}
              onChangeColor={(color) => onChangeColumnColor(column.id, color)}
              onChangeDone={(done) => onChangeColumnDone(column.id, done)}
              onDelete={() => onDeleteColumn(column.id)}
            />
          )
        })}
      </div>

      {groupByLane(cards, lanes, tree).map(({ lane, cards: inLane }) => {
        const isOpen = !isCollapsed(lane)
        const name = laneName(lane)
        return (
          <section
            key={lane ?? ""}
            aria-label={`${name} lane`}
            className="flex flex-col gap-2 pt-4"
          >
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => toggle(lane)}
              className="sticky left-0 flex w-fit items-center gap-1 px-4 text-sm font-medium text-muted-foreground hover:text-foreground md:px-0"
            >
              {isOpen ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronRight className="size-4" />
              )}
              {name}
              <span className="font-normal tabular-nums">
                · {inLane.length}
              </span>
            </button>

            {isOpen && (
              <div className="flex gap-0 xs:gap-6">
                {columns.map((column) => {
                  const cellId = laneCellId(column.id, lane)
                  const showBody = !column.collapsed
                  const inCell = inLane.filter((c) => c.columnId === column.id)
                  const ordered = place(sortCards(inCell, sort), cellId)
                  return (
                    <Droppable
                      key={column.id}
                      droppableId={cellId}
                      isDropDisabled={
                        lockedLane !== undefined && lockedLane !== lane
                      }
                    >
                      {(provided, snapshot) => (
                        <div
                          role="group"
                          aria-label={`${column.title} in ${name}`}
                          className="w-full shrink-0 xs:w-sm"
                        >
                          <ColumnBox
                            title={`${column.title} in ${name}`}
                            className={cn("min-h-20")}
                            onAddCard={() => onAddCard(column.id, lane)}
                            addCardDisabledReason={addCardDisabledReason}
                            isDraggingOver={snapshot.isDraggingOver}
                            listRef={provided.innerRef}
                            listProps={provided.droppableProps}
                          >
                            {ordered.map((card, index) => (
                              <DraggableCard
                                key={card.id}
                                card={card}
                                column={column}
                                index={index}
                                showBody={showBody}
                                compact={compact}
                                vanishOnDrop={vanishOnDrop}
                                onPatch={onPatchCard}
                                onDropSettled={onDropSettled}
                              />
                            ))}
                            {provided.placeholder}
                          </ColumnBox>
                        </div>
                      )}
                    </Droppable>
                  )
                })}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
