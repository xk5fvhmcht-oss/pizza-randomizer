// ============================================================
// OMAR'S PIE — app.js
// v1.1.0
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
  selectedCuisines: [],    // max 2
  selectedSauce:    null,  // topping object
  ovenMode:         "dome",
  complexity:       "classic",
  currentPizza:     null,
  pinnedItems: new Set(JSON.parse(localStorage.getItem("op_pinned")  || "[]")),
  bannedItems: new Set(JSON.parse(localStorage.getItem("op_banned")  || "[]")),
  history:           JSON.parse(localStorage.getItem("op_history") || "[]"),
};

const $ = id => document.getElementById(id);

// ── PERSIST ──────────────────────────────────────────────────
function savePinned()  { localStorage.setItem("op_pinned",  JSON.stringify([...state.pinnedItems])); }
function saveBanned()  { localStorage.setItem("op_banned",  JSON.stringify([...state.bannedItems])); }
function saveHistory() { localStorage.setItem("op_history", JSON.stringify(state.history.slice(-20))); }

// ── SCREEN NAV ───────────────────────────────────────────────
function showScreen(name, direction) {
  const all = document.querySelectorAll(".screen");
  all.forEach(s => {
    const isNext = s.id === "screen-" + name;
    s.classList.toggle("active", isNext);
    s.classList.toggle("slide-out", !isNext && s.classList.contains("active"));
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
      // Hard cap — pulse the existing selections as feedback
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

    // Affinity highlight when one cuisine is chosen
    if (sel.length === 1) {
      const isAffinity = CUISINE_AFFINITIES.some(
        pair => pair.includes(sel[0]) && pair.includes(id) && id !== sel[0]
      );
      tile.classList.toggle("affinity", isAffinity && !isSelected);
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

  // Update roll-to-sauce button
  const canProceed = sel.length > 0;
  $("btn-to-sauce").disabled = !canProceed;
  const label = sel.length === 0
    ? "Pick a cuisine to continue"
    : sel.length === 1
      ? `${CUISINES.find(c=>c.id===sel[0]).label} · Choose your sauce`
      : `${CUISINES.find(c=>c.id===sel[0]).label} + ${CUISINES.find(c=>c.id===sel[1]).label} fusion`;
  $("proceed-hint").textContent = label;
}

// Surprise Me — pick from affinity pairs only
$("btn-surprise").addEventListener("click", () => {
  const pick = CUISINE_AFFINITIES[Math.floor(Math.random() * CUISINE_AFFINITIES.length)];
  state.selectedCuisines = [...pick];
  updateCuisineUI();
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

// ── PROCEED TO SAUCE SCREEN ──────────────────────────────────
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

  // Is there a clash? Determine if we should nudge tomato
  const hasClash = cuisines.length === 2 && CUISINE_CLASHES.some(
    pair => pair.includes(cuisines[0]) && pair.includes(cuisines[1])
  );

  const clashBanner = $("sauce-clash-banner");
  clashBanner.style.display = hasClash ? "flex" : "none";

  // Get eligible sauces
  const sauces = TOPPINGS.filter(t =>
    t.layer === "sauce" &&
    profileSet.includes(t.profile) &&
    !state.bannedItems.has(t.id) &&
    (
      // Universal: tomato family always eligible
      t.sauceFamilies.includes("tomato") ||
      // "nosause" always eligible
      t.id === "nosause" ||
      // Otherwise must match cuisine
      (cuisines.length > 0 && t.cuisine.some(c => cuisines.includes(c)))
    )
  );

  sauces.forEach(sauce => {
    const card = document.createElement("button");
    card.className = "sauce-card";
    if (state.selectedSauce?.id === sauce.id) card.classList.add("selected");
    if (hasClash && sauce.sauceFamilies.includes("tomato") && sauce.id !== "nosause") {
      card.classList.add("nudged");
    }

    const familyEmoji = {
      tomato:    "🍅",
      dairy:     "🥛",
      herb:      "🌿",
      spicepaste:"🌶️",
      meatbase:  "🥩",
      nosause:   "🍞",
    };
    const family = sauce.sauceFamilies[0];
    const storeLabel = sauce.store ? STORES[sauce.store]?.name : "";
    const jarBadge = sauce.jarred
      ? `<span class="sauce-badge jar">Jarred · ${sauce.brand || storeLabel}</span>`
      : sauce.store
        ? `<span class="sauce-badge store">${storeLabel}</span>`
        : "";

    card.innerHTML = `
      <div class="sauce-card-top">
        <span class="sauce-family-emoji">${familyEmoji[family] || "🍕"}</span>
        <span class="sauce-name">${sauce.name}</span>
        ${hasClash && sauce.sauceFamilies.includes("tomato") && sauce.id !== "nosause"
          ? '<span class="safe-anchor-tag">safe anchor</span>' : ""}
      </div>
      <p class="sauce-desc">${sauce.note}</p>
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

  $("btn-roll").disabled = state.selectedSauce === null;
}

$("btn-back-sauce").addEventListener("click", () => {
  showScreen("setup");
});

// Surprise sauce
$("btn-surprise-sauce").addEventListener("click", () => {
  const cards = document.querySelectorAll(".sauce-card");
  if (!cards.length) return;
  const r = Math.floor(Math.random() * cards.length);
  cards[r].click();
});

// ── ROLL ──────────────────────────────────────────────────────
$("btn-roll").addEventListener("click", () => {
  state.currentPizza = rollPizza();
  renderPizza(state.currentPizza);
  state.history.unshift({
    pizza: state.currentPizza,
    cuisines: [...state.selectedCuisines],
    sauce: state.selectedSauce?.id,
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

  // Base layer
  const baseCandidates = TOPPINGS.filter(t =>
    t.layer === "base" &&
    !state.bannedItems.has(t.id) &&
    profileSet.includes(t.profile) &&
    (cuisines.length === 0 || t.cuisine.some(c => cuisines.includes(c))) &&
    (sauceFam.length === 0 || t.sauceFamilies.some(f => sauceFam.includes(f)))
  );
  const pinnedBase = baseCandidates.filter(t => state.pinnedItems.has(t.id));
  const freeBase   = baseCandidates.filter(t => !state.pinnedItems.has(t.id));
  // Base is optional — 50% chance if no pins
  pizza.base = pinnedBase.length > 0
    ? [...pinnedBase, ...weightedPick(freeBase, Math.max(0, 1 - pinnedBase.length))]
    : Math.random() < 0.5 ? weightedPick(freeBase, 1) : [];

  // Sauce is already chosen
  pizza.sauce = [sauce];

  // Remaining layers
  const layerConfig = {
    cheese: {
      count: state.complexity === "explorer" && Math.random() < 0.4 ? 2 : 1,
    },
    protein: {
      count: Math.random() < 0.25 ? 0 : 1, // 75% chance of protein
    },
    veg: {
      count: state.complexity === "classic" ? 2
           : state.complexity === "standard" ? 3
           : Math.floor(Math.random() * 2) + 3,
    },
    finish: {
      count: state.complexity === "classic" ? 2
           : state.complexity === "standard" ? 3
           : 4,
    },
  };

  ["cheese","protein","veg","finish"].forEach(layer => {
    const candidates = TOPPINGS.filter(t =>
      t.layer === layer &&
      !state.bannedItems.has(t.id) &&
      profileSet.includes(t.profile) &&
      (cuisines.length === 0 || t.cuisine.some(c => cuisines.includes(c))) &&
      // Sauce affinity weighting — prefer items that match sauce family
      true // filtering done below with weighting
    );

    const pinned   = candidates.filter(t => state.pinnedItems.has(t.id));
    const unpinned = candidates.filter(t => !state.pinnedItems.has(t.id));

    // Split into affinity-matched vs. rest for weighted pick
    const matched  = unpinned.filter(t => t.sauceFamilies.some(f => sauceFam.includes(f)));
    const fallback = unpinned.filter(t => !t.sauceFamilies.some(f => sauceFam.includes(f)));

    const n = layerConfig[layer].count;
    if (n === 0) { pizza[layer] = [...pinned]; return; }

    const needed = Math.max(0, n - pinned.length);
    // 80% of picks from matched, 20% from fallback for variety
    const fromMatched  = Math.min(needed, matched.length > 0 ? Math.ceil(needed * 0.8) : 0);
    const fromFallback = needed - fromMatched;
    pizza[layer] = [
      ...pinned,
      ...weightedPick(matched, fromMatched),
      ...weightedPick(fallback, Math.min(fromFallback, fallback.length)),
    ];
  });

  // Lahmajun special rule: if lahmajun spread chosen as sauce, remove protein
  if (sauce?.id === "lahmajun_spread") {
    pizza.protein = [];
  }

  // Oven-specific protein warnings are handled at render time
  pizza._ovenMode  = state.ovenMode;
  pizza._cuisines  = [...cuisines];
  pizza._complexity = state.complexity;
  pizza._sauceId   = sauce?.id;

  return pizza;
}

function weightedPick(arr, n) {
  if (n <= 0 || arr.length === 0) return [];
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, shuffled.length));
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
    if (!items || items.length === 0) return;

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
      if (state.pinnedItems.has(item.id)) card.classList.add("pinned");

      // Prep badge for proteins
      let prepBadge = "";
      if (item.prep) {
        const badgeClass = item.prep === PREP.RAW   ? "badge-raw"
                         : item.prep === PREP.PRE   ? "badge-pre"
                         : "badge-ready";
        const badgeLabel = item.prep === PREP.RAW   ? "🟡 Raw-on"
                         : item.prep === PREP.PRE   ? "🔴 Pre-cook"
                         : "🟢 Ready";
        prepBadge = `<span class="prep-badge ${badgeClass}">${badgeLabel}</span>`;

        // Extra oven warning
        if (item.prep === PREP.RAW && pizza._ovenMode === "steel" && (item.id === "shrimp" || item.id === "egg")) {
          prepBadge += `<span class="prep-badge badge-warn">⚠️ Check steel note</span>`;
        }
      }

      // Post-bake flag
      const postbakeFlag = item.postbake
        ? `<span class="postbake-tag">Post-bake</span>` : "";

      // Store tag
      const storeTag = item.store
        ? `<span class="store-tag" data-store="${item.store}">${STORES[item.store]?.short || item.store}</span>`
        : "";

      card.innerHTML = `
        <div class="topping-top">
          <span class="topping-name">${item.name}</span>
          <div class="topping-actions">
            <button class="act-btn pin-btn${state.pinnedItems.has(item.id) ? " is-pinned" : ""}"
              data-id="${item.id}" title="${state.pinnedItems.has(item.id) ? "Unpin" : "Pin always"}" aria-label="Pin">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="${state.pinnedItems.has(item.id) ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            </button>
            <button class="act-btn swap-btn" data-id="${item.id}" data-layer="${layer}" title="Swap" aria-label="Swap">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
            </button>
            <button class="act-btn ban-btn" data-id="${item.id}" title="Never show" aria-label="Ban">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
            </button>
          </div>
        </div>
        <div class="topping-meta">
          ${prepBadge}${postbakeFlag}${storeTag}
        </div>
        ${item.note ? `<div class="topping-note">${item.note}</div>` : ""}
      `;

      // Events
      card.querySelector(".pin-btn").addEventListener("click", e => {
        e.stopPropagation();
        const id = e.currentTarget.dataset.id;
        if (state.pinnedItems.has(id)) state.pinnedItems.delete(id);
        else state.pinnedItems.add(id);
        savePinned();
        renderPizza(state.currentPizza);
      });
      card.querySelector(".swap-btn").addEventListener("click", e => {
        e.stopPropagation();
        swapItem(e.currentTarget.dataset.id, e.currentTarget.dataset.layer);
      });
      card.querySelector(".ban-btn").addEventListener("click", e => {
        e.stopPropagation();
        const id = e.currentTarget.dataset.id;
        state.bannedItems.add(id);
        state.currentPizza[layer] = state.currentPizza[layer].filter(t => t.id !== id);
        saveBanned();
        renderPizza(state.currentPizza);
      });

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

function swapItem(oldId, layer) {
  const profileSet = PROFILE_INCLUDES[state.complexity];
  const cuisines   = state.currentPizza._cuisines;
  const sauceFam   = state.selectedSauce?.sauceFamilies || [];

  const candidates = TOPPINGS.filter(t =>
    t.layer === layer &&
    !state.bannedItems.has(t.id) &&
    !state.pinnedItems.has(t.id) &&
    profileSet.includes(t.profile) &&
    (cuisines.length === 0 || t.cuisine.some(c => cuisines.includes(c)))
  );
  const currentIds = state.currentPizza[layer].map(t => t.id);
  const alternatives = candidates.filter(t => !currentIds.includes(t.id));
  if (!alternatives.length) { showToast("Nothing left to swap to"); return; }

  const replacement = alternatives[Math.floor(Math.random() * alternatives.length)];
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
  lines.push("Built with Omar's Pie · https://xk5fvhmcht-oss.github.io/pizza-randomizer/");

  navigator.clipboard.writeText(lines.join("\n"))
    .then(()  => showToast("Copied to clipboard ✓"))
    .catch(()  => showToast("Copy failed"));
});

// ── REROLL ────────────────────────────────────────────────────
$("btn-reroll").addEventListener("click", () => {
  state.currentPizza = rollPizza();
  renderPizza(state.currentPizza);
  state.history.unshift({
    pizza: state.currentPizza,
    cuisines: [...state.selectedCuisines],
    ts: Date.now(),
  });
  saveHistory();
});

// ── BACK BUTTONS ──────────────────────────────────────────────
$("btn-back-pizza").addEventListener("click", () => showScreen("sauce"));
$("btn-back-history").addEventListener("click", () => showScreen("setup"));
$("btn-back-library").addEventListener("click", () => showScreen("setup"));

// ── HISTORY ───────────────────────────────────────────────────
$("btn-history").addEventListener("click", () => {
  renderHistory();
  showScreen("history");
});

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
  renderLibrary();
  showScreen("library");
});

function renderLibrary() {
  const container = $("library-list");
  container.innerHTML = "";
  LAYER_ORDER.forEach(layer => {
    const items = TOPPINGS.filter(t => t.layer === layer);
    const meta  = LAYER_META[layer];
    const sec   = document.createElement("div");
    sec.className = "lib-section";
    sec.innerHTML = `<h3 class="lib-layer-title">${meta.emoji} ${meta.label}</h3>`;

    items.forEach(item => {
      const row = document.createElement("div");
      row.className = "lib-row";
      if (state.bannedItems.has(item.id)) row.classList.add("is-banned");
      if (state.pinnedItems.has(item.id)) row.classList.add("is-pinned");

      const cuisineFlags = item.cuisine.map(id => {
        const c = CUISINES.find(x => x.id === id);
        return c ? c.emoji : "";
      }).join(" ");

      const storeTag = item.store
        ? `<span class="lib-store" data-store="${item.store}">${STORES[item.store]?.short}</span>` : "";
      const jarTag = item.jarred ? `<span class="lib-jar">jarred</span>` : "";

      row.innerHTML = `
        <div class="lib-row-top">
          <span class="lib-name">${item.name}</span>
          <span class="lib-cuisines">${cuisineFlags}</span>
          <span class="lib-profile">${item.profile}</span>
          ${storeTag}${jarTag}
        </div>
        ${item.note ? `<div class="lib-note">${item.note}</div>` : ""}
        <div class="lib-actions">
          <button class="lib-btn${state.pinnedItems.has(item.id) ? " active" : ""}" data-action="pin" data-id="${item.id}">
            ${state.pinnedItems.has(item.id) ? "📌 Pinned" : "Pin"}
          </button>
          <button class="lib-btn${state.bannedItems.has(item.id) ? " active ban" : ""}" data-action="ban" data-id="${item.id}">
            ${state.bannedItems.has(item.id) ? "🚫 Banned" : "Ban"}
          </button>
        </div>`;

      row.querySelectorAll(".lib-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const { action, id } = btn.dataset;
          if (action === "pin") {
            if (state.pinnedItems.has(id)) state.pinnedItems.delete(id);
            else { state.pinnedItems.add(id); state.bannedItems.delete(id); }
            savePinned(); saveBanned();
          } else {
            if (state.bannedItems.has(id)) state.bannedItems.delete(id);
            else { state.bannedItems.add(id); state.pinnedItems.delete(id); }
            saveBanned(); savePinned();
          }
          renderLibrary();
        });
      });
      sec.appendChild(row);
    });
    container.appendChild(sec);
  });
}

// ── THEME TOGGLE ─────────────────────────────────────────────
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

// ── VERSION LABEL ────────────────────────────────────────────
function init() {
  applyTheme(currentTheme);
  const vl = $("version-label");
  if (vl && typeof APP_VERSION !== "undefined") {
    vl.textContent = `v${APP_VERSION}`;
  }
  initCuisineGrid();
  updateCuisineUI();
}

init();
