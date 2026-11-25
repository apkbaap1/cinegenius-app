---
name: three-looks
description: Make short 3D motion graphics (explainers and stories, 7-12 s) built entirely in code with three.js 0.187 and the STAGE and SOUND kits, in 24 named looks from the 3D Style Atlas - Low-Poly, Paper Pop-Up, Soft Clay, Tiny Diorama, Blueprint Build, Spotlight Stage, Neon Sign, Exploded View, Marble Run, X-Ray, LED Wall, Inflated, Painted, Circuit City, Glass and Light, Factory Line, White Model, Voxel, Data Skyline, Ink and Toon, Pin Wall, Toy Blocks, Particle Swarm, Museum Gallery - with a storyboard of rendered stills first, then a self-contained HTML player and an MP4 with synthesized sound. Use when the user asks for a 3D explainer or animated story, a three.js film, names one of these looks, or pastes a "3D motion graphic ... style" prompt.
---

# three-looks

Every look comes with the same brief (`references/looks/PROMPT.md`), its own style card
(`references/looks/CARDS.md`) and a complete reference animation in that look
(`references/looks/<nn-look>/style.js`). All of them run on the same kits in `assets/lib/`:
`stage.js` (renderer: accumulation motion blur, depth of field, soft shadows, bloom, grade,
overlay), `sound.js` (synthesized score), plus `text3d.js` or `strokefont.js` for the looks
that need them. The kits, cards and references are stored word for word: do not edit them.

A pasted atlas prompt is the same brief with one look filled in. If the user pastes one, the
look is the one named in it; the sources in it match the files here.

## Workflow

1. **Pick the look.** The looks are a menu: each one is a folder in `references/looks/`
   holding its own `card.md` and `style.js`.
   - If the user names a look, or gives its number, use that look.
   - If they haven't chosen, show them the numbered list below, recommend one in a line, and
     let them pick.
2. **Get the content.** If MY CONTENT is empty or still the placeholder, ask for the topic or
   script and stop there. Do not invent a topic.
3. **Read the brief and the look.** Read `PROMPT.md` in full. Read that look's card and slot
   values in `CARDS.md`. Read the look's `style.js` in full. The reference shows the look, not
   the story: keep its materials, light, camera language, grade and motion. Replace its
   objects, beats and words.
4. **Storyboard first.** Write the new style as `films/<name>/style.js` in the reference's
   shape: content block first, then `registerStyle({... build(S) -> { update(t), overlay? },
   sound(k)})`. At this stage, block out each beat's key frame only.
   - Make a storyboard HTML page with a grid of 3-6 stills. Render each still with `S.seek(t)`
     at about 16 samples.
   - Under each panel, give the beat number, its start and end, the exact on-screen text, what
     changed since the last panel, what the camera does, and the key sounds.
   - Below the grid, list every fact or number you assumed.
   - Show the page as an artifact, or send the file. Then **wait for the user's OK.**
   - To render the stills here, set up the player (step 5) and run
     `node scripts/render.mjs films/<name>/index.html --still <t> --samples 16 --out p<i>.png`
     for each panel. Then build the page from the PNGs.
5. **Build the film** exactly as storyboarded, reusing the storyboard's scene code.
   - Copy `assets/player.html` to `films/<name>/index.html`. Copy the needed `assets/lib/*.js`
     to `films/<name>/lib/`.
   - In the player, enable the TEXT3D or STROKEFONT line if the look needs it. Set the Google
     Fonts link to the families in `style.fonts`.
   - The player already does what the brief asks for:
     - a 1920x1080 canvas scaled to fit;
     - play/pause, scrub, time, sound toggle, loop on;
     - 3 samples live, the style's full count when `?render`;
     - `SOUND.live` restarted on play, stopped on pause, seek and sound-off;
     - `window.seek`, `window.DURATION` and `window.STYLE`.
   - Make the deliverable one self-contained file:
     `node scripts/bundle.mjs films/<name>/index.html films/<name>/<name>.html`. This inlines
     the kits and the style.
6. **Render the MP4.** Run `node scripts/render.mjs films/<name>/<name>.html --out films/<name>/<name>.mp4`.
   - The script steps `window.seek(i/30)` through every frame in headless Chromium and pipes
     the frames into ffmpeg.
   - It renders the score with `SOUND.renderOffline(..., { voiceover: false })` and muxes it in
     at -15 LUFS with ffmpeg loudnorm.
   - Options: `--from/--to` for a section, `--fps`, `--samples`, `--no-audio`.
   - Then look at 4-6 frames spread across the film with `--still`. Fix framing, lighting and
     legibility before you call it done. Never say a film looks right without looking at frames.

