---
name: Paretoium
description: Warm cartographic workbench for multi-objective curriculum path optimization and AI-assisted study.
colors:
  terracotta-coral: "#e76f51"
  terracotta-ink: "#a63a20"
  terracotta-soft: "#fdeee9"
  veridian-jade: "#36ba98"
  veridian-ink: "#166b56"
  veridian-soft: "#ebf9f5"
  apricot-amber: "#f4a261"
  saffron-gold: "#e9c46a"
  saffron-ink: "#785610"
  saffron-soft: "#fcf6e3"
  alabaster-ground: "#faf7f2"
  warm-paper: "#ffffff"
  sandstone-well: "#f2ece1"
  drafting-canvas: "#f5f0e6"
  espresso-ink: "#1c1915"
  umber-secondary: "#595147"
  taupe-muted: "#857b6e"
  stone-border: "#e4ddd0"
  stone-border-strong: "#cfc5b4"
  charcoal-ground-dark: "#141210"
  umber-surface-dark: "#1d1a17"
  ivory-ink-dark: "#f5f0e8"
typography:
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0em"
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.02em"
  mono:
    fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0em"
rounded:
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "12px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.espresso-ink}"
    textColor: "{colors.alabaster-ground}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-secondary:
    backgroundColor: "{colors.warm-paper}"
    textColor: "{colors.espresso-ink}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  button-express-tab:
    backgroundColor: "{colors.terracotta-coral}"
    textColor: "{colors.warm-paper}"
    rounded: "{rounded.sm}"
    padding: "8px 8px"
  button-mastery-tab:
    backgroundColor: "{colors.veridian-jade}"
    textColor: "{colors.charcoal-ground-dark}"
    rounded: "{rounded.sm}"
    padding: "8px 8px"
  input-field:
    backgroundColor: "{colors.alabaster-ground}"
    textColor: "{colors.espresso-ink}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
  course-node:
    backgroundColor: "{colors.warm-paper}"
    textColor: "{colors.espresso-ink}"
    rounded: "{rounded.md}"
    width: "204px"
    padding: "10px 12px"
---

# Design System: Paretoium

## Overview

**Creative North Star: "The Cartographer's Drafting Desk"**

Paretoium is an Operate-mode academic workbench designed to feel like a calm, tactile drafting desk rather than a generic SaaS dashboard. Every surface is built from warm mineral paper and espresso ink in light mode, inverting cleanly to deep warm charcoal and ivory in dark mode, while reserving saturated color strictly for route semantics and graph state.

The interface prioritizes scannability, hierarchical clarity, and zero visual noise. Prerequisite graphs use top-down Dagre hierarchy with orthogonal stepped connectors and compact flat course tiles so complex multi-track curricula read at a glance without floating drop-shadow clutter.

**Key Characteristics:**
- Warm alabaster and sandstone neutral hierarchy paired with deep espresso ink (`#1c1915`).
- Strict two-route color encoding: Terracotta Coral for Express (Min Hours) and Veridian Jade for Deep Mastery (Max Coverage & Depth).
- Flat-by-default surfaces separated by 1px hairline stone borders (`#e4ddd0`), reserving shadows only for floating overlays.
- Native system sans-serif paired with tabular monospace (`tabular-nums`) for course codes, hours, and Pareto trade-off metrics.
- Full Light and Dark mode parity driven by CSS custom properties (`:root` and `html.dark`).

## Colors

The palette pairs warm mineral neutrals with four purposeful mid-saturation accents (`#e76f51`, `#36ba98`, `#f4a261`, `#e9c46a`) and high-contrast ink variants for accessible small text.

### Primary
- **Terracotta Coral** (`terracotta-coral`): Marks the **Express (Min Hours)** route, active Express edges, step badges, Time Budget slider, focus rings, and Common Pitfalls callouts.
- **Terracotta Ink** (`terracotta-ink`) on **Terracotta Soft** (`terracotta-soft`): Used for small error alerts, undo links, and pitfall body text so contrast stays above 4.5:1.

### Secondary
- **Veridian Jade** (`veridian-jade`): Marks the **Deep Mastery (Max Coverage & Depth)** route, active Mastery edges, completed course indicators, Difficulty Cap slider, and Mastery Verified states.
- **Veridian Ink** (`veridian-ink`) on **Veridian Soft** (`veridian-soft`): Used for Mental Model callouts, quiz pass banners, and high-coverage badges.

