// ============================================================
// OMAR'S PIE — app.js v1.4.0
// Smart roll engine: flavor contrast · moisture · weight · presence
// ============================================================

// ── THEME ───────────────────────────────────────────────────
const THEME_KEY = "omars_pie_theme";
let currentTheme = localStorage.getItem(THEME_KEY) || "day";

function applyTheme(t) {
  currentTheme = t;
  document.documentElement.setAttribute("data-theme", t);
  localStorage.setItem(THEME_KEY, t);
  const btn = $("btn-theme");
  if (btn) btn.textContent = t === "day" ? "🌙" : "☀️";
}

// ── STATE ────────────────────────────────────────────────────
const state = {
  selectedCuisines: [],
  selectedSauce:    null,
  ovenMode:         "dome",
  complexity:       "traditional",
  currentPizza:     null,
  anchoredItems: new Set(JSON.parse(localStorage.getItem("op_anchored") || "[]")),
  excludedItems:  new Set(JSON.parse(localStorage.getItem("op_excluded")  || "[]")),
  history:        JSON.parse(localStorage.getItem("op_history")  || "[]"),
  session:        JSON.parse(localStorage.getItem("op_session")  || "[]"),
  saved:          JSON.parse(localStorage.getItem("op_saved")    || "[]"),
  libraryFilter:  null,
};

const $ = id => document.getElementById(id);

function saveAnchored() { localStorage.setItem("op_anchored", JSON.stringify([...state.anchoredItems])); }
function saveExcluded()  { localStorage.setItem("op_excluded",  JSON.stringify([...state.excludedItems]));  }
function saveHistory()   { localStorage.setItem("op_history",   JSON.stringify(state.history.slice(-20))); }
function saveSession()   { localStorage.setItem("op_session",   JSON.stringify(state.session)); }
function saveSaved()     { localStorage.setItem("op_saved",     JSON.stringify(state.saved)); }

function uid() { return Math.random().toString(36).slice(2,9); }
function gToOz(g) { return (g/28.35).toFixed(1); }

// ── SCREEN NAV ───────────────────────────────────────────────
function showScreen(name) {
  document.querySelectorAll(".screen").forEach(s => s.classList.toggle("active", s.id === "screen-"+name));
  window.scrollTo(0,0);
}

// ── CUISINE GRID ─────────────────────────────────────────────
function initCuisineGrid() {
  const grid = $("cuisine-grid");
  grid.innerHTML = "";
  CUISINES.forEach(c => {
    const btn = document.createElement("button");
    btn.className = "cuisine-tile";
    btn.dataset.id = c.id;
    btn.setAttribute("aria-pressed","false");
    btn.innerHTML = `
      <span class="tile-emoji">${c.emoji}</span>
      <span class="tile-name">${c.label}</span>
      <span class="tile-desc">${c.desc}</span>
      <span class="tile-check" aria-hidden="true">✓</span>`;
    btn.addEventListener("click", () => toggleCuisine(c.id));
    grid.appendChild(btn);
  });
}

function toggleCuisine(id) {
  const idx = state.selectedCuisines.indexOf(id);
  if (idx === -1) {
    if (state.selectedCuisines.length >= 2) {
      document.querySelectorAll(".cuisine-tile.selected").forEach(t => {
        t.classList.add("shake");
        setTimeout(() => t.classList.remove("shake"), 400);
      });
      return;
    }
    state.selectedCuisines.push(id);
  } else {
    state.selectedCuisines.splice(idx, 1);
  }
  updateCuisineUI();
}

function updateCuisineUI() {
  const sel = state.selectedCuisines;
  document.querySelectorAll(".cuisine-tile").forEach(tile => {
    const id = tile.dataset.id;
    const isSelected = sel.includes(id);
    tile.classList.toggle("selected", isSelected);
    tile.setAttribute("aria-pressed", isSelected ? "true" : "false");
    if (sel.length === 1 && !isSelected) {
      const isAffinity = CUISINE_AFFINITIES.some(pair => pair.includes(sel[0]) && pair.includes(id));
      tile.classList.toggle("affinity", isAffinity);
    } else {
      tile.classList.remove("affinity");
    }
  });
  let clashText = "";
  if (sel.length === 2) {
    const isClash = CUISINE_CLASHES.some(pair => pair.includes(sel[0]) && pair.includes(sel[1]));
    if (isClash) {
      const a = CUISINES.find(c => c.id === sel[0]);
      const b = CUISINES.find(c => c.id === sel[1]);
      clashText = `${a.label} + ${b.label} don't share a flavor language — tomato sauce is the safest anchor if you continue.`;
    }
  }
  const warn = $("clash-warning");
  warn.style.display = clashText ? "flex" : "none";
  $("clash-text").textContent = clashText;
  const canProceed = sel.length > 0;
  $("btn-to-sauce").disabled = !canProceed;
  $("proceed-hint").textContent = sel.length === 0
    ? "Pick a cuisine to continue"
    : sel.length === 1
      ? `${CUISINES.find(c => c.id === sel[0]).label} · Choose your sauce →`
      : `${CUISINES.find(c => c.id === sel[0]).label} + ${CUISINES.find(c => c.id === sel[1]).label} fusion`;
  updateSessionBadge();
}

$("btn-surprise").addEventListener("click", () => {
  const pick = CUISINE_AFFINITIES[Math.floor(Math.random() * CUISINE_AFFINITIES.length)];
  state.selectedCuisines = [...pick];
  updateCuisineUI();
});

$("btn-reset").addEventListener("click", () => {
  state.selectedCuisines = [];
  state.selectedSauce = null;
  state.ovenMode = "dome";
  state.complexity = "traditional";
  document.querySelectorAll(".oven-btn").forEach(b => b.classList.toggle("active", b.dataset.oven === "dome"));
  document.querySelectorAll(".complexity-btn").forEach(b => b.classList.toggle("active", b.dataset.complexity === "traditional"));
  updateCuisineUI();
  showToast("Selections cleared");
});

document.querySelectorAll(".oven-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".oven-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.ovenMode = btn.dataset.oven;
  });
});

document.querySelectorAll(".complexity-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".complexity-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.complexity = btn.dataset.complexity;
  });
});

// ── SAUCE SCREEN ─────────────────────────────────────────────
$("btn-to-sauce").addEventListener("click", () => { buildSauceScreen(); showScreen("sauce"); });

