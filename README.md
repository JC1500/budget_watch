# Budget Watch

Budget Watch is a Next.js public-finance dashboard for exploring department-level
Government of India budget allocations across the local JSON datasets in `data/`.

## Run locally

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Source data

The app reads all `data/*.json` files through [`lib/budget-data.ts`](./lib/budget-data.ts).
The current files cover 2021–22 through 2026–27 and contain ministry groups
with nested department totals in ₹ crore. Revenue and capital sub-totals and
official source URLs/page metadata are not present.

The data layer validates and normalizes rows for the UI while retaining source
display names. Whitespace and trailing punctuation are normalized safely; two
explicit department-name changes (Agriculture and Ayush) are linked for history.
Other name changes are kept separate unless their continuity is unambiguous.
JSON parsing and missing-file errors are surfaced to the user without exposing
stack traces.

The page and chart components consume normalized data-service functions rather
than importing JSON. This boundary can later be replaced with a PostgreSQL/API
implementation.

## Analytics

- Total, average, median, standard deviation, department rank, and share are
  computed from the selected year.
- YoY percentage change is `(current - previous) / previous × 100`; it is not
  calculated when the prior value is missing or zero.
- CAGR is annualized between the first and last available comparable values.
- Budget variation is the standard deviation of available year-over-year
  percentage changes. It is descriptive and is not a performance score.
- Rank changes use within-year department allocation rank.

Allocation changes do not by themselves imply better or worse outcomes.

## Validation

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```
