import { TaskIndicator } from "@doska/ui-kit"
import type { SubtaskInfo } from "@doska/core"
import { CornerDownRight, ListTree } from "lucide-react"
import { useLocation } from "wouter"
import { routes } from "@/lib/routes"

/** A board card's sub-task progress and the parent it belongs to. */
export function SubtaskChips({ parent, progress }: SubtaskInfo) {
  const [, navigate] = useLocation()

  return (
    <>
      {progress && (
        <span className="inline-flex items-center gap-1" title="Sub-tasks done">
          <ListTree className="size-3.5 text-muted-foreground" />
          <TaskIndicator done={progress.done} total={progress.total} />
        </span>
      )}
      {parent && (
        <button
          type="button"
          title={`Sub-task of ${parent.title || "Untitled card"}`}
          className="inline-flex min-w-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation()
            navigate(routes.card.to(parent.id))
          }}
        >
          <CornerDownRight className="size-3.5 shrink-0" />
          <span className="max-w-40 truncate">
            {parent.title || "Untitled card"}
          </span>
        </button>
      )}
    </>
  )
}
