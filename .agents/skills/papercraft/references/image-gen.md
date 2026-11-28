# Making references with an image tool (optional, only when the user asks)

How to use an image tool to make references for a project's idea: images that set the direction for its look and its
elements, in any medium this skill builds (a game or interactive scene, a 2D scene or illustration, a web page or app
UI, an animation or video). Nothing in this skill depends on it: the work itself is still paper built in code, and
the paper spec alone is a complete target. SKILL.md section 2 gives the approach in brief; this file goes medium by
medium.

Read this when: the user asked you to use an image tool and one is available. Without one, the spec is the target and
`procedural-art.md` makes the prints; you lose nothing essential.

Contents: 1 Rules; 2 What to make, by medium; 3 Writing the prompt; 4 Image inputs and their roles; 5 Explore, then
converge; 6 A consistent set; 7 Using what you made; 8 Generated images inside the work; 9 What to reject

## 1. Rules

- **Only when the user asks, and never load-bearing.** Use the tool when the user says to and it is there. Never wait
  on it, and keep the work complete without any generated image: if a call fails, retry at most once, then stay
  procedural (`procedural-art.md`).
- **References first.** The value is direction: how the project looks, what its elements are, how its light and mood
  feel. Generated images go inside the work only when the user wants that (section 8).
- **Look at every output.** Keep the calls few, regenerate sparingly, and keep a short log: the prompt, the image
  inputs, the verdict, what you took from it. Show the user the candidates; their pick decides.
- **Generated images are idealised.** Steer by them and measure toward them, but the finish line is the user's eye
  and the checks in SKILL.md section 8, never "a critic cannot tell them apart": in the source project, blind critics
  picked the generated frame over the build nearly every time.
- **Never ship third-party images.** The user's references may be image inputs for what they give (SKILL.md
  section 2): say in the prompt what to take from each, and that its composition, characters, logos and text are not
  to be copied. The gallery is never a content input; it may be a STYLE input, craft only (section 4).

## 2. What to make, by medium

Make the few images the project's open decisions need, at the camera the work will use. In every medium a material
close-up (one piece: its cut edge, its print, its shadow on what lies under it) and a light study (the brief's time of
day and its shadow colour) earn their place.

| Medium | References worth making | Frame them as |
|---|---|---|
| Game or interactive 3D scene | the world around the hero at the play camera; a busy area; the brief's own landmark or feature; what is walked on, under or into (a bridge, stairs, a hall); a fold mid-rise; designs for the hero and the creatures from the front, the side and the back | the play camera: a long lens looking down, one sharp band, blur above and below, the ground past every edge |
| 2D scene, side-scroller, illustration | the scene at its 2D camera; its layers from near to far; designs for the pieces | the 2D view (frontal, or pitched down), depth from layered planes and blur |
| Web page or app UI | the page or screen as paper: a hero area, a card, a menu, a button up and pressed, a panel folding open; ornaments and icons as cut-paper pieces | flat and frontal, no lens; no words in the image (real text is set in the page, so leave room for it) |
| Animation or video | a keyframe per beat (the flat print before the rise, a fold mid-motion, the settled scene, the last frame); each key shot at its final camera; a light script across time | one camera, light and palette per shot across the set; images give moments, never timing (`motion.md` sections 3 and 11) |

## 3. Writing the prompt

One style description, reused word for word for every image of a set, and one subject line per image. Write the style
in this skill's terms, filled from the brief; labelled parts like these work well:

- **Medium:** what the image is: a macro photograph of a handmade pop-up paper world (a scene, or a still of a video),
  or a flat frontal scan of a handmade paper page (a page or UI).
- **Material:** matte, rigid cardstock; every piece a THIN FLAT die-cut card (as thick as a playing card) printed
  with a flat layered illustration, with accents that contrast with its base; volume only from two cards slotted
  crosswise or a folded box; chunky outlines with big, countable motifs, nothing thin or spiky. Say what it is not:
  nothing sculpted, rounded, moulded, clay, foam or felt ("chunky" alone returns moulded toys). Name the edges the
  medium wants: crisp die-cut card in a scene, deckled or torn sheets only where a page calls for them
  (`paper-ui.md`).
