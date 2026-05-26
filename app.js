// ============================================================
// OMAR'S PIE — app.js v1.2.0
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
  complexity:       "classic",
  currentPizza:     null,
  anchoredItems: new Set(JSON.parse(localStorage.getItem("op_anchored") || "[]")),
  excludedItems:  new Set(JSON.parse(localStorage.getItem("op_excluded")  || "[]")),
  history:        JSON.parse(localStorage.getItem("op_history")  || "[]"),
  libraryFilter:  null, // null | "anchored" | "excluded"
};

const $ = id => document.getElementById(id);

// ── PERSIST ──────────────────────────────────────────────────
function saveAnchored() { localStorage.setItem("op_anchored", JSON.stringify([...state.anchoredItems])); }
function saveExcluded()  { localStorage.setItem("op_excluded",  JSON.stringify([...state.excludedItems]));  }
function saveHistory()   { localStorage.setItem("op_history",   JSON.stringify(state.history.slice(-20))); }

// ── SCREEN NAV ───────────────────────────────────────────────
function showScreen(name) {
  document.querySelectorAll(".screen").forEach(s => {
    s.classList.toggle("active", s.id === "screen-" + name);
  });
  window.scrollTo(0, 0);
}

// ── CUISINE GRID ─────────────────────────────────────────────
function initCuisineGrid() {
  const grid = $("cuisine-grid");
  grid.innerHTML = "";
  CUISINES.forEach(c => {
    const btn = document.createElement("button");
    btn.className = "cuisine-tile";
    btn.dataset.id = c.id;
    btn.setAttribute("aria-pressed", "false");
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
      const isAffinity = CUISINE_AFFINITIES.some(
        pair => pair.includes(sel[0]) && pair.includes(id)
      );
      tile.classList.toggle("affinity", isAffinity);
    } else {
      tile.classList.remove("affinity");
    }
  });

  // Clash detection
  let clashText = "";
  if (sel.length === 2) {
    const isClash = CUISINE_CLASHES.some(
      pair => pair.includes(sel[0]) && pair.includes(sel[1])
    );
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
}

// Surprise Me
$("btn-surprise").addEventListener("click", () => {
  const pick = CUISINE_AFFINITIES[Math.floor(Math.random() * CUISINE_AFFINITIES.length)];
  state.selectedCuisines = [...pick];
  updateCuisineUI();
});

// Reset
$("btn-reset").addEventListener("click", () => {
  state.selectedCuisines = [];
  state.selectedSauce = null;
  state.ovenMode = "dome";
  state.complexity = "classic";
  document.querySelectorAll(".oven-btn").forEach(b => b.classList.toggle("active", b.dataset.oven === "dome"));
  document.querySelectorAll(".complexity-btn").forEach(b => b.classList.toggle("active", b.dataset.complexity === "classic"));
  updateCuisineUI();
  showToast("Selections cleared");
});

// ── OVEN TOGGLE ───────────────────────────────────────────────
document.querySelectorAll(".oven-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".oven-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.ovenMode = btn.dataset.oven;
  });
});

// ── COMPLEXITY TOGGLE ────────────────────────────────────────
document.querySelectorAll(".complexity-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".complexity-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.complexity = btn.dataset.complexity;
  });
});

// ── PROCEED TO SAUCE ─────────────────────────────────────────
$("btn-to-sauce").addEventListener("click", () => {
  buildSauceScreen();
  showScreen("sauce");
});

