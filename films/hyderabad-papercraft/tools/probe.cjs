// probe: load the page headless (software GL), report build time and per-frame cost
(async () => {
const { chromium } = require('playwright');
const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const root = process.cwd(), page0 = process.argv[2] || 'index.html', size = process.argv[3] || '540x960';
const types = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); }).listen(8765);
const b = await chromium.launch({ args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 540, height: 960 } });
p.on('console', (m) => { const t = m.text(); if (!/GPU stall|willReadFrequently/.test(t)) console.log('  page:', t.slice(0, 300)); });
p.on('pageerror', (e) => console.log('  ERROR:', e.message));
const t0 = Date.now();
await p.goto(`http://localhost:8765/${page0}?capture&size=${size}`);
await p.waitForFunction('window.__papercraft && window.__papercraft.ready', null, { timeout: 1500000, polling: 2000 });
console.log('ready after', (Date.now() - t0) / 1000, 's');
const ms = await p.evaluate(async () => { const H = window.__papercraft; H.restart(); const a = performance.now(); for (let i = 0; i < 5; i++) H.step(1 / 30); await new Promise(r => requestAnimationFrame(r)); return (performance.now() - a) / 5; });
console.log('per step (incl render?)', ms.toFixed(0), 'ms');
await p.screenshot({ path: 'frames/probe.png' });
await b.close(); srv.close();
})();