function buildSauceScreen() {
  const container = $("sauce-grid");
  container.innerHTML = "";
  const profileSet = PROFILE_INCLUDES[state.complexity];
  const cuisines   = state.selectedCuisines;
  const hasClash   = cuisines.length === 2 && CUISINE_CLASHES.some(
    pair => pair.includes(cuisines[0]) && pair.includes(cuisines[1])
  );
  $("sauce-clash-banner").style.display = hasClash ? "flex" : "none";

  const sauces = TOPPINGS.filter(t =>
    t.layer === "sauce" &&
    profileSet.includes(t.profile) &&
    !state.excludedItems.has(t.id) &&
    (
      (cuisines.length > 0 && t.cuisine.some(c => cuisines.includes(c))) ||
      t.id === "nosause" ||
      (t.sauceFamilies.includes("tomato") && !CUISINE_LOCKED_SAUCES.has(t.id))
    )
  );

  const familyEmoji = { tomato:"🍅", dairy:"🥛", herb:"🌿", spicepaste:"🌶️", meatbase:"🥩", nosause:"🍞" };

  sauces.forEach(sauce => {
    const card = document.createElement("button");
    card.className = "sauce-card";
    if (state.selectedSauce?.id === sauce.id) card.classList.add("selected");
    if (hasClash && sauce.sauceFamilies.includes("tomato") && sauce.id !== "nosause") card.classList.add("nudged");
    const family = sauce.sauceFamilies[0];
    const jarBadge = sauce.jarred ? `<span class="sauce-badge jar">Jarred · ${sauce.brand||""}</span>` : "";
    card.innerHTML = `
      <div class="sauce-card-top">
        <span class="sauce-family-emoji">${familyEmoji[family]||"🍕"}</span>
        <span class="sauce-name">${sauce.name}</span>
        ${hasClash && sauce.sauceFamilies.includes("tomato") && sauce.id !== "nosause"
          ? '<span class="safe-anchor-tag">safe anchor</span>' : ""}
      </div>
      ${sauce.desc ? `<p class="sauce-desc">${sauce.desc}</p>` : `<p class="sauce-desc">${sauce.note||""}</p>`}
      ${jarBadge}`;
    card.addEventListener("click", () => {
      state.selectedSauce = sauce;
      document.querySelectorAll(".sauce-card").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      $("btn-roll").disabled = false;
    });
    container.appendChild(card);
  });
  $("btn-roll").disabled = !state.selectedSauce || !sauces.find(s => s.id === state.selectedSauce?.id);
}

$("btn-back-sauce").addEventListener("click", () => showScreen("setup"));
$("btn-surprise-sauce").addEventListener("click", () => {
  const cards = document.querySelectorAll(".sauce-card");
  if (cards.length) cards[Math.floor(Math.random() * cards.length)].click();
});

$("btn-roll").addEventListener("click", () => {
  state.currentPizza = rollPizza();
  renderPizza(state.currentPizza);
  state.history.unshift({ pizza: state.currentPizza, cuisines: [...state.selectedCuisines], ts: Date.now() });
  saveHistory();
  showScreen("pizza");
});

// ══════════════════════════════════════════════════════════════
// SMART ROLL ENGINE v1.4.0
// Tracks: flavor contrast · moisture budget · weight budget · presence
// ══════════════════════════════════════════════════════════════

function rollPizza() {
  const cuisines   = state.selectedCuisines;
  const profileSet = PROFILE_INCLUDES[state.complexity];
  const sauce      = state.selectedSauce;
  const sauceFam   = sauce?.sauceFamilies?.[0] || "tomato";
  const buildProf  = SAUCE_BUILD_PROFILES[sauceFam] || SAUCE_BUILD_PROFILES.tomato;
  const pizza      = {};

  // ── BUDGET TRACKER ──────────────────────────────────────────
  const budget = {
    flavorNotes:    {},   // note → count, max 2 of any single note
    highMoisture:   0,    // max 2 high-moisture items pre-bake
    weightScore:    0,    // light=1, medium=2, heavy=3 — soft cap at 8
    presenceByLayer:{},   // layer → anchor count, max 1 per layer
  };

  // Seed budget with sauce
  if (sauce?.flavorNotes) sauce.flavorNotes.forEach(n => { budget.flavorNotes[n] = (budget.flavorNotes[n]||0)+1; });
  if (sauce?.moisture === "high") budget.highMoisture++;
  budget.weightScore += weightVal(sauce?.weight);

  function weightVal(w) { return w === "light" ? 1 : w === "medium" ? 2 : w === "heavy" ? 3 : 0; }

  function isBudgetOk(item, layer) {
    if (!item) return false;
    // Flavor note check — no note more than twice
    if (item.flavorNotes) {
      for (const note of item.flavorNotes) {
        if ((budget.flavorNotes[note]||0) >= 2) return false;
      }
    }
    // Moisture check — max 2 high pre-bake
    if (item.moisture === "high" && !item.postbake) {
      if (budget.highMoisture >= 2) return false;
    }
    // Weight check — soft cap at 8
    if (budget.weightScore + weightVal(item.weight) > 9) return false;
    // Presence check — max 1 anchor per layer
    if (item.presence === "anchor") {
      if ((budget.presenceByLayer[layer]||0) >= 1) return false;
    }
    return true;
  }

  function spendBudget(item, layer) {
    if (!item) return;
    if (item.flavorNotes) item.flavorNotes.forEach(n => { budget.flavorNotes[n] = (budget.flavorNotes[n]||0)+1; });
    if (item.moisture === "high" && !item.postbake) budget.highMoisture++;
    budget.weightScore += weightVal(item.weight);
    if (item.presence === "anchor") budget.presenceByLayer[layer] = (budget.presenceByLayer[layer]||0)+1;
  }

  // ── BASE ────────────────────────────────────────────────────
  const baseProf = buildProf.base;
  const baseAppears = Math.random() < baseProf.prob;
  if (baseAppears) {
    const baseCands = getCandidates("base", cuisines, profileSet).filter(t =>
      t.compatibleSauceFamilies?.includes(sauceFam) || t.id === "evoo_base" || t.id === "garlic_oil"
    );
    const anchored = baseCands.filter(t => state.anchoredItems.has(t.id));
    const free     = baseCands.filter(t => !state.anchoredItems.has(t.id));
    const picked   = [...anchored];
    if (picked.length === 0) {
      const candidate = smartPick(free, "base", 1);
      picked.push(...candidate);
    }
    picked.forEach(t => spendBudget(t, "base"));
    pizza.base = picked;
  } else {
    pizza.base = state.anchoredItems.size > 0
      ? getCandidates("base", cuisines, profileSet).filter(t => state.anchoredItems.has(t.id))
      : [];
    pizza.base.forEach(t => spendBudget(t, "base"));
  }

  // ── SAUCE ────────────────────────────────────────────────────
  pizza.sauce = [sauce];

  // ── REMAINING LAYERS ─────────────────────────────────────────
  const layerOrder = ["cheese","protein","veg","finish"];

  layerOrder.forEach(layer => {
    const lp = buildProf[layer];
    if (!lp) { pizza[layer] = []; return; }

    // Check anchored items first
    const anchored = getCandidates(layer, cuisines, profileSet)
      .filter(t => state.anchoredItems.has(t.id) && isBudgetOk(t, layer));
    anchored.forEach(t => spendBudget(t, layer));

    const appears = Math.random() < lp.prob;
    if (!appears && anchored.length === 0) { pizza[layer] = []; return; }

    const [minCount, maxCount] = lp.count;
    const targetCount = anchored.length > 0
      ? Math.max(anchored.length, minCount + Math.floor(Math.random() * (maxCount - minCount + 1)))
      : minCount + Math.floor(Math.random() * (maxCount - minCount + 1));

    const needed = Math.max(0, targetCount - anchored.length);
    const free   = getCandidates(layer, cuisines, profileSet)
      .filter(t => !state.anchoredItems.has(t.id) && !state.excludedItems.has(t.id));

    const additional = smartPick(free, layer, needed);
    pizza[layer] = [...anchored, ...additional];
  });

  pizza._ovenMode   = state.ovenMode;
  pizza._cuisines   = [...cuisines];
  pizza._complexity = state.complexity;
  return pizza;
}

