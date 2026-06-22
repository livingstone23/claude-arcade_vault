'use strict';

const SKINS = {
  clasico: {
    roadBg: '#0a0a0a',
    riverBg: '#001a33',
    safeBg: '#0a3a1a',
    goalBg: '#063018',
    goalFilled: '#0c4a26',
    goalBorder: '#ffd700',
    goalFrog: '#39ff7a',
    car: [ '#ff3b3b', '#ffd23b', '#3b9bff' ],
    truck: '#888888',
    wheel: '#111111',
    log: '#7a4a23',
    logLine: 'rgba(0,0,0,0.35)',
    turtle: '#2fae4a',
    turtleBorder: '#1c6e2e',
    frog: '#39ff7a',
    frogEye: '#0a2a14',
    hud: '#ffffff',
    hudDim: 'rgba(255,255,255,0.65)',
    barTrack: 'rgba(255,255,255,0.15)',
    barOk: '#39ff7a',
    barWarn: '#ffd23b',
    barDanger: '#ff3b3b',
  },
  neon: {
    roadBg: '#0a0014',
    riverBg: '#1a0033',
    safeBg: '#001a1a',
    goalBg: '#0d0022',
    goalFilled: '#2a0050',
    goalBorder: '#ffea00',
    goalFrog: '#39ff14',
    car: [ '#ff00ff', '#ffea00', '#00ffff' ],
    truck: '#a0a0c0',
    wheel: '#000000',
    log: '#ff6a00',
    logLine: 'rgba(0,0,0,0.45)',
    turtle: '#00ff9f',
    turtleBorder: '#00997a',
    frog: '#39ff14',
    frogEye: '#0a0014',
    hud: '#00ffff',
    hudDim: 'rgba(0,255,255,0.65)',
    barTrack: 'rgba(0,255,255,0.15)',
    barOk: '#39ff14',
    barWarn: '#ffea00',
    barDanger: '#ff003c',
  },
  retro: {
    roadBg: '#1a0f00',
    riverBg: '#1a1400',
    safeBg: '#0d1400',
    goalBg: '#140d00',
    goalFilled: '#3a2400',
    goalBorder: '#ffb000',
    goalFrog: '#ffb000',
    car: [ '#ff8800', '#ffcc00', '#cc8800' ],
    truck: '#aa8855',
    wheel: '#1a0f00',
    log: '#aa6622',
    logLine: 'rgba(0,0,0,0.4)',
    turtle: '#33aa55',
    turtleBorder: '#1c6e2e',
    frog: '#33ff66',
    frogEye: '#0d1400',
    hud: '#ffb000',
    hudDim: 'rgba(255,176,0,0.65)',
    barTrack: 'rgba(255,176,0,0.15)',
    barOk: '#33ff66',
    barWarn: '#ffcc00',
    barDanger: '#ff4422',
  },
};

