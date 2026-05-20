import { expect, type Page } from "@playwright/test";

export const API_ENDPOINT =
    process.env.VITE_API_URL ?? "http://localhost:5002/graphql";

const API_BASE_URL = new URL(API_ENDPOINT).origin;

export async function signInWithTestSession(
    page: Page,
    options: {
        email: string;
        name: string;
        sub: string;
    },
) {
    const response = await page.request.post(
        `${API_BASE_URL}/__test__/auth/session`,
        {
            data: options,
        },
    );

    expect(response.ok()).toBeTruthy();
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);
}
