(function () {
  "use strict";

  // ── Sprite atlas (inlined from sprites.js, path updated) ─────────────────
  const SPRITE_ATLAS = {
    sources: {
      fruits: "/games/serpentina/assets/fruits.png",
    },
    fruits: {
      banana:     { x:   34, y: 136, w: 110, h: 160 },
      orange:     { x:  186, y: 136, w: 150, h: 160 },
      grape:      { x:  378, y: 136, w: 110, h: 160 },
      garlic:     { x:  540, y: 136, w: 130, h: 160 },
      eggplant:   { x:  712, y: 136, w: 130, h: 160 },
      strawberry: { x:  894, y: 136, w: 110, h: 160 },
      cherry:     { x: 1066, y: 136, w: 110, h: 160 },
      carrot:     { x: 1228, y: 136, w: 130, h: 160 },
      mushroom:   { x: 1400, y: 136, w: 130, h: 160 },
      broccoli:   { x: 1582, y: 136, w: 110, h: 160 },
      watermelon: { x: 1734, y: 136, w: 150, h: 160 },
      pepper:     { x: 1906, y: 136, w: 150, h: 160 },
      kiwi:       { x: 2068, y: 136, w: 170, h: 160 },
      lemon:      { x: 2250, y: 136, w: 140, h: 160 },
      peach:      { x: 2432, y: 136, w: 130, h: 160 },
      peanut:     { x: 2604, y: 136, w: 130, h: 160 },
      apple:      { x: 2786, y: 136, w: 110, h: 160 },
      tomato:     { x: 2948, y: 136, w: 130, h: 160 },
      berries:    { x: 3110, y: 136, w: 150, h: 160 },
      grapes2:    { x: 3302, y: 136, w: 110, h: 160 },
      pineapple:  { x: 3454, y: 136, w: 150, h: 160 },
      melon:      { x: 3637, y: 136, w: 130, h: 160 },
    },
  };

  const FRUIT_KEYS = Object.keys(SPRITE_ATLAS.fruits);

  // ── Constants ─────────────────────────────────────────────────────────────
  const COLS = 20;
  const ROWS = 20;
  const BASE_INTERVAL = 150; // ms per tick
  const MIN_INTERVAL  = 60;
  const LEVEL_STEP    = 5;   // fruits per level
  const INTERVAL_DEC  = 15;  // ms reduction per level

  // ── Bridge ────────────────────────────────────────────────────────────────
  function startSerpentina(canvas, callbacks) {
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    const CELL_W = W / COLS;
    const CELL_H = H / ROWS;

    // State
    let snake, dir, nextDir, fruit, fruitKey, score, level, interval, timerId;
    let gameEnded = false;
    let bridgePaused = false;

    // Sprite image
    const img = new Image();

    function randomFruitKey() {
      return FRUIT_KEYS[Math.floor(Math.random() * FRUIT_KEYS.length)];
    }

    function randomFruit(snakeBody) {
      const occupied = new Set(snakeBody.map((s) => s.x + "," + s.y));
      let pos;
      do {
        pos = {
          x: Math.floor(Math.random() * COLS),
          y: Math.floor(Math.random() * ROWS),
        };
      } while (occupied.has(pos.x + "," + pos.y));
      return pos;
    }

    function initState() {
      const cx = Math.floor(COLS / 2);
      const cy = Math.floor(ROWS / 2);
      snake = [
        { x: cx,     y: cy },
        { x: cx - 1, y: cy },
        { x: cx - 2, y: cy },
      ];
      dir = { x: 1, y: 0 };
      nextDir = { x: 1, y: 0 };
      score = 0;
      level = 1;
      interval = BASE_INTERVAL;
      fruitKey = randomFruitKey();
      fruit = randomFruit(snake);
      gameEnded = false;
      bridgePaused = false;
    }

    // ── Render ──────────────────────────────────────────────────────────────
    function draw() {
      // Background
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, W, H);

      // Grid (subtle)
      ctx.strokeStyle = "rgba(255,255,255,0.03)";
      ctx.lineWidth = 0.5;
      for (let c = 0; c <= COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * CELL_W, 0);
        ctx.lineTo(c * CELL_W, H);
        ctx.stroke();
      }
      for (let r = 0; r <= ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * CELL_H);
        ctx.lineTo(W, r * CELL_H);
        ctx.stroke();
      }

      // Fruit (sprite atlas)
      const sp = SPRITE_ATLAS.fruits[fruitKey];
      const pad = CELL_W * 0.08;
      ctx.drawImage(
        img,
        sp.x, sp.y, sp.w, sp.h,
        fruit.x * CELL_W + pad,
        fruit.y * CELL_H + pad,
        CELL_W - pad * 2,
        CELL_H - pad * 2
      );

      // Snake body
      snake.forEach((seg, i) => {
        const isHead = i === 0;
        const alpha = isHead ? 1 : Math.max(0.4, 1 - i * 0.015);
        ctx.fillStyle = isHead
          ? `rgba(0,255,120,${alpha})`
          : `rgba(0,200,80,${alpha})`;

        const inset = isHead ? 1 : 2;
        ctx.beginPath();
        ctx.roundRect(
          seg.x * CELL_W + inset,
          seg.y * CELL_H + inset,
          CELL_W - inset * 2,
          CELL_H - inset * 2,
          isHead ? 4 : 3
        );
        ctx.fill();

        // Eyes on head
        if (isHead) {
          ctx.fillStyle = "#001a08";
          const ex = seg.x * CELL_W + CELL_W * 0.5;
          const ey = seg.y * CELL_H + CELL_H * 0.5;
          const er = CELL_W * 0.1;
          // offset eyes based on direction
          const ox = dir.x * CELL_W * 0.2;
          const oy = dir.y * CELL_H * 0.2;
          const perp = { x: -dir.y, y: dir.x };
          ctx.beginPath();
          ctx.arc(ex + ox + perp.x * CELL_W * 0.2, ey + oy + perp.y * CELL_H * 0.2, er, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(ex + ox - perp.x * CELL_W * 0.2, ey + oy - perp.y * CELL_H * 0.2, er, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    // ── Game tick ────────────────────────────────────────────────────────────
    function tick() {
      if (bridgePaused || gameEnded) return;

      dir = nextDir;
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

      // Wall collision
      if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
        triggerGameOver();
        return;
      }

      // Self collision
      if (snake.some((s) => s.x === head.x && s.y === head.y)) {
        triggerGameOver();
        return;
      }

      const ate = head.x === fruit.x && head.y === fruit.y;
      snake.unshift(head);
      if (!ate) {
        snake.pop();
      } else {
        score++;
        callbacks.onScore && callbacks.onScore(score);

        // Level up every LEVEL_STEP fruits
        if (score % LEVEL_STEP === 0) {
          level++;
          callbacks.onLevel && callbacks.onLevel(level);
          restartTimer();
        }

        fruitKey = randomFruitKey();
        fruit = randomFruit(snake);
      }

      draw();
    }

    function triggerGameOver() {
      gameEnded = true;
      clearInterval(timerId);
      draw();
      callbacks.onGameOver && callbacks.onGameOver(score);
    }

    function currentInterval() {
      return Math.max(MIN_INTERVAL, BASE_INTERVAL - (level - 1) * INTERVAL_DEC);
    }

    function startTimer() {
      timerId = setInterval(tick, currentInterval());
    }

    function restartTimer() {
      clearInterval(timerId);
      startTimer();
    }

    // ── Keyboard ─────────────────────────────────────────────────────────────
    function onKeyDown(e) {
      const map = {
        ArrowUp:    { x:  0, y: -1 },
        ArrowDown:  { x:  0, y:  1 },
        ArrowLeft:  { x: -1, y:  0 },
        ArrowRight: { x:  1, y:  0 },
        w: { x:  0, y: -1 },
        s: { x:  0, y:  1 },
        a: { x: -1, y:  0 },
        d: { x:  1, y:  0 },
      };
      const newDir = map[e.key];
      if (!newDir) return;
      // Prevent reversing direction
      if (newDir.x === -dir.x && newDir.y === -dir.y) return;
      // Prevent scrolling when arrows are used
      if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) {
        e.preventDefault();
      }
      nextDir = newDir;
    }

    // ── Boot ──────────────────────────────────────────────────────────────────
    img.onload = function () {
      initState();
      window.addEventListener("keydown", onKeyDown);
      callbacks.onScore && callbacks.onScore(0);
      callbacks.onLevel && callbacks.onLevel(1);
      draw();
      startTimer();
    };
    img.src = SPRITE_ATLAS.sources.fruits;

    // ── API ───────────────────────────────────────────────────────────────────
    function pause() {
      if (gameEnded) return;
      bridgePaused = true;
      clearInterval(timerId);
    }

    function resume() {
      if (gameEnded) return;
      bridgePaused = false;
      startTimer();
    }

    function end() {
      if (gameEnded) return;
      triggerGameOver();
    }

    function destroy() {
      clearInterval(timerId);
      window.removeEventListener("keydown", onKeyDown);
    }

    return { pause, resume, end, destroy };
  }

  window.SERPENTINA = { start: startSerpentina };
})();
