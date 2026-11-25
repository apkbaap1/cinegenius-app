# The looks: style cards and slot values

Each card is copied word for word from the atlas prompt for that look. The slot values fill `PROMPT.md`.

| # | Look | Folder | Use | Google Fonts | Extra library | Reference topic |
|---|---|---|---|---|---|---|
| 01 | Low-Poly | `01-low-poly` | an explainer | Oswald | none | The water cycle: evaporation from the sea, clouds forming, rain on the mountains, a river running back to the sea |
| 02 | Paper Pop-Up | `02-paper-pop-up` | a story | Fraunces | none | From flower to honey jar: a bee on flowers, the hive, the jar on the breakfast table |
| 03 | Soft Clay | `03-soft-clay` | an explainer | Fredoka | TEXT3D | How compound interest grows your savings |
| 04 | Tiny Diorama | `04-tiny-diorama` | an explainer | Fredoka | none | How your parcel gets to you |
| 05 | Blueprint Build | `05-blueprint-build` | an explainer | none | STROKEFONT | An ergonomic desk set-up: screen top at eye level, elbows at about 90 degrees, feet flat on the floor |
| 06 | Spotlight Stage | `06-spotlight-stage` | a story | Oswald, Playfair Display | none | The first powered flight: from the Wright brothers' bicycle shop in Dayton to 12 seconds and 120 feet at Kitty Hawk on 17 December 1903 |
| 07 | Neon Sign | `07-neon-sign` | an explainer | none | STROKEFONT | How a rainbow forms |
| 08 | Exploded View | `08-exploded-view` | an explainer | IBM Plex Mono, Space Grotesk | none | What's inside a ballpoint pen |
| 09 | Marble Run | `09-marble-run` | an explainer | Oswald | none | How your inbox sorts email |
| 10 | X-Ray | `10-x-ray` | an explainer | Space Grotesk, IBM Plex Mono | none | Why a vacuum flask keeps drinks hot |
| 11 | LED Wall | `11-led-wall` | a story | none | none | The Tortoise and the Hare, as a pixel cartoon playing on the lamp wall |
| 12 | Inflated | `12-inflated` | an explainer | none | STROKEFONT | How a hot-air balloon flies |
| 13 | Painted | `13-painted` | a story | Caveat | none | From wind to bread: a gust crosses a wheat field and turns the windmill, the millstone grinds flour, and a loaf ends up on the bakery sill |
| 14 | Circuit City | `14-circuit-city` | an explainer | IBM Plex Mono | none | A prompt's trip across a chip: PROMPT, MEMORY, PROCESSOR, ANSWER |
| 15 | Glass and Light | `15-glass-light` | an explainer | Inter | none | How a vinaigrette comes together: 3 parts oil, 1 part vinegar |
| 16 | Factory Line | `16-factory-line` | an explainer | Fredoka, Inter | none | How an AI agent finishes a task: plan, search, write, check |
| 17 | White Model | `17-white-model` | an explainer | Inter, IBM Plex Mono | none | How rooftop solar powers a home: sunlight, panels, inverter, home, and the surplus going out to the grid |
| 18 | Voxel | `18-voxel` | an explainer | none | none | How a tomato plant grows: seed, sprout, plant, fruit |
| 19 | Data Skyline | `19-data-skyline` | an explainer | Space Grotesk, IBM Plex Mono, Fraunces | none | World population by the billion: 1 billion in 1804, 2 in 1927, 4 in 1974, 8 in 2022 |
| 20 | Ink and Toon | `20-ink-toon` | an explainer | Anton, Caveat | none | Pour-over coffee in three steps: grind, bloom, pour |
| 21 | Pin Wall | `21-pin-wall` | an explainer | Oswald, Inter | none | How a volcanic island is born |
| 22 | Toy Blocks | `22-toy-blocks` | an explainer | Fredoka, Fraunces | none | The 50/30/20 budget rule: 50% needs, 30% wants, 20% savings |
| 23 | Particle Swarm | `23-particle-swarm` | an explainer | Inter | none | Why popcorn pops |
| 24 | Museum Gallery | `24-museum-gallery` | an explainer | DM Serif Display, Oswald, Space Mono | none | Four moments that led to AI today: Turing's question, Deep Blue, AlphaGo and ChatGPT |
| 25 | Pencil Sketch | `25-pencil-sketch` | an explainer | none | STROKEFONT | How a house goes up: foundation, frame, walls, roof |
| 26 | Domino Chain | `26-domino-chain` | an explainer | Anton, Oswald, Fraunces | none | Small starts, big finishes: a domino can knock over one 1.5 times its size, so 13 dominoes take you from 5 mm to 65 cm |
| 27 | Node Network | `27-node-network` | an explainer | Oswald, Fraunces | none | How word of mouth grows a small business: 1 happy customer, then 3, 9, 27 |
| 28 | Shadow Box | `28-shadow-box` | an explainer | Anton | none | Computers keep shrinking: a room-sized mainframe, a desktop, a laptop, a phone in your hand |
| 29 | Layer Stack | `29-layer-stack` | an explainer | Space Grotesk, Inter, IBM Plex Mono | none | What's inside an AI app: interface, agent, model, your data, chips |
| 30 | Dithered | `30-dithered` | an explainer | Archivo Black | none | The Pomodoro technique: 25 minutes of work, 5 minutes of rest, repeat |
| 31 | Floating Screens | `31-floating-screens` | an explainer | Fraunces, Inter | none | Ordering bread online from a small bakery in three steps: choose the loaf, check the basket, order confirmed |
| 32 | Device Hero | `32-device-hero` | a product (the brief has no "Tell my content as" line) | Fraunces, Inter | none | Streak, a habit tracker: ticking off today's last habit closes the ring and turns a 29-day streak into 30 |
| 33 | Studio Product | `33-studio-product` | a product (the brief has no "Tell my content as" line) | Inter, Space Grotesk | none | Launch film for "Tide", a made-up insulated steel water bottle: cold for 24 hours |

## 01. Low-Poly

- Folder: `references/looks/01-low-poly/style.js`
- `{LIBS}`: ``
- `{FONTS}`: `- Load these Google Fonts before building (the kit awaits the specs in style.fonts): Oswald`
- Tell it as: an explainer
- Reference topic: The water cycle: evaporation from the sea, clouds forming, rain on the mountains, a river running back to the sea

```
STYLE CARD
Name: Low-Poly
Family: Filters over 3D
Use: explainer
Look: A miniature world of flat, faceted shapes, like folded paper or cut stone: every triangle is one tone, and neighbours differ slightly, inside a short palette of sand, coral and cream against teal water and sage greens.
Motion: Things grow by unfolding facet by facet from one point, or pop out of the ground with a bounce; water heaves so its facets keep catching the light, clouds drift, small cut-gem droplets rise and fall.
Light: One low, warm sun from the side with soft-edged shadows, a cool blue sky filling the shadow sides so every facet turns either warm or cool, and peach haze that swallows the distance.
Materials: Matte paper-like facets with no texture at all; only the water is slightly glossy. Colour comes per triangle from the palette, never from gradients.
Camera: One continuous crane move on a long lens with tilt-shift-shallow focus, so the landscape feels like a tabletop model: close on each stage in turn, then out to the whole scene.
Finish: True depth of field and motion blur, colours kept true (neutral tone curve), a gentle vignette and only enough grain to keep the sky from banding. No filter pass: the facets are real geometry.
Good for: Processes that happen in a place: cycles, journeys, supply chains, how a system of parts feeds itself. Each stage is a spot in the landscape with a paper flag, and the camera travels the route between them.
```

## 02. Paper Pop-Up

- Folder: `references/looks/02-paper-pop-up/style.js`
- `{LIBS}`: ``
- `{FONTS}`: `- Load these Google Fonts before building (the kit awaits the specs in style.fonts): Fraunces`
- Tell it as: a story
- Reference topic: From flower to honey jar: a bee on flowers, the hive, the jar on the breakfast table

