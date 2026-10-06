// Shared demand model and helpers for the convergence versions (v13+).
// Elasticity e = how fast buyers leave as the price rises. Values are illustrative, not market data.
const PRODUCTS = {
  festival: { name: "🎪 Hot festival, only stand", p0: 1, cost: .3, base: 60, e: .5, blurb: "Few alternatives and lots of thirst: buyers stay, so higher prices pay off." },
  rival: { name: "🍋 Rival stand next door", p0: 1, cost: .3, base: 60, e: 2.5, blurb: "Buyers can switch in ten steps: raising the price sends them to your rival." },
  petrol: { name: "⛽ Petrol", p0: 4, cost: 3, base: 60, e: .3, blurb: "Hard to avoid: people still need to drive." },
  cake: { name: "🍰 Cake slice", p0: 4, cost: 1.5, base: 60, e: 2.5, blurb: "Easy to skip: there's always a donut." },
};

const $ = id => document.getElementById(id);
const money = n => (n < 0 ? "-$" : "$") + Math.abs(n).toFixed(2);
const percent = x => (x > 0 ? "+" : "") + Math.round(x * 100) + "%";

const demand = (x, price) => Math.min(100, x.base * (price / x.p0) ** -x.e);
const sold = (x, price) => Math.round(demand(x, price));
const profitAt = (x, price) => (price - x.cost) * sold(x, price);
const bestPrice = (x, lo, hi) => {
  let best = lo;
  for (let p = lo; p <= hi; p += (hi - lo) / 200) if (profitAt(x, p) > profitAt(x, best)) best = p;
  return best;
};

// One 🙂 per 4 buyers; `lost` faded faces show who left compared with `before`.
const crowd = (now, before = now) => now < 2 ? "🦗 Nobody came." :
  "🙂".repeat(Math.round(now / 4)) + `<span class="gone">${"🙂".repeat(Math.max(0, Math.round((before - now) / 4)))}</span>`;

// Hand-drawn wobble used by `.wobbly` (see sketch.css).
document.body.insertAdjacentHTML("afterbegin",
  `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="wobble"><feTurbulence baseFrequency=".03" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="4"/></filter></svg>`);
