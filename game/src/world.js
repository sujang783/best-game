// The world: everything that is true about a run — the ship, the enemies,
// the bullets, the salvage, the wave, the score and the combo — and the one
// step that moves all of it. The renderer only reads this; it never writes.

import {
  BOSS_WAVES, COMBO_MAX, COMBO_PER_LEVEL, COMBO_WINDOW, ENEMY_TYPES,
  HEIGHT, SHARD_MAGNET_RADIUS, SHARD_SCORE, STEP, VICTORY_BONUS,
  WAVE_CLEAR_BONUS, WAVES, WIDTH,
} from './config.js';
import { createPlayer } from './player.js';
import { createWavePlanner, steerEnemy } from './enemies.js';
import { createParticles } from './particles.js';

export const EVENT_HIT = 1;
export const EVENT_OVER = 2;
export const EVENT_WAVE_CLEAR = 4;
export const EVENT_VICTORY = 8;
export const EVENT_UPGRADE = 16;
export const EVENT_BOSS = 32;

export function createWorld(random) {
  const player = createPlayer();
  const particles = createParticles(random);
  const planner = createWavePlanner(random);

  const state = {
    score: 0,
    best: 0,
    wave: 0,
    hull: 3,
    shield: 0,
    combo: 0,
    comboTimer: 0,
    comboLevel: 1,
    kills: 0,
    time: 0,
    enemies: [],
    bullets: [],
    enemyBullets: [],
    shards: [],
    boss: null,
    upgradeChoices: [],
    waveActive: false,
    waveBanner: 0,
    waveBannerText: '',
    slowmo: 0,
  };

  function addScore(base, x, y) {
    const mult = state.comboLevel;
    const gained = base * mult;
    state.score += gained;
    if (x !== undefined) particles.text(x, y, `+${gained}`, mult > 1 ? '#ffd166' : '#e8f6ff');
    return gained;
  }

  function dropShard(x, y, kind) {
    state.shards.push({
      x, y,
      vx: random.range(-40, 40),
      vy: random.range(20, 70),
      kind: kind ?? 'salvage',
      radius: kind === 'shield' ? 12 : 8,
      t: 0,
    });
  }

  function killEnemy(e, index) {
    state.enemies.splice(index, 1);
    state.kills += 1;
    state.combo += 1;
    state.comboTimer = COMBO_WINDOW;
    state.comboLevel = Math.min(COMBO_MAX, 1 + Math.floor(state.combo / COMBO_PER_LEVEL));
    particles.burst(e.x, e.y, e.color, e.type === 'boss' ? 90 : 26, e.type === 'boss' ? 320 : 220);
    particles.addShake(e.type === 'boss' ? 12 : 4);
    addScore(e.score, e.x, e.y);
    const roll = random.next();
    if (e.type === 'boss') {
      dropShard(e.x - 40, e.y, 'shield');
      dropShard(e.x + 40, e.y, 'repair');
      for (let i = 0; i < 5; i += 1) dropShard(e.x + random.range(-90, 90), e.y + random.range(-30, 30), 'salvage');
    } else if (e.type === 'bulwark' || roll < 0.14) {
      dropShard(e.x, e.y, roll < 0.05 ? 'shield' : 'salvage');
    } else if (roll < 0.2) {
      dropShard(e.x, e.y, 'salvage');
    }
    if (e.type === 'boss') state.boss = null;
  }

  function damagePlayer() {
    const result = player.hit();
    if (!result) return 0;
    const p = player.state;
    particles.burst(p.x, p.y, result === 'shield' ? '#4de3a5' : '#ff5d5d', 30, 260);
    particles.addShake(9);
    state.combo = 0;
    state.comboLevel = 1;
    state.comboTimer = 0;
    if (!p.alive) return EVENT_OVER;
    return EVENT_HIT;
  }

  function startWave(n) {
    state.wave = n;
    state.waveActive = true;
    state.waveBanner = 2.2;
    state.waveBannerText = BOSS_WAVES.has(n) ? `WAVE ${n} — VOID MAW` : `WAVE ${n}`;
    planner.start(n);
    if (BOSS_WAVES.has(n)) return EVENT_BOSS;
    return 0;
  }

  return {
    state,
    particles,
    player,
    reset() {
      player.reset();
      state.score = 0;
      state.wave = 0;
      state.hull = 3;
      state.shield = 0;
      state.combo = 0;
      state.comboTimer = 0;
      state.comboLevel = 1;
      state.kills = 0;
      state.time = 0;
      state.enemies = [];
      state.bullets = [];
      state.enemyBullets = [];
      state.shards = [];
      state.boss = null;
      state.upgradeChoices = [];
      state.waveActive = false;
      state.waveBanner = 0;
      state.waveBannerText = '';
      state.slowmo = 0;
    },
    startRun() {
      this.reset();
      return startWave(1);
    },
    beginNextWave() {
      return startWave(state.wave + 1);
    },
    chooseUpgrade(index) {
      const choice = state.upgradeChoices[index];
      if (!choice) return false;
      choice.apply(player.state);
      state.upgradeChoices = [];
      state.hull = player.state.hull;
      state.shield = player.state.shield;
      return true;
    },
    setUpgrades(list) {
      state.upgradeChoices = list;
    },
    // One fixed step. `title` keeps the background alive behind the title
    // screen. Returns an event bitmask (see EVENT_* above).
    step(dt, input, title) {
      let events = 0;
      state.time += dt;
      const scroll = title ? 10 : 26;
      particles.update(dt, scroll);
      if (title) {
        // A few decorative drones drift past behind the title.
        if (state.enemies.length < 5 && random.chance(dt * 0.9)) {
          state.enemies.push({
            type: 'drone', x: random.range(60, WIDTH - 60), y: -30,
            vx: 0, vy: 0, hp: 1, maxHp: 1, radius: 16, speed: 60,
            score: 0, color: '#ff5d8f', shape: 'drone',
            t: 0, phase: random.range(0, Math.PI * 2), shootTimer: 0,
            burstTimer: 0, spawnTimer: 0, flash: 0, entered: true,
          });
        }
        for (const e of state.enemies) {
          e.y += e.speed * dt;
          e.x += Math.sin(e.t * 2 + e.phase) * 40 * dt;
          e.t += dt;
        }
        state.enemies = state.enemies.filter((e) => e.y < HEIGHT + 40);
        return 0;
      }

      state.waveBanner = Math.max(0, state.waveBanner - dt);
      state.slowmo = Math.max(0, state.slowmo - dt);
      const p = player.state;

      // Player.
      const fired = player.update(dt, input.direction(), input.aim(), input.isFiring());
      for (const b of fired) state.bullets.push(b);

      // Wave spawns.
      if (state.waveActive) {
        const spawned = planner.next(dt, state.wave);
        if (spawned) {
          state.enemies.push(spawned);
          if (spawned.type === 'boss') {
            state.boss = spawned;
            events |= EVENT_BOSS;
          }
        }
      }

      // Enemies.
      for (const e of state.enemies) {
        const out = steerEnemy(e, dt, p.x, p.y);
        for (const b of out) {
          if (b.spawnDrone) {
            state.enemies.push({
              type: 'drone', x: b.x, y: b.y,
              vx: 0, vy: 0, hp: 1, maxHp: 1, radius: 16, speed: 110,
              score: 100, color: '#ff5d8f', shape: 'drone',
              t: 0, phase: random.range(0, Math.PI * 2), shootTimer: 0,
              burstTimer: 0, spawnTimer: 0, flash: 0, entered: true,
            });
          } else {
            state.enemyBullets.push(b);
          }
        }
      }

      // Player bullets: move, age, hit enemies.
      for (let i = state.bullets.length - 1; i >= 0; i -= 1) {
        const b = state.bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.life -= dt;
        let dead = b.life <= 0 || b.x < -20 || b.x > WIDTH + 20 || b.y < -20 || b.y > HEIGHT + 20;
        if (!dead) {
          for (let j = state.enemies.length - 1; j >= 0; j -= 1) {
            const e = state.enemies[j];
            const dx = b.x - e.x;
            const dy = b.y - e.y;
            const rr = e.radius + b.radius;
            if (dx * dx + dy * dy < rr * rr) {
              e.hp -= b.damage;
              e.flash = 1;
              particles.burst(b.x, b.y, '#9be7ff', 4, 120);
              if (e.hp <= 0) killEnemy(e, j);
              if (b.pierce > 0) {
                b.pierce -= 1;
              } else {
                dead = true;
              }
              break;
            }
          }
        }
        if (dead) state.bullets.splice(i, 1);
      }

      // Enemy bullets: move, age, hit the player.
      for (let i = state.enemyBullets.length - 1; i >= 0; i -= 1) {
        const b = state.enemyBullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.life -= dt;
        let dead = b.life <= 0 || b.x < -30 || b.x > WIDTH + 30 || b.y < -30 || b.y > HEIGHT + 30;
        if (!dead && p.alive) {
          const dx = b.x - p.x;
          const dy = b.y - p.y;
          const rr = 16 + b.radius;
          if (dx * dx + dy * dy < rr * rr) {
            dead = true;
            const r = damagePlayer();
            if (r === EVENT_OVER) events |= EVENT_OVER;
            else if (r === EVENT_HIT) events |= EVENT_HIT;
          }
        }
        if (dead) state.enemyBullets.splice(i, 1);
      }

      // Enemy bodies colliding with the player.
      if (p.alive) {
        for (let j = state.enemies.length - 1; j >= 0; j -= 1) {
          const e = state.enemies[j];
          const dx = e.x - p.x;
          const dy = e.y - p.y;
          const rr = e.radius + 14;
          if (dx * dx + dy * dy < rr * rr) {
            const wasBoss = e.type === 'boss';
            if (!wasBoss) killEnemy(e, j);
            else e.hp -= 5;
            const r = damagePlayer();
            if (r === EVENT_OVER) events |= EVENT_OVER;
            else if (r === EVENT_HIT) events |= EVENT_HIT;
            if (!p.alive) break;
          }
        }
      }

      // Enemies that slip past the bottom cost a little combo, then leave.
      for (let j = state.enemies.length - 1; j >= 0; j -= 1) {
        const e = state.enemies[j];
        if (e.y > HEIGHT + 70 && e.type !== 'boss') {
          state.enemies.splice(j, 1);
          state.combo = 0;
          state.comboLevel = 1;
          state.comboTimer = 0;
        }
      }

      // Salvage: drift, magnet toward the ship, collect.
      const magnetR = SHARD_MAGNET_RADIUS * (1 + p.magnet * 0.6);
      for (let i = state.shards.length - 1; i >= 0; i -= 1) {
        const s = state.shards[i];
        s.t += dt;
        const dx = p.x - s.x;
        const dy = p.y - s.y;
        const d = Math.hypot(dx, dy);
        if (p.alive && d < magnetR) {
          s.vx += (dx / (d || 1)) * 900 * dt;
          s.vy += (dy / (d || 1)) * 900 * dt;
        } else {
          s.vy += 26 * dt;
        }
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        if (p.alive && d < 30) {
          state.shards.splice(i, 1);
          if (s.kind === 'salvage') {
            addScore(SHARD_SCORE * p.salvageMult, s.x, s.y);
          } else if (s.kind === 'shield') {
            p.shield = Math.min(3, p.shield + 1);
            state.shield = p.shield;
            particles.text(s.x, s.y, 'SHIELD +1', '#4de3a5');
          } else if (s.kind === 'repair') {
            p.hull = Math.min(3, p.hull + 1);
            state.hull = p.hull;
            particles.text(s.x, s.y, 'HULL +1', '#4de3a5');
          }
          continue;
        }
        if (s.y > HEIGHT + 30 || s.x < -30 || s.x > WIDTH + 30) state.shards.splice(i, 1);
      }

      // Combo decay.
      if (state.comboTimer > 0) {
        state.comboTimer -= dt;
        if (state.comboTimer <= 0) {
          state.combo = 0;
          state.comboLevel = 1;
        }
      }

      // Engine trail.
      if (p.alive && Math.hypot(p.vx, p.vy) > 60 && random.chance(dt * 40)) {
        particles.trail(p.x - Math.cos(p.angle) * 18, p.y - Math.sin(p.angle) * 18, '#38bdf8');
      }

      // Sync the HUD-facing fields.
      state.hull = p.hull;
      state.shield = p.shield;

      // Wave cleared?
      if (state.waveActive && planner.remaining === 0 && state.enemies.length === 0) {
        state.waveActive = false;
        state.score += WAVE_CLEAR_BONUS;
        particles.text(WIDTH / 2, HEIGHT / 2 - 60, `WAVE BONUS +${WAVE_CLEAR_BONUS}`, '#ffd166');
        if (state.wave >= WAVES) {
          state.score += VICTORY_BONUS;
          events |= EVENT_VICTORY;
        } else {
          events |= EVENT_WAVE_CLEAR;
        }
      }
      return events;
    },
    pickUpgradeChoices(upgrades, count) {
      const pool = [...upgrades];
      for (let i = pool.length - 1; i > 0; i -= 1) {
        const j = Math.floor(random.next() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      state.upgradeChoices = pool.slice(0, count);
      return state.upgradeChoices;
    },
  };
}
