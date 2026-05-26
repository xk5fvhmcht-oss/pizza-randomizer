// ============================================================
// OMAR'S PIE — data.js
// v1.1.1
// Neapolitan style · Biga dough · Gozney Dome + Baking Steel
// Pork-free by design
// Cuisines: Neapolitan, Levantine, Turkish, Greek,
//           Mexican, American, North African, Indian
// Layers: base → sauce → cheese → protein → veg → finish
// ============================================================

const APP_VERSION = "1.1.2";
const APP_NAME    = "Omar's Pie";

// ── STORES ──────────────────────────────────────────────────
const STORES = {
  cm:    { id: "cm",    name: "Central Market",  short: "CM",  color: "#2d6a2d" },
  sara:  { id: "sara",  name: "Sara's Market",   short: "Sara's", color: "#8b2020" },
  altin: { id: "altin", name: "Altin Grocery",   short: "Altin",  color: "#1a4a7a" },
};

// ── CUISINES ────────────────────────────────────────────────
const CUISINES = [
  { id: "neapolitan",   label: "Neapolitan",   emoji: "🍅", desc: "San Marzano · fior di latte · basil · EVOO" },
  { id: "levantine",    label: "Levantine",    emoji: "🫓", desc: "Labneh · za'atar · sumac · pomegranate" },
  { id: "turkish",      label: "Turkish",      emoji: "🫕", desc: "Spiced lamb · kashkaval · peppers · yogurt" },
  { id: "greek",        label: "Greek",        emoji: "🫒", desc: "Feta · kalamata · oregano · lemon" },
  { id: "mexican",      label: "Mexican",      emoji: "🌶️", desc: "Chipotle · cotija · jalapeño · cilantro" },
  { id: "american",     label: "American",     emoji: "🧀", desc: "BBQ · aged cheddar · pickled · hot honey" },
  { id: "northafrican", label: "North African",emoji: "🪔", desc: "Harissa · preserved lemon · chermoula · dukkah" },
  { id: "indian",       label: "Indian",       emoji: "🫚", desc: "Tikka masala · paneer · chaat masala · chutney" },
];

// ── AFFINITIES & CLASHES ────────────────────────────────────
// Affinities: coherent fusions (used by Surprise Me + highlights)
const CUISINE_AFFINITIES = [
  ["neapolitan",   "greek"],
  ["neapolitan",   "levantine"],
  ["levantine",    "turkish"],
  ["levantine",    "greek"],
  ["levantine",    "northafrican"],
  ["turkish",      "greek"],
  ["northafrican", "levantine"],
  ["northafrican", "turkish"],
  ["neapolitan",   "northafrican"],
  ["neapolitan",   "turkish"],
];

// Clashes: advisory warning — not a hard block
const CUISINE_CLASHES = [
  ["neapolitan",   "mexican"],
  ["neapolitan",   "indian"],
  ["neapolitan",   "american"],
  ["mexican",      "indian"],
  ["mexican",      "northafrican"],
  ["american",     "indian"],
  ["american",     "levantine"],
  ["american",     "northafrican"],
  ["indian",       "turkish"],
  ["indian",       "greek"],
];

// ── SAUCE FAMILIES ──────────────────────────────────────────
// Used to weight topping compatibility after sauce is chosen
const SAUCE_FAMILIES = {
  tomato:    "tomato",
  dairy:     "dairy",
  herb:      "herb",
  spicepaste:"spicepaste",
  meatbase:  "meatbase",
  nossauce:  "nosause",
};

// ── PROFILES ────────────────────────────────────────────────
// C = Classic (safe, proven)
// S = Curated (elevated, approachable)
// E = Explorer (adventurous, full range)
const PROFILE_INCLUDES = {
  classic:  ["C"],
  standard: ["C","S"],
  explorer: ["C","S","E"],
};

// ── LAYER META ──────────────────────────────────────────────
const LAYER_META = {
  base:    { label: "Base",    emoji: "🫙", order: 0, note: "Applied to raw dough before sauce" },
  sauce:   { label: "Sauce",   emoji: "🍅", order: 1, note: "The identity of the pizza" },
  cheese:  { label: "Cheese",  emoji: "🧀", order: 2, note: "On the sauce, under most toppings" },
  protein: { label: "Protein", emoji: "🥩", order: 3, note: "Check prep status — poultry always pre-cook" },
  veg:     { label: "Veg",     emoji: "🫑", order: 4, note: "Some pre-bake, some post — see notes" },
  finish:  { label: "Finish",  emoji: "✨", order: 5, note: "Post-bake garnish, drizzle, or dusting" },
};
const LAYER_ORDER = ["base","sauce","cheese","protein","veg","finish"];

// ── PREP STATUS (proteins) ───────────────────────────────────
// raw-on     = spread/place raw, cooks with pizza
// precook    = must be fully cooked before adding
// readyasis  = cured/preserved, just needs heat
const PREP = { RAW: "raw-on", PRE: "precook", READY: "readyasis" };

