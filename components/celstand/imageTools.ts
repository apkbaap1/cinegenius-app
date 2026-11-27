// In-browser cel prep: split one painting into sky / clouds / scenery,
// key out a flat background behind a character, and lift a jacket onto its own cel.

import { loadImage } from './assets';

const canvasFor = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
};

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

async function pixels(src: string) {
  const img = await loadImage(src);
  const c = canvasFor(img.naturalWidth, img.naturalHeight);
  const g = c.getContext('2d', { willReadFrequently: true })!;
  g.drawImage(img, 0, 0);
  return { c, g, data: g.getImageData(0, 0, c.width, c.height), w: c.width, h: c.height };
}

const toURL = (c: HTMLCanvasElement) => c.toDataURL('image/png');

export interface SplitResult { sky: string; clouds: string; scenery: string; }

/**
 * horizon: 0..1 — where the scenery starts. feather: 0..0.2 soft edge.
 * cloudStrength: 0..1 — how eagerly bright, low-saturation pixels become clouds.
 */
export async function splitBackground(src: string, horizon: number, feather: number, cloudStrength: number): Promise<SplitResult> {
  const { data, w, h } = await pixels(src);
  const px = data.data;
  const sky = new ImageData(w, h);
  const clouds = new ImageData(w, h);
  const scenery = new ImageData(w, h);
  const hy = horizon * h;
  const fy = Math.max(1, feather * h);
  const thrLo = 0.14 - 0.1 * cloudStrength;
  const thrHi = thrLo + 0.16;

  for (let y = 0; y < h; y++) {
    // Mask: 1 = scenery, 0 = sky, soft over the feather band.
    const m = smooth(hy - fy / 2, hy + fy / 2, y);
    // Estimate the clear-sky colour of this row from its darker half
    // (clouds are the bright half), which also fills in behind clouds.
    const row: number[] = [];
    for (let x = 0; x < w; x += 4) {
      const i = (y * w + x) * 4;
      row.push(Math.min(px[i], px[i + 1], px[i + 2]));
    }
    row.sort((a, b) => a - b);
    const cut = row[Math.floor(row.length * 0.4)] ?? 0;
    let r = 0, gg = 0, b = 0, n = 0;
    for (let x = 0; x < w; x += 2) {
      const i = (y * w + x) * 4;
      if (Math.min(px[i], px[i + 1], px[i + 2]) <= cut) { r += px[i]; gg += px[i + 1]; b += px[i + 2]; n++; }
    }
    if (n) { r /= n; gg /= n; b /= n; }
    const rowMin = Math.min(r, gg, b);

    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const R = px[i], G = px[i + 1], B = px[i + 2], A = px[i + 3];
      // scenery cel
      scenery.data[i] = R; scenery.data[i + 1] = G; scenery.data[i + 2] = B;
      scenery.data[i + 3] = A * m;
      // sky base: smooth row colour, opaque (sits behind everything)
      sky.data[i] = r; sky.data[i + 1] = gg; sky.data[i + 2] = b; sky.data[i + 3] = 255;
      // clouds: whiter than the row's clear sky
      const mn = Math.min(R, G, B);
      const mx = Math.max(R, G, B);
      const sat = mx ? (mx - mn) / mx : 0;
      const white = (mn - rowMin) / 255;
      const a = smooth(thrLo, thrHi, white) * (1 - smooth(0.25, 0.5, sat)) * (1 - m);
      clouds.data[i] = R; clouds.data[i + 1] = G; clouds.data[i + 2] = B;
      clouds.data[i + 3] = 255 * a;
    }
  }
  const out = (d: ImageData) => { const c = canvasFor(w, h); c.getContext('2d')!.putImageData(d, 0, 0); return toURL(c); };
  return { sky: out(sky), clouds: out(clouds), scenery: out(scenery) };
}

