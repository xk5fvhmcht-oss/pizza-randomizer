// ============================================================
// OMAR'S PIE — app.js v2.6.8
// The Classics + clean engine
// ============================================================

// ── THEME ───────────────────────────────────────────────────
const THEME_KEY = "omars_pie_theme";
let currentTheme = localStorage.getItem(THEME_KEY) || "day";

function applyTheme(t) {
  currentTheme = t;
  document.documentElement.setAttribute("data-theme", t);
  localStorage.setItem(THEME_KEY, t);
  const btn = $("btn-theme-menu");
  if (btn) btn.textContent = t === "day" ? "🌙" : "☀️";
}

// ── STATE ────────────────────────────────────────────────────
const state = {
  selectedCuisines: [],
  selectedSauce:    null,
  ovenMode:         "dome",
  complexity:       "traditional",
  currentPizza:     null,
  pizzaIsClassic:   false,   // true when result came from Classics
  classicModified:  false,   // true when a Classic has been swapped/removed
  anchoredItems: new Set(JSON.parse(localStorage.getItem("op_anchored") || "[]")),
  excludedItems:  new Set(JSON.parse(localStorage.getItem("op_excluded")  || "[]")),
  history:        JSON.parse(localStorage.getItem("op_history")  || "[]"),
  session:        JSON.parse(localStorage.getItem("op_session")  || "[]"),
  saved:          JSON.parse(localStorage.getItem("op_saved")    || "[]"),
  libraryFilter:       null,
  swapSequences:       {},    // itemId → { sequence:[], index:0 }
  savedPies:           [],    // persisted saved builds
  libraryCuisineFilters: new Set(), // active cuisine filters in library
};

const $ = id => document.getElementById(id);
function saveAnchored() { localStorage.setItem("op_anchored", JSON.stringify([...state.anchoredItems])); }
function saveExcluded()  { localStorage.setItem("op_excluded",  JSON.stringify([...state.excludedItems])); }
function saveHistory()   { localStorage.setItem("op_history",   JSON.stringify(state.history.slice(0,5))); }
function saveSession()   { localStorage.setItem("op_session",   JSON.stringify(state.session)); }
function saveSaved()     { localStorage.setItem("op_saved",     JSON.stringify(state.saved)); }
function uid()           { return Math.random().toString(36).slice(2,9); }
function gToOz(g)        { return (g/28.35).toFixed(1); }

// ── SCREEN NAV ───────────────────────────────────────────────
function showScreen(name) {
  document.querySelectorAll(".screen").forEach(s => s.classList.toggle("active", s.id==="screen-"+name));
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
    const isPrimary   = sel[0] === id;
    const isSecondary = sel[1] === id;
    const isSelected  = isPrimary || isSecondary;
    // Remove all state classes first
    tile.classList.remove("selected","selected-primary","selected-secondary","affinity-strong","affinity-weak","clash");
    tile.setAttribute("aria-pressed", isSelected?"true":"false");
    if (isPrimary)   tile.classList.add("selected-primary");
    if (isSecondary) tile.classList.add("selected-secondary");
    if (sel.length === 1 && !isSelected) {
      const isStrong = CUISINE_AFFINITIES.some(pair => pair.includes(sel[0]) && pair.includes(id));
      const isWeak   = CUISINE_AFFINITIES_WEAK.some(pair => pair.includes(sel[0]) && pair.includes(id));
      const isClash  = CUISINE_CLASHES.some(pair => pair.includes(sel[0]) && pair.includes(id));
      if (isStrong)     tile.classList.add("affinity-strong");
      else if (isWeak)  tile.classList.add("affinity-weak");
      else if (isClash) tile.classList.add("clash");
      // neutral — no class
    }
  });
  let clashText = "";
  if (sel.length===2) {
    const isClash = CUISINE_CLASHES.some(pair => pair.includes(sel[0]) && pair.includes(sel[1]));
    if (isClash) {
      const a = CUISINES.find(c=>c.id===sel[0]);
      const b = CUISINES.find(c=>c.id===sel[1]);
      clashText = `${a.label} + ${b.label} pull in different directions — tomato sauce is the safest common ground, or explore The Classics for each cuisine separately.`;
    }
  }
  const warn = $("clash-warning");
  warn.style.display = clashText?"flex":"none";
  $("clash-text").textContent = clashText;
  $("btn-to-sauce").disabled = sel.length === 0;
  $("proceed-hint").textContent = sel.length===0
    ? "Pick a cuisine to continue"
    : sel.length===1
      ? `${CUISINES.find(c=>c.id===sel[0]).emoji} ${CUISINES.find(c=>c.id===sel[0]).label} is your primary — add an influence or proceed →`
      : `${CUISINES.find(c=>c.id===sel[0]).emoji} ${CUISINES.find(c=>c.id===sel[0]).label} with ${CUISINES.find(c=>c.id===sel[1]).emoji} ${CUISINES.find(c=>c.id===sel[1]).label} influence`;
  updateSessionBadge();
}

$("btn-surprise").addEventListener("click", () => {
  // Only pick from strong affinities for surprise
  const allAffinities = [...CUISINE_AFFINITIES, ...CUISINE_AFFINITIES_WEAK];
  const pick = allAffinities[Math.floor(Math.random()*allAffinities.length)];
  state.selectedCuisines = [...pick];
  updateCuisineUI();
});

$("btn-reset").addEventListener("click", () => {
  state.selectedCuisines = [];
  state.selectedSauce = null;
  state.ovenMode = "dome";
  state.complexity = "traditional";
  document.querySelectorAll(".oven-btn").forEach(b=>b.classList.toggle("active",b.dataset.oven==="dome"));
  document.querySelectorAll(".complexity-btn").forEach(b=>b.classList.toggle("active",b.dataset.complexity==="traditional"));
  updateCuisineUI();
  showToast("Selections cleared");
});

document.querySelectorAll(".oven-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".oven-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    state.ovenMode = btn.dataset.oven;
  });
});

document.querySelectorAll(".complexity-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".complexity-btn").forEach(b=>b.classList.remove("active"));
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
  const hasClash   = cuisines.length===2 && CUISINE_CLASHES.some(
    pair => pair.includes(cuisines[0]) && pair.includes(cuisines[1])
  );
  $("sauce-clash-banner").style.display = hasClash?"flex":"none";

  const sauces = TOPPINGS.filter(t =>
    t.layer==="sauce" &&
    !state.excludedItems.has(t.id) &&
    (
      (cuisines.length>0 && t.cuisine.some(c=>cuisines.includes(c))) ||
      t.id==="nosause" ||
      (t.sauceFamilies.includes("tomato") && !CUISINE_LOCKED_SAUCES.has(t.id))
    )
  );

  const familyEmoji = {tomato:"🍅",dairy:"🥛",herb:"🌿",spicepaste:"🌶️",nosause:"🍞"};

  sauces.forEach(sauce => {
    const card = document.createElement("button");
    card.className = "sauce-card";
    if (state.selectedSauce?.id===sauce.id) card.classList.add("selected");
    if (hasClash && sauce.sauceFamilies.includes("tomato") && sauce.id!=="nosause") card.classList.add("nudged");
    const family = sauce.sauceFamilies[0];
    const jarBadge = sauce.jarred?`<span class="sauce-badge jar">Jarred · ${sauce.brand||""}</span>`:"";
    card.innerHTML = `
      <div class="sauce-card-top">
        <span class="sauce-family-emoji">${familyEmoji[family]||"🍕"}</span>
        <span class="sauce-name">${sauce.name}</span>
        ${hasClash&&sauce.sauceFamilies.includes("tomato")&&sauce.id!=="nosause"
          ?'<span class="safe-anchor-tag">safe anchor</span>':""}
      </div>
      ${sauce.desc?`<p class="sauce-desc">${sauce.desc}</p>`:`<p class="sauce-desc">${sauce.note||""}</p>`}
      ${jarBadge}`;
    card.addEventListener("click", () => {
      state.selectedSauce = sauce;
      document.querySelectorAll(".sauce-card").forEach(c=>c.classList.remove("selected"));
      card.classList.add("selected");
      $("btn-roll").disabled = false;
    });
    container.appendChild(card);
  });
  $("btn-roll").disabled = !state.selectedSauce || !sauces.find(s=>s.id===state.selectedSauce?.id);
}

$("btn-back-sauce").addEventListener("click", ()=>showScreen("setup"));
$("btn-surprise-sauce").addEventListener("click", () => {
  const cards = document.querySelectorAll(".sauce-card");
  if (cards.length) cards[Math.floor(Math.random()*cards.length)].click();
});

$("btn-roll").addEventListener("click", () => {
  try {
    state.pizzaIsClassic = false;
    state.classicModified = false;
    state.swapSequences = {};  // clear swap state on new roll
    state.currentPizza = rollPizza();
    state.currentPizza._interacted = false;  // track meaningful interaction
    renderPizza(state.currentPizza);
    showScreen("pizza");
  } catch(e) {
    console.error("Roll error:", e.message);
    console.error("Stack:", e.stack);
    console.error("Pizza state:", JSON.stringify({
      sauce: state.selectedSauce?.id,
      cuisines: state.selectedCuisines,
      complexity: state.complexity,
    }));
    showToast("Error: " + (e.message||"unknown").slice(0,80));
  }
});

// ══════════════════════════════════════════════════════════════
// ROLL ENGINE v2.6.8 — Scoring-based, offensive not defensive
// Principles:
//   1. Score candidates by contribution, not just conflict avoidance
//   2. Cheese preference by cuisine + sauce family
//   3. Protein necessity check — skip if build already substantial
//   4. Finish gap-fill — complete the flavor picture
//   5. Range modulates scoring weights
//   6. Feta companion rule (Traditional only)
// ══════════════════════════════════════════════════════════════

