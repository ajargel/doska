import { useState } from "react"
import { ConfirmDialog } from "../confirm-dialog"
import { ColumnMenu } from "./column-menu"
import { ColumnHead } from "./column-view"

interface IProps {
  title: string
  color: string
  done: boolean
  showBody: boolean
  onToggleBody: () => void
  onRename: (title: string) => void
  onChangeColor: (color: string) => void
  onChangeDone: (done: boolean) => void
  onDelete: () => void
}

/** A column's head with its menu, for a board that draws the cards elsewhere. */
export function ColumnHeader({
  title,
  color,
  done,
  showBody,
  onToggleBody,
  onRename,
  onChangeColor,
  onChangeDone,
  onDelete,
}: IProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <div role="group" aria-label={title} className="w-full shrink-0 xs:w-sm">
      <ColumnHead
        title={title}
        color={color}
        done={done}
        showBody={showBody}
        onToggleBody={onToggleBody}
        onRename={onRename}
        menu={
          <>
            <ColumnMenu
              title={title}
              color={color}
              onChangeColor={onChangeColor}
              done={done}
              onChangeDone={onChangeDone}
              onDelete={() => setConfirmOpen(true)}
            />
            <ConfirmDialog
              open={confirmOpen}
              onOpenChange={setConfirmOpen}
              title="Delete column?"
              description={`"${title}" and all of its cards move to the trash, where they stay restorable for 14 days.`}
              confirmLabel="Delete column"
              onConfirm={onDelete}
            />
          </>
        }
      />
    </div>
  )
}