// ── SAUCE SCREEN ─────────────────────────────────────────────
function buildSauceScreen() {
  const container = $("sauce-grid");
  container.innerHTML = "";
  const profileSet = PROFILE_INCLUDES[state.complexity];
  const cuisines   = state.selectedCuisines;

  const hasClash = cuisines.length === 2 && CUISINE_CLASHES.some(
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

  const familyEmoji = {
    tomato: "🍅", dairy: "🥛", herb: "🌿",
    spicepaste: "🌶️", meatbase: "🥩", nosause: "🍞",
  };

  sauces.forEach(sauce => {
    const card = document.createElement("button");
    card.className = "sauce-card";
    if (state.selectedSauce?.id === sauce.id) card.classList.add("selected");
    if (hasClash && sauce.sauceFamilies.includes("tomato") && sauce.id !== "nosause") {
      card.classList.add("nudged");
    }
    const family = sauce.sauceFamilies[0];
    const jarBadge = sauce.jarred
      ? `<span class="sauce-badge jar">Jarred · ${sauce.brand || ""}</span>` : "";

    card.innerHTML = `
      <div class="sauce-card-top">
        <span class="sauce-family-emoji">${familyEmoji[family] || "🍕"}</span>
        <span class="sauce-name">${sauce.name}</span>
        ${hasClash && sauce.sauceFamilies.includes("tomato") && sauce.id !== "nosause"
          ? '<span class="safe-anchor-tag">safe anchor</span>' : ""}
      </div>
      ${sauce.desc ? `<p class="sauce-desc">${sauce.desc}</p>` : `<p class="sauce-desc">${sauce.note || ""}</p>`}
      ${jarBadge}
    `;
    card.addEventListener("click", () => {
      state.selectedSauce = sauce;
      document.querySelectorAll(".sauce-card").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      $("btn-roll").disabled = false;
    });
    container.appendChild(card);
  });

  $("btn-roll").disabled = !state.selectedSauce ||
    !sauces.find(s => s.id === state.selectedSauce?.id);
}

$("btn-back-sauce").addEventListener("click", () => showScreen("setup"));

$("btn-surprise-sauce").addEventListener("click", () => {
  const cards = document.querySelectorAll(".sauce-card");
  if (!cards.length) return;
  cards[Math.floor(Math.random() * cards.length)].click();
});

// ── ROLL ──────────────────────────────────────────────────────
$("btn-roll").addEventListener("click", () => {
  state.currentPizza = rollPizza();
  renderPizza(state.currentPizza);
  state.history.unshift({
    pizza: state.currentPizza,
    cuisines: [...state.selectedCuisines],
    ts: Date.now(),
  });
  saveHistory();
  showScreen("pizza");
});

// ── RANDOMIZATION ENGINE ─────────────────────────────────────
function rollPizza() {
  const cuisines   = state.selectedCuisines;
  const profileSet = PROFILE_INCLUDES[state.complexity];
  const sauce      = state.selectedSauce;
  const sauceFam   = sauce?.sauceFamilies || [];
  const pizza      = {};

  // Base — optional
  const baseCandidates = TOPPINGS.filter(t =>
    t.layer === "base" &&
    !state.excludedItems.has(t.id) &&
    profileSet.includes(t.profile) &&
    (cuisines.length === 0 || t.cuisine.some(c => cuisines.includes(c))) &&
    t.sauceFamilies.some(f => sauceFam.includes(f))
  );
  const pinnedBase = baseCandidates.filter(t => state.anchoredItems.has(t.id));
  const freeBase   = baseCandidates.filter(t => !state.anchoredItems.has(t.id));
  pizza.base = pinnedBase.length > 0
    ? [...pinnedBase, ...weightedPick(freeBase, Math.max(0, 1 - pinnedBase.length))]
    : Math.random() < 0.45 ? weightedPick(freeBase, 1) : [];

  // Sauce — already chosen
  pizza.sauce = [sauce];

  // Lahmajun special — no cheese, no protein
  const isLahmajun = sauce?.id === "lahmajun_spread";

  const layerConfig = {
    cheese:  { count: isLahmajun ? 0 : (state.complexity === "explorer" && Math.random() < 0.35 ? 2 : 1) },
    protein: { count: isLahmajun ? 0 : (Math.random() < 0.25 ? 0 : 1) },
    veg:     { count: state.complexity === "classic" ? 2 : state.complexity === "standard" ? 3 : Math.floor(Math.random() * 2) + 3 },
    finish:  { count: state.complexity === "classic" ? 2 : state.complexity === "standard" ? 3 : 4 },
  };

  ["cheese","protein","veg","finish"].forEach(layer => {
    const n = layerConfig[layer].count;
    if (n === 0) { pizza[layer] = []; return; }

    const candidates = TOPPINGS.filter(t =>
      t.layer === layer &&
      !state.excludedItems.has(t.id) &&
      profileSet.includes(t.profile) &&
      (cuisines.length === 0 || t.cuisine.some(c => cuisines.includes(c)))
    );

    const anchored = candidates.filter(t => state.anchoredItems.has(t.id));
    const free     = candidates.filter(t => !state.anchoredItems.has(t.id));
    const matched  = free.filter(t => t.sauceFamilies.some(f => sauceFam.includes(f)));
    const fallback = free.filter(t => !t.sauceFamilies.some(f => sauceFam.includes(f)));

    const needed       = Math.max(0, n - anchored.length);
    const fromMatched  = Math.min(needed, matched.length > 0 ? Math.ceil(needed * 0.8) : 0);
    const fromFallback = Math.min(needed - fromMatched, fallback.length);

    pizza[layer] = [
      ...anchored,
      ...weightedPick(matched, fromMatched),
      ...weightedPick(fallback, fromFallback),
    ];
  });

  pizza._ovenMode   = state.ovenMode;
  pizza._cuisines   = [...cuisines];
  pizza._complexity = state.complexity;
  return pizza;
}

function weightedPick(arr, n) {
  if (n <= 0 || !arr.length) return [];
  return [...arr].sort(() => Math.random() - 0.5).slice(0, Math.min(n, arr.length));
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
    header.innerHTML = `
      <span class="layer-emoji">${meta.emoji}</span>
      <span class="layer-label">${meta.label}</span>
      <span class="layer-note">${meta.note}</span>`;
    section.appendChild(header);

    items.forEach(item => {
      const card = document.createElement("div");
      card.className = "topping-card";
      if (state.anchoredItems.has(item.id)) card.classList.add("anchored");

      // Prep badge
      let prepBadge = "";
      if (item.prep) {
        const cls   = item.prep === PREP.RAW ? "badge-raw" : item.prep === PREP.PRE ? "badge-pre" : "badge-ready";
        const label = item.prep === PREP.RAW ? "🟡 Raw-on" : item.prep === PREP.PRE ? "🔴 Pre-cook" : "🟢 Ready";
        prepBadge = `<span class="prep-badge ${cls}">${label}</span>`;
        if (item.prep === PREP.RAW && pizza._ovenMode === "steel" && item.id === "egg") {
          prepBadge += `<span class="prep-badge badge-warn">⚠️ Check steel note</span>`;
        }
      }
      const postbakeFlag = item.postbake ? `<span class="postbake-tag">Post-bake</span>` : "";
      const homemadeFlag = item.homemade ? `<span class="homemade-tag">📋 Recipe</span>` : "";

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
        <div class="topping-meta">
          ${prepBadge}${postbakeFlag}${homemadeFlag}
        </div>
        ${item.desc ? `<div class="topping-desc">${item.desc}</div>` : ""}
        ${item.note ? `<div class="topping-note">${item.note}</div>` : ""}
        ${item.homemade && item.recipe ? renderRecipe(item.recipe) : ""}
      `;

      // Anchor
      card.querySelector(".anchor-btn").addEventListener("click", e => {
        e.stopPropagation();
        const id = e.currentTarget.dataset.id;
        if (state.anchoredItems.has(id)) state.anchoredItems.delete(id);
        else { state.anchoredItems.add(id); state.excludedItems.delete(id); }
        saveAnchored(); saveExcluded();
        renderPizza(state.currentPizza);
      });
      // Swap
      card.querySelector(".swap-btn").addEventListener("click", e => {
        e.stopPropagation();
        swapItem(e.currentTarget.dataset.id, e.currentTarget.dataset.layer);
      });
      // Exclude
      card.querySelector(".exclude-btn").addEventListener("click", e => {
        e.stopPropagation();
        const id = e.currentTarget.dataset.id;
        state.excludedItems.add(id);
        state.currentPizza[layer] = state.currentPizza[layer].filter(t => t.id !== id);
        saveExcluded();
        renderPizza(state.currentPizza);
        showToast("Excluded from future rolls");
      });

      // Recipe expand toggle
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

  // Oven guide
  const ovenSection = document.createElement("div");
  ovenSection.className = "oven-guide";
  ovenSection.innerHTML = `
    <div class="layer-header">
      <span class="layer-emoji">${oven.emoji}</span>
      <span class="layer-label">${oven.label}</span>
      <span class="layer-note">${oven.temp}</span>
    </div>
    <ul class="oven-tips">
      ${oven.tips.map(t => `<li>${t}</li>`).join("")}
    </ul>`;
  container.appendChild(ovenSection);
}

function renderRecipe(recipe) {
  return `
    <button class="recipe-toggle">Show recipe ▼</button>
    <div class="recipe-section">
      <div class="recipe-makes">Makes: ${recipe.makes}</div>
      <div class="recipe-heading">Ingredients</div>
      <ul class="recipe-list">
        ${recipe.ingredients.map(i => `<li>${i}</li>`).join("")}
      </ul>
      <div class="recipe-heading">Method</div>
      <ol class="recipe-list recipe-method">
        ${recipe.method.map(m => `<li>${m}</li>`).join("")}
      </ol>
    </div>
  `;
}

function swapItem(oldId, layer) {
  const profileSet = PROFILE_INCLUDES[state.complexity];
  const cuisines   = state.currentPizza._cuisines;
  const candidates = TOPPINGS.filter(t =>
    t.layer === layer &&
    !state.excludedItems.has(t.id) &&
    !state.anchoredItems.has(t.id) &&
    profileSet.includes(t.profile) &&
    (cuisines.length === 0 || t.cuisine.some(c => cuisines.includes(c)))
  );
  const currentIds = state.currentPizza[layer].map(t => t.id);
  const alts = candidates.filter(t => !currentIds.includes(t.id));
  if (!alts.length) { showToast("Nothing left to swap to"); return; }
  const replacement = alts[Math.floor(Math.random() * alts.length)];
  state.currentPizza[layer] = state.currentPizza[layer].map(t => t.id === oldId ? replacement : t);
  renderPizza(state.currentPizza);
}

// ── COPY ─────────────────────────────────────────────────────
$("btn-copy").addEventListener("click", () => {
  if (!state.currentPizza) return;
  const p = state.currentPizza;
  const oven = OVEN_GUIDANCE[p._ovenMode];
  const cuisineLabels = p._cuisines.map(id => {
    const c = CUISINES.find(x => x.id === id);
    return c ? `${c.emoji} ${c.label}` : id;
  }).join(" × ") || "Freestyle";
  const lines = [`🍕 ${cuisineLabels} — Omar's Pie`, `${oven.emoji} ${oven.label} · ${oven.time}`, ""];
  LAYER_ORDER.forEach(layer => {
    const items = p[layer];
    if (!items?.length) return;
    lines.push(`${LAYER_META[layer].emoji} ${LAYER_META[layer].label}:`);
    items.forEach(t => {
      const prep = t.prep ? ` [${t.prep}]` : "";
      const pb   = t.postbake ? " [post-bake]" : "";
      lines.push(`  • ${t.name}${prep}${pb}${t.note ? " — " + t.note : ""}`);
    });
    lines.push("");
  });
  lines.push("Omar's Pie · https://xk5fvhmcht-oss.github.io/pizza-randomizer/");
  navigator.clipboard.writeText(lines.join("\n"))
    .then(()  => showToast("Copied ✓"))
    .catch(()  => showToast("Copy failed"));
});

// ── REROLL ────────────────────────────────────────────────────
$("btn-reroll").addEventListener("click", () => {
  state.currentPizza = rollPizza();
  renderPizza(state.currentPizza);
  state.history.unshift({ pizza: state.currentPizza, cuisines: [...state.selectedCuisines], ts: Date.now() });
  saveHistory();
});

// ── BACK BUTTONS ──────────────────────────────────────────────
$("btn-back-pizza").addEventListener("click",   () => showScreen("sauce"));
$("btn-back-history").addEventListener("click", () => showScreen("setup"));
$("btn-back-library").addEventListener("click", () => { state.libraryFilter = null; showScreen("setup"); });

// ── HISTORY ───────────────────────────────────────────────────
$("btn-history").addEventListener("click", () => { renderHistory(); showScreen("history"); });

function renderHistory() {
  const container = $("history-list");
  container.innerHTML = "";
  if (!state.history.length) {
    container.innerHTML = `<p class="empty-state">No pies rolled yet.</p>`;
    return;
  }
  state.history.slice(0, 15).forEach((entry, i) => {
    const cuisineLabels = entry.cuisines.map(id => {
      const c = CUISINES.find(x => x.id === id);
      return c ? `${c.emoji} ${c.label}` : id;
    }).join(" × ") || "Freestyle";
    const summary = LAYER_ORDER.map(layer => {
      const items = entry.pizza[layer];
      if (!items?.length) return null;
      return `${LAYER_META[layer].emoji} ${items.map(t => t.name).join(", ")}`;
    }).filter(Boolean).join(" · ");
    const row = document.createElement("div");
    row.className = "history-entry";
    row.innerHTML = `
      <div class="history-title">${cuisineLabels}</div>
      <div class="history-summary">${summary}</div>
      <button class="btn-ghost history-reload" data-idx="${i}">Reload this pie</button>`;
    row.querySelector(".history-reload").addEventListener("click", () => {
      state.currentPizza = entry.pizza;
      state.selectedCuisines = [...(entry.cuisines || [])];
      updateCuisineUI();
      renderPizza(state.currentPizza);
      showScreen("pizza");
    });
    container.appendChild(row);
  });
}

// ── LIBRARY ───────────────────────────────────────────────────
$("btn-library").addEventListener("click", () => {
  state.libraryFilter = null;
  renderLibrary();
  showScreen("library");
});

function renderLibrary() {
  // Summary bar
  const anchoredCount = state.anchoredItems.size;
  const excludedCount  = state.excludedItems.size;
  const summary = $("library-summary");
  summary.innerHTML = `
    <button class="lib-summary-btn ${state.libraryFilter === "anchored" ? "active" : ""}" data-filter="anchored">
      📌 ${anchoredCount} Anchored
    </button>
    <button class="lib-summary-btn ${state.libraryFilter === "excluded" ? "active" : ""}" data-filter="excluded">
      🚫 ${excludedCount} Excluded
    </button>
    ${state.libraryFilter ? '<button class="lib-summary-btn lib-clear-filter">← All toppings</button>' : ""}
  `;
  summary.querySelectorAll(".lib-summary-btn[data-filter]").forEach(btn => {
    btn.addEventListener("click", () => {
      const f = btn.dataset.filter;
      state.libraryFilter = state.libraryFilter === f ? null : f;
      renderLibrary();
    });
  });
  const clearBtn = summary.querySelector(".lib-clear-filter");
  if (clearBtn) clearBtn.addEventListener("click", () => { state.libraryFilter = null; renderLibrary(); });

  // Items
  const container = $("library-list");
  container.innerHTML = "";

  let itemsToShow = TOPPINGS;
  if (state.libraryFilter === "anchored") itemsToShow = TOPPINGS.filter(t => state.anchoredItems.has(t.id));
  if (state.libraryFilter === "excluded")  itemsToShow = TOPPINGS.filter(t => state.excludedItems.has(t.id));

  if (!itemsToShow.length) {
    container.innerHTML = `<p class="empty-state">${state.libraryFilter === "anchored" ? "No anchored items." : "No excluded items."}</p>`;
    return;
  }

  // Group by layer
  LAYER_ORDER.forEach(layer => {
    const items = itemsToShow.filter(t => t.layer === layer);
    if (!items.length) return;
    const meta = LAYER_META[layer];
    const sec  = document.createElement("div");
    sec.className = "lib-section";
    sec.innerHTML = `<h3 class="lib-layer-title">${meta.emoji} ${meta.label}</h3>`;

    items.forEach(item => {
      const row = document.createElement("div");
      row.className = "lib-row";
      if (state.excludedItems.has(item.id))  row.classList.add("is-excluded");
      if (state.anchoredItems.has(item.id)) row.classList.add("is-anchored");

      const cuisineFlags = item.cuisine.map(id => {
        const c = CUISINES.find(x => x.id === id);
        return c ? c.emoji : "";
      }).join(" ");

      const storeTag  = item.store  ? `<span class="lib-store" data-store="${item.store}">${STORES[item.store]?.short}</span>` : "";
      const store2Tag = item.store2 ? `<span class="lib-store" data-store="${item.store2}">${STORES[item.store2]?.short}</span>` : "";
      const jarTag    = item.jarred ? `<span class="lib-jar">jarred</span>` : "";
      const homemadeTag = item.homemade ? `<span class="lib-homemade">📋 recipe</span>` : "";

      row.innerHTML = `
        <div class="lib-row-top">
          <span class="lib-name">${item.name}</span>
          <span class="lib-cuisines">${cuisineFlags}</span>
          <span class="lib-profile">${item.profile}</span>
          ${storeTag}${store2Tag}${jarTag}${homemadeTag}
        </div>
        ${item.desc ? `<div class="lib-note">${item.desc}</div>` : item.note ? `<div class="lib-note">${item.note}</div>` : ""}
        <div class="lib-actions">
          <button class="lib-btn${state.anchoredItems.has(item.id) ? " active" : ""}" data-action="anchor" data-id="${item.id}">
            ${state.anchoredItems.has(item.id) ? "📌 Anchored" : "Anchor"}
          </button>
          <button class="lib-btn${state.excludedItems.has(item.id) ? " active ban" : ""}" data-action="exclude" data-id="${item.id}">
            ${state.excludedItems.has(item.id) ? "🚫 Excluded" : "Exclude"}
          </button>
        </div>`;

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

// ── THEME ─────────────────────────────────────────────────────
$("btn-theme").addEventListener("click", () => {
  applyTheme(currentTheme === "day" ? "night" : "day");
});

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
}

init();