// ── OVEN GUIDANCE ────────────────────────────────────────────
const OVEN_GUIDANCE = {
  dome: {
    id: "dome",
    label: "Gozney Dome",
    emoji: "🔥",
    temp: "850–950°F (450–510°C) stone",
    time: "60–90 seconds",
    tips: [
      "Rotate 45° every 15–20 seconds",
      "Watch for leopard spotting on the crust edge",
      "Open dome lid slightly for even top browning",
      "High-moisture items (bufala, fresh tomato) — post-bake only",
      "Raw-on proteins safe at this temperature — thin layer essential",
    ]
  },
  steel: {
    id: "steel",
    label: "Baking Steel",
    emoji: "🪨",
    temp: "550°F (290°C) steel · top rack · broiler on",
    time: "4–6 minutes",
    tips: [
      "Preheat steel minimum 1 hour before launch",
      "Launch on parchment, pull paper after 90 seconds",
      "Rotate once at the 3-minute mark",
      "Finish under broiler for top colour",
      "Raw-on shrimp and egg — add at 3-minute mark only",
    ]
  }
};

// ── QUANTITY STANDARDS (per 270g dough ball, ~11–12 inch) ───
const QTY = {
  sauce_g:          75,   // grams of sauce per pizza
  cheese_primary_g: 100,  // grams primary cheese
  cheese_accent_g:  35,   // grams accent/secondary cheese
  protein_g:        90,   // grams cooked weight protein
  veg_total_g:      60,   // grams total veg
  finish_herb_g:    8,    // grams fresh herb (shared)
};

// ── SHOPPING UNITS ───────────────────────────────────────────
// How each item is purchased — for shopping list generation
// unit: the purchase unit label
// yield_g: grams per purchase unit (for quantity math)
// min_buy: minimum purchase (can't buy half a ball of mozz)

// ── TOPPINGS ─────────────────────────────────────────────────
// Fields:
//   id, name, layer, cuisine[], profile
//   sauceFamilies[] — which sauce families this pairs with
//   store — primary store
//   store2 — secondary store (optional)
//   jarred — true if sold as a prepared/jarred product
//   brand — brand note for jarred items
//   prep — PREP.* (proteins only)
//   domeOnly — true if raw-on only works at Dome temps
//   note — cook/prep note shown on card
//   qty — { unit, yield_g } for shopping list
//   postbake — true if added after bake