/** Removes a flat background colour (sampled from the corners) behind a character. */
export async function keyOutBackground(src: string, tolerance = 40, softness = 25): Promise<string> {
  const { c, g, data, w, h } = await pixels(src);
  const px = data.data;
  const corners = [0, w - 1, (h - 1) * w, h * w - 1].map(p => [px[p * 4], px[p * 4 + 1], px[p * 4 + 2]]);
  const key = [0, 1, 2].map(k => corners.reduce((s, c2) => s + c2[k], 0) / 4);
  // Flood from the edges so same-coloured pixels inside the character survive.
  const seen = new Uint8Array(w * h);
  const stack: number[] = [];
  const dist = (p: number) => Math.hypot(px[p * 4] - key[0], px[p * 4 + 1] - key[1], px[p * 4 + 2] - key[2]);
  for (let x = 0; x < w; x++) { stack.push(x, (h - 1) * w + x); }
  for (let y = 0; y < h; y++) { stack.push(y * w, y * w + w - 1); }
  const limit = tolerance + softness;
  while (stack.length) {
    const p = stack.pop()!;
    if (seen[p]) continue;
    const d = dist(p);
    if (d > limit) continue;
    seen[p] = 1;
    const a = smooth(tolerance, limit, d);
    px[p * 4 + 3] = Math.min(px[p * 4 + 3], 255 * a);
    const x = p % w, y = (p / w) | 0;
    if (x > 0) stack.push(p - 1);
    if (x < w - 1) stack.push(p + 1);
    if (y > 0) stack.push(p - w);
    if (y < h - 1) stack.push(p + w);
  }
  g.putImageData(data, 0, 0);
  return toURL(c);
}

/** Copies every pixel close to `hex` onto its own transparent cel (e.g. the jacket). */
export async function isolateColor(src: string, hex: string, tolerance = 60): Promise<string> {
  const { c, g, data } = await pixels(src);
  const px = data.data;
  const t = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  // Compare in a shading-tolerant way: chroma direction matters more than brightness.
  const tn = Math.hypot(t[0], t[1], t[2]) || 1;
  for (let i = 0; i < px.length; i += 4) {
    const n = Math.hypot(px[i], px[i + 1], px[i + 2]) || 1;
    const chroma = Math.hypot(px[i] / n - t[0] / tn, px[i + 1] / n - t[1] / tn, px[i + 2] / n - t[2] / tn) * 255;
    const bright = Math.abs(n - tn) * 0.25;
    const d = chroma + bright;
    const a = 1 - smooth(tolerance * 0.6, tolerance, d);
    px[i + 3] = px[i + 3] * a;
  }
  g.putImageData(data, 0, 0);
  return toURL(c);
}

export async function sampleColor(src: string, fx: number, fy: number): Promise<string> {
  const { data, w, h } = await pixels(src);
  const x = Math.min(w - 1, Math.max(0, Math.round(fx * w)));
  const y = Math.min(h - 1, Math.max(0, Math.round(fy * h)));
  const i = (y * w + x) * 4;
  const hx = (v: number) => v.toString(16).padStart(2, '0');
  return `#${hx(data.data[i])}${hx(data.data[i + 1])}${hx(data.data[i + 2])}`;
}

const cropCache = new Map<string, Promise<string>>();
/** Thumbnail cropped to the visible pixels of a mostly-transparent cel (e.g. a mouth). */
export function cropToContent(src: string, pad = 12): Promise<string> {
  const hit = cropCache.get(src);
  if (hit) return hit;
  const p = (async () => {
    const { c, data, w, h } = await pixels(src);
    const px = data.data;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) {
      if (px[(y * w + x) * 4 + 3] > 20) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    if (x1 < 0) return src;
    x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(w, x1 + pad); y1 = Math.min(h, y1 + pad);
    const out = canvasFor(x1 - x0, y1 - y0);
    out.getContext('2d')!.drawImage(c, x0, y0, x1 - x0, y1 - y0, 0, 0, x1 - x0, y1 - y0);
    return toURL(out);
  })();
  cropCache.set(src, p);
  return p;
}
