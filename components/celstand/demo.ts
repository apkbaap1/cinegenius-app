// A starter scene drawn entirely in code, so the stand works before any
// artwork is uploaded. The art itself lives in demoArt.ts (anime style).

import { CharacterLayer, FxLayer, ImageLayer, LOOKS, Scene, defaultRipple, defaultScroll, uid } from './types';
import { CW, CH, Look as ArtLook, PoseName, animeClouds, animePoles, animeRiver, animeSea, animeSky, cv, drawBlink, drawBody, drawJacket, drawMouth, url } from './demoArt';

function makeCharacter(name: string, L: ArtLook, x: number, y: number, flip: boolean): CharacterLayer {
  const poseIds: Record<PoseName, string> = { idle: uid('pose'), wave: uid('pose'), happy: uid('pose') };
  const poses = (Object.keys(poseIds) as PoseName[]).map(p => {
    const [b, gb] = cv(CW, CH); drawBody(gb, L, p);
    const [j, gj] = cv(CW, CH); drawJacket(gj, L, p);
    return { id: poseIds[p], name: p === 'idle' ? 'Neutral' : p === 'wave' ? 'Wave' : 'Happy', src: url(b), jacketSrc: url(j) };
  });
  const [bl, gbl] = cv(CW, CH); drawBlink(gbl, L);
  const mouths = [0, 0.33, 0.66, 1].map((o, i) => {
    const [m, gm] = cv(CW, CH); drawMouth(gm, o);
    return { id: uid('mouth'), name: ['Closed', 'Small', 'Mid', 'Wide'][i], src: url(m), openness: o };
  });
  return {
    id: uid('char'), kind: 'character', name, visible: true, locked: false, opacity: 1,
    x, y, scale: 0.9, flip, parallax: 1,
    poses, defaultPoseId: poseIds.idle, poseCues: [],
    mouths, blinkSrc: url(bl), autoBlink: true,
    jacketColor: '', jacketStrength: 0.9,
  };
}

// ---------------- ambient sound ----------------

function wavDataURL(samples: Float32Array, rate: number): string {
  const n = samples.length;
  const buf = new ArrayBuffer(44 + n * 2);
  const v = new DataView(buf);
  const s = (o: number, str: string) => { for (let i = 0; i < str.length; i++) v.setUint8(o + i, str.charCodeAt(i)); };
  s(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); s(8, 'WAVE'); s(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  s(36, 'data'); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, samples[i])) * 32767, true);
  let bin = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return 'data:audio/wav;base64,' + btoa(bin);
}

/** Soft running-water bed: filtered noise with slow swells, loop-safe. */
function riverAmbience(): string {
  const rate = 22050, secs = 6, n = rate * secs;
  const out = new Float32Array(n);
  let lp = 0, lp2 = 0, last = 0;
  for (let i = 0; i < n; i++) {
    const white = Math.random() * 2 - 1;
    lp += (white - lp) * 0.08;
    lp2 += (lp - lp2) * 0.3;
    const hp = lp2 - last; last = lp2;
    const swell = 0.6 + 0.4 * Math.sin((i / n) * Math.PI * 2 * 3);
    out[i] = (lp2 * 0.9 + hp * 2.2) * swell * 0.9;
  }
  const fade = rate * 0.5; // crossfade the loop point
  for (let i = 0; i < fade; i++) {
    const k = i / fade;
    out[i] = out[i] * k + out[n - fade + i] * (1 - k);
  }
  return wavDataURL(out.subarray(0, n - fade), rate);
}

// ---------------- scene ----------------

