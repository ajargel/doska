import { SlidesModal } from "@doska/ui-kit"

const SLIDES = [""]

interface IProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WhatsNewModal({ open, onOpenChange }: IProps) {
  return <SlidesModal slides={SLIDES} open={open} onOpenChange={onOpenChange} />
}
