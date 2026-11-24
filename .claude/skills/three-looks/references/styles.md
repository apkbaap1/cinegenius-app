# The 15 looks

Each card: **Reads as** (the test a still must pass), **Build**, **Light**, **Palette**,
**Camera**, **Motion**, **Signature move**, **Traps**, and a **Prompt** to fill in.
Hex values are starting points; tune by eye on a still.

---

## 01 Low-Poly (explainer)
**Reads as:** a tiny faceted world you could hold, each face a flat colour.
**Build:** terrain from a `PlaneGeometry` (30x30 segments) with seeded height noise,
`flatShading: true`, vertex colours by height (water -> sand -> grass -> rock). Trees are
cones on cylinders, rocks are `IcosahedronGeometry(r, 0)` with jittered vertices,
clouds are 3-5 merged low-detail spheres. Water is a separate flat plane, slightly
transparent, with gently moving vertices.
**Light:** warm low sun (DirectionalLight, ~35 deg elevation) with soft shadows, sky-blue
HemisphereLight fill. No bloom.
**Palette:** sand `#e9d3a4`, coral `#ef8a6f`, cream `#f6efe0`, teal water `#3fa7a3`,
sage `#9cb88a`, deep green `#5f8a5b`, rock `#a49a8c`, sky `#cfe8ec`.
**Camera:** 3/4 overhead orbit, FOV 30, the island fills 70% of frame.
**Motion:** things grow from the ground with overshoot; tiny boats and birds on
looping paths; the camera slowly orbits.
**Signature move:** the world builds itself tile by tile (faces rising in a wave) at the start.
**Traps:** smooth shading (breaks the look); too many tiny facets; neon colours.
**Prompt:** "Make a {N}s {aspect} three.js explainer about {topic} in the Low-Poly look:
a small faceted island built entirely from flat-shaded primitives, sand/coral/cream
against teal water and sage greens, warm low sun with soft shadows. Beats: {beats}.
Labels as small wooden signposts."

## 02 Paper Pop-Up (story)
**Reads as:** a pop-up book: flat die-cut card standing up from a fold.
**Build:** a two-page book (two thin boxes hinged at the spine). Every character and
prop is a flat `ShapeGeometry`/thin `ExtrudeGeometry` (depth 0.01) cut-out, parented to
a hinge so it rises as the page opens (rotate around the fold line). Paper texture from
`kit.canvasTexture` (fibre noise, faint print grain); white card edges via a slightly
larger back layer.
**Light:** one soft desk lamp from upper left with soft shadows so layers cast shadows
on each other; warm fill.
**Palette:** cream card `#f4ecd8`, ink `#2b2a33`, brick red `#c4553b`, mustard `#e0a93b`,
teal `#2f7f86`, leaf `#6c9a4b`.
**Camera:** front-on at book height, FOV 35, small push-ins per spread.
**Motion:** page turns (rotation about the spine) drive everything: layers fold up on
hinges with a slight overshoot; characters slide on tabs (straight paths) and pivot on
split-pins.
**Signature move:** turning the page folds the old scene flat and pops the next one up
in one motion.
**Traps:** thick, rounded cut-outs (looks like plastic); no shadows between layers;
camera orbiting behind the cards (shows they are flat).
**Prompt:** "Make a {N}s {aspect} three.js story about {topic} as a Paper Pop-Up book:
every element is a flat die-cut card layer on hinges, rising from the fold as pages
turn, lit by a warm desk lamp with layered shadows. Spreads: {beats}."

