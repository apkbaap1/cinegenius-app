// The 12-second clip (plus a short tail) as a real Cel Stand scene: Ashok's clay avatar
// and the Claude emoji by the river, lip-synced to the voice-over, swapping to the sea on a click.
// Everything is cels + code: no generated video.

import { CharacterLayer, FxLayer, ImageLayer, LOOKS, Scene, defaultRipple, defaultScroll } from '../../components/celstand/types';

const A = (f: string) => new URL(`./assets/${f}`, import.meta.url).href;
const AU = (f: string) => new URL(`./assets/audio/${f}`, import.meta.url).href;

/** Voice line timings on the clip timeline (seconds). Durations are the split VO files. */
export const LINES = [
  { who: 'ashok', start: 0.6, dur: 4.84, text: 'Claude, ఈ నది దగ్గర కూర్చుంటే anime scene లా ఉంది కదా?' },
  { who: 'claude', start: 5.75, dur: 3.72, text: 'అవును Ashok! కానీ ఇది video కాదు. మొత్తం code!' },
  { who: 'ashok', start: 9.8, dur: 3.58, text: 'Code ఆ? మరి background ని sea కి మార్చగలవా?' },
  { who: 'claude', start: 13.75, dur: 1.71, text: 'ఒక్క click! ఇదే anime magic!' },
] as const;
export const SWAP = 13.5;
export const CLIP_LEN = 16.4;

