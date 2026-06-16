# SPEC 06 — Persistencia de scores en Supabase y leaderboard real

> **Status:** Implementado · **Depends on:** 05-asteroides-game-integration · **Date:** 2026-06-16
> **Objective:** Persistir scores de todos los juegos en Supabase y mostrar
> leaderboard real por juego en `/salon`, migrando scores existentes de localStorage.

---

## Scope

**In:**

- Supabase: 8 tablas `scores_<game>` con RLS (read público, insert público)
- `_lib/supabase.ts` — cliente Supabase browser + helper `scoreTable(gameId)`
- `_contexts/UserContext.tsx` — `saveScore` escribe a Supabase + mantiene localStorage como backup;
  efecto de migración one-time de `av_scores` localStorage → Supabase
- `app/salon/page.tsx` — reemplaza `seededScores()` por query real a Supabase;
  top 12 por juego seleccionado; empty state cuando no hay scores; loading state

**Out of scope:**

- Supabase Auth (login con email/password) — spec separado futuro
- Vista "global" combinada de todos los juegos en /salon
- Scores en tiempo real (subscriptions/websockets)
- Spec 07 (toggle tabla/cards en /biblioteca) — spec separado
- Modificar lógica de ningún juego existente

---

## Data model

**8 tablas Supabase, una por juego** — nombre: `scores_` + id del juego con guiones
reemplazados por underscores (ej. `bloque-buster` → `scores_bloque_buster`).

Estructura idéntica en cada tabla:

```sql
create table scores_<game> (
  id          uuid        primary key default gen_random_uuid(),
  player_name text        not null,
  score       integer     not null,
  created_at  timestamptz default now()
);
alter table scores_<game> enable row level security;
create policy "public read"   on scores_<game> for select using (true);
create policy "public insert" on scores_<game> for insert with check (true);
```

Tablas: `scores_bloque_buster`, `scores_caida`, `scores_serpentina`, `scores_gloton`,
`scores_invasores`, `scores_rocas`, `scores_ranaria`, `scores_duelo_pixel`.

**Helper de nombre de tabla** (en `_lib/supabase.ts`):

```ts
export const scoreTable = (gameId: string) =>
  `scores_${gameId.replace(/-/g, "_")}`;
```

**Variables de entorno requeridas (`.env.local`):**

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

**Tipos existentes sin cambio** — `SavedScore` en `_lib/data.ts` ya tiene
`{ game, score, name, at }`. La migración mapea `name → player_name`, `at → created_at`.

**Sin cambios** en `ScoreRow`, `Game`, ni `GAMES`.

---

## Implementation plan

1. **Supabase schema** — una migration que crea las 8 tablas con sus RLS
   via `mcp__supabase__apply_migration`.

2. **`_lib/supabase.ts`** — crear cliente browser + helper:
   ```ts
   import { createClient } from "@supabase/supabase-js";
   export const supabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
   );
   export const scoreTable = (gameId: string) =>
     `scores_${gameId.replace(/-/g, "_")}`;
   ```

3. **`package.json`** — añadir dependencia `@supabase/supabase-js`.

4. **`_contexts/UserContext.tsx`** — dos cambios:
   - `saveScore`: después del push a localStorage, fire-and-forget insert a Supabase
     `supabase.from(scoreTable(entry.game)).insert({ player_name: entry.name, score: entry.score })`.
   - Nuevo `useEffect` (solo en mount): si `localStorage.getItem("av_migrated")` no existe,
     leer `av_scores`, insertar cada entrada en su tabla via `scoreTable`, setear `av_migrated = "1"`.
     Ejecutar sin bloquear el render; errores silenciados con `try/catch`.

5. **`app/salon/page.tsx`** — reemplazar `seededScores()` por query Supabase:
   - State: `rows: ScoreRow[]`, `loading: boolean`.
   - `useEffect` dependiente de `tab`: query
     `supabase.from(scoreTable(tab)).select("player_name, score, created_at")
      .order("score", { ascending: false }).limit(12)`.
   - Mapear resultado a `ScoreRow[]` (rank por índice, date formateada de `created_at`).
   - Mostrar spinner (`.pixel` parpadeante "CARGANDO…") mientras `loading`.
   - Mostrar empty state ("AÚN NO HAY SCORES — ¡SÉ EL PRIMERO!") si `rows.length === 0`.
   - Row del usuario: buscar en `rows` por `player_name === user?.name`;
     si no está en top 12, query adicional para su mejor score en ese juego.
   - Eliminar import de `seededScores`.

---

## Acceptance criteria

- [ ] Las 8 tablas `scores_<game>` existen en Supabase con columnas `id, player_name, score, created_at`.
- [ ] RLS activo en cada tabla: cualquier cliente puede leer e insertar sin autenticación.
- [ ] Guardar score en `/games/rocas/play` persiste la fila en `scores_rocas`.
- [ ] `/salon` muestra spinner "CARGANDO…" mientras llega la query.
- [ ] `/salon` muestra empty state cuando no hay scores para el juego seleccionado.
- [ ] `/salon` muestra los scores reales de Supabase ordenados por puntuación desc.
- [ ] Cambiar de tab dispara nueva query y actualiza la tabla.
- [ ] Usuario logueado ve su fila destacada en amarillo si está en top 12.
- [ ] Usuario logueado ve su mejor score aunque no esté en top 12.
- [ ] Scores previos en `av_scores` localStorage se migran a Supabase en primera carga.
- [ ] La migración solo corre una vez (`av_migrated` flag en localStorage).
- [ ] No hay errores de consola en `/salon` ni en páginas de juego.
- [ ] `/salon` con datos reales no rompe el podio (top 3 visualización).
- [ ] Juegos sin scores reales muestran empty state, no crash.

---

## Decisions

- **Sí: Una tabla por juego** — aislamiento total de datos, queries más simples
  (sin filtro `game`), escalabilidad independiente por juego.
  **Descartado:** Tabla única `scores` con columna `game` — join más fácil para vista
  global, pero innecesario dado que el scope excluye leaderboard global.

- **Sí: Insert anónimo (solo nombre, sin Supabase Auth)** — mínima fricción para el jugador.
  RLS permissive en insert; cualquiera puede postear un score con cualquier nombre.
  **Descartado:** Supabase Auth — requiere refactor completo de `/auth` y UserContext,
  scope propio.

- **Sí: localStorage como backup + Supabase como primario** — `saveScore` escribe a ambos.
  Si Supabase falla, el score queda en localStorage y se puede reintentar.
  **Descartado:** Solo Supabase — una falla de red haría perder el score sin aviso al usuario.

- **Sí: Migración one-time via flag `av_migrated`** — simple, idempotente, sin servidor.
  **Descartado:** Migración manual (botón "importar mis scores") — el usuario no debería
  tener que hacer nada; la migración debe ser transparente.

- **Sí: Query client-side en `useEffect`** — `/salon` ya es Client Component; mantiene
  consistencia con el patrón del proyecto.
  **Descartado:** Server Component con fetch en el servidor — requeriría convertir `/salon`
  y perder acceso a UserContext para destacar la fila del usuario.

- **Sí: `seededScores()` eliminado de `/salon`** — con datos reales no tiene sentido mezclar
  datos ficticios; el empty state reemplaza la necesidad de relleno.
  **Descartado:** Seeded como fallback — confunde datos reales con ficticios en la misma tabla.
