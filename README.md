# NOCTIS — The City is Asleep

> A minimal, single-page scrollytelling experience for NOCTIS, a fictional electric car brand.  
> Mood: A city in total blackout at night where the car's light is the only light in the world. Quiet, expensive, precise.

---

## ⚡ Technical Highlights

- **Pure Vanilla Stack**: Zero frameworks, zero build tools, zero npm runtime packages, zero animation libraries. Pure HTML5, CSS3, and modern JavaScript (ES6+).
- **Canvas-Driven Scrollytelling**: High-performance frame-scrubbed image sequences drawn onto responsive `<canvas>` elements scaled by `devicePixelRatio` (capped at 2).
- **Dual Responsive Image Sequences**:
  - **Hero**: 598 seamless WebP frames (`1600px` desktop / `960px` mobile) joined continuously across 3 source clips.
  - **Dismantle**: 200 WebP frames (`1600px` desktop / `960px` mobile) exploding the structural architecture.
- **Strict Aesthetic Architecture**:
  - Solid color tokens: `--asphalt` (`#07080A`), `--graphite` (`#121418`), `--bone` (`#EDEAE4`), `--xenon` (`#CFE3FF`), `--taillight` (`#E1251B`).
  - No gradients, no glassmorphism / backdrop-filters, no glows, no drop shadows, no bubbly rounded cards.
- **Custom Cursor ("The Headlight")**:
  - 6px xenon dot inside a 28px ring following the pointer with `0.18` lerp.
  - Morphs into a 44x2px horizontal light bar with contextual mono labels (`VIEW`, `RESERVE`, `OPEN`, `CONFIGURE`).
- **Telemetry HUD**: Left-edge HUD tracking active chapter, velocity counter (`000` → `118 KM/H`), and distance (`0.0` → `4.2 KM`).
- **Lineup Accordion**: 5 models (`GT-E`, `S`, `X`, `R`, `ONE`) with debounced 80ms hover expansion, 6% car entrance translation, color swatches, and keyboard navigation.

---

## 🚀 Getting Started

Run with any static local server (e.g. VS Code Live Server or Node.js):

```bash
# Using Node built-in server script:
node server.js
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
├── assets/
│   ├── cars/                 # Model lineup WebP studio portraits
│   └── frames/               # Prepared WebP sequences (desktop + mobile)
│       ├── hero/
│       ├── hero-mobile/
│       ├── dismantle/
│       └── dismantle-mobile/
├── config.js                 # Tuning parameters, heights, coordinates & ranges
├── index.html                # Semantic HTML5 markup
├── main.js                   # Scrollytelling engine, frame loader & rAF loop
├── styles.css                # CSS design system & responsive layout
└── server.js                 # Zero-dependency local development server
```

---

## 📄 License
© 2026 NOCTIS. Fictional concept brand. All rights reserved.
