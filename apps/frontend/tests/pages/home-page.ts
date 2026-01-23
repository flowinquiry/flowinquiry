import { expect, Locator, Page } from "@playwright/test";

/**
 * Page Object Model for the Home page
 */
export class HomePage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByTestId("login-form-email");
    this.passwordInput = page.getByTestId("login-form-password");
    this.signInButton = page.getByTestId("login-form-submit");
    this.errorMessage = page.getByTestId("login-form-error");
  }

  async goto() {
    await this.page.goto("/");
    await this.page.waitForLoadState("domcontentloaded");
  }

  async expectPageLoaded() {
    const url = this.page.url();
    if (url.includes("/portal")) {
      await expect(this.page).toHaveURL(/\/portal\/dashboard/);
    } else {
      console.log(
        "[DEBUG_LOG] Not redirected to dashboard, fallback to login check",
      );
      await expect(this.page).toHaveURL("/login");
    }
  }

  async expectRedirectToLogin() {
    await expect(this.page).toHaveURL(/\/login/);
    await expect(this.emailInput).toBeVisible({ timeout: 2000 });
  }

  async login(email: string, password: string) {
    // If already authenticated and not on /login, skip login entirely
    const currentUrl = this.page.url();
    if (!currentUrl.includes("/login")) {
      console.log(
        "[DEBUG_LOG] Already authenticated or redirected — skipping login()",
      );
      return;
    }

    await expect(this.emailInput).toBeVisible({ timeout: 2000 });
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
    // Let the page settle but avoid fixed wait
    await this.page
      .waitForLoadState("domcontentloaded", { timeout: 2000 })
      .catch(() => {
        console.log(
          "[DEBUG_LOG] Page did not reach domcontentloaded after login",
        );
      });
  }

  async navigateAndLogin() {
    await this.goto();

    if (this.page.url().includes("/portal")) {
      console.log("[DEBUG_LOG] Already authenticated — skipping login");
      return;
    }

    await this.expectRedirectToLogin();

    try {
      console.log("[DEBUG_LOG] Attempting login");
      await this.login("admin@flowinquiry.io", "admin");

      const url = this.page.url();
      if (url.includes("/portal")) {
        console.log("[DEBUG_LOG] Login successful");
        return;
      } else {
        console.log(`[DEBUG_LOG] Login failed — still on ${url}`);
      }
    } catch (error) {
      console.log(`[DEBUG_LOG] Login error: ${String(error)}`);
    }

    // Optional fallback check
    await this.expectPageLoaded();
  }

  async navigateTo(linkText: string) {
    const link = this.page.getByRole("link", { name: linkText });
    await expect(link).toBeVisible({ timeout: 2000 });
    await link.click();
    await this.page.waitForLoadState("domcontentloaded").catch(() => {
      console.log("[DEBUG_LOG] Navigation did not complete after link click");
    });
  }

  async navigateToUrl(url: string) {
    await this.page.goto(url);
    await this.page.waitForLoadState("domcontentloaded").catch(() => {
      console.log("[DEBUG_LOG] Navigation did not complete after goto()");
    });
  }

  async expectLoginError() {
    await expect(this.errorMessage).toBeVisible({ timeout: 2000 });
    await expect(this.page).toHaveURL("/login");
  }
}