```
STYLE CARD
Name: Paper Pop-Up
Family: Material worlds
Use: story
Look: A pop-up book open on a wooden table in lamplight. Every scene is built from flat die-cut card: printed in a few flat colours, creased down the middle, standing in layers on real fold mechanisms, with a pale core showing on every cut edge.
Motion: Only the pages move. As a page turns, the scene on the old spread is pressed flat under it and the next one is pulled up out of the gutter by its own folds, layer after layer; pieces on paper arms tremble when the page lands. A pull tab slides out to change one thing on the last spread.
Light: One warm desk lamp from the upper left with soft-edged shadows, so each layer throws a shadow on the one behind and the two wings of every fold take different light; a faint cool rim from behind; the table falls off into the dark.
Materials: Thick uncoated card with visible fibre and a slight cockle, flat matt ink with a little grain, bare cream card on cut edges and as a thin margin around each shape, cloth-covered boards, dark oiled wood.
Camera: A long lens looking down the gutter from about twenty-five degrees up, close enough that the spread fills the frame. One slow drift from left to right that breathes out a little for each page turn and ends in a gentle push; shallow focus on the middle layers.
Finish: Real depth of field, motion blur and area-light shadows from the accumulation renderer; neutral tone mapping so the inks stay true, a soft vignette, very fine grain.
Good for: A story or a process in a few steps: one spread per step, each with one big subject in the middle, supporting pieces at the sides and one short line of words on a paper ribbon. A pull tab can show a change on the spot (fill, reveal, move).
```

## 03. Soft Clay

- Folder: `references/looks/03-soft-clay/style.js`
- `{LIBS}`: `, and the TEXT3D library (load it after the STAGE kit)`
- `{FONTS}`: `- Load these Google Fonts before building (the kit awaits the specs in style.fonts): Fredoka`
- Tell it as: an explainer
- Reference topic: How compound interest grows your savings

```
STYLE CARD
Name: Soft Clay
Family: Material worlds
Use: explainer
Look: Everything is modelled in plasticine and filmed like stop-motion on a small tabletop: chunky, slightly lopsided forms with fingerprints, tool marks and pits in them, in a few colours from one box of clay, in front of a seamless paper backdrop.
Motion: Animated on twos (15 poses a second) with no motion blur, by swapping shapes like a stop-motion animator: a ball of clay buds, hops over on an arc, lands as a thick puck, is pressed too flat and springs back into a coin. Stacks flinch when something lands on them, words are slapped onto the backdrop, and anything just touched shifts by a hair between poses. Only the camera moves smoothly.
Light: One big soft lamp from the upper left that pools on the backdrop and falls off to the corners, plus soft light from the whole sky that is blocked in every crease and under every object, so contact shadows are real.
Materials: Matte, waxy plasticine with a velvety sheen: a generated surface of fingerprints, knife drags, pits and joins bends the light, pressed spots are a little shinier, and each colour has a second colour streaked through it. The backdrop is uncoated coloured card.
Camera: A macro lens with shallow focus on a slow dolly: it starts close enough to read the fingerprints, travels along with the action, then pulls back in the same move until the whole set fits, and ends on a slight push-in.
Finish: True colours (neutral tone curve), almost no bloom, a light vignette and a little grain; a faint flicker in the lamp from pose to pose, like single frames shot one at a time.
Good for: Anything that can be told with a few friendly objects on a table: amounts as piles and stacks, growth and comparison, simple characters and props, a number or a few words as fat clay letters. Good for warm, non-technical topics.
```

## 04. Tiny Diorama

- Folder: `references/looks/04-tiny-diorama/style.js`
- `{LIBS}`: ``
- `{FONTS}`: `- Load these Google Fonts before building (the kit awaits the specs in style.fonts): Fredoka`
- Tell it as: an explainer
- Reference topic: How your parcel gets to you

```
STYLE CARD
Name: Tiny Diorama
Family: Spaces and journeys
Use: explainer
Look: A whole little world on one floating tile, like a designer's model on a desk: chunky rounded buildings, a toy van, peg people and lollipop trees in a few matte paint colours, on a thick slab of ground whose cut sides show soil, clay and rock.
Motion: Small life at small scale: one vehicle drives the route with weight (it squats, leans and nods when it brakes), doors roll and swing, smoke puffs, peg people hop, lights come on, and each stop's sign flips to the accent colour when its part is done. The tile turns slowly the whole time.
Light: One soft warm sun from the front left that sinks and warms through the clip, a cool sky that darkens every crease and contact, and a few tiny lamps that take over at the end.
Materials: Matte painted-model surfaces, flocked grass with a soft sheen, a hand-painted cross-section of earth with real stones pressed into it, card signs. One accent colour is kept for the thing the story follows.
Camera: Long lens, three-quarter view from above, close enough that the tile fills the frame. The tile turns on its turntable to show each stop in order while the camera makes one slow rise and push-in; neither ever stops.
Finish: Strong tilt-shift: a wide-open lens keeps a thin band sharp around the action and melts the near and far edges of the tile, which is what makes it read as a miniature. The band travels with the story and the lens stops down a little for the final picture. True colours, slightly rich, light vignette, almost no grain.
Good for: Places, systems and journeys: anything with a few stops and something that travels between them (a supply chain, a commute, how a request moves through a company). Each stop is a little building with a sign; the traveller links them in order.
```

## 05. Blueprint Build

- Folder: `references/looks/05-blueprint-build/style.js`
- `{LIBS}`: `, and the STROKEFONT library`
- `{FONTS}`: (no line)
- Tell it as: an explainer
- Reference topic: An ergonomic desk set-up: screen top at eye level, elbows at about 90 degrees, feet flat on the floor

```
STYLE CARD
Name: Blueprint Build
Family: Diagrams with depth
Use: explainer
Look: A real drafting sheet: deep blueprint blue with grain and worn fold creases, a title block, a construction grid, crisp white linework in two weights with hidden edges dashed, dimension arrows and numbered notes in plotted single-stroke capitals. The drawing turns out to be a 3D wireframe, and then a solid object standing on its own plan.
Motion: Lines plot themselves in pen order with a hot tip. As the camera tips over, each part rises out of its own plan, which stays printed on the sheet. The numbered notes peel off the paper, turn to face the lens and are tied to the model with leaders, one by one. Then a hatched section plane climbs through the wireframe and leaves real material under it.
Light: One soft key from behind and to the side, so tops and one flank are lit, the near faces stay in shade and a long soft shadow falls toward the camera across the sheet. A little cool fill. At the end the desk lamp in the model switches on.
Materials: Uncoated blue paper that takes the light, flat white ink. The built object is restrained and real: pale oak, matt white steel, rust wool, off-white plaster, graphite plastic. The white lines stay on it as a faint ghost.
Camera: One continuous crane move with a long lens that opens up: it starts straight above the sheet, where the drawing reads as a flat plan, tips down to a three-quarter view as the drawing gains height, and keeps drifting in until the last frame.
Finish: Almost none: neutral tone curve so the blue and white stay true, light vignette, a trace of bloom on pen tips and the lamp, fine grain. Hidden lines are found by a real depth test, not drawn by hand.
Good for: Plans, set-ups and how-it-is-made: first the layout as a flat drawing, then the same thing as an object, with dimensions and two or three numbered pointers attached to the places they talk about.
```

## 06. Spotlight Stage

- Folder: `references/looks/06-spotlight-stage/style.js`
- `{LIBS}`: ``
- `{FONTS}`: `- Load these Google Fonts before building (the kit awaits the specs in style.fonts): Oswald, Playfair Display`
- Tell it as: a story
- Reference topic: The first powered flight: from the Wright brothers' bicycle shop in Dayton to 12 seconds and 120 feet at Kitty Hawk on 17 December 1903

```
STYLE CARD
Name: Spotlight Stage
Family: Spaces and journeys
Use: story
Look: A toy theatre at night: crimson velvet, a worn timber stage and a painted world of flat card cut-outs standing in layers, with an easel card at the front for the caption. The room is dark; whatever the story is about is picked out by shafts of light cutting through haze.
Motion: It plays like a show. Scenery flats slide in from the wings, pieces are flown in from above on thin rods, actors and props are cut-outs pushed along slots in the floor with a small wobble. Scene changes happen in view: flats part, others glide in, the easel card is pulled and the light changes colour.
Light: Only stage lamps, each a real spot light with a matching visible beam: two follow spots from the house that stay on the actors, two wide front washes that set the colour of the scene, a top light that drops a shaft on the centre of the action, a small special on the easel card and a row of horizon lights behind the last flat. No fill: what no lamp touches stays black.
Materials: Thick matt card painted in flat gouache colours with a fine ink line and paper grain, bare card on the sawn edges, thin steel rods and wires, deep-pile velvet with gold braid, dark stained boards with a satin reflection.
Camera: One slow continuous move from a seat in the stalls: it starts a little left on the first scene, eases back and across as the stage changes, then drifts in and up with the action. Long lens, the whole stage picture sharp.
Finish: Beams are ray-marched cones with drifting haze and dust that only shows inside them; soft shadows from each layer onto the one behind, bloom on the brightest card, filmic contrast, heavy vignette, fine grain.
Good for: Stories, history, fables and step-by-step scenes. One scene per beat: each beat is a stage picture built from flat cut-out scenery and cut-out actors, and the change between beats is shown, not cut. The follow spot says where to look, the colour of the wash says where and when we are, and one short line on the easel card names the scene (it can carry a running number).
```

