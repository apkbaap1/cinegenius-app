import { build } from "esbuild"; import { createRequire } from "node:module"; const { chromium } = createRequire(import.meta.url)(process.env.PW || "playwright"); import fs from "node:fs";
const out = process.argv[2] || "out/cast.png";
const r = await build({ entryPoints: ["scripts/cast-sheet.ts"], bundle: true, write: false, format: "iife", external: ["three"], logLevel: "error" });
const b = await chromium.launch(); const pg = await b.newPage();
pg.on("pageerror", (e) => console.log("ERR", e.message));
await pg.setContent("<html><body style='margin:0'></body></html>"); await pg.addScriptTag({ content: r.outputFiles[0].text });
await pg.waitForFunction(() => window.done, null, { timeout: 20000 });
fs.mkdirSync("out", { recursive: true }); await (await pg.$("canvas")).screenshot({ path: out }); await b.close(); console.log("wrote", out);
