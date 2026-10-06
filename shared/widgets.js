// Reusable widgets for v19+. They output plain markup with generic class names;
// widgets.css gives them structure and each page sets its own colors. Load after sketch.js.

// Lemonade-stand demo: pick a situation, drag the price, watch the crowd.
// onLesson fires once the visitor has pushed the price up in every situation.
function mountStand(el, keys, { meter = false, onLesson } = {}) {
  const items = keys.map(k => PRODUCTS[k]);
  const raised = new Set();
  let x = items[0], lessonFired = false;

  el.innerHTML = `
    ${items.length > 1 ? `<div class="pills" role="group" aria-label="Situation">${items.map((m, i) => `<button class="pill" data-i="${i}">${m.name}</button>`).join("")}</div>` : ""}
    <p class="blurb"></p>
    <p class="price"></p>
    <input class="slider" type="range" min=".3" max="5" step=".1" value="1" aria-label="Price of one cup of lemonade">
    <div class="crowd" aria-hidden="true"></div>
    <div class="stats"><div>Cups sold<b class="cups"></b></div><div>Money in<b class="revenue"></b></div><div>Profit<b class="profit"></b></div></div>
    ${meter ? `<div class="meter"><i></i></div><p class="best"></p>` : ""}
    <p class="coach" aria-live="polite"></p>`;
  const $q = s => el.querySelector(s);

  function coach(price, profit, top, kept) {
    if (profit >= .9 * top) return "Sweet spot! That's close to the best price you could charge here.";
    if (price < .5) return "Almost free: everyone shows up, but you barely earn anything on each cup.";
    if (price > x.p0) return kept < .5 ? "Ouch: most of your customers walked away."
      : kept < .85 ? "Some customers dropped out, but each cup earns more."
      : "Hardly anyone minded the higher price, and each cup earns more.";
    return "Cheaper: more people show up, but you earn less on each cup.";
  }

  function render() {
    const price = +$q(".slider").value, cups = sold(x, price), usual = sold(x, x.p0);
    const profit = profitAt(x, price), top = profitAt(x, bestPrice(x, .3, 5));
    $q(".blurb").textContent = x.blurb;
    $q(".price").textContent = `${money(price)} a cup`;
    $q(".crowd").innerHTML = crowd(cups, usual);
    $q(".cups").textContent = cups;
    $q(".revenue").textContent = money(price * cups);
    $q(".profit").textContent = money(profit);
    if (meter) {
      const pct = Math.max(0, Math.round(profit / top * 100));
      $q(".meter i").style.width = `${pct}%`;
      $q(".best").textContent = `You're making ${pct}% of the best possible profit. Best price: ${money(bestPrice(x, .3, 5))}.`;
    }
    $q(".coach").textContent = coach(price, profit, top, cups / usual);
    el.querySelectorAll(".pill").forEach((b, i) => b.classList.toggle("on", items[i] === x));
    if (price >= 2) raised.add(x);
    if (onLesson && !lessonFired && items.length > 1 && raised.size === items.length) { lessonFired = true; onLesson(); }
  }

  el.addEventListener("click", e => { const b = e.target.closest(".pill"); if (b) { x = items[b.dataset.i]; render(); } });
  $q(".slider").addEventListener("input", render);
  render();
}

// "Price your own product": presets plus dials for price, cost and how replaceable the product is.
const PRESETS = [
  { name: "☕ Latte", p0: 5, cost: 1, ease: 3 },
  { name: "🎟 Concert ticket", p0: 80, cost: 40, ease: 4 },
  { name: "💊 Prescription", p0: 30, cost: 10, ease: 1 },
  { name: "💇 Haircut", p0: 35, cost: 10, ease: 2 },
];
const EASE = ["nothing else will do", "hard to replace", "some alternatives", "many alternatives", "swap in a second"];