export function clipScene(): Scene {
  const bg = (id: string, name: string, src: string, extra: Partial<ImageLayer> = {}): ImageLayer => ({
    id, kind: 'image', name, src, visible: true, locked: true, opacity: 1,
    x: 540, y: 960, scale: 1.04, flip: false, parallax: 0.3,
    scroll: defaultScroll(), ripple: defaultRipple(), ...extra,
  });
  const sky = bg('sky', 'Sky · 空', A('bg_sky.webp'), { parallax: 0.05 });
  const clouds = bg('clouds', 'Clouds · 雲', A('bg_clouds.webp'), { parallax: 0.12, scroll: { enabled: true, speed: -16 } });
  const river = bg('river', 'River · 川', A('bg_river.webp'), {
    parallax: 0.4, showUntil: SWAP,
    ripple: { enabled: true, top: 0.515, bottom: 0.66, amplitude: 5, wavelength: 22, speed: 0.5, maskSrc: A('mask_river.webp') },
  });
  const sea = bg('sea', 'Sea · 海', A('bg_sea.webp'), {
    parallax: 0.4, showFrom: SWAP,
    ripple: { enabled: true, top: 0.515, bottom: 0.7, amplitude: 6, wavelength: 26, speed: 0.45, maskSrc: A('mask_sea.webp'), shoreTop: 0.68, shoreBottom: 0.705, shoreAmount: 6 },
  });

  const ashok: CharacterLayer = {
    id: 'ashok', kind: 'character', name: 'Ashok', visible: true, locked: false, opacity: 1,
    x: 470, y: 1445, scale: 0.78, flip: false, parallax: 1,
    poses: [
      { id: 'seated', name: 'Seated', src: A('ashok_seated_closed.webp'),
        variants: { closed: A('ashok_seated_closed.webp'), half: A('ashok_seated_half.webp'), open: A('ashok_seated_open.webp'), blink: A('ashok_seated_blink.webp') } },
      { id: 'surprised', name: 'Surprised', src: A('ashok_surprised_closed.webp'),
        variants: { closed: A('ashok_surprised_closed.webp'), half: A('ashok_surprised_half.webp'), open: A('ashok_surprised_open.webp'), blink: A('ashok_surprised_blink.webp') } },
    ],
    defaultPoseId: 'seated',
    poseCues: [
      { id: 'c1', t: 9.8, poseId: 'surprised' },
      { id: 'c2', t: 14.2, poseId: 'seated' },
    ],
    mouths: [], autoBlink: true,
    jacketColor: '', jacketStrength: 0.9, jacketMode: 'tint', jacketHue: 0,
    idleBob: 2.5, idleSpeed: 0.22,
    faceBox: [445, 225, 300, 243],
  };

  const claude: CharacterLayer = {
    id: 'claude', kind: 'character', name: 'Claude', visible: true, locked: false, opacity: 1,
    x: 812, y: 735, scale: 0.42, flip: false, parallax: 0.85,
    poses: [
      { id: 'happy', name: 'Happy', src: A('claude_happy_closed.webp'),
        variants: { closed: A('claude_happy_closed.webp'), half: A('claude_happy_half.webp'), open: A('claude_happy_open.webp'), blink: A('claude_happy_blink.webp') } },
      { id: 'think', name: 'Thinking', src: A('claude_think_closed.webp'),
        variants: { closed: A('claude_think_closed.webp'), blink: A('claude_think_blink.webp') } },
    ],
    defaultPoseId: 'happy',
    poseCues: [
      { id: 'k1', t: 9.9, poseId: 'think' },
      { id: 'k2', t: SWAP, poseId: 'happy' },
    ],
    mouths: [], autoBlink: true,
    jacketColor: '', jacketStrength: 0.9, jacketMode: 'tint', jacketHue: 0,
    idleBob: 14, idleSpeed: 0.45,
    faceBox: [200, 250, 500, 405],
  };

  const fx = (id: string, f: FxLayer['fx'], name: string, start: number, end: number, p: Partial<FxLayer>): FxLayer => ({
    id, kind: 'fx', fx: f, name, visible: true, locked: true, opacity: 1,
    x: 540, y: 960, scale: 1, flip: false, parallax: 0,
    start, end, density: 30, size: 1, speed: 0.6, wind: 0.05, color: '#fff6c8', seed: 11, ...p,
  });

  return {
    version: 1,
    title: 'Claude & Ashok by the river',
    aspect: '9:16',
    duration: CLIP_LEN,
    fps: 30,
    background: '#000000',
    layers: [
      sky, clouds, river, sea, ashok, claude,
      fx('motes', 'sparkles', 'Light particles · 光の粒', 0, CLIP_LEN, { density: 22, opacity: 0.7 }),
      fx('lines', 'speedlines', 'Speed lines · 集中線', SWAP - 0.15, SWAP + 0.9, { density: 120, size: 1.1, opacity: 0.6, color: '#ffffff', seed: 5 }),
      fx('sakura', 'sakura', 'Sakura · 桜', SWAP + 0.1, CLIP_LEN, { density: 34, speed: 0.8, wind: 0.3, color: '#ffc6d9', seed: 21 }),
    ],
    dialogue: LINES.map((l, i) => ({ id: `d${i}`, characterId: l.who, start: l.start, end: l.start + l.dur, text: l.text })),
    audio: [
      ...LINES.map((l, i) => ({ id: `v${i}`, name: `Line ${i + 1}`, role: 'voice' as const, src: AU(`clip_line${i + 1}.wav`), start: l.start, gain: 1, loop: false, characterId: l.who, duration: l.dur })),
      // (no ambience bed: it read as background noise under the voices)
      { id: 'whoosh', name: 'Whoosh', role: 'sfx', src: AU('sfx_whoosh.wav'), start: SWAP - 0.45, gain: 0.8, loop: false },
      { id: 'shimmer', name: 'Shimmer', role: 'sfx', src: AU('sfx_shimmer.wav'), start: SWAP + 0.05, gain: 0.6, loop: false },
    ],
    camera: [
      { id: 'k0', t: 0, x: 0, y: 0, zoom: 1.0 },
      { id: 'k1', t: 9.6, x: -20, y: 30, zoom: 1.05 },
      { id: 'k2', t: SWAP - 0.05, x: -40, y: 60, zoom: 1.1 },
      { id: 'k3', t: SWAP + 0.35, x: 0, y: 0, zoom: 1.0 },
      { id: 'k4', t: CLIP_LEN, x: 10, y: -10, zoom: 1.04 },
    ],
    subtitles: false,
    mouthRate: 12,
    look: { ...LOOKS.find(l => l.id === 'tv')!.look, diffusion: 0.32, punch: 0.12, rays: 0.4, raysX: 0.82, raysY: 0.13, raysColor: '#fff1c9', vignette: 0.2 },
  };
}
