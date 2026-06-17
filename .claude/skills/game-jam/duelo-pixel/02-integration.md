# SPEC — Integración técnica de DUELO PIXEL (duelo-pixel)

> **Status:** Propuesto · **Depends on:** duelo-pixel/01-design.md, 06-supabase-scores-leaderboard · **Date:** 2026-06-17
> **Objective:** Integrar DUELO PIXEL (juego canvas puro, sin spritesheet) en la ruta
> `/games/duelo-pixel/play` con HUD React sincronizado, score guardado en Supabase vía
> UserContext, y leaderboard real en `/salon`.

---

## Scope

**In:**

- `public/games/duelo-pixel.js` — juego construido desde cero, 100% canvas (sin
  imágenes): `startDueloPixel(canvas, callbacks)` encapsulado en closure, expuesto como
  `window.DUELO_PIXEL = { start: startDueloPixel }`.
- `app/games/duelo-pixel/play/page.tsx` — página React siguiendo el patrón de
  `app/games/rocas/play/page.tsx`, adaptada a un HUD de dos marcadores (P1/CPU o P1/P2)
  en lugar de score único + vidas.
- Migración Supabase: tabla `scores_duelo_pixel` con RLS (public read + public insert),
  igual estructura que las tablas existentes.

**Out of scope:**

- `_lib/data.ts` — `duelo-pixel` ya existe en `GAMES[]` (`title: "DUELO PIXEL"`,
  `cat: "VERSUS"`, `color: "cyan"`, `cover: "cover-duelo"`), no se toca.
- Assets gráficos externos (el diseño es 100% canvas — ver 01-design.md).
- Controles táctiles / móvil.
- Networking / multiplayer remoto — el modo 2 jugadores es local, mismo teclado.
- Modificar cualquier otro juego de la plataforma.

---

## Data model

**Entrada en `GAMES[]`:** ya registrada, no requiere cambios:
```ts
{
  id: "duelo-pixel",
  title: "DUELO PIXEL",
  short: "Dos paletas. Una pelota. Reflejos máximos.",
  long: "El duelo más puro: dos paletas verticales se enfrentan por rebotar una pelota luminosa. Modo solitario contra la CPU o partida local a dos jugadores.",
  cat: "VERSUS",
  cover: "cover-duelo",
  color: "cyan",
  best: 24,
  plays: "4.2K",
}
```

**API de control del juego:**
```ts
interface DueloPixelAPI {
  pause(): void;
  resume(): void;
  end(): void;
  destroy(): void;
}

interface DueloPixelCallbacks {
  onScore(p1Score: number, p2Score: number): void;
  onGameOver(finalScore: number, winner: "P1" | "P2" | "CPU"): void;
}

window.DUELO_PIXEL = {
  start(canvas: HTMLCanvasElement, callbacks: DueloPixelCallbacks): DueloPixelAPI
}
```

El `finalScore` guardado en Supabase es siempre el marcador de P1 (jugador humano
principal), igual gane o pierda — coherente con `best: 24` ya presente en el registro
(un score histórico tipo "puntos anotados en la mejor partida").

**Tabla Supabase** `scores_duelo_pixel`:
```sql
id          uuid        primary key default gen_random_uuid()
player_name text        not null
score       integer     not null
created_at  timestamptz default now()
```

---

## Implementation plan

1. Confirmar que `duelo-pixel` ya está en `GAMES[]` (`_lib/data.ts`) — no aplicar cambios
   ahí, solo verificar consistencia de `id`/`title`/`cat`/`color` con este spec.
2. Crear `public/games/duelo-pixel.js`:
   - Campo lógico de 800×500px, paletas de 12×90px en `x=20` (P1) y `x=768` (P2/CPU).
   - Selector de modo previo al primer punto: tecla `1` = vs CPU, tecla `2` = 2 jugadores;
     por defecto (sin selección tras 3s) arranca en modo vs CPU.
   - Loop con `requestAnimationFrame` + `dt`: continuo (física de pelota y paletas), no de
     turnos — encaja mejor que `setInterval` para un Pong con velocidad variable y ángulos
     de rebote.
   - Movimiento de paletas: P1 con `W`/`S`, P2 con `ArrowUp`/`ArrowDown` (modo 2 jugadores),
     o IA de seguimiento con margen de error variable (modo CPU, según 01-design.md).
   - Colisión pelota-pared (rebote vertical) y pelota-paleta (rebote horizontal + ángulo
     según punto de impacto + incremento de velocidad 8% por rebote, tope 16px/frame).
   - Punto anotado: resetea pelota al centro, velocidad base, dirección aleatoria; llama
     `callbacks.onScore(p1Score, p2Score)`.
   - Fin de partida: el primer marcador en llegar a 11 con diferencia ≥2 gana; llama
     `callbacks.onGameOver(p1Score, winner)`.
   - Render: fondo `#05080d`, línea central punteada cyan, paletas y pelota con
     `shadowBlur` cyan/blanco (ver paleta de 01-design.md).
   - Listeners de teclado (`keydown`/`keyup` en `window`) nombrados para poder removerlos
     en `destroy()`. `Space` alterna pausa también desde dentro del canvas.
   - `startDueloPixel` retorna `{ pause, resume, end, destroy }`.
   - Exposición final: `window.DUELO_PIXEL = { start: startDueloPixel }`.
