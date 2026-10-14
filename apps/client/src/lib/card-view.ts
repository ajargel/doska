import { webKeyValue } from "./adapters/web-kv"

export type CardView = "panel" | "modal"

const STORAGE_KEY = "card-view"

export function getCardView(): CardView {
  return webKeyValue.get(STORAGE_KEY) === "panel" ? "panel" : "modal"
}

export function setCardView(next: CardView): void {
  webKeyValue.set(STORAGE_KEY, next)
}
