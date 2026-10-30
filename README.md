# Budget Watch

Budget Watch is a Next.js public-finance dashboard for browsing department-level
budget allocations.

## Run locally

```bash
pnpm install
pnpm dev
```

The app is available at [http://localhost:3000](http://localhost:3000).

## Current data status

This checkout currently uses the one-period department/ministry/amount snapshot
supplied for the prototype. The snapshot does not contain a financial-year
label, an official source reference, or prior-year values. It is explicitly
identified in the UI as preview data.

The overview, department directory, department detail pages, comparison view,
trends page, and data explorer derive their figures from this same supplied
snapshot. The app does not generate multi-year data. Historical charts,
year-over-year calculations, CAGR, and volatility remain unavailable until
labeled financial-year records are provided.

Snapshot rows are centralized in [`lib/budget-data.ts`](./lib/budget-data.ts).
Formatting and calculation helpers are in [`lib/format.ts`](./lib/format.ts).
When the database schema and API are available in this checkout, replace the
preview data source with a typed API layer; do not treat this fixture as an
official dataset.

## Validation

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```
