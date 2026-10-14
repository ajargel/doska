import { useState } from "react"
import { SlidesModal } from "@doska/ui-kit"

const SLIDES = [""]

export function OnboardingModal() {
  // TODO: open only on a fresh install
  const [open, setOpen] = useState(true)

  return <SlidesModal slides={SLIDES} open={open} onOpenChange={setOpen} />
}
