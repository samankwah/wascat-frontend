# wascat-frontend

The public WASCAT archive and its admin dashboard. Next.js 16, React 19,
Tailwind v4.

The catalogue itself lives in `wascat-backend`; this app reads it over HTTP and
generates its TypeScript types from that service's OpenAPI schema, so the two
repositories share one contract without sharing a package.

## Running it

The API has to be up first — see `../wascat-backend/README.md`.

```bash
npm install
npm run dev          # http://localhost:3000
```

`.env.local` carries three settings:

| | |
|---|---|
| `WASCAT_API_ORIGIN` | Where the API is. Defaults to `http://127.0.0.1:8000`. |
| `WASCAT_ASSET_ORIGIN` | Where the object store is. Defaults to `http://127.0.0.1:9000/wascat`. |
| `WASCAT_REVALIDATE_SECRET` | Shared with the backend, so a published edit can invalidate the cache. |

Frames are addressed as `/frames/seq-001/5-source.jpg` — the same URLs the archive
published when they lived in `public/frames` — and rewritten to the object
store. Keeping them on this origin means `next/image` optimises them as local
files, so no environment has to declare a storage host in
`images.remotePatterns`, and storage can move without the catalogue's URLs
changing. A CDN deployment is the one exception: set `NEXT_PUBLIC_ASSET_BASE_URL`
and the backend's `WASCAT_PUBLIC_ASSET_BASE_URL` to the same origin, and the
API emits absolute URLs instead.

## Layout

```
app/
  (site)/     the public archive - a route group, so /explore is still /explore
  admin/      the dashboard
  api/        revalidate webhook only; /api/v1/* is rewritten to the backend
components/
  admin/      dashboard-only components
lib/
  api-client  public reads, cached and tagged
  admin/      session, dashboard reads, and the browser API client
  api-types   generated; do not edit
```

`next.config.ts` rewrites `/api/v1/*` to the backend. That keeps every
documented API URL on the site's own origin — so `/api-docs` stays truthful and
the homepage's metadata download still resolves — and it keeps the dashboard's
session cookies same-origin, which is why there is no CORS to configure.

## The dashboard

`/admin`, behind a sign-in. `proxy.ts` redirects signed-out visitors, but that
is an optimistic check: the decision is made in the server-side session read
and again in every backend endpoint.

What a curator can do:

- **Image records** — edit provenance, upload or replace a frame or mask, and
  bulk-apply a field across a selection.
- **Collections** — the editorial metadata that is empty for every sequence
  today: site, coordinates, instrument, licence, citation, DOI. Plus the
  release workflow.
- **Vocabulary** — rename, merge, reorder and retire the terms that drive the
  Explore filters.
- **Audit log** — every change, with before and after.

Two rules shape all of it. Measurements come from the masks and are not
editable by anyone. A published release is immutable, so a citation resolves to
the same data forever; corrections go into a new release.

## Checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run types:generate   # regenerate lib/api-types.ts from the API
```

The build deliberately needs no database: the catalogue pages `await
connection()` so they render per request rather than at build time.