function startFrogger( canvas, callbacks ) {

const ctx = canvas.getContext( '2d' );

let skinName = ( () => {
  try {
    const saved = localStorage.getItem( 'arcade-skin-frogger' );
    return saved && SKINS[ saved ] ? saved : 'clasico';
  } catch { return 'clasico'; }
} )();
let skin = SKINS[ skinName ];

// ── Grid ──────────────────────────────────────────────────────────────────────
const COLS = 16;
const ROWS = 14;
const CELL = 40;
const W = COLS * CELL; // 640
const H = ROWS * CELL; // 560

const ROW_GOALS = 0;
const ROW_RIVER_TOP = 1;
const ROW_RIVER_BOT = 6;
const ROW_SAFE_MID = 7;
const ROW_ROAD_TOP = 8;
const ROW_ROAD_BOT = 12;
const ROW_START = 13;

const FROG_START_COL = 8;
const ANIM_DURATION = 0.12; // 120ms jump

const GOALS = [1, 4, 7, 10, 13].map( ( colStart ) => ( { colStart, width: 2, occupied: false } ) );

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

function onKeyDown( e ) {
  if ( !keys[ e.code ] ) justPressed[ e.code ] = true;
  keys[ e.code ] = true;
}
function onKeyUp( e ) { keys[ e.code ] = false; }

window.addEventListener( 'keydown', onKeyDown );
window.addEventListener( 'keyup', onKeyUp );

function pressed( code ) {
  const val = justPressed[ code ];
  justPressed[ code ] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const rand = ( min, max ) => min + Math.random() * ( max - min );
const clamp = ( v, min, max ) => Math.max( min, Math.min( max, v ) );
const lerp = ( a, b, t ) => a + ( b - a ) * t;

// ── Lanes / entities ──────────────────────────────────────────────────────────
function genLane( row, speed, dir, kind ) {
  let widths, count, gapMin, gapMax;
  if ( kind === 'car' ) { widths = [ 1, 1, 2 ]; count = 4; gapMin = 1.5; gapMax = 3; }
  else if ( kind === 'log' ) { widths = [ 2, 3, 4 ]; count = 3; gapMin = 1.5; gapMax = 3; }
  else { widths = [ 2, 3 ]; count = 3; gapMin = 2; gapMax = 4; } // turtle

  const entities = [];
  let col = -COLS / 2 + rand( 0, 4 );
  for ( let i = 0; i < count; i++ ) {
    const width = widths[ Math.floor( Math.random() * widths.length ) ];
    const type = kind === 'car' ? ( Math.random() < 0.3 ? 'truck' : 'car' ) : kind;
    const e = { col, width, type };
    entities.push( e );
    col += width + gapMin + rand( 0, gapMax - gapMin );
  }
  return { row, speed, dir, kind: kind === 'car' ? 'road' : 'river', entities };
}

function buildLanes( level ) {
  const mult = 1 + 0.15 * ( level - 1 );
  const lanes = [];

  const roadSpeeds = [ 1.5, 2, 2.5, 3, 4 ];
  for ( let i = 0, row = ROW_ROAD_TOP; row <= ROW_ROAD_BOT; row++, i++ ) {
    const dir = row % 2 === 0 ? 1 : -1;
    lanes.push( genLane( row, roadSpeeds[ i ] * mult, dir, 'car' ) );
  }

  const riverSpeeds = [ 1, 1.5, 2, 2.5, 3, 1.2 ];
  for ( let i = 0, row = ROW_RIVER_TOP; row <= ROW_RIVER_BOT; row++, i++ ) {
    const dir = row % 2 === 0 ? -1 : 1;
    const kind = row === ROW_RIVER_TOP ? 'log' : ( row % 2 === 0 ? 'log' : 'turtle' );
    lanes.push( genLane( row, riverSpeeds[ i ] * mult, dir, kind ) );
  }

  return lanes;
}

let level = 1;
let lanes = buildLanes( level );
const laneByRow = () => {
  const map = {};
  for ( const l of lanes ) map[ l.row ] = l;
  return map;
};
let laneMap = laneByRow();

function roundTimeForLevel( lv ) { return Math.max( 6, 15 - ( lv - 1 ) ); }

// ── Frog ──────────────────────────────────────────────────────────────────────
const frog = {
  row: ROW_START,
  col: FROG_START_COL,
  fromRow: ROW_START,
  fromCol: FROG_START_COL,
  animating: false,
  animT: 0,
};

function resetFrog() {
  frog.row = ROW_START;
  frog.col = FROG_START_COL;
  frog.fromRow = ROW_START;
  frog.fromCol = FROG_START_COL;
  frog.animating = false;
  frog.animT = 0;
}

// ── Game state ────────────────────────────────────────────────────────────────
let score = 0;
let lives = 3;
let roundTimer = roundTimeForLevel( level );
let minRowReached = ROW_START;
let state = 'playing'; // 'playing' | 'gameover'

function setScore( v ) { if ( v !== score ) { score = v; callbacks.onScore?.( score ); } }
function setLives( v ) { if ( v !== lives ) { lives = v; callbacks.onLives?.( lives ); } }
function setLevel( v ) { if ( v !== level ) { level = v; callbacks.onLevel?.( level ); } }

callbacks.onScore?.( score );
callbacks.onLives?.( lives );
callbacks.onLevel?.( level );

function isRoad( row ) { return row >= ROW_ROAD_TOP && row <= ROW_ROAD_BOT; }
function isRiver( row ) { return row >= ROW_RIVER_TOP && row <= ROW_RIVER_BOT; }

// ── Collision / support ───────────────────────────────────────────────────────
function checkRoadCollision() {
  const lane = laneMap[ frog.row ];
  if ( !lane ) return false;
  for ( const e of lane.entities ) {
    if ( frog.col >= e.col && frog.col < e.col + e.width ) return true;
  }
  return false;
}

function getSupport() {
  const lane = laneMap[ frog.row ];
  if ( !lane ) return null;
  for ( const e of lane.entities ) {
    if ( frog.col >= e.col && frog.col < e.col + e.width ) {
      return { lane, entity: e };
    }
  }
  return null;
}

function checkGoal() {
  const goal = GOALS.find( ( g ) => frog.col >= g.colStart && frog.col < g.colStart + g.width );
  if ( !goal || goal.occupied ) { killFrog(); return; }

  goal.occupied = true;
  setScore( score + 50 + Math.floor( roundTimer ) * 10 );

  if ( GOALS.every( ( g ) => g.occupied ) ) {
    completeRound();
  } else {
    resetFrog();
  }
}

// ── Round / death ─────────────────────────────────────────────────────────────
function completeRound() {
  setScore( score + 200 );
  setLevel( level + 1 );
  lanes = buildLanes( level );
  laneMap = laneByRow();
  GOALS.forEach( ( g ) => ( g.occupied = false ) );
  roundTimer = roundTimeForLevel( level );
  minRowReached = ROW_START;
  resetFrog();
}

function killFrog() {
  setLives( lives - 1 );
  if ( lives <= 0 ) {
    state = 'gameover';
    callbacks.onGameOver?.( score );
    return;
  }
  resetFrog();
  roundTimer = roundTimeForLevel( level );
}

// ── Update ────────────────────────────────────────────────────────────────────
function tryStartJump() {
  if ( frog.animating ) return;
  let dCol = 0, dRow = 0;
  if ( pressed( 'ArrowUp' ) ) dRow = -1;
  else if ( pressed( 'ArrowDown' ) ) dRow = 1;
  else if ( pressed( 'ArrowLeft' ) ) dCol = -1;
  else if ( pressed( 'ArrowRight' ) ) dCol = 1;
  else return;

  const targetCol = clamp( Math.round( frog.col ) + dCol, 0, COLS - 1 );
  const targetRow = clamp( frog.row + dRow, ROW_GOALS, ROW_START );
  if ( targetCol === Math.round( frog.col ) && targetRow === frog.row ) return;

  frog.fromCol = frog.col;
  frog.fromRow = frog.row;
  frog.targetCol = targetCol;
  frog.targetRow = targetRow;
  frog.animating = true;
  frog.animT = 0;
}

function landFrog() {
  frog.col = frog.targetCol;
  frog.row = frog.targetRow;
  frog.animating = false;

  if ( frog.row < minRowReached ) {
    setScore( score + 10 * ( minRowReached - frog.row ) );
    minRowReached = frog.row;
  }

  if ( frog.row === ROW_GOALS ) {
    checkGoal();
  } else if ( isRiver( frog.row ) ) {
    if ( !getSupport() ) killFrog();
  }
}

function updateLanes( dt ) {
  for ( const lane of lanes ) {
    for ( const e of lane.entities ) {
      e.col += lane.speed * lane.dir * dt;
      if ( lane.dir > 0 && e.col > COLS ) e.col = -e.width;
      if ( lane.dir < 0 && e.col + e.width < 0 ) e.col = COLS;
    }
  }
}

function update( dt ) {
  if ( state === 'gameover' ) return;

  updateLanes( dt );
  tryStartJump();

  if ( frog.animating ) {
    frog.animT += dt;
    if ( frog.animT >= ANIM_DURATION ) landFrog();
  } else {
    if ( isRoad( frog.row ) && checkRoadCollision() ) {
      killFrog();
    } else if ( isRiver( frog.row ) ) {
      const support = getSupport();
      if ( !support ) {
        killFrog();
      } else {
        frog.col += support.lane.speed * support.lane.dir * dt;
        if ( frog.col < 0 || frog.col > COLS - 1 ) killFrog();
      }
    }
  }

  if ( state === 'playing' ) {
    roundTimer -= dt;
    if ( roundTimer <= 0 ) killFrog();
  }
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawZones() {
  ctx.fillStyle = skin.goalBg;
  ctx.fillRect( 0, ROW_GOALS * CELL, W, CELL );

  ctx.fillStyle = skin.riverBg;
  ctx.fillRect( 0, ROW_RIVER_TOP * CELL, W, ( ROW_RIVER_BOT - ROW_RIVER_TOP + 1 ) * CELL );

  ctx.fillStyle = skin.safeBg;
  ctx.fillRect( 0, ROW_SAFE_MID * CELL, W, CELL );

  ctx.fillStyle = skin.roadBg;
  ctx.fillRect( 0, ROW_ROAD_TOP * CELL, W, ( ROW_ROAD_BOT - ROW_ROAD_TOP + 1 ) * CELL );

  ctx.fillStyle = skin.safeBg;
  ctx.fillRect( 0, ROW_START * CELL, W, CELL );
}

function drawGoals() {
  for ( const g of GOALS ) {
    const x = g.colStart * CELL;
    const y = ROW_GOALS * CELL;
    const w = g.width * CELL;
    ctx.fillStyle = g.occupied ? skin.goalFilled : skin.goalBg;
    ctx.fillRect( x + 3, y + 3, w - 6, CELL - 6 );
    ctx.strokeStyle = skin.goalBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect( x + 3, y + 3, w - 6, CELL - 6 );
    if ( g.occupied ) {
      ctx.fillStyle = skin.goalFrog;
      ctx.beginPath();
      ctx.ellipse( x + w / 2, y + CELL / 2, 10, 8, 0, 0, Math.PI * 2 );
      ctx.fill();
    }
  }
}

function drawCar( e, y ) {
  const x = e.col * CELL;
  const w = e.width * CELL;
  ctx.fillStyle = e.type === 'truck' ? skin.truck : skin.car[ Math.abs( Math.floor( e.col ) ) % 3 ];
  ctx.fillRect( x + 2, y + 8, w - 4, CELL - 16 );
  ctx.fillStyle = skin.wheel;
  ctx.beginPath();
  ctx.arc( x + 8, y + CELL - 8, 5, 0, Math.PI * 2 );
  ctx.arc( x + w - 8, y + CELL - 8, 5, 0, Math.PI * 2 );
  ctx.fill();
}

function drawLog( e, y ) {
  const x = e.col * CELL;
  const w = e.width * CELL;
  ctx.fillStyle = skin.log;
  ctx.fillRect( x + 1, y + 10, w - 2, CELL - 20 );
  ctx.strokeStyle = skin.logLine;
  ctx.lineWidth = 1;
  for ( let i = 1; i < e.width; i++ ) {
    ctx.beginPath();
    ctx.moveTo( x + i * CELL, y + 10 );
    ctx.lineTo( x + i * CELL, y + CELL - 10 );
    ctx.stroke();
  }
}

function drawTurtle( e, y ) {
  const x = e.col * CELL;
  for ( let i = 0; i < e.width; i++ ) {
    const cx = x + i * CELL + CELL / 2;
    const cy = y + CELL / 2;
    ctx.fillStyle = skin.turtle;
    ctx.beginPath();
    ctx.ellipse( cx, cy, 14, 11, 0, 0, Math.PI * 2 );
    ctx.fill();
    ctx.strokeStyle = skin.turtleBorder;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function drawLanes() {
  for ( const lane of lanes ) {
    const y = lane.row * CELL;
    for ( const e of lane.entities ) {
      if ( e.col + e.width < 0 || e.col > COLS ) continue;
      if ( e.type === 'car' || e.type === 'truck' ) drawCar( e, y );
      else if ( e.type === 'log' ) drawLog( e, y );
      else drawTurtle( e, y );
    }
  }
}

function drawFrog() {
  let col = frog.col, row = frog.row, lift = 0;
  if ( frog.animating ) {
    const t = clamp( frog.animT / ANIM_DURATION, 0, 1 );
    col = lerp( frog.fromCol, frog.targetCol, t );
    row = lerp( frog.fromRow, frog.targetRow, t );
    lift = Math.sin( t * Math.PI ) * 8;
  }
  const x = ( col + 0.5 ) * CELL;
  const y = ( row + 0.5 ) * CELL - lift;
  ctx.fillStyle = skin.frog;
  ctx.beginPath();
  ctx.ellipse( x, y, 14, 12, 0, 0, Math.PI * 2 );
  ctx.fill();
  ctx.fillStyle = skin.frogEye;
  ctx.beginPath();
  ctx.arc( x - 6, y - 7, 3, 0, Math.PI * 2 );
  ctx.arc( x + 6, y - 7, 3, 0, Math.PI * 2 );
  ctx.fill();
}

function drawLifeIcon( x, y ) {
  ctx.fillStyle = skin.frog;
  ctx.beginPath();
  ctx.arc( x, y, 7, 0, Math.PI * 2 );
  ctx.fill();
}

function drawHUD() {
  ctx.fillStyle = skin.hud;
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText( `SCORE ${ score }`, 10, 22 );

  ctx.textAlign = 'center';
  ctx.fillText( `NIVEL ${ level }`, W / 2, 22 );

  for ( let i = 0; i < lives; i++ ) drawLifeIcon( W - 16 - i * 22, 18 );

  const pct = clamp( roundTimer / roundTimeForLevel( level ), 0, 1 );
  const barColor = pct > 0.5 ? skin.barOk : pct > 0.25 ? skin.barWarn : skin.barDanger;
  ctx.fillStyle = skin.barTrack;
  ctx.fillRect( 0, 0, W, 4 );
  ctx.fillStyle = barColor;
  ctx.fillRect( 0, 0, W * pct, 4 );
}

function drawOverlay( title, sub ) {
  ctx.textAlign = 'center';
  ctx.fillStyle = skin.hud;
  ctx.font = 'bold 46px monospace';
  ctx.fillText( title, W / 2, H / 2 - 18 );
  ctx.font = '18px monospace';
  ctx.fillStyle = skin.hudDim;
  ctx.fillText( sub, W / 2, H / 2 + 22 );
}

function draw() {
  drawZones();
  drawGoals();
  drawLanes();
  drawFrog();
  drawHUD();

  if ( state === 'gameover' ) drawOverlay( 'GAME OVER', `PUNTAJE: ${ score }` );
}

// ── Loop principal ────────────────────────────────────────────────────────────
let rafId;
let paused = false;
let lastTime = null;

function loop( ts ) {
  if ( paused ) { cancelAnimationFrame( rafId ); return; }
  const dt = lastTime === null ? 0 : Math.min( ( ts - lastTime ) / 1000, 0.05 );
  lastTime = ts;
  update( dt );
  draw();
  rafId = requestAnimationFrame( loop );
}

function pause() { paused = true; }
function resume() { paused = false; lastTime = null; rafId = requestAnimationFrame( loop ); }
function end() { state = 'gameover'; callbacks.onGameOver?.( score ); }
function destroy() {
  cancelAnimationFrame( rafId );
  window.removeEventListener( 'keydown', onKeyDown );
  window.removeEventListener( 'keyup', onKeyUp );
}
function setSkin( name ) {
  if ( !SKINS[ name ] ) return;
  skinName = name;
  skin = SKINS[ name ];
  try { localStorage.setItem( 'arcade-skin-frogger', name ); } catch {}
}

rafId = requestAnimationFrame( loop );
return { pause, resume, end, destroy, setSkin };

} // end startFrogger

window.FROGGER = { start: startFrogger };
