/**
 * Standalone sanity check: assumes web + API (and nginx when local) are already running.
 * Validates: page load, data fetch, refresh button.
 * Usage: pnpm run sanity (from root) or pnpm run sanity (from this package).
 * Env: .env in this package, or SANITY_APP_URL / HEADLESS in process env.
 */

import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

const BASE_URL = process.env.SANITY_APP_URL ?? "http://localhost:3000";
const HEADLESS = process.env.HEADLESS !== "false";
const EXPECTED_MESSAGE = "Hello from getExample";
const TIMEOUT_MS = 15_000;
// Pause between steps (ms) so you can watch the flow; set SANITY_STEP_DELAY=0 to disable
const STEP_DELAY_MS = Number(process.env.SANITY_STEP_DELAY) || 1_500;

const delay = (ms: number) => (ms > 0 ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve());

async function run(): Promise<void> {
  const browser = await puppeteer.launch({
    headless: HEADLESS,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-web-security",
      "--allow-insecure-localhost",
      // Allow HTTP for non-localhost (e.g. app.local-dev.com); Chrome’s HTTPS-First can block otherwise
      "--disable-features=HttpsFirstBalancedModeAutoEnable,HttpsUpgrades,BlockInsecurePrivateNetworkRequests",
    ],
  });

  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(TIMEOUT_MS);

    console.log(`Navigating to ${BASE_URL}...`);
    const response = await page.goto(BASE_URL, {
      waitUntil: "domcontentloaded",
    });
    if (!response || !response.ok()) {
      throw new Error(
        `Page load failed: ${response?.status() ?? "no response"} ${response?.statusText() ?? ""}`
      );
    }
    await delay(STEP_DELAY_MS);

    // Wait for either success (example-message) or error (example-error)
    const result = await Promise.race([
      page.waitForSelector('[data-testid="example-message"]', { timeout: TIMEOUT_MS }).then((el) => ({ type: "message" as const, el })),
      page.waitForSelector('[data-testid="example-error"]', { timeout: TIMEOUT_MS }).then(() => ({ type: "error" as const, el: null })),
    ]).catch(() => ({ type: "timeout" as const, el: null }));

    if (result.type === "error") {
      const errorText = await page.$eval(
        '[data-testid="example-error-message"]',
        (el) => (el as HTMLElement).innerText
      );
      throw new Error(`Page showed error state: ${errorText}`);
    }
    if (result.type === "timeout" || !result.el) {
      throw new Error("Example message element not found (timeout)");
    }
    const messageEl = result.el;

    const messageText = await page.evaluate(
      (el) => (el as HTMLElement).innerText,
      messageEl
    );
    if (!messageText.includes(EXPECTED_MESSAGE)) {
      throw new Error(
        `Expected message to contain "${EXPECTED_MESSAGE}", got: ${messageText}`
      );
    }
    console.log("Data fetch OK: message visible.");
    await delay(STEP_DELAY_MS);

    // Click Refresh
    const refreshBtn = await page.waitForSelector('[data-testid="example-refresh"]', {
      timeout: 5_000,
    });
    if (!refreshBtn) throw new Error("Refresh button not found");
    await refreshBtn.click();
    await delay(STEP_DELAY_MS);

    // After refresh the page may reload or refetch; wait again for message (or brief loading then message)
    await page.waitForSelector('[data-testid="example-loading"]', { timeout: 2_000 }).catch(() => {});
    const messageElAfter = await page.waitForSelector('[data-testid="example-message"]', {
      timeout: TIMEOUT_MS,
    });
    if (!messageElAfter) throw new Error("Example message not found after refresh");
    const messageTextAfter = await page.evaluate(
      (el) => (el as HTMLElement).innerText,
      messageElAfter
    );
    if (!messageTextAfter.includes(EXPECTED_MESSAGE)) {
      throw new Error(
        `After refresh: expected "${EXPECTED_MESSAGE}", got: ${messageTextAfter}`
      );
    }
    console.log("Refresh button OK: message still visible.");
    await delay(STEP_DELAY_MS);
  } finally {
    await browser.close();
  }
}

run()
  .then(() => {
    console.log("Sanity check passed.");
    process.exit(0);
  })
  .catch((err) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Sanity check failed:", msg);
    process.exit(1);
  });
