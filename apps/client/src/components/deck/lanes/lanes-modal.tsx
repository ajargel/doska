import {
  Button,
  CardContent,
  Checkbox,
  Modal,
  ModalContent,
  ModalDescription,
  ModalHeader,
} from "@doska/ui-kit"
import { useTagOptions, type Lanes } from "@doska/core"
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react"
import { useState } from "react"
import { NewTagInput } from "../../card/menu/new-tag-input"

interface IProps {
  boardId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  lanes: Lanes
  onChangeLanes: (lanes: Lanes) => void
}

const hasTag = (tags: string[], tag: string) =>
  tags.some((t) => t.toLowerCase() === tag.toLowerCase())

/**
 * Turns tag swimlanes on or off and picks which tags get a lane, in order.
 * Mount it on open: it edits its own copy, so a board refresh landing between
 * two quick edits can't hand the second a stale setting to build on.
 */
export function LanesModal({
  boardId,
  open,
  onOpenChange,
  lanes: saved,
  onChangeLanes,
}: IProps) {
  const [lanes, setLanes] = useState(saved)
  const options = useTagOptions(boardId)
  const unused = options.filter((o) => !hasTag(lanes.tags, o.name))

  const change = (next: Lanes) => {
    setLanes(next)
    onChangeLanes(next)
  }
  const setTags = (tags: string[]) => change({ ...lanes, tags })
  const add = (tag: string) => {
    if (!hasTag(lanes.tags, tag)) setTags([...lanes.tags, tag])
  }
  const move = (from: number, to: number) => {
    const tags = [...lanes.tags]
    const [tag] = tags.splice(from, 1)
    tags.splice(to, 0, tag)
    setTags(tags)
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="md:max-w-md">
        <ModalHeader onClose={() => onOpenChange(false)}>Swimlanes</ModalHeader>
        <CardContent className="flex flex-col gap-4 py-4">
          <ModalDescription>
            Split the board into a row per tag. A card sits in the first lane
            whose tag it has, or in Other; sub-tasks follow their top-level
            card.
          </ModalDescription>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={lanes.enabled}
              onCheckedChange={(enabled) =>
                change({ ...lanes, enabled: !!enabled })
              }
            />
            Show swimlanes
          </label>

          <ol aria-label="Lanes" className="flex flex-col gap-1">
            {lanes.tags.map((tag, i) => (
              <li
                key={tag}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-sm hover:bg-muted"
              >
                <span className="min-w-0 flex-1 truncate">#{tag}</span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Move #${tag} up`}
                  disabled={i === 0}
                  onClick={() => move(i, i - 1)}
                >
                  <ArrowUp />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Move #${tag} down`}
                  disabled={i === lanes.tags.length - 1}
                  onClick={() => move(i, i + 1)}
                >
                  <ArrowDown />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove #${tag} lane`}
                  onClick={() => setTags(lanes.tags.filter((t) => t !== tag))}
                >
                  <X />
                </Button>
              </li>
            ))}
            <li className="px-2 py-1 text-sm text-muted-foreground">
              Other, for cards with none of these
            </li>
          </ol>

          <div className="flex flex-col gap-1 border-t pt-3">
            <div className="-mx-3">
              <NewTagInput onChangeQuery={() => {}} onAdd={add} />
            </div>
            {unused.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {unused.map((option) => (
                  <Button
                    key={option.name}
                    variant="muted"
                    size="sm"
                    aria-label={`Add #${option.name} lane`}
                    onClick={() => add(option.name)}
                  >
                    <Plus />#{option.name}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </ModalContent>
    </Modal>
  )
}
