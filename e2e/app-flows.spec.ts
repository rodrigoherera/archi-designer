import { expect, test, type Page } from "@playwright/test";

async function dragBlockToCanvas(page: Page, blockTestId: string, x: number, y: number) {
  const block = page.getByTestId(blockTestId);
  const canvas = page.getByTestId("canvas");
  const canvasBox = await canvas.boundingBox();
  if (!canvasBox) throw new Error("Canvas is not visible");
  await block.dragTo(canvas, {
    targetPosition: { x: x - canvasBox.x, y: y - canvasBox.y },
  });
}

async function acceptNextPrompt(page: Page, value: string) {
  page.once("dialog", async (dialog) => {
    expect(dialog.type()).toBe("prompt");
    await dialog.accept(value);
  });
}

test.describe("Archi Designer browser flows", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("creates and manages workspace pages from the toolbar", async ({ page }) => {
    await expect(page.getByTestId("page-select")).toContainText("Main");

    await acceptNextPrompt(page, "Security");
    await page.getByTestId("new-page").click();
    await expect(page.getByTestId("page-select")).toHaveValue(/p/);
    await expect(page.getByTestId("page-select")).toContainText("Security");

    await page.getByRole("button", { name: "Page" }).click();
    await acceptNextPrompt(page, "Threat Model");
    await page.getByRole("button", { name: "Rename page" }).click();
    await expect(page.getByTestId("page-select")).toContainText("Threat Model");

    await page.getByRole("button", { name: "Page" }).click();
    await page.getByRole("button", { name: "Duplicate page" }).click();
    await expect(page.getByTestId("page-select")).toContainText("Threat Model copy");

    await page.getByRole("button", { name: "Page" }).click();
    await page.getByRole("button", { name: "Delete page" }).click();
    await expect(page.getByTestId("page-select")).not.toContainText("Threat Model copy");
  });

  test("edits architecture metadata in the inspector and exports markdown", async ({
    page,
  }) => {
    await dragBlockToCanvas(page, "block-server", 420, 260);
    await page.locator(".react-flow__node").filter({ hasText: "Server" }).click();

    await page.getByLabel("Category").fill("compute");
    await page.getByLabel("Environment").fill("production");
    await page.getByLabel("Trust zone").fill("public");
    await page.getByLabel("Data classification").fill("user-data");

    await page.getByRole("button", { name: "More", exact: true }).click();
    await page.getByRole("button", { name: "Export" }).hover();
    await acceptNextPrompt(page, "architecture-summary");
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export Markdown" }).click();

    const text = await (await download).createReadStream().then(
      (stream) =>
        new Promise<string>((resolve, reject) => {
          const chunks: Buffer[] = [];
          stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
          stream.on("error", reject);
          stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
        })
    );

    expect(text).toContain("# Architecture Summary");
    expect(text).toContain("| Server | compute | production | public | user-data |");
  });
});
