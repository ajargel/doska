import type { Lanes } from "@doska/contract"
import { db } from "../db/db"
import { sync } from "../sync"
import { stamp } from "../sync/hlc"

const sameLanes = (a: Lanes, b: Lanes) =>
  a.enabled === b.enabled &&
  a.tags.length === b.tags.length &&
  a.tags.every((tag, i) => tag === b.tags[i])

/** Sets a board's tag swimlanes: on or off, and which tags, in order. */
export async function setDashboardLanes(
  id: string,
  lanes: Lanes
): Promise<void> {
  const dashboard = await db.getDashboard(id)
  if (!dashboard) return
  if (dashboard.lanes && sameLanes(dashboard.lanes, lanes)) return
  await db.setDashboard({ ...dashboard, lanes, updatedAt: stamp() })
  sync.markDirty("dashboards", id)
}
