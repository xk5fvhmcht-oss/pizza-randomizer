# Omar's Pie — v2.6.0

**From the familiar to the exceptional**

A Neapolitan pizza topping randomizer and culinary reference tool built for a Gozney Dome and Baking Steel home setup. Pork-free. Eight cuisines. Three stores. Two ovens. 149 ingredients. 45 hand-built Classics.

---

## What it is

Omar's Pie is two things in one:

**The Builder** — an intelligent engine that rolls pizza builds across eight cuisines and three complexity ranges. Every recommendation is grounded in culinary principle: moisture budgets, flavor contrast, sauce identity, primary/secondary cuisine scoring, cheese preference by tradition, protein necessity, finish gap-fill, surface coverage awareness.

**The Classics** — 45 hand-built pizzas from eight cuisines, presented faithfully with historical context, technique notes and chef guidance. Not random — established. The engine doesn't touch these.

---

## The Eight Cuisines

| Emoji | Cuisine | Character |
|---|---|---|
| 🍅 | Neapolitan | AVPN tradition, San Marzano, fior di latte, restraint |
| 🫓 | Levantine | Za'atar, labneh, akawi, sumac, pomegranate |
| 🫕 | Turkish | Kaşar, biber salçası, sujuk, basturma, Dome technique |
| 🫒 | Greek | Feta, kalamata, tzatziki, oregano, EVOO |
| 🪔 | North African | Harissa, chermoula, merguez, preserved lemon, dukkah |
| 🌶️ | Mexican | Tomatillo, cotija, chipotle, chorizo, cilantro |
| 🧀 | American | Pepperoni, BBQ, cheddar, gorgonzola, craft pizza tradition |
| 🫚 | Indian | Tikka, makhani, paneer, chaat masala, nigella |

---

## Three Ranges

**Traditional** — Familiar ingredients, recognizable combinations. The engine stays close to the sauce and cuisine. Cheese preference weights heavily toward the first-reach cheese for each tradition.

**Elevated** — Worth seeking out. Ingredients that require some knowledge or a specific store trip. The engine opens up to contrast and cross-cultural influence. Chef's Touch activates.

**Connoisseur** — Singular and unique. Maximum 3 pre-bake items. At least one C-profile ingredient. The engine is ruthless about uniqueness and gap-fill. Chef's Touch activates. Role badges (anchor/supporting/accent) appear on ingredient cards.

---

## The Engine

### Primary / Secondary Cuisine
The first cuisine selected is the **primary** — it owns the sauce, cheese and protein layers. The second is the **influence** — it expresses itself in the finish layer and shares the veg layer equally. Selecting Indian then Levantine produces a fundamentally different pizza than Levantine then Indian.

Visual distinction: primary tile = solid terracotta border. Secondary tile = dashed gold border.

### Scoring System
Every candidate is scored before selection — not shuffled randomly:

```
score = base(1.0)
  + gapFill (notes not yet in build) × range weight
  + primaryFoundation / secondaryFoundation (by layer)
  + sauceAffinity (item in sauce family)
  + presenceBalance (accent when anchor+supporting present)
  + cheesePreference (cuisine/sauce ordered preference)
  - redundancy (doubles existing note, unless amplifying pair)
```

Weights vary by range. Traditional stays close to sauce and cuisine. Connoisseur maximises uniqueness and contrast.

### Coverage Awareness
The engine understands that undressed dough at 900°F Dome temperature will puff dramatically. When a build has no sauce and no melt cheese, it forces a melt cheese in or flags a docking warning. Crumble-only cheese (feta, shanklish, ricotta) on a bianca also triggers the docking flag.

### Sauce-Forward Detection
When no cheese and no protein are present on a sauced pizza, the engine flags a sauce-forward build and boosts finish scoring toward aromatics that amplify the sauce — oregano, herbs, EVOO.

### No-Cheese Fat Compensation
When cheese is absent on tomato or spicepaste builds, rendering proteins (pepperoni, sujuk, nduja, diavola, chorizo, merguez) score higher and EVOO finish is boosted. The pizza needs fat from somewhere.

### Chef's Touch
After every Elevated or Connoisseur roll, the engine scans finish candidates not in the build and suggests one optional accent — the item that adds the most missing flavor dimension for this cuisine and sauce combination. Shown separately with a specific reason why it works. Baker can ignore or add to the build.

### Protein Necessity Check
Protein probability adjusts based on build context:
- Heavy build (weight ≥ 6) → probability × 0.3
- No cheese → probability + 0.3
- Dairy sauce → probability × 0.6
- 2+ high-umami items → probability × 0.4

### Feta Companion Rule (Traditional only)
Feta alone on tomato sauce → engine adds a melt cheese companion automatically.

---

## The Classics

45 hand-built pizzas across 8 cuisines. Each has:
- Historical context
- Full ingredient list using the same topping database
- Chef notes grounded in published culinary technique
- Docking guidance where relevant (manakish, light biancas)
- Technique corrections (anchovy post-bake, halloumi pre-sear, mushroom pre-cook)

Accessible from The Classics tile alongside the cuisine grid. Collapsible by cuisine. Scroll position remembered.

When opened in the builder: swap and remove on every ingredient, no anchor, no permanent exclude, "Modified from original" banner when changed.

---

## Ingredient Database

**149 toppings across 6 layers:**

