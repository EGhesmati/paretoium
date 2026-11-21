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

### Day 4: Graph Validation & Cycle Detection
- **Decision**: Used Gonum Topo's `DirectedCyclesIn`, which implements Johnson's algorithm, to detect directed cycles in curriculum graphs.
- **Rationale**: Reuses a well-tested graph algorithm to validate the DAG invariant, and the 15-node sample plus direct, indirect, and self-loop tests now pass.

### Day 5: Cost Function Test Contract
- **Decision**: Defined cost as a weighted sum of study hours and difficulty, with independent caller-provided weights, and added tests for equal weighting, prioritization, and zero weights.
- **Rationale**: Makes the trade-off between time and difficulty explicit and configurable; the tests intentionally precede the Day 6 implementation.

### Day 6: Cost Function Implementation
- **Decision**: Implemented cost as `study hours * study-hours weight + difficulty * difficulty weight`.
- **Rationale**: Keeps the Day 5 contract transparent and lets callers control each factor's contribution without coupling the domain function to optimization policy.

### Day 7: Buffer
- **Decision**: Kept Day 7 as a buffer with no optimizer behavior or dependency changes, preserving room to resolve issues before edge-case work begins.

### Day 8: Edge-Case Tests
- **Decision**: Verified empty and single-node graphs through the public validator and clarified that zero-valued budgets mean no configured limit.
- **Rationale**: Covers graph validation boundaries and the default constraint behavior without changing optimizer semantics.

### Day 9: Edge-Case Validation
- **Decision**: Validate all course nodes and prerequisite references before populating the Gonum graph.
- **Rationale**: Rejects invalid or duplicate nodes and prevents failed graph builds from leaving partially populated state.

### Days 10–11: Pareto Label-Setting
- **Decision**: Propagate non-dominated study-hour and difficulty labels over the curriculum DAG in topological order.
- **Rationale**: Retains alternatives that trade study time for difficulty without reducing the problem to a single weighted score.

### Day 12: Frontier Bounds
- **Decision**: Cap each node's Pareto frontier at 500 labels, keeping the lowest-hours, then lowest-difficulty labels with deterministic path tie-breaking.
- **Rationale**: Bounds worst-case path growth while producing repeatable results.

### Day 13: Recommended Paths
- **Decision**: Select the minimum-hours frontier label as Express and the minimum-difficulty label as Deep Mastery, breaking ties by the other metric.
- **Rationale**: Exposes the two useful extremes of the frontier without discarding the alternatives.

### Day 14: Fuzz Coverage
- **Decision**: Fuzz the optimize HTTP handler with arbitrary request bodies in addition to table-driven algorithm tests.
- **Rationale**: Exercises malformed and adversarial JSON inputs for panics before deployment.

### Day 15: Optimizer HTTP API
- **Decision**: Expose `GET /healthz` and `POST /api/v1/optimize` through Chi, returning the frontier and recommended paths as JSON.
- **Rationale**: Keeps the Go engine accessible over the project's JSON HTTP boundary without introducing frontend concerns.

### Day 16: HTTP Hardening
- **Decision**: Limit optimize requests to 1 MiB and configure finite HTTP server read, write, and idle timeouts.
- **Rationale**: Bounds request processing and prevents slow or oversized clients from holding server resources indefinitely.

### Day 17: Optimizer Benchmarks
- **Decision**: Benchmark the Pareto optimizer on linear curricula from 50 to 500 nodes in 50-node increments.
- **Rationale**: Provides a repeatable baseline for observing optimizer cost as graph size grows.

### Day 18: Pull Request CI
- **Decision**: Run `go test ./...` on every pull request with the Go version declared by the optimizer module.
- **Rationale**: Makes the existing Go test suite a required automated check for proposed changes.

### Day 19: Backend Integration & Release
- **Decision**: Integrate the completed Go backend into `main` through a pull request, then publish the `v0.1` tag after CI passes.
- **Rationale**: Uses the repository's configured default branch as the release target and ties the initial backend release to the existing automated test gate.

### Day 20: Buffer
- **Decision**: Keep Day 20 as a stabilization buffer without adding optimizer behavior or dependencies.
- **Rationale**: The optimizer test suite and `go vet` pass, so the buffer preserves a clean checkpoint before starting the next phase.

### Day 21: Next.js Web Foundation
- **Decision**: Scaffold `apps/web` as a Next.js App Router application using TypeScript and Tailwind CSS.
- **Rationale**: Establishes the frontend workspace independently from the Go optimizer; API integration and graph visualization remain in their scheduled later days.
- **Visual direction**: Use a Mozilla Protocol-inspired editorial layout with accessible contrast and purple accents, without Mozilla branding or assets.

### Day 22: Prisma Data Model
- **Decision**: Define PostgreSQL models for users, courses, topic nodes, directed graph edges, and saved user path history using Prisma.
- **Rationale**: Establishes the database contract for seeded curricula and per-user progress while keeping Neon connection and migrations as separate Day 23 work.

### Day 23: Neon Database Connection
- **Decision**: Configure Prisma 7 for Neon PostgreSQL with an environment-backed `DATABASE_URL`, the `pg` adapter, and deployable SQL migrations.
- **Rationale**: Separates database credentials from source control while providing a repeatable migration path and a server-side Prisma client singleton for Next.js.

### Days 24–25: Seed Data & Go Integration
- **Decision**: Seed Computer Science and Web Development courses and topic relationships through Prisma, and proxy/consume the Go optimizer from Next.js with configurable CORS.
- **Rationale**: Creates a reproducible database dataset and keeps browser-facing Next.js integration separate from the Go engine's JSON HTTP contract.

### Day 31: React Flow Course Canvas
- **Decision**: Render the seeded course and prerequisite data in an interactive React Flow canvas using database-backed nodes and edges.
- **Rationale**: Establishes the visual curriculum foundation while keeping layout algorithms, custom node states, constraints, and path highlighting in their scheduled later days.

### Days 26–30: Testing, Gemini, and Resilience
- **Decision**: Add Vitest payload coverage, database-backed Gemini response caching, Flash model environment configuration, quiz and summary routes, and bounded request handling.
- **Rationale**: Keeps generated-content behavior fallback-oriented and repeatable while separating Next.js integration from the Go optimizer and external AI provider.
