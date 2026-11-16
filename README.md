[![Nova Drift](https://make.fun/badge/best-game-01.svg)](https://make.fun/c/best-game-01)
[![Rank](https://make.fun/badge/best-game-01/sujang783/best-game/rank.svg)](https://make.fun/c/best-game-01)
[![Reward](https://make.fun/badge/best-game-01/sujang783/best-game/reward.svg)](https://make.fun/c/best-game-01)

# NOVA DRIFT — a neon arcade space shooter

An entry for make.fun's [**best-game-01** bounty](https://make.fun/bounty/best-game-01)
("Make the best game", $1,000 pot).

Blast the swarm. Survive 10 waves. Slay the VOID MAW. Between waves, pick
one of three upgrades and build your ship into a storm.

## How to play

- **WASD / arrows** — fly
- **Mouse** — aim · **hold click / Space** — fire
- **P** — pause · **M** — mute
- **1 / 2 / 3 or click** — take an upgrade between waves

Kill streaks build a combo (up to ×5). Enemies drop salvage: gold shards are
score, green cells restore a shield, red cells repair a hull. The VOID MAW
boss arrives on waves 5 and 10 — clear wave 10 to win the sector.

## What it is

- Pure static files: `game/index.html` plus ES modules under `game/src/`,
  no library, no network request, no build step.
- All art is drawn in code (neon canvas vector art, parallax starfield,
  pre-rendered nebula) and all sound is synthesized with WebAudio.
- Fixed 1/60 s steps, deterministic seeds: `?shot=start|play|boss|end&seed=N`
  stages a screenshot scene and sets `window.__shotReady`.
- Screenshots in `screenshots/` (title, mid-wave action, boss fight,
  game over) are real renders of the game's own code.

## Layout

```
main.ts                  entrypoint: copies game/ + screenshots/ to /output, writes dossier.json
serve.ts                 dev server: node serve.ts -> http://localhost:8080
vendor/makefun-game.ts   make.fun's dossier library (kit copy, unchanged)
game/index.html          the page
game/src/config.js       all tuning: arena, ship, waves, scoring, upgrades
game/src/random.js       seeded RNG (mulberry32)
game/src/audio.js        synthesized SFX + bassline (WebAudio, no files)
game/src/input.js        keyboard + mouse
game/src/particles.js    particles, floating text, shake, starfield
game/src/player.js       the ship: movement, aim, fire patterns, upgrades
game/src/enemies.js      enemy types, boss, wave spawn queues
game/src/world.js        game state: collisions, scoring, combo, waves
game/src/render.js       drawing: nebula, ships, HUD, all screens
game/src/shots.js        deterministic screenshot staging
game/src/main.js         boot + fixed-step loop + screen state machine
```

## License

MIT — see [LICENSE](LICENSE).
