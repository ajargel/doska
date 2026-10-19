import { Button, CardContent, TaskIndicator, cn } from "@doska/ui-kit"
import {
  byPosition,
  subtaskProgress,
  useBoard,
  useBoardTree,
  useCardDeckId,
  useCreateSubtask,
} from "@doska/core"
import { Check, ChevronRight, Circle, Plus } from "lucide-react"
import { useLocation } from "wouter"
import { routes } from "@/lib/routes"

const untitled = (title: string) => title || "Untitled card"

/**
 * The card panel's view of the sub-task tree: the path up to the top-level
 * card, then this card's own sub-tasks and a way to add one.
 */
export function SubtasksSection({ cardId }: { cardId: string }) {
  const [, navigate] = useLocation()
  const { data: deckId } = useCardDeckId(cardId)
  const { tree, doneColumns } = useBoardTree(deckId ?? "")
  const { data: board } = useBoard(deckId ?? "")
  const { mutate: createSubtask, isPending } = useCreateSubtask(deckId ?? "")

  if (!deckId) return null

  const open = (id: string) => navigate(routes.card.to(id))
  const columnTitle = new Map(board?.columns.map((c) => [c.id, c.title]))
  const path = tree.ancestorsOf(cardId).reverse()
  const children = [...tree.childrenOf(cardId)].sort(byPosition)
  const progress = subtaskProgress(children, doneColumns)

  return (
    <CardContent className="space-y-1 border-t-0 px-4 pt-2 text-sm">
      {path.length > 0 && (
        <nav
          aria-label="Parent cards"
          className="flex flex-wrap items-center gap-1 text-muted-foreground"
        >
          {path.map((ancestor, i) => (
            <span key={ancestor.id} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="size-3.5" />}
              <button
                type="button"
                className="max-w-48 truncate hover:text-foreground"
                onClick={() => open(ancestor.id)}
              >
                {untitled(ancestor.title)}
              </button>
            </span>
          ))}
        </nav>
      )}

      <div className="flex items-center gap-2 pt-1">
        {children.length > 0 && (
          <>
            <span className="font-medium">Sub-tasks</span>
            <TaskIndicator done={progress.done} total={progress.total} />
          </>
        )}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "text-muted-foreground",
            children.length > 0 ? "ml-auto" : "-ml-2"
          )}
          disabled={isPending}
          onClick={() => createSubtask(cardId, { onSuccess: open })}
        >
          <Plus />
          Add sub-task
        </Button>
      </div>

      {children.length > 0 && (
        <ul aria-label="Sub-tasks">
          {children.map((child) => {
            const done = doneColumns.has(child.columnId)
            return (
              <li key={child.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-md px-1 py-1 text-left hover:bg-muted"
                  onClick={() => open(child.id)}
                >
                  {done ? (
                    <Check className="size-3.5 shrink-0 text-muted-foreground" />
                  ) : (
                    <Circle className="size-3.5 shrink-0 text-muted-foreground" />
                  )}
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate",
                      done && "text-muted-foreground line-through"
                    )}
                  >
                    {untitled(child.title)}
                  </span>
                  {tree.childrenOf(child.id).length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      +{tree.descendantsOf(child.id).length}
                    </span>
                  )}
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {columnTitle.get(child.columnId)}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </CardContent>
  )
}
