// Frame-accurate MP4 export (H.264 video + AAC audio) using WebCodecs.
// Every frame is rendered at its exact time, so nothing is dropped even on a
// slow machine. Browsers without WebCodecs fall back to real-time recording.

import { Scene } from './types';
import { decodeAudio, getBuffer, loadImage } from './assets';
import { renderFrame, stageSize } from './renderer';
import { linkFactor } from './playback';

const H264 = ['avc1.640028', 'avc1.4d0028', 'avc1.42e028', 'avc1.42001f'];

export async function canExportMp4(scene: Scene): Promise<boolean> {
  if (typeof VideoEncoder === 'undefined' || typeof VideoFrame === 'undefined') return false;
  const { w, h } = stageSize(scene);
  for (const codec of H264) {
    try {
      const r = await VideoEncoder.isConfigSupported({ codec, width: w, height: h, bitrate: 12e6, framerate: scene.fps });
      if (r.supported) return true;
    } catch { /* try next */ }
  }
  return false;
}

function sceneImages(scene: Scene): string[] {
  const out: string[] = [];
  for (const l of scene.layers) {
    if (l.kind === 'image') out.push(l.src);
    else if (l.kind === 'character') {
      for (const p of l.poses) { out.push(p.src); if (p.jacketSrc) out.push(p.jacketSrc); }
      for (const m of l.mouths) out.push(m.src);
      if (l.blinkSrc) out.push(l.blinkSrc);
    }
  }
  return out;
}

/** Mixes every clip offline, exactly as the editor plays it. */
async function mixAudio(scene: Scene, sampleRate: number): Promise<AudioBuffer | null> {
  if (!scene.audio.length) return null;
  await Promise.all(scene.audio.map(c => decodeAudio(c.src).catch(() => null)));
  const length = Math.ceil(scene.duration * sampleRate);
  const ctx = new OfflineAudioContext(2, length, sampleRate);
  for (const clip of scene.audio) {
    const buf = getBuffer(clip.src);
    if (!buf) continue;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = clip.loop;
    const g = ctx.createGain();
    g.gain.value = clip.gain * linkFactor(scene, clip);
    src.connect(g).connect(ctx.destination);
    src.start(Math.max(0, clip.start));
    if (clip.loop) src.stop(scene.duration);
  }
  return ctx.startRendering();
}

export async function exportMp4(scene: Scene, onProgress: (p: number) => void, isCancelled: () => boolean): Promise<Blob | null> {
  const { Muxer, ArrayBufferTarget } = await import('mp4-muxer');
  const { w, h } = stageSize(scene);
  const fps = scene.fps;

  await Promise.all(sceneImages(scene).map(s => loadImage(s).catch(() => null)));
  try { await document.fonts.load('700 48px "Noto Sans Telugu"'); } catch { /* optional */ }

  let codec = H264[0];
  for (const c of H264) {
    const r = await VideoEncoder.isConfigSupported({ codec: c, width: w, height: h, bitrate: 12e6, framerate: fps }).catch(() => null);
    if (r?.supported) { codec = c; break; }
  }

  const sampleRate = 48000;
  const audio = await mixAudio(scene, sampleRate);
  let audioCodec: 'aac' | 'opus' | null = null;
  if (audio && typeof AudioEncoder !== 'undefined') {
    for (const [mc, wc] of [['aac', 'mp4a.40.2'], ['opus', 'opus']] as const) {
      const r = await AudioEncoder.isConfigSupported({ codec: wc, sampleRate, numberOfChannels: 2, bitrate: 192000 }).catch(() => null);
      if (r?.supported) { audioCodec = mc; break; }
    }
  }

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: 'avc', width: w, height: h, frameRate: fps },
    ...(audioCodec ? { audio: { codec: audioCodec, numberOfChannels: 2, sampleRate } } : {}),
    fastStart: 'in-memory',
  });

  let failure: unknown = null;
  const ve = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: e => { failure = e; },
  });
  ve.configure({ codec, width: w, height: h, bitrate: w * h > 2e6 ? 14e6 : 10e6, framerate: fps, avc: { format: 'avc' } });

  // audio first (fast), so the progress bar is mostly video
  if (audio && audioCodec) {
    const ae = new AudioEncoder({
      output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
      error: e => { failure = e; },
    });
    ae.configure({ codec: audioCodec === 'aac' ? 'mp4a.40.2' : 'opus', sampleRate, numberOfChannels: 2, bitrate: 192000 });
    const L = audio.getChannelData(0), R = audio.getChannelData(1);
    const block = 4800;
    for (let i = 0; i < audio.length; i += block) {
      const n = Math.min(block, audio.length - i);
      const data = new Float32Array(n * 2);
      data.set(L.subarray(i, i + n), 0);
      data.set(R.subarray(i, i + n), n);
      const ad = new AudioData({ format: 'f32-planar', sampleRate, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round((i / sampleRate) * 1e6), data });
      ae.encode(ad);
      ad.close();
    }
    await ae.flush();
    ae.close();
  }

  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const g = canvas.getContext('2d')!;
  const total = Math.round(scene.duration * fps);
  for (let i = 0; i < total; i++) {
    if (isCancelled()) { ve.close(); return null; }
    if (failure) throw failure;
    renderFrame(g, scene, i / fps, { guides: false });
    const frame = new VideoFrame(canvas, { timestamp: Math.round((i * 1e6) / fps), duration: Math.round(1e6 / fps) });
    ve.encode(frame, { keyFrame: i % (fps * 2) === 0 });
    frame.close();
    if (ve.encodeQueueSize > 6) await new Promise<void>(r => ve.addEventListener('dequeue', () => r(), { once: true }));
    if (i % 5 === 0) { onProgress(i / total); await new Promise(r => setTimeout(r, 0)); }
  }
  await ve.flush();
  ve.close();
  if (failure) throw failure;
  muxer.finalize();
  onProgress(1);
  return new Blob([muxer.target.buffer], { type: 'video/mp4' });
}
