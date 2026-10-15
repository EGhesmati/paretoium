# Project Decisions & Defense Log

This log records major architectural choices, trade-offs, and justifications made throughout development. It serves as defense preparation notes.

---

### Day 1: Architecture & Workspace Setup
- **Decision**: Adopted a monorepo structure separating the Go optimizer service (`services/optimizer`) and Next.js frontend (`apps/web`).
- **Rationale**: Isolates backend pathfinding performance and dependency boundaries while ensuring clean, low-overhead HTTP communication via JSON APIs.

### Day 2: Domain Models & Prerequisite Representation
- **Decision**: Modeled course dependencies as directed prerequisite edges equipped with explicit `GroupType` (`AND` / `OR`) and `GroupID` fields, rather than monolithic nested expressions or flat adjacency lists.
- **Rationale**: Supports flexible curriculum rules (e.g. elective branches where 1 of N prerequisites suffices) while remaining directly convertible into directed graphs for Gonum topological validation and Pareto pathfinding.


