// Draws the cast on one canvas for look checks: node scripts/cast-sheet.mjs out/cast.png
import { Pen, bodyFront, bodySide, student, woman, PROFESSOR, leader, villager, miner, kidIn, worker, Outfit, FrontOpts } from "../src/videos/telangana/toon";
const cast: [Outfit, FrontOpts, boolean?][] = [
  [student(0), { mode: "stand", expr: "stern", wave: 1 }], [student(1), { mode: "march", expr: "grin", phase: 0.2 }],
  [woman(0), { mode: "stand", expr: "smile_closed" }], [woman(3), { mode: "stand", expr: "grin", wave: 0.5 }],
  [PROFESSOR, { mode: "stand", expr: "smile" }], [leader(0), { mode: "stand", expr: "neutral" }], [leader(1), { mode: "sit", expr: "smile" }],
  [villager(2), { mode: "stand", expr: "smile" }], [miner(1, true), { mode: "stand", expr: "stern" }], [miner(0, false), { mode: "stand", expr: "neutral" }],
  [kidIn(0), { mode: "stand", expr: "grin" }], [kidIn(1), { mode: "stand", expr: "laugh" }], [worker(0), { mode: "stand", expr: "stern" }],
  [PROFESSOR, { mode: "march", expr: "smile", phase: 0.3 }, true], [woman(2), { mode: "march", expr: "smile", phase: 0.1 }, true],
];
const cv = document.createElement("canvas"); cv.width = 300 * 8; cv.height = 500 * 2; document.body.appendChild(cv);
const g = cv.getContext("2d")!; g.fillStyle = "#cfe3f2"; g.fillRect(0, 0, cv.width, cv.height);
cast.forEach(([o, fo, side], i) => {
  g.setTransform(0.5, 0, 0, 0.5, (i % 8) * 300, Math.floor(i / 8) * 500);
  const p = new Pen(g);
  if (side) bodySide(p, o, { mode: "march", phase: fo.phase, expr: fo.expr, seed: i + 1 }); else bodyFront(p, o, { ...fo, seed: i + 1 });
});
(window as any).done = true;
