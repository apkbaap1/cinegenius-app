// One command on a PC with a graphics card:  node scripts/render-final.mjs        (2K final, 1440 x 2560)
//                                            node scripts/render-final.mjs --draft (quick 540 x 960 check)
// The film is rendered in 12 parts saved under out/parts-<draft|2k>/. If the render stops (crash, window closed,
// PC asleep), run the same command again: finished parts are kept and only the missing ones are rendered.
// Then the parts are joined and the finished sound (audio/final/mix.m4a) is added with Remotion's own ffmpeg.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const draft = process.argv.includes("--draft");
const TOTAL = 3530, PARTS = Number(process.env.PARTS || 12);
const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const run = (args) => {
  console.log(">", "npx", args.join(" "));
  const r = spawnSync(npx, args, { stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0) { console.log("\nStopped. Run the same command again to continue from the last finished part."); process.exit(r.status ?? 1); }
};
const tag = draft ? "draft" : "2k";
const dir = path.join("out", `parts-${tag}`);
fs.mkdirSync(dir, { recursive: true });
const per = Math.ceil(TOTAL / PARTS);
const parts = [];
for (let i = 0; i < PARTS; i++) {
  const a = i * per, b = Math.min(TOTAL, a + per) - 1;
  if (a > b) break;
  const file = path.join(dir, `part-${String(i + 1).padStart(2, "0")}.mp4`);
  parts.push(file);
  if (fs.existsSync(file)) { console.log(`part ${i + 1}/${PARTS} already done (frames ${a}-${b})`); continue; }
  console.log(`\n=== part ${i + 1}/${PARTS}: frames ${a}-${b} ===`);
  const tmp = file.replace(/\.mp4$/, ".rendering.mp4");
  run(["remotion", "render", "src/index.ts", "TelanganaShort", tmp, `--frames=${a}-${b}`, "--codec", "h264", "--crf", draft ? "23" : "16",
    "--scale", draft ? "0.5" : "1.3333",
    // use the graphics card: Chrome's default for a headless render is software WebGL (very slow, frames time out)
    "--gl", process.env.REMOTION_GL || (process.platform === "linux" ? "angle-egl" : "angle"),
    // every browser tab builds the whole world once (about a minute): few tabs, generous timeout
    "--concurrency", process.env.CONCURRENCY || "3", "--timeout", "600000"]);
  fs.renameSync(tmp, file); // only a fully finished part gets its final name
}
// join the parts (same encoder settings, so a straight copy) and add the sound
const list = path.join(dir, "list.txt");
fs.writeFileSync(list, parts.map((p) => `file '${path.resolve(p).replace(/\\/g, "/")}'`).join("\n"));
const joined = path.join(dir, "joined.mp4");
run(["remotion", "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", list, "-map", "0:v:0", "-c", "copy", joined]);
const final = draft ? "out/telangana-te-draft.mp4" : "out/telangana-te-2k.mp4";
run(["remotion", "ffmpeg", "-y", "-i", joined, "-i", "audio/final/mix.m4a", "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "copy",
  "-movflags", "+faststart", "-shortest", final]);
console.log("\ndone:", final, `\n(the parts in ${dir} can be deleted now)`);
