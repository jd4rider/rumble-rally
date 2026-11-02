# Rumble Rally

A physics driving game: steer a little rally car over hills, crates and gaps to reach the flag. Built with Phaser 4, Matter.js, Vite and Electron — playable in the browser and as a desktop app for macOS, Windows and Linux.

- Play in your browser: <https://jd4rider.github.io/rumble-rally/play/>
- Downloads: <https://github.com/jd4rider/rumble-rally/releases/latest>

## How to play

- **Desktop:** ← / → (or A / D) to drive, **R** restart, **Esc** back to levels. **Touch:** hold the on-screen ◀ ▶ buttons (multi-touch works). Landscape is best on a phone.
- Rolling over drives you forward; in the air the same keys tilt the car, so lean to land on your wheels. Touching the ground with the car body is a crash.
- Collect the three ★ on each course; every finished level earns at least one star.
- 200 procedurally generated levels (seeded, so everyone gets the same courses) across 5 worlds, getting steeper with more crates and gaps. Every level is checked solvable by a test bot.

## Develop

```sh
npm install
npm run dev      # web dev server
npm test         # level generator and physics tests
npm start        # build and open in Electron
npm run dist:mac # package an installer (also dist:win, dist:linux)
```

## Release

Push a tag like `v0.1.0` and the **Release apps** workflow builds the macOS, Windows and Linux installers. Every push to `main` deploys the web version to GitHub Pages.
