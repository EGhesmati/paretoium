# Paretoium Web

Next.js app using TypeScript and Tailwind CSS.

## Development

```sh
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The web app is currently a
Day 21 foundation; the optimizer API integration is planned for a later phase.

## Checks

```sh
npm run lint
npm run typecheck
npm run build
```

## Database

Day 22 defines the PostgreSQL data model with Prisma. Copy `.env.example` to
`.env.local` and set `DATABASE_URL` before running database commands.
