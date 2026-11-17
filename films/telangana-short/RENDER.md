# Rendering "One Ring at a Time" (Telugu) on your PC

This 3D cartoon style needs a graphics card. The cloud container that built it has none, so the final render runs on your machine.

## Once
1. Install [Node.js 20 or newer](https://nodejs.org).
2. Get this folder: `git clone` the repo (branch `claude/kind-galileo-xrsven`), then open a terminal in `films/telangana-short`.
3. `npm install`

## Render
- Quick check first (540 x 960, a few minutes): `node scripts/render-final.mjs --draft`
- Final 2K (1440 x 2560): `node scripts/render-final.mjs`

The finished file is `out/telangana-te-2k.mp4` (picture + the mixed Telugu voice, score and effects).

## If something goes wrong
- Black or empty frames: try another WebGL backend, e.g. `REMOTION_GL=angle node scripts/render-final.mjs` (Windows PowerShell: `$env:REMOTION_GL="angle"; node scripts/render-final.mjs`). Other values: `egl`, `vulkan`, `swangle` (slow, no GPU).
- Out of memory: `CONCURRENCY=2 node scripts/render-final.mjs`.
- Disk: each Remotion bundle copies `public/` into your temp folder; it is small here (about 0.3 MB), so this should not matter.

## What is where
- `src/videos/telangana/story.ts`: shots, camera, lens, timed to `voice/words_te.json`
- `sets.ts` / `places.ts`: the city, the gate, the village, the parliament building, the mine
- `cast.ts` / `toon.ts`: the people and the effect cards
- `audio/telangana.py`: the score, effects and mix (`audio/final/mix.m4a` is already rendered)
- `SCRIPT.md`: facts, sources, the English and Telugu scripts
