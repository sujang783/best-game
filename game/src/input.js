// Keyboard and mouse, read once a frame: the loop asks for a movement
// direction and for the actions pressed since last frame (confirm, pause,
// mute, fire). Mouse aim is tracked in canvas coordinates.

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_MUTE = 4;

export function createInput(canvas) {
  const keys = new Set();
  let actions = 0;
  let firing = false;
  let mouseX = 0;
  let mouseY = 0;
  let mouseSeen = false;

  function toCanvas(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function keyName(event) {
    return event.key.length === 1 ? event.key.toLowerCase() : event.key;
  }

  window.addEventListener('keydown', (event) => {
    const key = keyName(event);
    if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) event.preventDefault();
    if (event.repeat) return;
    keys.add(key);
    if (key === ' ' || key === 'enter') actions |= ACTION_CONFIRM;
    if (key === 'p' || key === 'escape') actions |= ACTION_PAUSE;
    if (key === 'm') actions |= ACTION_MUTE;
  });
  window.addEventListener('keyup', (event) => keys.delete(keyName(event)));
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('mousemove', (event) => {
    const p = toCanvas(event);
    mouseX = p.x;
    mouseY = p.y;
    mouseSeen = true;
  });
  canvas.addEventListener('mousedown', (event) => {
    const p = toCanvas(event);
    mouseX = p.x;
    mouseY = p.y;
    mouseSeen = true;
    firing = true;
    actions |= ACTION_CONFIRM;
  });
  window.addEventListener('mouseup', () => { firing = false; });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  return {
    direction() {
      let x = 0;
      let y = 0;
      if (keys.has('a') || keys.has('arrowleft')) x -= 1;
      if (keys.has('d') || keys.has('arrowright')) x += 1;
      if (keys.has('w') || keys.has('arrowup')) y -= 1;
      if (keys.has('s') || keys.has('arrowdown')) y += 1;
      if (x !== 0 && y !== 0) {
        const inv = 1 / Math.hypot(x, y);
        x *= inv;
        y *= inv;
      }
      return { x, y };
    },
    isFiring() {
      return firing || keys.has(' ');
    },
    aim() {
      return { x: mouseX, y: mouseY, seen: mouseSeen };
    },
    takeActions() {
      const out = actions;
      actions = 0;
      return out;
    },
  };
}
