// ============================================================
// PIZZA RANDOMIZER — DATA.JS
// Neapolitan style, biga dough, Gozney Dome + baking steel
// All pork-free. Layering order: base → sauce → cheese → protein → veg → finish
// Cuisines: Neapolitan, Levantine, Turkish, Greek, Mexican, American, North African, Indian
// ============================================================

const APP_VERSION = "1.0.0";

const CUISINES = [
  { id: "neapolitan",   label: "Neapolitan",    flag: "🇮🇹", desc: "San Marzano, fior di latte, basil" },
  { id: "levantine",    label: "Levantine",      flag: "🌙",  desc: "Za'atar, labneh, sumac, herbs" },
  { id: "turkish",      label: "Turkish",        flag: "🇹🇷", desc: "Spiced lamb, peppers, yogurt" },
  { id: "greek",        label: "Greek",          flag: "🇬🇷", desc: "Feta, olives, oregano, lemon" },
  { id: "mexican",      label: "Mexican",        flag: "🇲🇽", desc: "Chipotle, cotija, jalapeño, cilantro" },
  { id: "american",     label: "American",       flag: "🇺🇸", desc: "BBQ, ranch, sharp cheddar, pickled" },
  { id: "northafrican", label: "North African",  flag: "🌍",  desc: "Harissa, preserved lemon, chermoula" },
  { id: "indian",       label: "Indian",         flag: "🇮🇳", desc: "Tikka masala, paneer, chutney, naan" },
];

// Cuisine pairings — flag combos that work vs. clash
const CUISINE_AFFINITIES = [
  ["neapolitan", "greek"],
  ["neapolitan", "levantine"],
  ["levantine", "turkish"],
  ["levantine", "greek"],
  ["levantine", "northafrican"],
  ["turkish", "greek"],
  ["northafrican", "levantine"],
  ["northafrican", "turkish"],
];

const CUISINE_CLASHES = [
  ["neapolitan", "mexican"],
  ["neapolitan", "indian"],
  ["neapolitan", "american"],
  ["mexican", "indian"],
  ["mexican", "northafrican"],
  ["american", "indian"],
  ["american", "levantine"],
  ["american", "northafrican"],
];

// ============================================================
// LAYERING SYSTEM
// Layers in order: base → sauce → cheese → protein → veg → finish
// Each item tagged with: layer, cuisine[], profile, notes
// ============================================================

// Profiles: C = Classic, S = Curated, E = Explorer
// Layers: base | sauce | cheese | protein | veg | finish

