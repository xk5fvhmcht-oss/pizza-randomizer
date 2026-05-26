// ═══════════════════════════════════════════
// PIZZA RANDOMIZER — APP.JS v1.0.0
// Neapolitan style, biga dough, Gozney Dome + baking steel
// ═══════════════════════════════════════════

// ── STATE ──
const state = {
  selectedCuisines: [],
  ovenMode:         "dome",  // "dome" | "steel"
  complexity:       "classic", // "classic" | "standard" | "explorer"
  currentPizza:     null,
  // Persisted
  pinnedItems:  new Set(JSON.parse(localStorage.getItem("pizza_pinned") || "[]")),
  bannedItems:  new Set(JSON.parse(localStorage.getItem("pizza_banned") || "[]")),
  history:      JSON.parse(localStorage.getItem("pizza_history") || "[]"),
};

const $ = id => document.getElementById(id);

// ── PERSIST ──
function savePinned()  { localStorage.setItem("pizza_pinned",  JSON.stringify([...state.pinnedItems])); }
function saveBanned()  { localStorage.setItem("pizza_banned",  JSON.stringify([...state.bannedItems])); }
function saveHistory() { localStorage.setItem("pizza_history", JSON.stringify(state.history.slice(-20))); }

// ── NAVIGATION ──
const screens = {};
function showScreen(name) {
  document.querySelectorAll(".screen").forEach(s => s.classList.toggle("active", s.id === "screen-" + name));
  window.scrollTo(0, 0);
}

// ── CUISINE GRID ──
function initCuisineGrid() {
  const grid = $("cuisine-grid");
  grid.innerHTML = "";
  CUISINES.forEach(c => {
    const tile = document.createElement("button");
    tile.className = "cuisine-tile";
    tile.dataset.id = c.id;
    tile.innerHTML = `
      <span class="tile-flag">${c.flag}</span>
      <span class="tile-name">${c.label}</span>
      <span class="tile-desc">${c.desc}</span>`;
    tile.addEventListener("click", () => toggleCuisine(c.id));
    grid.appendChild(tile);
  });
}

function toggleCuisine(id) {
  const idx = state.selectedCuisines.indexOf(id);
  if (idx === -1) state.selectedCuisines.push(id);
  else state.selectedCuisines.splice(idx, 1);
  updateCuisineUI();
}

function updateCuisineUI() {
  const selected = state.selectedCuisines;
  document.querySelectorAll(".cuisine-tile").forEach(tile => {
    tile.classList.toggle("selected", selected.includes(tile.dataset.id));
  });

  // Clash detection
  const clashes = [];
  for (let i = 0; i < selected.length; i++) {
    for (let j = i + 1; j < selected.length; j++) {
      const pair = [selected[i], selected[j]];
      if (CUISINE_CLASHES.some(c => c.includes(pair[0]) && c.includes(pair[1]))) {
        const a = CUISINES.find(c => c.id === pair[0]);
        const b = CUISINES.find(c => c.id === pair[1]);
        clashes.push(`${a.label} + ${b.label}`);
      }
    }
  }

  const warn = $("clash-warning");
  if (clashes.length) {
    warn.style.display = "flex";
    $("clash-text").textContent = "Flavor clash: " + clashes.join(", ") + " — will still roll but expect dissonance.";
  } else {
    warn.style.display = "none";
  }

  const canRoll = selected.length > 0;
  $("btn-roll").disabled = !canRoll;
  $("roll-hint").textContent = canRoll
    ? selected.length === 1
      ? CUISINES.find(c => c.id === selected[0]).label + " pizza"
      : selected.length + " cuisines — fusion mode"
    : "Select at least one cuisine";
}

// Surprise Me — pick coherent affinity combo
$("btn-surprise").addEventListener("click", () => {
  const pool = CUISINE_AFFINITIES[Math.floor(Math.random() * CUISINE_AFFINITIES.length)];
  const count = Math.random() < 0.5 ? 1 : 2;
  state.selectedCuisines = pool.slice(0, count);
  updateCuisineUI();
});

// ── OVEN MODE ──
document.querySelectorAll(".oven-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".oven-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.ovenMode = btn.dataset.oven;
  });
});

// ── COMPLEXITY ──
document.querySelectorAll(".complexity-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".complexity-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.complexity = btn.dataset.complexity;
  });
});

