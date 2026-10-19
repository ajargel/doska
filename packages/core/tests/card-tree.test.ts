import { describe, expect, it } from "vitest"
import { CardTree, subtaskProgress } from "../src/utils"

const card = (id: string, parentId: string | null = null) => ({
  id,
  parentId,
  deletedAt: null,
})

const ids = (cards: { id: string }[]) => cards.map((c) => c.id)

describe("CardTree", () => {
  // root ─┬─ a ── a1
  //       └─ b
  const tree = new CardTree([
    card("root"),
    card("a", "root"),
    card("b", "root"),
    card("a1", "a"),
    card("loose"),
  ])

  it("lists direct children only", () => {
    expect(ids(tree.childrenOf("root"))).toEqual(["a", "b"])
    expect(tree.childrenOf("b")).toEqual([])
  })

  it("walks ancestors nearest first, ending at the top", () => {
    expect(ids(tree.ancestorsOf("a1"))).toEqual(["a", "root"])
    expect(tree.rootOf("a1")?.id).toBe("root")
    expect(tree.rootOf("root")?.id).toBe("root")
  })

  it("lists descendants parents first", () => {
    expect(ids(tree.descendantsOf("root"))).toEqual(["a", "b", "a1"])
  })

  it("spots a link that would close a loop", () => {
    expect(tree.wouldCycle("root", "a1")).toBe(true)
    expect(tree.wouldCycle("a", "a")).toBe(true)
    expect(tree.wouldCycle("a1", "b")).toBe(false)
    expect(tree.wouldCycle("loose", "a1")).toBe(false)
  })

  it("reads a missing parent as top-level", () => {
    const orphaned = new CardTree([card("child", "gone")])
    expect(orphaned.isRoot("child")).toBe(true)
    expect(orphaned.ancestorsOf("child")).toEqual([])
  })

  it("stops on a loop instead of spinning", () => {
    // A device can hold one until it pulls the server's fix.
    const looped = new CardTree([card("x", "y"), card("y", "x")])
    expect(ids(looped.ancestorsOf("x"))).toEqual(["y"])
    expect(ids(looped.descendantsOf("x"))).toEqual(["y"])
  })
})

describe("subtaskProgress", () => {
  it("counts children sitting in done columns", () => {
    const children = [
      { columnId: "todo" },
      { columnId: "done" },
      { columnId: "shipped" },
    ]
    expect(subtaskProgress(children, new Set(["done", "shipped"]))).toEqual({
      done: 2,
      total: 3,
    })
  })
})