// ── CANDIDATE FILTER ─────────────────────────────────────────
function getCandidates(layer, cuisines, profileSet) {
  return TOPPINGS.filter(t =>
    t.layer === layer &&
    profileSet.includes(t.profile) &&
    !state.excludedItems.has(t.id) &&
    (cuisines.length === 0 || t.cuisine.some(c => cuisines.includes(c)))
  );
}

// ── SMART PICK ───────────────────────────────────────────────
// Picks n items from candidates respecting budget constraints
// Prioritizes sauce-family affinity, then contrast, then random
function smartPick(candidates, layer, n) {
  if (n <= 0 || !candidates.length) return [];
  const sauce     = state.selectedSauce;
  const sauceFam  = sauce?.sauceFamilies || [];
  const picked    = [];
  const remaining = [...candidates].sort(() => Math.random() - 0.5); // shuffle for variety

  for (const candidate of remaining) {
    if (picked.length >= n) break;
    if (!isBudgetOk(candidate, layer)) continue;

    // Redundancy check within already picked for this layer
    const isDuplicate = picked.some(p => {
      // Same flavor profile — don't pick two items with identical primary notes
      const sharedNotes = (p.flavorNotes||[]).filter(n => (candidate.flavorNotes||[]).includes(n));
      return sharedNotes.length >= 2; // too similar
    });
    if (isDuplicate) continue;

    // Presence constraint already checked in isBudgetOk
    picked.push(candidate);
    spendBudget(candidate, layer);
  }

  return picked;
}

