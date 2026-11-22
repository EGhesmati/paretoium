---
target: "apps/web/src/app/page.tsx"
slug: "apps-web-src-app-page"
date: "2026-11-22"
total_score: 23
max_score: 40
na_heuristics: ""
p0_count: 0
p1_count: 3
p2_count: 2
p3_count: 0
---

Method: dual-agent (A: `3101ff8b-682d-4412-b8b2-831898515fb1` · B: `7186b641-a093-417b-8c9f-7c219812685b`)

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Strong live telemetry (`Neon DB`/`Gemini AI` pills, `STEP N` badges, `% Topic Coverage`), but generating a new curriculum (`generatingGraph`) shows no canvas loading overlay, and dragging any slider silently resets `pathMode` to `deep_mastery`. |
| 2 | Match System / Real World | 2 | "Difficulty Cap: 25" exposes the raw integer sum of node difficulty points (1–5 scale summed across path nodes) without context; Target Milestone `<select>` lists already-completed root courses (`CS101`) as goals. |
| 3 | User Control and Freedom | 2 | Dragging any constraint slider overrides an explicit `Express` selection back to `Deep Mastery`. Single-clicking a quick-topic chip immediately overwrites the graph and wipes completion progress with no undo. |
| 4 | Consistency and Standards | 2 | Three competing visual systems: `/login` and `AuthNav` use a sage/navy palette (`#f5f9f8`, `#131b2b`, `#cfe0dc`), `/` uses Tailwind `slate`/`teal`/`indigo`, and `globals.css` holds ~590 lines of dead legacy CSS. |
| 5 | Error Prevention | 2 | Users can select root/completed courses (`CS101`) as their Target Milestone; quick-topic chips trigger destructive graph replacement on one click; sliders permit contradictory bounds without showing the current graph's minimum feasible hours. |
| 6 | Recognition Rather Than Recall | 3 | Inline telemetry on Express/Deep Mastery buttons (`165h · 5c`), clickable prerequisite chips in the inspector, and `STEP N` badges work well, but dimmed off-path nodes (`opacity-40 saturate-50`) become nearly illegible until hovered. |
| 7 | Flexibility and Efficiency | 2 | Preset buttons (`★ Cover 100% All Topics`, quick topics) and dual `Interactive Graph` / `Step-by-Step Roadmap` views help, but there are zero keyboard shortcuts, no `Esc` to close the inspector, and no modifier-click to mark nodes done directly on the canvas. |
| 8 | Aesthetic and Minimalist Design | 2 | Two heavy full-width control cards (~360px tall, 13+ controls) stack above the canvas; system `Arial, Helvetica` fallback lacks typographic craft; inspector panel (`max-h-[540px]`) mismatches the `580px` canvas height by 40px. |
| 9 | Error Recovery | 3 | Infeasible constraints report exact values (`No route fits within Xh / difficulty Y / depth Z`) and AI rate limits degrade gracefully to deterministic fallbacks. Missing a one-click "Auto-relax constraints" recovery button. |
| 10 | Help and Documentation | 2 | The 3-card "How Paretoium Works" section summarizes the concept, but there is no inline explanation of how cumulative "Difficulty Cap (5–50)" is computed or any canvas prompt in Graph view telling first-timers to click a node for the AI Study Guide & Quiz. |
| **Total** | | **23/40** | **Acceptable (57.5%) — Significant improvements needed** |

### Priority Issues

1. **[P1] Constraint Sliders Silently Override User's Path Strategy & Expose Raw Cumulative Difficulty Sums** (`/impeccable clarify`)
2. **[P1] Conflated Information Architecture Above the Canvas (Generative Topic Replacement Mixed with Live Graph Constraints)** (`/impeccable layout`)
3. **[P1] Keyboard, ARIA, and Contrast Failures Across Graph Nodes, Roadmap Cards, and Segmented Controls** (`/impeccable harden`)
4. **[P2] Split Visual Identity Across `/`, `/login`, `AuthNav`, System Arial Fallback, and ~590 Lines of Dead CSS** (`/impeccable typeset` / `/impeccable polish`)
5. **[P2] Flat Text-Only Pareto Frontier Explorer, Unpersisted Quiz Progress, and Missing Canvas Generation Overlay** (`/impeccable delight`)
