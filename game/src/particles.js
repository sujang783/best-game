// Particles, floating score text, screen shake and the parallax starfield.
// Everything here is cosmetic: it never changes the score or the outcome.

import { WIDTH, HEIGHT } from './config.js';

export function createParticles(random) {
  const stars = [];
  for (let layer = 0; layer < 3; layer += 1) {
    const count = [70, 45, 25][layer];
    for (let i = 0; i < count; i += 1) {
      stars.push({
        x: random.range(0, WIDTH),
        y: random.range(0, HEIGHT),
        size: random.range(0.6, 1.4 + layer * 0.7),
        speed: [14, 30, 55][layer],
        twinkle: random.range(0, Math.PI * 2),
      });
    }
  }
  const parts = [];
  const texts = [];
  let shake = 0;

  return {
    get shake() { return shake; },
    update(dt, scrollSpeed) {
      for (const s of stars) {
        s.y += s.speed * dt + scrollSpeed * dt;
        s.twinkle += dt * 2;
        if (s.y > HEIGHT + 2) {
          s.y = -2;
          s.x = random.range(0, WIDTH);
        }
      }
      for (let i = parts.length - 1; i >= 0; i -= 1) {
        const p = parts[i];
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.98;
        p.vy *= 0.98;
        if (p.life <= 0) parts.splice(i, 1);
      }
      for (let i = texts.length - 1; i >= 0; i -= 1) {
        const t = texts[i];
        t.life -= dt;
        t.y -= 42 * dt;
        if (t.life <= 0) texts.splice(i, 1);
      }
      shake = Math.max(0, shake - dt * 26);
    },
    burst(x, y, color, count, speed) {
      for (let i = 0; i < count; i += 1) {
        const a = random.range(0, Math.PI * 2);
        const v = random.range(speed * 0.3, speed);
        parts.push({
          x, y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v,
          life: random.range(0.3, 0.8),
          maxLife: 0.8,
          size: random.range(1.5, 4),
          color,
        });
      }
    },
    trail(x, y, color) {
      parts.push({
        x: x + random.range(-4, 4), y: y + random.range(-2, 4),
        vx: random.range(-12, 12), vy: random.range(30, 80),
        life: 0.35, maxLife: 0.35, size: random.range(1.5, 3), color,
      });
    },
    text(x, y, message, color) {
      texts.push({ x, y, message, color, life: 1.1 });
    },
    addShake(amount) {
      shake = Math.min(14, shake + amount);
    },
    drawStars(ctx, t) {
      for (const s of stars) {
        const alpha = 0.45 + 0.35 * Math.sin(s.twinkle + t);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#cfe8ff';
        ctx.fillRect(s.x, s.y, s.size, s.size);
      }
      ctx.globalAlpha = 1;
    },
    draw(ctx) {
      for (const p of parts) {
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.textAlign = 'center';
      ctx.font = '700 15px "Segoe UI", system-ui, sans-serif';
      for (const t of texts) {
        ctx.globalAlpha = Math.min(1, t.life);
        ctx.fillStyle = t.color;
        ctx.fillText(t.message, t.x, t.y);
      }
      ctx.globalAlpha = 1;
    },
  };
}
