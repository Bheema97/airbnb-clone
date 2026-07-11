# StayFinder frontend

This directory contains the Next.js App Router frontend for StayFinder.

See the repository-level [`README.md`](../README.md) for architecture, setup, environment variables, tests, demo users, and deployment instructions.

Common commands:

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm run build
npm run test:e2e
```

Set `NEXT_PUBLIC_API_URL` to the FastAPI backend origin. The central API client normalizes the `/api/v1` prefix.
