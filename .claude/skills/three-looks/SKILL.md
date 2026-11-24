---
name: three-looks
description: Make 3D animated explainers and short stories built entirely in code with three.js (no models, images or texture files) in 15 named looks - Low-Poly, Paper Pop-Up, Soft Clay, Tiny Diorama, Blueprint Build, Spotlight Stage, Neon Sign, Exploded View, Marble Run, X-Ray, LED Wall, Inflated, Painted, Circuit City, Glass and Light - then record them to MP4. Use when the user asks for a 3D explainer, a 3D animated story, a three.js film, "make this in a 3D style", names one of these looks, or wants to pick a 3D look for a topic.
---

# three-looks

A 3D film here is one HTML page. three.js builds every object from primitives and
code-drawn canvas textures, one pure function `update(t)` poses the whole scene for time
`t`, and a recorder steps through the frames and encodes an MP4. No downloaded models,
no image files, no generated assets. The same page rebuilds the same film anywhere.

The look is the hard part. A look is a **material world with its own physics, light and
camera manners** - not a colour palette on the same grey boxes. Each look in
`references/styles.md` says what things are made of, how they are lit, how the camera
behaves, how things move, and the one signature move that makes it read as that look.

## Workflow

1. **Intake (one message, only what the request leaves open).** Topic and the one idea
   the viewer should leave with; look (recommend one from the table below, in one line
   why); shape (16:9, 9:16, 1:1, 4:5); length (default 20-30 s); words on screen or not.
   "You pick" means pick and say why.
2. **Write a beat sheet** - 4 to 7 beats, each with a time range, what changes on screen,
   and the on-screen label if any. One transformation per film, one payoff at the end.
   Read `references/craft.md` before writing it.
3. **Copy `assets/template.html`** to the project (for this repo: `films/<name>/index.html`).
   Fill `CONFIG`, `build()` and `update(t)` following the style card. Keep everything
   inside the file. Use `kit` helpers (seeded random, easing, beats, canvas textures,
   text labels) - never `Math.random()` or wall-clock time inside `update`.
4. **Prove the look on one still** before animating everything: open the page with
   `?t=<seconds>` (the page freezes on that time) and screenshot it, or run
   `node scripts/record.mjs <page> --still <seconds> --out still.png`. Look at the
   image. Check it against the style card's "Reads as" line. Fix, then continue.
5. **Animate all beats**, then render:
   `node scripts/record.mjs films/<name>/index.html --out films/<name>/out.mp4`
   (options: `--fps 30`, `--width 1920 --height 1080`, `--from 0 --to 5` for a section).
   Check 4-6 frames spread across the film (`--still`) before calling it done. Never say
   a film looks right without having looked at frames.
6. Deliver the MP4 path plus the HTML (it also plays live in a browser: scrub with
   `?t=`, pause with space).

## The looks

| # | Look | Best for | Family |
|---|---|---|---|
| 01 | Low-Poly | geography, ecosystems, travel, "how a place works" | Filter over 3D |
| 02 | Paper Pop-Up | fables, history, children's stories | Material world |
| 03 | Soft Clay | friendly science, health, habits | Material world |
| 04 | Tiny Diorama | cities, logistics, a day in a town, services | Space and journey |
| 05 | Blueprint Build | engineering, "how it's made", product origins | Diagram with depth |
| 06 | Spotlight Stage | dramatic stories, myths, monologues | Space and journey |
| 07 | Neon Sign | one big word or number, slogans, nightlife topics | Flat content made physical |
| 08 | Exploded View | products, devices, anatomy of a thing | Diagram with depth |
| 09 | Marble Run | processes, pipelines, sorting, money flow | Machine that explains |
| 10 | X-Ray | hidden insides, "what's really going on", body/tech | Filter over 3D |
| 11 | LED Wall | announcements, stats, countdowns, headlines | Flat content made physical |
| 12 | Inflated | playful products, brands, light tech topics | Material world |
| 13 | Painted | emotional stories, history, poetry, film tributes | Filter over 3D |
| 14 | Circuit City | computing, networks, AI, data flow | Space and journey |
| 15 | Glass and Light | chemistry, mixing, ratios, recipes, finance mixes | Material world |

Full cards (materials, light, palette, camera, motion, signature move, traps, and a
fill-in prompt): `references/styles.md`. Read only the card you need.

Choosing quickly: a **process** -> Marble Run or Circuit City; a **thing's parts** ->
Exploded View, Blueprint Build or X-Ray; a **place** -> Tiny Diorama or Low-Poly; a
**story** -> Paper Pop-Up, Spotlight Stage or Painted; **one word or number** -> Neon
Sign or LED Wall; **mixing or proportions** -> Glass and Light; **friendly/playful** ->
Soft Clay or Inflated.

## Rules

- Everything is code: primitives, `ExtrudeGeometry`/`LatheGeometry`/`TubeGeometry`,
  instanced meshes, and textures drawn on a `<canvas>` with `kit.canvasTexture`. No
  `.glb`, `.png` or font files are loaded. Text is drawn to canvas (`kit.label`).
- Determinism: `update(t)` depends only on `t`. Seed every random choice at build time
  with `kit.rng(seed)`. Physics-like motion (marbles, falling paper) is written as a
  function of `t` (keyframed paths, closed-form bounces), not simulated step by step.
- Hold every beat at least 1.5 s; the camera moves continuously but slowly; one hero
  object in focus at a time.
- On-screen words: few, large, drawn as part of the world (a sign, a card, a label
  tag) in the look's own material - never a flat UI overlay unless the user asks.
- Keep a phone-safe frame for 9:16: important things in the middle 80% of width.
- Original work only: invent the scene and characters for the user's topic; do not
  rebuild a specific existing film, game or brand character.
