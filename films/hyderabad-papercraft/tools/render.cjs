// render.cjs: stills or the full film of the papercraft page, headless (software GL), on the fixed clock.
//   node tools/render.cjs stills 1080x1920 3.5 12 19 ...      -> frames/still-<t>.jpg
//   node tools/render.cjs video 1080x1920 74.2 30 out.mp4      -> silent H.264 MP4 (+ frames/paper.wav, frames/music.wav)
const { chromium } = require('playwright');
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), { spawn } = require('node:child_process');
(async () => {
  const [mode, size, ...rest] = process.argv.slice(2);
  const [W, Hh] = size.split('x').map(Number);
  const root = process.cwd();
  const types = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json' };
  const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); }).listen(8766);
  const b = await chromium.launch({ args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: W, height: Hh } });
  p.on('console', (m) => { const t = m.text(); if (!/GPU stall|willReadFrequently|GL Driver/.test(t)) console.log('  page:', t.slice(0, 400)); });
  p.on('pageerror', (e) => console.log('  ERROR:', e.message));
  const t0 = Date.now();
  await p.goto(`http://localhost:8766/index.html?capture&size=${W}x${Hh}`);
  await p.waitForFunction('window.__papercraft && window.__papercraft.ready', null, { timeout: 1800000, polling: 2000 });
  console.log('ready after', ((Date.now() - t0) / 1000).toFixed(1), 's');
  fs.mkdirSync('frames', { recursive: true });
  const grab = () => p.evaluate(() => document.querySelector('canvas').toDataURL('image/jpeg', 0.93).split(',')[1]);
  if (mode === 'stills') {
    for (const t of rest.map(Number)) {
      const s = Date.now();
      await p.evaluate((t) => { const H = window.__papercraft; H.restart(); H.step(t, 30); }, t);
      fs.writeFileSync(`frames/still-${String(t).padStart(5, '0')}.jpg`, Buffer.from(await grab(), 'base64'));
      console.log('still', t, ((Date.now() - s) / 1000).toFixed(1), 's');
    }
  } else {
    const [dur, fps, out] = [Number(rest[0]), Number(rest[1] || 30), rest[2] || 'frames/film.mp4'];
    const n = Math.round(dur * fps);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    await p.evaluate(() => window.__papercraft.restart());
    const s = Date.now();
    for (let i = 0; i < n; i++) {
      const b64 = await p.evaluate((fps) => { const H = window.__papercraft; H.step(1 / fps, fps); return document.querySelector('canvas').toDataURL('image/jpeg', 0.94).split(',')[1]; }, fps);
      if (!ff.stdin.write(Buffer.from(b64, 'base64'))) await new Promise((r) => ff.stdin.once('drain', r));
      if (i % 150 === 0) console.log(`frame ${i}/${n}  ${((Date.now() - s) / 1000).toFixed(0)} s`);
    }
    ff.stdin.end(); await new Promise((r) => ff.on('close', r));
    const a = await p.evaluate(async (dur) => { const r = await window.__papercraft.renderAudio(dur); return r; }, dur);
    if (a.paperWavB64) fs.writeFileSync('frames/paper.wav', Buffer.from(a.paperWavB64, 'base64'));
    if (a.musicWavB64) fs.writeFileSync('frames/music.wav', Buffer.from(a.musicWavB64, 'base64'));
    console.log('video done', ((Date.now() - s) / 1000).toFixed(0), 's; flaps', a.flapCount);
  }
  await b.close(); srv.close();
})();