export function demoScene(): Scene {
  const bg = (name: string, src: string, extra: Partial<ImageLayer> = {}): ImageLayer => ({
    id: uid('layer'), kind: 'image', name, src, visible: true, locked: true, opacity: 1,
    x: 960, y: 540, scale: 1.04, flip: false, parallax: 0.3,
    scroll: defaultScroll(), ripple: defaultRipple(), ...extra,
  });
  const skyL = bg('Sky', animeSky(), { parallax: 0.05 });
  const cloudL = bg('Clouds · 入道雲', animeClouds(), { parallax: 0.1, scroll: { enabled: true, speed: -14 } });
  const riverL = bg('Scenery · River', animeRiver(), {
    parallax: 0.4, ripple: { enabled: true, top: 0.6, bottom: 0.76, amplitude: 4, wavelength: 20, speed: 0.5 },
  });
  const seaL = bg('Scenery · Sea', animeSea(), {
    parallax: 0.4, visible: false, ripple: { enabled: true, top: 0.52, bottom: 0.745, amplitude: 5, wavelength: 24, speed: 0.4 },
  });
  const polesL = bg('Poles & wires · 電柱', animePoles(), { parallax: 0.5 });
  const kiran = makeCharacter('Kiran', {
    skin: '#fde3cf', skinShade: '#f0b9a0', hair: '#2b2b45', hairShade: '#1a1a2e', hairLight: '#5a5f8f', longHair: false,
    irisDark: '#2f4f8f', irisLight: '#7fb6ff', jacket: '#2f5fa8', jacketShade: '#21467f', shirt: '#ffffff', ribbon: '#2a2f55',
  }, 640, 760, false);
  const anu = makeCharacter('Anu', {
    skin: '#fbe0cc', skinShade: '#eeb49a', hair: '#6a3326', hairShade: '#432018', hairLight: '#a8604a', longHair: true,
    irisDark: '#7a3b1f', irisLight: '#e7a25a', jacket: '#d8734a', jacketShade: '#a9502f', shirt: '#ffffff', ribbon: '#d23a4f',
  }, 1290, 760, true);

  const wave = kiran.poses.find(p => p.name === 'Wave')!.id;
  const happyK = kiran.poses.find(p => p.name === 'Happy')!.id;
  const happyA = anu.poses.find(p => p.name === 'Happy')!.id;
  kiran.poseCues = [
    { id: uid('cue'), t: 6.4, poseId: wave },
    { id: uid('cue'), t: 8.8, poseId: kiran.defaultPoseId },
    { id: uid('cue'), t: 11.2, poseId: happyK },
  ];
  anu.poseCues = [{ id: uid('cue'), t: 9.3, poseId: happyA }];

  const fx = (fxKind: FxLayer['fx'], name: string, start: number, end: number, p: Partial<FxLayer>): FxLayer => ({
    id: uid('fx'), kind: 'fx', fx: fxKind, name, visible: true, locked: true, opacity: 1,
    x: 960, y: 540, scale: 1, flip: false, parallax: 0,
    start, end, density: 40, size: 1, speed: 0.6, wind: 0.05, color: '#fff6c8', seed: 4242, ...p,
  });
  const motes = fx('sparkles', 'Light particles 光の粒', 0, 12.5, { density: 26, opacity: 0.8 });
  const burst = fx('speedlines', 'Speed lines 集中線', 9.3, 10.6, { density: 110, size: 1.15, opacity: 0.55, color: '#ffffff', seed: 99 });

  return {
    version: 1,
    title: 'Riverside chat',
    aspect: '16:9',
    duration: 12.5,
    fps: 30,
    background: '#000000',
    layers: [skyL, cloudL, seaL, riverL, polesL, kiran, anu, motes, burst],
    dialogue: [
      { id: uid('line'), characterId: kiran.id, start: 0.8, end: 3.3, text: 'ఈ నది దగ్గర కూర్చుంటే, సినిమా scene లా ఉంది కదా?' },
      { id: uid('line'), characterId: anu.id, start: 3.7, end: 6.1, text: 'అవును! కానీ background మారిస్తే ఇంకా బాగుంటుంది.' },
      { id: uid('line'), characterId: kiran.id, start: 6.5, end: 8.9, text: 'సరే, sea కి మార్చేద్దాం. Jacket color కూడా!' },
      { id: uid('line'), characterId: anu.id, start: 9.3, end: 11.6, text: 'ఇదే cel animation magic రా!' },
    ],
    audio: [
      { id: uid('clip'), name: 'River ambience (generated)', role: 'ambient', src: riverAmbience(), start: 0, gain: 0.35, loop: true },
    ],
    camera: [
      { id: uid('cam'), t: 0, x: 0, y: 0, zoom: 1 },
      { id: uid('cam'), t: 12.5, x: 40, y: 10, zoom: 1.08 },
    ],
    subtitles: true,
    mouthRate: 12,
    look: { ...LOOKS.find(l => l.id === 'skydrama')!.look, raysX: 0.86, raysY: 0.08 },
  };
}
