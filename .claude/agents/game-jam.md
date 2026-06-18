---
name: game-jam
description: Genera un concepto de juego nuevo a partir de un tema dado y escribe 2 specs completos (diseño + integración técnica) en .claude/skills/game-jam/{game-id}/, listos para revisión humana antes de promoverlos a specs/ e implementarlos con add-game.
---

# Game Jam — Generador de conceptos de juego

## Filosofía

Este skill recibe un **tema** (o una recomendación concreta del usuario) y produce un
concepto de juego original — sin portar código de `references/starter-games/` y sin
depender de spritesheets — junto con **2 specs completos** listos para revisión humana.
No implementa nada, no toca `_lib/data.ts`, no toca `specs/`: todo se queda en una
carpeta de borrador dentro del propio skill hasta que el usuario decida promoverlo.

Flujo: **input → game-id → snapshot de catálogo → diseño → escribir specs → resumen**

---

## Fase 1 — Input y game-id

1. Toma el tema o recomendación que dio el usuario como argumento del skill.
2. Deriva un `game-id` en kebab-case en español, en el mismo estilo que los ids
   existentes (`bloque-buster`, `serpentina`, `gloton`, `duelo-pixel`): sustantivo o
   frase corta evocadora del juego, no del tema literal.
3. Verifica que el `game-id` no choque con:
   - una carpeta ya existente en `.claude/skills/game-jam/`
   - un `id` ya presente en `GAMES[]` de `_lib/data.ts`
   Si choca, agrega un sufijo numérico (`-2`, `-3`, ...).
4. Crea el directorio `.claude/skills/game-jam/{game-id}/`.

---

## Fase 2 — Snapshot rápido del catálogo

Lee `_lib/data.ts` y extrae de `GAMES[]`:
- Conteo de juegos por categoría (`ARCADE / PUZZLE / SHOOTER / VERSUS`)
- Conteo de juegos por color (`cyan / magenta / yellow / green`)

Esto es solo input de diseño para la Fase 3 (elegir categoría/color que balanceen el
catálogo) — no se escribe en ninguna memoria ni archivo de seguimiento. No descarta
ningún concepto; es información, no un filtro.

---

## Fase 3 — Diseño del concepto

Inventa un concepto de juego jugable en canvas 2D que conecte claramente con el tema
dado. Define:

- **Título** (estilo retro-arcade, en español, como los existentes: ARKANOID → ARCADE,
  TETRIS → PUZZLE, etc.)
