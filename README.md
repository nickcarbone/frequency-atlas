# The Frequency Atlas

An observatory of the world's unusual radio: numbers stations, polar broadcasts, time signals, aviation and maritime weather, natural VLF radio and transmission art. 53 sources, every one playable in the page's own player.

## Files

| File | What it is |
|---|---|
| `index.html` | The whole app: dial, Now, map, collections, index, player |
| `sources.json` | The catalogue. Edit this to add or remove sources |
| `status.json` | Results of the weekly signal check (written by the GitHub Action) |
| `land.js` | World outline for the map (Natural Earth 110m via world-atlas) |
| `scripts/check.mjs` | The signal checker (Node 20, no dependencies) |
| `.github/workflows/signal-check.yml` | Runs the checker every Monday 06:17 UTC and commits `status.json` |
| `icons/`, `manifest.webmanifest` | Home-screen icon and install metadata |

## Publish on GitHub Pages

1. Create a new repository (for example `frequency-atlas`) and upload everything in this folder, including the hidden `.github` folder and `.nojekyll`.
2. Settings → Pages → Deploy from a branch → `main` / root.
3. Settings → Actions → General → Workflow permissions → **Read and write permissions** (so the weekly check can commit `status.json`).
4. Actions → Weekly signal check → **Run workflow** once to confirm it works.

On iPhone: open the site in Safari → Share → Add to Home Screen.

## Adding a source

Add an object to `sources` in `sources.json`. Required: `id`, `title`, `kind` (`live`, `stream`, `offair`, `field`, `archive`), `cat`, `place`, `country`, `region`, `lat`/`lon` (or `null`), `tz`, `lang`, `character`, `url`, `fmt` (`mp3`, `aac` or `hls`), `credit`, `licence`, `src`, `blurb`, `hear`. Optional: `freq`, `band`, `mode`, `recorded`, `utc`, `schedule`, `geoNote`, `collections`.

The URL must be HTTPS (GitHub Pages blocks HTTP audio) and must be a direct audio stream, file or HLS playlist.
