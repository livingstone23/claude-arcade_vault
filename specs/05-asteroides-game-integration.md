# SPEC 05 — Integración del juego Asteroids en la plataforma

> **Status:** Implementado · **Depends on:** 01-visual-mvp · **Date:** 2026-06-15
> **Objective:** Integrar el juego Asteroids canvas en la ruta `/games/rocas/play`
> con doble HUD (React + canvas), score bridgeado a React para guardar en UserContext.

---

## Scope

**In:**

- `public/games/asteroids.js` — copia modificada de `references/starter-games/02-asteroids/game.js`:
  - Lógica de juego intacta (físicas, colisiones, power-ups, partículas)
  - Canvas HUD original conservado (score, nivel, vidas dibujados en canvas)
  - Variables globales encapsuladas dentro de `startAsteroids(canvas, callbacks)`
  - `window.ASTEROIDS = { start }` expuesto para que React lo invoque
  - `startAsteroids` retorna `{ pause, resume, end, destroy }` para control desde React
  - `callbacks.onScore / onLives / onLevel / onGameOver` llamados en los puntos correctos
  - Input listeners (keydown/keyup) registrados y limpios en `destroy()`
  - RAF cancelado en `destroy()`

- `app/games/rocas/play/page.tsx` — nueva ruta estática (Client Component):
  - Renderiza `<canvas id="canvas" width="800" height="600">`
  - Carga `<Script src="/games/asteroids.js" strategy="afterInteractive">`
  - `useEffect` monta el juego: espera a que `window.ASTEROIDS` esté disponible,
    llama `window.ASTEROIDS.start(canvas, callbacks)`, guarda el API retornado
  - React state: `score`, `lives`, `level` (sincronizados vía callbacks)
  - React state: `paused`, `over`, `finalScore`, `saved`
  - Botón PAUSA llama `api.pause()` / `api.resume()` y muestra overlay sobre el CRT
  - Botón FIN llama `api.end()` (fuerza gameover en el motor, dispara `onGameOver`)
  - Botón SALIR — `router.push('/games/rocas')`
  - Modal game-over: input de nombre, guardar score via `UserContext.saveScore`,
    botones JUGAR DE NUEVO y VOLVER AL VAULT
  - `useEffect` cleanup llama `api.destroy()`

**Out of scope:**

- Controles táctiles / móvil (teclado únicamente, como el original)
- Persistencia de scores en base de datos / Supabase (sigue siendo localStorage via UserContext)
- Modificar cualquier otro juego de la plataforma
- Pantalla de pausa con selección de nivel
- Leaderboard en tiempo real
- El archivo `references/starter-games/02-asteroids/game.js` no se toca

---

## Data model

No se introduce ninguna estructura de datos nueva. Se reutilizan las existentes:

**`SavedScore`** (ya definido en `_lib/data.ts`):
```ts
interface SavedScore {
  game: string;  // "rocas"
  score: number;
  name: string;
  at: number;
}
```

**API de control del juego** — objeto retornado por `startAsteroids()`, tipado inline en el componente:
```ts
interface AsteroidsAPI {
  pause(): void;
  resume(): void;
  end(): void;     // fuerza state → 'gameover', dispara onGameOver
  destroy(): void; // cancela RAF y elimina event listeners
}
```

**`window.ASTEROIDS`** — puente global entre script público y React:
```ts
// Expuesto por public/games/asteroids.js
window.ASTEROIDS = {
  start(canvas: HTMLCanvasElement, callbacks: AsteroidsCallbacks): AsteroidsAPI
}

interface AsteroidsCallbacks {
  onScore(score: number): void;
  onLives(lives: number): void;
  onLevel(level: number): void;
  onGameOver(finalScore: number): void;
}
```

`window.ASTEROIDS` no persiste entre sesiones. Se sobreescribe en cada carga del script.

---

## Implementation plan

1. Copiar `references/starter-games/02-asteroids/game.js` a `public/games/asteroids.js`.

