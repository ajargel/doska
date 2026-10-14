import { useState } from "react"
import { SlidesModal, type Slide } from "@doska/ui-kit"
import { SetupChoiceSlide, type Setup } from "./setup-choice-slide"
import { SelfhostSlide } from "./selfhost-slide"
import { isDesktop } from "@/lib/platform"
import { webKeyValue } from "@/lib/adapters/web-kv"
import intro from "./slides/intro.md?raw"
import feedback from "./slides/feedback.md?raw"
import local from "./slides/local.md?raw"
import signedIn from "./slides/signed-in.md?raw"
import members from "./slides/members.md?raw"
import cards from "./slides/cards.md?raw"
import organize from "./slides/organize.md?raw"

export const SEEN_KEY = "onboarding-seen"

interface IProps {
  shouldShow: boolean
}

export function OnboardingDeck({ shouldShow }: IProps) {
  // Only the first value counts, so signing in mid-deck doesn't close it
  const [open, setOpen] = useState(shouldShow)
  const [setup, setSetup] = useState<Setup | null>(null)
  const [isSignedIn, setIsSignedIn] = useState(false)

  function close() {
    webKeyValue.set(SEEN_KEY, "1")
    setOpen(false)
  }

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
      open={open}
      onOpenChange={(next) => (next ? setOpen(true) : close())}
    />
  )
}
