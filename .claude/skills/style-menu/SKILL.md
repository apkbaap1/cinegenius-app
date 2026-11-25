---
name: style-menu
description: The menu of 37 saved 3D animation styles (Low-Poly, Paper Pop-Up, Soft Clay, Tiny Diorama, Blueprint Build, Spotlight Stage, Neon Sign, Exploded View, Marble Run, X-Ray, LED Wall, Inflated, Painted, Circuit City, Glass and Light, Factory Line, White Model, Voxel, Data Skyline, Ink and Toon, Pin Wall, Toy Blocks, Particle Swarm, Museum Gallery, Pencil Sketch, Domino Chain, Node Network, Shadow Box, Layer Stack, Dithered, Floating Screens, Device Hero, Studio Product, Split-Flap Board, Hero Icon, Embossed, Monument Type). Shows the menu, recommends the right style for a topic, takes a pick by number or name, then makes the film with the three-looks skill. Use when the user asks to see or choose an animation style, says "make a video/animation about X" without a style, gives a style number, or asks which style suits their topic.
---

# style-menu

This skill is the front door to the saved styles. It does three things: show the menu,
match a topic to a style, and hand the chosen style to the **three-looks** skill. three-looks
does the actual building (storyboard, film, MP4). Every style lives in
`.claude/skills/three-looks/references/looks/<nn>-<id>/`, with its `card.md` and its
reference `style.js`.

## How the user can ask

| They say | Do this |
|---|---|
| "show the styles", "menu", `/style-menu` with nothing else | Show the menu below, grouped by family, and ask for a topic and a number |
| "style 26: why habits compound" or "Domino Chain about habits" | Go straight to **Make it** with that style |
| "make an animation about X" (no style) | **Recommend**: give the best 3 styles for X, one line each on why, mark one as the pick, and let them choose |
| "surprise me" | Pick the single best fit for the topic and say why in one line, then go |
| "same topic in 3 styles" | Make three storyboards, one per style, so they can compare; build only the one they approve |
| A pasted atlas prompt ("I want a short 3D motion graphic ... in the X style") | The style is the one it names. If MY CONTENT is still the placeholder, it is a new style to save, not a film. Add it with three-looks' "Adding a look" steps, not as a film |

Numbers and names both work, and so do loose names ("domino", "the neon one", "pencil").
If a name is ambiguous, show the two or three candidates and ask.

## The menu

**Material worlds**: 02 Paper Pop-Up, 03 Soft Clay, 12 Inflated, 15 Glass and Light, 22 Toy Blocks
**Filters over 3D**: 01 Low-Poly, 10 X-Ray, 13 Painted, 18 Voxel, 20 Ink and Toon, 25 Pencil Sketch, 30 Dithered
**Spaces and journeys**: 04 Tiny Diorama, 06 Spotlight Stage, 14 Circuit City, 24 Museum Gallery, 37 Monument Type
**Diagrams with depth**: 05 Blueprint Build, 08 Exploded View, 17 White Model, 19 Data Skyline, 27 Node Network, 29 Layer Stack
**Machines that explain**: 09 Marble Run, 16 Factory Line, 26 Domino Chain
**Flat content made physical**: 07 Neon Sign, 11 LED Wall, 21 Pin Wall, 23 Particle Swarm, 28 Shadow Box, 34 Split-Flap Board, 36 Embossed
**Products and screens**: 31 Floating Screens, 32 Device Hero, 33 Studio Product, 35 Hero Icon

When you show it, give one short line per style as well (the "Strongest for" column of the
table in three-looks' `SKILL.md`) so the user can choose without opening anything.

## Recommend: match the content to a style

First work out the shape of the content: what has to happen on screen. Then pick from here.

| The content is mostly... | Best styles |
|---|---|
| a process, steps, a how-to | 16 Factory Line, 20 Ink and Toon, 05 Blueprint Build, 31 Floating Screens |
| cause and effect, things that compound | 26 Domino Chain, 09 Marble Run, 23 Particle Swarm |
| what's inside something, how it is built | 08 Exploded View, 10 X-Ray, 25 Pencil Sketch, 29 Layer Stack |
| connections, spread, networks, systems | 27 Node Network, 14 Circuit City, 17 White Model |
| numbers, comparisons, rankings | 19 Data Skyline, 34 Split-Flap Board, 22 Toy Blocks |
| a timeline, eras, before and after | 24 Museum Gallery, 28 Shadow Box, 06 Spotlight Stage |
| a list of 3-5 points | 24 Museum Gallery, 22 Toy Blocks, 34 Split-Flap Board |
| a place, nature, a cycle | 01 Low-Poly, 04 Tiny Diorama, 21 Pin Wall |
| growth, building up in stages | 18 Voxel, 22 Toy Blocks, 12 Inflated |
| a story or fable | 02 Paper Pop-Up, 11 LED Wall, 06 Spotlight Stage, 13 Painted |
| money, health, habits (friendly) | 03 Soft Clay, 12 Inflated, 30 Dithered |
| a recipe, mixture or ratio | 15 Glass and Light, 20 Ink and Toon |
| a routine or anything with a clock | 30 Dithered, 26 Domino Chain |
| an app, a feature, a workflow on screens | 32 Device Hero, 31 Floating Screens, 35 Hero Icon |
| one physical product and one claim | 33 Studio Product, 08 Exploded View |
| one word, quote, motto or number | 07 Neon Sign, 36 Embossed, 37 Monument Type |
| a tool or brand with a few features | 35 Hero Icon, 32 Device Hero |

Read the card (`card.md`) of each style you recommend, especially its "Good for" line, before
you recommend it. Say in one line why it fits this topic, not what the style looks like in
general.

## The four kinds of style

Every card has a **Use**, and it decides what content the style needs:

- **explainer**: a process or idea told in 3-4 beats that follow from each other.
- **story**: characters or events with a beginning and an end.
- **product** (32, 33): a real product or app. Ask for its name, the one thing it does and any
  claim with a number. Do not invent product facts.
- **title** (34-37): a short text is the subject: a phrase, a list, a name, a quote. Ask for
  the exact words. Keep them short (Monument Type 2-5 words, Embossed one line).

If the content does not fit the style's Use, say so and suggest one that fits better.

## Make it

1. Confirm the style and the content in one line (for example "26 Domino Chain: how a 1%
   daily gain compounds over a year"). If there is no content yet, ask for it and stop.
2. Load the **three-looks** skill and follow its workflow exactly, from step 3 on. That means
   reading its `PROMPT.md`, the style's slot values in `CARDS.md` and the reference
   `style.js`, then making the **storyboard first** and waiting for the user's OK, then the
   film and the MP4.
3. Save each film in `films/<short-name>/`. When it is finished, add a line to
   `films/INDEX.md` (create it if it is missing) with the date, the style number and name, the
   topic and the file paths, so earlier films are easy to find and remake.

## Keeping the menu current

When a new style is added through three-looks ("Adding a look"), also add it here: to its
family in **The menu**, to the right rows of **Recommend**, and to the list in this skill's
description. Never remove a style.
