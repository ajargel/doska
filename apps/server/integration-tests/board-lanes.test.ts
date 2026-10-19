import { beforeAll, beforeEach, describe, expect, test } from "vitest"
import type { Dashboard } from "@doska/contract"
import { rpcClient, resetTables, startServer, type Harness } from "./harness"

let h: Harness
let client: ReturnType<typeof rpcClient>

beforeAll(async () => {
  h = await startServer()
  client = rpcClient(h)
})

beforeEach(resetTables)

const board = (patch: Partial<Dashboard> = {}) => ({
  store: "dashboards" as const,
  record: {
    id: "b1",
    title: "Roadmap",
    position: "a",
    updatedAt: 1,
    deletedAt: null,
    ...patch,
  },
})

async function readBoard(): Promise<Dashboard> {
  const res = await client.dashboards.sync({ since: 0, changes: [] })
  const hit = res.changes.find(
    (c) => c.store === "dashboards" && c.record.id === "b1"
  )
  if (!hit || hit.store !== "dashboards") throw new Error("b1 missing")
  return hit.record
}

describe("board swimlanes", () => {
  test("the lane setting is stored and read back in order", async () => {
    const lanes = { enabled: true, tags: ["frontend", "backend"] }
    await client.dashboards.sync({ since: 0, changes: [board({ lanes })] })

    expect((await readBoard()).lanes).toEqual(lanes)
  })

  test("a board pushed without lanes reads as lanes off", async () => {
    await client.dashboards.sync({ since: 0, changes: [board()] })

    expect((await readBoard()).lanes).toEqual({ enabled: false, tags: [] })
  })

  test("a newer push replaces the lane setting", async () => {
    await client.dashboards.sync({
      since: 0,
      changes: [board({ lanes: { enabled: true, tags: ["a"] } })],
    })
    await client.dashboards.sync({
      since: 0,
      changes: [
        board({ lanes: { enabled: false, tags: ["a", "b"] }, updatedAt: 2 }),
      ],
    })

    expect((await readBoard()).lanes).toEqual({
      enabled: false,
      tags: ["a", "b"],
    })
  })
})
