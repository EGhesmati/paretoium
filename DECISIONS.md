# Project Decisions & Defense Log

This log records major architectural choices, trade-offs, and justifications made throughout development. It serves as defense preparation notes.

---

### Day 1: Architecture & Workspace Setup
- **Decision**: Adopted a monorepo structure separating the Go optimizer service (`services/optimizer`) and Next.js frontend (`apps/web`).
- **Rationale**: Isolates backend pathfinding performance and dependency boundaries while ensuring clean, low-overhead HTTP communication via JSON APIs.

### Day 2: Domain Models & Prerequisite Representation
- **Decision**: Modeled course dependencies as directed prerequisite edges equipped with explicit `GroupType` (`AND` / `OR`) and `GroupID` fields, rather than monolithic nested expressions or flat adjacency lists.
- **Rationale**: Supports flexible curriculum rules (e.g. elective branches where 1 of N prerequisites suffices) while remaining directly convertible into directed graphs for Gonum topological validation and Pareto pathfinding.

### Day 3: Test Dataset & Cycle-Detection Test Harness (TDD)
- **Decision**: Established a 15-node baseline curriculum (`testdata/curriculum.json`) and authored intentionally failing cycle tests (`internal/validator`) prior to writing graph traversal logic.
- **Rationale**: Adheres to strict Test-Driven Development (TDD) ensuring that direct cycles, multi-hop indirect cycles, and self-loops have dedicated failure assertions before Gonum topological sorting is implemented on Day 4.

- Day 4: Selected Gonum Topo for cycle detection using Johnson's algorithm.


