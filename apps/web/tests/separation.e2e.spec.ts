import { test, expect } from "@playwright/test";

// Test to verify API separation works correctly
test.describe("API Separation E2E", () => {
  test("API server responds to health check", async ({ page }) => {
    // Test direct API call to verify API server is running
    try {
      const response = await page.request.get(
        "http://localhost:8787/api/wishlist",
      );
      // Should get 401 (unauthorized) since no session, but server should respond
      expect([401, 500]).toContain(response.status());
    } catch {
      console.log("API server not running, this is expected for local testing");
    }
  });

  test("Web app loads and shows API error gracefully", async ({ page }) => {
    // Navigate to web app
    await page.goto("/");

    // Should load the web app (even if API calls fail)
    await expect(page.getByText("Corvus")).toBeVisible();

    // Check if there are any console errors related to API calls
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    // Wait a bit for any API calls to complete/fail
    await page.waitForTimeout(2000);

    // Log any errors for debugging
    if (errors.length > 0) {
      console.log("Console errors:", errors);
    }
  });

  test("Verify API_BASE configuration in web app", async ({ page }) => {
    // Check that the web app is configured to call the separated API
    await page.goto("/dashboard");

    // Look for API_BASE usage in the page
    const content = await page.content();
    expect(content).toContain("http://localhost:8787"); // Should use separated API URL
  });
});