const TOPPINGS = [

  // ══════════════════════════════════════════
  // BASE
  // ══════════════════════════════════════════
  {
    id: "evoo_base", name: "EVOO drizzle",
    layer: "base", cuisine: ["neapolitan","greek","levantine","turkish","northafrican"],
    profile: "C", sauceFamilies: ["nosause","dairy","herb"],
    store: "cm", note: "High-quality, applied before sauce on white pies",
    qty: { unit: "bottle", yield_g: 750 },
  },
  {
    id: "garlic_oil", name: "Roasted garlic oil",
    layer: "base", cuisine: ["neapolitan","american","greek","levantine"],
    profile: "C", sauceFamilies: ["nosause","dairy","tomato"],
    store: "cm", note: "Brush edge to crust for garlic bread effect",
    qty: { unit: "bottle", yield_g: 750 },
  },
  {
    id: "zaatar_oil", name: "Za'atar oil",
    layer: "base", cuisine: ["levantine","turkish","northafrican","greek"],
    profile: "C", sauceFamilies: ["nosause","herb","dairy"],
    store: "sara", store2: "altin",
    note: "Replaces tomato on white/bianca pies — classic manakish base",
    qty: { unit: "jar", yield_g: 200 },
  },
  {
    id: "harissa_base", name: "Harissa smear (thin)",
    layer: "base", cuisine: ["northafrican","levantine","turkish"],
    profile: "S", sauceFamilies: ["spicepaste","tomato"],
    store: "sara", note: "Very thin layer — under sauce or solo base on bianca",
    qty: { unit: "jar", yield_g: 180 },
  },
  {
    id: "chipotle_base", name: "Chipotle adobo smear",
    layer: "base", cuisine: ["mexican"],
    profile: "S", sauceFamilies: ["spicepaste"],
    store: "cm", note: "Thin layer — smoke-forward, replaces tomato",
    qty: { unit: "can", yield_g: 200 },
  },
  {
    id: "tikka_base", name: "Tikka paste layer",
    layer: "base", cuisine: ["indian"],
    profile: "S", sauceFamilies: ["spicepaste"],
    store: "cm", note: "Mix with yogurt before applying — tempers heat",
    qty: { unit: "jar", yield_g: 300 },
  },
  {
    id: "bbq_base", name: "BBQ sauce base",
    layer: "base", cuisine: ["american"],
    profile: "C", sauceFamilies: ["tomato","spicepaste"],
    store: "cm", note: "Replaces tomato — bold, sweet-smoky",
    qty: { unit: "bottle", yield_g: 500 },
  },

  // ══════════════════════════════════════════
  // SAUCE
  // ══════════════════════════════════════════
  {
    id: "san_marzano", name: "San Marzano tomato",
    layer: "sauce", cuisine: ["neapolitan","greek","levantine","turkish","northafrican","american"],
    profile: "C", sauceFamilies: ["tomato"],
    store: "cm", note: "Crushed, uncooked, salt only — universal anchor",
    qty: { unit: "can (400g)", yield_g: 400 }, // covers ~5 pizzas
  },
  {
    id: "passata", name: "Passata (strained)",
    layer: "sauce", cuisine: ["neapolitan","greek","american","levantine","turkish"],
    profile: "C", sauceFamilies: ["tomato"],
    store: "cm", note: "Smooth, slightly cooked — wider coverage than San Marzano",
    qty: { unit: "bottle (680g)", yield_g: 680 },
  },
  {
    id: "shakshuka_sauce", name: "Shakshuka sauce (jarred)",
    layer: "sauce", cuisine: ["northafrican","levantine"],
    profile: "C", sauceFamilies: ["tomato"],
    store: "sara", jarred: true, brand: "Mina or Wild Garden",
    note: "Spiced tomato — reduce in pan 5 min before using to tighten",
    qty: { unit: "jar (16oz)", yield_g: 450 }, // covers ~5 pizzas
  },
  {
    id: "white_sauce", name: "Béchamel / cream base",
    layer: "sauce", cuisine: ["neapolitan","american","greek"],
    profile: "S", sauceFamilies: ["dairy"],
    store: "cm", note: "White pie — keep thin, don't over-sauce",
    qty: { unit: "make fresh", yield_g: 0 },
  },
  {
    id: "labneh_sauce", name: "Labneh spread",
    layer: "sauce", cuisine: ["levantine","turkish","greek","northafrican"],
    profile: "C", sauceFamilies: ["dairy"],
    store: "sara", store2: "altin",
    note: "Tangy, thick — replaces tomato entirely, classic bianca",
    qty: { unit: "tub (500g)", yield_g: 500 }, // covers ~5 pizzas
  },
  {
    id: "yogurt_sauce", name: "Strained yogurt sauce",
    layer: "sauce", cuisine: ["turkish","greek","indian","levantine"],
    profile: "C", sauceFamilies: ["dairy"],
    store: "altin", store2: "sara",
    note: "Mix with roasted garlic + mint before spreading",
    qty: { unit: "tub (500g)", yield_g: 500 },
  },
  {
    id: "chermoula", name: "Chermoula sauce",
    layer: "sauce", cuisine: ["northafrican","levantine"],
    profile: "S", sauceFamilies: ["herb"],
    store: "sara", note: "Herb-based, lemony — make fresh or jarred",
    qty: { unit: "jar or fresh", yield_g: 200 },
  },
  {
    id: "tikka_sauce", name: "Tikka masala sauce",
    layer: "sauce", cuisine: ["indian"],
    profile: "C", sauceFamilies: ["spicepaste"],
    store: "cm", note: "Pre-cooked, reduce until thick before applying",
    qty: { unit: "jar (350g)", yield_g: 350 },
  },
  {
    id: "makhani_sauce", name: "Makhani (butter masala) sauce",
    layer: "sauce", cuisine: ["indian"],
    profile: "S", sauceFamilies: ["spicepaste","dairy"],
    store: "cm", note: "Richer than tikka — reduce before use",
    qty: { unit: "jar (350g)", yield_g: 350 },
  },
  {
    id: "tomatillo_sauce", name: "Tomatillo salsa verde",
    layer: "sauce", cuisine: ["mexican"],
    profile: "C", sauceFamilies: ["tomato"],
    store: "cm", note: "Charred, thick — Mexican hard lock, not watery",
    qty: { unit: "jar (16oz)", yield_g: 450 },
  },
  {
    id: "roja_sauce", name: "Charred tomato roja",
    layer: "sauce", cuisine: ["mexican"],
    profile: "C", sauceFamilies: ["tomato","spicepaste"],
    store: "cm", note: "Ancho + charred tomato — smoky depth",
    qty: { unit: "jar (16oz)", yield_g: 450 },
  },
  {
    id: "hummus_sauce", name: "Hummus spread",
    layer: "sauce", cuisine: ["levantine","northafrican","greek"],
    profile: "S", sauceFamilies: ["dairy"],
    store: "sara", store2: "cm",
    note: "Thin layer only — too heavy if over-applied",
    qty: { unit: "tub (400g)", yield_g: 400 },
  },
  {
    id: "lahmajun_spread", name: "Lahmajun meat spread",
    layer: "sauce", cuisine: ["turkish","levantine"],
    profile: "S", sauceFamilies: ["meatbase"],
    store: "sara", prep: PREP.RAW,
    note: "Raw spiced lamb/beef + tomato + parsley — spread thin, cooks with pizza. No cheese traditionally.",
    qty: { unit: "200g ground lamb from butcher", yield_g: 200 },
  },
  {
    id: "nosause", name: "No sauce — bianca",
    layer: "sauce", cuisine: ["neapolitan","greek","levantine","turkish","northafrican","indian","american","mexican"],
    profile: "C", sauceFamilies: ["nosause"],
    store: null, note: "Relies on base oil and cheese for moisture — don't skip base layer",
    qty: { unit: "n/a", yield_g: 0 },
  },

  // ══════════════════════════════════════════
  // CHEESE
  // ══════════════════════════════════════════
  {
    id: "fior_di_latte", name: "Fior di latte",
    layer: "cheese", cuisine: ["neapolitan","greek","levantine","turkish","american"],
    profile: "C", sauceFamilies: ["tomato","dairy","nosause"],
    store: "cm", note: "Slice thin, pat dry — low moisture essential",
    qty: { unit: "ball (125g)", yield_g: 125 },
  },
  {
    id: "bufala", name: "Buffalo mozzarella",
    layer: "cheese", cuisine: ["neapolitan"],
    profile: "S", sauceFamilies: ["tomato","nosause"],
    store: "cm", postbake: true,
    note: "Post-bake only — too wet for the oven, tears beautifully when hot",
    qty: { unit: "ball (125g)", yield_g: 125 },
  },
  {
    id: "fresh_mozz", name: "Fresh mozzarella",
    layer: "cheese", cuisine: ["neapolitan","american","greek","levantine","turkish"],
    profile: "C", sauceFamilies: ["tomato","dairy","nosause","herb"],
    store: "cm", note: "Pat dry, slice — standard bake cheese",
    qty: { unit: "ball (125g)", yield_g: 125 },
  },
  {
    id: "shredded_mozz", name: "Shredded low-moisture mozz",
    layer: "cheese", cuisine: ["american","neapolitan"],
    profile: "C", sauceFamilies: ["tomato","spicepaste","dairy"],
    store: "cm", note: "Better melt and coverage for American style",
    qty: { unit: "bag (225g)", yield_g: 225 },
  },
  {
    id: "feta", name: "Feta (crumbled)",
    layer: "cheese", cuisine: ["greek","levantine","turkish","northafrican","neapolitan"],
    profile: "C", sauceFamilies: ["tomato","dairy","herb","nosause"],
    store: "sara", store2: "cm",
    note: "Add last 90 seconds or fully post-bake — too salty if over-cooked",
    qty: { unit: "block (200g)", yield_g: 200 },
  },
  {
    id: "halloumi", name: "Halloumi (sliced)",
    layer: "cheese", cuisine: ["greek","levantine","turkish"],
    profile: "S", sauceFamilies: ["tomato","dairy","herb","nosause"],
    store: "sara", store2: "cm",
    note: "Pre-sear in dry pan until golden — holds shape in oven",
    qty: { unit: "block (225g)", yield_g: 225 },
  },
  {
    id: "kashkaval", name: "Kashkaval",
    layer: "cheese", cuisine: ["turkish","levantine","greek","northafrican"],
    profile: "S", sauceFamilies: ["tomato","dairy","spicepaste","herb","nosause"],
    store: "altin", note: "Semi-hard, exceptional melt — Turkey's answer to mozzarella",
    qty: { unit: "block (200g)", yield_g: 200 },
  },
  {
    id: "cotija", name: "Cotija (crumbled)",
    layer: "cheese", cuisine: ["mexican"],
    profile: "C", sauceFamilies: ["tomato","spicepaste"],
    store: "cm", postbake: true,
    note: "Post-bake only — salty crumble, does not melt",
    qty: { unit: "wedge (200g)", yield_g: 200 },
  },
  {
    id: "paneer", name: "Paneer (cubed, spiced)",
    layer: "cheese", cuisine: ["indian"],
    profile: "C", sauceFamilies: ["spicepaste","dairy"],
    store: "cm", note: "Marinate in tikka spices + yogurt minimum 30 min, pre-cook",
    qty: { unit: "block (200g)", yield_g: 200 },
  },
  {
    id: "aged_cheddar", name: "Aged cheddar",
    layer: "cheese", cuisine: ["american"],
    profile: "C", sauceFamilies: ["tomato","spicepaste"],
    store: "cm", note: "Sharp — always blend with mozz, never solo",
    qty: { unit: "block (200g)", yield_g: 200 },
  },
  {
    id: "provolone", name: "Provolone (sharp)",
    layer: "cheese", cuisine: ["neapolitan","american"],
    profile: "S", sauceFamilies: ["tomato","dairy"],
    store: "cm", note: "Layer under mozz for depth",
    qty: { unit: "block (150g)", yield_g: 150 },
  },
  {
    id: "ricotta_dollop", name: "Ricotta (dolloped)",
    layer: "cheese", cuisine: ["neapolitan","american","greek"],
    profile: "S", sauceFamilies: ["tomato","dairy","nosause"],
    store: "cm", note: "Drop in spoonfuls mid-bake for creamy pockets",
    qty: { unit: "tub (250g)", yield_g: 250 },
  },

  // ══════════════════════════════════════════
  // PROTEIN (all pork-free)
  // ══════════════════════════════════════════
  {
    id: "beef_kofta", name: "Spiced beef kofta",
    layer: "protein", cuisine: ["turkish","levantine","northafrican","greek"],
    profile: "C", sauceFamilies: ["tomato","dairy","spicepaste","herb"],
    store: "sara", prep: PREP.PRE,
    note: "Par-cook before adding — crumble or slice thin",
    qty: { unit: "300g ground beef", yield_g: 300 },
  },
  {
    id: "lamb_mince", name: "Spiced lamb mince",
    layer: "protein", cuisine: ["turkish","greek","northafrican","levantine"],
    profile: "C", sauceFamilies: ["tomato","dairy","spicepaste","herb"],
    store: "sara", prep: PREP.PRE,
    note: "Season with cumin, allspice, Aleppo — par-cook, drain fat",
    qty: { unit: "300g ground lamb", yield_g: 300 },
  },
  {
    id: "chicken_tikka", name: "Chicken tikka (pre-cooked)",
    layer: "protein", cuisine: ["indian"],
    profile: "C", sauceFamilies: ["spicepaste","dairy"],
    store: "sara", prep: PREP.PRE,
    note: "⚠️ Poultry — must be fully cooked before pizza. Marinate overnight.",
    qty: { unit: "300g chicken breast", yield_g: 300 },
  },
  {
    id: "chicken_bbq", name: "BBQ chicken (shredded)",
    layer: "protein", cuisine: ["american"],
    profile: "C", sauceFamilies: ["tomato","spicepaste"],
    store: "cm", prep: PREP.PRE,
    note: "⚠️ Poultry — fully cooked, sauced, then added",
    qty: { unit: "300g chicken thighs", yield_g: 300 },
  },
  {
    id: "beef_pepperoni", name: "Beef pepperoni",
    layer: "protein", cuisine: ["american","neapolitan"],
    profile: "C", sauceFamilies: ["tomato","spicepaste"],
    store: "cm", prep: PREP.READY,
    note: "Halal beef pepperoni — cups and crisps at Dome temp",
    qty: { unit: "pack (150g)", yield_g: 150 },
  },
  {
    id: "shrimp", name: "Shrimp (marinated)",
    layer: "protein", cuisine: ["american","greek","levantine"],
    profile: "S", sauceFamilies: ["tomato","herb","dairy","nosause"],
    store: "cm", prep: PREP.RAW, domeOnly: false,
    note: "Dome: raw-on, cooks in 90s. Steel: pre-cook briefly — 550°F/5min undercooks raw shrimp",
    qty: { unit: "200g peeled shrimp", yield_g: 200 },
  },
  {
    id: "tuna", name: "Tuna (oil-packed)",
    layer: "protein", cuisine: ["neapolitan","greek"],
    profile: "S", sauceFamilies: ["tomato","dairy","herb"],
    store: "cm", prep: PREP.READY, postbake: false,
    note: "Drain well — add last 30 seconds to warm through only",
    qty: { unit: "can (160g drained)", yield_g: 160 },
  },
  {
    id: "chicken_shawarma", name: "Chicken shawarma strips",
    layer: "protein", cuisine: ["levantine","turkish","northafrican"],
    profile: "C", sauceFamilies: ["tomato","dairy","herb","spicepaste"],
    store: "sara", prep: PREP.PRE,
    note: "⚠️ Poultry — marinate in shawarma spice, grill or broil fully before pizza",
    qty: { unit: "300g chicken thighs", yield_g: 300 },
  },
  {
    id: "lamb_merguez", name: "Lamb merguez (sliced)",
    layer: "protein", cuisine: ["northafrican","levantine"],
    profile: "S", sauceFamilies: ["tomato","spicepaste","herb"],
    store: "sara", prep: PREP.PRE,
    note: "Par-cook, slice on bias — spicy and aromatic",
    qty: { unit: "pack (200g)", yield_g: 200 },
  },
  {
    id: "carne_asada", name: "Carne asada (sliced)",
    layer: "protein", cuisine: ["mexican"],
    profile: "C", sauceFamilies: ["tomato","spicepaste"],
    store: "cm", prep: PREP.PRE,
    note: "Fully cooked before adding — thin slices, season with lime",
    qty: { unit: "300g skirt steak", yield_g: 300 },
  },
  {
    id: "beef_chorizo", name: "Beef chorizo",
    layer: "protein", cuisine: ["mexican","american"],
    profile: "C", sauceFamilies: ["tomato","spicepaste"],
    store: "cm", prep: PREP.PRE,
    note: "Render in pan, drain fat — crumble over pizza",
    qty: { unit: "pack (225g)", yield_g: 225 },
  },
  {
    id: "egg", name: "Egg (whole, cracked)",
    layer: "protein", cuisine: ["neapolitan","turkish","levantine","northafrican"],
    profile: "S", sauceFamilies: ["tomato","dairy","herb","nosause","spicepaste"],
    store: "cm", prep: PREP.RAW,
    note: "Dome: crack in last 20s — yolk stays runny. Steel: add at 3-min mark, yolk will set more.",
    qty: { unit: "1 egg per pizza", yield_g: 60 },
  },
  {
    id: "labneh_balls", name: "Labneh balls (marinated)",
    layer: "protein", cuisine: ["levantine","northafrican"],
    profile: "E", sauceFamilies: ["dairy","herb","nosause"],
    store: "sara", prep: PREP.READY, postbake: true,
    note: "Post-bake only — herb-rolled, adds tang and richness",
    qty: { unit: "jar (300g)", yield_g: 300 },
  },

  // ══════════════════════════════════════════
  // VEG
  // ══════════════════════════════════════════
  {
    id: "cherry_tom", name: "Cherry tomatoes (halved)",
    layer: "veg", cuisine: ["neapolitan","greek","american","levantine","turkish","northafrican"],
    profile: "C", sauceFamilies: ["tomato","dairy","herb","nosause"],
    store: "cm", store2: "sara",
    note: "Universal — high moisture, don't overload",
    qty: { unit: "punnet (250g)", yield_g: 250 },
  },
  {
    id: "roasted_peppers", name: "Roasted red peppers",
    layer: "veg", cuisine: ["turkish","greek","northafrican","american","levantine"],
    profile: "C", sauceFamilies: ["tomato","dairy","spicepaste","herb"],
    store: "cm", store2: "sara",
    note: "Pat dry if jarred — excess brine ruins the base",
    qty: { unit: "jar (290g)", yield_g: 200 },
  },
  {
    id: "kalamata", name: "Kalamata olives",
    layer: "veg", cuisine: ["greek","levantine","neapolitan","northafrican"],
    profile: "C", sauceFamilies: ["tomato","dairy","herb","nosause"],
    store: "sara", store2: "cm",
    note: "Pit and halve — slice if using many",
    qty: { unit: "jar (350g)", yield_g: 200 },
  },
  {
    id: "green_olives", name: "Castelvetrano olives",
    layer: "veg", cuisine: ["neapolitan","northafrican","greek"],
    profile: "S", sauceFamilies: ["tomato","dairy","herb","nosause"],
    store: "cm", note: "Buttery, mild — pit and halve",
    qty: { unit: "jar (290g)", yield_g: 180 },
  },
  {
    id: "artichoke", name: "Artichoke hearts",
    layer: "veg", cuisine: ["neapolitan","greek","levantine"],
    profile: "S", sauceFamilies: ["tomato","dairy","nosause","herb"],
    store: "cm", note: "Pat dry, quarter — jarred in water, not oil",
    qty: { unit: "can (400g)", yield_g: 200 },
  },
  {
    id: "caramelized_onion", name: "Caramelized onions",
    layer: "veg", cuisine: ["turkish","american","greek","levantine","northafrican"],
    profile: "C", sauceFamilies: ["tomato","dairy","spicepaste","nosause"],
    store: "cm", store2: "sara",
    note: "Cook fully before adding — 30+ minutes low heat",
    qty: { unit: "2 large onions", yield_g: 300 },
  },
  {
    id: "red_onion", name: "Red onion (thin sliced)",
    layer: "veg", cuisine: ["greek","indian","mexican","american","levantine"],
    profile: "C", sauceFamilies: ["tomato","dairy","spicepaste","herb"],
    store: "cm", store2: "sara",
    note: "Quick pickle for less bite — 10 min in lime juice",
    qty: { unit: "1 medium onion", yield_g: 150 },
  },
  {
    id: "jalapeno_fresh", name: "Jalapeño (fresh sliced)",
    layer: "veg", cuisine: ["mexican","american"],
    profile: "C", sauceFamilies: ["tomato","spicepaste"],
    store: "cm", note: "Seed for moderate heat, keep seeds for fire",
    qty: { unit: "2 jalapeños", yield_g: 60 },
  },
  {
    id: "jalapeno_pickled", name: "Pickled jalapeños",
    layer: "veg", cuisine: ["mexican","american"],
    profile: "C", sauceFamilies: ["tomato","spicepaste"],
    store: "cm", postbake: true,
    note: "Post-bake — preserves tang and texture",
    qty: { unit: "jar (300g)", yield_g: 150 },
  },
  {
    id: "corn_charred", name: "Charred corn",
    layer: "veg", cuisine: ["mexican","american"],
    profile: "S", sauceFamilies: ["tomato","spicepaste","dairy"],
    store: "cm", note: "Cast iron or open flame — don't use canned without charring",
    qty: { unit: "2 ears corn", yield_g: 200 },
  },
  {
    id: "mushroom_cremini", name: "Cremini mushrooms",
    layer: "veg", cuisine: ["neapolitan","american","turkish"],
    profile: "C", sauceFamilies: ["tomato","dairy","nosause"],
    store: "cm", note: "Sauté first until golden — raw mushrooms steam and waterlog",
    qty: { unit: "punnet (250g)", yield_g: 250 },
  },
  {
    id: "mushroom_wild", name: "Wild mushrooms (roasted)",
    layer: "veg", cuisine: ["neapolitan"],
    profile: "E", sauceFamilies: ["nosause","dairy","tomato"],
    store: "cm", note: "Maitake or oyster — roast at 425°F first with EVOO and thyme",
    qty: { unit: "punnet (150g)", yield_g: 150 },
  },
  {
    id: "eggplant_roasted", name: "Roasted eggplant",
    layer: "veg", cuisine: ["levantine","turkish","greek","northafrican"],
    profile: "S", sauceFamilies: ["tomato","dairy","herb","spicepaste"],
    store: "sara", store2: "cm",
    note: "Salt, drain 20 min, roast — never add raw eggplant",
    qty: { unit: "1 medium eggplant", yield_g: 300 },
  },
  {
    id: "spinach", name: "Baby spinach (wilted)",
    layer: "veg", cuisine: ["indian","levantine","greek","northafrican"],
    profile: "C", sauceFamilies: ["tomato","dairy","spicepaste","herb","nosause"],
    store: "cm", store2: "sara",
    note: "Add 90 seconds before pulling — wilts perfectly",
    qty: { unit: "bag (150g)", yield_g: 150 },
  },
  {
    id: "preserved_lemon", name: "Preserved lemon (rinsed)",
    layer: "veg", cuisine: ["northafrican","levantine"],
    profile: "E", sauceFamilies: ["tomato","herb","dairy"],
    store: "sara", note: "Rinse thoroughly — very salty, use sparingly",
    qty: { unit: "jar (200g)", yield_g: 200 },
  },
  {
    id: "potato_thin", name: "Thinly sliced potato",
    layer: "veg", cuisine: ["neapolitan"],
    profile: "E", sauceFamilies: ["nosause","dairy"],
    store: "cm", note: "Classic Neapolitan bianca — blanch first or slice paper thin",
    qty: { unit: "2 medium potatoes", yield_g: 300 },
  },
  {
    id: "beet_roasted", name: "Roasted beet",
    layer: "veg", cuisine: ["greek","northafrican"],
    profile: "E", sauceFamilies: ["dairy","nosause","herb"],
    store: "cm", store2: "sara",
    note: "Pre-roast and slice — pairs with feta or labneh",
    qty: { unit: "3 medium beets", yield_g: 300 },
  },
  {
    id: "sun_dried_tom", name: "Sun-dried tomatoes",
    layer: "veg", cuisine: ["neapolitan","greek","levantine"],
    profile: "S", sauceFamilies: ["tomato","dairy","herb"],
    store: "cm", note: "Drain from oil — intense, use sparingly",
    qty: { unit: "jar (200g)", yield_g: 150 },
  },
  {
    id: "piquillo_peppers", name: "Piquillo peppers",
    layer: "veg", cuisine: ["neapolitan","northafrican"],
    profile: "S", sauceFamilies: ["tomato","dairy","spicepaste"],
    store: "cm", note: "Sweet and smoky — drain and pat dry",
    qty: { unit: "jar (290g)", yield_g: 180 },
  },
  {
    id: "za_atar_onion", name: "Za'atar-roasted onion",
    layer: "veg", cuisine: ["levantine","turkish","northafrican"],
    profile: "S", sauceFamilies: ["tomato","dairy","herb","nosause"],
    store: "sara", note: "Roast at 400°F with za'atar + olive oil first",
    qty: { unit: "2 medium onions", yield_g: 250 },
  },

  // ══════════════════════════════════════════
  // FINISH (post-bake or last 30s)
  // ══════════════════════════════════════════
  {
    id: "fresh_basil", name: "Fresh basil",
    layer: "finish", cuisine: ["neapolitan","greek","american","levantine","turkish"],
    profile: "C", sauceFamilies: ["tomato","dairy","herb","nosause"],
    store: "cm", postbake: true,
    note: "Post-bake always — wilts and blackens in the oven",
    qty: { unit: "bunch", yield_g: 30 },
  },
  {
    id: "fresh_mint", name: "Fresh mint",
    layer: "finish", cuisine: ["levantine","turkish","greek","northafrican"],
    profile: "S", sauceFamilies: ["tomato","dairy","herb","nosause","spicepaste"],
    store: "sara", store2: "cm", postbake: true,
    note: "Post-bake — Turkish and Levantine classic",
    qty: { unit: "bunch", yield_g: 20 },
  },
  {
    id: "fresh_cilantro", name: "Fresh cilantro",
    layer: "finish", cuisine: ["mexican","indian","northafrican","levantine"],
    profile: "C", sauceFamilies: ["tomato","spicepaste","herb"],
    store: "cm", store2: "sara", postbake: true,
    note: "Post-bake only",
    qty: { unit: "bunch", yield_g: 20 },
  },
  {
    id: "flat_parsley", name: "Flat-leaf parsley",
    layer: "finish", cuisine: ["levantine","turkish","northafrican","greek","neapolitan"],
    profile: "C", sauceFamilies: ["tomato","dairy","herb","nosause","spicepaste"],
    store: "sara", store2: "cm", postbake: true,
    note: "Post-bake — universal finish herb",
    qty: { unit: "bunch", yield_g: 20 },
  },
  {
    id: "sumac_finish", name: "Sumac (dusted)",
    layer: "finish", cuisine: ["levantine","turkish","northafrican","greek"],
    profile: "C", sauceFamilies: ["tomato","dairy","herb","nosause"],
    store: "sara", store2: "altin", postbake: true,
    note: "Post-bake — lemony, essential on Levantine and Turkish pies",
    qty: { unit: "jar (pantry)", yield_g: 0 },
  },
  {
    id: "zaatar_finish", name: "Za'atar (sprinkled)",
    layer: "finish", cuisine: ["levantine","turkish","northafrican"],
    profile: "C", sauceFamilies: ["tomato","dairy","herb","nosause"],
    store: "sara", store2: "altin", postbake: true,
    note: "Post-bake or last 30 seconds",
    qty: { unit: "jar (pantry)", yield_g: 0 },
  },
  {
    id: "chaat_masala", name: "Chaat masala (dusted)",
    layer: "finish", cuisine: ["indian"],
    profile: "C", sauceFamilies: ["spicepaste","dairy"],
    store: "cm", postbake: true,
    note: "Post-bake — tangy, umami, essential on Indian pies",
    qty: { unit: "jar (pantry)", yield_g: 0 },
  },
  {
    id: "finish_evoo", name: "EVOO (finishing drizzle)",
    layer: "finish", cuisine: ["neapolitan","greek","levantine","turkish","northafrican","american"],
    profile: "C", sauceFamilies: ["tomato","dairy","herb","nosause","spicepaste"],
    store: "cm", postbake: true,
    note: "Post-bake always — use your best bottle here",
    qty: { unit: "bottle (pantry)", yield_g: 0 },
  },
  {
    id: "lemon_zest", name: "Lemon zest",
    layer: "finish", cuisine: ["greek","levantine","northafrican","neapolitan"],
    profile: "S", sauceFamilies: ["tomato","dairy","herb","nosause"],
    store: "cm", postbake: true,
    note: "Post-bake — brightens everything, underused finish",
    qty: { unit: "1 lemon per 2–3 pizzas", yield_g: 0 },
  },
  {
    id: "hot_honey", name: "Hot honey drizzle",
    layer: "finish", cuisine: ["american","neapolitan"],
    profile: "S", sauceFamilies: ["tomato","dairy","spicepaste"],
    store: "cm", postbake: true,
    note: "Calabrian chili style — post-bake drizzle",
    qty: { unit: "bottle (pantry)", yield_g: 0 },
  },
  {
    id: "pomegranate_mol", name: "Pomegranate molasses",
    layer: "finish", cuisine: ["levantine","northafrican","turkish"],
    profile: "E", sauceFamilies: ["tomato","dairy","herb","spicepaste"],
    store: "sara", postbake: true,
    note: "Post-bake — sweet-sour depth, use sparingly",
    qty: { unit: "bottle (pantry)", yield_g: 0 },
  },
  {
    id: "tahini_drizzle", name: "Tahini drizzle",
    layer: "finish", cuisine: ["levantine","northafrican","turkish"],
    profile: "S", sauceFamilies: ["tomato","dairy","herb","nosause"],
    store: "sara", postbake: true,
    note: "Thin with lemon juice before drizzling — post-bake",
    qty: { unit: "jar (pantry)", yield_g: 0 },
  },
  {
    id: "red_chili_flakes", name: "Dried chili flakes",
    layer: "finish", cuisine: ["neapolitan","american","indian","turkish","levantine"],
    profile: "C", sauceFamilies: ["tomato","dairy","spicepaste","nosause"],
    store: "cm", postbake: true,
    note: "Post-bake — Calabrian preferred for Neapolitan, Aleppo for Levantine",
    qty: { unit: "jar (pantry)", yield_g: 0 },
  },
  {
    id: "dukkah", name: "Dukkah (sprinkled)",
    layer: "finish", cuisine: ["northafrican","levantine","greek"],
    profile: "E", sauceFamilies: ["dairy","herb","nosause","tomato"],
    store: "sara", postbake: true,
    note: "Nut-herb-spice blend — post-bake, pairs with labneh or feta",
    qty: { unit: "bag (pantry)", yield_g: 0 },
  },
  {
    id: "urfa_biber", name: "Urfa biber flakes",
    layer: "finish", cuisine: ["turkish","levantine"],
    profile: "S", sauceFamilies: ["tomato","dairy","spicepaste","nosause"],
    store: "altin", postbake: true,
    note: "Dark, smoky, raisin-forward heat — post-bake",
    qty: { unit: "jar (pantry)", yield_g: 0 },
  },
  {
    id: "pickled_red_onion", name: "Pickled red onion",
    layer: "finish", cuisine: ["mexican","american","indian","levantine"],
    profile: "S", sauceFamilies: ["tomato","spicepaste","dairy"],
    store: "cm", store2: "sara", postbake: true,
    note: "Post-bake contrast — make or buy",
    qty: { unit: "jar (pantry)", yield_g: 0 },
  },
  {
    id: "arugula", name: "Arugula (dressed)",
    layer: "finish", cuisine: ["neapolitan","greek","american"],
    profile: "S", sauceFamilies: ["tomato","dairy","nosause"],
    store: "cm", postbake: true,
    note: "Toss in lemon + EVOO — post-bake on top",
    qty: { unit: "bag (80g)", yield_g: 80 },
  },
  {
    id: "mango_chutney", name: "Mango chutney drizzle",
    layer: "finish", cuisine: ["indian"],
    profile: "S", sauceFamilies: ["spicepaste","dairy"],
    store: "cm", postbake: true,
    note: "Thin with warm water — post-bake drizzle",
    qty: { unit: "jar (pantry)", yield_g: 0 },
  },
  {
    id: "lime_crema", name: "Lime crema (dolloped)",
    layer: "finish", cuisine: ["mexican"],
    profile: "C", sauceFamilies: ["tomato","spicepaste"],
    store: "cm", postbake: true,
    note: "Sour cream + fresh lime juice — post-bake",
    qty: { unit: "sour cream (200g)", yield_g: 200 },
  },
  {
    id: "green_harissa", name: "Green harissa drizzle",
    layer: "finish", cuisine: ["northafrican","levantine","turkish"],
    profile: "E", sauceFamilies: ["herb","tomato","spicepaste"],
    store: "sara", postbake: true,
    note: "Herb-forward, fresher than red — post-bake drizzle",
    qty: { unit: "jar (pantry)", yield_g: 0 },
  },
];