// ── RENDER PIZZA ─────────────────────────────────────────────
function renderPizza(pizza) {
  const container = $("pizza-layers");
  container.innerHTML = "";
  const oven = OVEN_GUIDANCE[pizza._ovenMode];
  const cuisineLabels = pizza._cuisines.map(id => {
    const c = CUISINES.find(x => x.id === id);
    return c ? `${c.emoji} ${c.label}` : id;
  }).join(" × ") || "Freestyle";
  $("pizza-title").textContent = cuisineLabels;
  $("pizza-oven-label").textContent = `${oven.emoji} ${oven.label} · ${oven.time}`;

  LAYER_ORDER.forEach(layer => {
    const items = pizza[layer];
    if (!items?.length) return;
    const meta    = LAYER_META[layer];
    const section = document.createElement("div");
    section.className = "layer-section";
    const header = document.createElement("div");
    header.className = "layer-header";
    header.innerHTML = `<span class="layer-emoji">${meta.emoji}</span><span class="layer-label">${meta.label}</span><span class="layer-note">${meta.note}</span>`;
    section.appendChild(header);

    items.forEach(item => {
      const card = document.createElement("div");
      card.className = "topping-card";
      if (state.anchoredItems.has(item.id)) card.classList.add("anchored");

      let prepBadge = "";
      if (item.prep) {
        const cls   = item.prep === PREP.RAW ? "badge-raw" : item.prep === PREP.PRE ? "badge-pre" : "badge-ready";
        const label = item.prep === PREP.RAW ? "🟡 Raw-on" : item.prep === PREP.PRE ? "🔴 Pre-cook" : "🟢 Ready";
        prepBadge = `<span class="prep-badge ${cls}">${label}</span>`;
        if (item.prep === PREP.RAW && pizza._ovenMode === "steel" && item.id === "egg") {
          prepBadge += `<span class="prep-badge badge-warn">⚠️ Check steel note</span>`;
        }
      }
      const postbakeFlag  = item.postbake   ? `<span class="postbake-tag">Post-bake</span>` : "";
      const homemadeFlag  = item.homemade   ? `<span class="homemade-tag">📋 Recipe</span>` : "";
      const makeAheadFlag = item.make_ahead ? `<span class="make-ahead-tag">⏱️ ${item.make_ahead_timing||"Make ahead"}</span>` : "";

      card.innerHTML = `
        <div class="topping-top">
          <span class="topping-name">${item.name}</span>
          <div class="topping-actions">
            <button class="act-btn anchor-btn${state.anchoredItems.has(item.id) ? " is-anchored" : ""}"
              data-id="${item.id}" title="${state.anchoredItems.has(item.id) ? "Remove anchor" : "Anchor always"}" aria-label="Anchor">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="${state.anchoredItems.has(item.id) ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2"><path d="M12 2a4 4 0 0 1 4 4c0 1.5-.8 2.8-2 3.5V20H8V9.5A4 4 0 0 1 8 6a4 4 0 0 1 4-4z"/><line x1="8" y1="20" x2="16" y2="20"/></svg>
            </button>
            <button class="act-btn swap-btn" data-id="${item.id}" data-layer="${layer}" title="Swap" aria-label="Swap">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
            </button>
            <button class="act-btn exclude-btn" data-id="${item.id}" title="Exclude always" aria-label="Exclude">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
            </button>
          </div>
        </div>
        <div class="topping-meta">${prepBadge}${postbakeFlag}${homemadeFlag}${makeAheadFlag}</div>
        ${item.desc ? `<div class="topping-desc">${item.desc}</div>` : ""}
        ${item.note ? `<div class="topping-note">${item.note}</div>` : ""}
        ${item.homemade && item.recipe ? renderRecipe(item.recipe) : ""}
      `;

      card.querySelector(".anchor-btn").addEventListener("click", e => {
        e.stopPropagation();
        const id = e.currentTarget.dataset.id;
        if (state.anchoredItems.has(id)) state.anchoredItems.delete(id);
        else { state.anchoredItems.add(id); state.excludedItems.delete(id); }
        saveAnchored(); saveExcluded();
        renderPizza(state.currentPizza);
      });
      card.querySelector(".swap-btn").addEventListener("click", e => {
        e.stopPropagation();
        swapItem(e.currentTarget.dataset.id, e.currentTarget.dataset.layer);
      });
      card.querySelector(".exclude-btn").addEventListener("click", e => {
        e.stopPropagation();
        const id = e.currentTarget.dataset.id;
        state.excludedItems.add(id);
        state.currentPizza[layer] = state.currentPizza[layer].filter(t => t.id !== id);
        saveExcluded();
        renderPizza(state.currentPizza);
        showToast("Excluded from future rolls");
      });

      if (item.homemade && item.recipe) {
        const recipeSection = card.querySelector(".recipe-section");
        const toggle = card.querySelector(".recipe-toggle");
        if (toggle && recipeSection) {
          toggle.addEventListener("click", e => {
            e.stopPropagation();
            const isOpen = recipeSection.classList.toggle("open");
            toggle.textContent = isOpen ? "Hide recipe ▲" : "Show recipe ▼";
          });
        }
      }
      section.appendChild(card);
    });
    container.appendChild(section);
  });

  const ovenSec = document.createElement("div");
  ovenSec.className = "oven-guide";
  ovenSec.innerHTML = `
    <div class="layer-header">
      <span class="layer-emoji">${oven.emoji}</span>
      <span class="layer-label">${oven.label}</span>
      <span class="layer-note">${oven.temp}</span>
    </div>
    <ul class="oven-tips">${oven.tips.map(t => `<li>${t}</li>`).join("")}</ul>`;
  container.appendChild(ovenSec);
}

function renderRecipe(recipe) {
  return `
    <button class="recipe-toggle">Show recipe ▼</button>
    <div class="recipe-section">
      <div class="recipe-makes">Makes: ${recipe.makes}</div>
      <div class="recipe-heading">Ingredients</div>
      <ul class="recipe-list">${recipe.ingredients.map(i=>`<li>${i}</li>`).join("")}</ul>
      <div class="recipe-heading">Method</div>
      <ol class="recipe-list recipe-method">${recipe.method.map(m=>`<li>${m}</li>`).join("")}</ol>
    </div>`;
}

function swapItem(oldId, layer) {
  const profileSet = PROFILE_INCLUDES[state.complexity];
  const cuisines   = state.currentPizza._cuisines;
  const candidates = getCandidates(layer, cuisines, profileSet)
    .filter(t => !state.anchoredItems.has(t.id) && !state.excludedItems.has(t.id));
  const currentIds = state.currentPizza[layer].map(t => t.id);
  const alts = candidates.filter(t => !currentIds.includes(t.id));
  if (!alts.length) { showToast("Nothing left to swap to"); return; }
  const replacement = alts[Math.floor(Math.random() * alts.length)];
  state.currentPizza[layer] = state.currentPizza[layer].map(t => t.id === oldId ? replacement : t);
  renderPizza(state.currentPizza);
}

// ── PIZZA RESULT ACTIONS ──────────────────────────────────────
$("btn-save-pie").addEventListener("click", () => {
  if (!state.currentPizza) return;
  const cuisineLabels = state.currentPizza._cuisines.map(id => {
    const c = CUISINES.find(x => x.id === id);
    return c ? `${c.emoji} ${c.label}` : id;
  }).join(" + ") || "My Pie";
  const name = prompt("Name this pie:", cuisineLabels);
  if (name === null) return;
  state.saved.unshift({ id:"saved_"+uid(), name:name.trim()||cuisineLabels, cuisines:[...state.currentPizza._cuisines], pizza:state.currentPizza, savedAt:Date.now() });
  saveSaved();
  showToast("Pie saved 🗂️");
});

$("btn-add-to-list").addEventListener("click", () => {
  if (!state.currentPizza) return;
  if (state.session.length >= 6) { showToast("Session full — max 6 pizzas"); return; }
  const cuisineLabels = state.currentPizza._cuisines.map(id => {
    const c = CUISINES.find(x => x.id === id);
    return c ? `${c.emoji} ${c.label}` : id;
  }).join(" + ") || "My Pie";
  state.session.push({ id:"sess_"+uid(), pizzaName:cuisineLabels, pizza:state.currentPizza, count:1, checked:{} });
  saveSession();
  updateSessionBadge();
  showToast("Added to shopping list 🛒");
});

$("btn-copy").addEventListener("click", () => {
  if (!state.currentPizza) return;
  const p = state.currentPizza;
  const oven = OVEN_GUIDANCE[p._ovenMode];
  const cuisineLabels = p._cuisines.map(id => { const c = CUISINES.find(x => x.id === id); return c ? `${c.emoji} ${c.label}` : id; }).join(" × ") || "Freestyle";
  const lines = [`🍕 ${cuisineLabels} — Omar's Pie`, `${oven.emoji} ${oven.label} · ${oven.time}`, ""];
  LAYER_ORDER.forEach(layer => {
    const items = p[layer];
    if (!items?.length) return;
    lines.push(`${LAYER_META[layer].emoji} ${LAYER_META[layer].label}:`);
    items.forEach(t => { const prep = t.prep ? ` [${t.prep}]` : ""; const pb = t.postbake ? " [post-bake]" : ""; lines.push(`  • ${t.name}${prep}${pb}${t.note ? " — "+t.note : ""}`); });
    lines.push("");
  });
  lines.push("Omar's Pie · https://xk5fvhmcht-oss.github.io/pizza-randomizer/");
  navigator.clipboard.writeText(lines.join("\n")).then(()=>showToast("Copied ✓")).catch(()=>showToast("Copy failed"));
});