2. Modificar `public/games/asteroids.js`:
   - Envolver todo el contenido en `function startAsteroids(canvas, callbacks)`.
   - Reemplazar `const canvas = document.getElementById('canvas')` por el parámetro `canvas`.
   - Añadir variable `let rafId` y `let paused = false`.
   - En `loop()`: si `paused === true`, cancelar RAF con `cancelAnimationFrame(rafId)` y salir.
   - Añadir `pause()`: `paused = true`.
   - Añadir `resume()`: `paused = false; lastTime = null; rafId = requestAnimationFrame(loop)`.
   - Añadir `end()`: forzar `state = 'gameover'` y llamar `callbacks.onGameOver?.(score)`.
   - Añadir `destroy()`: `cancelAnimationFrame(rafId)`; eliminar los dos listeners de `window`
     (keydown y keyup).
   - En `initGame()`: después de `state = 'playing'`, llamar `callbacks.onScore?.(0)`,
     `callbacks.onLives?.(3)`, `callbacks.onLevel?.(1)`.
   - En `killShip()`: después de cambiar `lives`, llamar `callbacks.onLives?.(lives)`.
     Si `state === 'gameover'`: llamar `callbacks.onGameOver?.(score)`.
   - En `nextLevel()`: después de `level++`, llamar `callbacks.onLevel?.(level)`.
   - En el loop `update()`, en la línea `score += POINTS[a.size]`:
     añadir `callbacks.onScore?.(score)` justo después.
   - Reemplazar las dos líneas finales (`initGame(); requestAnimationFrame(loop)`) por:
     ```js
     initGame();
     rafId = requestAnimationFrame(loop);
     return { pause, resume, end, destroy };
     ```
   - Al final del archivo (fuera de la función): `window.ASTEROIDS = { start: startAsteroids }`.

3. Crear `app/games/rocas/play/page.tsx` (Client Component):
   - Importar `Script` de `next/script`, `useEffect`, `useRef`, `useState` de React.
   - Importar `useRouter` de `next/navigation`.
   - Importar `GAMES` de `@/_lib/data` y `useUser` de `@/_contexts/UserContext`.
   - State: `score=0`, `lives=3`, `level=1`, `paused=false`, `over=false`,
     `finalScore=0`, `saved=false`, `name=user?.name ?? 'INVITADO'`.
   - `canvasRef = useRef<HTMLCanvasElement>(null)`.
   - `apiRef = useRef<AsteroidsAPI | null>(null)`.
   - `useEffect` (sin deps excepto vacío):
     - Función `mount()` que espera `window.ASTEROIDS` con `setInterval` (cada 50ms, timeout 5s).
     - Una vez disponible: llama `window.ASTEROIDS.start(canvasRef.current, callbacks)`,
       guarda resultado en `apiRef.current`.
     - Cleanup: `apiRef.current?.destroy()`.
   - Handlers: `handlePause` toglea `paused` y llama `api.pause()` / `api.resume()`.
   - Handler `handleEnd`: llama `api.end()`.
   - Handler `handleSave`: llama `saveScore({ game: 'rocas', score: finalScore, name })`,
     `setSaved(true)`.
   - Handler `handleRestart`: resetea todo el state, llama `api.destroy()`,
     llama `window.ASTEROIDS.start(canvasRef.current, callbacks)` de nuevo.
   - JSX: reusar estructura `.av-player` / `.player-hud` / `.crt` / `.modal-bd` del
     `[id]/play/page.tsx` existente, sustituyendo `.game-arena` por `<canvas ref={canvasRef}>`.

---

## Acceptance criteria

- [ ] `/games/rocas/play` carga la página sin errores de consola.
- [ ] El canvas muestra el juego Asteroids corriendo (nave, asteroides, HUD canvas).
- [ ] El HUD React muestra score, vidas y nivel sincronizados con el estado real del juego.
- [ ] Disparar y destruir un asteroide incrementa el score en el HUD React y en el canvas.
- [ ] Perder una vida decrementa las vidas en el HUD React y en el canvas.
- [ ] Completar un nivel incrementa el nivel en el HUD React y en el canvas.
- [ ] El botón PAUSA detiene el loop del juego y muestra el overlay "EN PAUSA".
- [ ] El botón REANUDAR reanuda el loop desde el estado anterior.
- [ ] El botón FIN fuerza el game-over y muestra el modal de puntuación final.
- [ ] Perder todas las vidas muestra el modal de puntuación final automáticamente.
- [ ] El modal permite editar el nombre del jugador (máx. 10 caracteres, mayúsculas).
- [ ] "GUARDAR PUNTUACIÓN" llama a `UserContext.saveScore` y muestra confirmación.
- [ ] "JUGAR DE NUEVO" reinicia el juego completo (nueva partida, score a 0).
- [ ] "VOLVER AL VAULT" navega a `/games/rocas`.
- [ ] Navegar fuera y volver a `/games/rocas/play` inicia una partida nueva sin errores.
- [ ] Los event listeners de teclado no interfieren con la navegación de la SPA al salir.
- [ ] La ruta `/games/rocas` (detail page) sigue funcionando sin cambios.
- [ ] La ruta `/games/[id]/play` con cualquier otro id sigue mostrando el mock genérico.

