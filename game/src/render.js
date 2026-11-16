// Everything the player sees: the pre-rendered nebula backdrop, the ships
// and bullets, the HUD, and the title / upgrade / pause / game-over screens.
// It reads the world and never writes it.

import { HEIGHT, WIDTH } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_UPGRADE = 'upgrade';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_VICTORY = 'victory';

const FONT = '"Segoe UI", system-ui, sans-serif';

function makeNebula(random) {
  const off = document.createElement('canvas');
  off.width = WIDTH;
  off.height = HEIGHT;
  const c = off.getContext('2d');
  const base = c.createLinearGradient(0, 0, 0, HEIGHT);
  base.addColorStop(0, '#070718');
  base.addColorStop(0.55, '#0a0a26');
  base.addColorStop(1, '#04040d');
  c.fillStyle = base;
  c.fillRect(0, 0, WIDTH, HEIGHT);
  const blobs = [
    { x: 220, y: 180, r: 320, color: 'rgba(56, 120, 255, 0.16)' },
    { x: 1050, y: 300, r: 380, color: 'rgba(178, 107, 255, 0.13)' },
    { x: 640, y: 680, r: 360, color: 'rgba(255, 93, 143, 0.10)' },
    { x: 900, y: 90, r: 220, color: 'rgba(34, 211, 238, 0.08)' },
  ];
  for (const b of blobs) {
    const g = c.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
    g.addColorStop(0, b.color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.fillRect(b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
  }
  return off;
}

function drawShip(ctx, x, y, angle, color, flame, invulnerable, t) {
  ctx.save();
  ctx.translate(x, y);
  if (invulnerable > 0 && Math.floor(t * 14) % 2 === 0) ctx.globalAlpha = 0.35;
  if (flame > 0.05) {
    const len = 14 + flame * 16 + Math.sin(t * 40) * 4;
    const grad = ctx.createLinearGradient(0, 0, -len, 0);
    grad.addColorStop(0, 'rgba(255, 200, 80, 0.95)');
    grad.addColorStop(1, 'rgba(255, 80, 40, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-12, 6);
    ctx.lineTo(-12 - len, 0);
    ctx.lineTo(-12, -6);
    ctx.closePath();
    ctx.fill();
  }
  ctx.rotate(angle);
  ctx.shadowColor = color;
  ctx.shadowBlur = 16;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(24, 0);
  ctx.lineTo(-14, -13);
  ctx.lineTo(-7, 0);
  ctx.lineTo(-14, 13);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#eafcff';
  ctx.beginPath();
  ctx.moveTo(10, 0);
  ctx.lineTo(-6, -5);
  ctx.lineTo(-6, 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawEnemy(ctx, e, t) {
  const c = e.color;
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.shadowColor = c;
  ctx.shadowBlur = 14;
  ctx.fillStyle = c;
  ctx.strokeStyle = c;
  ctx.lineWidth = 2;
  if (e.flash > 0) {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#ffffff';
  }
  if (e.shape === 'drone') {
    ctx.rotate(Math.sin(e.t * 2) * 0.3);
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(13, 0);
    ctx.lineTo(0, 16);
    ctx.lineTo(-13, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1a0b16';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.shape === 'dart') {
    ctx.rotate(Math.atan2(e.vy, e.vx) + Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(10, 10);
    ctx.lineTo(0, 4);
    ctx.lineTo(-10, 10);
    ctx.closePath();
    ctx.fill();
  } else if (e.shape === 'weaver') {
    const w = 16 + Math.sin(e.t * 5) * 3;
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * Math.PI * 2;
      const r = i % 2 === 0 ? w : w * 0.45;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1a0b26';
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.shape === 'bulwark') {
    ctx.rotate(e.t * 0.4);
    ctx.lineWidth = 3;
    ctx.strokeRect(-20, -20, 40, 40);
    ctx.fillStyle = 'rgba(77, 227, 165, 0.25)';
    ctx.fillRect(-20, -20, 40, 40);
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.shape === 'boss') {
    ctx.rotate(Math.sin(e.t * 0.7) * 0.08);
    ctx.beginPath();
    ctx.moveTo(0, -58);
    ctx.lineTo(46, -20);
    ctx.lineTo(58, 26);
    ctx.lineTo(20, 52);
    ctx.lineTo(-20, 52);
    ctx.lineTo(-58, 26);
    ctx.lineTo(-46, -20);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#2a0612';
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(0, 0, 9 + Math.sin(e.t * 6) * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c;
    for (const sx of [-34, 34]) {
      ctx.beginPath();
      ctx.arc(sx, 8, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
  if (e.maxHp > 1 && e.type !== 'boss') {
    const w = e.radius * 2;
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(e.x - w / 2, e.y - e.radius - 12, w, 4);
    ctx.fillStyle = e.color;
    ctx.fillRect(e.x - w / 2, e.y - e.radius - 12, w * (e.hp / e.maxHp), 4);
  }
}

function drawHud(ctx, state, best) {
  ctx.textAlign = 'left';
  ctx.font = `800 26px ${FONT}`;
  ctx.fillStyle = '#e8f6ff';
  ctx.fillText(`SCORE ${state.score.toLocaleString('en-US')}`, 24, 40);
  ctx.font = `600 15px ${FONT}`;
  ctx.fillStyle = '#8fa8c8';
  ctx.fillText(`BEST ${Math.max(best, state.score).toLocaleString('en-US')}`, 24, 62);
  ctx.textAlign = 'center';
  ctx.font = `800 22px ${FONT}`;
  ctx.fillStyle = '#ffd166';
  ctx.fillText(`WAVE ${Math.max(1, state.wave)} / 10`, WIDTH / 2, 40);
  ctx.textAlign = 'right';
  for (let i = 0; i < 3; i += 1) {
    const x = WIDTH - 30 - i * 34;
    const y = 32;
    ctx.fillStyle = i < state.hull ? '#ff5d7a' : 'rgba(255,93,122,0.18)';
    ctx.beginPath();
    ctx.moveTo(x, y + 6);
    ctx.bezierCurveTo(x - 10, y - 4, x - 5, y - 12, x, y - 5);
    ctx.bezierCurveTo(x + 5, y - 12, x + 10, y - 4, x, y + 6);
    ctx.fill();
  }
  for (let i = 0; i < 3; i += 1) {
    ctx.fillStyle = i < state.shield ? '#4de3a5' : 'rgba(77,227,165,0.15)';
    ctx.beginPath();
    ctx.arc(WIDTH - 30 - i * 26, 58, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  if (state.comboLevel > 1) {
    ctx.textAlign = 'right';
    ctx.font = `800 20px ${FONT}`;
    ctx.fillStyle = '#ffd166';
    ctx.fillText(`COMBO x${state.comboLevel}`, WIDTH - 24, 100);
    ctx.fillStyle = 'rgba(255,209,102,0.25)';
    ctx.fillRect(WIDTH - 164, 108, 140, 5);
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(WIDTH - 164, 108, 140 * (state.comboTimer / 3.5), 5);
  }
  if (state.boss) {
    const b = state.boss;
    const w = 560;
    const x = (WIDTH - w) / 2;
    const y = 66;
    ctx.textAlign = 'center';
    ctx.font = `800 16px ${FONT}`;
    ctx.fillStyle = '#ff5d7a';
    ctx.fillText('VOID MAW', WIDTH / 2, y - 8);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(x, y, w, 10);
    ctx.fillStyle = '#ff3b5c';
    ctx.fillRect(x, y, w * Math.max(0, b.hp / b.maxHp), 10);
  }
  if (state.waveBanner > 0) {
    ctx.globalAlpha = Math.min(1, state.waveBanner);
    ctx.textAlign = 'center';
    ctx.font = `800 44px ${FONT}`;
    ctx.fillStyle = '#e8f6ff';
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 24;
    ctx.fillText(state.waveBannerText, WIDTH / 2, HEIGHT / 2 - 40);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
}

function drawTitle(ctx, state, best, t) {
  ctx.textAlign = 'center';
  ctx.shadowColor = '#22d3ee';
  ctx.shadowBlur = 34;
  ctx.fillStyle = '#eafcff';
  ctx.font = `900 92px ${FONT}`;
  ctx.fillText('NOVA DRIFT', WIDTH / 2, 300);
  ctx.shadowBlur = 0;
  ctx.font = `600 24px ${FONT}`;
  ctx.fillStyle = '#7dd3fc';
  ctx.fillText('A NEON ARCADE SPACE SHOOTER', WIDTH / 2, 344);
  ctx.font = `400 19px ${FONT}`;
  ctx.fillStyle = '#c7d8ee';
  ctx.fillText('Blast the swarm. Survive 10 waves. Slay the VOID MAW. Pick your upgrades.', WIDTH / 2, 396);
  const pulse = 0.65 + 0.35 * Math.sin(t * 4);
  ctx.globalAlpha = pulse;
  ctx.font = `800 26px ${FONT}`;
  ctx.fillStyle = '#ffd166';
  ctx.fillText('PRESS ENTER OR CLICK TO LAUNCH', WIDTH / 2, 470);
  ctx.globalAlpha = 1;
  ctx.font = `400 17px ${FONT}`;
  ctx.fillStyle = '#8fa8c8';
  ctx.fillText('WASD / ARROWS — fly      MOUSE — aim      HOLD CLICK / SPACE — fire', WIDTH / 2, 540);
  ctx.fillText('P — pause      M — mute      Between waves, pick 1 of 3 upgrades', WIDTH / 2, 568);
  ctx.fillText('Best score: ' + Math.max(0, best).toLocaleString('en-US'), WIDTH / 2, 620);
}

function drawUpgrade(ctx, state) {
  ctx.fillStyle = 'rgba(3, 3, 16, 0.72)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.textAlign = 'center';
  ctx.font = `800 40px ${FONT}`;
  ctx.fillStyle = '#ffd166';
  ctx.fillText(`WAVE ${state.wave} CLEARED`, WIDTH / 2, 170);
  ctx.font = `400 20px ${FONT}`;
  ctx.fillStyle = '#c7d8ee';
  ctx.fillText('Choose one upgrade — press 1, 2 or 3, or click a card.', WIDTH / 2, 208);
  const cards = state.upgradeChoices;
  const cw = 300;
  const ch = 210;
  const gap = 36;
  const total = cards.length * cw + (cards.length - 1) * gap;
  let x = (WIDTH - total) / 2;
  const y = 270;
  cards.forEach((u, i) => {
    ctx.fillStyle = 'rgba(16, 28, 58, 0.95)';
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, cw, ch, 14);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#8fa8c8';
    ctx.font = `700 18px ${FONT}`;
    ctx.fillText(`[${i + 1}]`, x + cw / 2, y + 42);
    ctx.fillStyle = '#e8f6ff';
    ctx.font = `800 22px ${FONT}`;
    ctx.fillText(u.name, x + cw / 2, y + 84);
    ctx.fillStyle = '#7dd3fc';
    ctx.font = `400 18px ${FONT}`;
    ctx.fillText(u.blurb, x + cw / 2, y + 122);
    ctx.fillStyle = '#ffd166';
    ctx.font = `700 15px ${FONT}`;
    ctx.fillText('CLICK TO TAKE', x + cw / 2, y + 168);
    x += cw + gap;
  });
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(3, 3, 16, 0.66)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.textAlign = 'center';
  ctx.font = `800 56px ${FONT}`;
  ctx.fillStyle = '#e8f6ff';
  ctx.fillText('PAUSED', WIDTH / 2, HEIGHT / 2 - 10);
  ctx.font = `400 20px ${FONT}`;
  ctx.fillStyle = '#8fa8c8';
  ctx.fillText('Press P or click to resume', WIDTH / 2, HEIGHT / 2 + 34);
}

function drawOver(ctx, state, best, victory) {
  ctx.fillStyle = 'rgba(3, 3, 16, 0.72)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.textAlign = 'center';
  if (victory) {
    ctx.shadowColor = '#ffd166';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#ffd166';
    ctx.font = `900 64px ${FONT}`;
    ctx.fillText('SECTOR CLEARED!', WIDTH / 2, 260);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#c7d8ee';
    ctx.font = `400 22px ${FONT}`;
    ctx.fillText('All 10 waves destroyed. The drift is yours, pilot.', WIDTH / 2, 306);
  } else {
    ctx.shadowColor = '#ff3b5c';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#ff5d7a';
    ctx.font = `900 64px ${FONT}`;
    ctx.fillText('SHIP DESTROYED', WIDTH / 2, 260);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#c7d8ee';
    ctx.font = `400 22px ${FONT}`;
    ctx.fillText('The swarm claims another pilot.', WIDTH / 2, 306);
  }
  const isBest = state.score >= best && state.score > 0;
  ctx.font = `800 34px ${FONT}`;
  ctx.fillStyle = '#e8f6ff';
  ctx.fillText(`SCORE  ${state.score.toLocaleString('en-US')}`, WIDTH / 2, 380);
  ctx.font = `600 20px ${FONT}`;
  ctx.fillStyle = '#8fa8c8';
  ctx.fillText(`WAVE REACHED  ${Math.max(1, state.wave)}  ·  KILLS  ${state.kills}`, WIDTH / 2, 420);
  ctx.fillText(`BEST  ${Math.max(best, state.score).toLocaleString('en-US')}`, WIDTH / 2, 450);
  if (isBest) {
    ctx.fillStyle = '#ffd166';
    ctx.font = `800 22px ${FONT}`;
    ctx.fillText('★ NEW BEST ★', WIDTH / 2, 492);
  }
  const pulse = 0.65 + 0.35 * Math.sin(performance.now() / 260);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#ffd166';
  ctx.font = `800 26px ${FONT}`;
  ctx.fillText('PRESS ENTER OR CLICK TO FLY AGAIN', WIDTH / 2, 560);
  ctx.globalAlpha = 1;
}

export function createRenderer(canvas, random) {
  const ctx = canvas.getContext('2d');
  const nebula = makeNebula(random);

  return {
    draw(world, screen, best) {
      const state = world.state;
      const t = state.time;
      const particles = world.particles;
      const p = world.player.state;
      ctx.save();
      if (particles.shake > 0.2) {
        ctx.translate(
          (Math.random() - 0.5) * particles.shake,
          (Math.random() - 0.5) * particles.shake,
        );
      }
      ctx.drawImage(nebula, 0, 0);
      particles.drawStars(ctx, t);

      // Salvage shards.
      for (const s of state.shards) {
        const bob = Math.sin(s.t * 5) * 2;
        ctx.save();
        ctx.translate(s.x, s.y + bob);
        if (s.kind === 'salvage') {
          ctx.rotate(s.t * 2);
          ctx.fillStyle = '#ffd166';
          ctx.shadowColor = '#ffd166';
          ctx.shadowBlur = 10;
          ctx.fillRect(-5, -5, 10, 10);
        } else if (s.kind === 'shield') {
          ctx.fillStyle = '#4de3a5';
          ctx.shadowColor = '#4de3a5';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(0, 0, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#06281c';
          ctx.font = `800 13px ${FONT}`;
          ctx.textAlign = 'center';
          ctx.fillText('S', 0, 5);
        } else {
          ctx.fillStyle = '#ff5d7a';
          ctx.shadowColor = '#ff5d7a';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(0, 0, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#2a0612';
          ctx.font = `800 13px ${FONT}`;
          ctx.textAlign = 'center';
          ctx.fillText('+', 0, 5);
        }
        ctx.restore();
      }

      // Enemy bullets.
      for (const b of state.enemyBullets) {
        ctx.fillStyle = '#ff5d8f';
        ctx.shadowColor = '#ff5d8f';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Enemies.
      for (const e of state.enemies) drawEnemy(ctx, e, t);

      // Player bullets.
      for (const b of state.bullets) {
        ctx.fillStyle = '#9be7ff';
        ctx.shadowColor = '#22d3ee';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Player ship.
      if (p.alive) {
        drawShip(ctx, p.x, p.y, p.angle, '#22d3ee', p.flame, p.invulnerable, t);
      }

      particles.draw(ctx);
      ctx.restore();

      if (screen === SCREEN_TITLE) drawTitle(ctx, state, best, t);
      else if (screen === SCREEN_UPGRADE) {
        drawHud(ctx, state, best);
        drawUpgrade(ctx, state);
      } else if (screen === SCREEN_PAUSED) {
        drawHud(ctx, state, best);
        drawPaused(ctx);
      } else if (screen === SCREEN_OVER) {
        drawHud(ctx, state, best);
        drawOver(ctx, state, best, false);
      } else if (screen === SCREEN_VICTORY) {
        drawHud(ctx, state, best);
        drawOver(ctx, state, best, true);
      } else {
        drawHud(ctx, state, best);
      }
    },
  };
}