## 07. Neon Sign

- Folder: `references/looks/07-neon-sign/style.js`
- `{LIBS}`: `, and the STROKEFONT library`
- `{FONTS}`: (no line)
- Tell it as: an explainer
- Reference topic: How a rainbow forms

```
STYLE CARD
Name: Neon Sign
Family: Flat content made physical
Use: explainer
Look: A line drawing bent out of real glass tube and mounted on a painted brick wall at night: bright cores, coloured gas, black-painted returns into rubber boots, clear standoffs, every unlit tube waiting as milky glass. Small tube lettering for captions. Wet ground at the foot of the wall mirrors the end of it.
Motion: Neon never fades and never slides. A section snaps on, drops out and snaps again before it holds a touch over-bright and settles; one tube buzzes with the glow crawling along the glass before it catches. Things move the way real animated signs do it: by swapping between sets of tubes (pose A, pose B, pose C) and by lighting the segments of a path one after another, so light appears to travel.
Light: The tubes are the only real light: each one throws its own colour on the brick, hot right behind the glass and falling off across the wall, and every flicker moves the whole scene. A faint cold street light keeps the unlit glass readable.
Materials: Milky glass tube, semi-gloss paint over rough brick with soot and rain streaks, black rubber and matte blockout paint, clear acrylic standoffs, galvanised conduit, wet asphalt with puddles.
Camera: Long lens, one slow continuous crane. It starts a little oblique so the glass stands off the wall, drifts in on the part of the drawing that is lighting, then follows the light down the wall and settles low and square on the result, over its reflection in the wet ground. It is still drifting on the last frame.
Finish: Wide soft bloom from the over-bright cores, filmic contrast with deep blacks, slight depth of field, light vignette, fine grain, a trace of chromatic aberration.
Good for: How something works, as a diagram that switches on in the order it happens: light, electricity, signals, water, traffic, money, a recipe, a journey. A beat is a group of tubes that strikes on because the one before it did. Outlines are the things, a chase of short segments is whatever flows between them, alternating poses are whatever repeats (rain, flames, wheels, a heartbeat), and colour carries meaning, so use it for the part of the idea that really is about colour, state or category. One small tube caption per beat names what just lit; the last thing to light is the result, and it holds.
```

## 08. Exploded View

- Folder: `references/looks/08-exploded-view/style.js`
- `{LIBS}`: ``
- `{FONTS}`: `- Load these Google Fonts before building (the kit awaits the specs in style.fonts): IBM Plex Mono, Space Grotesk`
- Tell it as: an explainer
- Reference topic: What's inside a ballpoint pen

```
STYLE CARD
Name: Exploded View
Family: Diagrams with depth
Use: explainer
Look: A product teardown film: one object hangs over a pale seamless floor, comes apart along its axis into its parts, and every part gets a numbered callout in ink blue.
Motion: The object unscrews and pulls apart along its axis into sub-assemblies, they park as two tiers, then each spreads into its parts one after another; every part overshoots its place, settles and keeps a slight tilt of its own. Callouts draw on as the focus reaches each part, then everything returns in reverse and seats with a click.
Light: One very large soft top light, so every part drops a soft shadow on the floor, with sky light for the contact shading. Black cards in the reflections give chrome its dark streaks and clear plastic its edges.
Materials: Real finishes, one per part: clear plastic, chrome, turned brass, a steel spring wound as a true helix, dimpled black rubber, milky tube with blue ink, one orange moulded piece.
Camera: A long lens on a slow crane, looking down the axis so the row recedes: close on the object, back and up as it opens, creeping in while a shallow focus travels from part to part, then close again as it shuts. One continuous move.
Finish: Depth of field and motion blur from the lens itself, neutral colour, almost no bloom, a light vignette. Labels and leader lines are drawn on top so they stay sharp.
Good for: How something is built or what is inside it: any object made of parts. Each part is one named item, the order of the row is the order of assembly, and putting it back together shows where everything goes.
```

## 09. Marble Run

- Folder: `references/looks/09-marble-run/style.js`
- `{LIBS}`: ``
- `{FONTS}`: `- Load these Google Fonts before building (the kit awaits the specs in style.fonts): Oswald`
- Tell it as: an explainer
- Reference topic: How your inbox sorts email

```
STYLE CARD
Name: Marble Run
Family: Machines that explain
Use: explainer
Look: A handmade wooden marble run shot like a product film: a walnut board carrying pale maple rails on brass pins, brass paddle gates, swirled glass marbles and three glass jars on a maple plinth with the labels burnt into the wood, in front of a shaded seamless backdrop.
Motion: Marbles are let go one at a time, pick up speed as they drop, clack against brass gates that flip to sort them, fall into their jar and settle into a pile. Nothing is eased by hand: speed comes from the height each marble has lost, and the piles are a small physics run.
Light: Warm daylight from the upper left, kept off the backdrop so the wall sits in soft shade behind the sunlit wood. Rails and marbles throw soft shadows onto the board, and every marble drops a small glint of its own colour into its shadow.
Materials: Satin maple and walnut with drawn grain, polished brass that picks up the window, coloured glass with a white vein that glows on the side away from the light, thick clear jar glass with bright edges.
Camera: Long lens, shallow focus, one continuous shot that stays close. It rides beside one marble from the hopper, gets to the first gate just ahead of it and waits for the clack, follows it across the second gate, then travels down as it drops into its jar, opens just far enough to hold all three jars and pushes slowly in on the jars, their counters and their names.
Finish: Real motion blur and depth of field, colours kept true (neutral tone curve), a small bloom on brass and glass glints, light vignette, fine grain.
Good for: Sorting, routing and filtering: anything where many items take different paths through the same rules. The hopper is what comes in, each gate is one rule, each jar is one outcome with a counter under it, and how full the jars end up is the result.
```

## 10. X-Ray

- Folder: `references/looks/10-x-ray/style.js`
- `{LIBS}`: ``
- `{FONTS}`: `- Load these Google Fonts before building (the kit awaits the specs in style.fonts): Space Grotesk, IBM Plex Mono`
- Tell it as: an explainer
- Reference topic: Why a vacuum flask keeps drinks hot

```
STYLE CARD
Name: X-Ray
Family: Filters over 3D
Use: explainer
Look: A radiograph you can move around: the object turns into glowing film on a dark scanner bed, every wall brightest where you look through the most material, with one warm accent for the part that matters right now.
Motion: The object starts solid. A scanning plane sweeps along it, the cut face glows as a live cross-section, and everything behind the plane is left see-through. Then the inner parts light up one at a time as something (here heat) runs into them.
Light: Before the scan, a soft overhead key and long strip reflections on brushed steel. After it the room dims and the picture is made of emitted light only: film, accent and a faintly lit grid.
Materials: Brushed steel and black plastic for the solid; for the X-ray one material that adds up the true path length through each closed part, so edges, rims and overlaps brighten by themselves.
Camera: Long lens. One continuous crane from a low three-quarter view of the cut face up to a near plan view, like the plate of a radiograph, then a slow push that never stops.
Finish: Gentle bloom on the brightest edges and the accent, neutral tone mapping so the two colours stay true, fine grain, a soft vignette. Callouts are crisp 2D type on poles that track points on the model.
Good for: What is inside something and how it works: anatomy, machines, products, buildings. Up to three inner parts, each lit and named in turn, with a simple flow (heat, air, current, force) shown acting on them.
```

## 11. LED Wall

- Folder: `references/looks/11-led-wall/style.js`
- `{LIBS}`: ``
- `{FONTS}`: (no line)
- Tell it as: a story
- Reference topic: The Tortoise and the Hare, as a pixel cartoon playing on the lamp wall

