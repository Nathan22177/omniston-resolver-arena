# Omniston Resolver Arena

An interactive, static recruitment prototype for prospective Omniston resolvers.

The page replays a production snapshot from the Omniston History API and lets a visitor:

- select source blockchains where they hold liquidity;
- select destination blockchains where they can deliver;
- model an assumed share of addressable historical flow;
- adjust gross margin and the price concession offered to traders;
- inspect how the scenario changes the resolver Sankey and potential gross spread.

## Data snapshot

- Historical window: `2026-07-26 09:07 UTC` through `2026-08-26 09:07 UTC`
- Retrieved from production: `2026-08-26 09:07 UTC`
- Embedded sample: top 20 `source chain × resolver × destination chain` rows
- Coverage: 99.6% of filled USD volume in the full 31-day response
- Source: `stonfi.omni.history.v1.AggregatesRpc.FinalizedOrderAggregates`

The current resolver allocation is historical. The `You` allocation and gross-spread result are explicitly scenario values, not forecasts or guaranteed earnings.

## Run locally

Serve the repository root with any static HTTP server, for example:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

## Static hosting

The site is a single `index.html` with no build step and no absolute project paths. It can be hosted from a repository root with GitHub Pages.

For GitLab Pages, the included `.gitlab-ci.yml` copies `index.html` into the required `public/` artifact and deploys it from the default branch.
