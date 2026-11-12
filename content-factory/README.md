# Content factory

Phase 1 of the plan: one reel from research to render, with no GPU.

## Stages

| Stage | Tool | Status |
| --- | --- | --- |
| Research | ScrapeCreators skills in `.claude/skills` (`trend-discovery`, `outlier-post-finder`, ...) | Installed. Needs `SCRAPECREATORS_API_KEY` to run. |
| Script | `ig-reel`, `ashok-ig-voice`, `hook-master` skills | Working |
| Voice | `build/tts.py` (Edge TTS placeholder) or your own recording | Placeholder |
| Render | HyperFrames (`npx hyperframes`), skills in `.claude/skills/hyperframes*` | Working |
| Review | You approve script and video | Manual |
| Publish | Metricool draft for review | Not wired yet |

## Make or change a reel

Each reel is a folder under `reels/`.

```bash
cd reels/001-typed-not-edited
python3 build/tts.py                 # placeholder voice from script/script.txt, writes build/timing.json
npx hyperframes check                # lint, layout and reading-time checks
npx hyperframes preview              # live preview in the browser
npx hyperframes render -o renders/reel.mp4
```

- `script/script.txt` is the spoken script, one beat per line.
- `index.html` is the whole video: 1080x1920, text inside the Instagram-safe band.
- `caption.md` is the post caption.
- To use your own voice, replace `assets/vo.mp3` and adjust the scene times in `index.html`.
