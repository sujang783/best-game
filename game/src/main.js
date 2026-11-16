// Boot and the one loop: input is read every frame, the world advances in
// fixed 1/60 s steps, and the renderer paints what is there. The game moves
// between six screens: title, play, upgrade, paused, game over and victory.
//
// ?seed=N fixes the random pattern. ?shot=start|play|boss|end (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.

import { BEST_KEY, STEP, UPGRADES } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_BOSS, EVENT_HIT, EVENT_OVER, EVENT_VICTORY, EVENT_WAVE_CLEAR } from './world.js';
import { ACTION_CONFIRM, ACTION_MUTE, ACTION_PAUSE, createInput } from './input.js';
import { createAudio } from './audio.js';
import {
  SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_UPGRADE, SCREEN_VICTORY, createRenderer,
} from './render.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const random = createRandom(seed);
const world = createWorld(random);
const renderer = createRenderer(canvas, random);
const audio = createAudio();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world, random);
  let painted = 0;
  function paint() {
    renderer.draw(world, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  function announce(message) {
    status.textContent = message;
  }

  function startRun() {
    const events = world.startRun();
    screen = SCREEN_PLAY;
    accumulator = 0;
    if (events & EVENT_BOSS) audio.bossAlarm();
    announce('Playing. Wave 1. Three hulls.');
  }

  function finishRun(victory) {
    screen = victory ? SCREEN_VICTORY : SCREEN_OVER;
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    if (victory) audio.victory();
    else audio.gameOver();
    announce(victory
      ? `Sector cleared. Score ${world.state.score}.`
      : `Game over. Score ${world.state.score}. Best ${best}.`);
  }

  function openUpgrades() {
    world.pickUpgradeChoices(UPGRADES, 3);
    screen = SCREEN_UPGRADE;
    audio.waveClear();
    announce('Wave cleared. Choose an upgrade: press 1, 2 or 3.');
  }

  function applyUpgrade(index) {
    if (world.chooseUpgrade(index)) {
      audio.upgrade();
      const events = world.beginNextWave();
      screen = SCREEN_PLAY;
      accumulator = 0;
      if (events & EVENT_BOSS) audio.bossAlarm();
      announce(`Wave ${world.state.wave}.`);
    }
  }

  function upgradeCardAt(x, y) {
    // The three upgrade cards are laid out by render.js: 300 wide, 210 tall,
    // 36 apart, centred, top at y=270.
    const cards = world.state.upgradeChoices;
    if (cards.length === 0) return -1;
    const cw = 300;
    const gap = 36;
    const total = cards.length * cw + (cards.length - 1) * gap;
    const left = (1280 - total) / 2;
    const top = 270;
    if (y < top || y > top + 210) return -1;
    for (let i = 0; i < cards.length; i += 1) {
      if (x >= left + i * (cw + gap) && x <= left + i * (cw + gap) + cw) return i;
    }
    return -1;
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      const muted = audio.toggleMute();
      announce(muted ? 'Muted.' : 'Sound on.');
    }
    if (actions & ACTION_CONFIRM) audio.unlock();
    if (screen === SCREEN_TITLE || screen === SCREEN_OVER || screen === SCREEN_VICTORY) {
      if (actions & ACTION_CONFIRM) startRun();
      return;
    }
    if (screen === SCREEN_UPGRADE) {
      if (actions & ACTION_CONFIRM) {
        const aim = input.aim();
        const card = aim.seen ? upgradeCardAt(aim.x, aim.y) : -1;
        if (card >= 0) applyUpgrade(card);
      }
      return;
    }
    if (actions & ACTION_PAUSE) {
      if (screen === SCREEN_PLAY) {
        screen = SCREEN_PAUSED;
        announce('Paused.');
      } else if (screen === SCREEN_PAUSED) {
        screen = SCREEN_PLAY;
        announce('Playing.');
      }
    } else if (actions & ACTION_CONFIRM && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    }
  }

  function handleUpgradeKeys(event) {
    if (screen !== SCREEN_UPGRADE) return;
    if (event.key === '1') applyUpgrade(0);
    else if (event.key === '2') applyUpgrade(1);
    else if (event.key === '3') applyUpgrade(2);
  }
  window.addEventListener('keydown', handleUpgradeKeys);

  function step() {
    if (screen === SCREEN_TITLE) {
      world.step(STEP, null, true);
      return;
    }
    if (screen !== SCREEN_PLAY) return;
    const killsBefore = world.state.kills;
    const events = world.step(STEP, input, false);
    if (world.state.kills > killsBefore) audio.enemyDie();
    if (events & EVENT_HIT) audio.playerHit();
    if (events & EVENT_BOSS) audio.bossAlarm();
    if (events & EVENT_OVER) {
      finishRun(false);
      return;
    }
    if (events & EVENT_VICTORY) {
      finishRun(true);
      return;
    }
    if (events & EVENT_WAVE_CLEAR) {
      openUpgrades();
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
      step();
      accumulator -= STEP;
      if (screen !== SCREEN_TITLE && screen !== SCREEN_PLAY) {
        accumulator = 0;
        break;
      }
    }
    if (screen !== SCREEN_TITLE && screen !== SCREEN_PLAY) accumulator = 0;
    renderer.draw(world, screen, best);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Nova Drift. Press Enter or click to launch.');
  // Read-only handle for automated checks (screenshots, playtests).
  window.__nova = { world, get screen() { return screen; } };
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