function rollPizza() {
  const cuisines      = state.selectedCuisines;
  const profileSet    = PROFILE_INCLUDES[state.complexity];
  const sauce         = state.selectedSauce;
  const sauceFamPrim  = sauce?.sauceFamilies?.[0] || "tomato";
  const buildProf     = SAUCE_BUILD_PROFILES[sauceFamPrim] || SAUCE_BUILD_PROFILES.tomato;
  const isNosause     = sauce?.id === "nosause";
  const isConnoisseur = state.complexity === "connoisseur";
  const isTraditional = state.complexity === "traditional";
  const isElevated    = state.complexity === "elevated";
  const pizza         = {};

  // ── PRIMARY / SECONDARY CUISINE ─────────────────────────────
  // First selected = primary (foundation: sauce, cheese, protein)
  // Second selected = secondary (influence: finish, veg accent)
  const primaryCuisine   = cuisines[0] || null;
  const secondaryCuisine = cuisines[1] || null;

  // ── SCORING WEIGHTS BY RANGE ──────────────────────────────
  const SW = isTraditional ? {
    gapFill: 0.6, sauceAffinity: 0.6,
    presenceBalance: 0.2, redundancy: -0.8, cheesePreference: 1.2,
    // Primary/secondary layer weights
    primaryFoundation: 0.8,   // sauce, cheese, protein
    secondaryFoundation: 0.2,
    primaryFinish: 0.3,       // finish: secondary leads
    secondaryFinish: 0.7,
    primaryVeg: 0.5,          // veg: balanced
    secondaryVeg: 0.4,
  } : isElevated ? {
    gapFill: 0.8, sauceAffinity: 0.4,
    presenceBalance: 0.3, redundancy: -1.0, cheesePreference: 0.8,
    primaryFoundation: 0.7,
    secondaryFoundation: 0.3,
    primaryFinish: 0.3,
    secondaryFinish: 0.6,
    primaryVeg: 0.5,
    secondaryVeg: 0.4,
  } : { // connoisseur
    gapFill: 1.0, sauceAffinity: 0.3,
    presenceBalance: 0.5, redundancy: -1.5, cheesePreference: 0.5,
    primaryFoundation: 0.6,
    secondaryFoundation: 0.4,
    primaryFinish: 0.3,
    secondaryFinish: 0.6,
    primaryVeg: 0.5,
    secondaryVeg: 0.5,
  };

  // ── BUDGET ────────────────────────────────────────────────
  const B = {
    notes:{}, highMoist:0, weight:0, anchors:{}, picked:new Set(), preBake:0
  };

  function wt(w) { return w==="light"?1:w==="medium"?2:w==="heavy"?3:0; }

  function seedBudget(item) {
    if (!item) return;
    (item.flavorNotes||[]).forEach(n=>{B.notes[n]=(B.notes[n]||0)+1;});
    if (item.moisture==="high") B.highMoist++;
    B.weight += wt(item.weight);
  }
  seedBudget(sauce);

  // ── CONFLICT CHECK ────────────────────────────────────────
  function hardConflict(item) {
    if (!item) return true;
    for (const rule of HARD_CONFLICTS) {
      if (rule.sauce&&rule.topping&&sauce?.id===rule.sauce&&item.id===rule.topping) return true;
      if (rule.sauceFamily&&rule.topping&&sauce?.sauceFamilies?.includes(rule.sauceFamily)&&item.id===rule.topping) return true;
      if (rule.topping1&&rule.topping2) {
        if ((item.id===rule.topping1&&B.picked.has(rule.topping2))||
            (item.id===rule.topping2&&B.picked.has(rule.topping1))) return true;
      }
    }
    return false;
  }

  function amplifying(notes) {
    for (const [n1,n2] of AMPLIFYING_PAIRS) {
      const h1=(B.notes[n1]||0)>0, h2=(B.notes[n2]||0)>0;
      const c1=notes.includes(n1), c2=notes.includes(n2);
      if ((h1&&c2)||(h2&&c1)) return true;
      if (c1&&c2&&n1===n2) return true;
    }
    return false;
  }

  // ── HARD BUDGET CHECK ─────────────────────────────────────
  function budgetOk(item, layer) {
    if (!item||hardConflict(item)) return false;
    if (item.moisture==="high"&&!item.postbake&&B.highMoist>=2) return false;
    if (B.weight+wt(item.weight)>9) return false;
    if (item.presence==="anchor"&&(B.anchors[layer]||0)>=1) return false;
    if (isConnoisseur&&["cheese","protein","veg"].includes(layer)&&!item.postbake&&B.preBake>=CONNOISSEUR_RULES.maxPreBakeToppings) return false;
    const notes=item.flavorNotes||[];
    for (const note of notes) {
      if ((B.notes[note]||0)>=2&&!amplifying(notes)) return false;
    }
    return true;
  }

  // ── SCORE A CANDIDATE ────────────────────────────────────
  // Higher = better fit for this build
  // Primary cuisine owns foundation layers (sauce, cheese, protein)
  // Secondary cuisine influences finish layer
  // Veg is balanced between both
  function scoreItem(item, layer) {
    let score = 1.0;
    const notes      = item.flavorNotes||[];
    const itemCuisine = item.cuisine||[];

    // Gap fill — reward adding dimensions not yet in build
    const missingNotes = notes.filter(n=>(B.notes[n]||0)===0);
    score += missingNotes.length * SW.gapFill;

    // Primary / secondary cuisine scoring by layer
    if (primaryCuisine && secondaryCuisine) {
      const inPrimary   = itemCuisine.includes(primaryCuisine);
      const inSecondary = itemCuisine.includes(secondaryCuisine);

      if (["sauce","cheese","protein"].includes(layer)) {
        // Foundation layers — primary cuisine leads
        if (inPrimary)   score += SW.primaryFoundation;
        if (inSecondary) score += SW.secondaryFoundation;
      } else if (layer === "finish") {
        // Finish — secondary cuisine expresses itself
        if (inSecondary) score += SW.secondaryFinish;
        if (inPrimary)   score += SW.primaryFinish;
      } else if (layer === "veg") {
        // Veg — balanced
        if (inPrimary)   score += SW.primaryVeg;
        if (inSecondary) score += SW.secondaryVeg;
      } else if (layer === "base") {
        // Base follows primary
        if (inPrimary) score += SW.primaryFoundation;
      }
    } else if (primaryCuisine) {
      // Single cuisine — standard affinity
      if (itemCuisine.includes(primaryCuisine)) score += 0.5;
    }

    // Sauce affinity — reward items compatible with sauce family
    if ((item.sauceFamilies||[]).includes(sauceFamPrim)) score += SW.sauceAffinity;

    // No-cheese fat compensation — when cheese absent on tomato/spicepaste
    // boost rendering proteins and EVOO finish
    const RENDERING_PROTEINS = new Set(["beef_pepperoni","sujuk","beef_diavola","nduja_homemade","beef_chorizo","lamb_merguez"]);
    const noCheeseYet = (pizza.cheese||[]).length === 0;
    if (noCheeseYet && ["tomato","spicepaste"].includes(sauceFamPrim)) {
      if (layer === "protein" && RENDERING_PROTEINS.has(item.id)) score += 0.8;
      if (layer === "finish" && item.id === "finish_evoo") score += 0.6;
    }

    // Presence balance — reward accents when build already has anchor+supporting
    const hasAnchor  = Object.values(B.anchors).some(v=>v>0);
    const hasSupport = B.picked.size > 1;
    if (item.presence==="accent"&&hasAnchor&&hasSupport) score += SW.presenceBalance;

    // Redundancy penalty
    const redundantNotes = notes.filter(n=>(B.notes[n]||0)>=1&&!amplifying(notes));
    score += redundantNotes.length * SW.redundancy;

    // Cheese preference bonus
    if (layer==="cheese") {
      const cuisinePref = primaryCuisine ? (CHEESE_PREFERENCES[primaryCuisine]||[]) : [];
      const saucePref   = SAUCE_CHEESE_PREFERENCES[sauceFamPrim] || [];
      const cpIdx = cuisinePref.indexOf(item.id);
      const spIdx = saucePref.indexOf(item.id);
      if (cpIdx === 0) score += SW.cheesePreference * 1.0;
      else if (cpIdx > 0) score += SW.cheesePreference * (1 - cpIdx/10);
      if (spIdx === 0) score += SW.cheesePreference * 0.5;
      else if (spIdx > 0) score += SW.cheesePreference * (0.5 - spIdx/20);
    }

    return Math.max(score, 0.1);
  }

  // ── SPEND BUDGET ─────────────────────────────────────────
  function spend(item, layer) {
    if (!item) return;
    (item.flavorNotes||[]).forEach(n=>{B.notes[n]=(B.notes[n]||0)+1;});
    if (item.moisture==="high"&&!item.postbake) B.highMoist++;
    B.weight+=wt(item.weight);
    if (item.presence==="anchor") B.anchors[layer]=(B.anchors[layer]||0)+1;
    B.picked.add(item.id);
    if (["cheese","protein","veg"].includes(layer)&&!item.postbake) B.preBake++;
  }

  // ── GET CANDIDATES ────────────────────────────────────────
  function getCands(layer) {
    return TOPPINGS.filter(t=>
      t.layer===layer&&profileSet.includes(t.profile)&&
      !state.excludedItems.has(t.id)&&
      (cuisines.length===0||t.cuisine.some(c=>cuisines.includes(c)))
    );
  }

  // ── SCORED PICK ───────────────────────────────────────────
  // Pick n items using scoring with weighted randomness
  function pick(candidates, layer, n) {
    if (n<=0||!candidates.length) return [];
    const result=[];
    let pool=[...candidates].filter(t=>budgetOk(t,layer));

    for (let i=0; i<n; i++) {
      if (!pool.length) break;

      // Remove items that duplicate flavor notes of already-picked in this layer
      const eligible=pool.filter(item=>{
        const dup=result.some(p=>{
          const shared=(p.flavorNotes||[]).filter(n=>(item.flavorNotes||[]).includes(n));
          return shared.length>=2&&!amplifying(item.flavorNotes||[]);
        });
        return !dup;
      });
      if (!eligible.length) break;

      // Score all eligible
      const scored=eligible.map(item=>({item,score:scoreItem(item,layer)}));

      // Weighted random selection — best scores win more often but not always
      // Add some randomness to keep rolls surprising
      const totalScore=scored.reduce((s,x)=>s+x.score,0);
      let rand=Math.random()*totalScore;
      let chosen=scored[scored.length-1].item;
      for (const {item,score} of scored) {
        rand-=score;
        if (rand<=0){chosen=item;break;}
      }

      result.push(chosen);
      spend(chosen,layer);
      pool=pool.filter(t=>t.id!==chosen.id&&budgetOk(t,layer));
    }
    return result;
  }

  function pickAnchored(cands, layer) {
    return cands.filter(t=>state.anchoredItems.has(t.id)&&budgetOk(t,layer))
      .map(t=>{spend(t,layer);return t;});
  }

  // ── BASE ──────────────────────────────────────────────────
  const bp=buildProf.base;
  if (Math.random()<bp.prob) {
    const cands=getCands("base").filter(t=>
      t.compatibleSauceFamilies?.includes(sauceFamPrim)||["evoo_base","garlic_oil"].includes(t.id)
    );
    const anchored=pickAnchored(cands,"base");
    pizza.base=anchored.length?anchored:pick(cands.filter(t=>!state.anchoredItems.has(t.id)),"base",1);
  } else {
    pizza.base=pickAnchored(getCands("base"),"base");
  }

  pizza.sauce=[sauce];

  // ── CHEESE ────────────────────────────────────────────────
  const cp=buildProf.cheese;
  if (Math.random()<cp.prob) {
    const target=isConnoisseur?1:cp.count[0]+Math.floor(Math.random()*(cp.count[1]-cp.count[0]+1));
    const cands=getCands("cheese");
    const anchored=pickAnchored(cands,"cheese");
    const picked=pick(cands.filter(t=>!state.anchoredItems.has(t.id)),"cheese",Math.max(0,target-anchored.length));
    pizza.cheese=[...anchored,...picked];

    // Feta companion rule (Traditional only)
    // If feta is the only cheese on a tomato sauce and it's Traditional, add a melt cheese
    if (isTraditional && FETA_NEEDS_COMPANION_SAUCES.has(sauceFamPrim)) {
      const cheeseIds=pizza.cheese.map(c=>c.id);
      const hasFetaOnly=cheeseIds.includes("feta")&&cheeseIds.length===1;
      if (hasFetaOnly) {
        const meltCands=cands.filter(t=>
          MELT_CHEESES.has(t.id)&&!cheeseIds.includes(t.id)&&
          !state.anchoredItems.has(t.id)&&budgetOk(t,"cheese")
        );
        const companion=pick(meltCands,"cheese",1);
        pizza.cheese=[...pizza.cheese,...companion];
      }
    }
  } else {
    pizza.cheese=pickAnchored(getCands("cheese"),"cheese");
  }

  // ── PROTEIN — with necessity check ───────────────────────
  let proteinProb=buildProf.protein.prob;

  // Adjust probability based on build context
  if (B.weight>=6) proteinProb*=0.3;  // already heavy
  if (pizza.cheese.length===0) proteinProb=Math.min(proteinProb+0.3,0.95); // no cheese
  if (sauceFamPrim==="dairy") proteinProb*=0.6; // dairy sauce fills dairy role

  // Umami check — if enough umami-rich veg/cheese already, protein less needed
  const umamiFromPicked=[...B.picked].filter(id=>HIGH_UMAMI.has(id)).length;
  if (umamiFromPicked>=2) proteinProb*=0.4;

  if (Math.random()<proteinProb) {
    const cands=getCands("protein");
    const anchored=pickAnchored(cands,"protein");
    pizza.protein=[...anchored,...pick(cands.filter(t=>!state.anchoredItems.has(t.id)),"protein",Math.max(0,1-anchored.length))];
  } else {
    pizza.protein=pickAnchored(getCands("protein"),"protein");
  }

  // ── VEG ───────────────────────────────────────────────────
  const vp=buildProf.veg;
  if (Math.random()<vp.prob) {
    let target=vp.count[0]+Math.floor(Math.random()*(vp.count[1]-vp.count[0]+1));
    if (isConnoisseur) target=Math.min(target,Math.max(0,CONNOISSEUR_RULES.maxPreBakeToppings-B.preBake));
    const cands=getCands("veg");
    const anchored=pickAnchored(cands,"veg");
    pizza.veg=[...anchored,...pick(cands.filter(t=>!state.anchoredItems.has(t.id)),"veg",Math.max(0,target-anchored.length))];
  } else {
    pizza.veg=pickAnchored(getCands("veg"),"veg");
  }

  // ── FINISH — gap-fill aware ───────────────────────────────
  const fp=buildProf.finish;
  if (Math.random()<fp.prob) {
    let target=fp.count[0]+Math.floor(Math.random()*(fp.count[1]-fp.count[0]+1));
    if (isConnoisseur) target=Math.min(target,CONNOISSEUR_RULES.maxFinishItems);

    // Identify gaps before picking finish
    const gapNotes=[];
    if (!(B.notes.acid||B.notes.fresh)) gapNotes.push("acid","fresh");
    if (!B.notes.herb) gapNotes.push("herb");
    if (!B.notes.crunch&&!isTraditional) gapNotes.push("crunch");
    // Sauce-forward builds: push toward aromatics that amplify sauce
    const isSauceForward = !isNosause &&
      (pizza.cheese||[]).length === 0 &&
      (pizza.protein||[]).length === 0;
    if (isSauceForward) {
      gapNotes.push("herb","fat");  // oregano, EVOO, fresh herbs
    }

    let cands=getCands("finish");
    if (isConnoisseur) cands=addMultiLayerCandidates(cands,pizza);

    // Boost score of gap-filling finish items
    // We do this by temporarily adding a gapBoost to their scoreItem result
    // by pre-spending the gap notes to shift scoring
    const anchored=pickAnchored(cands,"finish");

    // For finish, score with gap awareness
    const finishPool=cands.filter(t=>!state.anchoredItems.has(t.id)&&budgetOk(t,"finish"));
    const scoredFinish=finishPool.map(item=>{
      let s=scoreItem(item,"finish");
      // Extra gap boost for finish layer
      const fillsGap=(item.flavorNotes||[]).some(n=>gapNotes.includes(n));
      if (fillsGap) s+=1.0;
      return {item,score:s};
    });

    // Weighted pick from scored finish
    const finishPicked=[];
    const needed=Math.max(0,target-anchored.length);
    let pool=[...scoredFinish];
    for (let i=0;i<needed;i++) {
      if (!pool.length) break;
      const eligible=pool.filter(({item})=>{
        const dup=finishPicked.some(p=>{
          const shared=(p.flavorNotes||[]).filter(n=>(item.flavorNotes||[]).includes(n));
          return shared.length>=2&&!amplifying(item.flavorNotes||[]);
        });
        return !dup&&budgetOk(item,"finish");
      });
      if (!eligible.length) break;
      const total=eligible.reduce((s,x)=>s+x.score,0);
      let rand=Math.random()*total;
      let chosen=eligible[eligible.length-1].item;
      for (const {item,score} of eligible) {rand-=score;if(rand<=0){chosen=item;break;}}
      finishPicked.push(chosen);
      spend(chosen,"finish");
      pool=pool.filter(({item})=>item.id!==chosen.id);
    }

    pizza.finish=[...anchored,...finishPicked];
  } else {
    pizza.finish=pickAnchored(getCands("finish"),"finish");
  }

  // ── COVERAGE CHECK ───────────────────────────────────────────
  // Nosause + no melt cheese = undercovered dough at Dome temp
  // isNosause declared at top of rollPizza
  const hasMeltCheese = (pizza.cheese||[]).some(c => MELT_CHEESES.has(c?.id));
  const hasProtein = (pizza.protein||[]).length > 0;
  const hasAnyPreBakeCheese = (pizza.cheese||[]).length > 0;

  // Crumble cheeses — don't provide puff suppression
  const CRUMBLE_CHEESES = new Set([
    "feta","shanklish","tulum_peynir","goat_cheese",
    "ricotta_dollop","gorgonzola","gorgonzola_dolce","cotija","parmigiano_primary"
  ]);
  const hasCrumbleOnly = hasAnyPreBakeCheese &&
    !hasMeltCheese &&
    (pizza.cheese||[]).every(c => CRUMBLE_CHEESES.has(c?.id));

  if (isNosause && !hasMeltCheese) {
    // Try to add a melt cheese from available candidates
    const meltCands = getCands("cheese").filter(t =>
      MELT_CHEESES.has(t.id) &&
      !B.picked.has(t.id) &&
      budgetOk(t, "cheese")
    );
    if (meltCands.length) {
      const chosen = meltCands[Math.floor(Math.random() * meltCands.length)];
      pizza.cheese = [...(pizza.cheese||[]), chosen];
      spend(chosen, "cheese");
    }
    // Flag for technique note
    pizza._needsDocking = true;
  }

  // Crumble-only on bianca — still needs docking
  if (isNosause && hasCrumbleOnly) {
    pizza._needsDocking = true;
  }

  // Sauce-forward detection — no cheese AND no protein on a sauced pizza
  if (!isNosause && !hasAnyPreBakeCheese && !hasProtein) {
    pizza._sauceForward = true;
  }

  // ── CONNOISSEUR: ensure C-profile item ────────────────────
  // Scan ALL layers first — don't force a finish swap if C item already exists
  if (isConnoisseur&&CONNOISSEUR_RULES.requireUniqueIngredient) {
    const allPicked=LAYER_ORDER.flatMap(l=>pizza[l]||[]).filter(Boolean);
    if (!allPicked.some(t=>t.profile==="C")) {
      // Try finish first, then veg, then protein
      for (const layer of ["finish","veg","protein"]) {
        const cItems=getCands(layer).filter(t=>t.profile==="C"&&!B.picked.has(t.id));
        if (cItems.length&&(pizza[layer]||[]).length) {
          const ri=(pizza[layer]||[]).map(t=>t&&t.presence).lastIndexOf("accent");
          if (ri>=0) {
            pizza[layer][ri]=cItems[Math.floor(Math.random()*cItems.length)];
            break;
          }
        }
      }
    }
  }

  // ── CHEF'S TOUCH ────────────────────────────────────────────
  // Elevated and Connoisseur only — one optional accent suggestion
  // Wrapped in try/catch to prevent Chef's Touch bugs from breaking roll
  // Picks the finish item that adds the most missing dimension
  // ── CHEF'S TOUCH v2 — RULE-BASED ENGINE ─────────────────
  // Evaluates 37 curated rules against the build in priority order
  // First matching rule wins. No match = no suggestion shown.
  try {
    if (!isTraditional) {
      const allPickedIds = new Set(LAYER_ORDER.flatMap(l=>(pizza[l]||[]).filter(Boolean).map(t=>t.id)));
      const allPickedList = [...allPickedIds];

      // Helper: does the build have any of these ids in this layer?
      const hasAny = (layer, ids) =>
        (pizza[layer]||[]).some(t => t && ids.includes(t.id));

      // Helper: does the build contain this id anywhere?
      const hasPicked = (id) => allPickedIds.has(id);

      // Helper: does the pizza have ANY protein?
      const hasProtein = (pizza.protein||[]).filter(Boolean).length > 0;

      // Helper: does the pizza have ANY pre-bake cheese?
      const hasCheese = (pizza.cheese||[]).filter(Boolean).length > 0;

      // Evaluate rules in order
      let touch = null;
      for (const rule of CHEF_TOUCH_RULES) {
        // Skip if suggestion already in build
        if (hasPicked(rule.suggest)) continue;

        // Skip if suggestion is excluded by baker
        if (state.excludedItems.has(rule.suggest)) continue;

        // Skip if suggestion not in TOPPINGS
        const suggestItem = TOPPINGS.find(t => t.id === rule.suggest);
        if (!suggestItem) continue;

        // Evaluate requires conditions
        const req = rule.requires || {};
        let matches = true;

        // Protein match — build must have one of these proteins
        if (req.protein && !hasAny("protein", req.protein)) { matches = false; }

        // Cheese match — build must have one of these cheeses
        if (matches && req.cheese && !hasAny("cheese", req.cheese)) { matches = false; }

        // Sauce match — build sauce must be one of these
        if (matches && req.sauce) {
          const sauceMatch = req.sauce.includes(sauce?.id);
          if (!sauceMatch) matches = false;
        }

        // Veg match — build must have one of these veg items
        if (matches && req.veg && !hasAny("veg", req.veg)) { matches = false; }

        // Cuisine match — build must include one of these cuisines
        if (matches && req.cuisine) {
          if (!cuisines.some(c => req.cuisine.includes(c))) matches = false;
        }

        // notAlready — none of these should be in the build
        if (matches && req.notAlready) {
          if (req.notAlready.some(id => hasPicked(id))) matches = false;
        }

        // noProtein — build must have NO protein
        if (matches && rule.requires.noProtein === true && hasProtein) { matches = false; }

        // noCheese — build must have NO cheese
        if (matches && rule.requires.noCheese === true && hasCheese) { matches = false; }

        if (matches) {
          touch = { item: suggestItem, reason: rule.reason };
          break; // first match wins
        }
      }

      if (touch) {
        pizza._chefTouch = touch;
      }
    }
  } catch(chefErr) {
    console.warn("Chef's Touch error (non-fatal):", chefErr.message);
  }

  pizza._ovenMode   = state.ovenMode;
  pizza._cuisines   = [...cuisines];
  pizza._complexity = state.complexity;
  return pizza;
}

