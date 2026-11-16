// Deterministic screenshot scenes: each one builds a real world state with
// the seeded random source, so the same seed stages the same picture every
// time. The names match shots.json (start, play, boss, end).

import { ENEMY_TYPES, HEIGHT, WIDTH } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

function placeEnemy(world, type, x, y) {
  const def = ENEMY_TYPES[type];
  const e = {
    type, x, y,
    vx: 0, vy: 0,
    hp: def.hp, maxHp: def.hp,
    radius: def.radius, speed: def.speed,
    score: def.score, color: def.color, shape: def.shape,
    t: 0.6, phase: 0.4, shootTimer: 1.5,
    burstTimer: 2, spawnTimer: 4, flash: 0, entered: true,
  };
  world.state.enemies.push(e);
  return e;
}

function addBullet(world, x, y, vx, vy) {
  world.state.bullets.push({ x, y, vx, vy, damage: 1, pierce: 0, radius: 5, life: 1.2 });
}

function addShard(world, x, y, kind) {
  world.state.shards.push({ x, y, vx: 0, vy: 30, kind, radius: 8, t: 0.4 });
}

// A no-op input for staging: the ship holds still and does not fire while
// a staged scene settles for a few frames.
const STILL = {
  direction: () => ({ x: 0, y: 0 }),
  aim: () => ({ x: 0, y: 0, seen: false }),
  isFiring: () => false,
};

export function stageShot(name, world, random) {
  const s = world.state;
  world.reset();
  if (name === 'start') {
    // Title screen: the ship idles over a drifting starfield with a few
    // decorative drones, as the live title does.
    for (let i = 0; i < 240; i += 1) world.step(1 / 60, null, true);
    return { screen: SCREEN_TITLE, best: 48720 };
  }
  if (name === 'play') {
    world.startRun();
    s.wave = 4;
    s.waveBannerText = 'WAVE 4';
    s.waveBanner = 2.2;
    s.score = 12450;
    s.combo = 17;
    s.comboTimer = 2.6;
    s.comboLevel = 3;
    s.kills = 63;
    const p = world.player.state;
    p.x = 560;
    p.y = 620;
    p.angle = -Math.PI / 2 + 0.25;
    p.shield = 1;
    placeEnemy(world, 'drone', 300, 220);
    placeEnemy(world, 'drone', 820, 180);
    placeEnemy(world, 'drone', 1050, 340);
    placeEnemy(world, 'dart', 700, 300);
    placeEnemy(world, 'weaver', 480, 150);
    placeEnemy(world, 'bulwark', 980, 240).hp = 3;
    addBullet(world, 560, 560, -40, -720);
    addBullet(world, 590, 540, 60, -720);
    addBullet(world, 620, 520, 140, -700);
    addBullet(world, 540, 580, -140, -700);
    addBullet(world, 660, 580, 200, -690);
    world.state.enemyBullets.push({ x: 700, y: 380, vx: -60, vy: 170, radius: 7, damage: 1, life: 5, enemy: true });
    world.state.enemyBullets.push({ x: 480, y: 260, vx: 40, vy: 170, radius: 7, damage: 1, life: 5, enemy: true });
    addShard(world, 640, 420, 'salvage');
    addShard(world, 420, 480, 'salvage');
    world.particles.burst(300, 220, '#ff5d8f', 14, 180);
    world.particles.burst(820, 180, '#ff5d8f', 10, 160);
    for (let i = 0; i < 6; i += 1) world.step(1 / 60, STILL, false);
    return { screen: SCREEN_PLAY, best: 48720 };
  }
  if (name === 'boss') {
    world.startRun();
    s.wave = 5;
    s.waveBannerText = 'WAVE 5 — VOID MAW';
    s.waveBanner = 2.2;
    s.score = 31200;
    s.combo = 24;
    s.comboTimer = 3.1;
    s.comboLevel = 4;
    s.kills = 128;
    const p = world.player.state;
    p.x = 640;
    p.y = 640;
    p.angle = -Math.PI / 2 - 0.15;
    p.shield = 2;
    const boss = placeEnemy(world, 'boss', WIDTH / 2, 130);
    boss.hp = 56;
    s.boss = boss;
    placeEnemy(world, 'drone', 300, 300);
    placeEnemy(world, 'drone', 980, 280);
    placeEnemy(world, 'weaver', 860, 200);
    for (let i = 0; i < 12; i += 1) {
      const a = (i / 12) * Math.PI * 2 + 0.4;
      world.state.enemyBullets.push({
        x: boss.x + Math.cos(a) * 90, y: boss.y + 40 + Math.sin(a) * 60,
        vx: Math.cos(a) * 150, vy: Math.sin(a) * 150,
        radius: 8, damage: 1, life: 6, enemy: true,
      });
    }
    addBullet(world, 620, 560, -30, -720);
    addBullet(world, 660, 540, 30, -720);
    addBullet(world, 640, 500, 0, -720);
    world.particles.burst(640, 300, '#ff3b5c', 20, 200);
    for (let i = 0; i < 6; i += 1) world.step(1 / 60, STILL, false);
    // The boss weaves sideways while settling; re-centre it for the shot.
    boss.x = WIDTH / 2;
    boss.y = 130;
    return { screen: SCREEN_PLAY, best: 48720 };
  }
  // end: the game-over screen after a long run.
  world.startRun();
  s.wave = 7;
  s.score = 48720;
  s.kills = 214;
  const p = world.player.state;
  p.alive = false;
  p.hull = 0;
  s.hull = 0;
  s.waveBanner = 0;
  world.particles.burst(p.x, p.y, '#22d3ee', 60, 300);
  world.particles.burst(p.x, p.y, '#ff5d7a', 40, 240);
  for (let i = 0; i < 12; i += 1) world.step(1 / 60, STILL, false);
  return { screen: SCREEN_OVER, best: 48720 };
}