const TOPPINGS = [

  // ─── BASE ──────────────────────────────────────────────────
  // (The dough prep / oil base under sauce — always present from dough)
  // Base items are optional drizzles/rubs applied before sauce
  { id: "evoo_base",        name: "EVOO drizzle",              layer: "base", cuisine: ["neapolitan","greek","levantine"], profile: "C", note: "Applied before sauce on white pies" },
  { id: "garlic_oil",       name: "Roasted garlic oil",        layer: "base", cuisine: ["neapolitan","american","greek"],  profile: "C", note: "Brush edge to crust" },
  { id: "zaatar_oil",       name: "Za'atar oil",               layer: "base", cuisine: ["levantine","turkish","northafrican"], profile: "C", note: "Replaces tomato on white pies" },
  { id: "harissa_base",     name: "Harissa smear (thin)",      layer: "base", cuisine: ["northafrican","levantine"],       profile: "S", note: "Very thin — under sauce or solo" },
  { id: "chipotle_base",    name: "Chipotle adobo smear",      layer: "base", cuisine: ["mexican"],                        profile: "S", note: "Thin layer, smoke-forward" },
  { id: "tikka_base",       name: "Tikka paste layer",         layer: "base", cuisine: ["indian"],                         profile: "S", note: "Mix with yogurt for balance" },
  { id: "bbq_base",         name: "BBQ sauce base",            layer: "base", cuisine: ["american"],                       profile: "C", note: "Replaces tomato" },

  // ─── SAUCE ─────────────────────────────────────────────────
  { id: "san_marzano",      name: "San Marzano tomato sauce",  layer: "sauce", cuisine: ["neapolitan"],                     profile: "C", note: "Crushed, uncooked, salt only" },
  { id: "passata",          name: "Passata (strained)",        layer: "sauce", cuisine: ["neapolitan","greek","american"],  profile: "C", note: "Smooth, cooked down slightly" },
  { id: "white_sauce",      name: "Béchamel / cream base",     layer: "sauce", cuisine: ["neapolitan","american"],          profile: "S", note: "White pie alternative" },
  { id: "labneh_sauce",     name: "Labneh spread",             layer: "sauce", cuisine: ["levantine","turkish","greek"],    profile: "C", note: "Tangy, thick — replaces tomato" },
  { id: "yogurt_sauce",     name: "Strained yogurt sauce",     layer: "sauce", cuisine: ["turkish","greek","indian"],       profile: "C", note: "Mix garlic + mint" },
  { id: "chermoula",        name: "Chermoula sauce",           layer: "sauce", cuisine: ["northafrican"],                   profile: "S", note: "Herb-based, lemony" },
  { id: "tikka_sauce",      name: "Tikka masala sauce",        layer: "sauce", cuisine: ["indian"],                         profile: "C", note: "Pre-cooked, reduced for pizza" },
  { id: "salsa_verde_mex",  name: "Tomatillo salsa verde",     layer: "sauce", cuisine: ["mexican"],                        profile: "C", note: "Charred, thick — not watery" },
  { id: "roja_sauce",       name: "Charred tomato roja",       layer: "sauce", cuisine: ["mexican"],                        profile: "C", note: "Ancho + tomato, smoky" },
  { id: "hummus_sauce",     name: "Hummus spread",             layer: "sauce", cuisine: ["levantine","northafrican"],       profile: "S", note: "Thin layer only — watch weight" },

  // ─── CHEESE ────────────────────────────────────────────────
  { id: "fior_di_latte",    name: "Fior di latte (low moisture)", layer: "cheese", cuisine: ["neapolitan"],                  profile: "C", note: "Slice thin, dab dry" },
  { id: "bufala",           name: "Buffalo mozzarella",        layer: "cheese", cuisine: ["neapolitan"],                    profile: "S", note: "Add post-bake only — too wet for oven" },
  { id: "fresh_mozz",       name: "Fresh mozzarella",          layer: "cheese", cuisine: ["neapolitan","american"],         profile: "C", note: "Pat dry, slice" },
  { id: "shredded_mozz",    name: "Shredded low-moisture mozz", layer: "cheese", cuisine: ["american"],                    profile: "C", note: "Standard melt, wider coverage" },
  { id: "feta",             name: "Feta (crumbled)",           layer: "cheese", cuisine: ["greek","levantine","turkish"],   profile: "C", note: "Add last 2 min or post-bake" },
  { id: "halloumi",         name: "Halloumi (sliced, seared)", layer: "cheese", cuisine: ["greek","levantine"],             profile: "S", note: "Pre-sear — holds shape" },
  { id: "kashkaval",        name: "Kashkaval",                 layer: "cheese", cuisine: ["turkish","levantine"],           profile: "S", note: "Semi-hard, excellent melt" },
  { id: "cotija",           name: "Cotija (crumbled)",         layer: "cheese", cuisine: ["mexican"],                       profile: "C", note: "Add post-bake only — doesn't melt" },
  { id: "paneer",           name: "Paneer (cubed, spiced)",    layer: "cheese", cuisine: ["indian"],                        profile: "C", note: "Pre-cook in tikka spices" },
  { id: "aged_cheddar",     name: "Aged cheddar",              layer: "cheese", cuisine: ["american"],                      profile: "C", note: "Sharp, blend with mozz" },
  { id: "provolone",        name: "Provolone (sharp)",         layer: "cheese", cuisine: ["neapolitan","american"],         profile: "S", note: "Layer under mozz" },
  { id: "ricotta_dollop",   name: "Ricotta (dolloped)",        layer: "cheese", cuisine: ["neapolitan","american"],         profile: "S", note: "Adds creaminess mid-bake" },

  // ─── PROTEIN ───────────────────────────────────────────────
  // ALL PORK-FREE
  { id: "beef_kofta",       name: "Spiced beef kofta",         layer: "protein", cuisine: ["turkish","levantine","northafrican"], profile: "C", note: "Par-cook before adding" },
  { id: "lamb_mince",       name: "Spiced lamb mince",         layer: "protein", cuisine: ["turkish","greek","northafrican"],     profile: "C", note: "Season with cumin + allspice" },
  { id: "chicken_tikka",    name: "Chicken tikka (pre-cooked)", layer: "protein", cuisine: ["indian"],                            profile: "C", note: "Must be fully cooked before pizza" },
  { id: "chicken_bbq",      name: "BBQ chicken (shredded)",    layer: "protein", cuisine: ["american"],                           profile: "C", note: "Pre-cooked, sauced" },
  { id: "beef_pepperoni",   name: "Beef pepperoni",            layer: "protein", cuisine: ["american","neapolitan"],               profile: "C", note: "Halal beef pepperoni" },
  { id: "shrimp",           name: "Shrimp (marinated, raw ok)", layer: "protein", cuisine: ["american","greek","levantine"],       profile: "S", note: "Cook in 90s at Dome temp" },
  { id: "tuna",             name: "Tuna (oil-packed)",         layer: "protein", cuisine: ["neapolitan","greek"],                  profile: "S", note: "Drain well — traditional Italian-American" },
  { id: "chicken_shawarma", name: "Chicken shawarma strips",   layer: "protein", cuisine: ["levantine","turkish"],                 profile: "C", note: "Pre-marinated, grill or broil first" },
  { id: "lamb_merguez",     name: "Lamb merguez (sliced)",     layer: "protein", cuisine: ["northafrican"],                        profile: "S", note: "Par-cook before pizza" },
  { id: "carne_asada",      name: "Carne asada (sliced)",      layer: "protein", cuisine: ["mexican"],                             profile: "C", note: "Fully cooked before adding" },
  { id: "chorizo_beef",     name: "Beef chorizo",              layer: "protein", cuisine: ["mexican"],                             profile: "C", note: "Render in pan first" },
  { id: "egg",              name: "Egg (cracked, whole)",      layer: "protein", cuisine: ["neapolitan","turkish","levantine"],     profile: "S", note: "Add in last 2 min — yolk stays runny" },
  { id: "labneh_protein",   name: "Labneh balls (marinated)",  layer: "protein", cuisine: ["levantine"],                           profile: "E", note: "Add post-bake for texture contrast" },

  // ─── VEG ───────────────────────────────────────────────────
  { id: "cherry_tom",       name: "Cherry tomatoes (halved)",  layer: "veg", cuisine: ["neapolitan","greek","american"],     profile: "C", note: "High moisture — don't overload" },
  { id: "roasted_peppers",  name: "Roasted red peppers",       layer: "veg", cuisine: ["turkish","greek","northafrican"],   profile: "C", note: "Pat dry if jarred" },
  { id: "kalamata",         name: "Kalamata olives",           layer: "veg", cuisine: ["greek","levantine","neapolitan"],   profile: "C", note: "Pit, halve or slice" },
  { id: "green_olives",     name: "Green olives (Castelvetrano)", layer: "veg", cuisine: ["neapolitan","northafrican"],    profile: "S", note: "Buttery, mild" },
  { id: "artichoke",        name: "Artichoke hearts",          layer: "veg", cuisine: ["neapolitan","greek"],              profile: "S", note: "Pat dry, quarter" },
  { id: "caramelized_onion",name: "Caramelized onions",        layer: "veg", cuisine: ["french","turkish","american"],     profile: "C", note: "Cook down fully before adding" },
  { id: "red_onion",        name: "Red onion (thin sliced)",   layer: "veg", cuisine: ["greek","indian","mexican"],        profile: "C", note: "Quick pickle for less bite" },
  { id: "jalapeno_fresh",   name: "Jalapeño (fresh sliced)",   layer: "veg", cuisine: ["mexican","american"],              profile: "C", note: "Remove seeds for moderate heat" },
  { id: "jalapeno_pickled", name: "Pickled jalapeños",         layer: "veg", cuisine: ["mexican","american"],              profile: "C", note: "Add post-bake to preserve tang" },
  { id: "corn_charred",     name: "Charred corn",              layer: "veg", cuisine: ["mexican","american"],              profile: "S", note: "Cast iron or gas flame" },
  { id: "mushroom_cremini", name: "Cremini mushrooms (sliced)", layer: "veg", cuisine: ["neapolitan","american"],          profile: "C", note: "Sauté first to remove moisture" },
  { id: "mushroom_wild",    name: "Wild mushrooms (roasted)",  layer: "veg", cuisine: ["neapolitan"],                      profile: "E", note: "Maitake or oyster" },
  { id: "za_atar_onion",    name: "Za'atar-roasted onion",     layer: "veg", cuisine: ["levantine","turkish"],             profile: "S", note: "Roast at 400°F first" },
  { id: "eggplant_roasted", name: "Roasted eggplant",          layer: "veg", cuisine: ["levantine","turkish","greek"],     profile: "S", note: "Salt, drain, roast — no raw eggplant" },
  { id: "spinach",          name: "Baby spinach (wilted)",     layer: "veg", cuisine: ["indian","levantine","greek"],      profile: "C", note: "Add 90s before pull" },
  { id: "preserved_lemon",  name: "Preserved lemon (rinsed)",  layer: "veg", cuisine: ["northafrican","levantine"],       profile: "E", note: "Tiny amounts — very salty" },
  { id: "potato_thin",      name: "Thinly sliced potato",      layer: "veg", cuisine: ["neapolitan"],                     profile: "E", note: "Classic Neapolitan — blanch first" },
  { id: "beet_roasted",     name: "Roasted beet",              layer: "veg", cuisine: ["greek","northafrican"],           profile: "E", note: "Pairs with feta or goat cheese" },
  { id: "sun_dried_tom",    name: "Sun-dried tomatoes",        layer: "veg", cuisine: ["neapolitan","greek"],             profile: "S", note: "Drain from oil" },
  { id: "piquillo_peppers", name: "Piquillo peppers",          layer: "veg", cuisine: ["neapolitan","northafrican"],      profile: "S", note: "Sweet and smoky" },

  // ─── FINISH ────────────────────────────────────────────────
  // Applied post-bake or in last 30 seconds
  { id: "fresh_basil",      name: "Fresh basil",               layer: "finish", cuisine: ["neapolitan","greek","american"],   profile: "C", note: "Post-bake, always" },
  { id: "fresh_mint",       name: "Fresh mint",                layer: "finish", cuisine: ["levantine","turkish","greek"],     profile: "S", note: "Post-bake — Turkish classic" },
  { id: "fresh_cilantro",   name: "Fresh cilantro",            layer: "finish", cuisine: ["mexican","indian","northafrican"], profile: "C", note: "Post-bake" },
  { id: "flat_parsley",     name: "Flat-leaf parsley",         layer: "finish", cuisine: ["levantine","turkish","northafrican"], profile: "C", note: "Post-bake" },
  { id: "sumac_finish",     name: "Sumac (dusted)",            layer: "finish", cuisine: ["levantine","turkish","northafrican"], profile: "C", note: "Post-bake — lemony, essential" },
  { id: "za_atar_finish",   name: "Za'atar (sprinkled)",       layer: "finish", cuisine: ["levantine","turkish"],              profile: "C", note: "Post-bake or 30s before pull" },
  { id: "chaat_masala",     name: "Chaat masala (dusted)",     layer: "finish", cuisine: ["indian"],                          profile: "C", note: "Post-bake — tangy + umami" },
  { id: "finish_evoo",      name: "EVOO (high-quality drizzle)", layer: "finish", cuisine: ["neapolitan","greek","levantine"], profile: "C", note: "Post-bake, always" },
  { id: "lemon_zest",       name: "Lemon zest",                layer: "finish", cuisine: ["greek","levantine","northafrican"], profile: "S", note: "Post-bake — brightens everything" },
  { id: "hot_honey",        name: "Hot honey drizzle",         layer: "finish", cuisine: ["american"],                        profile: "S", note: "Calabrian-style — post-bake" },
  { id: "pomegranate_mol",  name: "Pomegranate molasses",      layer: "finish", cuisine: ["levantine","northafrican"],        profile: "E", note: "Post-bake — sweet-sour" },
  { id: "tahini_drizzle",   name: "Tahini drizzle",            layer: "finish", cuisine: ["levantine","northafrican"],        profile: "S", note: "Thin with lemon juice before drizzle" },
  { id: "red_chili_flakes", name: "Dried red chili flakes",    layer: "finish", cuisine: ["neapolitan","american","indian"],  profile: "C", note: "Post-bake" },
  { id: "dukkah",           name: "Dukkah (sprinkled)",        layer: "finish", cuisine: ["northafrican","levantine"],        profile: "E", note: "Nut-herb-spice blend — post-bake" },
  { id: "urfa_biber",       name: "Urfa biber flakes",         layer: "finish", cuisine: ["turkish"],                        profile: "S", note: "Dark, smoky, raisin-y heat" },
  { id: "pickled_red_onion",name: "Pickled red onion",         layer: "finish", cuisine: ["mexican","american","indian"],     profile: "S", note: "Post-bake contrast" },
  { id: "arugula",          name: "Arugula (dressed)",         layer: "finish", cuisine: ["neapolitan","greek"],              profile: "S", note: "Toss in lemon + EVOO — post-bake" },
  { id: "mango_chutney",    name: "Mango chutney drizzle",     layer: "finish", cuisine: ["indian"],                         profile: "S", note: "Thin with water — post-bake" },
  { id: "lime_crema",       name: "Lime crema (dolloped)",     layer: "finish", cuisine: ["mexican"],                        profile: "C", note: "Sour cream + lime juice" },
  { id: "green_harissa",    name: "Green harissa drizzle",     layer: "finish", cuisine: ["northafrican","levantine"],       profile: "E", note: "Herb-forward, fresher than red" },
];

