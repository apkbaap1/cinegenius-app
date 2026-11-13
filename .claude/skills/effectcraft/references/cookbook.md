# EffectCraft cookbook

Condensed from the upstream agent guide (`docs/agents.md` in storytold/effectcraft, MIT / Apache-2.0),
written against version 0.24. Calls are shown in MCP form, `tool {arguments}`. On the CLI the same
engine command is `effectcraft-cli exec <id> '<json>' project.ecproj --save`.

## Orient

| Goal | Calls |
|---|---|
| Where am I | `get_state` → `get_project` → `get_comp {}` |
| Find a command | `list_commands {"filter":"mask"}` → `describe_command {"command":"mask.new"}` |
| Inspect a layer | `get_layer {"layer":"Title","flat":true}` |
| Fonts available | `list_fonts {"query":"Inter"}` |
| Undo | `undo {}`, or `history {}` then `history {"goto": n}` |

## Build

| Goal | Calls |
|---|---|
| New comp | `execute_command comp.new {"name":"Intro","width":1920,"height":1080,"frameRate":30,"duration":4}` |
| Vertical Reel comp | same with `"width":1080,"height":1920` |
| Text | `execute_command layer.newText {"text":"Hi","size":120,"fill":"#ffffff","name":"Title"}` |
| Solid / shape / null | `layer.newSolid {"color":"#3366ff"}`, `layer.newShape {"kind":"ellipse","name":"Ring"}`, `layer.newNull {"name":"Ctrl"}` |
| Shape modifiers | `layer.addShapeItem {"layer":"Ring","kind":"trim"}` → returns `{uid, path}` to animate |
| Import media | `file.import {"paths":["/abs/clip.mp4"]}`; add `"sequence":true` for a numbered image run |
| Move a layer in time | `layer.timing {"layers":["Scene 2"],"start":5.1}` (comp seconds) |
| Mask | `layer.addMask {"layer":"Clip","shape":"ellipse"}` → `layer.mask.set {"field":"feather","value":40}` |

## Animate

| Goal | Calls |
|---|---|
| Slide in with ease | `add_keyframe {"layer":"Title","path":"transform/position","keys":[{"time":0,"value":[-300,540]},{"time":1.5,"value":[960,540]}],"interpolation":"easyEase"}` |
| Pop scale | `add_keyframe {"layer":"Title","path":"transform/scale","keys":[{"time":0,"value":[0,0]},{"time":0.5,"value":[100,100]}],"interpolation":"easyEase"}` |
| Draw-on stroke | add a `trim` shape item, then key its `end` from 0 to 100 |
| Expression | `set_property {"layer":"Title","path":"transform/rotation","expression":"time*90"}` |
| Sharper ease | `keys.select {"keys":[{"layer":"Ring","path":"contents/trim/end","time":0}]}` → `keys.velocity {"outSpeed":0,"outInfluence":33.33}` |
| Stagger layers | select them, then `layer.quickOffset {"delta":0.6}` |
| Gradient fill | `set_property {"path":"contents/gfill/colors","value":["#0080ff","#ffff00"]}` |

`set_property` and `get_property` replies carry `evaluated` (what renders) beside `value`, and
`expressionError` when an expression fails. An expression with a syntax error is kept but disabled.

## Effects

| Goal | Calls |
|---|---|
| Effect with settings | `list_effects {"filter":"glow"}` → `add_effect {"layer":"Title","effect":"Glow","values":{"threshold":40,"radius":30}}` |
| Tweak later | `set_property {"layer":"Title","path":"effects/#1/intensity","value":2}` |
| Key a green screen | `add_effect {"layer":"Clip","effect":"Keylight (1.2)"}` → `execute_command effect.pickColor {"layer":"Clip","effect":1,"param":"screenColour","x":20,"y":20,"average":true}` → `render_frame {"transparent":true}` |

## Look and render

| Goal | Calls |
|---|---|
| One frame | `render_frame {"time":1.5,"max_side":640}` |
| Contact sheet | `render_frame {"times":[0,0.5,1,1.5,2],"columns":5}` |
| Check alpha | `render_frame {"transparent":true}` |
| Queue a movie | `renderQueue.add {"comp":"Main","format":"h264","output":"/abs/main.mp4"}` → `renderQueue.render {"wait":true}` |
| Alpha movie | `renderQueue.add {"comp":"Main","format":"prores","proresProfile":4444,"channels":"rgba","output":"/abs/main.mov"}` |
| Lottie | `file.exportLottie {"comp":"Main","path":"/abs/main.json"}` (a `.lottie` path writes dotLottie) |
| Save | `save_project {"path":"/abs/main.ecproj"}` |

A second render cannot start while one is running. A failed queue item, or a `batch` with a failed
step, comes back with `isError: true`; read `results` / `items` for the detail.

## Templates

A lower third or title card built once can be rendered many times with different text:

```sh
effectcraft-cli render --template lt.ectemplate --values values.json --out 'title_[#####].png'
```

`values.json` is an object keyed by Essential Graphics control name, for example
`{"Title":"John Smith","Bar Color":"#00c080"}`. Export the template with
`essential.exportTemplate {"comp":"Lower Third", …}`.

## Interop

- After Effects: `file.importAep {"path":…,"dryRun":true}` lists what would be lost;
  `"allowLosses":true` imports the rest. `file.exportAep` is the reverse.
- Premiere / Resolve: `file.importTimeline` and `file.exportTimeline` read and write FCP7 XML,
  `.fcpxml`, `.otio`, `.edl`, `.aaf`, `.omf`. Native `.prproj` is not supported.
- Lottie in: `file.importLottie {"path":"anim.json"}`.

## Seeing the live app

Start the desktop app with `effectcraft --control 9877` and the MCP server with
`mcp --bridge 9877`. Bridge mode adds `screenshot` and the `ui_*` tools, and every edit shows in the
window as it happens. This needs a display, so it is for a user's own machine, not a cloud session.
