const fs = require("node:fs/promises");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("../../apps/web/node_modules/@playwright/test");

const root = __dirname;
const outputDir = path.join(root, "slides");
const exportScale = 2;
const chromePath = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const SLIDE_NAMES = [
  "bento-01-workspace.png",
  "bento-02-knowledge.png",
  "bento-03-ecosystem.png",
];

async function main() {
  await fs.mkdir(outputDir, { recursive: true });
  // Clean old slide pngs
  const oldFiles = await fs.readdir(outputDir).catch(() => []);
  for (const f of oldFiles) {
    if (f.endsWith(".png")) await fs.unlink(path.join(outputDir, f)).catch(() => {});
  }

  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROME_PATH || (await fs.access(chromePath).then(() => true).catch(() => false)) ? { executablePath: chromePath } : {}),
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: exportScale });
    const fileUrl = pathToFileURL(path.join(root, "index.html")).href;

    for (let slide = 1; slide <= SLIDE_NAMES.length; slide++) {
      await page.goto(`${fileUrl}?slide=${slide}&export=1`);
      await page.evaluate(() => document.fonts.ready);
      const filename = SLIDE_NAMES[slide - 1];
      const targetPath = path.join(outputDir, filename);
      await page.screenshot({ path: targetPath, scale: "device" });
      process.stdout.write(`Rendered ${filename} (${slide}/${SLIDE_NAMES.length})\n`);

      if (slide === 1) {
        await fs.copyFile(targetPath, path.join(root, "bento-landscape.png"));
      }
    }
    process.stdout.write("All 3 landscape Bento slides successfully rendered!\n");
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