```
STYLE CARD
Name: LED Wall
Family: Flat content made physical
Use: story
Look: A giant outdoor screen made of real lamps: thousands of frosted round LEDs in black louvred cabinets on a steel gantry at night. From far away it is a crisp bright picture; close up it falls apart into single glowing lamps, each with a red, a green and a blue chip under its lens.
Motion: The wall plays pixel animation at one pixel per lamp and 30 pictures a second: characters built from a few flat colours with a dark outline walk, run, stop and react in real cycles, the ground scrolls under them lamp by lamp with slower hills behind, and one short caption per beat pushes up into a ticker strip along the bottom. The camera does the opposite of the content: one slow continuous pull from a single lamp to the whole wall, still drifting at the end.
Light: The wall is the light. Its own colours spill onto the louvres and the black plastic between the lamps, glow in the haze around it, tint the steel and paint the wet ground, and all of it changes when the picture changes. One cold floodlight from behind gives the steel a rim; everything else is night.
Materials: Frosted dome lenses in black collars, satin black louvres and cabinet faces with seams and screws, galvanised lattice steel, rubber cable, wet tarmac with dry patches and a painted line.
Camera: Long lens. Starts as a macro shot at a low angle across the lamps with very shallow focus, pulls back and swings round to face the wall while the story waits on its opening pose, has the wall in frame by the time the first story event happens, and then keeps drifting back and across, low over the wet ground, to the last frame.
Finish: Soft bloom from the lamps, true-colour (neutral) tone mapping so the LED colours stay saturated, light vignette, very little grain. No scanline or pixel filters: the dots are real geometry.
Good for: Any 2D animation, diagram or story that can be drawn at lamp resolution: a fable with two characters, a process with parts that move along a track, a chart that grows, a map with a route, a game-like sequence. Draw it on a small canvas with one pixel per lamp. A beat is something happening in that picture (a character sets off, stops, is overtaken, arrives); a label is one short dot-font line in the ticker strip; what moves is the pixel picture, while the wall, its housing and the light it throws stay the same and take their colour from whatever is playing.
```

## 12. Inflated

- Folder: `references/looks/12-inflated/style.js`
- `{LIBS}`: `, and the STROKEFONT library`
- `{FONTS}`: (no line)
- Tell it as: an explainer
- Reference topic: How a hot-air balloon flies

```
STYLE CARD
Name: Inflated
Family: Material worlds
Use: explainer
Look: Everything is a glossy inflatable in a bright one-colour studio: here a striped hot-air balloon, its basket, a flame, arrows, clouds and small tube letters. Each skin has welded seams and is limp, flat and creased when short of air, round and mirror-smooth when full.
Motion: Air is the animation. Things fill in pumps that overshoot and snap taut, swell from the valve end outwards, stand up, wobble and settle. Full things float and sway, landings squash and rock, arrows and captions inflate in and deflate out. Every jolt rings out as a wobble.
Light: Softboxes overhead and to the left and a thin strip on the right draw long white highlights on every skin. A soft key from the upper left shapes the forms and drops soft shadows; the floor and the flame bounce their colour onto the skins.
Materials: Clear-coated vinyl in hot candy colours (pink, orange, yellow, red) with cream trim and a wicker-orange basket, on a cobalt sweep with just enough sheen to hold a blurred pool of colour under each object.
Camera: One slow, continuous crane on a long lens that stays with the main object: high over it while it lies on the floor, sinking and pulling back as it stands, looking up at it as it rises, overtaking it to look down as it sinks, level again for the last hold.
Finish: True colours (neutral tone curve), real motion blur on the wobble, a touch of depth of field, soft bloom on the highlights and the flame, almost no grain.
Good for: Any explainer or story that can be told with a few simple inflated objects and characters. It is strongest where pressure, growth, floating, squeezing or too much and too little is the point, because how full each thing is carries the meaning. A beat is one change of air (something fills, lifts, vents, sags) that causes the next one; small balloon arrows show a push or a flow; each beat gets one short caption in small tube letters at the side of the frame.
```

## 13. Painted

- Folder: `references/looks/13-painted/style.js`
- `{LIBS}`: ``
- `{FONTS}`: `- Load these Google Fonts before building (the kit awaits the specs in style.fonts): Caveat`
- Tell it as: a story
- Reference topic: From wind to bread: a gust crosses a wheat field and turns the windmill, the millstone grinds flour, and a loaf ends up on the bakery sill

```
STYLE CARD
Name: Painted
Family: Filters over 3D
Use: story
Look: A filter, not a set: any lit 3D scene comes out as an oil painting on canvas, with thick directional brush dabs, broken colour, ridges of paint that catch a raking light, linen weave showing through the thin darks and a ragged unpainted edge. Here it carries a golden-hour countryside: a wheat field, a windmill, a bakery cottage.
Motion: Things happen inside the painting and each one causes the next: a gust runs through the wheat as a wave of bent stalks, reaches the sails and spins them up, the millstone turns with them, flour pours into a sack and puffs, a loaf is slid onto a sill. Brush dabs are fixed to the things they describe, so they travel with stalks, sails and sacks instead of boiling; the canvas weave stays still. Each caption is brushed on in under half a second when its beat starts and stays until the next one.
Light: One low golden sun from behind and to the side, long shadows, cool blue-violet sky light in every shadow, and small warm lamps (a doorway, a window, a lantern) wherever the story needs the eye. Warm light against cool shadow is the whole palette.
Materials: Rough simple shapes with no detail of their own, each big enough to survive a brush nine pixels wide. Every surface carries a field of brush dabs that varies its colour, tilts its shading and adds bristle streaks; the painterly filter turns that into strokes.
Camera: One continuous shot at walking height, like a picture book without page turns: it travels with the wind from the field toward the mill, cranes down to the door and drifts slowly across it while the stone works, then glides after the flour dust along the track and pushes in on the window sill, where it stops and holds on the thing that was made. Everything sharp, like a canvas. Each stop is composed like a painting, with the subject large in frame.
Finish: Anisotropic Kuwahara brush filter, then a paint-relief and canvas-weave pass lit from the upper left, which also letters the caption on a bare corner of the linen. Soft bloom on the sun and the lamps before the filter, so the glow is painted too. No grain, no vignette.
Good for: Stories, journeys and processes that happen in a place, told as a picture book: how something is made, where something comes from, a day in a life, a chain of cause and effect. Each beat is one stop in the landscape where one thing visibly happens and sets off the next; something that travels (wind, a road, a river, a character) leads the camera from stop to stop; one short caption per beat sits in the bare corner of the canvas and names what is happening. The filter carries any 3D scene, so the world can be a farm, a city, a workshop or a room, as long as each subject is a big simple shape.
```

## 14. Circuit City

- Folder: `references/looks/14-circuit-city/style.js`
- `{LIBS}`: ``
- `{FONTS}`: `- Load these Google Fonts before building (the kit awaits the specs in style.fonts): IBM Plex Mono`
- Tell it as: an explainer
- Reference topic: A prompt's trip across a chip: PROMPT, MEMORY, PROCESSOR, ANSWER

```
STYLE CARD
Name: Circuit City
Family: Spaces and journeys
Use: explainer
Look: A real circuit board filmed as a city at night: matte black chips are the buildings, aluminium capacitors the towers, gold tracks the streets, and white silkscreen print names each district. Deep green solder mask, gold and tinned metal, warm signal light.
Motion: A pulse of light races along the gold tracks from stop to stop and each landmark wakes as it arrives: chips glow from underneath, the processor dies light up in a diagonal wave. The camera flies low and forward after it, like a helicopter shot, and rises once over the big chip.
Light: Night. The signals are the main light: a warm glow that travels with the pulse and throws moving shadows from every part. A soft cool moonlight from the back left rims the parts and rakes the board so metal glints and textures read; a few tiny indicator LEDs.
Materials: Semi-gloss solder mask with fine grain and raised copper under it, satin gold tracks and pads, bright tinned pins, moulded black epoxy with laser-etched markings, brushed aluminium cans, iridescent bare silicon.
Camera: Macro lens, very shallow focus that rides with the pulse. One continuous forward flight that starts low at the edge of the board, sways gently after the pulse, cranes up over the processor and glides on to settle above the last stop.
Finish: Real depth of field and motion blur, bloom only on the signal and LEDs, filmic contrast with deep blacks, slight lens fringing, vignette, fine grain.
Good for: Journeys and pipelines: something travels through a system and each stage does its part. Every stage is a landmark with a printed label; the pulse and the camera carry the order.
```

## 15. Glass and Light

- Folder: `references/looks/15-glass-light/style.js`
- `{LIBS}`: ``
- `{FONTS}`: `- Load these Google Fonts before building (the kit awaits the specs in style.fonts): Inter`
- Tell it as: an explainer
- Reference topic: How a vinaigrette comes together: 3 parts oil, 1 part vinegar

