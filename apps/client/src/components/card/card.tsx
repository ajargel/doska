import {
  memo,
  useState,
  type DetailedHTMLProps,
  type HTMLAttributes,
  type ReactNode,
} from "react"
import { useLocation } from "wouter"
import {
  useSubtaskInfo,
  type CardPatch,
  type Card as CardData,
  type Column,
} from "@doska/core"
import { routes } from "@/lib/routes"
import { useDeck } from "@/providers/deck/deck-context"
import { useIsRevealed } from "@/providers/card-reveal/card-reveal-context"
import { HistoryModal } from "../history/history-modal"
import { CardAttachments } from "./attachments/card-attachments"
import { CardAttachmentImage } from "./attachments/card-attachment-image"
import { CardContextMenu, CardMenu } from "./menu/card-menu"
import { CardMarkdown } from "./card-markdown"
import { CardView } from "./card-view"
import { SubtaskChips } from "./subtasks/subtask-chips"

interface IProps extends DetailedHTMLProps<
  HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
> {
  card: CardData
  column: Column
  showBody: boolean
  isDragging: boolean
  onPatch: (id: string, patch: CardPatch) => void
  lead?: ReactNode
  metaLead?: ReactNode
  imageCard?: boolean
}

export const Card = memo(function Card({
  card,
  column,
  showBody,
  isDragging,
  onPatch,
  lead,
  metaLead,
  imageCard,
  ...props
}: IProps) {
  const [, navigate] = useLocation()
  const id = card.id
  const isRevealed = useIsRevealed(id)
  const [historyOpen, setHistoryOpen] = useState(false)
  const { id: deckId } = useDeck()
  const subtasks = useSubtaskInfo(deckId, id)
  const hasSubtasks = !!subtasks.parent || !!subtasks.progress

  const open = () => navigate(routes.card.to(id))
  const showHistory = () => setHistoryOpen(true)

  return (
    <CardMarkdown cardId={id}>
      <CardView
        {...props}
        wrapCard={(inner) => (
          <CardContextMenu
            cardId={id}
            onEdit={open}
            onShowHistory={showHistory}
          >
            {inner}
          </CardContextMenu>
        )}
        card={card}
        column={column}
        showBody={showBody}
        isDragging={isDragging}
        isRevealed={isRevealed}
        lead={lead}
        metaLead={
          hasSubtasks ? (
            <>
              {metaLead}
              <SubtaskChips {...subtasks} />
            </>
          ) : (
            metaLead
          )
        }
        imageCard={imageCard}
        action={
          <CardMenu cardId={id} onEdit={open} onShowHistory={showHistory} />
        }
        onChangeBody={(body) => onPatch(id, { body })}
        onChangeDeadline={(deadline) => onPatch(id, { deadline })}
        onChangePriority={(priority) => onPatch(id, { priority })}
        attachments={
          <CardAttachments className="pt-2" cardId={id} isReadonly />
        }
        renderAttachmentImage={(key, alt, className) => (
          <CardAttachmentImage
            cardId={id}
            attachmentKey={key}
            alt={alt}
            className={className}
          />
        )}
      />
      <HistoryModal
        entityType="card"
        entityId={id}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />
    </CardMarkdown>
  )
})
