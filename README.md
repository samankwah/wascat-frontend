# WASCAT v1.0 West African Sky Archive

A responsive demonstration catalog for discovering, inspecting, citing, and downloading expert-labelled West African sky-image records and processed artifacts represented across Ghana, Nigeria, and Burkina Faso.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Verification commands are `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`.

## Data architecture

The production schema in `prisma/schema.prisma` models `Collection → Release → ImageRecord → Artifact`. Searchable metadata lives in PostgreSQL; binaries, manifests, and release bundles use public S3-compatible storage behind a CDN. The included catalog is a self-contained demonstration fixture, not a claim of operational stations, measurements, instruments, releases, or publications.

## Release imports

Validate a trusted manifest without writing anything:

```bash
npm run import:release -- ./path/to/manifest.json
```

Published releases are immutable. Deployment adapters must verify object existence and checksums before performing a transactional draft import and publish operation.
