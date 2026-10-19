import type { LaneKey } from "@doska/core"

const SEPARATOR = "::lane::"

/** The drop target id for one column within one lane. */
export function laneCellId(columnId: string, lane: LaneKey): string {
  return `${columnId}${SEPARATOR}${encodeURIComponent(lane ?? "")}`
}

/**
 * Reads a drop target id back. `lane` is `undefined` for a plain column,
 * `null` for the "Other" lane.
 */
export function parseDropId(id: string): {
  columnId: string
  lane: LaneKey | undefined
} {
  const at = id.indexOf(SEPARATOR)
  if (at === -1) return { columnId: id, lane: undefined }
  const lane = decodeURIComponent(id.slice(at + SEPARATOR.length))
  return { columnId: id.slice(0, at), lane: lane === "" ? null : lane }
}