## The looks

| # | Look | Family | Use | Strongest for |
|---|---|---|---|---|
| 01 | Low-Poly | Filters over 3D | explainer | places, nature, cycles |
| 02 | Paper Pop-Up | Material worlds | story | fables, journeys, origins |
| 03 | Soft Clay | Material worlds | explainer | friendly money, health, habits (TEXT3D) |
| 04 | Tiny Diorama | Spaces and journeys | explainer | logistics, services, a day in a town |
| 05 | Blueprint Build | Diagrams with depth | explainer | how something is set up or built (STROKEFONT) |
| 06 | Spotlight Stage | Spaces and journeys | story | history, drama, a moment in time |
| 07 | Neon Sign | Flat content made physical | explainer | one phenomenon, a word, a number (STROKEFONT) |
| 08 | Exploded View | Diagrams with depth | explainer | what's inside a product |
| 09 | Marble Run | Machines that explain | explainer | sorting, routing, decision pipelines |
| 10 | X-Ray | Filters over 3D | explainer | hidden insides, why something works |
| 11 | LED Wall | Flat content made physical | story | pixel cartoons, fables, headlines |
| 12 | Inflated | Material worlds | explainer | pressure, growth, too much and too little (STROKEFONT) |
| 13 | Painted | Filters over 3D | story | how something is made, where it comes from |
| 14 | Circuit City | Spaces and journeys | explainer | data, AI, anything that travels through a system |
| 15 | Glass and Light | Material worlds | explainer | recipes, mixtures, ratios, chemistry |
| 16 | Factory Line | Machines that explain | explainer | any step-by-step process |
| 17 | White Model | Diagrams with depth | explainer | flows: energy, water, money, people |
| 18 | Voxel | Filters over 3D | explainer | growth and building up in stages |
| 19 | Data Skyline | Diagrams with depth | explainer | comparisons, rankings, series over time |
| 20 | Ink and Toon | Filters over 3D | explainer | steps, recipes, how-tos |
| 21 | Pin Wall | Flat content made physical | explainer | terrain, waves, morphing reliefs |
| 22 | Toy Blocks | Material worlds | explainer | lists, proportions, "building blocks of X" |
| 23 | Particle Swarm | Flat content made physical | explainer | things that flow, gather, heat up or burst; many units |
| 24 | Museum Gallery | Spaces and journeys | explainer | lists and timelines of 3-5 points, last one the conclusion |

For fonts, extra libraries and reference topics, see `CARDS.md`.

### Adding a look

When the user gives a new atlas prompt, add the look; never replace or overwrite one that
is already here.
- Give it the next number, as `references/looks/<nn>-<id>/`.
- Save its reference source there as `style.js`, word for word.
- Add a `card.md` holding its style card and slot values.
- Append it to `CARDS.md` and to the table above.
- If the prompt brings a new library, add it to `assets/lib/`.

### Classic cards

`references/styles.md` keeps the first 15 hand-written cards: each one is a fill-in prompt
with its signature move and traps. They run on the simpler single-file scaffold
`assets/template.html` and the recorder `scripts/record.mjs` (`?t=` freezes a frame;
`--still` renders one).
- Use them when the user asks for that lighter pipeline.
- Also use them as extra ideas for a look.

## Rules (from the brief; the brief wins if they differ)

- three.js 0.187.0 core only, loaded through an import map, with `window.THREE` set before the
  kits run. No addons, models, images, HDRIs or texture files: build everything in code.
- `update(t)` sets the whole scene for time `t`. Nothing may build up between calls: the kit
  calls it many times per frame. No `Math.random`, `Date` or timers; use `K.rng(seed)`.
- 7-12 seconds unless the content needs more. Tell the content as the card's Use (an
  explainer or a story) over three or four beats that follow from each other. End on the
  result, not on a slogan or logo.
- Words are small captions and labels. Keep them large enough for a phone and on screen
  long enough to read. Keep the subject filling the frame for the whole move. The first
  frame and the last second must both hold up.
- Change scene only the way the look would (a turn of the set, a page, a passing object, a
  change of light). Never use hard cuts.
- Sound starts on the frame its event appears, driven by the same schedule as the picture.
  Effects sit in front, with the bed and music underneath and small silences.
- Check every fact and number you show. List the ones you assumed on the storyboard.
- Original work only: invent the scene for the user's topic. Do not rebuild a specific
  existing film, game or brand character.

`references/craft.md` has general notes on beats, staging and legibility.