- **Edges:** a thin dark cut line at every silhouette and a pale highlight just inside it on the lit side only.
- **Palette:** the brief's colours by role (the ground or page, the lead family, the accents), in words or hexes.
- **Light:** the brief's key and time of day, a soft fill, soft shadows coloured by the world, never grey.
- **Camera:** the medium's framing from section 2.
- **Surround:** the ground, or the page, fills the frame and runs past every edge.
- **Avoid:** sky, horizon, a table, a room, a book or page edge, a border; gloss and the look of a CG render; flat
  vector art; text, letters and logos; an even white rim round every piece.

The subject line says what this image is for: the place, the moment or the element, and the twist only this project
has, in a sentence or two. A long subject drowns the style.

## 4. Image inputs and their roles

When the tool takes images as inputs, give each a single role and say in the prompt what to take from it and what
not:

- **Style:** copy its craft (cut shapes, edges, the layered print, matte fibre), not its perspective, scene, light or
  subjects.
- **Content or layout:** keep its pieces, their places and their count, and redraw them in the style; add, remove and
  merge nothing.
- **Palette and mood:** take its colours and its light, nothing else.

**Always give a style image when the tool takes one.** Words alone do not hold this craft: in two film projects
all 8 frames made from a careful style description came back as chunky sculpted felt or foam toys, and the builds
that followed them had nothing reachable to match. The same subjects with three gallery stills attached as style
inputs came back as thin printed cards on the first try in 2 of 4 frames, and in 4 of 4 once the first good frame
was added as the main style input. So:

- Attach 2-3 of the game's stills from `assets/gallery/` as STYLE inputs: from different worlds, not only the one
  nearest your brief, and a night still when the frame is dusk or night. A frame from `assets/gallery/range/` can
  stand beside them when your brief is close to it in kind (an interior, a page UI, a figure sheet): those were made
  this way (`gallery.md` section 9), so they show what a direction frame should look like.
- Check how your tool takes image inputs before the first batch: some command-line tools read every argument after
  the image flag as another image, so the prompt must come first.
- Say in the prompt: "the attached images are style references from one handmade paper world; make a new image in
  exactly their visual language; copy only the craft (thin flat die-cut cards, upright round things as two crossed
  cards, volumes as folded boxes, the flat printed illustration with its dark cut line, the matte fibre ground, the
  long lens and its one sharp band); do not copy their scenes, layouts, palettes or subjects, and leave out the
  small figure in the straw hat."
- Make the first frame that lands in the style the MAIN style input for the rest of the set (name it first), with one
  gallery still beside it. Give the scale too ("the same toy scale and camera distance as the first image"): a dense
  subject such as a town otherwise comes back as thick modelled blocks.
- Watch for what leaks: the gallery's leaf-and-flower ornament turned up on a viaduct's piers and on train carriages.
  Say what may be printed on each kind of piece (section 6), and check the palette is your brief's.

The strongest input is the work itself. A target made from a few of your own screenshots, named as the main reference
for the world, the camera and the light ("a new scene in exactly this visual language, but better"), stays reachable:
in the source project it became the best target (the "gold" target in `process.md`), and its gaps could be closed
one by one. Feed the user's references in only for what they give.

## 5. Explore, then converge

- **Start wide:** a few distinct directions (different palettes, times of day, compositions, readings of the
  subject), not many versions of one. Show them side by side and let the user choose or combine.
- **Then converge:** make the rest of the set in the chosen direction with the same style description, changing only
  the subject line, and give the chosen image as an input where the tool allows.
- **Grow designs in steps:** an element seen in its world first, then a design sheet of it (individuals, views or
  states in rows), then more variants with the chosen sheet as the input ("more of exactly the same").
- **Stop when the decisions are made.** A reference set is done when it answers the spec (palette, ground or page,
  pieces, light, hero, layout, motion beats), not when it looks finished.

## 6. A consistent set

- One style description, one palette and one light for the whole set; one camera per medium.
- A figure that will be built from cards is designed as its parts, each from the front, the side and the back, never
  as a sheet of poses: the 3D hero is a model of parts (`mechanisms.md` section 12), the 2D one a puppet of cards
  (`web-2d.md` section 3).
- An ornate input spreads its ornament onto everything (leaf prints turned up on animals, smoke and clouds): say for
  each kind of piece what may be printed on it.