$("btn-reroll").addEventListener("click", () => {
  state.currentPizza = rollPizza();
  renderPizza(state.currentPizza);
  state.history.unshift({ pizza:state.currentPizza, cuisines:[...state.selectedCuisines], ts:Date.now() });
  saveHistory();
});

$("btn-back-pizza").addEventListener("click",   () => showScreen("sauce"));
$("btn-back-history").addEventListener("click", () => showScreen("setup"));
$("btn-back-library").addEventListener("click", () => { state.libraryFilter = null; showScreen("setup"); });

// ── SESSION BADGE ─────────────────────────────────────────────
function updateSessionBadge() {
  const badge = $("session-badge");
  if (!badge) return;
  const count = state.session.length;
  badge.textContent = count > 0 ? count : "";
  badge.style.display = count > 0 ? "flex" : "none";
}

// ── HISTORY ───────────────────────────────────────────────────
$("btn-history").addEventListener("click", () => { renderHistory(); showScreen("history"); });

function renderHistory() {
  const container = $("history-list");
  container.innerHTML = "";
  if (!state.history.length) { container.innerHTML = `<p class="empty-state">No pies rolled yet.</p>`; return; }
  state.history.slice(0,15).forEach((entry,i) => {
    const cuisineLabels = entry.cuisines.map(id => { const c = CUISINES.find(x=>x.id===id); return c?`${c.emoji} ${c.label}`:id; }).join(" × ") || "Freestyle";
    const summary = LAYER_ORDER.map(layer => { const items = entry.pizza[layer]; if (!items?.length) return null; return `${LAYER_META[layer].emoji} ${items.map(t=>t.name).join(", ")}`; }).filter(Boolean).join(" · ");
    const row = document.createElement("div");
    row.className = "history-entry";
    row.innerHTML = `<div class="history-title">${cuisineLabels}</div><div class="history-summary">${summary}</div><button class="btn-ghost history-reload" data-idx="${i}">Reload this pie</button>`;
    row.querySelector(".history-reload").addEventListener("click", () => {
      state.currentPizza = entry.pizza;
      state.selectedCuisines = [...(entry.cuisines||[])];
      updateCuisineUI();
      renderPizza(state.currentPizza);
      showScreen("pizza");
    });
    container.appendChild(row);
  });
}

// ── LIBRARY ───────────────────────────────────────────────────
$("btn-library").addEventListener("click", () => { state.libraryFilter = null; renderLibrary(); showScreen("library"); });

function renderLibrary() {
  const anchoredCount = state.anchoredItems.size;
  const excludedCount  = state.excludedItems.size;
  const summary = $("library-summary");
  summary.innerHTML = `
    <button class="lib-summary-btn ${state.libraryFilter==="anchored"?"active":""}" data-filter="anchored">📌 ${anchoredCount} Anchored</button>
    <button class="lib-summary-btn ${state.libraryFilter==="excluded"?"active":""}" data-filter="excluded">🚫 ${excludedCount} Excluded</button>
    ${state.libraryFilter ? '<button class="lib-summary-btn lib-clear-filter">← All toppings</button>' : ""}`;
  summary.querySelectorAll(".lib-summary-btn[data-filter]").forEach(btn => {
    btn.addEventListener("click", () => { state.libraryFilter = state.libraryFilter===btn.dataset.filter?null:btn.dataset.filter; renderLibrary(); });
  });
  const clearBtn = summary.querySelector(".lib-clear-filter");
  if (clearBtn) clearBtn.addEventListener("click", () => { state.libraryFilter = null; renderLibrary(); });

  const container = $("library-list");
  container.innerHTML = "";
  let items = TOPPINGS;
  if (state.libraryFilter === "anchored") items = TOPPINGS.filter(t => state.anchoredItems.has(t.id));
  if (state.libraryFilter === "excluded")  items = TOPPINGS.filter(t => state.excludedItems.has(t.id));
  if (!items.length) { container.innerHTML = `<p class="empty-state">${state.libraryFilter==="anchored"?"No anchored items.":"No excluded items."}</p>`; return; }

  LAYER_ORDER.forEach(layer => {
    const layerItems = items.filter(t => t.layer === layer);
    if (!layerItems.length) return;
    const meta = LAYER_META[layer];
    const sec  = document.createElement("div");
    sec.className = "lib-section";
    sec.innerHTML = `<h3 class="lib-layer-title">${meta.emoji} ${meta.label}</h3>`;
    layerItems.forEach(item => {
      const row = document.createElement("div");
      row.className = "lib-row";
      if (state.excludedItems.has(item.id))  row.classList.add("is-excluded");
      if (state.anchoredItems.has(item.id)) row.classList.add("is-anchored");
      const cuisineFlags = item.cuisine.map(id => { const c = CUISINES.find(x=>x.id===id); return c?c.emoji:""; }).join(" ");
      const storeTags = (item.stores||[]).map(s=>`<span class="lib-store" data-store="${s}">${STORES[s]?.short||s}</span>`).join("");
      const jarTag = item.jarred ? `<span class="lib-jar">jarred</span>` : "";
      const homemadeTag = item.homemade ? `<span class="lib-homemade">📋 recipe</span>` : "";

      row.innerHTML = `
        <div class="lib-row-top">
          <span class="lib-name">${item.name}</span>
          <span class="lib-cuisines">${cuisineFlags}</span>
          <span class="lib-profile">${item.profile}</span>
          ${storeTags}${jarTag}${homemadeTag}
        </div>
        ${item.desc ? `<div class="lib-note">${item.desc}</div>` : item.note ? `<div class="lib-note">${item.note}</div>` : ""}
        ${item.homemade && item.recipe ? `
          <button class="recipe-toggle lib-recipe-toggle">Show recipe ▼</button>
          <div class="recipe-section">${renderRecipeInner(item.recipe)}</div>` : ""}
        <div class="lib-actions">
          <button class="lib-btn${state.anchoredItems.has(item.id)?" active":""}" data-action="anchor" data-id="${item.id}">
            ${state.anchoredItems.has(item.id)?"📌 Anchored":"Anchor"}
          </button>
          <button class="lib-btn${state.excludedItems.has(item.id)?" active ban":""}" data-action="exclude" data-id="${item.id}">
            ${state.excludedItems.has(item.id)?"🚫 Excluded":"Exclude"}
          </button>
        </div>`;

      // Recipe toggle in library
      const libToggle = row.querySelector(".lib-recipe-toggle");
      if (libToggle) {
        const recipeSection = row.querySelector(".recipe-section");
        libToggle.addEventListener("click", () => {
          const isOpen = recipeSection.classList.toggle("open");
          libToggle.textContent = isOpen ? "Hide recipe ▲" : "Show recipe ▼";
        });
      }

      row.querySelectorAll(".lib-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const { action, id } = btn.dataset;
          if (action === "anchor") {
            if (state.anchoredItems.has(id)) state.anchoredItems.delete(id);
            else { state.anchoredItems.add(id); state.excludedItems.delete(id); }
            saveAnchored(); saveExcluded();
          } else {
            if (state.excludedItems.has(id)) state.excludedItems.delete(id);
            else { state.excludedItems.add(id); state.anchoredItems.delete(id); }
            saveExcluded(); saveAnchored();
          }
          renderLibrary();
        });
      });
      sec.appendChild(row);
    });
    container.appendChild(sec);
  });
}