## 03 Soft Clay (explainer)
**Reads as:** plasticine models filmed in stop-motion.
**Build:** rounded primitives with many segments plus `kit.wobble` (seeded vertex
noise) so nothing is perfect; bump map from a canvas with thumbprint swirls and tool
marks; `roughness 0.6-0.75`, no metal. Eyes are white spheres with black pupils.
**Light:** big soft key (studio), gentle fill, soft shadows on a matte coloured table.
**Palette:** saturated but chalky: tomato `#e2553f`, sunflower `#f3b93b`,
mint `#7cc7a4`, sky `#79b2e0`, lilac `#b49ad9`, table `#efe4d2`.
**Camera:** fixed table-top camera, FOV 35, minimal moves (stop-motion style).
**Motion:** step the time to 12 fps (`t = Math.floor(t*12)/12`) and add a tiny seeded
per-frame jitter (0.3%) to positions; squash and stretch on landings.
**Signature move:** shapes squish into the next shape (scale swap through a squashed blob).
**Traps:** smooth 60 fps motion (kills it); glossy plastic; perfect spheres.
**Prompt:** "Make a {N}s {aspect} three.js explainer about {topic} in the Soft Clay look:
lumpy plasticine models with thumbprints and tool marks, chalky saturated colours on a
matte table, soft studio light, animated on twos at 12 fps with squash and stretch.
Beats: {beats}."

## 04 Tiny Diorama (explainer)
**Reads as:** a model town on a floating square tile.
**Build:** a thick rounded tile (`RoundedBoxGeometry` from addons) with a dirt-coloured
side band; chunky buildings as boxes with bevelled roofs; window grids drawn on canvas
textures; peg people (capsule + sphere); a toy van on a road loop; lollipop trees.
**Light:** sunny key with soft shadows, sky hemisphere fill; tilt-shift via `BokehPass`
or strong near/far fog.
**Palette:** grass `#8fc46a`, road `#5b5f6a`, walls `#f2e6d0`, roofs `#d9654b`,
accents `#4c9bd6`, `#f4c04f`, tile side `#a8794f`, sky `#dff0f7`.
**Camera:** high 3/4 view, long lens (FOV 22) so it reads small; slow orbit.
**Motion:** van follows a `CatmullRomCurve3`; peg people hop between stops; buildings
pop up with overshoot; small speech-bubble cards for labels.
**Signature move:** follow the token (van/person) around the tile as each stop lights up.
**Traps:** wide lens close up (loses the miniature feel); realistic proportions.
**Prompt:** "Make a {N}s {aspect} three.js explainer about {topic} as a Tiny Diorama:
a model town on a floating tile with chunky buildings, a toy van and peg people, sunny
soft light, long-lens tilt-shift camera. The {token} visits each stop: {beats}."

## 05 Blueprint Build (explainer)
**Reads as:** a drafting sheet whose drawing lifts into a wireframe, then becomes solid.
**Build:** blue sheet plane with a canvas grid, title block and dimension lines. The
object is built three times: `EdgesGeometry` lines (white), then a `wireframe: true`
mesh, then the solid `MeshStandardMaterial`. Reveal lines by animating
`geometry.setDrawRange` or a clipping plane.
**Light:** flat for the sheet stage; a key + rim appear as the object turns solid.
**Palette:** blueprint `#1f4e8c`, grid `#3a6fb3`, line white `#eaf2ff`, accent amber
`#ffb547`; solid stage in the real object's colours.
**Camera:** starts top-down (orthographic feel, FOV 20), tilts to 3/4 as the drawing
lifts off the page.
**Motion:** lines draw on in order (outline, then details, then dimensions); extrude
up from the sheet; faces fill in with a sweeping clip plane.
**Signature move:** the tilt from 2D plan to 3D while the lines rise off the paper.
**Traps:** showing the solid too early; illegible thin lines at 1080p (use
`Line2` from addons or tube geometry for thick lines).
**Prompt:** "Make a {N}s {aspect} three.js explainer about {topic} in Blueprint Build:
a blue drafting sheet whose line drawing draws itself, lifts into a 3D wireframe and
then becomes a solid lit object. Stages: {beats}. Dimension callouts as labels."

