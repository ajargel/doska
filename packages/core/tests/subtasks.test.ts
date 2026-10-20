import { beforeEach, describe, expect, it } from "vitest"
import { CARDS, COLUMNS, DASHBOARDS } from "../src/api/constants"
import type { Card } from "../src/types"
import { installMemoryRuntime, rows } from "./memory-runtime"

const board = (id: string) => ({ id, title: id, updatedAt: 1, deletedAt: null })
const column = (id: string, dashboardId: string, title = id) => ({
  id,
  dashboardId,
  title,
  position: "a0",
  updatedAt: 1,
  deletedAt: null,
})
const card = (
  id: string,
  columnId: string,
  parentId: string | null = null
) => ({
  id,
  columnId,
  parentId,
  position: "a0",
  title: id,
  body: "",
  number: 1,
  attachments: [],
  updatedAt: 1,
  deletedAt: null,
  stamps: {},
})

const stored = (id: string) => rows.get(`${CARDS}/${id}`) as Card
const allCards = () =>
  [...rows.entries()]
    .filter(([key]) => key.startsWith(`${CARDS}/`))
    .map(([, row]) => row as Card)

const ops = () => import("../src/api/operations")

beforeEach(() => {
  installMemoryRuntime()
  rows.set(`${DASHBOARDS}/b1`, board("b1"))
  rows.set(`${COLUMNS}/todo`, column("todo", "b1", "Todo"))
  rows.set(`${COLUMNS}/doing`, column("doing", "b1", "Doing"))
  // root ── mid ── leaf, with mid in another column
  rows.set(`${CARDS}/root`, card("root", "todo"))
  rows.set(`${CARDS}/mid`, card("mid", "doing", "root"))
  rows.set(`${CARDS}/leaf`, card("leaf", "todo", "mid"))
  rows.set(`${CARDS}/other`, card("other", "todo"))
})

describe("setCardParent", () => {
  it("links and unlinks, stamping only the parent group", async () => {
    const { setCardParent } = await ops()
    await setCardParent("other", "leaf")
    expect(stored("other").parentId).toBe("leaf")
    const stamps = stored("other").stamps
    expect(stamps.parent).toBeGreaterThan(stamps.title ?? 0)

    await setCardParent("other", null)
    expect(stored("other").parentId).toBeNull()
  })

  it("records the link and the unlink in the card's history", async () => {
    const { setCardParent } = await ops()
    const { db } = await import("../src/api/db/db")
    await setCardParent("other", "leaf")
    await setCardParent("other", null)

    const rows = (await db.getHistory("other")).map((h) => h.data)
    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "parent",
          to: "leaf",
          toParent: "leaf",
        }),
        expect.objectContaining({ field: "parent", from: "leaf", to: "" }),
      ])
    )
  })

  it("refuses a link that would close a loop", async () => {
    const { setCardParent } = await ops()
    await expect(setCardParent("root", "leaf")).rejects.toThrow()
    await expect(setCardParent("root", "root")).rejects.toThrow()
    expect(stored("root").parentId).toBeNull()
  })

  it("refuses a parent on another board", async () => {
    rows.set(`${DASHBOARDS}/b2`, board("b2"))
    rows.set(`${COLUMNS}/far`, column("far", "b2"))
    rows.set(`${CARDS}/away`, card("away", "far"))

    const { setCardParent } = await ops()
    await expect(setCardParent("other", "away")).rejects.toThrow()
  })
})

describe("createSubtask", () => {
  it("creates an empty card in the parent's column", async () => {
    const { createSubtask } = await ops()
    const id = await createSubtask("mid")
    expect(stored(id)).toMatchObject({ parentId: "mid", columnId: "doing" })
  })
})

describe("deleting and restoring a parent", () => {
  it("trashes the whole subtree and lists it as one entry", async () => {
    const { deleteCard, getTrash } = await ops()
    await deleteCard("b1", "root")

    for (const id of ["root", "mid", "leaf"])
      expect(stored(id).deletedAt).not.toBeNull()
    expect(stored("other").deletedAt).toBeNull()

    const trash = await getTrash()
    expect(trash.map((t) => [t.id, t.cardCount])).toEqual([["root", 2]])
  })

  it("restores the subtree with the parent, but not a sub-task deleted on its own before", async () => {
    const { deleteCard, restore } = await ops()
    await deleteCard("b1", "leaf")
    await deleteCard("b1", "root")
    await restore(CARDS, "root")

    expect(stored("root").deletedAt).toBeNull()
    expect(stored("mid").deletedAt).toBeNull()
    expect(stored("leaf").deletedAt).not.toBeNull()
  })
})

describe("moving a parent to another board", () => {
  it("copies the subtree, relinking to the copies and matching column names", async () => {
    rows.set(`${DASHBOARDS}/b2`, board("b2"))
    rows.set(`${COLUMNS}/inbox`, {
      ...column("inbox", "b2", "Inbox"),
      position: "a0",
    })
    rows.set(`${COLUMNS}/doing2`, {
      ...column("doing2", "b2", "Doing"),
      position: "a1",
    })

    const { moveCardToBoard } = await ops()
    const rootCopy = await moveCardToBoard("root", "b2")

    const live = allCards().filter((c) => c.deletedAt === null)
    const midCopy = live.find((c) => c.title === "mid")
    const leafCopy = live.find((c) => c.title === "leaf")

    expect(stored(rootCopy)).toMatchObject({
      columnId: "inbox",
      parentId: null,
    })
    // "Doing" exists on the new board; "Todo" doesn't, so leaf follows its root.
    expect(midCopy).toMatchObject({ columnId: "doing2", parentId: rootCopy })
    expect(leafCopy).toMatchObject({ columnId: "inbox", parentId: midCopy?.id })

    for (const id of ["root", "mid", "leaf"])
      expect(stored(id).deletedAt).not.toBeNull()
    expect((await (await ops()).getTrash()).length).toBe(0)
  })

  it("detaches a sub-task moved on its own from its parent", async () => {
    rows.set(`${DASHBOARDS}/b2`, board("b2"))
    rows.set(`${COLUMNS}/inbox`, column("inbox", "b2"))

    const { moveCardToBoard } = await ops()
    const copy = await moveCardToBoard("mid", "b2")

    expect(stored(copy).parentId).toBeNull()
    expect(stored("root").deletedAt).toBeNull()
  })
})
