import { SlidesModal } from "@doska/ui-kit"
import history from "./slides/history.md?raw"
import cardModal from "./slides/card-modal.md?raw"
import formatting from "./slides/formatting.md?raw"

// Bump when the slides change
export const WHATS_NEW_VERSION = "0.27.0"
export const WHATS_NEW_SEEN_KEY = "whats-new-seen"

const SLIDES = [history, cardModal, formatting]

interface IProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WhatsNewModal({ open, onOpenChange }: IProps) {
  return <SlidesModal slides={SLIDES} open={open} onOpenChange={onOpenChange} />
}
