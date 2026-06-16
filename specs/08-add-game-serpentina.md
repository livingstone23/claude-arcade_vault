# SPEC 08 — Integración del juego SERPENTINA (serpentina)

> **Status:** Implementado · **Depends on:** SPEC 06 · **Date:** 2026-06-16
> **Objective:** Integrar SERPENTINA en `/games/serpentina/play` con HUD React,
> bridge canvas construido desde cero usando el sprite atlas de frutas, score y
> nivel persistidos en Supabase y flujo de game-over completo.

---

## Scope

**In:**

- `public/games/serpentina/assets/fruits.png` — copiado desde `references/starter-games/05-snakes/`
- `public/games/serpentina/assets/sprites.js` — copiado desde `references/starter-games/05-snakes/`
- `public/games/serpentina.js` — juego Snake construido desde cero con bridge pattern;
  usa el sprite atlas de frutas (frutas aleatorias), velocidad creciente por nivel
- `app/games/serpentina/play/page.tsx` — página React con HUD (score + nivel), sin HUD de vidas
- Migración Supabase: tabla `scores_serpentina` con RLS

**Out of scope:**

- `_lib/data.ts` — `serpentina` ya existe en `GAMES[]`, no se toca
- Controles táctiles / móvil
- `app/games/[id]/play/page.tsx` — fallback genérico, no se toca
- `app/salon/page.tsx` — leaderboard lo recoge automáticamente

---

## Data model

**Entrada en `GAMES[]`** — ya existe en `_lib/data.ts`, no requiere cambios.

**Tabla Supabase** `scores_serpentina`:
```sql
id          uuid        primary key default gen_random_uuid()
player_name text        not null
score       integer     not null
created_at  timestamptz default now()
```

**API bridge** `window.SERPENTINA`:
```ts
window.SERPENTINA.start(canvas, callbacks) → { pause, resume, end, destroy }

callbacks: {
  onScore(n: number): void
  onLevel(n: number): void
  onGameOver(final: number): void
}
```

**Mecánica de niveles:** cada 5 puntos (frutas comidas) sube un nivel; cada nivel reduce
el intervalo del loop en 15ms (base 150ms → mínimo 60ms). `onLevel` se dispara al subir.

**Sprite atlas:** frutas aleatorias del `SPRITE_ATLAS` en cada spawn; imagen cargada desde
`/games/serpentina/assets/fruits.png` vía `sprites.js` antes de arrancar el loop.

---

## Implementation plan

1. **Copiar assets** — Copiar `references/starter-games/05-snakes/fruits.png` y
   `sprites.js` a `public/games/serpentina/assets/`.

2. **Bridge JS** — Crear `public/games/serpentina.js`:
   - Cargar `SPRITE_ATLAS` (inline de sprites.js, ruta de imagen actualizada a
     `/games/serpentina/assets/fruits.png`).
   - `startSerpentina(canvas, callbacks)`:
     - Grid de 20×20 celdas sobre el canvas (600×600px lógicos).
     - Estado inicial: serpiente de 3 segmentos en el centro, dirección →, fruta aleatoria.
     - Loop con `setInterval` (no RAF) para control preciso de velocidad.
     - Al comer fruta: `score++`, `callbacks.onScore(score)`, nueva fruta aleatoria;
       cada 5 puntos: `level++`, `callbacks.onLevel(level)`, reducir intervalo 15ms.
     - Game-over al chocar con pared o con sí misma: `callbacks.onGameOver(score)`.
     - Render: fondo oscuro, serpiente verde neon por segmentos, fruta del sprite atlas.
     - `pause()` / `resume()` — limpian y reinician el `setInterval`.
     - `end()` — limpia intervalo y dispara `callbacks.onGameOver(score)`.
     - `destroy()` — limpia intervalo y remueve listener `keydown` de `window`.
     - Boot: cargar imagen → init estado → `callbacks.onScore(0)` →
       `callbacks.onLevel(1)` → arrancar intervalo → return `{ pause, resume, end, destroy }`.
   - Exposición: `window.SERPENTINA = { start: startSerpentina }`.

