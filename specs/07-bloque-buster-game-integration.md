# SPEC 07 — Integración del juego Arkanoid (Bloque Buster) en la plataforma

> **Status:** Aprobado · **Depends on:** 01-visual-mvp, 06-supabase-scores-leaderboard · **Date:** 2026-06-16
> **Objective:** Integrar el juego Arkanoid canvas en la ruta `/games/bloque-buster/play`
> con HUD React sincronizado, spritesheet servido desde `public/`, score guardado en Supabase
> vía UserContext, y leaderboard real en `/salon`.

---

## Scope

**In:**

- `public/games/bloque-buster.js` — archivo único que combina spritesheet.js + levels.js + game.js
  del juego de referencia `references/starter-games/04-arkanoid/`:
  - Spritesheet helpers (`loadSpritesheet`, `drawSprite`, `drawFrame`, `SPRITES`, `EXPLOSION_FRAMES`)
    con ruta de imagen actualizada a `/games/bloque-buster/assets/spritesheet-breakout.png`
  - 5 niveles inlineados (LEVELS IIFE de `levels.js`)
  - Lógica de juego encapsulada en `startBloqueBuster(canvas, callbacks)`:
    - Variables globales dentro del closure (sin leaks al scope global)
    - Canvas original reemplazado por parámetro `canvas`
    - Sonidos con rutas absolutas: `/games/bloque-buster/assets/sounds/*.mp3`
    - Mouse listener `mousemove` registrado en `canvas` (control del paddle)
    - Canvas `click` listener para saltar de nivel en el overlay de pausa
    - Keyboard listeners `keydown`/`keyup` registrados en `window` (flechas)
    - `loadLevel(n)` llama `callbacks.onLevel?.(n)` al cambiar de nivel
    - Score incrementa en update → llama `callbacks.onScore?.(score)`
    - Vida perdida → llama `callbacks.onLives?.(lives)` → si 0: `callbacks.onGameOver?.(score)`
    - Todos los bloques destruidos en nivel 5 → `gameState = 'win'` + `callbacks.onGameOver?.(score)`
    - Boot: `loadSpritesheet(() => { initPaddle(); loadLevel(1); callbacks.onScore/onLives/onLevel; RAF })`
  - `startBloqueBuster` retorna `{ pause, resume, end, destroy }`:
    - `pause()` / `resume()` controlan `bridgePaused` (para el RAF) e `isPaused` (para el overlay de canvas)
    - `end()` fuerza `gameState = 'gameover'` y dispara `callbacks.onGameOver?.(score)`
    - `destroy()` cancela RAF y limpia los 4 event listeners (`keydown`, `keyup`, `mousemove`, `click`)
  - Al final (fuera del closure): `window.BLOQUE_BUSTER = { start: startBloqueBuster }`

- `public/games/bloque-buster/assets/spritesheet-breakout.png` — copiado desde `references/`
- `public/games/bloque-buster/assets/sounds/ball-bounce.mp3` — copiado desde `references/`
- `public/games/bloque-buster/assets/sounds/break-sound.mp3` — copiado desde `references/`

- `app/games/bloque-buster/play/page.tsx` — nueva ruta estática (Client Component):
  - Carga `<Script src="/games/bloque-buster.js" strategy="afterInteractive">`
  - `useEffect` monta el juego con polling a `window.BLOQUE_BUSTER` (50ms, timeout 5s)
  - State React: `score`, `lives` (init 3), `level` (init 1), `paused`, `over`, `finalScore`, `saved`, `name`
  - Botón PAUSA llama `api.pause()` / `api.resume()` y muestra overlay "EN PAUSA" vía React state
  - Botón FIN llama `api.end()`
  - Botón SALIR navega a `/games/bloque-buster`
  - Modal game-over: input nombre (máx 10, mayúsculas), `UserContext.saveScore`, JUGAR DE NUEVO, VOLVER AL VAULT
  - `useEffect` cleanup llama `api.destroy()`

- Tabla `scores_bloque_buster` en Supabase (ya existía; RLS: public read + public insert)

**Out of scope:**

- El overlay de pausa del canvas incluye botones 1–5 para saltar de nivel (feature del juego original,
  funcional pero no integrado con el HUD React de nivel)
- Controles táctiles / móvil
- Modificar cualquier otro juego de la plataforma
- El archivo `references/starter-games/04-arkanoid/` no se toca

---

## Data model

**API de control del juego:**
```ts
interface BloqueBusterAPI {
  pause(): void;
  resume(): void;
  end(): void;
  destroy(): void;
}
```

**Callbacks del bridge:**
```ts
interface BloqueBusterCallbacks {
  onScore(score: number): void;
  onLives(lives: number): void;
  onLevel(level: number): void;
  onGameOver(finalScore: number): void;
}
```

**Puente global:**
```ts
window.BLOQUE_BUSTER = {
  start(canvas: HTMLCanvasElement, callbacks: BloqueBusterCallbacks): BloqueBusterAPI
}
```

**Supabase** — tabla `scores_bloque_buster`:
```sql
id          uuid        primary key default gen_random_uuid()
player_name text        not null
score       integer     not null
created_at  timestamptz default now()
```
`scoreTable('bloque-buster')` en `_lib/supabase.ts` → `'scores_bloque_buster'` (ya resuelto por el helper existente).

---

## Implementation plan

