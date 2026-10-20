import { MenuContent, MenuItem, MenuSub, MenuSubTrigger } from "@doska/ui-kit"
import { Rows3 } from "lucide-react"
import {
  laneOf,
  OTHER_LANE,
  retagForLane,
  useBoardTree,
  useDashboards,
  useUpdateCard,
  type LaneKey,
} from "@doska/core"
import { useDeck } from "@/providers/deck/deck-context"

/**
 * Moves a card to another swimlane by swapping its lane tag: the keyboard's
 * way between lanes, since a keyboard drag only moves across, not down. A
 * sub-task's lane follows its top-level card, so it offers none.
 */
export function MoveToLaneSub({ cardId }: { cardId: string }) {
  const { id: deckId } = useDeck()
  const { data: dashboards = [] } = useDashboards()
  const { tree } = useBoardTree(deckId)
  const { mutate: updateCard } = useUpdateCard(cardId)

  const lanes = dashboards.find((d) => d.id === deckId)?.lanes
  const card = tree.get(cardId)
  if (!lanes?.enabled || !card) return null

  const current = laneOf(card, lanes, tree)
  const isSubtask = !tree.isRoot(cardId)
  const options: LaneKey[] = [...lanes.tags, OTHER_LANE]

  return (
    <MenuSub>
      <MenuSubTrigger disabled={isSubtask}>
        <Rows3 />
        {isSubtask ? "Lane follows its top-level card" : "Move to lane"}
      </MenuSubTrigger>
      <MenuContent align="start" sideOffset={2}>
        {options.map((lane) => (
          <MenuItem
            key={lane ?? ""}
            disabled={lane === current}
            onClick={() =>
              updateCard({ tags: retagForLane(card.tags ?? [], lanes, lane) })
            }
            className="data-disabled:pointer-events-none data-disabled:opacity-50"
          >
            {lane === OTHER_LANE ? "Other" : `#${lane}`}
          </MenuItem>
        ))}
      </MenuContent>
    </MenuSub>
  )
}