function mountPlayground(el) {
  el.innerHTML = `
    <div class="pg-controls">
      <div class="chips" role="group" aria-label="Examples">${PRESETS.map((p, i) => `<button class="chip" data-i="${i}">${p.name}</button>`).join("")}</div>
      <label class="field">Typical price <input class="p0" type="number" min="1" step="1"></label>
      <label class="field">What it costs you <input class="cost" type="number" min="0" step="1"></label>
      <label class="field">How easy is it to replace? <b class="ease-text"></b><input class="ease slider" type="range" min="1" max="5"></label>
      <label class="field">Your price <b class="price-text"></b><input class="pct slider" type="range" min="30" max="300" value="100"></label>
    </div>
    <div class="pg-result">
      <div class="crowd" aria-hidden="true"></div>
      <div class="stats" aria-live="polite"><div>Buyers<b class="buyers"></b></div><div>Money in<b class="revenue"></b></div><div>Profit<b class="profit"></b></div></div>
      <div class="meter"><i></i></div>
      <p class="best"></p>
      <p class="whatif"></p>
      <p class="verdict"><span class="badge"></span> <span class="why"></span></p>
    </div>`;
  const $q = s => el.querySelector(s);

  function render() {
    const p0 = +$q(".p0").value || 1;
    const x = { p0, cost: +$q(".cost").value, base: 60, e: .2 + ($q(".ease").value - 1) * .7 };
    const price = p0 * $q(".pct").value / 100;
    const now = sold(x, price), before = sold(x, p0), after = sold(x, price * 1.1);
    const top = bestPrice(x, p0 * .3, p0 * 3), profit = profitAt(x, price), topProfit = profitAt(x, top);
    const pct = topProfit > 0 ? Math.max(0, Math.round(profit / topProfit * 100)) : 0;

    $q(".ease-text").textContent = EASE[$q(".ease").value - 1];
    $q(".price-text").textContent = money(price);
    $q(".crowd").innerHTML = crowd(now, before);
    $q(".buyers").textContent = percent(now / before - 1);
    $q(".revenue").textContent = money(price * now);
    $q(".profit").textContent = money(profit);
    $q(".meter i").style.width = `${pct}%`;
    $q(".best").textContent = `Best price here: about ${money(top)}. You're at ${pct}% of the best profit.`;
    $q(".whatif").textContent = `If you raised this price another 10%: buyers ${percent(after / now - 1)}, money in ${percent(1.1 * after / now - 1)}.`;
    $q(".badge").textContent = x.e < 1 ? "Inelastic" : "Elastic";
    $q(".badge").className = `badge ${x.e < 1 ? "inelastic" : "elastic"}`;
    $q(".why").textContent = x.e < 1
      ? "Buyers barely react to price, so raising it tends to bring in more money, up to a point."
      : "Buyers react strongly to price, so raising it tends to lose more in sales than it gains per sale.";
  }

  el.addEventListener("click", e => {
    const p = PRESETS[e.target.dataset.i];
    if (!p || !e.target.matches(".chip")) return;
    $q(".p0").value = p.p0;
    $q(".cost").value = p.cost;
    $q(".ease").value = p.ease;
    $q(".pct").value = 100;
    el.querySelectorAll(".chip").forEach(b => b.classList.toggle("on", b === e.target));
    render();
  });
  el.querySelectorAll("input").forEach(i => i.addEventListener("input", render));
  $q(".chip").click();
}

// A small table: what a 10% price rise does to buyers and to money in, per product.
function mountRise(el, keys) {
  const rows = keys.map(k => {
    const x = PRODUCTS[k], price = x.p0 * 1.1, now = sold(x, price), before = sold(x, x.p0);
    return `<tr><td>${x.name}</td><td>${percent(now / before - 1)}</td><td>${percent(price * now / (x.p0 * before) - 1)}</td><td>${x.e < 1 ? "Inelastic" : "Elastic"}</td></tr>`;
  });
  el.innerHTML = `<table class="rise"><thead><tr><th>If the price rises 10%</th><th>Buyers</th><th>Money in</th><th>So demand is</th></tr></thead><tbody>${rows.join("")}</tbody></table>`;
}