```
STYLE CARD
Name: Glass and Light
Family: Material worlds
Use: explainer
Look: Real glassware on a dark stone table in front of a glowing backdrop: thin clear jars and bottles turned on a lathe, holding coloured liquids with a visible surface, a meniscus and sharp boundaries between layers. Every liquid throws a pool of its own coloured light, with bright caustic lines, on the table in front of it. Small white measure marks are printed on the glass.
Motion: Calm, with weight. Bottles lift, lean and pour a thin falling stream; levels rise against the marks while the bottle empties; rings spread where the stream lands; layers settle; a jar is shaken hard and set down. The lamp swings slowly behind the glass so the pools of light sweep across the table.
Light: Back-lit like glass photography: a bright horizon behind, darkness above, and a lamp behind and above the glass, so light comes through the liquids towards the camera. Softboxes give every rounded edge a white rim; the backdrop gives the glass dark and bright lines to bend.
Materials: Thin clear glass with real refraction and a thick foot; liquids that let the backdrop through, pale where they are thin and deep where they are thick, and turn milky when mixed; brushed steel for lids and spoons; dark matte stone with a faint sheen.
Camera: One slow continuous dolly: it starts wide enough for the bottles to lift and pour, then moves in on the jar as the layers form and ends close on the finished mixture, still drifting.
Finish: True colours (neutral tone curve), bloom on the light pools and rims, a soft vignette, fine grain. Captions are a crisp 2D overlay.
Good for: Recipes, mixtures, ratios, amounts, chemistry: anything that fills, pours, layers or changes colour, told with real glassware. A beat is one action on the vessel (a pour, an addition, a shake, a wait). Amounts are levels against the marks on the glass, ingredients are colours, and a change of state is a change in the liquid (layers, cloudiness, colour). Labels are the measure marks plus one short caption line per beat.
```

## 16. Factory Line

- Folder: `references/looks/16-factory-line/style.js`
- `{LIBS}`: ``
- `{FONTS}`: `- Load these Google Fonts before building (the kit awaits the specs in style.fonts): Fredoka, Inter`
- Tell it as: an explainer
- Reference topic: How an AI agent finishes a task: plan, search, write, check

```
STYLE CARD
Name: Factory Line
Family: Machines that explain
Use: explainer
Look: A toy-grade production line on a clean studio floor: chunky cobalt machine housings with big white labels, safety-orange moving parts, a dark rubber belt and one white page riding an orange tray.
Motion: The belt indexes: the tray glides to a station, stops, the machine does one heavy mechanical thing to it (a press slams, a light bar sweeps, a roller prints, a stamper punches), a lamp turns green and the belt moves on.
Light: One low, warm key from the front-left so light reaches under the machine heads and every tool throws a soft shadow on the page, plus a cool sky light that darkens the gaps under the housings. Working tools add their own coloured light.
Materials: Clear-coated enamel in cobalt, orange and cream; brushed steel rods and bolts; matte ribbed rubber; uncoated white paper with printed ink.
Camera: A dolly beside the line that travels with the tray, looking down at about 35 degrees so the page stays readable. It drifts from just behind the tray to just ahead of it, then drops down in front of the finished page for the hold.
Finish: Real motion blur (the world streaks past while the tray stays sharp), gentle depth of field, soft bloom only on lamps and the scanner light, true colours (neutral tone map), light vignette, almost no grain.
Good for: Any step-by-step process: the raw input rides a belt, each labelled station is one step and visibly changes the item, and the finished result is presented at the end.
```

## 17. White Model

- Folder: `references/looks/17-white-model/style.js`
- `{LIBS}`: ``
- `{FONTS}`: `- Load these Google Fonts before building (the kit awaits the specs in style.fonts): Inter, IBM Plex Mono`
- Tell it as: an explainer
- Reference topic: How rooftop solar powers a home: sunlight, panels, inverter, home, and the surplus going out to the grid

```
STYLE CARD
Name: White Model
Family: Diagrams with depth
Use: explainer
Look: An architect's presentation model: everything is matte white card and foam on a white site board, and one saturated accent colour is reserved for the thing being explained.
Motion: Nothing in the model moves. Only the accent moves: it starts at the source and travels through the model along thin conduits, switching each part on as it arrives, and a numbered label with a thin leader line draws in at every stop.
Light: Soft daylight from one side plus sky light with real occlusion, so creases, window reveals and the ground under things darken gently and form does the work colour normally does. The accent glows a little and throws its own colour onto the white around it.
Materials: Four slightly different whites (warm card, cool foam, bright paper, rough plaster) with a fine paper grain and a tiny bevel on every edge; scored pencil lines on the board; a mid-grey table behind, so the white reads as white.
Camera: Long lens with shallow focus, like a photograph of a small model. One slow continuous crane: it starts low and close on the source and rises and pulls back until the whole path is in frame.
Finish: Neutral tone mapping so the whites stay clean and the accent stays true, a light bloom on the accent only, soft vignette, almost no grain.
Good for: How something flows through a system: energy, water, money, data, people. Build the system as a white model, lay the path through it as conduits, and let the accent travel the path in the right order while labels name each stop.
```

## 18. Voxel

- Folder: `references/looks/18-voxel/style.js`
- `{LIBS}`: ``
- `{FONTS}`: (no line)
- Tell it as: an explainer
- Reference topic: How a tomato plant grows: seed, sprout, plant, fruit

```
STYLE CARD
Name: Voxel
Family: Filters over 3D
Use: explainer
Look: Everything is built from small cubes, like a hand-made voxel model on a display base: a short palette with every cube a shade apart from its neighbours, tiny bevels that catch the light, and the label spelled in cubes on the front of the base.
Motion: The cubes do the animating: things drop in column by column, grow layer by layer, swell, pop and get knocked off, each with a small bounce on arrival. Nothing slides or fades.
Light: One soft warm sun from the front left and an open sky that really gets blocked in corners and under things, so every cube sits in its own little shadow.
Materials: Matte painted cubes with a narrow chamfer, a smooth off-white plinth under the model and a plain coloured tabletop, so the cubes are the only texture.
Camera: A long lens looking down from about 26 degrees with a wide aperture: the model is sharp, the table in front and behind falls soft, and it reads as a miniature. One slow arc and pull-back that keeps pace with what is being built.
Finish: Neutral tone mapping to keep the palette true, a little bloom on the cubes that glow, light vignette, almost no grain.
Good for: Anything that can be shown as a small model that builds up in stages: how something grows, is made or is put together. One base, one subject in the middle, one voxel word per stage, weather or helpers as small cube events around it.
```

## 19. Data Skyline

- Folder: `references/looks/19-data-skyline/style.js`
- `{LIBS}`: ``
- `{FONTS}`: `- Load these Google Fonts before building (the kit awaits the specs in style.fonts): Space Grotesk, IBM Plex Mono, Fraunces`
- Tell it as: an explainer
- Reference topic: World population by the billion: 1 billion in 1804, 2 in 1927, 4 in 1974, 8 in 2022

```
STYLE CARD
Name: Data Skyline
Family: Diagrams with depth
Use: explainer
Look: A bar chart built as an architect's model: towers of stacked pale stone blocks on a printed plinth, with one tower in vermilion, tiny trees and people for scale, and thin drawn annotations on top.
Motion: Towers push up out of the plinth one after another on a heavy spring, overshoot a little and settle while their value counts up on the roof. Taller towers take longer, so size is felt as time.
Light: A low warm sun from the side, so every tower throws its shadow onto the next one and the last shadow runs long across the ground; cool sky light fills the shaded fronts and warm haze swallows the horizon.
Materials: Honed limestone with fine strata and pores, the same stone stained vermilion for the accent tower, dark printed ink for scales, footprints and labels, a mid-grey ground so the pale model stands out.
Camera: Starts at ground level beside the first tower, dollies along the row while the towers rise, tilts up as the tallest one climbs past the lens, then cranes up and back until the whole comparison is in frame.
Finish: Shallow focus at ground level like a macro photo of a model, real motion blur, gentle bloom on the sunlit faces, soft filmic contrast, light vignette and fine grain.
Good for: Any list of labelled values: a comparison, a ranking or a series over time. Each value is a tower, the label is printed at its foot, the unit is stacked in countable blocks and one accent colour marks the bar that matters.
```

## 20. Ink and Toon

- Folder: `references/looks/20-ink-toon/style.js`
- `{LIBS}`: ``
- `{FONTS}`: `- Load these Google Fonts before building (the kit awaits the specs in style.fonts): Anton, Caveat`
- Tell it as: an explainer
- Reference topic: Pour-over coffee in three steps: grind, bloom, pour

