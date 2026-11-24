#!/usr/bin/env node
// Render a three-looks page to MP4 (or a single PNG still) deterministically.
// usage: node record.mjs <page.html> [--out out.mp4] [--fps 30] [--from 0] [--to <dur>]
//                                    [--width W --height H] [--still <seconds> --out still.png]
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = await import('playwright')); }

const args = process.argv.slice(2);
const page_ = args.find(a => !a.startsWith('--') && !/^\d/.test(a) && a.endsWith('.html'));
if (!page_) { console.error('usage: node record.mjs <page.html> [--out out.mp4] [--still <s>]'); process.exit(1); }
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const still = opt('still', null);
const out = opt('out', still != null ? 'still.png' : 'out.mp4');

const browser = await chromium.launch({ args: ['--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
page.on('pageerror', e => console.error('[page error]', e.message));
page.on('console', m => { if (m.type() === 'error') console.error('[console]', m.text()); });

const url = pathToFileURL(path.resolve(page_)).href + '?record=1';
await page.goto(url);
await page.waitForFunction(() => window.__film && window.__film.ready, null, { timeout: 60000 });
const film = await page.evaluate(() => ({ ...window.__film }));
const W = +opt('width', film.width), H = +opt('height', film.height);
await page.setViewportSize({ width: W, height: H });
await page.addStyleTag({ content: 'canvas{width:100vw!important;height:100vh!important;}' });

const grab = async (t) => {
  await page.evaluate(t => window.__film.seek(t), t);
  return page.locator('canvas').screenshot({ type: 'png' });
};

if (still != null) {
  const fs = await import('node:fs');
  fs.writeFileSync(out, await grab(parseFloat(still)));
  console.log('wrote', out);
  await browser.close(); process.exit(0);
}

const fps = +opt('fps', film.fps || 30);
const from = +opt('from', 0), to = +opt('to', film.duration);
const frames = Math.round((to - from) * fps);
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
  '-vf', `scale=${W}:${H}:flags=lanczos,format=yuv420p`, '-c:v', 'libx264', '-crf', '18', '-preset', 'medium',
  '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
const t0 = Date.now();
for (let i = 0; i < frames; i++) {
  const buf = await grab(from + i / fps);
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (i % fps === 0) process.stdout.write(`\rframe ${i}/${frames}`);
}
ff.stdin.end();
await new Promise((res, rej) => ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg exit ' + c))));
console.log(`\rwrote ${out}: ${frames} frames in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
await browser.close();
