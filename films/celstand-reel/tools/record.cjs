// Steps the reel page frame by frame and saves each frame as a JPEG.
// usage: node record.cjs <outDir> [clip]
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const out = process.argv[2]; const clip = process.argv[3] === 'clip';
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(`http://localhost:5173/films/celstand-reel/reel.html?still${clip ? '&clip' : ''}`);
  await p.waitForFunction(() => window.__ready, null, { timeout: 180000 });
  const dur = await p.evaluate(() => window.__duration);
  fs.writeFileSync(`${out}/cues.json`, JSON.stringify(await p.evaluate(() => window.__cues)));
  const fps = 30, n = Math.round(dur * fps);
  const el = await p.$('#reel');
  for (let i = 0; i < n; i++) {
    await p.evaluate(t => window.__seek(t), i / fps);
    await el.screenshot({ path: `${out}/f${String(i).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 94 });
    if (i % 150 === 0) console.log(`frame ${i}/${n}`);
  }
  console.log('done', n, 'frames; errors', JSON.stringify(errs.slice(0, 3)));
  await b.close();
})();
