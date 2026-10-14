import { Modal, ModalContent } from "@doska/ui-kit"
import type { ReactNode } from "react"

interface IProps {
  isOpen: boolean
  onClose: () => void
  onClosed: () => void
  children: ReactNode
}

/** The card as a centered modal, for those who'd rather not have the panel. */
export function CardModalShell({ isOpen, onClose, onClosed, children }: IProps) {
  return (
    <Modal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      onOpenChangeComplete={(open) => {
        if (!open) onClosed()
      }}
    >
      <ModalContent
        aria-label="Card"
        className="overflow-hidden md:h-[85svh] md:max-w-3xl"
      >
        {children}
      </ModalContent>
    </Modal>
  )
}
