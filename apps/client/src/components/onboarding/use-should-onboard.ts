import { useDashboards } from "@doska/core"
import { useAuth } from "@/lib/hooks"
import { webKeyValue } from "@/lib/adapters/web-kv"
import {
  WHATS_NEW_SEEN_KEY,
  WHATS_NEW_VERSION,
} from "../whats-new/whats-new-seen"

export const ONBOARDING_SEEN_KEY = "onboarding-seen"

/** Set by the landing page demo link: no onboarding, no what's new toast. */
export function isOnboardingSkipped(): boolean {
  return new URLSearchParams(location.search).get("skip_onboarding") === "true"
}

/** Marks both as seen, so they stay away after the param leaves the URL. */
export function persistOnboardingSkip() {
  if (!isOnboardingSkipped()) return
  webKeyValue.set(ONBOARDING_SEEN_KEY, "1")
  webKeyValue.set(WHATS_NEW_SEEN_KEY, WHATS_NEW_VERSION)
}

/** Someone new on this device: signed out, at most one board, deck not seen. */
export function useShouldOnboard(): boolean | null {
  const { authed } = useAuth()
  const { data: boards } = useDashboards()

  if (isOnboardingSkipped()) return false
  if (authed === null || !boards) return null
  return !authed && boards.length <= 1 && !webKeyValue.get(ONBOARDING_SEEN_KEY)
}