```
STYLE CARD
Name: Ink and Toon
Family: Filters over 3D
Use: explainer
Look: Real 3D that reads as a hand-inked animation cel: flat colour in two tones, a brush line round every shape, halftone dots where light turns to shadow and pen hatching inside cast shadows, printed on warm paper inside a ruled panel.
Motion: Snap, not glide. Props are drawn on twos (15 drawings a second) and jump between held poses with a stretched in-between, an overshoot and a quick settle; speed lines, impact ticks and steam squiggles are drawn in for two or three frames. The camera alone moves on every frame.
Light: One hard sun, low and from the side, placed for the shape of the shadow rather than for realism. No fill light: the shadow colour of each material is picked by hand, shifted towards the cool ground colour.
Materials: No textures. Each material is a lit colour, a shadow colour and, on glossy things, one hard white glint. Paper, one ink and four spot colours do everything.
Camera: Long lens, looking down at a table-top from the front. It drifts slowly while a pose is held and whips to the next framing in a third of a second, one framing per step.
Finish: No blur, bloom or grain. A print filter lets every edge wander by a pixel and re-draws it six times a second, multiplies paper tooth through the colour and rules an ink border round the panel.
Good for: Steps, recipes and how-tos with a few recognisable objects: each step is one bold action on the same hero object, named by a big lettered word and a hand-written caption box.
```

## 21. Pin Wall

- Folder: `references/looks/21-pin-wall/style.js`
- `{LIBS}`: ``
- `{FONTS}`: `- Load these Google Fonts before building (the kit awaits the specs in style.fonts): Oswald, Inter`
- Tell it as: an explainer
- Reference topic: How a volcanic island is born

```
STYLE CARD
Name: Pin Wall
Family: Flat content made physical
Use: explainer
Look: A pin-art toy the size of a wall, laid out like a relief model: tens of thousands of steel pins with rounded heads in a tight honeycomb, held in a dark bolted frame. The pin heights form a landscape you could put your hand on, and groups of pins carry a tint for what they stand for (here blue for sea, warm for rock, glowing orange for lava).
Motion: The relief never stops moving. It is one height field that changes over time: swell travels across it, shapes push up from below, rings run outwards, and every pin follows a moment late with a little bounce, so anything sudden shivers and settles. What is finished stands still, what is alive keeps moving.
Light: One low raking light from the far left, so every height difference throws a long soft shadow and every lit head carries a glint; a blue light from the opposite side fills the shadows; a small warm light sits wherever the relief glows.
Materials: Satin steel pins with polished domed heads and darker shafts, tinted like anodised metal; a powder-coated black frame with bolts.
Camera: One slow continuous crane seen from a raised three-quarter angle: it starts low, looking across the pin heads with shallow focus, and rises and drifts round the subject until the whole relief reads. The relief fills the frame the whole time.
Finish: Real motion blur on the pins, depth of field in the low pass, bloom on the glints and on anything hot, filmic contrast, vignette, fine grain.
Good for: Anything that can be shown as a moving relief or a moving greyscale picture: terrain, waves, growth, charts that rise, shapes that morph into each other. The content is one height function, relief(pin, time), which says how far each pin stands out and which tint it carries. A beat is a change in the relief that follows from the one before (calm, something rises, it breaks through, the result). Words are one short caption per beat on a small plate at the bottom; the pins never form words.
```

## 22. Toy Blocks

- Folder: `references/looks/22-toy-blocks/style.js`
- `{LIBS}`: ``
- `{FONTS}`: `- Load these Google Fonts before building (the kit awaits the specs in style.fonts): Fredoka, Fraunces`
- Tell it as: an explainer
- Reference topic: The 50/30/20 budget rule: 50% needs, 30% wants, 20% savings

```
STYLE CARD
Name: Toy Blocks
Family: Material worlds
Use: explainer
Look: Design-shop wooden blocks on a sunlit playroom floor: maple cubes and bricks with rounded edges, chalky milk paint worn back to bare wood at the corners, and letters, numbers and simple pictures screen-printed on the faces. The stacks are the chart.
Motion: Blocks drop in from above with real weight: one corner hits first, the block bounces once, rocks from edge to edge and settles with a knock. A heavy block makes the whole tower teeter. Nothing eases; everything falls.
Light: Low, warm afternoon sun through a window to the left, so the floor carries soft stripes of window-frame shadow and every block throws a long shadow. Cool sky light fills the shade and darkens the gaps between blocks. The far wall stays in shade with one patch of window light.
Materials: Pale maple with drawn grain that runs the right way on every face (end grain on the ends), matte milk paint in dusty blue, coral, green, mustard and cream with chips and scratches, slightly patchy pressed-in print, an oak board floor with a soft sheen.
Camera: Long lens at a child's eye height. It starts close on the word spelled in alphabet blocks, cranes up to the first tower as it grows, then makes one slow arc around the stacks with a slight push, close enough that the tallest tower nearly fills the height of the frame. Shallow focus keeps the room soft.
Finish: Real motion blur on the falling blocks, real depth of field, colours kept true (neutral tone curve), a touch of warmth and contrast, light vignette, very fine grain. No bloom to speak of.
Good for: Lists, comparisons, proportions, steps and "the building blocks of X". One cube is one unit, a tower is a bar, a brick is a label, alphabet blocks spell the headline; pictures on the faces say what each unit is.
```

## 23. Particle Swarm

- Folder: `references/looks/23-particle-swarm/style.js`
- `{LIBS}`: ``
- `{FONTS}`: `- Load these Google Fonts before building (the kit awaits the specs in style.fonts): Inter`
- Tell it as: an explainer
- Reference topic: Why popcorn pops

```
STYLE CARD
Name: Particle Swarm
Family: Flat content made physical
Use: explainer
Look: Sixty thousand tiny glass beads hanging in front of a matte paper wall. They pile into plump, rounded models of things (a seed, a drop, a cell, an organ, a heap) that fill most of the frame and throw a soft shadow on the wall, change colour and strain while they hold, then let go and fly on to the next formation.
Motion: Beads arrive as a stream, overshoot their place and settle. A formed shape never freezes: it breathes, a colour change can run through it as a front, loose beads inside it buzz like a gas, and it can swell and tremble. When it lets go, a front crosses it or it bursts from the centre: beads are thrown outwards, curl along a flow field in ribbons and veils, then land in the next shape, with a few stragglers arriving late.
Light: One soft, warm key from the upper left, like a window, so every bead has a lit side, a small glint and a shadow on its neighbours, and the whole shape drops a soft shadow on the wall. Warm fill from all round. Heat is shown as light: hot beads glow by themselves and an orange lamp comes up from below.
Materials: Polished glass seed beads, uneven in size and shade, each with a sharp highlight and a glow on its far side: golden corn, blue water, white steam, cream popcorn. Matte paper wall in a deep, dull teal that all of them stand out from.
Camera: Long lens with shallow focus on the shape, so beads that fly towards the camera go soft. One slow continuous dolly: close and a little to one side of the small first shape, drifting back and round to square-on while it changes, pulled back by the burst to hold the big last shape.
Finish: Real motion blur and depth of field from accumulation (96 sub-renders), neutral tone mapping to keep the colours true, a touch of bloom on the glints and the hot beads only, a soft vignette, almost no grain. Captions are a crisp 2D overlay.
Good for: Processes where stuff flows, gathers, splits, grows, heats up or bursts, and things that are made of many units (cells, molecules, people, grains, data points). The beads are the stuff itself: a beat is either a new formation the swarm flows into or a change that runs through a formation while it holds (it warms from one side, something inside it comes loose, it swells). Populations keep their colour and identity from start to finish, so the viewer can follow where each kind of thing ends up. One short caption per beat names what is happening; the beads never form words or numbers.
```

## 24. Museum Gallery

- Folder: `references/looks/24-museum-gallery/style.js`
- `{LIBS}`: ``
- `{FONTS}`: `- Load these Google Fonts before building (the kit awaits the specs in style.fonts): DM Serif Display, Oswald, Space Mono`
- Tell it as: an explainer
- Reference topic: Four moments that led to AI today: Turing's question, Deep Blue, AlphaGo and ChatGPT

```
STYLE CARD
Name: Museum Gallery
Family: Spaces and journeys
Use: explainer
Look: A dark gallery hall at night: gilt-framed posters on a deep green damask wall, each in its own tight pool of warm spotlight with the beam hanging in the air, a brass plaque beside every frame, a rope barrier and a polished stone floor that mirrors it all.
Motion: One unbroken dolly move in three kinds of shot: it opens wide and oblique on the first exhibit with the others waiting down the wall, tracks past the middle ones at medium distance, and ends pushing in on the last. Each exhibit's lamps click on just before the gaze leaves for it, and the ones already seen sink back to a glow.
Light: One tight ceiling spot per artwork and a smaller one per plaque, warm, with deep shadow between the pools and no ambient light. Lamps that are off still glow faintly so the frames ahead read in the dark. The last exhibit swells to one and a half times the light of the others during the final push-in.
Materials: Flat poster-style prints (drawn in 2D) in black-and-gold frames with real depth, engraved brushed brass, brass posts with velvet rope, woven wall fabric, dark polished stone.
Camera: A long lens on a low dolly, shallow focus pulled from exhibit to exhibit. The gaze lingers on each exhibit and travels quickly between them while the dolly itself never stops; the frame and its plaque fill most of the picture, with a strip of mirror floor underneath.
Finish: Real depth of field and soft shadows, gentle bloom on the brightest print, filmic contrast with true blacks, a clear vignette and fine grain.
Good for: Lists and timelines of three to five points: each point is one framed poster with a plaque (a year or number, plus a few words), visited in order, with the last one as the conclusion.
```