1. Copiar assets desde `references/starter-games/04-arkanoid/assets/` a
   `public/games/bloque-buster/assets/` (spritesheet PNG + 2 MP3).

2. Crear `public/games/bloque-buster.js` combinando los 3 archivos del juego de referencia:
   - Inline `spritesheet.js` con `rawImg.src` actualizado a ruta absoluta `/games/bloque-buster/assets/...`
   - Inline `levels.js` (IIFE)
   - Inline `game.js` con las modificaciones del bridge pattern:
     - Envolver en `startBloqueBuster(canvas, callbacks)`
     - Nombrar handlers para poder removerlos en `destroy()`
     - Separar `bridgePaused` (control del RAF) e `isPaused` (overlay de canvas)
     - Añadir callbacks en los puntos de cambio de estado
     - Exposición de `window.BLOQUE_BUSTER`

3. Crear `app/games/bloque-buster/play/page.tsx` siguiendo el patrón de `app/games/rocas/play/page.tsx`,
   sustituyendo `ASTEROIDS` → `BLOQUE_BUSTER` y `rocas` → `bloque-buster`.

4. Verificar que la tabla `scores_bloque_buster` existe en Supabase (o aplicar migración).

---

## Acceptance criteria

- [x] `/games/bloque-buster/play` carga sin errores de consola.
- [x] El canvas muestra el spritesheet (bloques de colores, paddle, pelota).
- [x] El HUD React muestra score, vidas y nivel sincronizados con el estado del juego.
- [x] Destruir un bloque incrementa el score en el HUD React.
- [x] Perder una vida decrementa el contador de vidas en el HUD React.
- [x] El botón PAUSA detiene el loop y muestra el overlay "EN PAUSA" sobre el canvas.
- [x] El botón REANUDAR reanuda el juego desde el mismo estado.
- [x] El botón FIN fuerza el game-over y muestra el modal con la puntuación final.
- [x] Perder las 3 vidas muestra el modal automáticamente.
- [x] "GUARDAR PUNTUACIÓN" llama a `UserContext.saveScore` y muestra confirmación.
- [x] "JUGAR DE NUEVO" reinicia la partida (score a 0, vidas a 3, nivel a 1, bloques completos).
- [x] "VOLVER AL VAULT" navega a `/games/bloque-buster`.
- [x] `/salon` → tab BLOQUE BUSTER muestra scores reales desde Supabase.
- [x] La ruta `/games/[id]/play` genérica no se ve afectada.

---

## Decisions

- **Sí: Un solo `bloque-buster.js` con spritesheet.js + levels.js + game.js inlineados** —
  el juego de referencia tiene 3 archivos JS + assets. Combinar los JS en uno solo simplifica
  la carga (1 `<Script>`) sin necesitar un bundler y evita problemas de orden de carga.
  **Descartado:** Múltiples `<Script>` en orden — más frágil, depende del orden de ejecución y
  puede fallar con `strategy="afterInteractive"`.

- **Sí: Assets en `public/games/bloque-buster/assets/`** — ruta predecible, aislada por juego,
  sirve desde Next.js estáticamente. Rutas absolutas en el JS evitan problemas de base path.
  **Descartado:** Inline del spritesheet como data URI — aumenta el JS en ~200KB; penaliza
  parse time innecesariamente.

- **Sí: Dos variables de pausa separadas (`bridgePaused` + `isPaused`)** — `bridgePaused` controla
  el RAF (detiene el loop completamente cuando React hace PAUSA); `isPaused` controla el overlay
  interno del canvas (selector de nivel). Separarlas evita conflictos entre el control de React
  y la UI interna del juego.
  **Descartado:** Una sola variable — al pausar desde React se activaría también el overlay
  interno del canvas con los botones de nivel, duplicando la UI de pausa.

- **Sí: `callbacks.onGameOver` en win (nivel 5 completado)** — completar el juego también dispara
  el modal de guardar puntuación. El score acumulado es el resultado de la partida.
  **Descartado:** Solo disparar en gameover clásico — el usuario no podría guardar su score
  si gana el juego.

- **Sí: Mantener canvas click handler (selector de nivel en pausa interna)** — feature del juego
  original que funciona en paralelo al control de React. Se limpia en `destroy()`.
  **Descartado:** Eliminar el handler — pierde una feature que ya estaba implementada y testeada.

---

## Risks

- **Spritesheet no cargada al primer frame.** `loadSpritesheet` es async (Image.onload). El boot
  del juego llama `initPaddle()` + `loadLevel(1)` + RAF desde dentro del callback de `onload`,
  por lo que el RAF nunca arranca hasta que el PNG está disponible. Sin riesgo.

- **Fuga de 4 event listeners.** `destroy()` elimina `keydown`, `keyup` (window) y `mousemove`,
  `click` (canvas). Si el componente se desmonta sin llamar `destroy()`, los listeners de teclado
  afectan a otras páginas. El cleanup del `useEffect` cubre este caso.

- **Overlay de pausa del canvas en simultáneo con overlay React.** Si el juego interno activa
  `isPaused` vía el canvas click (salto de nivel), React no tiene visibilidad de ese estado.
  Esto es aceptable: el overlay interno del canvas se superpone visualmente pero no interfiere
  con el state React. La próxima vez que el usuario haga clic en PAUSA desde React se normaliza.
