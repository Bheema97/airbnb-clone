import { expect, test } from "@playwright/test";

const apiUrl = process.env.PLAYWRIGHT_API_URL || "http://127.0.0.1:8000/api/v1";

test.describe.serial("guest marketplace flow", () => {
  let listingId = 1;
  let listingTitle = "";
  let checkIn = "";
  let checkOut = "";
  let bookingId = 0;

  test("browse, paginate, search, and preserve search context", async ({ page, request }) => {
    const response = await request.get(`${apiUrl}/listings?page_size=12`);
    const data = await response.json();
    listingId = data.items[0].id;
    listingTitle = data.items[0].title;

    await page.goto("/");
    await expect(page.getByText("Remarkable stays, thoughtfully hosted")).toBeVisible();
    await expect(page.getByText(/Page 1 of 2/)).toBeVisible();
    await page.getByRole("button", { name: "Next page" }).click();
    await expect(page).toHaveURL(/page=2/);

    await page.goto("/");
    const city = data.items[0].city;
    await page.getByPlaceholder("Where to?").first().fill(city);
    await page.getByPlaceholder("Where to?").first().press("Enter");
    await expect(page).toHaveURL(new RegExp(`location=${encodeURIComponent(city)}`));
    await expect(page.getByRole("heading", { name: `Stays in ${city}` })).toBeVisible();
    await page.locator(`a[href^="/listings/${listingId}"]`).first().click();
    await expect(page).toHaveURL(/location=/);
  });

  test("show unavailable dates and receive an authoritative quote", async ({ page, request }) => {
    const start = new Date();
    start.setDate(start.getDate() + 55);
    for (let offset = 0; offset < 40; offset += 1) {
      const from = new Date(start); from.setDate(start.getDate() + offset);
      const to = new Date(from); to.setDate(from.getDate() + 2);
      const format = (date: Date) => date.toISOString().slice(0, 10);
      const quoteResponse = await request.post(`${apiUrl}/bookings/quote`, { data: { listing_id: listingId, check_in: format(from), check_out: format(to), guest_count: 1 } });
      const quote = await quoteResponse.json();
      if (quote.is_available) { checkIn = format(from); checkOut = format(to); break; }
    }
    expect(checkIn).not.toBe("");

    await page.goto(`/listings/1`);
    await expect(page.locator(".line-through").first()).toBeVisible();
    await page.goto(`/listings/${listingId}?check_in=${checkIn}&check_out=${checkOut}&guests=1`);
    const visibleBookingWidget = page.locator("#booking-widget:visible");
    await expect(visibleBookingWidget.getByText("Total", { exact: true })).toBeVisible();
    await visibleBookingWidget.getByRole("button", { name: "Reserve" }).click();
    await expect(page).toHaveURL(/\/checkout\//);
  });

  test("complete checkout, show confirmation, and list the trip", async ({ page }) => {
    await page.goto(`/checkout/${listingId}?check_in=${checkIn}&check_out=${checkOut}&guests=1`);
    await page.getByLabel(/I agree to the House Rules/).check();
    await page.getByRole("button", { name: "Confirm and pay" }).click();
    await expect(page.getByText("Your stay is all set")).toBeVisible();
    bookingId = Number(page.url().match(/booking-confirmation\/(\d+)/)?.[1]);
    expect(bookingId).toBeGreaterThan(0);
    await page.getByRole("link", { name: "View My Trips" }).click();
    await expect(page.getByText(listingTitle).first()).toBeVisible();
  });

  test("surface a stale-date conflict", async ({ page }) => {
    await page.goto(`/checkout/${listingId}?check_in=${checkIn}&check_out=${checkOut}&guests=1`);
    await expect(page.getByRole("heading", { name: "Dates Unavailable" })).toBeVisible();
    await expect(page.getByRole("link", { name: /select new dates/i })).toHaveAttribute("href", /check_in=/);
  });

  test("add and remove a favorite", async ({ page, request }) => {
    const favoritesResponse = await request.get(`${apiUrl}/users/1/favorites`, { headers: { "X-Demo-User-Id": "1" } });
    const favorites = await favoritesResponse.json();
    const listingsResponse = await request.get(`${apiUrl}/listings?page_size=50`);
    const listings = (await listingsResponse.json()).items;
    const target = listings.find((listing: { id: number }) => !favorites.some((favorite: { listing_id: number }) => favorite.listing_id === listing.id));
    await page.goto(`/listings/${target.id}`);
    await expect(page.getByRole("combobox").last()).toBeEnabled();
    await expect(page.getByRole("button", { name: "Add to favorites" })).toBeEnabled();
    const [addResponse] = await Promise.all([
      page.waitForResponse((response) => response.url().endsWith(`/users/1/favorites/${target.id}`) && response.request().method() === "POST"),
      page.getByRole("button", { name: "Add to favorites" }).click(),
    ]);
    expect(addResponse.status()).toBe(201);
    await page.goto("/favorites");
    await expect(page.getByText(target.title)).toBeVisible();
    await page.locator(`a[href="/listings/${target.id}"]`).getByRole("button", { name: "Remove from favorites" }).click();
    await expect(page.getByText(target.title)).toHaveCount(0);
  });

  test("remain usable without page overflow at desktop, tablet, and mobile widths", async ({ page }) => {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 768, height: 900 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      await page.goto("/");
      await expect(page.getByRole("heading", { name: "Remarkable stays, thoughtfully hosted" })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await page.goto(`/listings/${listingId}`);
      await expect(page.getByRole("heading", { name: listingTitle })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      for (const route of [`/checkout/${listingId}?check_in=${checkIn}&check_out=${checkOut}&guests=1`, `/booking-confirmation/${bookingId}`, "/trips", "/favorites"]) {
        await page.goto(route);
        await expect(page.locator("main")).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      }
    }
  });
});