## 06 Spotlight Stage (story)
**Reads as:** a small dark toy theatre with card cut-out actors in shafts of light.
**Build:** proscenium arch (extruded shape) with velvet curtains (`PlaneGeometry`
with sine folds, deep red, high roughness), timber stage boards (canvas plank texture),
flat painted backdrops, card cut-out characters on sticks.
**Light:** almost dark ambient; 1-3 `SpotLight`s with soft penumbra as the only real
light; visible beams as additive transparent cones; slight dust (points).
**Palette:** velvet `#6e1423`, gold trim `#c9a24b`, timber `#7a5434`, backdrop indigo
`#1d2340`, warm spot `#ffd9a0`, cool spot `#9fc3ff`.
**Camera:** audience seat, FOV 40, slow push toward the stage across the film.
**Motion:** curtains part/close between acts; backdrops fly in from above; actors slide
on tracks and tilt; spots follow the speaker.
**Signature move:** blackout -> a single spot snaps on the next character.
**Traps:** too much ambient (no drama); bloom on everything.
**Prompt:** "Make a {N}s {aspect} three.js story about {topic} on a Spotlight Stage:
a dark toy theatre with velvet curtains, timber boards and card cut-out actors lit only
by shafts of spotlight. Acts: {beats}."

## 07 Neon Sign (explainer)
**Reads as:** glass neon tubing glowing on a painted brick wall at night.
**Build:** letters and icons as `TubeGeometry` along paths (draw paths per glyph with
`CatmullRomCurve3` or sample `ShapePath` outlines), emissive material + bloom; dark
back-tube segments where the tube jumps; small mounting clips. Brick wall from a canvas
texture (courses, mortar, paint flaking) as `map` + `bumpMap`.
**Light:** the tubes light the wall (add one coloured PointLight per sign), low
moonlight fill, light fog.
**Palette:** brick `#4a2f2b`, mortar `#6b5c55`, neon pink `#ff3fa4`, cyan `#33e1ff`,
amber `#ffb03b`, lime `#9dff5a`.
**Camera:** straight-on, FOV 35, slow lateral slide across the wall.
**Motion:** tubes flicker on (seeded stutter, then steady); sections light in order to
spell the idea; an arrow sign animates by cycling segments.
**Signature move:** the startup flicker with a buzz-like stutter before full glow.
**Traps:** bloom too strong (letters unreadable); flat glowing text with no tube form.
**Prompt:** "Make a {N}s {aspect} three.js explainer about {topic} as Neon Signs:
glass tubes built as 3D tube geometry glowing on a painted brick wall at night, each
idea flickering on in turn. Signs: {beats}."

## 08 Exploded View (explainer)
**Reads as:** a product pulled apart along its axes with numbered callouts.
**Build:** the product as a stack of parts (each a group). Each part has an
assembled position and an exploded offset along one axis; leader lines + numbered
circle tags (`kit.label`) attach to each part.
**Light:** clean studio: key, fill, rim; `kit.studioEnv()` for soft reflections;
white-to-light-grey floor gradient.
**Palette:** product colours + neutral studio `#f2f3f5`, lines `#2d3440`, tag accent `#ff6a3d`.
**Camera:** 3/4 from slightly above, FOV 35, slow orbit through the explode.
**Motion:** parts separate in sequence (`easeInOutCubic`) along their axis, a beat per
part, callouts draw on; then everything snaps back together at the end.
**Signature move:** the whole thing hangs exploded and turning, every part named.
**Traps:** parts flying in random directions; callouts overlapping (stagger heights).
**Prompt:** "Make a {N}s {aspect} three.js explainer about {topic} as an Exploded View:
{object} built from primitives separates along its axes part by part, each with a
numbered callout. Parts: {beats}. Reassembles at the end."

## 09 Marble Run (explainer)
**Reads as:** a wooden marble run whose marbles carry the idea through gates into jars.
**Build:** wooden tracks as `TubeGeometry` half-pipes (or extruded U profile) along
curves; brass pins (metal cylinders), flip gates, a lift wheel; glass marbles
(`MeshPhysicalMaterial` transmission, coloured); glass jars with label cards.
**Light:** warm workshop key with soft shadows; `kit.studioEnv()` for brass and glass.
**Palette:** maple `#d9b483`, walnut `#7a5434`, brass `#c9a24b`, marbles
`#e84a5f`, `#2a9d8f`, `#f4a261`, `#457b9d`, backdrop `#efe7dc`.
**Camera:** 3/4 side view, FOV 40, follows the lead marble with lag.
**Motion:** each marble's position is `curve.getPointAt(u(t))` with an ease-in
acceleration on slopes; gates flip on a beat and route marbles by type; jars fill up
(stack positions computed from count).
**Signature move:** sorting - a gate flips and marbles of each kind split to their jar.
**Traps:** simulated physics (non-deterministic); marbles clipping through track.
**Prompt:** "Make a {N}s {aspect} three.js explainer about {topic} as a Marble Run:
a wooden track with brass pins and gates; glass marbles stand for {things} and are
routed into labelled jars. Stages: {beats}."