function addMultiLayerCandidates(cands, pizza) {
  const sauceId=state.selectedSauce?.id;
  const pickedIds=new Set(LAYER_ORDER.flatMap(l=>(pizza[l]||[]).map(t=>t.id)));
  const extra=[];
  if (!pickedIds.has("zaatar_oil")&&sauceId!=="zaatar_spread") {
    const item=TOPPINGS.find(t=>t.id==="zaatar_oil");
    if (item&&!cands.find(c=>c.id==="zaatar_oil"))
      extra.push({...item,note:"Za'atar oil — used here as a finishing drizzle"});
  }
  if (!pickedIds.has("pesto")&&sauceId!=="pesto"&&state.selectedSauce?.sauceFamilies?.includes("nosause")) {
    const item=TOPPINGS.find(t=>t.id==="pesto");
    if (item&&!cands.find(c=>c.id==="pesto"))
      extra.push({...item,note:"Pesto — post-bake finish drizzle on crust edge"});
  }
  return [...cands,...extra];
}

function getCandidates(layer) {
  const profileSet=PROFILE_INCLUDES[state.complexity];
  const cuisines=state.currentPizza?._cuisines||state.selectedCuisines;
  return TOPPINGS.filter(t=>
    t.layer===layer&&profileSet.includes(t.profile)&&
    !state.excludedItems.has(t.id)&&
    (cuisines.length===0||t.cuisine.some(c=>cuisines.includes(c)))
  );
}