// ── RANDOMIZATION ENGINE ──
function pickLayer(layer, cuisines, profileSet) {
  // Get eligible candidates: match cuisine + profile
  let candidates = TOPPINGS.filter(t =>
    t.layer === layer &&
    !state.bannedItems.has(t.id) &&
    profileSet.includes(t.profile) &&
    (cuisines.length === 0 || t.cuisine.some(c => cuisines.includes(c)))
  );

  // Pinned items for this layer — always include
  const pinned = candidates.filter(t => state.pinnedItems.has(t.id));
  const unpinned = candidates.filter(t => !state.pinnedItems.has(t.id));

  return { pinned, unpinned, all: candidates };
}

function weightedPick(items, n) {
  // Shuffle and pick n items (no repeats)
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function rollPizza() {
  const cuisines = state.selectedCuisines;
  const profileSet = PROFILE_INCLUDES[state.complexity];
  const pizza = {};

  LAYER_ORDER.forEach(layer => {
    const { pinned, unpinned } = pickLayer(layer, cuisines, profileSet);

    // How many picks per layer
    const counts = {
      base:    0, // base is optional — roll chance
      sauce:   1,
      cheese:  layer === "cheese" ? (state.complexity === "explorer" ? Math.random() < 0.4 ? 2 : 1 : 1) : 1,
      protein: Math.random() < 0.3 ? 0 : 1, // 70% chance of protein
      veg:     state.complexity === "classic" ? 2 : state.complexity === "standard" ? 3 : Math.floor(Math.random() * 2) + 3,
      finish:  state.complexity === "classic" ? 2 : state.complexity === "standard" ? 3 : 4,
    };

    if (layer === "base") {
      // 50% chance of a base item
      if (Math.random() < 0.5 && unpinned.length > 0) {
        pizza[layer] = [...pinned, ...weightedPick(unpinned, 1)];
      } else {
        pizza[layer] = [...pinned];
      }
    } else {
      const n = counts[layer] || 1;
      const needed = Math.max(0, n - pinned.length);
      pizza[layer] = [...pinned, ...weightedPick(unpinned, needed)];
    }
  });

  // Special post-bake flag pass
  pizza._ovenMode = state.ovenMode;
  pizza._cuisines = cuisines;
  pizza._complexity = state.complexity;

  return pizza;
}

// ── ROLL ──
$("btn-roll").addEventListener("click", () => {
  state.currentPizza = rollPizza();
  renderPizza(state.currentPizza);
  // Save to history
  state.history.unshift({
    pizza: state.currentPizza,
    cuisines: [...state.selectedCuisines],
    ts: Date.now(),
  });
  saveHistory();
  showScreen("pizza");
});

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

// ── RENDER PIZZA ──
function renderPizza(pizza) {
  const container = $("pizza-layers");
  container.innerHTML = "";

  const oven = OVEN_GUIDANCE[pizza._ovenMode];
  const cuisineLabels = pizza._cuisines.map(id => {
    const c = CUISINES.find(x => x.id === id);
    return c ? `${c.flag} ${c.label}` : id;
  }).join(" + ") || "Freestyle";

  $("pizza-title").textContent = cuisineLabels + " Pizza";
  $("pizza-oven-label").textContent = oven.label + " · " + oven.time;

  let hasAnything = false;

  LAYER_ORDER.forEach(layer => {
    const items = pizza[layer];
    if (!items || items.length === 0) return;
    hasAnything = true;

    const meta = LAYER_META[layer];
    const section = document.createElement("div");
    section.className = "layer-section";
    section.dataset.layer = layer;

    section.innerHTML = `
      <div class="layer-header">
        <span class="layer-icon">${meta.icon}</span>
        <span class="layer-label">${meta.label}</span>
        <span class="layer-hint">${meta.note}</span>
      </div>
      <div class="layer-items" id="layer-items-${layer}"></div>
    `;

    const itemsEl = section.querySelector(".layer-items");

    items.forEach(item => {
      const card = document.createElement("div");
      card.className = "topping-card";
      if (state.pinnedItems.has(item.id)) card.classList.add("pinned");

      card.innerHTML = `
        <div class="topping-main">
          <span class="topping-name">${item.name}</span>
          <div class="topping-actions">
            <button class="action-btn pin-btn ${state.pinnedItems.has(item.id) ? "active" : ""}"
              title="${state.pinnedItems.has(item.id) ? "Unpin" : "Pin always"}"
              data-id="${item.id}" aria-label="Pin">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="${state.pinnedItems.has(item.id) ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            </button>
            <button class="action-btn swap-btn" title="Swap this item" data-id="${item.id}" data-layer="${layer}" aria-label="Swap">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
            </button>
            <button class="action-btn ban-btn" title="Never show this" data-id="${item.id}" aria-label="Ban">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
            </button>
          </div>
        </div>
        ${item.note ? `<div class="topping-note">${item.note}</div>` : ""}
      `;

      // Pin action
      card.querySelector(".pin-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        const id = e.currentTarget.dataset.id;
        if (state.pinnedItems.has(id)) state.pinnedItems.delete(id);
        else state.pinnedItems.add(id);
        savePinned();
        renderPizza(state.currentPizza);
      });

      // Swap action — reroll just this slot
      card.querySelector(".swap-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        const id = e.currentTarget.dataset.id;
        const layer = e.currentTarget.dataset.layer;
        swapItem(id, layer);
      });

      // Ban action
      card.querySelector(".ban-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        const id = e.currentTarget.dataset.id;
        state.bannedItems.add(id);
        // Remove from pizza
        state.currentPizza[layer] = state.currentPizza[layer].filter(t => t.id !== id);
        saveBanned();
        renderPizza(state.currentPizza);
      });

      itemsEl.appendChild(card);
    });

    container.appendChild(section);
  });

  // Oven guide section
  const ovenSection = document.createElement("div");
  ovenSection.className = "oven-guide-section";
  ovenSection.innerHTML = `
    <div class="layer-header">
      <span class="layer-icon">🔥</span>
      <span class="layer-label">${oven.label}</span>
      <span class="layer-hint">${oven.temp}</span>
    </div>
    <ul class="oven-tips">
      ${oven.tips.map(t => `<li>${t}</li>`).join("")}
    </ul>
  `;
  container.appendChild(ovenSection);
}

// ── SWAP ITEM ──
function swapItem(oldId, layer) {
  const profileSet = PROFILE_INCLUDES[state.complexity];
  const cuisines = state.currentPizza._cuisines;

  const { unpinned } = pickLayer(layer, cuisines, profileSet);
  const currentIds = state.currentPizza[layer].map(t => t.id);
  const alternatives = unpinned.filter(t => !currentIds.includes(t.id));

  if (alternatives.length === 0) return; // nothing to swap to

  const replacement = alternatives[Math.floor(Math.random() * alternatives.length)];
  state.currentPizza[layer] = state.currentPizza[layer].map(t => t.id === oldId ? replacement : t);
  renderPizza(state.currentPizza);
}

// ── COPY / SHARE ──
$("btn-copy").addEventListener("click", () => {
  if (!state.currentPizza) return;
  const lines = [];
  const cuisineLabels = state.currentPizza._cuisines.map(id => {
    const c = CUISINES.find(x => x.id === id);
    return c ? `${c.flag} ${c.label}` : id;
  }).join(" + ");
  lines.push(`🍕 ${cuisineLabels} Pizza`);
  lines.push(`Oven: ${OVEN_GUIDANCE[state.currentPizza._ovenMode].label} · ${OVEN_GUIDANCE[state.currentPizza._ovenMode].time}`);
  lines.push("");
  LAYER_ORDER.forEach(layer => {
    const items = state.currentPizza[layer];
    if (!items || items.length === 0) return;
    const meta = LAYER_META[layer];
    lines.push(`${meta.icon} ${meta.label}:`);
    items.forEach(t => lines.push(`  • ${t.name}${t.note ? " — " + t.note : ""}`));
  });
  lines.push("\nBuilt with Pizza Randomizer");
  navigator.clipboard.writeText(lines.join("\n"))
    .then(() => showToast("Copied to clipboard"))
    .catch(() => showToast("Copy failed"));
});

// ── TOAST ──
function showToast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("visible");
  setTimeout(() => t.classList.remove("visible"), 2000);
}

// ── HISTORY ──
$("btn-history").addEventListener("click", () => {
  renderHistory();
  showScreen("history");
});