## 10 X-Ray (explainer)
**Reads as:** a radiograph you can move: translucent shell, bright bones, one warm part.
**Build:** outer shells use a fresnel shader (`ShaderMaterial`: bright at grazing
angles, transparent face-on, additive blending); inner parts brighter; the key part
in a warm emissive colour. A scanner bed and scanning bar.
**Light:** no lighting model - all brightness from the shader; dark blue-black field
with faint scanline overlay.
**Palette:** field `#05080f`, x-ray `#cfe6ff`, cyan tint `#6fb6ff`, key accent `#ff9a3d`.
**Camera:** top-down slide like a scanner, then a slow rotation to show depth.
**Motion:** the scan bar sweeps and reveals insides as it passes (shader uniform);
the key part pulses gently.
**Signature move:** the sweep: outside looks normal, behind the bar it turns to x-ray.
**Traps:** too many warm accents (keep one); depth sorting artifacts (set
`depthWrite: false` on shells).
**Prompt:** "Make a {N}s {aspect} three.js explainer about {topic} as an X-Ray:
{object} on a scanner bed, a scan bar sweeps across turning it into a translucent
radiograph, with one warm accent on {key part}. Beats: {beats}."

## 11 LED Wall (story)
**Reads as:** a giant outdoor screen made of frosted LED lamps.
**Build:** an `InstancedMesh` of small spheres or rounded boxes (e.g. 96x54); each
frame draw the "picture" on an offscreen canvas at grid resolution, read pixels, and
set instance colours (emissive via instanceColor + bloom). Steel frame and a city
night plaza around it.
**Light:** the wall lights the scene (big RectAreaLight or PointLights tinted by the
average colour); night ambient.
**Palette:** whatever the content is, saturated; frame `#2a2d33`, night sky `#0b1020`.
**Camera:** starts close on individual lamps (abstract), pulls back to reveal the
picture and the plaza.
**Motion:** content is 2D animation drawn on the canvas (type, icons, simple
characters) - scrolling text, wipes, pixel dissolves.
**Signature move:** the pull-back from blurry glowing dots to a readable image.
**Traps:** grid too fine (looks like a normal screen); unreadable text at low res
(use bold pixel type).
**Prompt:** "Make a {N}s {aspect} three.js story about {topic} on an LED Wall: a giant
outdoor screen built from thousands of frosted lamps showing simple pixel animation.
Start close on the lamps, pull back to reveal. Screens: {beats}."

## 12 Inflated (explainer)
**Reads as:** glossy inflatable objects bobbing in a one-colour studio.
**Build:** shapes with puffy edges: extrude shapes with large bevels
(`bevelSize`/`bevelThickness` ~30% of size, `bevelSegments` 8+), or capsules/tori;
seams as thin darker tubes; `MeshPhysicalMaterial` clearcoat 1, roughness 0.25.
**Light:** `kit.studioEnv()` for reflections, soft key, studio floor and wall in the
same colour (infinite cove).
**Palette:** one background colour per film (e.g. lilac `#c9b6ff` or peach `#ffc9a8`),
objects in 2-3 candy colours `#ff5d8f`, `#ffd23f`, `#3bceac`, `#5b8cff`.
**Camera:** front 3/4, FOV 35, gentle float.
**Motion:** inflate from flat (scale y/z from 0.05 with overshoot and wobble); idle
bob and sway; deflate exits; bump into each other with squash.
**Signature move:** the inflate pop-in with a jelly wobble.
**Traps:** matte material; hard-edged shapes; multi-colour backgrounds.
**Prompt:** "Make a {N}s {aspect} three.js explainer about {topic} in the Inflated
look: glossy puffy inflatable objects with seams, inflating into a single-colour
studio and bobbing gently. Beats: {beats}."

