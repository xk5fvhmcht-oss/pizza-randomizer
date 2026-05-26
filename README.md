# Omar's Pie 🍕

A Neapolitan pizza topping randomizer built for one kitchen, one palate, and two ovens.

**Live app:** https://xk5fvhmcht-oss.github.io/pizza-randomizer/

---

## What it is

Omar's Pie generates complete, layered pizza builds — base through finish — using a cuisine-anchored randomizer that understands flavor logic, not just random selection. Every roll is coherent. Every topping has a cook note. Every protein tells you whether to pre-cook it or trust the fire.

Pork-free by design. Biga dough assumed. Built for the Gozney Dome and baking steel.

---

## How it works

**Three-step flow:**

1. **Pick a flavor direction** — choose one or two cuisine themes. The app highlights natural pairings and warns you about clashes. Hard cap at 2: pizza is a single surface, not a board.

2. **Choose your sauce** — the sauce anchors the entire build. Once chosen, every topping from cheese through finish is weighted toward ingredients that pair with that sauce's flavor family. Tomato is universal. Shakshuka stays North African. Tomatillo stays Mexican.

3. **Roll** — toppings come out in strict layer order: base → sauce → cheese → protein → veg → finish. Per-card controls let you pin (always include), swap (reroll just that slot), or ban (never show again).

---

## Cuisines

Neapolitan · Levantine · Turkish · Greek · Mexican · American · North African · Indian

Fusion pairs that work: Neapolitan + Greek, Levantine + Turkish, Levantine + North African, Turkish + Greek, and more. The app highlights these automatically.

---

## Oven modes

**Gozney Dome** — 850–950°F stone, 60–90 second bake. Raw-on proteins (lahmajun spread, egg, shrimp) are safe at this temperature with thin application. Rotate every 15–20 seconds.

**Baking Steel** — 550°F broil, top rack, 4–6 minutes. Raw-on shrimp and egg get a different note here — add at the 3-minute mark only.

---

## Protein prep logic

Every protein carries a prep status:

| Badge | Meaning |
|---|---|
| 🟢 Ready | Cured or preserved — just needs heat |
| 🟡 Raw-on | Goes on raw, cooks with the pizza |
| 🔴 Pre-cook | Must be fully cooked before adding |

Poultry is always 🔴. No exceptions. The app enforces this in the cook notes.

---

## Stores

Toppings are tagged to three stores in Plano/Richardson, TX:

- **Central Market** (Plano) — Italian imports, specialty cheeses, Mexican ingredients, Western pantry
- **Sara's Market & Bakery** (Richardson) — halal meats, Levantine pantry, North African jarred goods, fresh-baked pita
- **Altin Grocery** (Plano) — Turkish dairy, kashkaval, urfa biber, Turkish spices

Store tags appear on every topping card and in the library view.

---

## Complexity levels

| Level | What unlocks |
|---|---|
| Classic | Proven, familiar combinations |
| Curated | Elevated and approachable — the interesting stuff |
| Explorer | The full library, including unusual pairings |

---

## Files

```
pizza-randomizer/
├── index.html          — App shell, 5 screens
├── style.css           — Day + night mode, full design system
├── app.js              — Randomization engine, UI logic, sauce anchor system
├── data.js             — 85+ toppings, sauce families, store tags, prep status, oven guidance
├── sw.js               — Service worker with versioned cache
├── manifest.json       — PWA manifest
├── icon-192.png
├── icon-512.png
└── apple-touch-icon.png
```

---

## Versioning

One line to bump. In `data.js`:

```js
const APP_VERSION = "1.1.0";  // ← change this
```

The service worker cache is named `omars-pie-v{VERSION}`. Bumping the version invalidates the old cache on next visit and shows the amber "New version available → Reload" banner.

**Convention:**
- New toppings or cuisines → bump MINOR (`1.1.0 → 1.2.0`)
- Bug fixes, note edits → bump PATCH (`1.1.0 → 1.1.1`)
- New screens or major logic changes → bump MAJOR (`1.1.0 → 2.0.0`)

Also update the cache name in `sw.js` to match.

---

## Day / Night mode

☀️ Day mode — warm parchment, flour-dusted off-white, terracotta accents. For planning and shopping.

🌙 Night mode — deep charcoal, ember orange, Dome glow. For the firing session.

Toggle with the moon/sun icon in the header. Preference saved locally.

---

## Related

[Omar's Board & Graze](https://xk5fvhmcht-oss.github.io/board-and-graze/) — charcuterie board randomizer, same kitchen