// ── HISTORY: save only on meaningful interaction ─────────────
function saveToHistory(pizza) {
  if (!pizza) return;
  if (pizza._historySaved) return;  // prevent duplicates
  pizza._historySaved = true;
  const cuisines = pizza._cuisines || state.selectedCuisines || [];
  state.history.unshift({pizza, cuisines:[...cuisines], ts:Date.now()});
  state.history = state.history.slice(0, 5);  // keep last 5 meaningful only
  saveHistory();
}

// ── RENDER PIZZA ─────────────────────────────────────────────
function renderPizza(pizza) {
  const container=$("pizza-layers");
  container.innerHTML="";
  const oven=OVEN_GUIDANCE[pizza._ovenMode||"dome"];
  const isClassic=state.pizzaIsClassic;

  // Title
  if (isClassic && pizza._classicName) {
    $("pizza-title").textContent = pizza._classicName;
    $("pizza-oven-label").textContent = `${oven.emoji} ${oven.label} · ${oven.time}`;
  } else {
    let titleStr;
    if (pizza._cuisines.length === 2) {
      const p = CUISINES.find(x=>x.id===pizza._cuisines[0]);
      const s = CUISINES.find(x=>x.id===pizza._cuisines[1]);
      titleStr = p && s
        ? `${p.emoji} ${p.label} + ${s.emoji} ${s.label} influence`
        : pizza._cuisines.join(" + ");
    } else {
      const c = CUISINES.find(x=>x.id===pizza._cuisines[0]);
      titleStr = c ? `${c.emoji} ${c.label}` : pizza._cuisines[0] || "Freestyle";
    }
    $("pizza-title").textContent = titleStr;
    $("pizza-oven-label").textContent = `${oven.emoji} ${oven.label} · ${oven.time}`;
  }

  // Modified from original banner (Classics only)
  const modBanner=$("modified-banner");
  if (modBanner) modBanner.style.display=isClassic&&state.classicModified?"flex":"none";

  // Chef note (Classics only)
  const chefNoteEl=$("chef-note-bar");
  if (chefNoteEl) {
    if (isClassic&&pizza._chefNote) {
      chefNoteEl.textContent=pizza._chefNote;
      chefNoteEl.style.display="block";
    } else {
      chefNoteEl.style.display="none";
    }
  }

  // ── CHEF'S TOUCH DISPLAY ─────────────────────────────────────
  const chefsTouchEl = $("chefs-touch");
  if (chefsTouchEl) {
    // Only show if chefTouch exists and hasn't been acted on
    if (!isClassic && pizza._chefTouch && pizza._chefTouch.item) {
      const {item, reason} = pizza._chefTouch;
      $("chefs-touch-name").textContent   = item.name;
      $("chefs-touch-reason").textContent = reason;
      chefsTouchEl.style.display = "block";

      // Clone buttons to strip ALL previous event listeners before rewiring
      // This prevents stale listeners from previous rolls firing
      const oldDismiss = $("chefs-touch-dismiss");
      const oldAdd     = $("chefs-touch-add");
      const newDismiss = oldDismiss.cloneNode(true);
      const newAdd     = oldAdd.cloneNode(true);
      oldDismiss.replaceWith(newDismiss);
      oldAdd.replaceWith(newAdd);

      // Wire fresh listeners to the cloned buttons
      newDismiss.addEventListener("click", () => {
        chefsTouchEl.style.display = "none";
        if (state.currentPizza) state.currentPizza._chefTouch = null;
      });

      newAdd.addEventListener("click", () => {
        if (!state.currentPizza) return;
        state.currentPizza.finish = [...(state.currentPizza.finish||[]), item];
        state.currentPizza._chefTouch = null;
        chefsTouchEl.style.display = "none";
        saveToHistory(state.currentPizza);
        renderPizza(state.currentPizza);
        showToast(`${item.name} added ✓`);
      });
    } else {
      chefsTouchEl.style.display = "none";
    }
  }

  // Coverage / docking notes
  const coverageNote=$("coverage-note");
  if (coverageNote) {
    if (pizza._needsDocking) {
      coverageNote.textContent="🔥 Bianca build — dock the dough firmly before dressing. Without a full melt cheese layer, undocked dough at Dome temperature will puff dramatically.";
      coverageNote.style.display="block";
      coverageNote.className="coverage-note coverage-warn";
    } else if (pizza._sauceForward) {
      coverageNote.textContent="🍅 Sauce-forward build — apply sauce generously, wall to wall. The sauce is carrying the pizza. You will need more than the standard quantity shown in the shopping list.";
      coverageNote.style.display="block";
      coverageNote.className="coverage-note coverage-info";
    } else {
      coverageNote.style.display="none";
    }
  }

  LAYER_ORDER.forEach(layer=>{
    const items=pizza[layer];
    if (!items?.length) return;
    const meta=LAYER_META[layer];
    const section=document.createElement("div");
    section.className="layer-section";
    const header=document.createElement("div");
    header.className="layer-header";
    header.innerHTML=`<span class="layer-emoji">${meta.emoji}</span><span class="layer-label">${meta.label}</span><span class="layer-note">${meta.note}</span>`;
    section.appendChild(header);

    items.forEach(item=>{
      if (!item) return;
      const card=document.createElement("div");
      card.className="topping-card";
      if (!isClassic&&state.anchoredItems.has(item.id)) card.classList.add("anchored");

      let prepBadge="";
      if (item.prep) {
        const cls=item.prep===PREP.RAW?"badge-raw":item.prep===PREP.PRE?"badge-pre":"badge-ready";
        const label=item.prep===PREP.RAW?"🟡 Raw-on":item.prep===PREP.PRE?"🔴 Pre-cook":"🟢 Ready";
        prepBadge=`<span class="prep-badge ${cls}">${label}</span>`;
        if (item.prep===PREP.RAW&&pizza._ovenMode==="steel"&&item.id==="egg")
          prepBadge+=`<span class="prep-badge badge-warn">⚠️ Add at 3-min mark</span>`;
      }

      const roleColors={anchor:"role-anchor",supporting:"role-supporting",accent:"role-accent"};
      const roleBadge=(!isClassic&&pizza._complexity==="connoisseur"&&item.presence)
        ?`<span class="role-badge ${roleColors[item.presence]||""}">${item.presence}</span>`:"";
      const postbakeFlag=item.postbake?`<span class="postbake-tag">Post-bake</span>`:"";
      const homemadeFlag=item.homemade?`<span class="homemade-tag">📋 Recipe</span>`:"";
      const makeAheadFlag=item.make_ahead?`<span class="make-ahead-tag">⏱️ ${item.make_ahead_timing||"Make ahead"}</span>`:"";
      const domeFlag=item.domeOnly?`<span class="dome-tag">🔥 Dome technique</span>`:"";

      // Classic cards: swap + remove only. Builder cards: anchor + swap + exclude
      const actions = isClassic ? `
        <button class="act-btn swap-btn" data-id="${item.id}" data-layer="${layer}" aria-label="Swap">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
        </button>
        ${item._swapPosition?`<span class="swap-counter${item._swapIsOrig?" is-orig":""}">${item._swapIsOrig?"orig":item._swapPosition+"/"+item._swapTotal}</span>`:""}
        <button class="act-btn remove-btn" data-id="${item.id}" data-layer="${layer}" aria-label="Remove">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      ` : `
        <button class="act-btn anchor-btn${state.anchoredItems.has(item.id)?" is-anchored":""}" data-id="${item.id}" aria-label="Anchor">⚓</button>
        <button class="act-btn swap-btn" data-id="${item.id}" data-layer="${layer}" aria-label="Swap">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
        </button>
        ${item._swapPosition?`<span class="swap-counter${item._swapIsOrig?" is-orig":""}">${item._swapIsOrig?"orig":item._swapPosition+"/"+item._swapTotal}</span>`:""}
        <button class="act-btn exclude-btn" data-id="${item.id}" aria-label="Exclude">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
        </button>
      `;

      card.innerHTML=`
        <div class="topping-top">
          <span class="topping-name">${item.name}</span>
          <div class="topping-actions">${actions}</div>
        </div>
        <div class="topping-meta">${roleBadge}${prepBadge}${postbakeFlag}${homemadeFlag}${makeAheadFlag}${domeFlag}</div>
        ${item.desc?`<div class="topping-desc">${item.desc}</div>`:""}
        ${item.note?`<div class="topping-note">${item.note}</div>`:""}
        ${item.homemade&&item.recipe?renderRecipe(item.recipe):""}
      `;

      // Anchor (builder only)
      const anchorBtn=card.querySelector(".anchor-btn");
      if (anchorBtn) {
        anchorBtn.addEventListener("click",e=>{
          e.stopPropagation();
          const id=e.currentTarget.dataset.id;
          if (state.anchoredItems.has(id)) state.anchoredItems.delete(id);
          else {state.anchoredItems.add(id);state.excludedItems.delete(id);}
          saveAnchored();saveExcluded();
          renderPizza(state.currentPizza);
        });
      }

      // Swap
      const swapBtn=card.querySelector(".swap-btn");
      if (swapBtn) {
        swapBtn.addEventListener("click",e=>{
          e.stopPropagation();
          swapItem(e.currentTarget.dataset.id,e.currentTarget.dataset.layer);
          if (isClassic) state.classicModified=true;
        });
      }

      // Exclude (builder only)
      const excludeBtn=card.querySelector(".exclude-btn");
      if (excludeBtn) {
        excludeBtn.addEventListener("click",e=>{
          e.stopPropagation();
          const id=e.currentTarget.dataset.id;
          state.excludedItems.add(id);
          state.currentPizza[layer]=state.currentPizza[layer].filter(t=>t.id!==id);
          saveExcluded();
          renderPizza(state.currentPizza);
          showToast("Excluded from future rolls");
        });
      }

      // Remove (Classics only)
      const removeBtn=card.querySelector(".remove-btn");
      if (removeBtn) {
        removeBtn.addEventListener("click",e=>{
          e.stopPropagation();
          const id=e.currentTarget.dataset.id;
          state.currentPizza[layer]=state.currentPizza[layer].filter(t=>t.id!==id);
          state.classicModified=true;
          renderPizza(state.currentPizza);
        });
      }

      // Recipe toggle
      if (item.homemade&&item.recipe) {
        const toggle=card.querySelector(".recipe-toggle");
        const sec=card.querySelector(".recipe-section");
        if (toggle&&sec) {
          toggle.addEventListener("click",e=>{
            e.stopPropagation();
            const open=sec.classList.toggle("open");
            toggle.textContent=open?"Hide recipe ▲":"Show recipe ▼";
          });
        }
      }
      section.appendChild(card);
    });
    container.appendChild(section);
  });

  // Oven guide
  const ovenSec=document.createElement("div");
  ovenSec.className="oven-guide";
  ovenSec.innerHTML=`
    <div class="layer-header">
      <span class="layer-emoji">${oven.emoji}</span>
      <span class="layer-label">${oven.label}</span>
      <span class="layer-note">${oven.temp}</span>
    </div>
    <ul class="oven-tips">${oven.tips.map(t=>`<li>${t}</li>`).join("")}</ul>`;
  container.appendChild(ovenSec);

  // Bottom bar
  const bar=$("pizza-bar-inner");
  if (bar) {
    if (isClassic) {
      bar.innerHTML=`
        <button class="btn-ghost" id="btn-back-pizza-classic">← Classics</button>
        <button class="btn-ghost" id="btn-save-pie">Save 🗂️</button>
        <button class="btn-ghost" id="btn-add-to-list">+ List 🛒</button>`;
      $("btn-back-pizza-classic")?.addEventListener("click",()=>{ renderClassics(); showScreen("classics"); restoreScroll("classics"); });
    } else {
      bar.innerHTML=`
        <button class="btn-ghost" id="btn-back-pizza-sauce">← Sauce</button>
        <button class="btn-ghost" id="btn-save-pie">Save 🗂️</button>
        <button class="btn-ghost" id="btn-add-to-list">+ List 🛒</button>
        <button class="btn-primary" id="btn-reroll">Re-top 🎲</button>`;
      $("btn-back-pizza-sauce")?.addEventListener("click",()=>showScreen("sauce"));
      $("btn-reroll")?.addEventListener("click",()=>{
        try {
          state.currentPizza=rollPizza();
          renderPizza(state.currentPizza);
          state.swapSequences = {};
          state.currentPizza._interacted = false;
        } catch(e) { showToast("Re-top failed — try again"); }
      });
    }
    // Wire save and add-to-list (shared)
    wirePizzaActions();
  }
}

