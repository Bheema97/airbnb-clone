import { expect, Page, test } from "@playwright/test";

const originalTitle = `Canal Loft ${Date.now()}`;
const updatedTitle = `${originalTitle} Updated`;
let listingId = 0;

async function useDemoUser(page: Page, userId: number) {
  await page.addInitScript((id) => window.localStorage.setItem("stayfinder-demo-user", String(id)), userId);
}

test.describe.serial("host listing management", () => {
  test("switch to a host and see the marketplace-connected dashboard", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("combobox").last().selectOption("2");
    await page.getByRole("link", { name: "Switch to hosting" }).click();
    await expect(page.getByRole("heading", { name: /Welcome back, Marco/ })).toBeVisible();
    await expect(page.getByText("Active listings")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Reservations" })).toBeVisible();
  });

  test("reject an invalid form and create a persistent listing", async ({ page }) => {
    await useDemoUser(page, 2);
    await page.goto("/host/listings/new");
    await page.getByRole("button", { name: "Create listing" }).click();
    await expect(page.getByText("Use at least 5 characters")).toBeVisible();

    await page.getByLabel("Title").fill(originalTitle);
    await page.getByLabel("Description").fill("A bright, original canal-side loft with generous windows, quiet rooms, and an easy walk to neighborhood cafes.");
    await page.getByLabel("Property type").selectOption("Apartment");
    await page.getByLabel("Room type").selectOption("Entire place");
    await page.getByLabel("City").fill("Amsterdam");
    await page.getByLabel("State or region").fill("North Holland");
    await page.getByLabel("Country").fill("Netherlands");
    await page.getByLabel("Nightly price").fill("245");
    await page.getByLabel("Cleaning fee").fill("35");
    await page.getByLabel("Maximum guests").fill("4");
    await page.getByLabel("Image URL").fill("https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900");
    await page.getByLabel("Alt text").fill("Sunlit canal loft living room");
    const nativeFormState = await page.locator("form").last().evaluate((form: HTMLFormElement) => ({ valid: form.checkValidity(), invalid: Array.from(form.elements).filter((element) => element instanceof HTMLInputElement && !element.validity.valid).map((element) => (element as HTMLInputElement).name) }));
    expect(nativeFormState).toEqual({ valid: true, invalid: [] });
    await page.getByRole("button", { name: "Create listing" }).click();
    await expect(page.getByRole("heading", { name: /Welcome back, Marco/ })).toBeVisible();
    const card = page.locator("article").filter({ hasText: originalTitle });
    await expect(card).toBeVisible();
    const href = await card.getByRole("link", { name: "Edit" }).getAttribute("href");
    listingId = Number(href?.match(/listings\/(\d+)\/edit/)?.[1]);
    expect(listingId).toBeGreaterThan(0);
  });

  test("edit title and price and retain the update", async ({ page }) => {
    await useDemoUser(page, 2);
    await page.goto(`/host/listings/${listingId}/edit`);
    await page.getByLabel("Title").fill(updatedTitle);
    await page.getByLabel("Nightly price").fill("275");
    await page.getByRole("button", { name: "Save changes" }).click();
    const card = page.locator("article").filter({ hasText: updatedTitle });
    await expect(card).toBeVisible();
    await expect(card.getByText("$275")).toBeVisible();
    await page.reload();
    await expect(page.locator("article").filter({ hasText: updatedTitle })).toBeVisible();
  });

  test("prevent another host from opening the edit form", async ({ page }) => {
    await useDemoUser(page, 3);
    await page.goto(`/host/listings/${listingId}/edit`);
    await expect(page.getByRole("heading", { name: "This listing belongs to another host" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Save changes" })).toHaveCount(0);
  });

  test("archive and then delete the listing", async ({ page }) => {
    await useDemoUser(page, 2);
    await page.goto("/host");
    let card = page.locator("article").filter({ hasText: updatedTitle });
    page.once("dialog", (dialog) => dialog.accept());
    await card.getByRole("button", { name: "Archive" }).click();
    card = page.locator("article").filter({ hasText: updatedTitle });
    await expect(card.getByText("archived")).toBeVisible();
    page.once("dialog", (dialog) => dialog.accept());
    await card.getByRole("button", { name: "Delete" }).click();
    await expect(page.locator("article").filter({ hasText: updatedTitle })).toHaveCount(0);
  });

  test("keep host dashboard and forms usable at all target widths", async ({ page, request }) => {
    await useDemoUser(page, 2);
    const ownedResponse = await request.get("http://127.0.0.1:8000/api/v1/hosts/2/listings", { headers: { "X-Demo-User-Id": "2" } });
    const owned = await ownedResponse.json();
    for (const viewport of [{ width: 1440, height: 900 }, { width: 768, height: 900 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      for (const route of ["/host", "/host/listings/new", `/host/listings/${owned[0].id}/edit`]) {
        await page.goto(route);
        await expect(page.locator("main")).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      }
    }
  });
});
