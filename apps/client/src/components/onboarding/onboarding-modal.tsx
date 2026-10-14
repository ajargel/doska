import { useState } from "react"
import { SlidesModal, type Slide } from "@doska/ui-kit"
import { SetupChoiceSlide, type Setup } from "./setup-choice-slide"
import { SelfhostSlide } from "./selfhost-slide"
import { isDesktop } from "@/lib/platform"
import { useIsMainWindow } from "@/lib/hooks"
import intro from "./slides/intro.md?raw"
import feedback from "./slides/feedback.md?raw"
import local from "./slides/local.md?raw"
import signedIn from "./slides/signed-in.md?raw"
import members from "./slides/members.md?raw"
import cards from "./slides/cards.md?raw"
import organize from "./slides/organize.md?raw"

export function OnboardingModal() {
  // TODO: open only on a fresh install
  const [open, setOpen] = useState(true)
  const [setup, setSetup] = useState<Setup | null>(null)
  const [isSignedIn, setIsSignedIn] = useState(false)
  const isMainWindow = useIsMainWindow()

  const signInSlide: Slide = (next) => (
    <SelfhostSlide
      onDone={() => {
        setIsSignedIn(true)
        next()
      }}
    />
  )

  const slides: Slide[] = [intro, cards, organize, members]
  if (isDesktop()) {
    slides.push((next) => (
      <SetupChoiceSlide
        value={setup}
        onChange={(value) => {
          setSetup(value)
          next()
        }}
      />
    ))
  }
  // The web app is always served by a self-hosted instance
  if (!isDesktop() || setup === "selfhost") {
    slides.push(signInSlide)
    if (isSignedIn) slides.push(signedIn)
  }
  if (setup === "local") slides.push(local)
  slides.push(feedback)

  return (
    <SlidesModal
      slides={slides}
      open={open && isMainWindow}
      onOpenChange={setOpen}
    />
  )
}
