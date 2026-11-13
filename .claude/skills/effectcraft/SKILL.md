---
name: effectcraft
description: Make motion graphics and composited video with EffectCraft, the open-source layer-and-keyframe compositor, driven headlessly through its CLI or MCP server. Use when the user asks for an After Effects-style job - animated titles, lower thirds, kinetic type, shape animation, keying or effects on footage, a Lottie export, an .ecproj or .aep project - or names EffectCraft. For films built as web pages use openfilm instead.
---

# EffectCraft

EffectCraft (github.com/storytold/effectcraft, MIT / Apache-2.0) is a compositor in the After Effects
mould: compositions, layers, keyframes, 300+ effects, expressions, 3D, a render queue. Every menu
action is an engine command with a stable id and JSON params, so the whole app can be driven without
a window. This skill is the short path; the full manual is upstream in `docs/agents.md` and
`docs/mcp.md`. Read those when a command here is not enough, and trust `effectcraft-cli commands`
over this file when they disagree: the project moves fast.

## 1. Get the CLI

Check first: `effectcraft-cli info --json`. If it is missing, ask the user before installing or
building, then use one of:

- **Release build (fast):** from github.com/storytold/effectcraft/releases/latest take
  `effectcraft-<ver>-linux-x86_64.tar.gz` (or `.deb`, which puts the CLI at
  `/usr/bin/effectcraft-cli`), the macOS `effectcraft-cli-<ver>-macos-universal.zip`, or the Windows
  MSI (`%LOCALAPPDATA%\Programs\ArtCraft\EffectCraft\effectcraft-cli.exe`). Verify against
  `SHA256SUMS.txt`.
- **From source (slow, needs Rust 1.95+):** clone the repo and run
  `cargo build --release -p effectcraft-cli`; the binary is `target/release/effectcraft-cli`.

This repo's `.mcp.json` registers `effectcraft-cli mcp --autosave`, so once the binary is on `PATH`
a new session gets it as MCP tools. The tool names
below (`execute_command`, `add_keyframe`, `render_frame`…) are the MCP ones; each has a CLI twin.

## 2. The loop

Work the way an editor does: build a little, look, fix.

1. **Find the command.** `effectcraft-cli commands --filter <word>`, or
   `exec --list --schemas --json` for every command with its JSON Schema. Unknown param keys are
   rejected with the accepted list, so a wrong guess costs one call.
2. **Build.** Create a project file once, then edit it in place with `--save`:

   ```sh
   effectcraft-cli exec comp.new --params '{"name":"Main","width":1920,"height":1080,"frameRate":30,"duration":4}' --empty --save-as main.ecproj
   effectcraft-cli exec layer.newText '{"text":"Hello","size":160,"fill":"#ffffff","name":"Title"}' main.ecproj --save
   effectcraft-cli set Main Title transform/position '[960,540]' --time 1.5 main.ecproj --save
   ```

   For more than a few steps write them to a file and run them in one go:
   `effectcraft-cli run --commands steps.json main.ecproj --save --json`, where the file is a JSON
   array of `{"command": ID, "params": {…}}`.
3. **Look.** `effectcraft-cli render-frame main.ecproj --time 1 --max-side 640 --out f.png --json`,
   then Read the PNG. Over MCP, `render_frame {"times":[0,0.5,1,1.5,2]}` returns one contact sheet,
   the cheapest way to judge motion. Never report a shot as done without looking at frames from its
   start, middle and end.
4. **Render.** `effectcraft-cli render main.ecproj --comp Main --out main.mp4` (formats: h264,
   prores, hevc, av1, webm, png and exr sequences). For web or app delivery:
   `exec file.exportLottie '{"comp":"Main","path":"main.json"}'` and read the returned `warnings`:
   they list everything a Lottie player will not show.

`.ecproj` is versioned JSON, so commit it and diff it like code.

## 3. Rules that save a session

- **Name layers when you create them** (`"name":"Title"`) and refer to them by name. A layer can
  also be `"#n"` (1-based from the top) or an id. A reference that matches nothing is an error.
- **Property paths come from the app, not memory.** `effectcraft-cli props Main Title` lists every
  property with its path (`transform/position`, `effects/#1/blurriness`). Use the paths that
  `effect.apply` and `layer.addShapeItem` return.
- **Layer time is not comp time.** Keyframe writes take layer seconds by default; `render-frame`
  and reads take comp seconds. On any layer that is offset or stretched pass `"timeBase":"comp"`.
- **Headless work lives in memory until saved.** On the CLI always pass `--save` / `--save-as`; on
  MCP start the server with `--autosave` or call `save_project` after each milestone.
- **Group edits.** MCP `batch` runs several commands as one undo step and rolls back on failure;
  `"$1.layer"` in a later step is step 1's result.
- **Check effects exist** before promising one: `list_effects {"filter":"glow"}` over MCP.
- **Expressions and scripts are After Effects-shaped.** `wiggle`, `loopOut`,
  `thisComp.layer("…")` work in expressions; `effectcraft-cli script build.jsx` runs scripts written
  against the AE scripting object model.
- **Do not overwrite sources.** Renders that would land on footage, a proxy or the project file are
  refused; pick another output path rather than working around it.
- When running an agent the user does not fully trust with the disk, confine it:
  `mcp --automation-read-root DIR --automation-write-root DIR`.

Recipes for common shots are in `references/cookbook.md`.

## 4. Say what you could not check

EffectCraft is young. If a command fails, an effect renders differently from what the user
described, or a format is unsupported, report it plainly with the error text instead of swapping in
a different tool silently.
