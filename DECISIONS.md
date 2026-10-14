# Project Decisions & Defense Log

This log records major architectural choices, trade-offs, and justifications made throughout development. It serves as defense preparation notes.

---

### Day 1: Architecture & Workspace Setup
- **Decision**: Adopted a monorepo structure separating the Go optimizer service (`services/optimizer`) and Next.js frontend (`apps/web`).
- **Rationale**: Isolates backend pathfinding performance and dependency boundaries while ensuring clean, low-overhead HTTP communication via JSON APIs.

