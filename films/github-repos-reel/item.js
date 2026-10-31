// One repo beat: paid app → free repo, its name and job, its GitHub page with a star click, and the progress row.
import { ITEMS } from "./items.js";
import { span, outCubic, outBack, enter, typed, fontsReady } from "./shared.js";

const DURATION = 7;

export function mount(n) {
  const it = ITEMS[n - 1];
  document.body.innerHTML = `
  <div id="badge" class="abs mono">#${String(n).padStart(2, "0")}</div>
  <div id="pill" class="abs mono"><span>●</span> OPEN SOURCE · FREE</div>
  <div id="paid" class="abs tile"><b>${it.paid}</b><small>PAID</small><div id="stamp">CANCELLED</div></div>
  <svg id="arrow" class="abs" viewBox="0 0 160 60"><path id="arrowPath" d="M8 30 H140 M118 10 L144 30 L118 50" fill="none" stroke="#ffc531" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" pathLength="1"/></svg>
  <div id="free" class="abs tile"><div class="mono-badge">${it.mono}</div><small>FREE</small></div>
  <div id="name" class="abs">${it.free}</div>
  <div id="sub" class="abs">replaces <s>${it.paid}</s> · ${it.what}</div>
  <div id="card" class="abs">
    <div class="bar"><i></i><i></i><i></i><div class="url mono"><span id="url"></span></div></div>
    <div class="body">
      <div class="col"><div class="repo mono">${it.url.split("/").slice(1).join(" / ")}</div>${'<div class="sk"></div>'.repeat(5)}</div>
      <div class="col about"><div id="star" class="star"><span id="starIcon">☆</span> Star</div><div class="sk short"></div><div class="sk short"></div><div class="sk short"></div></div>
    </div>
    <svg id="cursor" class="abs" viewBox="0 0 24 24"><path d="M3 2 L3 20 L8 15 L12 23 L15 21.5 L11 14 L18 14 Z" fill="#fff" stroke="#0a0c11" stroke-width="1.5" stroke-linejoin="round"/></svg>
    <div id="plus" class="abs mono">+1 ★</div>
  </div>
  <div id="dots" class="abs">${ITEMS.map((_, i) => `<i class="${i < n - 1 ? "done" : i === n - 1 ? "now" : ""}"></i>`).join("")}</div>`;

  const $ = (id) => document.getElementById(id);
  const URL = it.url;

  window.film = {
    duration: DURATION,
    ready: fontsReady(),
    frame(t) {
      const end = DURATION;
      enter($("badge"), t, 0, { pop: true, end });
      enter($("pill"), t, 0.05, { end });
      enter($("paid"), t, 0.05, { pop: true, end });
      $("arrowPath").style.strokeDasharray = "1 1";
      $("arrowPath").style.strokeDashoffset = 1 - outCubic(span(t, 0.2, 0.5));
      $("arrow").style.opacity = 1 - span(t, end - 0.25, end);
      enter($("free"), t, 0.35, { pop: true, end });
      enter($("name"), t, 0.45, { dist: 50, end });
      enter($("sub"), t, 0.6, { end });

      // The paid app gets stamped out.
      const s = span(t, 1.0, 1.2);
      $("stamp").style.opacity = s > 0 ? 1 : 0;
      $("stamp").style.transform = `rotate(-14deg) scale(${2.2 - 1.2 * outCubic(s)})`;
      $("paid").style.filter = `grayscale(${span(t, 1.0, 1.3)})`;

      // Its GitHub page rises, the address types, the cursor stars it.
      enter($("card"), t, 0.7, { dist: 90, dur: 0.5, end });
      $("url").textContent = typed(URL, t, 0.9, 1.8);
      const mv = outCubic(span(t, 2.2, 2.9));
      $("cursor").style.transform = `translate(${-260 * (1 - mv)}px, ${200 * (1 - mv)}px)`;
      $("cursor").style.opacity = span(t, 2.0, 2.2);
      const click = span(t, 3.0, 3.15);
      $("cursor").style.transform += ` scale(${1 - 0.18 * Math.sin(Math.PI * click)})`;
      const starred = t >= 3.08;
      $("star").classList.toggle("on", starred);
      $("starIcon").textContent = starred ? "★" : "☆";
      const pl = span(t, 3.1, 3.8);
      $("plus").style.opacity = pl > 0 ? 1 - span(t, 3.6, 4.0) : 0;
      $("plus").style.transform = `translateY(${-60 * outCubic(pl)}px) scale(${0.6 + 0.4 * outBack(Math.min(1, pl * 2))})`;

      enter($("dots"), t, 0, { dur: 0.2, dist: 0, end });
      $("dots").querySelector(".now").style.setProperty("--fill", `${outCubic(span(t, 0.2, 4.4)) * 100}%`);
    },
  };
}
