import { chromium } from "@playwright/test";
import fs from "fs/promises";
import path from "path";

import config from "./playwright.config";
import { HomePage } from "./tests/pages/home-page";

// Determine base URL from config.webServer
function resolveWebServerUrl(): string {
  if (!config.webServer) return "http://localhost:3000";
  return Array.isArray(config.webServer)
    ? config.webServer[0]?.url || "http://localhost:3000"
    : config.webServer.url || "http://localhost:3000";
}

const webServerUrl = resolveWebServerUrl();

/**
 * Authenticates a user and saves the Playwright storage state to a file.
 */
async function authenticateUser(
  email: string,
  password: string,
  filename: string,
) {
  console.log(`[DEBUG] Authenticating user: ${email}`);

  const browser = await chromium.launch();
  const context = await browser.newContext({
    baseURL: webServerUrl,
  });
  const page = await context.newPage();
  const homePage = new HomePage(page);

  try {
    await page.goto("/login");

    await homePage.login(email, password);

    // Wait for successful redirect to portal
    await page.waitForURL("**/portal", { timeout: 10_000 });

    // Confirm session cookie is saved
    const cookies = await context.cookies();
    const sessionCookie = cookies.find((c) => c.name.includes("session-token"));
    if (!sessionCookie) {
      throw new Error(`[ERROR] No session-token found for ${email}`);
    }

    console.log(`[DEBUG] Login successful for ${email}, saving auth state...`);

    const authDir = path.resolve("playwright/.auth");
    await fs.mkdir(authDir, { recursive: true });
    await fs.writeFile(
      path.join(authDir, filename),
      JSON.stringify(await context.storageState(), null, 2),
    );
  } catch (error) {
    console.error(`[ERROR] Failed to authenticate user ${email}:`, error);
    process.exit(1); // 🔥 Fail CI early
  } finally {
    await browser.close();
  }
}

/**
 * Global setup function to authenticate test users and prepare storage states.
 */
export default async function globalSetup() {
  await authenticateUser("admin@flowinquiry.io", "admin", "admin.json");
  // await authenticateUser("user@flowinquiry.io", "user1234", "user.json");

  // Create an unauthenticated session state
  const authDir = path.resolve("playwright/.auth");
  await fs.mkdir(authDir, { recursive: true });
  await fs.writeFile(
    path.join(authDir, "unauthenticated.json"),
    JSON.stringify({ cookies: [], origins: [] }, null, 2),
  );
}
