'use strict';

function startCaida(canvas, callbacks) {

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;
const BOARD_W = COLS * BLOCK;
const SIDE_X = BOARD_W + 20;

const SKINS = {
  clasico: {
    bg: '#050512',
    grid: 'rgba(255,255,255,0.06)',
    pieces: [null, '#4dd0e1', '#ffd54f', '#ba68c8', '#81c784', '#e57373', '#90caf9', '#ffb74d', '#9e9e9e'],
    blockHighlight: 'rgba(255,255,255,0.12)',
    hudText: 'rgba(255,255,255,0.35)',
    sidebarFill: 'rgba(255,255,255,0.04)',
    sidebarStroke: 'rgba(255,255,255,0.1)',
  },
  neon: {
    bg: '#0a0014',
    grid: 'rgba(255,0,255,0.10)',
    pieces: [null, '#00f0ff', '#fff700', '#ff00ff', '#39ff14', '#ff2079', '#00aaff', '#ff8c00', '#b388ff'],
    blockHighlight: 'rgba(255,255,255,0.18)',
    hudText: 'rgba(0,240,255,0.65)',
    sidebarFill: 'rgba(255,0,255,0.05)',
    sidebarStroke: 'rgba(0,240,255,0.25)',
  },
  retro: {
    bg: '#100c00',
    grid: 'rgba(255,176,0,0.08)',
    pieces: [null, '#33ff99', '#ffb000', '#ff8800', '#66ff33', '#ff5500', '#ffcc00', '#ff9900', '#cc8800'],
    blockHighlight: 'rgba(255,200,100,0.15)',
    hudText: 'rgba(255,176,0,0.55)',
    sidebarFill: 'rgba(255,176,0,0.04)',
    sidebarStroke: 'rgba(255,176,0,0.18)',
  },
};

const PIECES = [
  null,
  [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
  [[2,2],[2,2]],
  [[0,3,0],[3,3,3],[0,0,0]],
  [[0,4,4],[4,4,0],[0,0,0]],
  [[5,5,0],[0,5,5],[0,0,0]],
  [[6,0,0],[6,6,6],[0,0,0]],
  [[0,0,7],[7,7,7],[0,0,0]],
  [[8,8,8],[8,0,8],[8,8,8]],
];

const LINE_SCORES = [0, 100, 300, 500, 800];

const ctx = canvas.getContext('2d');

let board, current, next, score, lines, level;
let gameOver, lastTime, dropAccum, dropInterval;
let rafId;
let paused = false;

let skinName = (() => {
  try {
    const saved = localStorage.getItem('arcade-skin-caida');
    return saved && SKINS[saved] ? saved : 'clasico';
  } catch { return 'clasico'; }
})();
let skin = SKINS[skinName];

function createBoard() {
  return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
}

function randomPiece() {
  const type = Math.floor(Math.random() * 8) + 1;
  const shape = PIECES[type].map(row => [...row]);
  return {
    type, shape,
    x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
    y: 0,
  };
}

function collide(shape, ox, oy) {
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nx = ox + c, ny = oy + r;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && board[ny][nx]) return true;
    }
  return false;
}

function rotateCW(shape) {
  const rows = shape.length, cols = shape[0].length;
  const result = Array.from({ length: cols }, () => new Array(rows).fill(0));
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      result[c][rows - 1 - r] = shape[r][c];
  return result;
}

function tryRotate() {
  const rotated = rotateCW(current.shape);
  for (const kick of [0, -1, 1, -2, 2]) {
    if (!collide(rotated, current.x + kick, current.y)) {
      current.shape = rotated;
      current.x += kick;
      return;
    }
  }
}

function merge() {
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      if (current.shape[r][c])
        board[current.y + r][current.x + c] = current.shape[r][c];
}

function clearLines() {
  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every(v => v !== 0)) {
      board.splice(r, 1);
      board.unshift(new Array(COLS).fill(0));
      cleared++;
      r++;
    }
  }
  if (cleared) {
    lines += cleared;
    score += (LINE_SCORES[cleared] || 0) * level;
    level = Math.floor(lines / 10) + 1;
    dropInterval = Math.max(100, 1000 - (level - 1) * 90);
    callbacks.onScore?.(score);
    callbacks.onLevel?.(level);
  }
}

function ghostY() {
  let gy = current.y;
  while (!collide(current.shape, current.x, gy + 1)) gy++;
  return gy;
}

function hardDrop() {
  const gy = ghostY();
  score += (gy - current.y) * 2;
  current.y = gy;
  callbacks.onScore?.(score);
  lockPiece();
}

function softDrop() {
  if (!collide(current.shape, current.x, current.y + 1)) {
    current.y++;
    score += 1;
    callbacks.onScore?.(score);
  } else {
    lockPiece();
  }
}

function lockPiece() {
  merge();
  clearLines();
  spawn();
}

function spawn() {
  current = next;
  next = randomPiece();
  if (collide(current.shape, current.x, current.y)) {
    endGame();
  }
}

