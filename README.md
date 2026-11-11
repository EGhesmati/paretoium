# Paretoium

A multi-objective course path optimizer featuring a high-performance Go optimization engine, an interactive Next.js visual canvas using React Flow, and AI-assisted study features powered by Gemini.

## Tech Stack

- **Optimization Engine**: Go (Chi, Gonum)
- **Frontend**: Next.js (TypeScript, Tailwind CSS, React Flow)
- **Database**: PostgreSQL (Neon, Prisma ORM)
- **AI Integration**: Gemini API (`@ai-sdk/google`)
- **Deployment**: AWS Lightsail Containers & Vercel

## Project Structure

```text
paretoium/
├── apps/
│   └── web/            # Next.js web application
└── services/
    └── optimizer/      # Go pathfinding service
```

## Go Optimizer API

Run the service from `services/optimizer`:

```sh
go run ./cmd/optimizer
```

The service listens on port `8080` by default. Set `PORT` to change it.

- `GET /healthz` returns `{"status":"ok"}`.
- `POST /api/v1/optimize` accepts a curriculum and optional constraints:

```json
{
  "nodes": [
    {"id": "intro", "name": "Introduction", "study_hours": 10, "difficulty": 2},
    {"id": "advanced", "name": "Advanced", "study_hours": 20, "difficulty": 5}
  ],
  "edges": [
    {"from_id": "intro", "to_id": "advanced", "group_type": "AND"}
  ],
  "constraints": {
    "target_course_ids": ["advanced"],
    "max_study_hours": 40,
    "max_difficulty": 10,
    "max_depth": 3
  }
}
```

The optimize response contains the non-dominated `pareto_frontier`, the
minimum-hours `express_path`, and the minimum-difficulty `deep_mastery_path`.
Each path label has `node_id`, `total_hours`, `total_difficulty`, and `path`
fields. Invalid JSON, constraints, or curricula return HTTP 400 with a JSON
`error`; request bodies over the 1 MiB limit return HTTP 413.

The HTTP server applies read-header, read, write, and idle timeouts. Run the
optimizer tests and node-count benchmarks from `services/optimizer`:

```sh
go test ./...
go test -bench=BenchmarkRunPareto -benchmem ./internal/pareto
```