- Ask for the paper every time: left out, generated paper drifts toward soft, deckled sheets or felt.
- Generated and procedural pieces in one work must share the same print ingredients (`procedural-art.md` section 0),
  or the procedural ones look unfinished next to the others.

## 7. Using what you made

- **As the look target:** measure it (`scripts/measure.py`, then `--target` on your frames), write down what it shows
  (sizes against the hero or the page, edge rules, layers per print, the print vocabulary, light and shadow), and rank
  the gaps between it and your build, each with one measured thing to do (`process.md` section 2).
- **As designs:** build each element yourself, as a structure type with its own print (`structures.md`,
  `procedural-art.md`): the image shows what it is, this skill how paper makes it.
- **As a record:** note in the spec what each image decided, and any conflict with the brief and how you settled it.
  The brief and the user's word outrank any generated image.

## 8. Generated images inside the work

Only when the user wants generated art in the work itself: prints on cards, icons and ornaments on a page, plates for
a video. Everything above still holds, and:

- **Sheets, not single images:** one kind of piece per sheet, flat and frontal, in a fixed grid with a known count in
  reading order and wide gaps, on one flat key colour that appears in no piece (choose another key when the subject
  has that colour). Name the empty cells; counts drift otherwise.
- **The cut edge comes with the art:** ask for the thin dark outline with its lit-side highlight, and never add a
  second rim on top. No perspective, cast shadow or glow inside a sheet; a flat base on anything that stands on a
  hinge.
- **Cut the sheet:** `python scripts/extract_cutouts.py sheet.png --out assets/cutouts --names hero,prop1,prop2
  --sheet-preview` floods the backdrop in from the border (`--key auto` reads its colour from the corners; a PNG
  that is already transparent is cut on its own alpha, colours untouched), gives each edge pixel the alpha and the
  colour it had before the backdrop mixed in (`--despill`, 2 px by default: no pink, green or grey rim, and a dark
  outline stays dark), splits the pieces in reading order and writes `_preview.png` to look at. Holes inside a piece
  are cleared only on a saturated key (magenta, green, any strong colour); on a white or grey backdrop pass
  `--punch-holes` (it would otherwise eat white eyes and paper highlights), and `--keep-holes` never clears one.
  When `--names` does not match the number of pieces found it fails and writes nothing, and it lists the small
  islands it dropped (`--min-area` keeps a small piece): read both before you trust the names. A piece the colour of
  its backdrop cannot be cut from it (white on white, pink on magenta), and a cast shadow on the backdrop is cut as
  part of the piece: that is what the key colour and the no-shadow rule above are for.
- **Mount in 3D:** load the image first (`await img.decode()`), then `imageCard(img, { height, paper: H.paper, cross,
  rim })` (`three-js.md` section 3): the paper's fibre inside the alpha, contact darkening at the base, a kraft or
  mirrored back (or the back's own art: `back: image`, for a piece seen from behind or lying face-down; `glow: image`
  lights its panes) and a shadow cut to the silhouette. Leave `rim` at 0 for art drawn with its own cut line; pass
  ~0.05 for art that has none (a photo, a sprite, a logo). Size every piece in world units, never in pixels.
- **Check after cutting, before swapping anything in:** the count and order, no key colour left inside, thin parts
  still there, the outline hugging the art, the cut edge on close crops, the colours under the final grade, and each
  piece beside the procedural ones.
- **Paper texture:** a macro photograph of one flat sheet of the stock under even light can feed the fibre
  (`scripts/paper_textures.py --photo`); the procedural maps alone are enough.

## 9. What to reject

Look at every image before you use it, and regenerate when it shows:
- a page, book or board lying on a table, a border, or a room around the work;
- flat vector art without depth, or a glossy CG render;
- soft, felt-like paper, or deckled sheets where the work wants crisp card;
- sculpted, moulded or clay-like pieces (rounded toys, thick blocks, relief bricks) where the work is thin flat
  printed cards: a build cannot reach such a frame, so it is not a target;
- an even pale or white rim round every piece (a sticker), or a glow;
- one colour flooding the frame, or the key colour inside a piece;
- the wrong count, or pieces merged into each other;
- text or logos, third-party characters, or a user's reference copied instead of read.

If a second try still misses, keep the best image, note what it gets wrong, and fix that in the build instead.
