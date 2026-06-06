import puppeteer from 'puppeteer';

const BASE = 'http://localhost:8083';
const OUT = '/tmp/stampy-shots';
const VIEWPORT = { width: 390, height: 844, deviceScaleFactor: 2 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function clickByLabel(page, partial) {
  const handle = await page.evaluateHandle((needle) => {
    const els = [...document.querySelectorAll('[role="button"], [aria-label]')];
    return els.find((el) => el.getAttribute('aria-label')?.includes(needle)) ?? null;
  }, partial);
  const el = handle.asElement();
  if (!el) {
    console.log('!! not found:', partial);
    return false;
  }
  await el.click();
  await sleep(700);
  return true;
}

async function shot(page, file) {
  await page.screenshot({ path: `${OUT}/${file}`, fullPage: false });
  console.log('shot', file);
}

async function fullPageShot(page, file) {
  await page.screenshot({ path: `${OUT}/${file}`, fullPage: true });
  console.log('shot (full)', file);
}

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);

  // 1. Initial load + full home (scroll-through)
  await page.goto(BASE + '/', { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(1700);
  await fullPageShot(page, 'i-01-home-full.png');

  // 2. Click "근처에서 찍을 수 있어요" first card (경복궁 상세)
  await clickByLabel(page, '경복궁 상세 보기');
  await sleep(900);
  await fullPageShot(page, 'i-02-detail-gyeongbok-full.png');

  // 3. From detail, click "도장 화면으로 이동"
  await clickByLabel(page, '도장 화면으로 이동');
  await sleep(900);
  await fullPageShot(page, 'i-03-stamp-from-detail.png');

  // 4. Go back home, click 북촌한옥마을
  await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
  await sleep(1300);
  await clickByLabel(page, '북촌한옥마을 상세 보기');
  await sleep(900);
  await fullPageShot(page, 'i-04-detail-bukchon-full.png');

  // 5. Map tab — interact with pins
  await page.goto(BASE + '/map', { waitUntil: 'networkidle2' });
  await sleep(1300);
  await fullPageShot(page, 'i-05-map-default.png');

  // Click 봄빛 행사 pin (different status)
  await clickByLabel(page, '봄빛 행사 지도 핀 선택');
  await sleep(700);
  await shot(page, 'i-06-map-pin-bomvit.png');

  // Click list item bottom
  await page.evaluate(() => window.scrollTo(0, 800));
  await sleep(300);
  await shot(page, 'i-07-map-list-bottom.png');

  // 6. Stamp tab — verify disabled state
  await page.goto(BASE + '/stamp', { waitUntil: 'networkidle2' });
  await sleep(1300);
  await fullPageShot(page, 'i-08-stamp-full.png');

  // 7. Ranking tab — click through 주간/지역/친구
  await page.goto(BASE + '/ranking', { waitUntil: 'networkidle2' });
  await sleep(1300);
  await fullPageShot(page, 'i-09-ranking-weekly.png');

  await clickByLabel(page, '지역 랭킹 보기');
  await sleep(600);
  await fullPageShot(page, 'i-10-ranking-region.png');

  await clickByLabel(page, '친구 랭킹 보기');
  await sleep(600);
  await fullPageShot(page, 'i-11-ranking-friends.png');

  // Click on a ranking entry (not me)
  await clickByLabel(page, '한강러너 랭킹 선택');
  await sleep(500);
  await shot(page, 'i-12-ranking-friend-selected.png');

  // 8. MY tab — full + click setting row + click stamp from list
  await page.goto(BASE + '/my', { waitUntil: 'networkidle2' });
  await sleep(1300);
  await fullPageShot(page, 'i-13-my-full.png');

  await clickByLabel(page, '알림 설정');
  await sleep(400);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await sleep(300);
  await shot(page, 'i-14-my-setting-clicked.png');

  await browser.close();
})();
