import { test, expect, type Page } from "@playwright/test"
import {
  addCard,
  card,
  cardPanel,
  cardTitled,
  closeCard,
  column,
  columnCardTitles,
  createBoard,
  dragCardByTitle,
  menu,
  openBoardMenu,
  openCard,
  openCardMenu,
  panelField,
  retitleCard,
} from "../helpers"

/** Adds a sub-task from the open parent's panel and names it. */
async function addSubtask(page: Page, title: string) {
  await cardPanel(page).getByRole("button", { name: "Add sub-task" }).click()
  // The new sub-task opens in the panel, still untitled. Click to focus, as
  // `openCard` does: a panel reused for the next card won't refire autoFocus.
  await expect(panelField(page, "Title")).toHaveValue("")
  await panelField(page, "Title").click()
  await panelField(page, "Title").fill(title)
  await closeCard(page)
  await expect(card(page, title)).toBeVisible()
}

function parentChip(page: Page, childTitle: string, parentTitle: string) {
  return cardTitled(page, childTitle).getByRole("button", {
    name: parentTitle,
  })
}

test.describe("sub-tasks", () => {
  test("adding a sub-task links it to its parent on the board", async ({
    page,
  }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Launch")

    await openCard(page, "Launch")
    await addSubtask(page, "Write docs")

    await expect(parentChip(page, "Write docs", "Launch")).toBeVisible()
    await expect(
      cardTitled(page, "Launch").getByTitle("Sub-tasks done")
    ).toContainText("0/1")

    // Finishing the sub-task moves the parent's progress. A new board's Done
    // column starts marked done.
    // To Do → In Progress → Done
    await dragCardByTitle(page, "Write docs", ["ArrowRight", "ArrowRight"])
    await expect(
      cardTitled(page, "Launch").getByTitle("Sub-tasks done")
    ).toContainText("1/1")
  })

  test("the parent chip opens the parent, and its panel lists the sub-task", async ({
    page,
  }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Launch")
    await openCard(page, "Launch")
    await addSubtask(page, "Write docs")

    await parentChip(page, "Write docs", "Launch").click()
    const subtasks = cardPanel(page).getByRole("list", { name: "Sub-tasks" })
    await expect(
      subtasks.getByRole("button", { name: /Write docs/ })
    ).toBeVisible()

    // And the sub-task's panel leads back up.
    await subtasks.getByRole("button", { name: /Write docs/ }).click()
    await expect(
      cardPanel(page)
        .getByRole("navigation", { name: "Parent cards" })
        .getByRole("button", { name: "Launch" })
    ).toBeVisible()
  })

  test("the card menu links and detaches a parent, but never to a sub-task of its own", async ({
    page,
  }) => {
    await createBoard(page)
    for (const title of ["Epic", "Story"]) {
      await addCard(page, "To Do")
      await retitleCard(page, "Untitled card", title)
    }

    await openCardMenu(page, "Story")
    await menu(page, "Card actions")
      .getByRole("menuitem", { name: "Sub-task of" })
      .click()
    await page.getByRole("menuitem", { name: "Epic" }).click()
    await expect(parentChip(page, "Story", "Epic")).toBeVisible()

    // Epic can't become a sub-task of its own sub-task.
    await openCardMenu(page, "Epic")
    await menu(page, "Card actions")
      .getByRole("menuitem", { name: "Sub-task of" })
      .click()
    await expect(
      menu(page, "Sub-task of").getByRole("textbox", {
        name: "Find a parent card",
      })
    ).toBeVisible()
    await expect(
      menu(page, "Sub-task of").getByRole("menuitem", { name: "Story" })
    ).toHaveCount(0)
    await page.keyboard.press("Escape")
    await page.keyboard.press("Escape")
    // A closed menu stays in the DOM while it animates out.
    await expect(page.getByRole("menu")).toHaveCount(0)

    await openCardMenu(page, "Story")
    await menu(page, "Card actions")
      .getByRole("menuitem", { name: "Sub-task of" })
      .click()
    await page.getByRole("menuitem", { name: "Detach from Epic" }).click()
    await expect(parentChip(page, "Story", "Epic")).toHaveCount(0)
  })

  test("hiding sub-tasks leaves only top-level cards", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Launch")
    await openCard(page, "Launch")
    await addSubtask(page, "Write docs")

    await openBoardMenu(page)
    await page.getByRole("menuitem", { name: "Hide sub-tasks" }).click()
    expect(await columnCardTitles(page, "To Do")).toEqual(["Launch"])

    await openBoardMenu(page)
    await page.getByRole("menuitem", { name: "Show sub-tasks" }).click()
    await expect(column(page, "To Do").getByText("Write docs")).toBeVisible()
  })

  test("deleting a parent trashes its sub-tasks, and undo brings them back", async ({
    page,
  }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await retitleCard(page, "Untitled card", "Launch")
    await openCard(page, "Launch")
    await addSubtask(page, "Write docs")

    await openCardMenu(page, "Launch")
    await menu(page, "Card actions")
      .getByRole("menuitem", { name: "Delete" })
      .click()
    await expect(card(page, "Write docs")).toHaveCount(0)

    await page.getByRole("button", { name: "Undo" }).click()
    await expect(parentChip(page, "Write docs", "Launch")).toBeVisible()
  })
})
