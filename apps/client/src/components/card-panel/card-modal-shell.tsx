import { Modal, ModalContent } from "@doska/ui-kit"
import { useRef, type ReactNode } from "react"

interface IProps {
  isOpen: boolean
  onClose: () => void
  onClosed: () => void
  children: ReactNode
}

/** The card as a centered modal vs panel. */
export function CardModalShell({
  isOpen,
  onClose,
  onClosed,
  children,
}: IProps) {
  const popupRef = useRef<HTMLDivElement>(null)

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
        ref={popupRef}
        initialFocus={popupRef}
        aria-label="Card"
        className="overflow-hidden outline-none md:h-[85svh] md:max-w-3xl"
      >
        {children}
      </ModalContent>
    </Modal>
  )
}