## 25. Pencil Sketch

- Folder: `references/looks/25-pencil-sketch/style.js`
- `{LIBS}`: `, and the STROKEFONT library`
- `{FONTS}`: (no line)
- Tell it as: an explainer
- Reference topic: How a house goes up: foundation, frame, walls, roof

```
STYLE CARD
Name: Pencil Sketch
Family: Filters over 3D
Use: explainer
Look: A real 3D scene that reads as a graphite drawing in a designer's sketchbook: forms shaded with hatching and cross-hatching that follows the light, outlines that overshoot their corners, faint construction lines, hand lettering, toothy paper with a smudge and an eraser mark, and one red accent.
Motion: The drawing makes itself: setting-out lines first, then outlines stroke by stroke, then shading laid across each form in one direction and crossed in a second. Hatching is fixed to the objects and turns with them; only the line wobble boils a little, on held frames. Notes are lettered on and their leader lines follow the parts as the view turns.
Light: One sun from the upper left and flat fill. The light is never shown directly: it only decides how many layers of hatching a face or a cast shadow gets, so lit faces stay as bare paper and shade is cross-hatched.
Materials: Graphite on cream cartridge paper. Soft dark pencil for outlines and lettering, lighter pencil for hatching and construction lines, a red pencil for numbers and marks, and one wash of red marker on the part that matters.
Camera: One slow, continuous arc round the subject on a long lens, about 35 degrees from nearly front-on to a three-quarter view, rising and pulling back a little as the drawing grows. Everything is sharp, like a drawing. The subject sits left of centre so the notes have a clear column of paper.
Finish: No motion blur, bloom, grain or vignette. One paper pass: tooth that breaks up light lines, a hand smudge that drags graphite, an eraser mark, slight mottling and darker page edges.
Good for: How something is built or put together, step by step: parts are drawn in order, each with a numbered note. Also good for anatomy of an object, plans, exploded views and anything that benefits from seeing the structure through the surface.
```

## 26. Domino Chain

- Folder: `references/looks/26-domino-chain/style.js`
- `{LIBS}`: ``
- `{FONTS}`: `- Load these Google Fonts before building (the kit awaits the specs in style.fonts): Anton, Oswald, Fraunces`
- Tell it as: an explainer
- Reference topic: Small starts, big finishes: a domino can knock over one 1.5 times its size, so 13 dominoes take you from 5 mm to 65 cm

```
STYLE CARD
Name: Domino Chain
Family: Machines that explain
Use: explainer
Look: A row of hand-made dominoes on a polished walnut table: bone faces riveted to ebony backs, each engraved and paint-filled with one step of the story, the last one in red. When a domino falls its label lies down the right way up, so the fallen row reads like a chart.
Motion: Each domino hesitates, tips, accelerates, strikes the next at the right moment and comes to rest leaning on it. Small ones go in quick ticks and big ones fall slowly, so the run has a natural ritardando that ends on one heavy landing.
Light: One low warm lamp behind the start of the row, so every domino throws a long soft shadow up the face of the next one and across the table, and its own face brightens as it tips; a faint cool fill from the camera side; the table falls off into darkness.
Materials: Bone with a soft lacquer and black or red paint in the engraving, ebony backs, a French-polished walnut top that reflects the row, and one matchstick for scale.
Camera: A long lens that travels with the falling front like a tracking shot and backs away as the dominoes grow, rising from table height to a high three-quarter view. Shallow focus on the domino that is falling.
Finish: Real motion blur and depth of field, long soft shadows, filmic contrast, a warm vignette and fine grain.
Good for: Cause and effect, chain reactions, step-by-step plans and anything that compounds: every domino is one step, printed with a word or a number, and the fall carries the story from the first to the last. Sizes can grow, the row can bend and branch.
```

## 27. Node Network

- Folder: `references/looks/27-node-network/style.js`
- `{LIBS}`: ``
- `{FONTS}`: `- Load these Google Fonts before building (the kit awaits the specs in style.fonts): Oswald, Fraunces`
- Tell it as: an explainer
- Reference topic: How word of mouth grows a small business: 1 happy customer, then 3, 9, 27

```
STYLE CARD
Name: Node Network
Family: Diagrams with depth
Use: explainer
Look: A physical model of a network mounted on a painted wall: glazed porcelain tokens in brass rings, joined by thin brass rods, like a museum's molecular model. Each token is two-sided and turns over to its coloured enamel face when the news reaches it.
Motion: It is constructed link by link: a rod extends from a token carrying an empty ring, a blank token drops into the ring with a click, a bead of light slides along the rod and the token spins over to its coloured side. Each ring of the model goes faster than the last, and a number plaque clicks on when a ring is complete.
Light: One warm, soft gallery spot from above, so every rod and token throws a soft shadow down the wall, longer the further it stands off. The pool of light opens as the model grows and always falls off to the corners.
Materials: Ivory glazed porcelain, one enamel colour (cobalt), polished brass, enamel number plaques, and a terracotta plaster wall with a hand-painted title.
Camera: Long lens. Starts close on the first token with the wall out of focus, then one continuous pull-back that keeps pace with the growing model while drifting from left to right. It ends with the finished model filling the frame edge to edge and keeps drifting slowly through the hold.
Finish: Real depth of field and motion blur, neutral tone mapping to keep the enamel colour true, light vignette, very fine grain.
Good for: Anything that is things and the connections between them: spread, referrals, teams, systems, flows. Nodes sit in oval rings around a centre, sized so the finished model fills a 16:9 frame; links are rods, a pulse travelling along a link is the story, and a number plaque per ring carries the count.
```

## 28. Shadow Box

- Folder: `references/looks/28-shadow-box/style.js`
- `{LIBS}`: ``
- `{FONTS}`: `- Load these Google Fonts before building (the kit awaits the specs in style.fonts): Anton`
- Tell it as: an explainer
- Reference topic: Computers keep shrinking: a room-sized mainframe, a desktop, a laptop, a phone in your hand

```
STYLE CARD
Name: Shadow Box
Family: Flat content made physical
Use: explainer
Look: A paper-cut light box: opaque paper silhouettes stand one behind another in a deep walnut frame. The back of the box glows warm and bright, every sheet nearer to you is darker, and the nearest ones are dusk-blue shapes with a thin warm line of light on their cut edges.
Motion: Sheets arrive one at a time and each differently: one drops into its slot from above, one is pushed in from the side, one rises from below. As each arrives, a light switches on in the slot behind it, so the light walks forward through the box.
Light: A warm lamp on the back wall and a pool of light in each slot between the sheets. Each pool lights the sheets behind it and leaves the sheet in front as a silhouette, so cut-out screens and years turn into bright windows. Sheets throw soft shadows on the ones behind. The only light from the front is dim blue dusk.
Materials: Thick cream paper with visible fibre and bright cut edges, dark walnut with open grain.
Camera: Long lens with a very wide aperture, like photographing a miniature. It starts close and at an angle, slides sideways so the sheets shift against each other, and pulls back in one move to a square-on view where the box fills the frame; the focus steps forward from sheet to sheet.
Finish: Real depth of field and motion blur, soft bloom on the lit paper, filmic contrast, a light vignette, fine grain.
Good for: Sequences with a natural order in depth: timelines, eras, layers of a system, before and after. Each sheet is one stage, a big silhouette with a cut-out label, and the light shows which stage we are at.
```

## 29. Layer Stack

- Folder: `references/looks/29-layer-stack/style.js`
- `{LIBS}`: ``
- `{FONTS}`: `- Load these Google Fonts before building (the kit awaits the specs in style.fonts): Space Grotesk, Inter, IBM Plex Mono`
- Tell it as: an explainer
- Reference topic: What's inside an AI app: interface, agent, model, your data, chips

