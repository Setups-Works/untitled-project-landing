const fs = require("node:fs/promises");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("../../apps/web/node_modules/@playwright/test");

const root = __dirname;
const output = path.join(root, "slides");
const exportScale = 2;
const chromePath = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function main() {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROME_PATH || (await fs.access(chromePath).then(() => true).catch(() => false)) ? { executablePath: chromePath } : {}),
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: exportScale });
    const fileUrl = pathToFileURL(path.join(root, "index.html")).href;
    for (let slide = 1; slide <= 6; slide++) {
      await page.goto(`${fileUrl}?slide=${slide}&export=1`);
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: path.join(output, `slide-${String(slide).padStart(2, "0")}.png`), scale: "device" });
      process.stdout.write(`Rendered slide ${slide}/6\n`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
