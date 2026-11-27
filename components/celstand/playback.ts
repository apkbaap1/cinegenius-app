// Plays the scene's audio clips in sync with the timeline, and records the
// stage + audio to a video file.

import { Scene } from './types';
import { audioContext, decodeAudio, getBuffer } from './assets';

/** 0 when the clip is linked to a hidden layer, else 1. */
export const linkFactor = (scene: Scene, clip: Scene['audio'][number]) =>
  clip.linkLayerId && scene.layers.some(l => l.id === clip.linkLayerId && !l.visible) ? 0 : 1;

export class AudioEngine {
  private nodes: AudioScheduledSourceNode[] = [];
  private gains = new Map<string, GainNode>();
  private master: GainNode | null = null;
  private recordDest: MediaStreamAudioDestinationNode | null = null;

  async prepare(scene: Scene) {
    await Promise.all(scene.audio.map(c => decodeAudio(c.src).catch(() => null)));
  }

  /** Starts every clip as if the playhead were at `from` seconds. */
  start(scene: Scene, from: number, toRecorder = false) {
    this.stop();
    const ctx = audioContext();
    if (ctx.state === 'suspended') ctx.resume();
    this.master = ctx.createGain();
    this.master.connect(ctx.destination);
    if (toRecorder) {
      this.recordDest = ctx.createMediaStreamDestination();
      this.master.connect(this.recordDest);
    }
    const now = ctx.currentTime + 0.03;
    const end = scene.duration;
    for (const clip of scene.audio) {
      const buf = getBuffer(clip.src);
      if (!buf) continue;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = clip.loop;
      const g = ctx.createGain();
      g.gain.value = clip.gain * linkFactor(scene, clip);
      this.gains.set(clip.id, g);
      src.connect(g).connect(this.master);
      const localStart = from - clip.start;
      const stopAt = Math.min(end, clip.until ?? end);
      if (from >= stopAt) continue;
      if (clip.until !== undefined) {
        // fade out over 0.4 s before the stop time
        const fadeAt = now + Math.max(0, stopAt - 0.4 - from);
        g.gain.setValueAtTime(g.gain.value, fadeAt);
        g.gain.linearRampToValueAtTime(0, now + (stopAt - from));
      }
      if (clip.loop) {
        const offset = ((Math.max(0, localStart) % buf.duration) + buf.duration) % buf.duration;
        const when = localStart < 0 ? now - localStart : now;
        src.start(when, offset);
        src.stop(now + Math.max(0, stopAt - from));
      } else {
        if (localStart >= buf.duration) continue;
        if (localStart < 0) src.start(now - localStart, 0);
        else src.start(now, localStart);
      }
      this.nodes.push(src);
    }
  }

  /** Crossfade ambience linked to layers that were just shown or hidden. */
  updateLinks(scene: Scene) {
    const ctx = audioContext();
    for (const clip of scene.audio) {
      const g = this.gains.get(clip.id);
      if (!g || !clip.linkLayerId) continue;
      g.gain.cancelScheduledValues(ctx.currentTime);
      g.gain.setTargetAtTime(clip.gain * linkFactor(scene, clip), ctx.currentTime, 0.25);
    }
  }

  get recordStream(): MediaStream | null {
    return this.recordDest?.stream ?? null;
  }

  stop() {
    for (const n of this.nodes) { try { n.stop(); } catch { /* already stopped */ } }
    this.nodes = [];
    this.gains.clear();
    this.master?.disconnect();
    this.master = null;
    this.recordDest = null;
  }
}

export function pickVideoMime(): { mime: string; ext: string } {
  const options = [
    { mime: 'video/mp4;codecs=avc1.640028,mp4a.40.2', ext: 'mp4' },
    { mime: 'video/mp4', ext: 'mp4' },
    { mime: 'video/webm;codecs=vp9,opus', ext: 'webm' },
    { mime: 'video/webm', ext: 'webm' },
  ];
  for (const o of options) if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(o.mime)) return o;
  return { mime: '', ext: 'webm' };
}