### Tertiary
- **Apricot Amber** (`apricot-amber`): Highlights available/ready node status dots, Max Courses slider, Pareto Frontier curve lines, and selected-node focus rings.
- **Saffron Gold** (`saffron-gold`) with **Saffron Ink** (`saffron-ink`) on **Saffron Soft** (`saffron-soft`): Signals advanced-difficulty status dots, Foundation Gap warnings, and AI fallback mode notices.

### Neutral
- **Alabaster Ground** (`alabaster-ground`): Primary page canvas behind workbench panels (`#faf7f2` light / `#141210` dark).
- **Warm Paper** (`warm-paper`): Elevated workbench panels, header bar, course tiles, and inspector surface (`#ffffff` light / `#1d1a17` dark).
- **Sandstone Well** (`sandstone-well`): Recessed segmented tablist tracks, preset chips, and metadata badges (`#f2ece1` light / `#26221e` dark).
- **Drafting Canvas** (`drafting-canvas`): React Flow graph background (`#f5f0e6` light / `#181512` dark).
- **Espresso Ink** (`espresso-ink`), **Umber Secondary** (`umber-secondary`), and **Taupe Muted** (`taupe-muted`): Three-step warm text hierarchy.

### Named Rules
**The Semantic Route Rule.** Terracotta Coral always means Express (Min Hours) and Veridian Jade always means Deep Mastery or Completed. Never use either color for unrelated decorative chrome.
**The Paired-Ink Rule.** Because mid-tone accents (`#e76f51`, `#36ba98`, `#e9c46a`) can fall below 4.5:1 as small text on white, always pair small labels with their `-ink` token on their `-soft` tint, or use dark espresso text on filled Jade/Saffron pills.

## Typography

**Display & Body Font:** `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", system-ui, sans-serif`
**Label / Mono Font:** `"SF Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`

**Character:** Workhorse geometric-humanist system sans keeps labels, controls, and 4-page study prose crisp without display-font distraction, while monospace with `tabular-nums` aligns course codes (`CS101`), hour budgets, and Pareto scatter coordinates.

### Hierarchy
- **Headline** (700, `1.25rem`–`1.5rem`, line-height `1.25`, tracking `-0.02em`): Page title (`Curriculum Path Optimizer`, `Sign in to your account`).
- **Title** (700, `1rem`, line-height `1.35`): Inspector course title, active graph header, and study-guide chapter headings.
- **Body** (400, `0.875rem`, line-height `1.5`): Subtitle copy, study guide sections, and quiz questions.
- **Label** (600, `0.75rem`, line-height `1.3`): Control labels, segmented tabs, buttons, and status pills.
- **Mono** (600, `0.75rem`, `tabular-nums`): Course codes, route chains (`CS101 → WEB101`), and numeric telemetry (`110h · D3`).

### Named Rules
**The Tabular Telemetry Rule.** Every numeric counter (hours, difficulty sum, coverage percentage, quiz score) uses `tabular-nums` so dragging constraint sliders never causes layout jitter.

## Layout

The primary workspace uses a **three-zone workbench** capped at `1440px` max width (`16px`–`24px` outer padding, `12px` internal gap):
1. **Top Curriculum Bar**: Single-row topic input, `Generate Graph` action, `Reset CS` action, and quick subject presets.
2. **Left Control Rail (`300px` fixed on `lg+`, `640px` height)**: Target Milestone selector, `Express` vs. `Deep Mastery` segmented strategy control, constraint sliders, live route telemetry, and constraint-relaxation recovery.
3. **Center Graph / Roadmap Canvas (`flex-1`, `640px` height on `lg+`)**: Floating top toolbar (`Graph` / `Roadmap`, `Hierarchy ↓` / `Flow →`), optional Pareto Frontier scatter popover (`372px`), and subtle bottom keyboard hint.
4. **Right Docked Course Inspector (`400px` compact / `540px` expanded on `lg+`, `640px` height)**: Opens on node selection without covering the graph; matches the `640px` canvas height on desktop and stacks cleanly below on mobile.

## Elevation & Depth

Surfaces are **flat by default**, using tonal layering between Alabaster Ground (`#faf7f2`), Warm Paper (`#ffffff`), and Sandstone Well (`#f2ece1`) plus `1px solid` stone borders (`#e4ddd0`).

### Shadow Vocabulary
- **Panel Subtle** (`box-shadow: 0 1px 3px rgba(30, 25, 21, 0.04)`): Resting elevation for top bar, left rail, canvas frame, and inspector.
- **Floating Popover** (`box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1)`): Reserved exclusively for the floating Pareto Frontier Explorer drawer and React Flow controls.

