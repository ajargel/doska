import { useMemo, useState } from "react"
import { useLocation, useRoute } from "wouter"
import { toggleTag } from "@doska/core"
import { useIsMobile } from "@doska/ui-kit"
import { DeckView } from "@/components"
import { useActiveDashboard } from "@/lib/hooks"
import { routes } from "@/lib/routes"
import { getCardView } from "@/lib/card-view"
import { AppShell } from "./app-shell"

interface IProps {
  deckId: string
}

/** One board, at `/d/:id`. */
export function BoardPage({ deckId }: IProps) {
  const { dashboard } = useActiveDashboard(deckId)
  const [tagFilters, setTagFilters] = useState<string[]>([])
  const [userFilters, setUserFilters] = useState<string[]>([])
  const [lastDeckId, setLastDeckId] = useState(deckId)
  const [, navigate] = useLocation()
  const [isCardOpen] = useRoute(routes.card.pattern)
  const isMobile = useIsMobile()
  const closeHref = `~${routes.deck.to(dashboard.id)}`

  if (deckId !== lastDeckId) {
    setLastDeckId(deckId)
    setTagFilters([])
    setUserFilters([])
  }

  const deck = useMemo(() => {
    // A card covering the board would hide what the filter.
    const showBoard = () => {
      if (isCardOpen && (isMobile || getCardView() === "modal")) {
        navigate(closeHref)
      }
    }
    return {
      id: dashboard.id,
      sort: dashboard.sort ?? [],
      tagFilters,
      toggleTagFilter: (tag: string) => {
        showBoard()
        setTagFilters((tags) => toggleTag(tags, tag))
      },
      userFilters,
      toggleUserFilter: (userId: string) => {
        showBoard()
        setUserFilters((ids) =>
          ids.includes(userId)
            ? ids.filter((id) => id !== userId)
            : [...ids, userId]
        )
      },
    }
  }, [
    dashboard.id,
    dashboard.sort,
    tagFilters,
    userFilters,
    isCardOpen,
    isMobile,
    navigate,
    closeHref,
  ])

  return (
    <AppShell deck={deck} cardCloseHref={closeHref}>
      <DeckView key={dashboard.id} dashboard={dashboard} />
    </AppShell>
  )
}
