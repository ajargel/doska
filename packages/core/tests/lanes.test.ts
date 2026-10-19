import { describe, expect, it } from "vitest"
import {
  CardTree,
  groupByLane,
  laneOf,
  OTHER_LANE,
  retagForLane,
} from "../src/utils"

const card = (id: string, tags: string[], parentId: string | null = null) => ({
  id,
  tags,
  parentId,
  deletedAt: null,
})

const lanes = { enabled: true, tags: ["frontend", "backend", "infra"] }

describe("laneOf", () => {
  it("takes the first lane tag in lane order, not tag order", () => {
    const c = card("c", ["infra", "Frontend"])
    expect(laneOf(c, lanes, new CardTree([c]))).toBe("frontend")
  })

  it("falls back to Other when no lane tag matches", () => {
    const c = card("c", ["docs"])
    expect(laneOf(c, lanes, new CardTree([c]))).toBe(OTHER_LANE)
  })

  it("puts a sub-task in its top-level card's lane, whatever its own tags", () => {
    const root = card("root", ["backend"])
    const mid = card("mid", ["frontend"], "root")
    const leaf = card("leaf", [], "mid")
    const tree = new CardTree([root, mid, leaf])
    expect(laneOf(leaf, lanes, tree)).toBe("backend")
    expect(laneOf(mid, lanes, tree)).toBe("backend")
  })
})

describe("groupByLane", () => {
  it("keeps every lane in order, empty ones too, with Other last", () => {
    const a = card("a", ["backend"])
    const b = card("b", [])
    const groups = groupByLane([a, b], lanes, new CardTree([a, b]))
    expect(groups.map((g) => [g.lane, g.cards.map((c) => c.id)])).toEqual([
      ["frontend", []],
      ["backend", ["a"]],
      ["infra", []],
      [OTHER_LANE, ["b"]],
    ])
  })
})

describe("retagForLane", () => {
  it("swaps the lane tag, keeping the rest", () => {
    expect(retagForLane(["backend", "urgent"], lanes, "frontend")).toEqual([
      "urgent",
      "frontend",
    ])
  })

  it("strips every lane tag ranked above the target, or the card would stay put", () => {
    // In "frontend" (first match); moving to "infra" must drop backend too.
    const moved = retagForLane(["frontend", "backend"], lanes, "infra")
    expect(moved).toEqual(["infra"])
    const c = card("c", moved)
    expect(laneOf(c, lanes, new CardTree([c]))).toBe("infra")
  })

  it("dropping into Other removes every lane tag", () => {
    expect(retagForLane(["frontend", "infra", "x"], lanes, OTHER_LANE)).toEqual(
      ["x"]
    )
  })

  it("moving up a lane drops the old lane tag", () => {
    expect(retagForLane(["infra"], lanes, "backend")).toEqual(["backend"])
  })

  it("dropping into its own lane changes nothing", () => {
    expect(retagForLane(["backend", "x"], lanes, "backend")).toEqual([
      "backend",
      "x",
    ])
  })

  it("matches tags regardless of case and doesn't duplicate", () => {
    expect(retagForLane(["Infra", "frontend"], lanes, "infra")).toEqual([
      "Infra",
    ])
  })
})
