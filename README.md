# The Center of Indian Cinema

An interactive map of co-star connections in Indian cinema. It ranks actors by **remoteness**: the mean number of film links needed to reach every other actor in the largest connected group. Lower is more central.

## Explore

The opening is a five-scene sideways story. Use the mouse wheel, arrow buttons, keyboard arrows, or a sideways swipe to move through the animated co-star network. In scene three, guess which actor is closest to the center; the next scene compares your pick with the top-ranked actor. A skip option reveals the answer without a guess.

Below the story are a searchable ranking, a yearly remoteness chart for the current top eight actors, a film count vs. remoteness chart, and a film count vs. distinct co-stars chart. Selecting an actor in the ranking or scatterplots highlights them across the comparisons.

## Method

The pinned Wikidata snapshot was queried on **October 23, 2026**. The film set uses:

- instance of **film** (`P31 = Q11424`)
- country of origin **India** (`P495 = Q668`)
- release date from **1960 through 2025** (`P577`)
- at least two recorded cast members (`P161`)

Each pair of actors in the same film forms one undirected edge. Distinct co-stars are unique neighbors in this graph. Remoteness is the average breadth-first-search distance from one actor to all others in the largest connected component. The published ranking includes actors whose Wikidata citizenship is India (`P27 = Q668`) and who have at least five qualifying films. Actors of other citizenships can still be part of the graph and its paths.

The yearly chart rebuilds the film graph through each year from 1980 to 2025, then scores the eight actors who rank highest in the final 2025 graph. A line starts once the actor has five films and sits in that year's largest connected group. Each year therefore has a changing comparison universe.

**Limits:** Wikidata's cast, film, release date, and citizenship statements are incomplete. A missing statement can omit a film or actor, or alter a score. These results measure recorded network connections, not artistic value or influence. A single film can create several links even when its cast members share no scene.

Data: [Wikidata](https://www.wikidata.org/wiki/Wikidata:Main_Page), [CC0](https://www.wikidata.org/wiki/Wikidata:Licensing). Conceptual inspiration: [The Pudding's “The Real Kevin Bacon”](https://pudding.cool/2026/10/kevin-bacon/). Design, code, and calculations here are original.

## Local development

Requires Node.js 20.19+ or 22.12+.

```sh
pnpm install
pnpm dev
```

Open the local URL shown by Vite. For a production build:

```sh
pnpm build
```

## Reproduce the data

The repository includes the pinned raw Wikidata credit extract and the derived scores. To refresh from Wikidata (the live data may have changed):

```sh
python3 scripts/fetch_wikidata.py
python3 scripts/fetch_film_ids.py
python3 scripts/fetch_indian_actors.py
python3 scripts/prepare_graph.py
node scripts/score.mjs data/graph_input.txt data/ranking.tsv data/history.tsv
python3 scripts/build_site_data.py
```

The refresh scripts use the public Wikidata Query Service and run serially to respect its limits. The `public/data.json` file is a compact machine-readable export; `src/data.json` is bundled into the app.

## Deploy

The static Vite build deploys to Vercel with build command `pnpm build` and output directory `dist`.
