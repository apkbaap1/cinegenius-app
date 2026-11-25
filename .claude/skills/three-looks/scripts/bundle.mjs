#!/usr/bin/env node
// Inline every `await load('x.js')` in a player page, so the page is one self-contained file.
// usage: node bundle.mjs <player.html> <out.html>   (paths in load() are relative to the page)
import fs from 'node:fs'; import path from 'node:path';
const [src, out] = process.argv.slice(2);
if (!src || !out) { console.error('usage: node bundle.mjs <player.html> <out.html>'); process.exit(1); }
const dir = path.dirname(path.resolve(src));
let html = fs.readFileSync(src, 'utf8');
html = html.replace(/^\s*await load\('([^']+)'\);.*$/gm, (_, f) => {
  const code = fs.readFileSync(path.join(dir, f), 'utf8');
  return `// ---- ${f}\n(0, eval)(${JSON.stringify(code)});`;   // indirect eval = classic global script, like a <script> tag
});
html = html.replace(/^.*const load = .*$\n/m, '').replace(/^\s*\/\/ bundle\.mjs replaces.*$\n/m, '');
fs.writeFileSync(out, html);
console.log('wrote', out, (html.length / 1024).toFixed(0) + ' KB');
