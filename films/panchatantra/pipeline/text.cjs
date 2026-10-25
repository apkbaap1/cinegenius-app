// Telugu lettering for title and moral cards: renders one line in the Gurajada font (fonts/, OFL)
// to a transparent PNG in assets/, which a film then reveals with the brush front (env.image).
// The engine has no text shaping for Telugu, so the shaped glyphs come in as an image asset.
//
//   node pipeline/text.cjs <id> "<Telugu text>" [px size, default 220] [hex colour, default #5a3a22]
// Run from films/panchatantra after `npm install`. Prints the PNG's size (use it for drawImage).
const { chromium } = require("playwright-core");
const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, ".."), [id, text, size = "220", col = "#5a3a22"] = process.argv.slice(2);
if (!id || !text) { console.error('usage: node pipeline/text.cjs <id> "<text>" [size] [colour]'); process.exit(1); }
(async () => {
  const font = fs.readFileSync(path.join(ROOT, "fonts/Gurajada-Regular.ttf")).toString("base64");
  const b = await chromium.launch(), p = await b.newPage({ deviceScaleFactor: 1 });
  await p.setContent(`<style>@font-face{font-family:T;src:url(data:font/ttf;base64,${font})}body{margin:0;background:transparent}span{font-family:T;font-size:${size}px;color:${col};line-height:1.35;padding:10px 30px;display:inline-block;white-space:nowrap}</style><span>${text}</span>`);
  await p.evaluate(() => document.fonts.ready);
  const el = await p.$("span"), out = path.join(ROOT, "assets", `${id}.png`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await el.screenshot({ path: out, omitBackground: true });
  const bb = await el.boundingBox(); console.log(`${out} ${Math.round(bb.width)}x${Math.round(bb.height)}`);
  await b.close();
})();
