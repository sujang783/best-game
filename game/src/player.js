// The player's ship: movement with acceleration and drag, mouse aim,
// firing patterns shaped by the upgrades the player has chosen.

import { HEIGHT, PLAYER, WIDTH } from './config.js';

export function createPlayer() {
  const state = {
    x: PLAYER.respawnX,
    y: PLAYER.respawnY,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2,
    fireTimer: 0,
    invulnerable: 0,
    hull: PLAYER.hull,
    shield: 0,
    shots: 1,
    pierce: 0,
    magnet: 0,
    salvageMult: 1,
    fireInterval: PLAYER.fireInterval,
    speed: PLAYER.speed,
    alive: true,
    flame: 0,
  };

  return {
    state,
    reset() {
      state.x = PLAYER.respawnX;
      state.y = PLAYER.respawnY;
      state.vx = 0;
      state.vy = 0;
      state.angle = -Math.PI / 2;
      state.fireTimer = 0;
      state.invulnerable = 0;
      state.hull = PLAYER.hull;
      state.shield = 0;
      state.shots = 1;
      state.pierce = 0;
      state.magnet = 0;
      state.salvageMult = 1;
      state.fireInterval = PLAYER.fireInterval;
      state.speed = PLAYER.speed;
      state.alive = true;
    },
    // Moves the ship; returns the bullets fired this step (possibly none).
    update(dt, dir, aim, firing) {
      if (!state.alive) return [];
      state.vx += dir.x * PLAYER.accel * dt;
      state.vy += dir.y * PLAYER.accel * dt;
      const drag = Math.exp(-6 * dt);
      state.vx *= drag;
      state.vy *= drag;
      const v = Math.hypot(state.vx, state.vy);
      const max = state.speed;
      if (v > max) {
        state.vx = (state.vx / v) * max;
        state.vy = (state.vy / v) * max;
      }
      state.x = Math.min(WIDTH - PLAYER.radius, Math.max(PLAYER.radius, state.x + state.vx * dt));
      state.y = Math.min(HEIGHT - PLAYER.radius, Math.max(PLAYER.radius, state.y + state.vy * dt));
      if (aim.seen) {
        const dx = aim.x - state.x;
        const dy = aim.y - state.y;
        if (Math.hypot(dx, dy) > 8) state.angle = Math.atan2(dy, dx);
      } else if (dir.x !== 0 || dir.y !== 0) {
        state.angle = Math.atan2(dir.y, dir.x);
      }
      state.flame = Math.min(1, state.flame + (Math.hypot(state.vx, state.vy) > 40 ? dt * 6 : -dt * 6));
      state.invulnerable = Math.max(0, state.invulnerable - dt);
      state.fireTimer -= dt;
      const bullets = [];
      if (firing && state.fireTimer <= 0) {
        state.fireTimer = state.fireInterval;
        const n = state.shots;
        const spread = 0.09;
        for (let i = 0; i < n; i += 1) {
          const offset = n === 1 ? 0 : (i - (n - 1) / 2) * spread;
          const a = state.angle + offset;
          const px = state.x + Math.cos(a) * 22;
          const py = state.y + Math.sin(a) * 22;
          bullets.push({
            x: px, y: py,
            vx: Math.cos(a) * PLAYER.bulletSpeed,
            vy: Math.sin(a) * PLAYER.bulletSpeed,
            damage: PLAYER.bulletDamage,
            pierce: state.pierce,
            radius: PLAYER.bulletRadius,
            life: 1.4,
          });
        }
      }
      return bullets;
    },
    hit() {
      if (state.invulnerable > 0 || !state.alive) return false;
      if (state.shield > 0) {
        state.shield -= 1;
        state.invulnerable = 1;
        return 'shield';
      }
      state.hull -= 1;
      state.invulnerable = PLAYER.invulnerableSeconds;
      if (state.hull <= 0) state.alive = false;
      return 'hull';
    },
  };
}