---

## Decisions

- **Sí: Doble HUD** — canvas dibuja score/nivel/vidas, React HUD también los muestra sincronizados
  vía callbacks. El usuario quiere mantener la consistencia visual de la plataforma junto con
  el HUD original del juego.
  **Descartado:** Solo canvas HUD (quitar `.player-hud` React) — pierde consistencia de plataforma.
  **Descartado:** Solo React HUD (quitar `drawHUD()` del canvas) — requiere más refactor del juego.

- **Sí: Ruta estática `app/games/rocas/play/page.tsx`** — App Router da precedencia al segmento
  estático sobre `[id]`, separación limpia sin tocar el mock genérico.
  **Descartado:** Condicional dentro de `[id]/play/page.tsx` — acopla lógica específica de un
  juego al componente genérico.

- **Sí: `public/games/asteroids.js` + `<Script strategy="afterInteractive">`** — mínimo refactor,
  el juego sigue siendo JS vanilla. `window.ASTEROIDS.start(canvas, callbacks)` resuelve el
  problema de re-montaje en SPA sin cambiar el approach.
  **Descartado:** Módulo TypeScript en `_lib/games/asteroids.ts` — requiere refactor más profundo
  a ES modules; complejidad no justificada para este primer juego integrado.

- **Sí: `end()` fuerza gameover y dispara `onGameOver`** — el botón FIN de la plataforma debe
  poder terminar la partida limpiamente y mostrar el modal para guardar score.
  **Descartado:** FIN navega directamente a `/games/rocas` sin guardar — el usuario pierde
  la oportunidad de registrar su puntuación.

- **Sí: `setInterval` polling para esperar `window.ASTEROIDS` en `useEffect`** — con
  `strategy="afterInteractive"` el script puede cargar ligeramente después del primer render.
  El polling con timeout de 5s evita race conditions sin necesidad de `onLoad` callback.
  **Descartado:** Confiar en que el script siempre está listo sincrónicamente — produce errores
  intermitentes en primera carga.

---

## Risks

- **Re-montaje y estado global.** `public/games/asteroids.js` solo se carga una vez por sesión
  de navegación (Next.js cachea scripts públicos). Si el usuario navega fuera y regresa,
  `window.ASTEROIDS` ya existe pero el script no re-ejecuta. El patrón `start(canvas, callbacks)`
  resuelve esto — cada llamada a `start` crea un nuevo scope de partida. Riesgo residual bajo.

- **Canvas id colisión.** El canvas usa `id="canvas"`. Si otro componente renderiza un elemento
  con ese mismo id simultáneamente (poco probable dado el enrutamiento), el juego podría
  agarrar el canvas equivocado. Mitigación: usar `id="asteroids-canvas"` en el JSX y ajustar
  la línea `document.getElementById` en `asteroids.js` — o preferiblemente pasar el elemento
  directamente via el parámetro `canvas` de `startAsteroids` (ya contemplado en el plan).

- **Fuga de event listeners.** Si `destroy()` no se llama correctamente (error en cleanup del
  `useEffect`), los listeners de teclado permanecen activos y pueden interferir con otras páginas.
  El acceptance criteria de "event listeners no interfieren al salir" cubre este caso; verificar
  manualmente navegando entre páginas durante QA.

- **Tamaño fijo del canvas (800×600).** En pantallas pequeñas el canvas puede desbordarse.
  Fuera del scope de este spec, pero documentado para un spec futuro de responsive.