function wirePizzaActions() {
  $("btn-save-pie")?.addEventListener("click",()=>{
    if (!state.currentPizza) return;
    saveToHistory(state.currentPizza);  // meaningful interaction
    const def = state.currentPizza._classicName ||
      state.currentPizza._cuisines.map(id=>{const c=CUISINES.find(x=>x.id===id);return c?`${c.emoji} ${c.label}`:id;}).join(" + ") || "My Pie";
    const name=prompt("Name this pie:",def);
    if (name===null) return;
    state.saved.unshift({id:"saved_"+uid(),name:name.trim()||def,cuisines:[...(state.currentPizza._cuisines||[])],pizza:state.currentPizza,savedAt:Date.now()});
    saveSaved();
    showToast("Pie saved 🗂️");
  });
  $("btn-add-to-list")?.addEventListener("click",()=>{
    if (!state.currentPizza) return;
    if (state.session.length>=6){showToast("Session full — max 6 pizzas");return;}
    saveToHistory(state.currentPizza);  // meaningful interaction
    const name=state.currentPizza._classicName||
      state.currentPizza._cuisines.map(id=>{const c=CUISINES.find(x=>x.id===id);return c?`${c.emoji} ${c.label}`:id;}).join(" + ")||"My Pie";
    state.session.push({id:"sess_"+uid(),pizzaName:name,pizza:state.currentPizza,count:1,checked:{}});
    saveSession();updateSessionBadge();
    showToast("Added to shopping list 🛒");
  });
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

// ── SWAP SIMILARITY SCORING ──────────────────────────────────
function swapSimilarityScore(original, candidate) {
  let score = 0;
  const origNotes  = original.flavorNotes||[];
  const candNotes  = candidate.flavorNotes||[];
  const buildCuisines = state.currentPizza?._cuisines || [];

  // Tier 1 — flavor note overlap (most important — same taste profile)
  const sharedNotes = origNotes.filter(n=>candNotes.includes(n));
  score += sharedNotes.length * 3;

  // Tier 1 — same presence level (anchor→anchor, accent→accent)
  if (original.presence === candidate.presence) score += 2;

  // Tier 2 — cuisine: bonus if candidate shares cuisine with the BUILD
  // not just with the original item — ensures culturally coherent swap
  const origCuisine = original.cuisine||[];
  const candCuisine = candidate.cuisine||[];
  const sharedWithBuild = buildCuisines.filter(c=>candCuisine.includes(c));
  const sharedWithOrig  = origCuisine.filter(c=>candCuisine.includes(c));
  score += sharedWithBuild.length * 2;   // build affinity most important
  score += sharedWithOrig.length  * 1;   // original affinity secondary

  // Tier 2 — same sauce family compatibility
  const origSauce = original.sauceFamilies||[];
  const candSauce = candidate.sauceFamilies||[];
  const sharedSauce = origSauce.filter(s=>candSauce.includes(s));
  score += sharedSauce.length * 1;

  // Tier 3 — same weight class
  if (original.weight === candidate.weight) score += 0.5;

  // Tier 3 — same profile (T with T, E with E)
  if (original.profile === candidate.profile) score += 0.8;

  // Tier 3 — same moisture class
  if (original.moisture === candidate.moisture) score += 0.3;

  return score;
}

function buildSwapSequence(oldId, layer) {
  const profileSet = PROFILE_INCLUDES[state.complexity]||["T","E","C"];
  const cuisines   = state.currentPizza._cuisines||[];
  const original   = TOPPINGS.find(t=>t.id===oldId);
  if (!original) return [];

  const currentIds = state.currentPizza[layer].map(t=>t?.id);
  const cands = TOPPINGS.filter(t=>
    t.layer===layer &&
    profileSet.includes(t.profile) &&
    !state.excludedItems.has(t.id) &&
    !state.anchoredItems.has(t.id) &&
    !currentIds.includes(t.id) &&
    (cuisines.length===0||t.cuisine.some(c=>cuisines.includes(c)))
  );

  if (!cands.length) return [original]; // only option is original

  // Score all candidates by similarity to original
  const scored = cands.map(t=>({t, score:swapSimilarityScore(original,t)}));

  // Sort by score descending — similar first
  scored.sort((a,b)=>b.score-a.score);

  // Prepend original as position 0 — baker can always return to engine's first pick
  return [original, ...scored.map(x=>x.t)];
}

function swapItem(oldId, layer) {
  const seqKey = `${oldId}:${layer}`;

  // Build sequence if not exists or exhausted
  if (!state.swapSequences[seqKey]) {
    const seq = buildSwapSequence(oldId, layer);
    if (!seq.length) { showToast("Nothing left to swap to"); return; }
    state.swapSequences[seqKey] = { sequence: seq, index: 0, total: seq.length };
  }

  const swapState   = state.swapSequences[seqKey];
  const total       = swapState.total;
  const idx         = swapState.index;
  const replacement = swapState.sequence[idx];
  const position    = idx + 1;
  const isOriginal  = idx === 0;

  // Advance index — wrap around for repeat cycle
  swapState.index = (idx + 1) % total;

  // Store counter info on the replacement for the card to display
  // Position 1 = original engine recommendation
  replacement._swapPosition = position;
  replacement._swapTotal    = total;
  replacement._swapIsOrig   = isOriginal;

  // Transfer sequence to new key (replacement id) so next tap continues
  state.swapSequences[`${replacement.id}:${layer}`] = {
    sequence: swapState.sequence,
    index:    swapState.index,
    total:    total,
  };

  // Apply replacement
  state.currentPizza[layer] = state.currentPizza[layer].map(t=>t?.id===oldId?replacement:t);

  // Swap = meaningful interaction — save to history
  if (!state.currentPizza._historySaved) {
    saveToHistory(state.currentPizza);
  }

  renderPizza(state.currentPizza);
}

// ── COPY ──────────────────────────────────────────────────────
$("btn-copy")?.addEventListener("click",()=>{
  if (!state.currentPizza) return;
  const p=state.currentPizza,oven=OVEN_GUIDANCE[p._ovenMode||"dome"];
  const cl=p._classicName||(p._cuisines||[]).map(id=>{const c=CUISINES.find(x=>x.id===id);return c?`${c.emoji} ${c.label}`:id;}).join(" × ")||"Freestyle";
  const lines=[`🍕 ${cl} — Omar's Pie`,`${oven.emoji} ${oven.label} · ${oven.time}`,""];
  LAYER_ORDER.forEach(layer=>{
    const items=p[layer];if (!items?.length) return;
    lines.push(`${LAYER_META[layer].emoji} ${LAYER_META[layer].label}:`);
    items.forEach(t=>{if(t)lines.push(`  • ${t.name}${t.prep?` [${t.prep}]`:""}${t.postbake?" [post-bake]":""}${t.note?" — "+t.note:""}`);});
    lines.push("");
  });
  lines.push("Omar's Pie · https://xk5fvhmcht-oss.github.io/pizza-randomizer/");
  navigator.clipboard.writeText(lines.join("\n")).then(()=>showToast("Copied ✓")).catch(()=>showToast("Copy failed"));
});

$("btn-back-history").addEventListener("click",()=>showScreen("setup"));
$("btn-back-pizza").addEventListener("click",()=>{
  if (state.pizzaIsClassic) {
    renderClassics();
    showScreen("classics");
    restoreScroll("classics");
  } else {
    showScreen("sauce");
  }
});
$("btn-back-library").addEventListener("click",()=>{
  saveScroll("library");
  state.libraryFilter=null;
  showScreen("setup");
});

// ── SESSION BADGE ─────────────────────────────────────────────
function updateSessionBadge() {
  const count = state.session.length;
  // Main badge
  const badge = $("session-badge");
  if (badge) { badge.textContent=count>0?count:""; badge.style.display=count>0?"flex":"none"; }
  // All sub-nav badges across all screens
  document.querySelectorAll(".sub-nav-badge").forEach(b => {
    b.textContent = count>0?count:"";
    b.style.display = count>0?"flex":"none";
  });
}

// ── HISTORY ───────────────────────────────────────────────────
function renderHistory() {
  const container=$("history-list");container.innerHTML="";
  if (!state.history.length){container.innerHTML=`<p class="empty-state">No pies rolled yet.</p>`;return;}
  state.history.slice(0,5).forEach((entry,i)=>{
    const cl=entry.cuisines.map(id=>{const c=CUISINES.find(x=>x.id===id);return c?`${c.emoji} ${c.label}`:id;}).join(" × ")||"Freestyle";
    const summary=LAYER_ORDER.map(layer=>{const items=entry.pizza[layer];if(!items?.length)return null;return`${LAYER_META[layer].emoji} ${items.filter(Boolean).map(t=>t.name).join(", ")}`;}).filter(Boolean).join(" · ");
    const row=document.createElement("div");row.className="history-entry";
    row.innerHTML=`<div class="history-title">${entry.pizza._classicName||cl}</div><div class="history-summary">${summary}</div><button class="btn-ghost history-reload">Reload this pie</button>`;
    row.querySelector(".history-reload").addEventListener("click",()=>{
      state.currentPizza=entry.pizza;state.selectedCuisines=[...(entry.cuisines||[])];
      state.pizzaIsClassic=!!entry.pizza._classicName;state.classicModified=false;
      updateCuisineUI();renderPizza(state.currentPizza);showScreen("pizza");
    });
    container.appendChild(row);
  });
}

// ── LIBRARY ───────────────────────────────────────────────────
// ── SCROLL MEMORY ─────────────────────────────────────────
const scrollMemory = { classics:0, library:0 };
function saveScroll(screen) {
  const el = document.querySelector(`#screen-${screen} .sub-main`);
  if (el) scrollMemory[screen] = el.scrollTop;
}
function restoreScroll(screen) {
  const el = document.querySelector(`#screen-${screen} .sub-main`);
  if (el) requestAnimationFrame(()=>requestAnimationFrame(()=>{ el.scrollTop = scrollMemory[screen]||0; }));
}

// btn-library moved to header menu — see initHeaderMenu()


// ── LIBRARY STATE ─────────────────────────────────────────
if (!state.libraryCuisineFilters) state.libraryCuisineFilters = new Set();
if (!state.librarySectionState)   state.librarySectionState   = {};

function renderRecipeInner(recipe) {
  if (!recipe) return "";

  // Build yield badge if we have yield data
  let yieldBadge = "";
  if (recipe.yields) {
    const y = recipe.yields;
    yieldBadge = `
      <div class="recipe-yield-row">
        <span class="recipe-yield-badge">Full batch: ${y.full_g}g · ~${y.pizzas_full} pizzas</span>
        <span class="recipe-yield-badge recipe-yield-half">Half batch: ${y.half_g}g · ~${y.pizzas_half} pizzas</span>
        <span class="recipe-yield-badge recipe-yield-per">30g per pizza</span>
      </div>`;
  }

  return `<div class="recipe-makes">${recipe.makes||""}</div>
    ${yieldBadge}
    <div class="recipe-heading">Ingredients</div>
    <ul class="recipe-list">${(recipe.ingredients||[]).map(i=>`<li>${i}</li>`).join("")}</ul>
    <div class="recipe-heading">Method</div>
    <ol class="recipe-list recipe-method">${(recipe.method||[]).map(m=>`<li>${m}</li>`).join("")}</ol>`;
}

function renderLibrary() {
  const filters   = state.libraryCuisineFilters || new Set();
  const anyFilter = filters.size > 0;

  // ── CUISINE FILTER CHIPS ─────────────────────────────────
  const filterRow = $("library-filter-row");
  filterRow.innerHTML = "";
  CUISINES.forEach(c => {
    const chip = document.createElement("button");
    chip.className = "cuisine-chip" + (filters.has(c.id) ? " active" : "");
    chip.dataset.id = c.id;
    chip.setAttribute("aria-label", c.label);
    chip.textContent = c.emoji;
    chip.addEventListener("click", () => {
      if (filters.has(c.id)) filters.delete(c.id);
      else filters.add(c.id);
      renderLibrary();
    });
    filterRow.appendChild(chip);
  });

  // ── ACTIVE FILTER BANNER ─────────────────────────────────
  const banner = $("library-filter-banner");
  if (anyFilter) {
    const names = [...filters].map(id => {
      const c = CUISINES.find(x=>x.id===id);
      return c ? `${c.emoji} ${c.label}` : id;
    }).join(" · ");
    banner.innerHTML = `Showing: ${names} <button class="chip-clear-all" id="lib-clear-all">Clear all ×</button>`;
    banner.style.display = "flex";
    $("lib-clear-all")?.addEventListener("click", () => {
      state.libraryCuisineFilters = new Set();
      renderLibrary();
    });
  } else {
    banner.style.display = "none";
    banner.innerHTML = "";
  }

  // ── ANCHORED / EXCLUDED FILTER BUTTONS ───────────────────
  const ac = state.anchoredItems.size, ec = state.excludedItems.size;
  const summary = $("library-summary");
  summary.innerHTML = `
    <button class="lib-summary-btn ${state.libraryFilter==="anchored"?"active":""}" data-filter="anchored">📌 ${ac} Anchored</button>
    <button class="lib-summary-btn ${state.libraryFilter==="excluded"?"active":""}" data-filter="excluded">🚫 ${ec} Excluded</button>
    ${state.libraryFilter ? '<button class="lib-summary-btn lib-clear-filter">← All toppings</button>' : ""}`;
  summary.querySelectorAll(".lib-summary-btn[data-filter]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.libraryFilter = state.libraryFilter === btn.dataset.filter ? null : btn.dataset.filter;
      renderLibrary();
    });
  });
  const cb = summary.querySelector(".lib-clear-filter");
  if (cb) cb.addEventListener("click", () => { state.libraryFilter = null; renderLibrary(); });

  // ── BUILD ITEM LIST ───────────────────────────────────────
  // Determine visible items based on filters
  function isVisible(item) {
    // Anchored/excluded filter overrides cuisine filter
    if (state.libraryFilter === "anchored") return state.anchoredItems.has(item.id);
    if (state.libraryFilter === "excluded")  return state.excludedItems.has(item.id);
    // Cuisine filter — OR logic
    if (anyFilter) {
      // Always show anchored items regardless of cuisine filter
      if (state.anchoredItems.has(item.id)) return true;
      return [...filters].some(f => (item.cuisine||[]).includes(f));
    }
    return true;
  }

  // ── RENDER COLLAPSIBLE SECTIONS ───────────────────────────
  const container = $("library-list");
  container.innerHTML = "";

  LAYER_ORDER.forEach(layer => {
    const allItems  = TOPPINGS.filter(t => t.layer === layer);
    const visible   = allItems.filter(isVisible);
    if (!visible.length) return; // hide empty sections

    const meta      = LAYER_META[layer];
    const isOpen    = state.librarySectionState[layer] ?? false;
    const sec       = document.createElement("div");
    sec.className   = "lib-collapsible-section";

    const hdr = document.createElement("button");
    hdr.className = "lib-section-header";
    hdr.innerHTML = `
      <span class="lib-section-toggle">${isOpen ? "▼" : "▶"}</span>
      <span class="lib-section-emoji">${meta.emoji}</span>
      <span class="lib-section-label">${meta.label}</span>
      <span class="lib-section-count">${visible.length}</span>`;
    hdr.addEventListener("click", () => {
      state.librarySectionState[layer] = !state.librarySectionState[layer];
      renderLibrary();
      restoreScroll("library");
    });
    sec.appendChild(hdr);

    if (isOpen) {
      const body = document.createElement("div");
      body.className = "lib-section-body";
      visible.forEach(item => {
        try {
        const row = document.createElement("div");
        row.className = "lib-row";
        if (state.excludedItems.has(item.id))  row.classList.add("is-excluded");
        if (state.anchoredItems.has(item.id)) row.classList.add("is-anchored");
        const cf  = (item.cuisine||[]).map(id=>{const c=CUISINES.find(x=>x.id===id);return c?c.emoji:"";}).join(" ");
        const st  = (item.stores||[]).map(s=>`<span class="lib-store" data-store="${s}">${STORES[s]?.short||s}</span>`).join("");
        // Safely escape content to prevent template literal breaks
        const safeDesc = (item.desc||item.note||"").replace(/`/g,"'").replace(/\${/g,"&#36;{");
        const safeName = (item.name||"").replace(/`/g,"'");
        row.innerHTML = `
          <div class="lib-row-top">
            <span class="lib-name">${safeName}</span>
            <span class="lib-cuisines">${cf}</span>
            <span class="lib-profile">${item.profile}</span>
            ${st}
            ${item.jarred?'<span class="lib-jar">jarred</span>':""}
            ${item.homemade?'<span class="lib-homemade">📋 recipe</span>':""}
            ${item.multiLayer?'<span class="lib-multilayer">multi-layer</span>':""}
          </div>
          ${safeDesc?`<div class="lib-note">${safeDesc}</div>`:""}
          ${item.homemade&&item.recipe?`<button class="recipe-toggle lib-recipe-toggle">Show recipe ▼</button><div class="recipe-section">${renderRecipeInner(item.recipe)}</div>`:""}
          <div class="lib-actions">
            <button class="lib-btn${state.anchoredItems.has(item.id)?" active":""}" data-action="anchor" data-id="${item.id}">${state.anchoredItems.has(item.id)?"⚓ Anchored":"Anchor"}</button>
            <button class="lib-btn${state.excludedItems.has(item.id)?" active ban":""}" data-action="exclude" data-id="${item.id}">${state.excludedItems.has(item.id)?"🚫 Excluded":"Exclude"}</button>
          </div>`;

        const lt = row.querySelector(".lib-recipe-toggle");
        if (lt) {
          const rs = row.querySelector(".recipe-section");
          lt.addEventListener("click", () => {
            const o = rs.classList.toggle("open");
            lt.textContent = o ? "Hide recipe ▲" : "Show recipe ▼";
          });
        }
        row.querySelectorAll(".lib-btn").forEach(btn => {
          btn.addEventListener("click", () => {
            const {action, id} = btn.dataset;
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
        body.appendChild(row);
        } catch(e) { console.warn("Library item render error:", item?.id, e); }
      });
      sec.appendChild(body);
    }
    container.appendChild(sec);
  });
}


// ── THE CLASSICS ──────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const bca = document.getElementById("btn-classics");
  if (bca) bca.addEventListener("click",()=>{
    if (!state.classicsSectionState) state.classicsSectionState={};
    renderClassics();
    showScreen("classics");
    restoreScroll("classics");
  });
  const bbc = document.getElementById("btn-back-classics");
  if (bbc) bbc.addEventListener("click",()=>{
    saveScroll("classics");
    showScreen("setup");
  });
});

// Also wire immediately (DOMContentLoaded may already have fired)
setTimeout(()=>{
  const bca = document.getElementById("btn-classics");
  if (bca && !bca._wired) {
    bca._wired = true;
    bca.addEventListener("click",()=>{
      if (!state.classicsSectionState) state.classicsSectionState={};
      renderClassics();
      showScreen("classics");
      restoreScroll("classics");
    });
  }
  const bbc = document.getElementById("btn-back-classics");
  if (bbc && !bbc._wired) {
    bbc._wired = true;
    bbc.addEventListener("click",()=>{
      saveScroll("classics");
      showScreen("setup");
    });
  }
},0);

function renderClassics() {
  if (!state.classicsSectionState) state.classicsSectionState = {};
  const container = $("classics-list");
  container.innerHTML = "";
  const cuisineOrder = ["neapolitan","levantine","turkish","greek","northafrican","mexican","american","indian"];

  cuisineOrder.forEach(cuisineId => {
    const cuisine = CUISINES.find(c=>c.id===cuisineId);
    if (!cuisine) return;
    const pizzas = CLASSICS.filter(c=>c.cuisine===cuisineId);
    if (!pizzas.length) return;

    const isOpen = state.classicsSectionState[cuisineId] ?? false;
    const sec    = document.createElement("div");
    sec.className = "classics-collapsible-section";

    const hdr = document.createElement("button");
    hdr.className = "classics-section-header clickable";
    hdr.innerHTML = `
      <span class="classics-section-toggle">${isOpen?"▼":"▶"}</span>
      <span class="classics-cuisine-emoji">${cuisine.emoji}</span>
      <span class="classics-cuisine-name">${cuisine.label}</span>
      <span class="classics-section-count">${pizzas.length}</span>`;
    hdr.addEventListener("click", () => {
      saveScroll("classics");
      state.classicsSectionState[cuisineId] = !state.classicsSectionState[cuisineId];
      renderClassics();
      restoreScroll("classics");
    });
    sec.appendChild(hdr);

    if (isOpen) {
      const body = document.createElement("div");
      body.className = "classics-section-body";
      pizzas.forEach(classic => {
        const allToppings = LAYER_ORDER.flatMap(l=>(classic.pizza[l]||[]).filter(Boolean).map(t=>t.name)).join(", ");
        const card = document.createElement("div");
        card.className = "classic-card";
        card.innerHTML = `
          <div class="classic-card-top">
            <span class="classic-name">${classic.name}</span>
          </div>
          <p class="classic-desc">${classic.description}</p>
          <p class="classic-ingredients">${allToppings}</p>
          <div class="classic-actions">
            <button class="btn-ghost classic-add-list">+ List 🛒</button>
            <button class="btn-primary classic-open">Open in builder →</button>
          </div>`;

        card.querySelector(".classic-add-list").addEventListener("click",()=>{
          if (state.session.length>=6){showToast("Session full — max 6 pizzas");return;}
          const pizza = buildClassicPizza(classic);
          state.session.push({id:"sess_"+uid(),pizzaName:classic.name,pizza,count:1,checked:{}});
          saveSession(); updateSessionBadge();
          showToast(`${classic.name} added to list 🛒`);
        });

        card.querySelector(".classic-open").addEventListener("click",()=>{
          saveScroll("classics");
          state.currentPizza = buildClassicPizza(classic);
          state.pizzaIsClassic = true;
          state.classicModified = false;
          renderPizza(state.currentPizza);
          showScreen("pizza");
        });

        body.appendChild(card);
      });
      sec.appendChild(body);
    }
    container.appendChild(sec);
  });
}

function buildClassicPizza(classic) {
  const pizza={
    _ovenMode: classic.ovenMode||"dome",
    _cuisines: [classic.cuisine],
    _complexity: "elevated",
    _classicName: classic.name,
    _chefNote: classic.chefNote||"",
  };
  LAYER_ORDER.forEach(l=>{pizza[l]=(classic.pizza[l]||[]).filter(Boolean);});
  return pizza;
}


// ── SHOPPING LIST ─────────────────────────────────────────────
$("btn-shopping").addEventListener("click",()=>{renderShoppingList();showScreen("shopping");});
$("btn-back-shopping").addEventListener("click",()=>showScreen("setup"));
function renderShoppingList(){renderSessionCards();renderCalculatedList();}

function renderSessionCards() {
  const container=$("session-cards");container.innerHTML="";
  if (!state.session.length){
    container.innerHTML=`<p class="empty-state">No pizzas added yet — roll a pie or pick a Classic and tap "+ List"</p>`;
    $("session-summary").textContent="";$("calculated-list").innerHTML="";return;
  }
  const total=state.session.reduce((s,e)=>s+e.count,0);
  const stops=optimizeStores();
  $("session-summary").innerHTML=`
    <span>Shopping for <strong>${total}</strong> pizza${total!==1?"s":""} · ${state.session.length} build${state.session.length!==1?"s":""}</span>
    <span class="store-suggestion">Suggested stops: ${stops.map(s=>STORES[s]?.name||s).join(" + ")}</span>`;

  state.session.forEach((entry,idx)=>{
    const card=document.createElement("div");card.className="session-card";
    const names=LAYER_ORDER.flatMap(l=>(entry.pizza[l]||[]).filter(Boolean).map(t=>t.name)).join(", ");
    card.innerHTML=`
      <div class="session-card-top">
        <div class="session-name-wrap">
          <span class="session-name">${entry.pizzaName}</span>
          <button class="session-rename" data-idx="${idx}">✏️</button>
        </div>
        <button class="session-remove" data-idx="${idx}">×</button>
      </div>
      <div class="session-toppings">${names}</div>
      <div class="session-stepper">
        <button class="stepper-btn stepper-minus" data-idx="${idx}">−</button>
        <span class="stepper-count">${entry.count}</span>
        <button class="stepper-btn stepper-plus" data-idx="${idx}">+</button>
      </div>`;
    card.querySelector(".session-rename").addEventListener("click",()=>{const n=prompt("Rename:",entry.pizzaName);if(n?.trim()){state.session[idx].pizzaName=n.trim();saveSession();renderShoppingList();}});
    card.querySelector(".session-remove").addEventListener("click",()=>{if(confirm(`Remove "${entry.pizzaName}"?`)){state.session.splice(idx,1);saveSession();updateSessionBadge();renderShoppingList();}});
    card.querySelector(".stepper-minus").addEventListener("click",()=>{
      if(entry.count<=1){if(confirm(`Remove "${entry.pizzaName}"?`)){state.session.splice(idx,1);saveSession();updateSessionBadge();renderShoppingList();}}
      else{state.session[idx].count--;saveSession();renderShoppingList();}
    });
    card.querySelector(".stepper-plus").addEventListener("click",()=>{
      if(entry.count>=6){showToast("Max 6 per build");return;}
      state.session[idx].count++;saveSession();renderShoppingList();
    });
    container.appendChild(card);
  });
  const cb=document.createElement("button");cb.className="btn-clear-session";cb.textContent="Clear entire list";
  cb.addEventListener("click",()=>{if(confirm("Clear the entire shopping list?")){state.session=[];saveSession();updateSessionBadge();renderShoppingList();}});
  container.appendChild(cb);
}

function optimizeStores() {
  const all=[];
  state.session.forEach(e=>{LAYER_ORDER.forEach(l=>{(e.pizza[l]||[]).filter(Boolean).forEach(t=>{if(!all.find(x=>x.id===t.id))all.push(t);});});});
  const needs={};STORE_ORDER.forEach(s=>{needs[s]=new Set();});
  all.forEach(t=>{const d=TOPPINGS.find(x=>x.id===t.id);if(!d?.stores?.length)return;d.stores.forEach(s=>{if(needs[s])needs[s].add(t.id);});});
  const purchasable=all.filter(t=>{const d=TOPPINGS.find(x=>x.id===t.id);return d?.stores?.length>0&&t.id!=="nosause";});
  if (!purchasable.length) return [];
  const needed=new Set(purchasable.map(t=>t.id));
  for (const s of STORE_ORDER){if([...needed].every(id=>needs[s].has(id)))return[s];}
  for (const [a,b] of [["sara","cm"],["sara","altin"],["cm","altin"]]){
    const combined=new Set([...needs[a],...needs[b]]);
    if([...needed].every(id=>combined.has(id)))return[a,b];
  }
  return STORE_ORDER;
}

function renderCalculatedList() {
  const container=$("calculated-list");container.innerHTML="";
  if (!state.session.length) return;
  const agg={};
  state.session.forEach(entry=>{
    LAYER_ORDER.forEach(layer=>{
      (entry.pizza[layer]||[]).filter(Boolean).forEach(item=>{
        const data=TOPPINGS.find(t=>t.id===item.id);
        if (!data||item.id==="nosause") return;
        if (!agg[item.id]) agg[item.id]={data,total_g:0,total_tsp:0,total_tbsp:0,total_unit_count:0,total_pizzas:0,checked:false};
        const q=data.qty||{},c=entry.count;
        agg[item.id].total_g          +=(q.per_pizza_g||0)*c;
        agg[item.id].total_tsp        +=(q.per_pizza_tsp||0)*c;
        agg[item.id].total_tbsp       +=(q.per_pizza_tbsp||0)*c;
        agg[item.id].total_unit_count +=(q.per_pizza_unit||0)*c;
        agg[item.id].total_pizzas     +=c;
      });
    });
  });
  Object.values(agg).forEach(a=>{
    const q=a.data.qty||{};
    a.total_oz=a.total_g>0?parseFloat(gToOz(a.total_g)):0;
    a.purchase_units=q.shared_yield?Math.ceil(a.total_pizzas/q.shared_yield):q.yield_g&&q.yield_g>0&&a.total_g>0?Math.ceil(a.total_g/q.yield_g):1;
    a.purchase_units=Math.max(a.purchase_units,q.min_purchase||1);
  });
  const makeAhead=Object.values(agg).filter(a=>a.data.make_ahead);
  const pantry   =Object.values(agg).filter(a=>!a.data.make_ahead&&a.data.qty?.pantry);
  const fresh    =Object.values(agg).filter(a=>!a.data.make_ahead&&!a.data.qty?.pantry);
  const byStore={};STORE_ORDER.forEach(s=>{byStore[s]=[];});
  fresh.forEach(a=>{const st=a.data.stores||[];if(st.length&&byStore[st[0]])byStore[st[0]].push(a);});
  STORE_ORDER.forEach(sid=>{
    const items=byStore[sid];if (!items.length) return;
    const sec=document.createElement("div");sec.className="list-store-section";
    sec.innerHTML=`<h3 class="list-store-heading" data-store="${sid}">${STORES[sid].name}</h3>`;
    LAYER_ORDER.forEach(layer=>{items.filter(a=>a.data.layer===layer).forEach(a=>sec.appendChild(renderListItem(a)));});
    container.appendChild(sec);
  });
  if (pantry.length){const sec=document.createElement("div");sec.className="list-store-section pantry-section";sec.innerHTML=`<h3 class="list-store-heading pantry-heading">🗄️ Pantry — check stock</h3>`;pantry.forEach(a=>sec.appendChild(renderListItem(a)));container.appendChild(sec);}
  if (makeAhead.length){const sec=document.createElement("div");sec.className="list-store-section make-ahead-section";sec.innerHTML=`<h3 class="list-store-heading make-ahead-heading">⏱️ Make Ahead</h3>`;makeAhead.forEach(a=>sec.appendChild(renderListItem(a)));container.appendChild(sec);}
}

function renderListItem(a) {
  const row=document.createElement("div");row.className=`list-item${a.checked?" checked":""}`;
  const q=a.data.qty||{};
  let qs="";
  if (a.total_g>0) qs=`${a.total_g}g / ${a.total_oz}oz · ${a.purchase_units} ${q.unit||""}`;
  else if (a.total_tsp>0) qs=`${fmt(a.total_tsp,"tsp")} · pantry`;
  else if (a.total_tbsp>0) qs=`${fmt(a.total_tbsp,"tbsp")} · pantry`;
  else if (a.total_unit_count>0) qs=`${Math.ceil(a.total_unit_count)} ${q.unit||""}`;
  else if (q.shared_yield&&q.shared_yield<999) qs=`${a.purchase_units} ${q.unit||""}`;
  else qs=q.unit==="wedge (pantry)"?"wedge — use to taste":q.unit||"as needed";
  const timing=a.data.make_ahead_timing?`<span class="list-timing">${a.data.make_ahead_timing}</span>`:"";
  const prep=a.data.prep===PREP.PRE&&a.data.note?`<div class="list-item-note">→ ${a.data.note}</div>`:"";
  row.innerHTML=`
    <label class="list-item-label">
      <input type="checkbox" class="list-checkbox"${a.checked?" checked":""}>
      <span class="list-item-content">
        <span class="list-item-name">${a.data.name}${timing}</span>
        <span class="list-item-qty">${qs}</span>
      </span>
    </label>${prep}`;
  row.querySelector(".list-checkbox").addEventListener("change",e=>{a.checked=e.target.checked;row.classList.toggle("checked",a.checked);});
  return row;
}

function fmt(value,unit) {
  const r=Math.round(value*4)/4;
  if (r===Math.floor(r)) return`${r} ${unit}`;
  const w=Math.floor(r),f=r-w;
  const fs=f===0.25?"¼":f===0.5?"½":f===0.75?"¾":f.toString();
  return w>0?`${w}${fs} ${unit}`:`${fs} ${unit}`;
}

$("btn-print").addEventListener("click",()=>window.print());
$("btn-copy-list").addEventListener("click",()=>{
  if (!state.session.length) return;
  const lines=["🍕 Omar's Pie — Shopping List",new Date().toLocaleDateString(),"","SESSION:"];
  state.session.forEach(e=>lines.push(`  ${e.pizzaName} × ${e.count}`));
  lines.push("");
  const agg={};
  state.session.forEach(entry=>{LAYER_ORDER.forEach(layer=>{(entry.pizza[layer]||[]).filter(Boolean).forEach(item=>{
    const data=TOPPINGS.find(t=>t.id===item.id);if(!data||item.id==="nosause")return;
    if(!agg[item.id])agg[item.id]={data,total_g:0,total_tsp:0,total_tbsp:0,total_unit_count:0,total_pizzas:0};
    const q=data.qty||{};
    agg[item.id].total_g+=(q.per_pizza_g||0)*entry.count;
    agg[item.id].total_tsp+=(q.per_pizza_tsp||0)*entry.count;
    agg[item.id].total_tbsp+=(q.per_pizza_tbsp||0)*entry.count;
    agg[item.id].total_unit_count+=(q.per_pizza_unit||0)*entry.count;
    agg[item.id].total_pizzas+=entry.count;
  });});});
  Object.values(agg).forEach(a=>{const q=a.data.qty||{};a.total_oz=a.total_g>0?parseFloat(gToOz(a.total_g)):0;a.purchase_units=q.shared_yield?Math.ceil(a.total_pizzas/q.shared_yield):q.yield_g&&q.yield_g>0&&a.total_g>0?Math.ceil(a.total_g/q.yield_g):1;a.purchase_units=Math.max(a.purchase_units,q.min_purchase||1);});
  STORE_ORDER.forEach(sid=>{
    const items=Object.values(agg).filter(a=>!a.data.make_ahead&&!a.data.qty?.pantry&&(a.data.stores||[])[0]===sid);
    if (!items.length) return;
    lines.push(`${STORES[sid].name.toUpperCase()}:`);
    items.forEach(a=>{const q=a.data.qty||{};const qs=a.total_g>0?`${a.total_g}g / ${a.total_oz}oz · ${a.purchase_units} ${q.unit||""}`:a.total_tsp>0?`${fmt(a.total_tsp,"tsp")} (pantry)`:a.total_tbsp>0?`${fmt(a.total_tbsp,"tbsp")} (pantry)`:q.unit||"as needed";lines.push(`  ☐ ${a.data.name} — ${qs}`);if(a.data.note)lines.push(`      → ${a.data.note}`);});
    lines.push("");
  });
  navigator.clipboard.writeText(lines.join("\n")).then(()=>showToast("List copied ✓")).catch(()=>showToast("Copy failed"));
});

// ── SAVED PIZZAS ─────────────────────────────────────────────
$("btn-back-saved").addEventListener("click",()=>showScreen("setup"));
function renderSaved() {
  const container=$("saved-list");container.innerHTML="";
  if (!state.saved.length){container.innerHTML=`<p class="empty-state">No saved pies yet — roll one or pick a Classic and tap Save 🗂️</p>`;return;}
  state.saved.forEach((entry,idx)=>{
    const names=LAYER_ORDER.flatMap(l=>(entry.pizza[l]||[]).filter(Boolean).map(t=>t.name)).join(", ");
    const flags=entry.cuisines.map(id=>{const c=CUISINES.find(x=>x.id===id);return c?c.emoji:"";}).join(" ");
    const date=new Date(entry.savedAt).toLocaleDateString();
    const card=document.createElement("div");card.className="saved-card";
    card.innerHTML=`
      <div class="saved-card-top">
        <div class="saved-name-wrap"><span class="saved-name">${entry.name}</span><button class="saved-rename">✏️</button></div>
        <button class="saved-delete">×</button>
      </div>
      <div class="saved-meta">${flags} · Saved ${date}</div>
      <div class="saved-toppings">${names}</div>
      <div class="saved-actions">
        <button class="btn-ghost saved-add-list">+ Add to list</button>
        <button class="btn-primary saved-open-builder">Open in builder</button>
      </div>`;
    card.querySelector(".saved-rename").addEventListener("click",()=>{const n=prompt("Rename:",entry.name);if(n?.trim()){state.saved[idx].name=n.trim();saveSaved();renderSaved();}});
    card.querySelector(".saved-delete").addEventListener("click",()=>{if(confirm(`Delete "${entry.name}"?`)){state.saved.splice(idx,1);saveSaved();renderSaved();}});
    card.querySelector(".saved-add-list").addEventListener("click",()=>{
      if(state.session.length>=6){showToast("Session full — max 6 pizzas");return;}
      state.session.push({id:"sess_"+uid(),pizzaName:entry.name,pizza:entry.pizza,count:1,checked:{}});
      saveSession();updateSessionBadge();showToast("Added to shopping list 🛒");
    });
    card.querySelector(".saved-open-builder").addEventListener("click",()=>{
      state.currentPizza=entry.pizza;state.selectedCuisines=[...(entry.cuisines||[])];
      state.selectedSauce=entry.pizza.sauce?.[0]||null;
      state.pizzaIsClassic=!!entry.pizza._classicName;state.classicModified=false;
      updateCuisineUI();renderPizza(state.currentPizza);showScreen("pizza");
    });
    container.appendChild(card);
  });
}

// ── THEME ─────────────────────────────────────────────────────
// ── HEADER MENU ───────────────────────────────────────────────
function initHeaderMenu() {
  const headerMenu = $("header-menu");
  if (!headerMenu) return;

  $("btn-menu")?.addEventListener("click", e => {
    e.stopPropagation();
    const isOpen = headerMenu.style.display !== "none";
    headerMenu.style.display = isOpen ? "none" : "block";
    $("btn-menu").classList.toggle("active", !isOpen);
  });

  document.addEventListener("click", () => {
    headerMenu.style.display = "none";
    $("btn-menu")?.classList.remove("active");
  });

  $("btn-library-menu")?.addEventListener("click", () => {
    headerMenu.style.display = "none";
    state.libraryCuisineFilters = new Set();
    renderLibrary(); showScreen("library"); restoreScroll("library");
  });
  $("btn-history-menu")?.addEventListener("click", () => {
    headerMenu.style.display = "none";
    renderHistory(); showScreen("history");
  });
  $("btn-saved-menu")?.addEventListener("click", () => {
    headerMenu.style.display = "none";
    renderSaved(); showScreen("saved");
  });
  $("btn-theme-menu")?.addEventListener("click", e => {
    e.stopPropagation();
    const newTheme = currentTheme === "day" ? "night" : "day";
    applyTheme(newTheme);
    $("btn-theme-menu").textContent = newTheme === "day" ? "🌙 Night mode" : "☀️ Day mode";
    headerMenu.style.display = "none";
  });
}

// ── TOAST ────────────────────────────────────────────────────
function showToast(msg) {
  const t=$("toast");t.textContent=msg;t.classList.add("visible");
  setTimeout(()=>t.classList.remove("visible"),2200);
}

// ── INIT ──────────────────────────────────────────────────────
function init() {
  applyTheme(currentTheme);
  const vl=$("version-label");
  if (vl&&typeof APP_VERSION!=="undefined") vl.textContent=`v${APP_VERSION}`;
  initCuisineGrid();
  updateCuisineUI();
  updateSessionBadge();
  initHeaderMenu();
}

init();
