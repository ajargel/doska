import { CARD_GROUPS, type Card, type CardGroup } from "@doska/contract"
import { beforeAll, beforeEach, describe, expect, test } from "vitest"
import { rpcClient, resetTables, startServer, type Harness } from "./harness"

let h: Harness
let client: ReturnType<typeof rpcClient>

beforeAll(async () => {
  h = await startServer()
  client = rpcClient(h)
})

beforeEach(resetTables)

const created = 1

const stampAll = (groups: readonly CardGroup[], at: number) =>
  Object.fromEntries(groups.map((g) => [g, at])) as Record<CardGroup, number>

function card(id: string, patch: Partial<Card> = {}): Card {
  return {
    id,
    title: id,
    body: "",
    position: "a",
    columnId: "c1",
    number: null,
    deadline: null,
    priority: "",
    tags: [],
    users: [],
    attachments: [],
    parentId: null,
    updatedAt: created,
    deletedAt: null,
    stamps: stampAll(CARD_GROUPS, created),
    bodyConflict: null,
    ...patch,
  }
}

/** What a device pushes after pointing `id` at `parentId` at time `at`. */
function linked(id: string, parentId: string | null, at: number): Card {
  const c = card(id, { parentId })
  return { ...c, updatedAt: at, stamps: { ...c.stamps, parent: at } }
}

const push = (records: Card[], boardId = "b1") =>
  client.board.sync({
    boardId,
    since: 0,
    changes: records.map((record) => ({ store: "cards" as const, record })),
  })

async function readCards(boardId = "b1"): Promise<Map<string, Card>> {
  const res = await client.board.sync({ boardId, since: 0, changes: [] })
  const out = new Map<string, Card>()
  for (const c of res.changes)
    if (c.store === "cards") out.set(c.record.id, c.record)
  return out
}

describe("sub-task links", () => {
  test("a parent on the same board is stored and read back", async () => {
    await push([card("p"), card("c")])
    await push([linked("c", "p", 10)])

    expect((await readCards()).get("c")?.parentId).toBe("p")
  })

  test("a card pushed without parentId defaults to top-level", async () => {
    const legacy: Partial<Card> = card("old")
    delete legacy.parentId
    await push([legacy as Card])

    expect((await readCards()).get("old")?.parentId).toBeNull()
  })

  test("a card can't be its own parent", async () => {
    await push([card("a")])
    await push([linked("a", "a", 10)])

    const a = (await readCards()).get("a")
    expect(a?.parentId).toBeNull()
    expect(a?.stamps.parent).toBeGreaterThan(10)
  })

  test("two offline links that form a loop: the later push is undone", async () => {
    await push([card("a"), card("b")])
    // Each valid on its own device.
    await push([linked("a", "b", 10)])
    await push([linked("b", "a", 11)])

    const stored = await readCards()
    expect(stored.get("a")?.parentId).toBe("b")
    expect(stored.get("b")?.parentId).toBeNull()
    // Past the push, so the device that made the link takes the fix on pull.
    expect(stored.get("b")?.stamps.parent).toBeGreaterThan(11)
  })

  test("a loop through a deep chain is caught", async () => {
    await push([card("a"), card("b"), card("c")])
    await push([linked("b", "a", 10), linked("c", "b", 10)])
    await push([linked("a", "c", 11)])

    expect((await readCards()).get("a")?.parentId).toBeNull()
  })

  test("an undone link falls back to the previous parent, not top-level", async () => {
    await push([card("a"), card("b"), card("x")])
    await push([linked("b", "x", 5), linked("a", "b", 10)])
    await push([linked("b", "a", 11)])

    expect((await readCards()).get("b")?.parentId).toBe("x")
  })

  test("a parent on another board is undone", async () => {
    await push([card("other")], "b2")
    await push([card("c")])
    await push([linked("c", "other", 10)])

    expect((await readCards()).get("c")?.parentId).toBeNull()
  })

  test("a parent the server hasn't seen yet is kept", async () => {
    await push([linked("c", "later", 10)])
    await push([card("later")])

    expect((await readCards()).get("c")?.parentId).toBe("later")
  })

  test("a parent pushed after its child in the same push is kept", async () => {
    await push([linked("c", "p", 10), card("p")])

    expect((await readCards()).get("c")?.parentId).toBe("p")
  })
})