$("btn-back-history").addEventListener("click", () => showScreen("setup"));

function renderHistory() {
  const container = $("history-list");
  container.innerHTML = "";
  if (state.history.length === 0) {
    container.innerHTML = `<p class="empty-state">No pizzas rolled yet.</p>`;
    return;
  }
  state.history.slice(0, 15).forEach((entry, i) => {
    const cuisineLabels = entry.cuisines.map(id => {
      const c = CUISINES.find(x => x.id === id);
      return c ? `${c.flag} ${c.label}` : id;
    }).join(" + ") || "Freestyle";

    const layers = Object.keys(LAYER_META).map(layer => {
      const items = entry.pizza[layer];
      if (!items || items.length === 0) return null;
      return `${LAYER_META[layer].icon} ${items.map(t => t.name).join(", ")}`;
    }).filter(Boolean);

    const row = document.createElement("div");
    row.className = "history-entry";
    row.innerHTML = `
      <div class="history-title">${cuisineLabels}</div>
      <div class="history-layers">${layers.join(" · ")}</div>
      <button class="btn-ghost history-reload" data-idx="${i}">Reload</button>
    `;
    row.querySelector(".history-reload").addEventListener("click", () => {
      state.currentPizza = entry.pizza;
      state.selectedCuisines = [...entry.cuisines];
      updateCuisineUI();
      renderPizza(state.currentPizza);
      showScreen("pizza");
    });
    container.appendChild(row);
  });
}

// ── LIBRARY ──
$("btn-library").addEventListener("click", () => {
  renderLibrary();
  showScreen("library");
});
$("btn-back-library").addEventListener("click", () => showScreen("setup"));

function renderLibrary() {
  const container = $("library-list");
  container.innerHTML = "";

  LAYER_ORDER.forEach(layer => {
    const layerItems = TOPPINGS.filter(t => t.layer === layer);
    const meta = LAYER_META[layer];

    const section = document.createElement("div");
    section.className = "lib-section";
    section.innerHTML = `<h3 class="lib-layer-title">${meta.icon} ${meta.label}</h3>`;

    layerItems.forEach(item => {
      const row = document.createElement("div");
      row.className = "lib-row";
      if (state.bannedItems.has(item.id)) row.classList.add("banned");
      if (state.pinnedItems.has(item.id)) row.classList.add("pinned");

      const cuisineFlags = item.cuisine.map(id => {
        const c = CUISINES.find(x => x.id === id);
        return c ? c.flag : "";
      }).join("");

      row.innerHTML = `
        <div class="lib-row-main">
          <span class="lib-item-name">${item.name}</span>
          <span class="lib-cuisines">${cuisineFlags}</span>
          <span class="lib-profile">${item.profile}</span>
        </div>
        ${item.note ? `<div class="lib-note">${item.note}</div>` : ""}
        <div class="lib-actions">
          <button class="lib-btn ${state.pinnedItems.has(item.id) ? "active" : ""}" data-action="pin" data-id="${item.id}">
            ${state.pinnedItems.has(item.id) ? "📌 Pinned" : "Pin"}
          </button>
          <button class="lib-btn ${state.bannedItems.has(item.id) ? "active ban-active" : ""}" data-action="ban" data-id="${item.id}">
            ${state.bannedItems.has(item.id) ? "🚫 Banned" : "Ban"}
          </button>
        </div>
      `;

      row.querySelectorAll(".lib-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const { action, id } = btn.dataset;
          if (action === "pin") {
            if (state.pinnedItems.has(id)) state.pinnedItems.delete(id);
            else { state.pinnedItems.add(id); state.bannedItems.delete(id); }
            savePinned(); saveBanned();
          } else if (action === "ban") {
            if (state.bannedItems.has(id)) state.bannedItems.delete(id);
            else { state.bannedItems.add(id); state.pinnedItems.delete(id); }
            saveBanned(); savePinned();
          }
          renderLibrary();
        });
      });

      section.appendChild(row);
    });
    container.appendChild(section);
  });
}

// ── BACK BUTTONS ──
$("btn-back-pizza").addEventListener("click", () => showScreen("setup"));

// ── INIT ──
function init() {
  initCuisineGrid();
  updateCuisineUI();
}

init();