| Layer | Count | Notes |
|---|---|---|
| Base | 8 | EVOO, garlic oil, harissa, BBQ, chipotle, tikka paste, za'atar oil |
| Sauce | 13 | San Marzano, shakshuka, pesto, béchamel, labneh, tzatziki, hummus, muhammara, chermoula, biber salçası, tikka, makhani, tomatillo, roja, nosause |
| Cheese | 24 | Including kaşar peyniri, beyaz peynir, gorgonzola dolce/piccante, tulum, mihalıç |
| Protein | 21 | Including beef shawarma, anchovy (post-bake), bresaola (post-bake), basturma (post-bake) |
| Veg | 39 | Including fresh sliced tomato, roasted beet |
| Finish | 44 | Including fresh thyme, labneh balls |

**Three stores:**
- Sara's Market, Richardson
- Central Market, Plano
- Altin Grocery, Plano

**Every ingredient has:**
- Cuisine tags (where it genuinely belongs — not just origin)
- Profile (T/E/C)
- Sauce family compatibility
- Moisture, weight, presence classifications
- Flavor notes (drives scoring and conflict detection)
- Technique note grounded in published culinary sources
- Store availability and purchase quantities

---

## Cuisine Affinity System

Three visual states when a cuisine is selected:

**Strong affinity (green glow)** — natural flavor partners. Neapolitan+Levantine, Levantine+Turkish, Turkish+Greek, Mexican+American etc.

**Weak affinity (amber glow)** — interesting combinations worth exploring. Neapolitan+Turkish, North African+Indian etc.

**Clash (dimmed)** — genuinely incompatible flavor languages. A warning appears but the baker can proceed. Neapolitan+Mexican, Greek+Indian, American+Indian etc.

**Neutral** — no recommendation either way. Neapolitan+American, Turkish+American.

---

## Guided Swap System

Tapping swap on any ingredient cycles through a curated sequence:

1. **Original** (position 1, shown in green) — always first, always returnable
2. **Similar** — same flavor notes, same presence, same cuisine
3. **Reasonable** — same cuisine, compatible sauce family
4. **Broader** — cuisine overlap
5. **Full pool** — everything remaining

Counter shows position (e.g. `orig`, `2/6`, `3/6`). Sequence repeats. Calculated on demand respecting current build state. Cleared on every new roll.

---

## History

Saves only on meaningful interaction — add to list, save pie, or swap. Maximum 5 entries, persisted across sessions. After 5 new meaningful interactions old entries drop off.

---

## Shopping List

Session-based, multi-build, store-optimized. Calculates quantities per ingredient across all planned pizzas. Groups by store. Pantry items separated. Make-ahead items flagged. Sauce-forward builds show a quantity warning. Checkable in-app, printable, copyable.

---

## Technical

**Stack:** Vanilla JS, CSS custom properties, HTML5. No framework. No build step.

**PWA:** Service worker, offline capable, installable on iOS and Android.

**Oven modes:**
- Gozney Dome: 850-950°F, 60-90 seconds. Post-bake is the primary technique for heat-sensitive items.
- Baking Steel: 550°F broil, 4-6 minutes. Mid-bake additions possible.

**Biga dough** assumed throughout. 270g dough balls. 10-12 inch pizza.

---

## Culinary Principles Encoded

The app embeds these principles in scoring, conflicts, technique notes and coverage detection:

1. **Sauce identity** — every pizza is described by its sauce first
2. **Primary/secondary cuisine** — first selection owns foundation, second influences finish
3. **Coverage awareness** — undressed dough at Dome temp balloons. Docking required when coverage is insufficient.
4. **Thin layer principle** — raw ground beef/lamb spread thin cooks completely at any oven temperature (lahmajun/isfeeha tradition)
5. **Post-bake items** — anchovy, basturma, bresaola, burrata, truffle oil, fresh basil, hot honey, balsamic, pomegranate molasses — never in the Dome
6. **Moisture management** — fresh mushrooms, eggplant and spinach must be pre-cooked
7. **Halloumi and paneer** — must be pre-seared before adding to pizza
8. **Feta timing** — last 30-45 seconds at Dome max, or post-bake
9. **Bufala** — post-bake as finishing cheese for best results
10. **Docking** — required on nosause builds without melt cheese coverage

---

## Version History

| Version | Key changes |
|---|---|
| v2.6.0 | Chef's Touch, no-cheese fat compensation, swap similarity tuning |
| v2.5.x | Coverage awareness, docking detection, history meaningful-only, Harissa Chicken fix, full knowledge audit applied |
| v2.4.x | Primary/secondary cuisine engine, guided swap with similarity scoring, knowledge audit corrections, 40+ technique note updates |
| v2.3.0 | Full culinary audit — 52 cuisine corrections, profile corrections, new cheeses |
| v2.2.x | Library collapsible sections + cuisine filters, Classics collapsible, scroll memory, kaşar + beyaz peynir |
| v2.1.0 | Scoring engine rewrite — offensive not defensive |
| v2.0.x | The Classics screen, 45 hand-built pizzas, engine cleanup, manakish/lahmajun to Classics |
| v1.5.x | Chef-driven engine, flavour direction, cuisine affinities |
| v1.0.x | Initial build — smart roll engine, budget tracking |

---

*Omar's Pie — built for a Gozney Dome in North Texas.*
*Pork-free. Halal. From the familiar to the exceptional.*
