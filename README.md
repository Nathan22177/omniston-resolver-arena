# Omniston Resolver Arena

An interactive, static recruitment prototype for prospective Omniston resolvers.

The page loads the latest 31 days from the production Omniston History API on every visit and lets a visitor:

- select source blockchains where they hold liquidity;
- select destination blockchains where they can deliver;
- model an assumed share of addressable historical flow;
- adjust gross margin and the price concession offered to traders;
- inspect how the scenario changes the resolver Sankey and potential gross spread.

## Data

- Live window: the 31 days immediately preceding page load
- Source: `stonfi.omni.history.v1.AggregatesRpc.FinalizedOrderAggregates`
- Dimensions: source chain, destination chain, and resolver ID
- Fallback: a representative top-20 snapshot from `2026-07-26 09:07 UTC` through `2026-08-26 09:07 UTC` if the live request fails

New resolver IDs and chains appear automatically when they occur in finalized orders returned by the API.

The current resolver allocation is historical. The `You` allocation and gross-spread result are explicitly scenario values, not forecasts or guaranteed earnings.

## Run locally

Serve the repository root with any static HTTP server, for example:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

## Static hosting

The site is plain HTML, CSS, and JavaScript with no build step or absolute project paths. It can be hosted from a repository root with GitHub Pages.

For GitLab Pages, the included `.gitlab-ci.yml` copies the static site into the required `public/` artifact and deploys it from the default branch.