function renderRecipeInner(recipe) {
  return `
    <div class="recipe-makes">Makes: ${recipe.makes}</div>
    <div class="recipe-heading">Ingredients</div>
    <ul class="recipe-list">${recipe.ingredients.map(i=>`<li>${i}</li>`).join("")}</ul>
    <div class="recipe-heading">Method</div>
    <ol class="recipe-list recipe-method">${recipe.method.map(m=>`<li>${m}</li>`).join("")}</ol>`;
}

// ── SHOPPING LIST ─────────────────────────────────────────────
$("btn-shopping").addEventListener("click", () => { renderShoppingList(); showScreen("shopping"); });
$("btn-back-shopping").addEventListener("click", () => showScreen("setup"));

function renderShoppingList() { renderSessionCards(); renderCalculatedList(); }

function renderSessionCards() {
  const container = $("session-cards");
  container.innerHTML = "";
  if (!state.session.length) {
    container.innerHTML = `<p class="empty-state">No pizzas added yet — roll a pie and tap "+ List"</p>`;
    $("session-summary").textContent = "";
    $("calculated-list").innerHTML = "";
    return;
  }
  const totalPizzas = state.session.reduce((s,e) => s+e.count, 0);
  const storeSet = optimizeStores();
  $("session-summary").innerHTML = `
    <span>Shopping for <strong>${totalPizzas}</strong> pizza${totalPizzas!==1?"s":""} · ${state.session.length} build${state.session.length!==1?"s":""}</span>
    <span class="store-suggestion">Suggested stops: ${storeSet.map(s=>STORES[s]?.name||s).join(" + ")}</span>`;

  state.session.forEach((entry,idx) => {
    const card = document.createElement("div");
    card.className = "session-card";
    const toppingNames = LAYER_ORDER.flatMap(layer => (entry.pizza[layer]||[]).map(t=>t.name)).join(", ");
    card.innerHTML = `
      <div class="session-card-top">
        <div class="session-name-wrap">
          <span class="session-name">${entry.pizzaName}</span>
          <button class="session-rename" data-idx="${idx}" title="Rename">✏️</button>
        </div>
        <button class="session-remove" data-idx="${idx}" title="Remove">×</button>
      </div>
      <div class="session-toppings">${toppingNames}</div>
      <div class="session-stepper">
        <button class="stepper-btn stepper-minus" data-idx="${idx}">−</button>
        <span class="stepper-count">${entry.count}</span>
        <button class="stepper-btn stepper-plus" data-idx="${idx}">+</button>
      </div>`;

    card.querySelector(".session-rename").addEventListener("click", () => {
      const newName = prompt("Rename this pizza:", entry.pizzaName);
      if (newName!==null && newName.trim()) { state.session[idx].pizzaName=newName.trim(); saveSession(); renderShoppingList(); }
    });
    card.querySelector(".session-remove").addEventListener("click", () => {
      if (confirm(`Remove "${entry.pizzaName}" from the list?`)) { state.session.splice(idx,1); saveSession(); updateSessionBadge(); renderShoppingList(); }
    });
    card.querySelector(".stepper-minus").addEventListener("click", () => {
      if (entry.count<=1) { if (confirm(`Remove "${entry.pizzaName}"?`)) { state.session.splice(idx,1); saveSession(); updateSessionBadge(); renderShoppingList(); } }
      else { state.session[idx].count--; saveSession(); renderShoppingList(); }
    });
    card.querySelector(".stepper-plus").addEventListener("click", () => {
      if (entry.count>=6) { showToast("Max 6 per build"); return; }
      state.session[idx].count++; saveSession(); renderShoppingList();
    });
    container.appendChild(card);
  });

  const clearBtn = document.createElement("button");
  clearBtn.className = "btn-clear-session";
  clearBtn.textContent = "Clear entire list";
  clearBtn.addEventListener("click", () => {
    if (confirm("Clear the entire shopping list?")) { state.session=[]; saveSession(); updateSessionBadge(); renderShoppingList(); }
  });
  container.appendChild(clearBtn);
}

function optimizeStores() {
  const allToppings = [];
  state.session.forEach(entry => {
    LAYER_ORDER.forEach(layer => {
      (entry.pizza[layer]||[]).forEach(t => { if (!allToppings.find(x=>x.id===t.id)) allToppings.push(t); });
    });
  });
  const storeNeeds = {};
  STORE_ORDER.forEach(s => { storeNeeds[s] = new Set(); });
  allToppings.forEach(t => {
    const data = TOPPINGS.find(x=>x.id===t.id);
    if (!data||!data.stores?.length) return;
    data.stores.forEach(s => { if (storeNeeds[s]) storeNeeds[s].add(t.id); });
  });
  const purchasable = allToppings.filter(t => { const data = TOPPINGS.find(x=>x.id===t.id); return data&&data.stores?.length>0&&t.id!=="nosause"; });
  if (!purchasable.length) return [];
  const needed = new Set(purchasable.map(t=>t.id));
  for (const s of STORE_ORDER) { if ([...needed].every(id=>storeNeeds[s].has(id))) return [s]; }
  for (const [a,b] of [["sara","cm"],["sara","altin"],["cm","altin"]]) {
    const combined = new Set([...storeNeeds[a],...storeNeeds[b]]);
    if ([...needed].every(id=>combined.has(id))) return [a,b];
  }
  return STORE_ORDER;
}