3. **Página React** — Crear `app/games/serpentina/play/page.tsx` basada en
   `app/games/rocas/play/page.tsx`:
   - Renombrar: `SerpentinaAPI`, `SerpentinaCallbacks`, `window.SERPENTINA`.
   - Sin HUD de vidas (eliminar estado `lives`, callback `onLives`, stat `.lives`).
   - `handleRestart` resetea solo `score`, `level`, `paused`, `over`, `finalScore`, `saved`, `name`.
   - `<Script src="/games/serpentina.js" strategy="afterInteractive">`.

4. **Migración Supabase** — Verificar con `list_tables` si `scores_serpentina` existe.
   Si no, aplicar migración con `apply_migration`.

5. **Verificar** — Ejecutar `/verify` contra los criterios de aceptación.

---

## Acceptance criteria

- [ ] `public/games/serpentina/assets/fruits.png` y `sprites.js` existen.
- [ ] `/games/serpentina/play` carga sin errores de consola.
- [ ] El canvas muestra la serpiente y una fruta del sprite atlas.
- [ ] La serpiente se mueve con las teclas de flecha.
- [ ] Comer una fruta incrementa el score en el HUD React.
- [ ] Cada 5 frutas sube el nivel en el HUD React y la serpiente acelera.
- [ ] El botón PAUSA detiene el loop; aparece el overlay "EN PAUSA".
- [ ] El botón REANUDAR reanuda desde el mismo estado.
- [ ] El botón FIN fuerza el game-over y muestra el modal.
- [ ] Chocar con la pared o con sí misma muestra el modal de game-over.
- [ ] El modal permite editar el nombre (máx. 10 chars, mayúsculas).
- [ ] "GUARDAR PUNTUACIÓN" guarda y muestra el toast de confirmación.
- [ ] "JUGAR DE NUEVO" reinicia score y nivel a valores iniciales y cierra el modal.
- [ ] "VOLVER AL VAULT" navega a `/games/serpentina`.
- [ ] Navegar fuera y volver inicia una partida nueva sin errores.
- [ ] Los listeners de teclado no interfieren con otras páginas tras navegar.
- [ ] `/salon` → pestaña SERPENTINA muestra un score real tras guardar.

---

## Decisions

- **Sí: Patrón bridge `window.SERPENTINA`** — mínimo acoplamiento entre el juego canvas
  y React; el ciclo de vida lo controla React vía `{ pause, resume, end, destroy }`.
  **Descartado:** módulo TypeScript — requeriría reescribir el juego como ES module.

- **Sí: `setInterval` en lugar de `requestAnimationFrame`** — Snake es un juego de turnos
  con velocidad controlada por intervalo fijo. `setInterval` permite pausar/reanudar y
  cambiar la velocidad por nivel sin gestión manual de timestamps en el RAF.
  **Descartado:** RAF con delta-time — añade complejidad innecesaria para un loop discreto.

- **Sí: Ruta estática `app/games/serpentina/play/page.tsx`** — App Router da precedencia
  al segmento estático; el fallback genérico `[id]/play` no se toca.

- **Sí: `<Script strategy="afterInteractive">` + polling `setInterval`** — evita race
  conditions entre el render de React y la carga del script público.

- **No: Vidas** — SERPENTINA termina con el primer choque (pared o cola propia);
  no hay sistema de vidas. Se omite el callback `onLives` y el HUD stat correspondiente.

- **Sí: Frutas aleatorias del sprite atlas** — cada spawn elige una fruta random del atlas;
  añade variedad visual sin coste adicional.

---

## Risks

| Riesgo | Mitigación |
|--------|-----------|
| Imagen del atlas no cargada al primer frame. | El boot arranca el `setInterval` solo dentro del callback `onload` de la imagen. |
| `setInterval` activo tras desmontar el componente. | El cleanup del `useEffect` siempre llama `apiRef.current?.destroy()`. |
| Input de teclado activo en otras páginas. | `destroy()` remueve el listener `keydown` de `window`. |
| `sprites.js` define `window.SPRITE_ATLAS` globalmente. | Se inlinea dentro del closure de `startSerpentina` para evitar leak al scope global. |