### Named Rules
**The Flat-Tile Rule.** Graph course nodes carry zero drop shadows at rest; active route membership is communicated by a `1.5px` Terracotta or Jade border, and non-path nodes step back to `50%` opacity.

## Shapes

Corners follow a restrained, crisp **8px–12px** scale suited to dense technical tools:
- **Outer Workbench Containers** (`12px` radius): Top curriculum bar, left rail, canvas frame, inspector panel, and roadmap cards.
- **Interactive Controls & Course Tiles** (`8px` radius): Buttons, inputs, select menus, course nodes (`204px × 72px`), and study-guide callout boxes.
- **Segmented Tabs & Micro-Badges** (`4px`–`6px` radius): Tab buttons inside `8px` wells, step badges, and status tags.
- **Graph Connectors**: Orthogonal `smoothstep` edges with `6px` corner radius (`borderRadius: 6`) and clean closed arrowheads—never swooping Bezier spaghetti or animated dashed ants.

## Components

### Buttons
- **Shape:** `8px` radius (`rounded-lg`), `12px` font size, weight `600`.
- **Primary:** Espresso Ink background (`#1c1915` light / `#f5f0e8` dark) with inverted ground text (`#faf7f2` light / `#141210` dark), `8px 16px` padding.
- **Hover / Focus:** Shifts to `#332e27` (light) or `#e0d8cc` (dark); keyboard focus renders a `2px solid` Terracotta Coral outline with `2px` offset.
- **Secondary:** Warm Paper background with `1px solid` strong stone border (`#cfc5b4`), hovering to Sandstone Well (`#f2ece1`).

### Chips & Tabs
- **Segmented Tabs:** `4px` padding well in Sandstone Well with `1px solid` subtle border; active tab sits in Warm Paper (or Terracotta/Jade for Strategy tabs).
- **Prerequisite & Preset Chips:** `6px` radius, Sandstone Well background, `1px solid` subtle border, hovering to strong stone border.

### Cards / Containers
- **Corner Style:** `12px` radius (`rounded-xl`) for outer panels; `8px` radius (`rounded-lg`) for nested study-guide callouts.
- **Background:** Warm Paper (`var(--bg-surface)`) with Alabaster Ground (`var(--bg-ground)`) nested metric wells.
- **Border:** `1px solid var(--border-subtle)`.

### Inputs / Fields
- **Style:** `8px` radius, `1px solid var(--border-strong)`, Alabaster Ground fill (`var(--bg-ground)`), `8px 14px` padding.
- **Focus:** Transitions background to Warm Paper (`var(--bg-surface)`) and border to Terracotta Coral (`var(--accent-coral)`).

### Navigation
- **Top Bar:** Sticky `56px` (`h-14`) bar with `1px` bottom border, inline SVG `BrandLogo` mark, engine status badge, section links (`Workspace`, `Methodology`), `ThemeToggle` button, and `AuthNav`.

### Course Node Tile (Signature Component)
- **Dimensions:** `204px` wide compact tile (`10px 12px` padding, `8px` radius).
- **Anatomy:** Top row displays either a colored status dot or a solid `#N` / `GOAL` step badge + monospace course code on the left, and `Xh · DX` telemetry on the right; bottom row displays a 2-line clamped course title.

## Do's and Don'ts

### Do:
- **Do** use CSS custom properties (`var(--bg-surface)`, `var(--ink-primary)`, `var(--border-subtle)`) on all new UI elements so Light and Dark modes stay synchronized.
- **Do** preserve `pathMode` (`express` vs. `deep_mastery`) when users adjust constraint sliders.
- **Do** keep `Hierarchy ↓` (`TB` Dagre + `smoothstep` orthogonal edges) as the default graph layout.
- **Do** provide keyboard escape hatches (`Esc` to close inspector/drawers, `Alt+Click` to toggle completion).

### Don't:
- **Don't** introduce cold Tailwind `slate`/`indigo`/`teal` classes or neon cyan gradients.
- **Don't** add drop shadows, floating overlapping pills, or one-sided accent bars to `CourseNode` tiles.
- **Don't** place small white text on `#e9c46a` (Saffron) or `#f4a261` (Apricot)—use dark espresso ink (`#1c1915`) instead.
- **Don't** wrap study-guide sections in generic `01 / 02 / 03` marketing cards.