function renderCalculatedList() {
  const container = $("calculated-list");
  container.innerHTML = "";
  if (!state.session.length) return;
  const agg = {};
  state.session.forEach(entry => {
    LAYER_ORDER.forEach(layer => {
      (entry.pizza[layer]||[]).forEach(item => {
        const data = TOPPINGS.find(t=>t.id===item.id);
        if (!data||item.id==="nosause") return;
        if (!agg[item.id]) agg[item.id] = { data, total_g:0, total_tsp:0, total_tbsp:0, total_unit_count:0, total_pizzas:0, checked:false };
        const q = data.qty||{};
        const count = entry.count;
        agg[item.id].total_g          += (q.per_pizza_g||0)*count;
        agg[item.id].total_tsp        += (q.per_pizza_tsp||0)*count;
        agg[item.id].total_tbsp       += (q.per_pizza_tbsp||0)*count;
        agg[item.id].total_unit_count += (q.per_pizza_unit||0)*count;
        agg[item.id].total_pizzas     += count;
      });
    });
  });
  Object.values(agg).forEach(a => {
    const q = a.data.qty||{};
    a.total_oz = a.total_g>0 ? parseFloat(gToOz(a.total_g)) : 0;
    a.purchase_units = q.shared_yield ? Math.ceil(a.total_pizzas/q.shared_yield)
                     : q.yield_g&&q.yield_g>0&&a.total_g>0 ? Math.ceil(a.total_g/q.yield_g) : 1;
    a.purchase_units = Math.max(a.purchase_units, q.min_purchase||1);
  });

  const makeAheadItems = Object.values(agg).filter(a=>a.data.make_ahead);
  const pantryItems    = Object.values(agg).filter(a=>!a.data.make_ahead&&a.data.qty?.pantry);
  const freshItems     = Object.values(agg).filter(a=>!a.data.make_ahead&&!a.data.qty?.pantry);

  const byStore = {};
  STORE_ORDER.forEach(s=>{byStore[s]=[];});
  freshItems.forEach(a => {
    const stores = a.data.stores||[];
    if (!stores.length) return;
    if (byStore[stores[0]]) byStore[stores[0]].push(a);
  });

  STORE_ORDER.forEach(storeId => {
    const items = byStore[storeId];
    if (!items.length) return;
    const storeInfo = STORES[storeId];
    const sec = document.createElement("div");
    sec.className = "list-store-section";
    sec.innerHTML = `<h3 class="list-store-heading" data-store="${storeId}">${storeInfo.name}</h3>`;
    LAYER_ORDER.forEach(layer => {
      items.filter(a=>a.data.layer===layer).forEach(a => sec.appendChild(renderListItem(a)));
    });
    container.appendChild(sec);
  });

  if (pantryItems.length) {
    const sec = document.createElement("div");
    sec.className = "list-store-section pantry-section";
    sec.innerHTML = `<h3 class="list-store-heading pantry-heading">🗄️ Pantry — check stock</h3>`;
    pantryItems.forEach(a=>sec.appendChild(renderListItem(a)));
    container.appendChild(sec);
  }
  if (makeAheadItems.length) {
    const sec = document.createElement("div");
    sec.className = "list-store-section make-ahead-section";
    sec.innerHTML = `<h3 class="list-store-heading make-ahead-heading">⏱️ Make Ahead</h3>`;
    makeAheadItems.forEach(a=>sec.appendChild(renderListItem(a)));
    container.appendChild(sec);
  }
}

function renderListItem(a) {
  const row = document.createElement("div");
  row.className = `list-item${a.checked?" checked":""}`;
  const q = a.data.qty||{};
  let qtyStr = "";
  if (a.total_g>0) { qtyStr = `${a.total_g}g / ${a.total_oz}oz · ${a.purchase_units} ${q.unit||""}`; }
  else if (a.total_tsp>0) { qtyStr = `${formatMeasure(a.total_tsp,"tsp")} · pantry`; }
  else if (a.total_tbsp>0) { qtyStr = `${formatMeasure(a.total_tbsp,"tbsp")} · pantry`; }
  else if (a.total_unit_count>0) { qtyStr = `${Math.ceil(a.total_unit_count)} ${q.unit||""}`; }
  else if (q.shared_yield) { qtyStr = `${a.purchase_units} ${q.unit||""}`; }
  else { qtyStr = q.unit||"as needed"; }
  const timingNote = a.data.make_ahead_timing ? `<span class="list-timing">${a.data.make_ahead_timing}</span>` : "";
  const prepNote = a.data.prep===PREP.PRE&&a.data.note ? `<div class="list-item-note">→ ${a.data.note}</div>` : "";
  row.innerHTML = `
    <label class="list-item-label">
      <input type="checkbox" class="list-checkbox" data-id="${a.data.id}"${a.checked?" checked":""}>
      <span class="list-item-content">
        <span class="list-item-name">${a.data.name}${timingNote}</span>
        <span class="list-item-qty">${qtyStr}</span>
      </span>
    </label>
    ${prepNote}`;
  row.querySelector(".list-checkbox").addEventListener("change", e => {
    a.checked = e.target.checked;
    row.classList.toggle("checked", a.checked);
  });
  return row;
}

function formatMeasure(value, unit) {
  const rounded = Math.round(value*4)/4;
  if (rounded===Math.floor(rounded)) return `${rounded} ${unit}`;
  const whole = Math.floor(rounded);
  const frac  = rounded-whole;
  const fracStr = frac===0.25?"¼":frac===0.5?"½":frac===0.75?"¾":frac.toString();
  return whole>0 ? `${whole}${fracStr} ${unit}` : `${fracStr} ${unit}`;
}