## 13 Painted (story)
**Reads as:** a lit 3D scene rendered as an oil painting.
**Build:** a simple lit scene (any subject) plus a post-process pass: Kuwahara filter
(`ShaderPass` with a 4-sector Kuwahara, radius 5-8 px) to make brush patches, then a
canvas-texture brush/impasto normal overlay and slight colour quantisation, then a
paper/canvas weave overlay.
**Light:** painterly: strong warm key, cool shadows, golden hour or candlelight.
**Palette:** ochre `#c98a3a`, umber `#5a3b26`, ultramarine `#3a4f9c`, viridian
`#2f6f5b`, cream highlight `#f3e3c2`.
**Camera:** slow, contemplative dolly; composed like a painting (rule of thirds).
**Motion:** slow - wind in grass/cloth, drifting light; transitions as a wet-paint
dissolve (blend two renders through a brush-stroke mask).
**Signature move:** the brush-stroke wipe between scenes.
**Traps:** fast motion (filter shimmers - lower radius or slow down); sharp UI text
(paint the words into the scene).
**Prompt:** "Make a {N}s {aspect} three.js story about {topic} in the Painted look:
simple lit 3D scenes rendered through a Kuwahara oil-paint filter with canvas weave,
golden painterly light, slow camera, brush-stroke wipes. Scenes: {beats}."

## 14 Circuit City (explainer)
**Reads as:** a circuit board filmed like a city at night.
**Build:** green board plane with canvas-drawn traces; chips as dark boxes
(skyscrapers) with pin rows; capacitors as cylinders (water towers); resistors with
colour bands. Signals are small emissive pills moving along trace paths with trails.
**Light:** low blue moonlight, emissive streetlight-like LEDs, bloom, fog, gold traces
catching light.
**Palette:** board `#0d3b2e`, trace gold `#c9a24b`, chip `#1a1c22`, signal cyan
`#3ff0ff`, magenta `#ff4fd8`, LED amber `#ffb347`.
**Camera:** low "street-level" dolly between chips, FOV 45; ends on a high aerial.
**Motion:** packets travel traces (`curve.getPointAt`), chips light windows when they
"process", data bursts at junctions.
**Signature move:** the street-level fly-through following one packet.
**Traps:** camera too high early (it's just a board); too many moving packets.
**Prompt:** "Make a {N}s {aspect} three.js explainer about {topic} as Circuit City:
a circuit board filmed like a night city - chips as towers, traces as streets, glowing
packets as traffic. Follow one packet: {beats}."

## 15 Glass and Light (explainer)
**Reads as:** glassware holding coloured liquids on a dark stone table.
**Build:** beakers, flasks, tubes via `LatheGeometry` (outer + inner wall),
`MeshPhysicalMaterial` transmission 1, thickness, ior 1.5; liquids as inner lathe
solids with transmission + `attenuationColor`; meniscus as a thin disc. Dark stone
table from canvas noise. Pours as tube geometry along a curve.
**Light:** `kit.studioEnv()` essential; one strong backlight/rim so liquids glow;
dark background.
**Palette:** stone `#1c1d21`, glass tint `#dfe9ef`, liquids amber `#ffb347`, ruby
`#d7263d`, emerald `#1b998b`, sapphire `#2e86de`.
**Camera:** low table-height, FOV 35, slow slide past the glassware, shallow depth.
**Motion:** liquids rise/fall (scale inner solid's height, keep meniscus on top);
pours along curves; mixing blends colours (lerp attenuationColor); bubbles as points.
**Signature move:** two colours pour into one vessel and blend into a third.
**Traps:** no environment map (glass turns invisible/grey); bright background.
**Prompt:** "Make a {N}s {aspect} three.js explainer about {topic} in Glass and Light:
glassware with glowing coloured liquids on a dark stone table, backlit, liquids standing
for {quantities}, pouring and mixing to show {idea}. Beats: {beats}."