3. Crear `app/games/duelo-pixel/play/page.tsx` basado en el patrón de
   `app/games/rocas/play/page.tsx`:
   - `<Script src="/games/duelo-pixel.js" strategy="afterInteractive">`.
   - Polling a `window.DUELO_PIXEL` (50ms, timeout 5s).
   - State React: `p1Score`, `p2Score`, `paused`, `over`, `finalScore`, `winner`, `saved`,
     `name`. Sin `lives` ni `level` (el diseño no los usa).
   - HUD con dos `hud-stat` (marcador P1 / marcador P2 o CPU) en lugar del bloque
     score+vidas+nivel habitual.
   - Modal de game-over muestra el ganador (`P1`, `P2` o `CPU`) y el marcador final de P1;
     guardado de score vía `UserContext.saveScore` solo cuando el ganador es humano o
     independientemente del resultado (se guarda siempre el score de P1, igual que en
     juegos de un solo jugador).
   - Cleanup en `useEffect` llamando `api.destroy()`.
4. Aplicar migración Supabase para `scores_duelo_pixel` (vía MCP `apply_migration` o
   verificar con `list_tables` si ya existe).
5. Confirmar que `globals.css` ya define `cover-duelo` (el juego está registrado desde
   antes); si falta el gradiente de portada, añadirlo con paleta cyan.

---

## Acceptance criteria

- [ ] `/games/duelo-pixel/play` carga sin errores de consola.
- [ ] El canvas renderiza el juego solo con primitivas canvas (sin requests de imagen).
- [ ] El HUD React muestra el marcador de P1 y P2/CPU sincronizado con el juego.
- [ ] El modo vs CPU mueve la paleta derecha automáticamente persiguiendo la pelota con
      margen de error decreciente según el marcador (ver 01-design.md).
- [ ] El modo 2 jugadores responde a `W`/`S` (P1) y `ArrowUp`/`ArrowDown` (P2) de forma
      independiente.
- [ ] Anotar un punto incrementa el marcador correspondiente en el HUD React.
- [ ] La velocidad de la pelota aumenta de forma perceptible tras varios rebotes.
- [ ] El botón PAUSA detiene el loop y muestra el overlay "EN PAUSA".
- [ ] El botón REANUDAR continúa desde el mismo estado (marcador y velocidad de pelota
      intactos).
- [ ] El botón FIN fuerza el game-over y muestra el modal con la puntuación final de P1.
- [ ] Llegar a 11 puntos con diferencia ≥2 dispara el modal automáticamente e indica el
      ganador.
- [ ] "GUARDAR PUNTUACIÓN" llama a `UserContext.saveScore` y confirma.
- [ ] "JUGAR DE NUEVO" reinicia ambos marcadores a 0 y la pelota a velocidad base.
- [ ] "VOLVER AL VAULT" navega a `/games/duelo-pixel`.
- [ ] Los listeners de teclado no interfieren con otras páginas tras navegar fuera.
- [ ] `/salon` → pestaña DUELO PIXEL muestra scores reales desde Supabase.

---

## Decisions

- **Sí: 100% canvas vectorial, sin spritesheet** — evita bloquear la integración en la
  creación/búsqueda de assets gráficos; el diseño de 01-design.md ya define paleta y
  formas suficientes (paletas, pelota, línea central) para que el juego se vea intencional
  con primitivas simples.
  **Descartado:** Generar o buscar un spritesheet — añade una dependencia externa
  innecesaria para un Pong, cuyo lenguaje visual clásico es geometría pura.

- **Sí: Patrón bridge `window.DUELO_PIXEL`** — mínimo acoplamiento entre canvas y React,
  mismo patrón que todos los juegos ya implementados.
  **Descartado:** Reescribir el juego como módulo ES — requiere bundler, no aporta valor
  sobre el patrón bridge ya validado.

- **Sí: `requestAnimationFrame` + `dt` en lugar de `setInterval`** — DUELO PIXEL es física
  continua (posición y velocidad de pelota/paletas en punto flotante, ángulos de rebote
  variables), no un juego de turnos en grilla discreta como Snake o Tetris. RAF con
  delta-time da movimiento fluido y permite escalar velocidad de forma gradual (8% por
  rebote) sin saltos perceptibles.
  **Descartado:** `setInterval` fijo — forzaría a discretizar la velocidad de la pelota en
  pasos fijos, perdiendo la sensación de aceleración progresiva que define el diseño.

- **Sí: callback `onScore(p1, p2)` con dos marcadores en vez de un score único** — el
  modo VERSUS necesita reflejar el estado de ambos lados del campo en el HUD; un solo
  `onScore(n)` no captura quién va ganando.
  **Descartado:** Mantener la firma `onScore(score: number)` de los juegos de un jugador —
  no representa correctamente un marcador de dos partes.

- **Sí: Guardar siempre el score de P1 en Supabase, gane o pierda** — mantiene el
  leaderboard comparable entre partidas (cuántos puntos anotó el jugador humano en su
  mejor partida), igual que `best: 24` ya presente en el registro de `GAMES[]`.
  **Descartado:** Guardar solo cuando P1 gana — reduciría artificialmente la cantidad de
  scores guardados y no refleja bien el "mejor desempeño" en partidas reñidas perdidas.

---

## Risks

- **Fuga de event listeners.** Si el componente se desmonta sin llamar `destroy()`, los
  listeners de teclado (`W`/`S`/flechas/`Space`) afectarían a otras páginas. Mitigación:
  cleanup del `useEffect` siempre llama `api.destroy()`.
- **Balance de la IA de la CPU.** Un margen de error mal calibrado puede hacer la CPU
  invencible o trivial. Mitigación: los tres tramos de margen de error (±40px / ±25px /
  ±12px) están definidos en 01-design.md con valores concretos verificables en código, y
  deben probarse manualmente con `/verify` antes de marcar el spec como implementado.
- **Conflicto de teclas en modo 2 jugadores.** `W`/`S` y flechas no chocan con atajos del
  navegador, pero si el usuario también pulsa `Space` para pausa mientras juega, debe
  verificarse que no se interprete como input de movimiento. Mitigación: `Space` se maneja
  en un handler separado del de movimiento de paletas.