$("btn-print").addEventListener("click", () => window.print());

$("btn-copy-list").addEventListener("click", () => {
  if (!state.session.length) return;
  const lines = ["🍕 Omar's Pie — Shopping List", new Date().toLocaleDateString(), "", "SESSION:"];
  state.session.forEach(e => lines.push(`  ${e.pizzaName} × ${e.count}`));
  lines.push("");
  const agg = {};
  state.session.forEach(entry => {
    LAYER_ORDER.forEach(layer => {
      (entry.pizza[layer]||[]).forEach(item => {
        const data = TOPPINGS.find(t=>t.id===item.id);
        if (!data||item.id==="nosause") return;
        if (!agg[item.id]) agg[item.id]={data,total_g:0,total_tsp:0,total_tbsp:0,total_unit_count:0,total_pizzas:0};
        const q=data.qty||{};
        agg[item.id].total_g+=( q.per_pizza_g||0)*entry.count;
        agg[item.id].total_tsp+=(q.per_pizza_tsp||0)*entry.count;
        agg[item.id].total_tbsp+=(q.per_pizza_tbsp||0)*entry.count;
        agg[item.id].total_unit_count+=(q.per_pizza_unit||0)*entry.count;
        agg[item.id].total_pizzas+=entry.count;
      });
    });
  });
  Object.values(agg).forEach(a=>{
    const q=a.data.qty||{};
    a.total_oz=a.total_g>0?parseFloat(gToOz(a.total_g)):0;
    a.purchase_units=q.shared_yield?Math.ceil(a.total_pizzas/q.shared_yield):q.yield_g&&q.yield_g>0&&a.total_g>0?Math.ceil(a.total_g/q.yield_g):1;
    a.purchase_units=Math.max(a.purchase_units,q.min_purchase||1);
  });
  STORE_ORDER.forEach(storeId=>{
    const items=Object.values(agg).filter(a=>!a.data.make_ahead&&!a.data.qty?.pantry&&(a.data.stores||[])[0]===storeId);
    if (!items.length) return;
    lines.push(`${STORES[storeId].name.toUpperCase()}:`);
    items.forEach(a=>{
      const q=a.data.qty||{};
      const qtyStr=a.total_g>0?`${a.total_g}g / ${a.total_oz}oz · ${a.purchase_units} ${q.unit||""}`:a.total_tsp>0?`${formatMeasure(a.total_tsp,"tsp")} (pantry)`:a.total_tbsp>0?`${formatMeasure(a.total_tbsp,"tbsp")} (pantry)`:q.unit||"as needed";
      lines.push(`  ☐ ${a.data.name} — ${qtyStr}`);
      if (a.data.note) lines.push(`      → ${a.data.note}`);
    });
    lines.push("");
  });
  navigator.clipboard.writeText(lines.join("\n")).then(()=>showToast("List copied ✓")).catch(()=>showToast("Copy failed"));
});

// ── SAVED PIZZAS ─────────────────────────────────────────────
$("btn-saved").addEventListener("click", () => { renderSaved(); showScreen("saved"); });
$("btn-back-saved").addEventListener("click", () => showScreen("setup"));

function renderSaved() {
  const container = $("saved-list");
  container.innerHTML = "";
  if (!state.saved.length) { container.innerHTML = `<p class="empty-state">No saved pies yet — roll one and tap Save 🗂️</p>`; return; }
  state.saved.forEach((entry,idx) => {
    const toppingNames = LAYER_ORDER.flatMap(layer=>(entry.pizza[layer]||[]).map(t=>t.name)).join(", ");
    const cuisineFlags = entry.cuisines.map(id=>{const c=CUISINES.find(x=>x.id===id);return c?c.emoji:"";}).join(" ");
    const date = new Date(entry.savedAt).toLocaleDateString();
    const card = document.createElement("div");
    card.className = "saved-card";
    card.innerHTML = `
      <div class="saved-card-top">
        <div class="saved-name-wrap">
          <span class="saved-name">${entry.name}</span>
          <button class="saved-rename" data-idx="${idx}" title="Rename">✏️</button>
        </div>
        <button class="saved-delete" data-idx="${idx}" title="Delete">×</button>
      </div>
      <div class="saved-meta">${cuisineFlags} · Saved ${date}</div>
      <div class="saved-toppings">${toppingNames}</div>
      <div class="saved-actions">
        <button class="btn-ghost saved-add-list" data-idx="${idx}">+ Add to list</button>
        <button class="btn-primary saved-open-builder" data-idx="${idx}">Open in builder</button>
      </div>`;
    card.querySelector(".saved-rename").addEventListener("click",()=>{const n=prompt("Rename:",entry.name);if(n!==null&&n.trim()){state.saved[idx].name=n.trim();saveSaved();renderSaved();}});
    card.querySelector(".saved-delete").addEventListener("click",()=>{if(confirm(`Delete "${entry.name}"?`)){state.saved.splice(idx,1);saveSaved();renderSaved();}});
    card.querySelector(".saved-add-list").addEventListener("click",()=>{
      if(state.session.length>=6){showToast("Session full — max 6 pizzas");return;}
      state.session.push({id:"sess_"+uid(),pizzaName:entry.name,pizza:entry.pizza,count:1,checked:{}});
      saveSession();updateSessionBadge();showToast("Added to shopping list 🛒");
    });
    card.querySelector(".saved-open-builder").addEventListener("click",()=>{
      state.currentPizza=entry.pizza;
      state.selectedCuisines=[...(entry.cuisines||[])];
      state.selectedSauce=entry.pizza.sauce?.[0]||null;
      updateCuisineUI();renderPizza(state.currentPizza);showScreen("pizza");
    });
    container.appendChild(card);
  });
}

// ── THEME ─────────────────────────────────────────────────────
$("btn-theme").addEventListener("click", () => applyTheme(currentTheme==="day"?"night":"day"));

// ── TOAST ────────────────────────────────────────────────────
function showToast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("visible");
  setTimeout(() => t.classList.remove("visible"), 2200);
}

// ── INIT ──────────────────────────────────────────────────────
function init() {
  applyTheme(currentTheme);
  const vl = $("version-label");
  if (vl && typeof APP_VERSION !== "undefined") vl.textContent = `v${APP_VERSION}`;
  initCuisineGrid();
  updateCuisineUI();
  updateSessionBadge();
}

init();
