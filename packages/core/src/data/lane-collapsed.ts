import { useSyncExternalStore } from "react"
import { runtime } from "../runtime"
import type { LaneKey } from "../utils"

const COLLAPSED_LANES_KEY = "doska:collapsed-lanes"

const NONE: string[] = []

/** Per board, the lanes this device has collapsed; "" stands for Other. */
let collapsed: Record<string, string[]> | null = null

const listeners = new Set<() => void>()

const keyOf = (lane: LaneKey) => lane ?? ""

function load(): Record<string, string[]> {
  if (collapsed) return collapsed
  const stored = runtime().kv.get(COLLAPSED_LANES_KEY)
  try {
    collapsed = stored ? (JSON.parse(stored) as Record<string, string[]>) : {}
  } catch {
    collapsed = {}
  }
  return collapsed
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function setLaneCollapsed(
  boardId: string,
  lane: LaneKey,
  isCollapsed: boolean
): void {
  const current = load()
  const lanes = current[boardId] ?? []
  const key = keyOf(lane)
  if (lanes.includes(key) === isCollapsed) return
  collapsed = {
    ...current,
    [boardId]: isCollapsed ? [...lanes, key] : lanes.filter((l) => l !== key),
  }
  runtime().kv.set(COLLAPSED_LANES_KEY, JSON.stringify(collapsed))
  for (const listener of [...listeners]) listener()
}

/** Whether this device has `lane` on board `boardId` collapsed. */
export function useCollapsedLanes(boardId: string): (lane: LaneKey) => boolean {
  const lanes = useSyncExternalStore(
    subscribe,
    () => load()[boardId] ?? NONE,
    () => NONE
  )
  return (lane) => lanes.includes(keyOf(lane))
}