```
STYLE CARD
Name: Layer Stack
Family: Diagrams with depth
Use: explainer
Look: A system shown as a stack of thin glass sheets, each with its own diagram printed in white, floating one above the other over a dark machined plinth. Aqua edges glow like edge-lit acrylic against near-black; one amber is kept for the answer.
Motion: The stack starts closed as one block. Sheets lift off one at a time from the top, float a little past their place and settle, and each label draws in beside its sheet as it lands. Then a bead of light drops through the same pad on every sheet, each sheet flashing white as it passes, and climbs back in amber; the sheets cool again behind it and only the top one stays lit.
Light: One small key from high behind, so every sheet and its printed lines throw a crisp shadow onto the sheet below; a soft panel mirrored in the glass tops; a cool rim; the rest falls to black. The bead carries a real light that spills onto the sheets it passes.
Materials: Lightly frosted glass that stays clear but keeps full-strength reflections, brighter aqua edges, matt white print that takes light and shadow, dark anodised aluminium, a satin floor with a faint reflection.
Camera: Long lens, three-quarter view from above. It starts close on the closed block, cranes up and back with the first sheet as it rises, then keeps a very slow push toward the open stack.
Finish: Motion blur on the lifts, bloom only on lit edges and the bead, a neutral grade that keeps the aqua and amber true, deep blacks, a soft vignette and very fine grain.
Good for: Anything built in layers: a tech stack, a product teardown, how a request travels through a system. One sheet per layer with a simple diagram, a name and a short line beside it, and a pulse that shows the order things happen in.
```

## 30. Dithered

- Folder: `references/looks/30-dithered/style.js`
- `{LIBS}`: ``
- `{FONTS}`: `- Load these Google Fonts before building (the kit awaits the specs in style.fonts): Archivo Black`
- Tell it as: an explainer
- Reference topic: The Pomodoro technique: 25 minutes of work, 5 minutes of rest, repeat

```
STYLE CARD
Name: Dithered
Family: Filters over 3D
Use: explainer
Look: A lit 3D scene shown in one-bit: two colours only, big square pixels, every shade made of ordered dot patterns, one-pixel contours and bitmap lettering in desktop windows, like an early home computer screen with real depth behind it.
Motion: Crisp steps, no blur. Objects tick, snap, overshoot and rattle; interface changes are instant or a short blink of one small plate, never a full-screen flash. The camera glides while the subject keeps the same pixels, so the picture scrolls like a sprite instead of shimmering.
Light: One low sun through a window that is out of shot: a hard key from the upper left, long crisp shadows, and the window's edge and glazing bar falling across desk and wall. Almost no fill, so shadows go to solid ink; a little bounce from the desk and a low back light keep the shadow side readable. The subject is lit against the dark wall on one side and dark against the lit wall on the other.
Materials: Greys only: what counts is each surface's tone, because tone decides whether it becomes paper, ink or a dot pattern. The ground is clean paper, the hero is the one mid-tone object, small props are white with a contour. Simple round forms, a few bold printed details, one glossy surface for a hard highlight.
Camera: Long lens looking slightly down, fixed heading, one slow truck and pull-back that ends on the whole set-up. The pixel grid is tied to the subject, so it keeps its pixels while the wall and the props slide past it.
Finish: Picture reduced to 384 x 216 pixels, Bayer 4 x 4 ordered dither into ink and paper, contours from a normal-and-depth pass in whichever colour the surroundings are not. No blur, bloom, grain or vignette.
Good for: Any object or small set-up staged like a still life, with desktop windows carrying the numbers: a readout for the value that changes and a strip for sequence or progress. Good for routines, cycles, steps, states and anything with a clock in it.
```

## 31. Floating Screens

- Folder: `references/looks/31-floating-screens/style.js`
- `{LIBS}`: ``
- `{FONTS}`: `- Load these Google Fonts before building (the kit awaits the specs in style.fonts): Fraunces, Inter`
- Tell it as: an explainer
- Reference topic: Ordering bread online from a small bakery in three steps: choose the loaf, check the basket, order confirmed

```
STYLE CARD
Name: Floating Screens
Family: Products and screens
Use: explainer
Look: Screens as objects: white cards printed with a real interface, each backed by a block of clear glass, hanging one in front of the other in a bright, warm room. The newest card is always nearest and sharpest; the ones before it stay behind it, softly out of focus.
Motion: A card swings in from the side like a heavy door, slides to its place and settles. Buttons sink when pressed and the whole card gives a little. A thin cable draws itself from the pressed button to the edge of the next card, and at the end one highlight runs through the whole chain.
Light: One big soft window light from the upper right in front, so every card throws a soft shadow onto the card behind it and a softer one onto the wall, and every raised button and tile has its own small shadow. A bright room fills the shadows: nothing goes dark.
Materials: Matt printed card stock on thick glass with polished, slightly green edges; raised interface pieces in the same card; a painted plaster wall. Warm paper, dark ink and exactly one accent colour.
Camera: Long lens on a dolly that rolls past the row at one steady speed and never stops. It pans to stay on the newest card, hands over to the next one as it flies in, and finally cranes back until the whole sequence is in frame. Focus always sits on the newest card.
Finish: Neutral tone mapping so interface colours stay exact, real depth of field and motion blur, a faint vignette, almost no grain. Bloom is set so that only a glass edge that lights up glows.
Good for: Anything made of steps or screens: an app flow, a workflow, a process, a set of stats or quotes. One card per step, the action on each card acted out, a cable from each step to the next.
```

## 32. Device Hero

- Folder: `references/looks/32-device-hero/style.js`
- `{LIBS}`: ``
- `{FONTS}`: `- Load these Google Fonts before building (the kit awaits the specs in style.fonts): Fraunces, Inter`
- Tell it as: a product (the brief has no "Tell my content as" line)
- Reference topic: Streak, a habit tracker: ticking off today's last habit closes the ring and turns a 29-day streak into 30

```
STYLE CARD
Name: Device Hero
Family: Products and screens
Use: product
Look: A phone filmed like a launch video: a titanium body with a polished frame standing on black gloss in a dark studio, its screen the brightest thing in the room. Then the screen fills the frame and the interface becomes white cards floating over the glass.
Motion: The phone turns to face the lens while strip lights slide across its glass. The camera dollies into the screen in one move and the interface peels off in layers, the top of each stack first. Inside, things behave the way the app would: a press sinks the card, the ring sweeps round, the digits roll.
Light: Studio half: nothing lights the phone directly; it is shaped by tall strip lights and a soft box reflected in metal and glass. Screen half: one large soft light from the upper left, so every floating layer drops a soft shadow down and to the right that grows with its height.
Materials: Satin titanium, black cover glass with a real reflection, a mirror-gloss floor. The interface is a canvas texture that glows like a display in the studio and turns into thin, bevelled white card stock once it lifts.
Camera: Long lens. A low, slow drift past the standing phone, one continuous push that drops below the screen and looks up along it, then a slow arc so the layers slide against each other. Focus follows the action: the checkbox, then the number.
Finish: Neutral tone mapping so interface colours stay exact, soft bloom only on metal highlights, shallow depth of field, a light vignette, almost no grain.
Good for: An app, a feature or any on-screen moment: show the device first so the viewer knows what they are looking at, then go inside and let two or three interface elements act out the one thing the feature does.
```

## 33. Studio Product

- Folder: `references/looks/33-studio-product/style.js`
- `{LIBS}`: ``
- `{FONTS}`: `- Load these Google Fonts before building (the kit awaits the specs in style.fonts): Inter, Space Grotesk`
- Tell it as: a product (the brief has no "Tell my content as" line)
- Reference topic: Launch film for "Tide", a made-up insulated steel water bottle: cold for 24 hours

```
STYLE CARD
Name: Studio Product
Family: Products and screens
Use: product
Look: One physical product in a near-black seamless studio, filmed like a flagship launch: the object is carved out of the dark by strip softboxes and stands on a black mirror floor, with a single restrained line of type beside it.
Motion: The product stays still and the light moves: a tall strip light glides across its surfaces again and again, changing colour as it goes, while the lens travels over the details in macro and then pulls back to the whole object. A counter ticks with the light and lands on the number in the copy.
Light: Softboxes only, placed relative to the lens: a graded key strip that sweeps from side to side, two thin rim strips from behind that draw the outline, a soft box overhead for the top. Everything they do not touch stays black.
Materials: Real product finishes with small precise details: powder coat with a fine orange-peel texture, turned steel with lathe lines and bevelled edges, a diamond-knurled ring, black anodised flutes with a bright cut chamfer, a laser-etched mark, a seam and a rubber foot.
Camera: A long lens on a slider, one continuous move: two macro passes with very shallow focus (the collar, then the etched mark), a pull-back to the full product standing off-centre, and a slow push that never quite stops.
Finish: True depth of field and motion blur, a soft bloom only where polished metal catches a strip light, filmic contrast with deep blacks, a light vignette and very fine grain.
Good for: One product and one claim. The macro passes show what it is made of, the moving light and the counter act out the claim (here: a full day passes, it is still cold), and the lock-up states it in one line.
```