// Profile unlock sets
const PROFILE_INCLUDES = {
  classic:  ["C"],
  standard: ["C","S"],
  explorer: ["C","S","E"],
};

// Layer metadata — used for display and ordering
const LAYER_META = {
  base:    { label: "Base",    icon: "🫒", order: 0, note: "Applied to raw dough before sauce" },
  sauce:   { label: "Sauce",   icon: "🍅", order: 1, note: "Defines the pizza identity" },
  cheese:  { label: "Cheese",  icon: "🧀", order: 2, note: "Goes on sauce, under most toppings" },
  protein: { label: "Protein", icon: "🥩", order: 3, note: "Pre-cook all proteins — raw poultry is never OK" },
  veg:     { label: "Veg",     icon: "🫑", order: 4, note: "Some go pre-bake, some post — see notes" },
  finish:  { label: "Finish",  icon: "✨", order: 5, note: "Post-bake garnish, drizzle, or dusting" },
};

const LAYER_ORDER = ["base","sauce","cheese","protein","veg","finish"];

// Cook guidance per oven type
const OVEN_GUIDANCE = {
  dome: {
    label: "Gozney Dome",
    temp: "850–950°F (450–510°C) stone",
    time: "60–90 seconds",
    tips: [
      "Rotate 45° every 15–20s",
      "Watch for leopard spotting on crust",
      "Dome lid controls top heat — open slightly for even browning",
      "High-moisture toppings (buffalo mozz, fresh tomato) go post-bake or last 10s only",
    ]
  },
  steel: {
    label: "Baking Steel",
    temp: "Top rack, broiler on — steel at 550°F+ after 1hr preheat",
    time: "4–6 minutes",
    tips: [
      "Launch on parchment, remove paper after 90s",
      "Finish under broiler for top color",
      "More forgiving with toppings moisture vs. Dome",
      "Rotate once at 3 min mark",
    ]
  }
};
