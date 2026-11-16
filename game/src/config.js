// Every number that tunes NOVA DRIFT lives here, so the feel can be changed
// in one place: the arena, the ship, the waves, the scoring and the win.

export const WIDTH = 1280;
export const HEIGHT = 800;
export const STEP = 1 / 60;
export const BEST_KEY = 'nova-drift-best';

export const PLAYER = {
  radius: 16,
  speed: 340,
  accel: 2600,
  fireInterval: 0.16,
  bulletSpeed: 720,
  bulletRadius: 5,
  bulletDamage: 1,
  hull: 3,
  invulnerableSeconds: 2,
  respawnX: WIDTH / 2,
  respawnY: HEIGHT - 120,
};

export const WAVES = 10;
export const BOSS_WAVES = new Set([5, 10]);
export const WAVE_CLEAR_BONUS = 500;
export const VICTORY_BONUS = 5000;

export const COMBO_WINDOW = 3.5;
export const COMBO_PER_LEVEL = 8;
export const COMBO_MAX = 5;

export const SHARD_SCORE = 25;
export const SHARD_MAGNET_RADIUS = 260;

export const ENEMY_TYPES = {
  drone:   { radius: 16, hp: 1, speed: 95,  score: 100, color: '#ff5d8f', shape: 'drone' },
  dart:    { radius: 13, hp: 1, speed: 240, score: 150, color: '#ffb020', shape: 'dart' },
  weaver:  { radius: 18, hp: 2, speed: 120, score: 200, color: '#b26bff', shape: 'weaver' },
  bulwark: { radius: 26, hp: 5, speed: 55,  score: 300, color: '#4de3a5', shape: 'bulwark' },
  boss:    { radius: 58, hp: 90, speed: 45, score: 5000, color: '#ff3b5c', shape: 'boss' },
};

// How many of each type a wave spawns, before the wave number scales it.
export const WAVE_TABLE = [
  { drone: 6 },
  { drone: 8, dart: 3 },
  { drone: 9, dart: 5, weaver: 2 },
  { drone: 10, dart: 6, weaver: 4 },
  { boss: 1, drone: 6 },
  { drone: 12, dart: 8, weaver: 6, bulwark: 2 },
  { drone: 12, dart: 10, weaver: 8, bulwark: 3 },
  { drone: 14, dart: 12, weaver: 9, bulwark: 4 },
  { drone: 16, dart: 12, weaver: 10, bulwark: 5 },
  { boss: 1, drone: 10, dart: 8, weaver: 6, bulwark: 4 },
];

// Upgrades offered between waves: id, name, one-line pitch, apply(state).
export const UPGRADES = [
  { id: 'rapid',   name: 'RAPID CYCLER',   blurb: 'Fire 25% faster',            apply: (s) => { s.fireInterval *= 0.75; } },
  { id: 'twin',    name: 'TWIN CANNONS',    blurb: '+1 bullet per shot',        apply: (s) => { s.shots += 1; } },
  { id: 'pierce',  name: 'PIERCING ROUNDS', blurb: 'Bullets pass through foes', apply: (s) => { s.pierce += 1; } },
  { id: 'shield',  name: 'AEGIS CELL',      blurb: '+1 shield, blocks a hit',   apply: (s) => { s.shield = Math.min(3, s.shield + 1); } },
  { id: 'thrust',  name: 'ION THRUSTERS',   blurb: 'Move 20% faster',           apply: (s) => { s.speed *= 1.2; } },
  { id: 'magnet',  name: 'TRACTOR WEB',     blurb: 'Pull salvage from afar',    apply: (s) => { s.magnet += 1; } },
  { id: 'salvage', name: 'SALVAGE RIG',     blurb: 'Salvage worth double',      apply: (s) => { s.salvageMult *= 2; } },
  { id: 'repair',  name: 'HULL PLATING',    blurb: 'Restore 1 hull',            apply: (s) => { s.hull = Math.min(3, s.hull + 1); } },
];
