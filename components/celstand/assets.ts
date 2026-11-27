// Image and audio caches shared by the editor, renderer and exporter.

const images = new Map<string, HTMLImageElement>();
const pending = new Map<string, Promise<HTMLImageElement>>();
const listeners = new Set<() => void>();

export const onAssetLoaded = (fn: () => void) => {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
};

export function loadImage(src: string): Promise<HTMLImageElement> {
  const done = images.get(src);
  if (done) return Promise.resolve(done);
  const p = pending.get(src);
  if (p) return p;
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      images.set(src, img);
      pending.delete(src);
      listeners.forEach(l => l());
      resolve(img);
    };
    img.onerror = () => { pending.delete(src); reject(new Error('Could not load image')); };
    img.src = src;
  });
  pending.set(src, promise);
  return promise;
}

/** Returns the image if it is ready, otherwise starts loading it. */
export function getImage(src?: string): HTMLImageElement | undefined {
  if (!src) return undefined;
  const img = images.get(src);
  if (!img) loadImage(src).catch(() => {});
  return img;
}

// ---- Jacket recolouring -------------------------------------------------
// Keeps the cel's own shading (luminance) and replaces hue/saturation with the
// chosen colour, via the 'color' blend mode, then restores the cel's alpha.

const tintCache = new Map<string, HTMLCanvasElement>();

export function getTinted(src: string, color: string, strength: number): CanvasImageSource | undefined {
  const img = getImage(src);
  if (!img) return undefined;
  if (!color || strength <= 0) return img;
  const key = `${src.length}:${src.slice(-64)}|${color}|${strength.toFixed(2)}`;
  const hit = tintCache.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const g = c.getContext('2d')!;
  g.drawImage(img, 0, 0);
  g.globalAlpha = strength;
  g.globalCompositeOperation = 'color';
  g.fillStyle = color;
  g.fillRect(0, 0, c.width, c.height);
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'destination-in';
  g.drawImage(img, 0, 0);
  if (tintCache.size > 60) tintCache.clear();
  tintCache.set(key, c);
  return c;
}

// ---- Audio --------------------------------------------------------------

let ctx: AudioContext | null = null;
export const audioContext = () => {
  if (!ctx) ctx = new AudioContext();
  return ctx;
};

const buffers = new Map<string, AudioBuffer>();
const envelopes = new Map<string, Float32Array>();
/** Envelope samples per second. */
export const ENV_RATE = 100;

export async function decodeAudio(src: string): Promise<AudioBuffer> {
  const hit = buffers.get(src);
  if (hit) return hit;
  const res = await fetch(src);
  const data = await res.arrayBuffer();
  const buf = await audioContext().decodeAudioData(data);
  buffers.set(src, buf);
  envelopes.set(src, computeEnvelope(buf));
  listeners.forEach(l => l());
  return buf;
}

export const getBuffer = (src: string) => buffers.get(src);
export const getEnvelope = (src: string) => envelopes.get(src);

/** RMS loudness, normalised so the loudest moment of the clip is 1. */
function computeEnvelope(buf: AudioBuffer): Float32Array {
  const ch = buf.getChannelData(0);
  const hop = Math.max(1, Math.floor(buf.sampleRate / ENV_RATE));
  const n = Math.ceil(ch.length / hop);
  const env = new Float32Array(n);
  let peak = 1e-6;
  for (let i = 0; i < n; i++) {
    let sum = 0;
    const s0 = i * hop;
    const s1 = Math.min(ch.length, s0 + hop);
    for (let s = s0; s < s1; s++) sum += ch[s] * ch[s];
    const v = Math.sqrt(sum / Math.max(1, s1 - s0));
    env[i] = v;
    if (v > peak) peak = v;
  }
  for (let i = 0; i < n; i++) env[i] /= peak;
  return env;
}

export const fileToDataURL = (file: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
