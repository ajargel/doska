import { test, expect, type Locator, type Page } from "@playwright/test"
import {
  addCard,
  addCardTags,
  card,
  cardPanel,
  closeCard,
  createBoard,
  menu,
  openBoardMenu,
  openCard,
  openCardMenu,
  panelField,
  retitleCard,
} from "../helpers"

/**
 * Lanes split the board into a row per tag, so every column appears once per
 * lane as "<column> in <lane>". Moving between lanes is vertical, which the
 * keyboard drag can't do (it only moves across), so these drive the pointer.
 */

function laneCell(page: Page, columnName: string, lane: string) {
  return page.getByRole("group", {
    name: `${columnName} in ${lane}`,
    exact: true,
  })
}

function tagChip(target: Locator, tag: string) {
  return target.getByTitle(`Show cards tagged #${tag}`)
}

async function boardWithCards(page: Page, cards: Record<string, string[]>) {
  await createBoard(page)
  for (const [title, tags] of Object.entries(cards)) {
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", title)
    if (tags.length > 0) await addCardTags(page, title, tags)
  }
}

async function showLanes(page: Page, tags: string[]) {
  await openBoardMenu(page)
  await page.getByRole("menuitem", { name: "Swimlanes…" }).click()
  const dialog = page.getByRole("dialog")
  await dialog.getByRole("checkbox", { name: "Show swimlanes" }).click()
  // Typed, so a lane needn't be a tag some card already has.
  const input = dialog.getByRole("textbox", { name: "Add tag" })
  for (const tag of tags) {
    await input.fill(tag)
    await input.press("Enter")
  }
  await expect(
    dialog.getByRole("list", { name: "Lanes" }).getByRole("listitem")
  ).toHaveCount(tags.length + 1)
  await page.keyboard.press("Escape")
  await expect(dialog).toBeHidden()
}

async function dragInto(page: Page, title: string, target: Locator) {
  await expect(card(page, title)).toBeVisible()
  await expect(target).toBeVisible()
  const from = await card(page, title).boundingBox()
  const to = await target.boundingBox()
  if (!from || !to) throw new Error("nothing to drag between")
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
  await page.mouse.down()
  // Past the drag threshold first, then glide.
  await page.mouse.move(
    from.x + from.width / 2 + 20,
    from.y + from.height / 2,
    {
      steps: 5,
    }
  )
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, {
    steps: 20,
  })
  await page.waitForTimeout(250)
  await page.mouse.up()
  await page.waitForTimeout(400) // the drop animation
}

