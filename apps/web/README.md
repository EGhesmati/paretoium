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

Day 23 connects the Prisma data model to Neon PostgreSQL.

1. Copy `.env.example` to `.env.local`.
2. Set `DATABASE_URL` to the Neon pooled or direct PostgreSQL connection string.
3. Generate the Prisma client:

```sh
npm run db:generate
```

4. Apply migrations:

```sh
npm run db:deploy
```

For local schema development, use `npm run db:migrate` instead. Check migration
state with `npm run db:status`.

To seed the CS and Web Development curricula:

```sh
npm run db:seed
```

Set `OPTIMIZER_URL` to the Go optimizer URL. The Next.js routes
`GET /api/optimizer/health` and `POST /api/optimizer` proxy optimizer requests.
