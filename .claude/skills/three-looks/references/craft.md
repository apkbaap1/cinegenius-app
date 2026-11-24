# Craft notes for code-built 3D films

## Story shape

- **One transformation.** The film starts in state A and ends in state B, and the viewer
  understands why. Examples: raw beans -> a cup of coffee; one message -> a delivered
  message; a closed device -> its parts named.
- **Beats.** 4-7 beats. Each beat changes exactly one thing. Write them as
  `[start, end] what changes | label`. The last beat is the payoff and holds for 2-3 s.
- **A returning token.** One object (a marble, a paper bird, a glowing packet) that
  the eye follows from first beat to last.
- **Labels** are nouns or numbers, 1-4 words. Put them on things (tags, signs, cards).

## Light (this is most of the look)

- Start from three lights: a **key** (DirectionalLight with soft shadows), a **fill**
  (HemisphereLight, low intensity) and, if the look calls for it, a **rim** behind the
  subject. Turn on `renderer.shadowMap` (PCFSoft) and set `castShadow` /
  `receiveShadow` on what matters - contact shadows make miniatures feel real.
- Use `ACESFilmicToneMapping` and sRGB output (the template does). Adjust exposure, not
  light intensities, when everything is too bright or too dark.
- Glossy looks (Inflated, Glass and Light, Neon) need something to reflect: build a
  `RoomEnvironment` with `PMREMGenerator` (the template has `kit.studioEnv()`).
- Dark looks (Spotlight Stage, Neon, Circuit City) are lit by the objects: emissive
  materials + `UnrealBloomPass` (`kit.bloom()`), plus fog to push the background away.

## Materials without image files

- `MeshStandardMaterial` with `roughness`/`metalness` covers most surfaces;
  `MeshPhysicalMaterial` adds `clearcoat` (plastic, vinyl, lacquer) and
  `transmission`/`thickness`/`ior` (glass, liquid).
- Surface detail comes from `kit.canvasTexture(w, h, draw)`: draw noise, grain, paper
  fibres, fingerprints, brick courses, grid lines or circuit traces with 2D canvas calls
  and use the result as `map`, `roughnessMap` or `bumpMap`.
- Faceted look: `flatShading: true`. Soft look: more segments plus a small seeded
  vertex wobble (`kit.wobble(geometry, amount, seed)`).

## Camera

- Pick a lens per look: miniatures use a long lens (FOV 20-30) from high up so they
  read as small; stages use 35-45; interiors and machines 40-50.
- Move on a path, never cut mid-move. Use `kit.ease` and `kit.beat(t, start, dur)`
  to blend between named camera stops. A slow drift (2-4% per second) keeps stills alive.
- Miniature trick: tilt-shift with `BokehPass` or simply a shallow fog near and far.

## Motion

- Ease everything (`easeOutBack` for things popping in, `easeInOutCubic` for camera,
  `easeOutBounce` for drops). Nothing moves linearly except conveyor belts and signals.
- Overlap: when one thing settles the next starts (offset 0.2-0.4 s).
- Pop-ins scale from 0 with a small overshoot; exits are faster than entrances.

## Checking

- Screenshot at the middle of each beat and at the end. Ask of each frame: is there
  one clear focal object? Does the material read (would someone name the look)? Are
  labels readable on a phone?
- Common failures: everything evenly lit (no key light, no shadows), pure-black
  background on a light look, labels too small, camera too close so the miniature
  scale is lost, bloom washing out the whole frame.