test.describe("swimlanes", () => {
  test("a card sits in the first lane it's tagged for, the rest in Other", async ({
    page,
  }) => {
    await boardWithCards(page, {
      Alpha: ["frontend"],
      Beta: ["backend", "frontend"],
      Gamma: [],
    })
    await showLanes(page, ["frontend", "backend"])

    const frontend = laneCell(page, "To Do", "#frontend")
    await expect(frontend.getByText("Alpha")).toBeVisible()
    // Lane order decides, not the card's tag order.
    await expect(frontend.getByText("Beta")).toBeVisible()
    await expect(
      laneCell(page, "To Do", "Other").getByText("Gamma")
    ).toBeVisible()
    await expect(
      laneCell(page, "To Do", "#backend").locator("[data-rfd-draggable-id]")
    ).toHaveCount(0)
  })

  test("dragging a card into another lane swaps its tag", async ({ page }) => {
    await boardWithCards(page, { Alpha: ["frontend"], Gamma: [] })
    await showLanes(page, ["frontend", "backend"])

    await dragInto(page, "Alpha", laneCell(page, "To Do", "#backend"))

    const backend = laneCell(page, "To Do", "#backend")
    await expect(backend.getByText("Alpha")).toBeVisible()
    await expect(tagChip(card(page, "Alpha"), "backend")).toBeVisible()
    await expect(tagChip(card(page, "Alpha"), "frontend")).toHaveCount(0)

    // And into Other takes the lane tag off.
    await dragInto(page, "Alpha", laneCell(page, "To Do", "Other"))
    await expect(
      laneCell(page, "To Do", "Other").getByText("Alpha")
    ).toBeVisible()
    await expect(tagChip(card(page, "Alpha"), "backend")).toHaveCount(0)
  })

  test("a card added in a lane starts with its tag", async ({ page }) => {
    await boardWithCards(page, { Alpha: ["backend"] })
    await showLanes(page, ["backend"])

    await page
      .getByRole("button", { name: "Add card to To Do in #backend" })
      .click()

    const backend = laneCell(page, "To Do", "#backend")
    await expect(backend.getByText("Untitled card")).toBeVisible()
    await expect(tagChip(card(page, "Untitled card"), "backend")).toBeVisible()
  })

  test("a sub-task rides in its top-level card's lane and can't be dragged out", async ({
    page,
  }) => {
    await boardWithCards(page, { Launch: ["frontend"] })
    await openCard(page, "Launch")
    await cardPanel(page).getByRole("button", { name: "Add sub-task" }).click()
    await expect(panelField(page, "Title")).toHaveValue("")
    await panelField(page, "Title").click()
    await panelField(page, "Title").fill("Write docs")
    await closeCard(page)
    await showLanes(page, ["frontend"])

    const frontend = laneCell(page, "To Do", "#frontend")
    await expect(frontend.getByText("Write docs")).toBeVisible()

    await dragInto(page, "Write docs", laneCell(page, "To Do", "Other"))
    await expect(frontend.getByText("Write docs")).toBeVisible()
    await expect(tagChip(card(page, "Write docs"), "frontend")).toHaveCount(0)
  })

  test("the card menu moves a card between lanes, for keyboard users too", async ({
    page,
  }) => {
    await boardWithCards(page, { Alpha: ["frontend"] })
    await showLanes(page, ["frontend", "backend"])

    await openCardMenu(page, "Alpha")
    await menu(page, "Card actions")
      .getByRole("menuitem", { name: "Move to lane" })
      .click()
    await page.getByRole("menuitem", { name: "#backend" }).click()

    const backend = laneCell(page, "To Do", "#backend")
    await expect(backend.getByText("Alpha")).toBeVisible()
    await expect(tagChip(card(page, "Alpha"), "backend")).toBeVisible()
    await expect(tagChip(card(page, "Alpha"), "frontend")).toHaveCount(0)
  })

  test("a sub-task's menu offers no lane of its own", async ({ page }) => {
    await boardWithCards(page, { Launch: ["frontend"] })
    await openCard(page, "Launch")
    await cardPanel(page).getByRole("button", { name: "Add sub-task" }).click()
    await expect(panelField(page, "Title")).toHaveValue("")
    await panelField(page, "Title").click()
    await panelField(page, "Title").fill("Write docs")
    await closeCard(page)
    await showLanes(page, ["frontend"])

    await openCardMenu(page, "Write docs")
    await expect(
      menu(page, "Card actions").getByRole("menuitem", {
        name: "Lane follows its top-level card",
      })
    ).toBeDisabled()
  })

  test("a collapsed lane stays collapsed after a reload", async ({ page }) => {
    await boardWithCards(page, { Alpha: ["frontend"] })
    await showLanes(page, ["frontend"])

    const header = page.getByRole("button", { name: /^#frontend/ })
    await header.click()
    await expect(header).toHaveAttribute("aria-expanded", "false")
    await expect(laneCell(page, "To Do", "#frontend")).toHaveCount(0)

    await page.reload()
    await expect(
      page.getByRole("button", { name: /^#frontend/ })
    ).toHaveAttribute("aria-expanded", "false")
    await expect(laneCell(page, "To Do", "Other")).toBeVisible()
  })
})
