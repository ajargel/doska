import {
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuSub,
  MenuSubTrigger,
} from "@doska/ui-kit"
import { Check, ListTree, Unlink } from "lucide-react"
import { useState } from "react"
import { useBoard, useBoardTree, useSetCardParent } from "@doska/core"
import { useDeck } from "@/providers/deck/deck-context"

const untitled = (title: string) => title || "Untitled card"

/** Picks the card this one is a sub-task of, from the same board. */
export function ParentSub({ cardId }: { cardId: string }) {
  const { id: deckId } = useDeck()
  const { tree } = useBoardTree(deckId)
  const { data: board } = useBoard(deckId)
  const { mutate: setParent } = useSetCardParent(deckId)
  const [query, setQuery] = useState("")

  const parent = tree.parentOf(cardId)
  // Itself and its own sub-tasks would close a loop.
  const below = new Set([
    cardId,
    ...tree.descendantsOf(cardId).map((c) => c.id),
  ])
  const needle = query.trim().toLowerCase()
  const candidates = (board?.cards ?? [])
    .filter((c) => !below.has(c.id))
    .filter((c) => untitled(c.title).toLowerCase().includes(needle))
    .slice(0, 50)

  return (
    <MenuSub>
      <MenuSubTrigger>
        <ListTree />
        Sub-task of
      </MenuSubTrigger>
      <MenuContent
        align="start"
        sideOffset={2}
        className="flex max-h-80 w-64 flex-col"
      >
        <div className="px-3">
          <input
            value={query}
            placeholder="Find a card…"
            aria-label="Find a parent card"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Escape") e.stopPropagation()
            }}
            className="w-full bg-transparent py-1.5 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        {parent && (
          <>
            <MenuSeparator />
            <MenuItem onClick={() => setParent({ id: cardId, parentId: null })}>
              <Unlink />
              Detach from {untitled(parent.title)}
            </MenuItem>
          </>
        )}
        {candidates.length > 0 && <MenuSeparator />}
        <div className="overflow-y-auto">
          {candidates.map((card) => (
            <MenuItem
              key={card.id}
              onClick={() => setParent({ id: cardId, parentId: card.id })}
            >
              <span className="min-w-0 flex-1 truncate">
                {untitled(card.title)}
              </span>
              {card.id === parent?.id && <Check className="ml-auto" />}
            </MenuItem>
          ))}
        </div>
      </MenuContent>
    </MenuSub>
  )
}
