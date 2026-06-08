// Renders the real coin/dice CSS (via harness.html, which links the site's own
// tools.css) into sharp STILL images for the Discord bot - one per outcome.
// Run once; commit the output. Re-run only if the coin/dice visuals change.
//
//   cd tools/gif-recorder
//   npm install            (also downloads a headless Chromium)
//   npm run record
//
// Output: Randomize.Web/wwwroot/discord/{coin-heads,coin-tails,die-1..6}.png
import { chromium } from "playwright";
import { fileURLToPath, pathToFileURL } from "node:url";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const harnessUrl = pathToFileURL(path.join(here, "harness.html")).href;
const outDir = path.join(here, "..", "..", "Randomize.Web", "wwwroot", "discord");

const SCALE = 3;   // device pixels - extra crisp; Discord scales down

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: SCALE });
await page.goto(harnessUrl);
const stage = page.locator("#stage");

async function shot(file) {
  await stage.screenshot({ path: path.join(outDir, file), omitBackground: true });
  console.log(`  wrote ${file}`);
}

await mkdir(outDir, { recursive: true });

await page.evaluate(() => window.showCoin());
await page.evaluate(() => window.coinFrame(1, false)); await shot("coin-heads.png");
await page.evaluate(() => window.coinFrame(1, true));  await shot("coin-tails.png");

await page.evaluate(() => window.showDie());
for (let n = 1; n <= 6; n++) {
  await page.evaluate(f => window.dieFrame(f, null), n);
  await shot(`die-${n}.png`);
}

await browser.close();
console.log(`\nDone. 8 stills in ${outDir}`);
