import { SlidesModal } from "@doska/ui-kit"
import history from "./slides/history.md?raw"
import cardModal from "./slides/card-modal.md?raw"
import formatting from "./slides/formatting.md?raw"

const SLIDES = [history, cardModal, formatting]

interface IProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WhatsNewModal({ open, onOpenChange }: IProps) {
  return <SlidesModal slides={SLIDES} open={open} onOpenChange={onOpenChange} />
}
