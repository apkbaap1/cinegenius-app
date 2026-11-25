#!/usr/bin/env node
// Render a player page (window.seek, window.DURATION, window.STYLE) to MP4 with its synthesized score.
// usage: node render.mjs <page.html> [--out out.mp4] [--fps 30] [--from 0] [--to <dur>] [--still <s> --out x.png]
//        [--samples N] (override the style's count, e.g. 16 for storyboard stills) [--no-audio]
import { spawn } from 'node:child_process'; import { createRequire } from 'node:module';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
let chromium; try { ({ chromium } = require('playwright')); } catch { ({ chromium } = await import('playwright')); }

const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const src = args.find((a) => a.endsWith('.html'));
if (!src) { console.error('usage: node render.mjs <page.html> [--out out.mp4]'); process.exit(1); }
const still = opt('still', null), out = opt('out', still != null ? 'still.png' : 'out.mp4');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-gpu', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('pageerror', (e) => console.error('[page error]', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.error('[console]', m.text()); });
await page.goto(pathToFileURL(path.resolve(src)).href + '?render=1');
await page.waitForFunction(() => window.READY, null, { timeout: 180000 });
const D = await page.evaluate(() => window.DURATION), samples = opt('samples', null);
const grab = async (t) => {
  const b64 = await page.evaluate(([t, n]) => { window.seek(t, n ? +n : undefined); return document.querySelector('canvas').toDataURL('image/png').split(',')[1]; }, [t, samples]);
  return Buffer.from(b64, 'base64');
};
if (still != null) { fs.writeFileSync(out, await grab(+still)); console.log('wrote', out); await browser.close(); process.exit(0); }

const fps = +opt('fps', 30), from = +opt('from', 0), to = +opt('to', D), frames = Math.round((to - from) * fps);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'looks-')), vid = path.join(tmp, 'v.mp4'), wav = path.join(tmp, 'a.f32');
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-', '-c:v', 'libx264', '-crf', '17', '-preset', 'medium', '-pix_fmt', 'yuv420p', vid], { stdio: ['pipe', 'inherit', 'inherit'] });
const t0 = Date.now();
for (let i = 0; i < frames; i++) {
  const buf = await grab(from + i / fps);
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  if (i % fps === 0) process.stdout.write(`\rframe ${i}/${frames}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
ff.stdin.end(); await new Promise((ok, no) => ff.on('close', (c) => (c ? no(new Error('ffmpeg ' + c)) : ok())));
const run = (a) => new Promise((ok, no) => spawn('ffmpeg', a, { stdio: 'inherit' }).on('close', (c) => (c ? no(new Error('ffmpeg ' + c)) : ok())));
if (args.includes('--no-audio')) fs.copyFileSync(vid, out);
else {
  const b64 = await page.evaluate(async (D) => {
    const r = await window.SOUND.renderOffline((k) => window.STYLE.sound(k), D, 48000, { voiceover: false });
    const u8 = new Uint8Array(r.inter.buffer); let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return btoa(s);
  }, D);
  fs.writeFileSync(wav, Buffer.from(b64, 'base64'));
  await run(['-y', '-loglevel', 'error', '-i', vid, '-f', 'f32le', '-ar', '48000', '-ac', '2', '-ss', String(from), '-t', String(to - from), '-i', wav,
    '-af', 'loudnorm=I=-15:TP=-1.5:LRA=11', '-ar', '48000', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out]);
}
console.log(`\rwrote ${out}: ${frames} frames in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
await browser.close(); fs.rmSync(tmp, { recursive: true, force: true });