- **Género / mecánica central** (una frase: "shooter de oleadas", "puzzle de
  encaje", "plataformas de un botón"...)
- **Controles**: qué teclas hacen qué (mismo patrón que los juegos implementados:
  `ArrowLeft/Right/Up/Down`, `Space`, mouse opcional)
- **Loop de juego**: qué pasa cada frame/tick, qué dispara el spawn de elementos
- **Condición de derrota** y, si aplica, **condición de victoria**
- **Progresión de dificultad**: cómo escala (velocidad, densidad de obstáculos,
  niveles) — sigue el patrón ya usado en el catálogo (ej. Tetris sube velocidad cada
  10 líneas, Snake reduce el intervalo cada 5 puntos)
- **Arte**: paleta de colores y formas dibujadas directamente con primitivas canvas
  (`fillRect`, `arc`, `beginPath`/`lineTo`, gradientes). Cero spritesheets, cero
  imágenes externas — esto evita bloquear el spec en assets pendientes.
- **Categoría** (`cat`) y **color** (`color`) sugeridos, eligiendo los que tengan
  menos representación según el snapshot de la Fase 2 (mismo criterio de balance que
  usa `game-planner`, pero aplicado aquí solo como justificación de diseño).

---

## Fase 4 — Escribir `01-design.md`

Ruta: `.claude/skills/game-jam/{game-id}/01-design.md`

Estructura:

```markdown
# SPEC — Diseño de {TÍTULO} ({game-id})

> **Status:** Propuesto · **Tema:** {tema dado por el usuario} · **Date:** {YYYY-MM-DD}
> **Objective:** Definir las mecánicas, controles y progresión de {TÍTULO} antes de
> escribir el spec de integración técnica ({game-id}/02-integration.md).

---

## Concepto

{2-4 frases: qué es el juego, cómo conecta con el tema, qué lo hace divertido.}

## Mecánicas

- **Loop de juego:** {qué ocurre cada frame/tick}
- **Input del jugador:** {qué acciones puede tomar}
- **Condición de derrota:** {cuándo termina la partida}
- **Condición de victoria (si aplica):** {cuándo "gana", o "N/A — survival infinito"}

## Controles

| Tecla / input | Acción |
|----------------|--------|
| ... | ... |

## Progresión de dificultad

{cómo escala: niveles, velocidad, densidad de obstáculos, etc. — con números concretos
igual que Tetris (cada 10 líneas) o Snake (cada 5 puntos, -15ms de intervalo)}

## Arte (canvas puro, sin assets externos)

- **Paleta:** {colores hex usados}
- **Formas:** {qué primitivas canvas representan cada elemento del juego}

## Categoría y color sugeridos

- **Categoría:** {ARCADE/PUZZLE/SHOOTER/VERSUS} — {justificación de balance de catálogo}
- **Color:** {cyan/magenta/yellow/green} — {justificación de balance de catálogo}

## Acceptance criteria (diseño)

- [ ] Las reglas del loop de juego están descritas sin ambigüedad.
- [ ] Cada control mapea a una acción única.
- [ ] La condición de derrota (y victoria, si aplica) es verificable en código.
- [ ] La progresión de dificultad tiene valores numéricos concretos, no solo
      descripción cualitativa.
- [ ] El arte no depende de ningún asset externo (imagen, spritesheet, audio).
```

Rellena cada placeholder con contenido real y específico del concepto inventado —
nunca dejes placeholders sin resolver en el archivo final.

---

## Fase 5 — Escribir `02-integration.md`

Ruta: `.claude/skills/game-jam/{game-id}/02-integration.md`

Sigue **exactamente** el molde de `specs/07-bloque-buster-game-integration.md` y
`specs/08-add-game-serpentina.md` (Status/Depends on/Date/Objective → Scope In/Out →
Data model → Implementation plan → Acceptance criteria → Decisions → Risks), adaptado
a que este juego no tiene starter-game de referencia ni spritesheet:

```markdown
# SPEC — Integración técnica de {TÍTULO} ({game-id})

> **Status:** Propuesto · **Depends on:** {game-id}/01-design.md, 06-supabase-scores-leaderboard · **Date:** {YYYY-MM-DD}
> **Objective:** Integrar {TÍTULO} (juego canvas puro, sin spritesheet) en la ruta
> `/games/{game-id}/play` con HUD React sincronizado, score guardado en Supabase vía
> UserContext, y leaderboard real en `/salon`.

---

## Scope

**In:**

- Entrada nueva en `GAMES[]` de `_lib/data.ts`: `id: "{game-id}"`, `title`, `short`,
  `long`, `cat`, `cover`, `color`, `best: 0`, `plays: "0"`.
- `public/games/{game-id}.js` — juego construido desde cero, 100% canvas (sin
  imágenes): `start{PascalCaseId}(canvas, callbacks)` encapsulado en closure,
  expuesto como `window.{CONST_ID} = { start: start{PascalCaseId} }`.
- `app/games/{game-id}/play/page.tsx` — página React siguiendo el patrón de
  `app/games/serpentina/play/page.tsx` (HUD con score/nivel, sin vidas si el diseño
  no las usa; con vidas si el diseño las define en 01-design.md).
- Migración Supabase: tabla `scores_{game_id_underscored}` con RLS (public read +
  public insert), igual estructura que las tablas existentes.

**Out of scope:**

- Assets gráficos externos (el diseño es 100% canvas — ver 01-design.md).
- Controles táctiles / móvil.
- Modificar cualquier otro juego de la plataforma.

---

## Data model

**Entrada en `GAMES[]`:**
```ts
{
  id: "{game-id}",
  title: "{TÍTULO}",
  short: "{una línea}",
  long: "{2-3 frases}",
  cat: "{CATEGORÍA}",
  cover: "cover-{game-id}",
  color: "{color}",
  best: 0,
  plays: "0",
}
```

**API de control del juego:**
```ts
interface {PascalCaseId}API {
  pause(): void;
  resume(): void;
  end(): void;
  destroy(): void;
}

interface {PascalCaseId}Callbacks {
  onScore(score: number): void;
  onLevel(level: number): void;   // si el diseño tiene niveles
  onLives(lives: number): void;   // si el diseño tiene vidas
  onGameOver(finalScore: number): void;
}

window.{CONST_ID} = {
  start(canvas: HTMLCanvasElement, callbacks: {PascalCaseId}Callbacks): {PascalCaseId}API
}
```

**Tabla Supabase** `scores_{game_id_underscored}`:
```sql
id          uuid        primary key default gen_random_uuid()
player_name text        not null
score       integer     not null
created_at  timestamptz default now()
```

---

## Implementation plan

1. Registrar `{game-id}` en `GAMES[]` (`_lib/data.ts`).
2. Crear `public/games/{game-id}.js`:
   - Implementar las mecánicas de `01-design.md` con primitivas canvas.
   - Loop con `requestAnimationFrame` + `dt` (o `setInterval` si el diseño es de
     turnos/grilla discreta, como Snake).
   - Listeners de teclado nombrados en `window` para poder removerlos en `destroy()`.
   - Callbacks en cada punto de cambio de estado (score, nivel/vidas, game-over).
   - `start{PascalCaseId}` retorna `{ pause, resume, end, destroy }`.
   - Exposición final: `window.{CONST_ID} = { start: start{PascalCaseId} }`.
3. Crear `app/games/{game-id}/play/page.tsx` basado en el patrón de
   `app/games/serpentina/play/page.tsx` o `app/games/rocas/play/page.tsx`:
   - `<Script src="/games/{game-id}.js" strategy="afterInteractive">`
   - Polling a `window.{CONST_ID}` (50ms, timeout 5s)
   - State React: `score`, `level`/`lives` según diseño, `paused`, `over`,
     `finalScore`, `saved`, `name`
   - Modal de game-over con guardado de score vía `UserContext.saveScore`
   - Cleanup en `useEffect` llamando `api.destroy()`
4. Aplicar migración Supabase para `scores_{game_id_underscored}` (vía MCP
   `apply_migration` o verificar con `list_tables` si ya existe).
5. Añadir cobertura visual `cover-{game-id}` en `globals.css` (gradiente con el
   color sugerido).

---

## Acceptance criteria

- [ ] `/games/{game-id}/play` carga sin errores de consola.
- [ ] El canvas renderiza el juego solo con primitivas canvas (sin requests de imagen).
- [ ] El HUD React muestra score (y nivel/vidas si aplica) sincronizado con el juego.
- [ ] El botón PAUSA detiene el loop y muestra el overlay "EN PAUSA".
- [ ] El botón REANUDAR continúa desde el mismo estado.
- [ ] El botón FIN fuerza el game-over y muestra el modal con la puntuación final.
- [ ] La condición de derrota definida en 01-design.md dispara el modal automáticamente.
- [ ] "GUARDAR PUNTUACIÓN" llama a `UserContext.saveScore` y confirma.
- [ ] "JUGAR DE NUEVO" reinicia el estado a los valores iniciales.
- [ ] "VOLVER AL VAULT" navega a `/games/{game-id}`.
- [ ] Los listeners de teclado no interfieren con otras páginas tras navegar fuera.
- [ ] `/salon` → pestaña {TÍTULO} muestra scores reales desde Supabase.

---

## Decisions

- **Sí: 100% canvas vectorial, sin spritesheet** — evita bloquear la integración en
  la creación/búsqueda de assets gráficos; el diseño de 01-design.md ya define
  paleta y formas suficientes para que el juego se vea intencional.
  **Descartado:** Generar o buscar un spritesheet — añade una dependencia externa
  innecesaria para un concepto nuevo sin referencia previa.

- **Sí: Patrón bridge `window.{CONST_ID}`** — mínimo acoplamiento entre canvas y
  React, mismo patrón que todos los juegos ya implementados.
  **Descartado:** Reescribir el juego como módulo ES — requiere bundler, no aporta
  valor sobre el patrón bridge ya validado.

- {Decisión específica del juego concreto, ej. elección de RAF vs setInterval según
  si el diseño es de turnos o de física continua — justificar con el mismo criterio
  usado en 07/08.}

---

## Risks

- **Fuga de event listeners.** Si el componente se desmonta sin llamar `destroy()`,
  los listeners de teclado afectarían a otras páginas. Mitigación: cleanup del
  `useEffect` siempre llama `api.destroy()`.
- {Riesgo específico del juego concreto, ej. balance de dificultad, colisiones, etc.}
```

Rellena cada placeholder (`{TÍTULO}`, `{game-id}`, `{PascalCaseId}`, `{CONST_ID}`,
`{CATEGORÍA}`, `{color}`, decisiones y riesgos específicos) con contenido real —
el archivo final no debe contener placeholders sin resolver.

---

## Fase 6 — Resumen final al usuario

Tras escribir ambos archivos, muestra:

```
## Game Jam — Concepto generado

**Juego:** {TÍTULO} (`{game-id}`)
**Tema:** {tema dado}
**Categoría / color:** {cat} / {color}

Specs escritos:
- .claude/skills/game-jam/{game-id}/01-design.md
- .claude/skills/game-jam/{game-id}/02-integration.md

{3-4 líneas resumiendo el concepto: mecánica central, cómo conecta con el tema, qué
lo hace distinto de los juegos ya en el catálogo.}

---
Estos specs son un borrador para tu revisión — no se ha tocado `_lib/data.ts` ni
`specs/`. Si los apruebas, cópialos a `specs/NN-slug.md`, registra el juego en
`_lib/data.ts` y usa `/add-game` para implementarlo.
```

No invoques `/add-game` automáticamente ni escribas en `_lib/data.ts` o `specs/` —
esa decisión es del usuario.

---

## Reference files

| File | Propósito |
|------|-----------|
| `_lib/data.ts` | `GAMES[]` — fuente de balance de categoría/color |
| `specs/07-bloque-buster-game-integration.md` | Molde de referencia para `02-integration.md` |
| `specs/08-add-game-serpentina.md` | Molde de referencia para `02-integration.md` (caso sin vidas, con niveles) |
| `app/games/serpentina/play/page.tsx` | Patrón de página React a replicar |
| `app/games/rocas/play/page.tsx` | Patrón alternativo de página React (con vidas) |
| `.claude/skills/game-jam/{game-id}/` | Carpeta de borrador de cada concepto generado |
