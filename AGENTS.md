# AI Agent Guidelines & Architecture Directives

Welcome, AI Agent! Please adhere strictly to the rules, architectural principles, and 60-day schedule below.

---

## 1. Core Principles & Constraints

1. **Engine-First Isolation**:
   - Do NOT introduce web/frontend logic into `services/optimizer`.
   - The Go optimizer service communicates exclusively via JSON HTTP requests (`POST /api/v1/optimize`, `/healthz`).

2. **Strict Scope Control**:
   - Only implement features assigned to the specific day requested. Do not jump ahead to future phases.
   - **Protected Days**: Days 10–14 (Pareto Algorithm) and Days 31–38 (Visual Canvas) form the core demo. Protect them at all costs.
   - **Fallback Priority Cut List**: If behind schedule, cut in this order: Quiz generation -> Python comparison -> `pprof` -> AWS CI/CD -> Deployment polish.

3. **Gemini Safety**:
   - Never hardcode Gemini API keys or specific model strings in code files.
   - Use process environment variables (`GEMINI_MODEL_ID`, `GEMINI_API_KEY`).
   - Always cache generated responses in PostgreSQL to respect free-tier limits.

4. **Documentation**:
   - Commit at the end of every session, even if work is half done.
   - Add one line a day to `DECISIONS.md` to serve as defense notes.

---

## 2. 60-Day Capstone Roadmap

### Phase 1: Go Engine (Days 1–20)
* **Day 1**: Monorepo setup (`services/optimizer`, `apps/web`), `.gitignore`, `README.md`, `go mod init`, `chi` & `gonum` dependencies.
* **Day 2**: Domain models (`CourseNode`, `PrerequisiteEdge` with AND/OR groups, `ConstraintSet`).
* **Day 3**: 15-node sample curriculum JSON & failing cycle-detection tests.
* **Day 4**: Validation & cycle detection implementation with `gonum topo`.
* **Day 5**: Failing cost-function tests (study hours vs. difficulty).
* **Day 6**: Cost function implementation.
* **Day 7**: Buffer + start `DECISIONS.md`.
* **Day 8**: Edge-case tests (empty graph, single node, zero budget).
* **Day 9**: Fix edge cases.
* **Days 10–11**: Pareto label-setting algorithm on adjacency lists.
* **Day 12**: Label cap & pruning with tests.
* **Day 13**: Pick Express & Deep Mastery paths from Pareto set.
* **Day 14**: Fuzz tests to ensure no panics on bad input.
* **Day 15**: `POST /api/v1/optimize` and `/healthz` endpoints.
* **Day 16**: `httptest` tests, validation, timeouts, request size limit.
* **Day 17**: Benchmarks on 50 to 500 nodes.
* **Day 18**: `ci.yml` running `go test` on pull requests.
* **Day 19**: PR, merge to develop, tag `v0.1`.
* **Day 20**: Buffer.

### Phase 2: Database, Next.js, Gemini (Days 21–30)
* **Day 21**: Next.js in `apps/web` with TypeScript and Tailwind CSS.
* **Day 22**: Prisma schema (`User`, `Course`, `TopicNode`, `Edge`, `UserPathHistory`).
* **Day 23**: Neon DB connection & migration.
* **Day 24**: Seed script with CS & Web Development curricula.
* **Day 25**: Go API client in Next.js + CORS configuration.
* **Day 26**: Vitest setup & payload/response tests.
* **Day 27**: End-to-end local test (DB -> Go Engine -> Result).
* **Day 28**: `@ai-sdk/google` setup & `/api/node-summary` route.
* **Day 29**: Quiz generation API route.
* **Day 30**: Rate limiting, fallback handling, DB caching layer, tag `v0.2`, buffer.

### Phase 3: Visual Canvas (Days 31–45)
* **Day 31**: React Flow initial setup rendering seeded graph.
* **Day 32**: Dagre auto-layout integration.
* **Day 33**: Custom node components (completed, next, locked, hard).
* **Day 34**: Pan, zoom, and node selection capabilities.
* **Day 35**: Constraint panel UI (time slider, difficulty toggle, depth).
* **Day 36**: Wire panel to Go API with debouncing.
* **Day 37**: Recommended path visual highlighting.
* **Day 38**: Express vs. Deep path toggle switch.
* **Day 39**: Buffer.
* **Day 40**: Loading states and UI transitions.
* **Day 41**: Sliding node detail drawer component.
* **Day 42**: Integrate Gemini summary and quiz inside node detail drawer.
* **Day 43**: Mark node as completed (demo user state).
* **Day 44**: Save progress with Prisma & re-trigger path optimization.
* **Day 45**: Responsive layout, UI polish, and branch merge.

### Phase 4: Docker and AWS Deployment (Days 46–54)
* **Days 46–47**: Multi-stage Dockerfile (`CGO_ENABLED=0`, target < 25 MB) & `docker-compose.yml`.
* **Day 48**: Deploy Next.js to Vercel & Go container fallback to Render.
* **Day 49**: AWS billing alert setup + Lightsail container service setup.
* **Day 50**: Shared-secret security header & HTTPS environment configuration.
* **Day 51**: Connect Vercel deployment to AWS HTTPS endpoint.
* **Day 52**: GitHub Actions pipeline for automated AWS Lightsail deploy.
* **Days 53–54**: Buffer, live E2E testing, cross-browser validation.

### Phase 5: Profiling and Defense (Days 55–60)
* **Day 55**: `pprof` CPU and memory profiling capture.
* **Day 56**: Benchmark Python version implementation of pathfinding algorithm.
* **Day 57**: Go vs. Python performance analysis documentation.
* **Day 58**: Comprehensive `README.md` with architecture diagram, API spec, and AWS setup.
* **Day 59**: Presentation slides preparation.
* **Day 60**: Demo rehearsal and final verification.

