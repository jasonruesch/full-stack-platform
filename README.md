# BookmarkVault

A full-stack web app to save, organize, tag, search, and share bookmarks —
built end to end against a **real API and database**, not a mock. It's the
production-grade counterpart to the mocked-backend `web-application` showcase.

- **Frontend** — React 19 + Vite, file-based routing
  (`@evolonix/react-router-next`), the `@jasonruesch/react` design system,
  Tailwind v4, TanStack Query (REST) + Apollo Client (GraphQL), Zustand.
- **Backend** — Fastify + Prisma + PostgreSQL, JWT auth, serving **both** a REST
  API (auth, collections, import/export, public share links) and a **GraphQL**
  API (bookmark search/filter, tagging) via GraphQL Yoga + Pothos.
- **One origin** — in production the API serves the built SPA plus `/api` and
  `/graphql` from a single Fly.io app, so there's no CORS layer.

## Architecture

```
full-stack-platform/            Turborepo + pnpm workspace
├─ apps/
│  ├─ api/   Fastify + Prisma + GraphQL (REST + GraphQL on one server)
│  └─ web/   React 19 + Vite SPA (design system, Apollo + TanStack Query)
└─ packages/
   └─ shared/  Domain types + Zod schemas shared by api and web
```

The REST layer (TanStack Query) handles auth, collections, and import/export;
the GraphQL layer (Apollo) handles bookmark search/filtering and tagging —
mirroring a real system that uses the right transport per concern. Both speak
the same domain types from `@bookmarkvault/shared`.

## Local development

Prerequisites: Node 24 (`.nvmrc`), pnpm 11, Docker.

```bash
pnpm install
docker compose up -d                 # Postgres on :5432
cp apps/api/.env.example apps/api/.env
pnpm db:migrate                      # create the schema
pnpm db:seed                         # demo account + sample data
pnpm dev                             # api :3000, web :5173 (proxied)
```

Open http://localhost:5173 and sign in with the seeded demo account:

```
demo@bookmarkvault.app / password
```

The Vite dev server proxies `/api` and `/graphql` to the API on :3000, so the
browser talks to one origin — the same model used in production.

## Scripts

| Command           | What it does                                            |
| ----------------- | ------------------------------------------------------- |
| `pnpm dev`        | Run api + web together (Turborepo)                      |
| `pnpm build`      | Build shared → api (tsup) → web (Vite)                  |
| `pnpm test`       | Vitest: API integration tests + web unit/a11y tests     |
| `pnpm lint`       | ESLint across all packages                              |
| `pnpm typecheck`  | TypeScript across all packages                          |
| `pnpm db:migrate` | Apply Prisma migrations (dev)                           |
| `pnpm db:seed`    | Seed the demo account and sample library                |

E2E (Playwright) runs against the production single-origin server:

```bash
pnpm --filter @bookmarkvault/web build
pnpm --filter @bookmarkvault/web test:e2e
```

## Testing

- **API** — Vitest integration tests drive the real Fastify app with
  `app.inject()` against a Postgres database, covering auth, ownership rules,
  collections, sharing, import/export, and the GraphQL bookmark/tag operations.
- **Web** — Vitest + Testing Library + `vitest-axe` for unit and accessibility
  checks; Playwright for end-to-end flows (login, browse, search, create).

CI (`.github/workflows/ci.yml`) runs lint, typecheck, unit/integration tests,
build, and E2E against a Postgres service container on every PR.

## Deployment (Fly.io)

The app deploys as a single container that serves the SPA and the API together.

```bash
fly launch --no-deploy                       # uses the included fly.toml + Dockerfile
fly postgres create --name bookmarkvault-db
fly postgres attach bookmarkvault-db         # sets DATABASE_URL
fly secrets set JWT_SECRET=$(openssl rand -hex 32)
fly deploy
```

Each deploy runs `prisma migrate deploy` via the `release_command` in
`fly.toml` before the new release goes live. Pushes to `main` deploy
automatically through `.github/workflows/deploy.yml` (needs a `FLY_API_TOKEN`
repository secret).

## API surface

REST (`/api`):

- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`,
  `GET /api/auth/me`
- `GET/POST /api/collections`, `GET/PATCH/DELETE /api/collections/:id`
- `POST /api/collections/:id/shares`, `DELETE /api/shares/:token`
- `GET /api/shared/:token` — **public**, no auth
- `POST /api/import`, `GET /api/export`

GraphQL (`/graphql`): `bookmarks(filter)`, `bookmark(id)`, `tags`, and mutations
for creating/updating/moving/deleting bookmarks and managing tags.
