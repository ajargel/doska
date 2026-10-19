import { useState } from "react"
import {
  Button,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "@doska/ui-kit"
import {
  ArrowRightLeft,
  History,
  ListTree,
  Rows3,
  MoreHorizontal,
  Trash2,
} from "lucide-react"
import { ConfirmDialog } from "../../confirm-dialog"
import { HistoryModal } from "../../history/history-modal"
import { ReorderColumnsModal } from "../reorder-columns/reorder-columns-modal"
import { SortSub } from "./sort-sub"
import {
  setHideSubtasks,
  useHideSubtasks,
  type Column,
  type Lanes,
} from "@doska/core"
import { LanesModal } from "../lanes/lanes-modal"

interface IProps {
  boardId: string
  title: string
  columns: Column[]
  sort: string[]
  onChangeSort: (sort: string[]) => void
  lanes: Lanes
  onChangeLanes: (lanes: Lanes) => void
  onDelete: () => void
  onReorderColumns: (changed: Column[]) => void
}

export function BoardActionsMenu({
  boardId,
  title,
  columns,
  sort,
  onChangeSort,
  lanes,
  onChangeLanes,
  onDelete,
  onReorderColumns,
}: IProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [reorderOpen, setReorderOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [lanesOpen, setLanesOpen] = useState(false)
  const hideSubtasks = useHideSubtasks(boardId)

  return (
    <>
      <Menu>
        <MenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Board actions"
              className="text-muted-foreground"
              tooltip={false}
            />
          }
        >
          <MoreHorizontal />
        </MenuTrigger>
        <MenuContent>
          <SortSub sort={sort} onChangeSort={onChangeSort} />
          <MenuItem
            onClick={() => setReorderOpen(true)}
            disabled={columns.length < 2}
          >
            <ArrowRightLeft />
            Reorder columns
          </MenuItem>
          <MenuItem onClick={() => setLanesOpen(true)}>
            <Rows3 />
            Swimlanes…
          </MenuItem>
          <MenuItem onClick={() => setHideSubtasks(boardId, !hideSubtasks)}>
            <ListTree />
            {hideSubtasks ? "Show sub-tasks" : "Hide sub-tasks"}
          </MenuItem>
          <MenuItem onClick={() => setHistoryOpen(true)}>
            <History />
            History
          </MenuItem>
          <MenuSeparator />
          <MenuItem onClick={() => setConfirmOpen(true)} variant="destructive">
            <Trash2 />
            Delete board
          </MenuItem>
        </MenuContent>
      </Menu>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete board?"
        description={`"${title}" and all of its columns and cards move to the trash, where they stay restorable for 14 days.`}
        confirmLabel="Delete board"
        onConfirm={onDelete}
      />
      <ReorderColumnsModal
        open={reorderOpen}
        onOpenChange={setReorderOpen}
        columns={columns}
        onReorder={onReorderColumns}
      />
      {lanesOpen && (
        <LanesModal
          boardId={boardId}
          open
          onOpenChange={setLanesOpen}
          lanes={lanes}
          onChangeLanes={onChangeLanes}
        />
      )}
      <HistoryModal
        entityType="board"
        entityId={boardId}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />
    </>
  )
}
