import { test, expect } from "@playwright/test"
import { addCard, createBoard, digestRow, setDeadline } from "../helpers"

test.describe("digest", () => {
  test.use({ viewport: { width: 500, height: 800 } })

  test("a card due in a week shows under Upcoming", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await setDeadline(page, "Untitled card", "In a week")

    await page.goto("/digest")
    await expect(digestRow(page, "Untitled card")).toBeVisible()
  })

  test("a card due today shows in the digest", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await setDeadline(page, "Untitled card", "Today")

    await page.goto("/digest")
    await expect(digestRow(page, "Untitled card")).toBeVisible()
  })

  test("a card past its deadline lands in the overdue group", async ({
    page,
  }) => {
    await page.goto("/digest")

    await expect(page.getByRole("heading", { name: "Overdue" })).toBeVisible()
    await expect(digestRow(page, "Connect MCP")).toBeVisible()
  })

  test("a card with no deadline is not shown", async ({ page }) => {
    await createBoard(page)
    await addCard(page, "To Do")

    await page.goto("/digest")
    await expect(digestRow(page, "Untitled card")).toHaveCount(0)
  })

  test("a deadline set before the digest ever opened is still indexed", async ({
    page,
  }) => {
    await createBoard(page)
    await addCard(page, "To Do")
    await setDeadline(page, "Untitled card", "Tomorrow")
    await page.reload()

    await page.goto("/digest")
    await expect(digestRow(page, "Untitled card")).toBeVisible()
  })
})
