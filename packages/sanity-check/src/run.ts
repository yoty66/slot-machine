/**
 * Standalone sanity check: assumes web + API (and nginx when local) are already running.
 * Validates: page load, session init, roll, cashout.
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
const TIMEOUT_MS = 15_000;
// Pause between steps (ms) so you can watch the flow; set SANITY_STEP_DELAY=0 to disable
const STEP_DELAY_MS = Number(process.env.SANITY_STEP_DELAY) || 1_500;

const delay = (ms: number) =>
  ms > 0 ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve();

async function run(): Promise<void> {
  const browser = await puppeteer.launch({
    headless: HEADLESS,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-web-security",
      "--allow-insecure-localhost",
      // Allow HTTP for non-localhost (e.g. app.local-dev.com); Chrome's HTTPS-First can block otherwise
      "--disable-features=HttpsFirstBalancedModeAutoEnable,HttpsUpgrades,BlockInsecurePrivateNetworkRequests",
    ],
  });

  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(TIMEOUT_MS);

    // 1. Navigate to app
    console.log(`Navigating to ${BASE_URL}...`);
    const response = await page.goto(BASE_URL, {
      waitUntil: "domcontentloaded",
    });
    if (!response || !response.ok()) {
      throw new Error(
        `Page load failed: ${response?.status() ?? "no response"} ${response?.statusText() ?? ""}`,
      );
    }
    await delay(STEP_DELAY_MS);

    // 2. Wait for app to load (session fetched, credit display visible)
    const loadResult = await Promise.race([
      page
        .waitForSelector('[data-testid="credit-display"]', {
          timeout: TIMEOUT_MS,
        })
        .then((el) => ({ type: "ready" as const, el })),
      page
        .waitForSelector('[data-testid="error-screen"]', {
          timeout: TIMEOUT_MS,
        })
        .then(() => ({ type: "error" as const, el: null })),
    ]).catch(() => ({ type: "timeout" as const, el: null }));

    if (loadResult.type === "error") {
      throw new Error("App loaded with error screen");
    }
    if (loadResult.type === "timeout") {
      throw new Error("Credit display not found (timeout)");
    }
    console.log("App loaded: credit display visible.");
    await delay(STEP_DELAY_MS);

    // 3. Verify initial credits
    const initialCredits = await page.$eval(
      '[data-testid="credit-value"]',
      (el) => (el as HTMLElement).innerText,
    );
    if (initialCredits.trim() !== "10") {
      throw new Error(
        `Expected initial credits to be 10, got: ${initialCredits}`,
      );
    }
    console.log("Initial credits OK: 10.");
    await delay(STEP_DELAY_MS);

    // 4. Roll
    const rollBtn = await page.waitForSelector('[data-testid="roll-button"]', {
      timeout: 5_000,
    });
    if (!rollBtn) throw new Error("Roll button not found");
    await rollBtn.click();
    console.log("Clicked roll...");
    await delay(STEP_DELAY_MS);

    // 5. Wait for result feedback (spin animation completes, result shown)
    const resultEl = await page.waitForSelector(
      '[data-testid="result-feedback"]',
      { timeout: TIMEOUT_MS },
    );
    if (!resultEl) throw new Error("Result feedback not found after roll");
    const resultText = await page.evaluate(
      (el) => (el as HTMLElement).innerText,
      resultEl,
    );
    console.log(`Roll result: ${resultText}`);
    await delay(STEP_DELAY_MS);

    // 6. Verify symbols appeared
    const slotBlocks = await page.$$('[data-testid="slot-block"]');
    if (slotBlocks.length !== 3) {
      throw new Error(`Expected 3 slot blocks, found ${slotBlocks.length}`);
    }
    console.log("Symbols displayed: 3 slot blocks visible.");
    await delay(STEP_DELAY_MS);

    // 7. Cashout
    const cashoutBtn = await page.waitForSelector(
      '[data-testid="cashout-button"]',
      { timeout: 5_000 },
    );
    if (!cashoutBtn) throw new Error("Cashout button not found");
    await cashoutBtn.click();
    console.log("Clicked cashout...");
    await delay(STEP_DELAY_MS);

    // 8. Verify cashed out screen
    const cashedOutScreen = await page.waitForSelector(
      '[data-testid="cashed-out-screen"]',
      { timeout: TIMEOUT_MS },
    );
    if (!cashedOutScreen) throw new Error("Cashed out screen not found");

    const cashoutCredits = await page.$eval(
      '[data-testid="cashout-credits"]',
      (el) => (el as HTMLElement).innerText,
    );
    const creditNum = Number(cashoutCredits.trim());
    if (isNaN(creditNum) || creditNum < 0) {
      throw new Error(`Expected valid cashout credits, got: ${cashoutCredits}`);
    }
    console.log(`Cashed out with ${creditNum} credits.`);
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
