---
name: genjutsu-video-workflow
description: Replace the person in a real video clip with a new character while keeping the scene, camera, motion and original audio. Uses the Genjustsu workflow in tools/genjutsu (depth + SAM 3 masks or face mesh, then Seedance through Enhancor). Draft first, HD only on approval. Use when the user says "replace the actor", "swap the character in this clip", "put my character into this video", "Genjutsu", "Genjustsu", "subject replacement" or "character swap".
---

# Genjustsu video workflow

The workflow lives in `tools/genjutsu/` (vendored from sirioberati/Genjustsu-Open-Source-Workflow, MIT). Run every command from that folder.

Before running a job, read in this order:

1. `tools/genjutsu/AGENTS.md`: the operating contract. Follow it exactly.
2. `tools/genjutsu/docs/AGENT-OPERATIONS.md`: the CLI commands and review steps.
3. `tools/genjutsu/docs/ENHANCOR-API.md` before submitting or retrying, and `docs/MEDIA-HOSTING.md` before changing upload hosts.
4. For a first install, `tools/genjutsu/docs/SETUP-AGENT.md`.

## Rules that matter most

- **Paid calls.** Replicate (Demucs, depth, SAM 3) and Enhancor (Seedance) bill per run. Never submit a generation during setup. Never retry a paid request blindly: check the saved request IDs and use `workflow.py resume` instead.
- **Keys.** The user's own `ENHANCOR_API_KEY` and `REPLICATE_API_TOKEN` go in `tools/genjutsu/.env`, which is git-ignored. Never commit it, print it or ask for keys in chat.
- **Review gate.** Look at the whole prepared clip (mask or face mesh, every frame and cut) before any generation. If you cannot watch video, ask the user to review it in the UI. Approval is tied to artifact hashes and is void after any change.
- **Prompt.** Show the exact prompt before submitting. Map each reference to the right subject. An image reference goes to Edit; a video identity reference goes to Omni (multi_reference).
- **Audio.** The prepared video carries the +3 semitone vocals for lip sync. The final export always restores the complete original soundtrack.
- **HD.** Draft first. The 1080p upgrade needs the user's explicit approval.
- **Rights.** Only use footage and likenesses the user owns or has permission to use. Do not replace real people with other real people without consent.

## Modes

- `--mode depth` (default, advanced): colored depth + SAM 3 masks.
- `--mode face_mesh` (fast): local MediaPipe face mesh, no depth or SAM calls. Single centered speaker.
- `--mode depth_mesh`: both; review mask and face tracking.

Mesh modes need Python 3.12 and `bash setup-face-mesh.sh`.

## Fit with CineGenius

Use it after the Storyboard and Scene Breakdown stages, when a shot is filmed with a stand-in and needs the final character. Character references can come from the `character-builder` or `banana-pro-director-30` skills.
