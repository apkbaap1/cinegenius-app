// One command on a PC with a graphics card:  node scripts/render-final.mjs        (2K final, 1440 x 2560)
//                                            node scripts/render-final.mjs --draft (quick 540 x 960 check)
// Renders the picture with Remotion, then muxes the finished sound (audio/final/mix.m4a) with Remotion's own ffmpeg.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
const draft = process.argv.includes("--draft");
const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const run = (args) => { console.log(">", "npx", args.join(" ")); const r = spawnSync(npx, args, { stdio: "inherit", shell: process.platform === "win32" }); if (r.status !== 0) process.exit(r.status ?? 1); };
fs.mkdirSync("out", { recursive: true });
const silent = draft ? "out/draft-silent.mp4" : "out/video-silent.mp4";
const final = draft ? "out/telangana-te-draft.mp4" : "out/telangana-te-2k.mp4";
run(["remotion", "render", "src/index.ts", "TelanganaShort", silent, "--codec", "h264", "--crf", draft ? "23" : "16", "--scale", draft ? "0.5" : "1.3333",
  ...(process.env.REMOTION_GL ? ["--gl", process.env.REMOTION_GL] : []), "--concurrency", process.env.CONCURRENCY || "50%"]);
// Remotion writes a silent audio track: take the video from the render and the audio from the mix
run(["remotion", "ffmpeg", "-y", "-i", silent, "-i", "audio/final/mix.m4a", "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "copy",
  "-movflags", "+faststart", "-shortest", final]);
console.log("done:", final);