function endGame() {
  gameOver = true;
  cancelAnimationFrame(rafId);
  callbacks.onGameOver?.(score);
}

// ── Drawing ───────────────────────────────────────────────────────────────

function drawBlock(x, y, colorIndex, size, alpha) {
  if (!colorIndex) return;
  ctx.globalAlpha = alpha ?? 1;
  ctx.fillStyle = skin.pieces[colorIndex];
  ctx.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
  ctx.fillStyle = skin.blockHighlight;
  ctx.fillRect(x * size + 1, y * size + 1, size - 2, 4);
  ctx.globalAlpha = 1;
}

function drawGrid() {
  ctx.strokeStyle = skin.grid;
  ctx.lineWidth = 0.5;
  for (let c = 1; c < COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * BLOCK, 0);
    ctx.lineTo(c * BLOCK, ROWS * BLOCK);
    ctx.stroke();
  }
  for (let r = 1; r < ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * BLOCK);
    ctx.lineTo(COLS * BLOCK, r * BLOCK);
    ctx.stroke();
  }
}

function drawSidebar() {
  const NB = 26;
  const px = SIDE_X;
  const py = 40;

  ctx.fillStyle = skin.hudText;
  ctx.font = '10px monospace';
  ctx.fillText('SIGUIENTE', px, py);

  const boxSize = 4 * NB + 8;
  ctx.fillStyle = skin.sidebarFill;
  ctx.strokeStyle = skin.sidebarStroke;
  ctx.lineWidth = 1;
  ctx.fillRect(px, py + 6, boxSize, boxSize);
  ctx.strokeRect(px, py + 6, boxSize, boxSize);

  const shape = next.shape;
  const offX = Math.floor((4 - shape[0].length) / 2);
  const offY = Math.floor((4 - shape.length) / 2);

  ctx.save();
  ctx.translate(px + 4, py + 10);
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      if (shape[r][c])
        drawBlock(offX + c, offY + r, shape[r][c], NB, 1);
  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = skin.bg;
  ctx.fillRect(0, 0, BOARD_W, ROWS * BLOCK);

  drawGrid();

  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      drawBlock(c, r, board[r][c], BLOCK);

  const gy = ghostY();
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      if (current.shape[r][c])
        drawBlock(current.x + c, gy + r, current.shape[r][c], BLOCK, 0.2);

  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      drawBlock(current.x + c, current.y + r, current.shape[r][c], BLOCK);

  drawSidebar();
}

// ── Input ─────────────────────────────────────────────────────────────────

function onKeyDown(e) {
  const gameKeys = ['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'Space', 'KeyX'];
  if (gameKeys.includes(e.code)) e.preventDefault();
  if (paused || gameOver) return;
  switch (e.code) {
    case 'ArrowLeft':
      if (!collide(current.shape, current.x - 1, current.y)) current.x--;
      break;
    case 'ArrowRight':
      if (!collide(current.shape, current.x + 1, current.y)) current.x++;
      break;
    case 'ArrowDown':
      softDrop();
      return;
    case 'ArrowUp':
    case 'KeyX':
      tryRotate();
      break;
    case 'Space':
      hardDrop();
      return;
  }
}

window.addEventListener('keydown', onKeyDown);

// ── Loop ──────────────────────────────────────────────────────────────────

function loop(ts) {
  if (paused) return;
  const dt = lastTime === null ? 0 : Math.min(ts - lastTime, 50);
  lastTime = ts;
  dropAccum += dt;
  if (dropAccum >= dropInterval) {
    dropAccum = 0;
    if (!collide(current.shape, current.x, current.y + 1)) {
      current.y++;
    } else {
      lockPiece();
    }
  }
  if (gameOver) return;
  draw();
  rafId = requestAnimationFrame(loop);
}

// ── Control API ───────────────────────────────────────────────────────────

function pause()   { paused = true; cancelAnimationFrame(rafId); }
function resume()  { paused = false; lastTime = null; rafId = requestAnimationFrame(loop); }
function end()     { gameOver = true; cancelAnimationFrame(rafId); callbacks.onGameOver?.(score); }
function destroy() {
  cancelAnimationFrame(rafId);
  window.removeEventListener('keydown', onKeyDown);
}
function setSkin(name) {
  if (!SKINS[name]) return;
  skinName = name;
  skin = SKINS[name];
  try { localStorage.setItem('arcade-skin-caida', name); } catch {}
}

// ── Boot ──────────────────────────────────────────────────────────────────

board = createBoard();
score = 0; lines = 0; level = 1;
gameOver = false;
dropInterval = 1000; dropAccum = 0; lastTime = null;
next = randomPiece();
spawn();
callbacks.onScore?.(0);
callbacks.onLevel?.(1);
rafId = requestAnimationFrame(loop);

return { pause, resume, end, destroy, setSkin };

} // end startCaida

window.CAIDA = { start: startCaida };
