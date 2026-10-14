import { useDashboards } from "@doska/core"
import { useAuth, useIsMainWindow } from "@/lib/hooks"
import { webKeyValue } from "@/lib/adapters/web-kv"
import { OnboardingDeck, SEEN_KEY } from "./onboarding-deck"

/** For someone new on this device: signed out, at most one board, deck not seen. */
export function OnboardingModal() {
  const isMainWindow = useIsMainWindow()
  const { authed } = useAuth()
  const { data: boards } = useDashboards()

  if (!isMainWindow || authed === null || !boards) return null

  return (
    <OnboardingDeck
      shouldShow={!authed && boards.length <= 1 && !webKeyValue.get(SEEN_KEY)}
    />
  )
}
