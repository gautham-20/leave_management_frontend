# Leave Space — Frontend

Next.js 16 (App Router), React 19, TypeScript, Tailwind v4.

Client components call Next.js route handlers under `app/api/`, which proxy server-side to the Spring Boot API. The browser never talks to the API directly.

## Local development

```bash
npm install
cp .env.example .env.local    # SPRING_API_URL=http://localhost:8080
npm run dev                   # http://localhost:3000
```

Requires the backend running locally on port 8080.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `SPRING_API_URL` | yes | Base URL of the Spring Boot API. Server-side only — no `NEXT_PUBLIC_` prefix, so it is never exposed to the browser bundle. |

Because the browser only ever calls same-origin `/api/*` routes, no CORS configuration is needed.

## Deployment (Railway)

Railway deploys from the repository root — there is no monorepo subfolder here, so **do not set a Root Directory**.

Variables to set:

| Key | Value |
|---|---|
| `SPRING_API_URL` | Base URL of the deployed backend, e.g. `https://leave-api.up.railway.app` |

`railway.json` builds with Nixpacks (`npm ci && npm run build`) and starts with `npm run next-start`.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run next-start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |