// Enemies and waves: four small types with their own movement and a boss
// on waves 5 and 10. A wave is a spawn queue; the world asks for the next
// spawn when the timer runs out, and the wave ends when the queue is empty
// and nothing hostile is left alive.

import { ENEMY_TYPES, HEIGHT, WAVE_TABLE, WIDTH } from './config.js';

function makeEnemy(type, x, y, random, wave) {
  const def = ENEMY_TYPES[type];
  const hpScale = type === 'boss' ? 1 + (wave - 5) * 0.35 : 1;
  return {
    type,
    x, y,
    vx: 0, vy: 0,
    hp: Math.round(def.hp * hpScale),
    maxHp: Math.round(def.hp * hpScale),
    radius: def.radius,
    speed: def.speed * random.range(0.9, 1.15),
    score: def.score,
    color: def.color,
    shape: def.shape,
    t: random.range(0, Math.PI * 2),
    phase: random.range(0, Math.PI * 2),
    shootTimer: random.range(1.2, 2.4),
    burstTimer: 3,
    spawnTimer: 2.5,
    flash: 0,
    entered: false,
  };
}

export function createWavePlanner(random) {
  let queue = [];
  let spawnTimer = 0;

  function buildQueue(wave) {
    const table = WAVE_TABLE[wave - 1] ?? WAVE_TABLE[WAVE_TABLE.length - 1];
    const list = [];
    for (const [type, count] of Object.entries(table)) {
      for (let i = 0; i < count; i += 1) list.push(type);
    }
    // Shuffle, but keep the boss first on boss waves so it arrives early.
    for (let i = list.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random.next() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    list.sort((a, b) => (a === 'boss' ? -1 : 0) - (b === 'boss' ? -1 : 0));
    return list;
  }

  return {
    start(wave) {
      queue = buildQueue(wave);
      spawnTimer = 0.4;
    },
    get remaining() { return queue.length; },
    // Returns a fresh enemy to add, or null when nothing is due.
    next(dt, wave) {
      if (queue.length === 0) return null;
      spawnTimer -= dt;
      if (spawnTimer > 0) return null;
      const type = queue.shift();
      const interval = type === 'boss' ? 0 : 0.55;
      spawnTimer = interval;
      const x = type === 'boss' ? WIDTH / 2 : random.range(50, WIDTH - 50);
      return makeEnemy(type, x, -40, random, wave);
    },
  };
}

// Steers one enemy for a step. Returns enemy bullets it fired (possibly none).
export function steerEnemy(e, dt, px, py) {
  const bullets = [];
  e.t += dt;
  e.flash = Math.max(0, e.flash - dt * 6);
  if (e.type === 'drone') {
    e.y += e.speed * dt;
    e.x += Math.sin(e.t * 2.2 + e.phase) * 55 * dt;
  } else if (e.type === 'dart') {
    if (!e.entered && e.y < 140) {
      e.y += e.speed * 0.55 * dt;
      if (e.y >= 140) e.entered = true;
    } else {
      const dx = px - e.x;
      const dy = py - e.y;
      const d = Math.hypot(dx, dy) || 1;
      e.x += (dx / d) * e.speed * dt;
      e.y += (dy / d) * e.speed * dt;
    }
  } else if (e.type === 'weaver') {
    e.y += e.speed * dt;
    e.x += Math.sin(e.t * 3.1 + e.phase) * 150 * dt;
    e.shootTimer -= dt;
    if (e.shootTimer <= 0 && e.y > 40 && e.y < HEIGHT * 0.6) {
      e.shootTimer = 2.6;
      const dx = px - e.x;
      const dy = py - e.y;
      const d = Math.hypot(dx, dy) || 1;
      bullets.push({
        x: e.x, y: e.y + e.radius,
        vx: (dx / d) * 170, vy: (dy / d) * 170,
        radius: 7, damage: 1, life: 6, enemy: true,
      });
    }
  } else if (e.type === 'bulwark') {
    e.y += e.speed * dt;
    if (e.y > 220) e.y = 220 + Math.sin(e.t * 0.8) * 30;
  } else if (e.type === 'boss') {
    if (e.y < 130) {
      e.y += e.speed * dt;
    } else {
      e.x = WIDTH / 2 + Math.sin(e.t * 0.55) * (WIDTH / 2 - 160);
      e.y = 130 + Math.sin(e.t * 1.1) * 24;
    }
    e.burstTimer -= dt;
    if (e.burstTimer <= 0 && e.y > 60) {
      e.burstTimer = 2.1;
      const n = 12;
      for (let i = 0; i < n; i += 1) {
        const a = (i / n) * Math.PI * 2 + e.phase;
        bullets.push({
          x: e.x, y: e.y + 30,
          vx: Math.cos(a) * 150, vy: Math.sin(a) * 150,
          radius: 8, damage: 1, life: 7, enemy: true,
        });
      }
    }
    e.spawnTimer -= dt;
    if (e.spawnTimer <= 0) {
      e.spawnTimer = 5;
      // The world answers this by spawning a drone beside the boss.
      bullets.push({ spawnDrone: true, x: e.x, y: e.y });
    }
  }
  return bullets;
}
