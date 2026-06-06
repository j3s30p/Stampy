import puppeteer from 'puppeteer';

const BASE = 'http://localhost:8083';
const OUT = '/tmp/stampy-shots';
const VIEWPORT = { width: 390, height: 844, deviceScaleFactor: 2 };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function shootRoute(browser, route, file, { settleMs = 1600, beforeShot } = {}) {
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);
  await page.goto(BASE + route, { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(settleMs);
  if (beforeShot) await beforeShot(page);
  await page.screenshot({ path: `${OUT}/${file}`, fullPage: false });
  await page.close();
  console.log('shot', file);
}

async function shootSplash(browser) {
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(500);
  await page.screenshot({ path: `${OUT}/00-splash.png`, fullPage: false });
  await page.close();
  console.log('shot 00-splash.png');
}

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  await shootSplash(browser);
  await shootRoute(browser, '/', '01-home.png');
  await shootRoute(browser, '/map', '02-map.png');
  await shootRoute(browser, '/stamp', '03-stamp.png');
  await shootRoute(browser, '/ranking', '04-ranking.png');
  await shootRoute(browser, '/my', '05-my.png');
  // Spot detail — go via home so useMockFlow has a selected spot
  const detail = await browser.newPage();
  await detail.setViewport(VIEWPORT);
  await detail.goto(BASE + '/', { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(1600);
  await detail.evaluate(() => {
    const card = [...document.querySelectorAll('[role="button"]')].find((el) =>
      el.getAttribute('aria-label')?.includes('상세 보기'),
    );
    card?.click();
  });
  await sleep(1200);
  await detail.screenshot({ path: `${OUT}/06-spot-detail.png`, fullPage: false });
  console.log('shot 06-spot-detail.png');
  await detail.close();

  await browser.close();
})();
