# SPEC 09 — Controles táctiles para mobile

> **Status:** Implementado · **Depends on:** 05-asteroides, 07-bloque-buster, 08-serpentina (y entrada existente de `caida`) · **Date:** 2026-06-18
> **Objective:** Agregar una capa de controles táctiles tipo D-pad + botones de acción (estilo control de consola), superpuesta sobre los 4 juegos jugables (`rocas`, `caida`, `serpentina`, `bloque-buster`), implementada disparando `KeyboardEvent` sintéticos hacia los bindings de teclado ya existentes (sin modificar ninguno de los 4 motores canvas), visible solo en dispositivos táctiles, manteniendo el teclado funcional en paralelo, con escalado responsivo del canvas y una sugerencia (no bloqueante) de rotar a horizontal.

---

## Scope

**In:**

- Componente compartido `_components/TouchControls/TouchControls.tsx` — D-pad (4 direcciones) + hasta 1 botón de acción (A), configurable por juego vía props, dispara `KeyboardEvent('keydown'/'keyup', { key, code })` sobre `window`, soporta multi-touch simultáneo (cada botón gestiona su propio touch independiente).
- Util `_lib/useTouchDevice.ts` — hook de detección de dispositivo táctil (`'ontouchstart' in window || navigator.maxTouchPoints > 0`).
- Componente `_components/RotateDeviceHint.tsx` — banner no bloqueante ("Gira tu dispositivo para mejor experiencia"), visible solo si `useTouchDevice()` es true y `(orientation: portrait)`, descartable, no impide jugar.
- Edición de los 4 play pages para integrar `<TouchControls />` con su mapeo específico:
  - `app/games/rocas/play/page.tsx` — D-pad izq/der = `ArrowLeft`/`ArrowRight` (rotar), arriba = `ArrowUp` (empuje), botón A = `Space` (disparo).
  - `app/games/caida/play/page.tsx` — D-pad izq/der = `ArrowLeft`/`ArrowRight` (mover), abajo = `ArrowDown` (soft drop), botón A = `ArrowUp` (rotar).
  - `app/games/serpentina/play/page.tsx` — D-pad 4 direcciones = `ArrowUp/Down/Left/Right`, sin botón A.
  - `app/games/bloque-buster/play/page.tsx` — D-pad izq/der = `ArrowLeft`/`ArrowRight` (paddle), sin botón A.
- CSS responsivo del `<canvas>` en las 4 páginas (`max-width: 100%; height: auto;` preservando aspect-ratio del atributo `width`/`height` interno) para que el canvas quepa en pantallas angostas sin scroll horizontal.

**Out of scope:**

- Modificar los 4 archivos canvas (`public/games/*.js`) — el bridge de teclado existente ya cubre todas las acciones necesarias.
- Gestos swipe/drag sobre el canvas — se descartó a favor de D-pad/botones fijos.
- Forzar/bloquear orientación landscape — solo se sugiere, nunca se impide jugar en portrait.
- PWA, fullscreen API, o wake-lock — fuera de esta spec.
- Cambios a `_lib/data.ts`, Supabase, o `/salon`.
- Soporte de gamepad físico (Bluetooth/USB) — no se pide en esta spec.

---

## Data model

No se introduce persistencia nueva ni tablas Supabase. Solo tipos/contratos de UI:

```ts
// _components/TouchControls/TouchControls.tsx
interface KeySpec {
  key: string;   // valor para e.key  (ej. "ArrowLeft", " ")
  code: string;  // valor para e.code (ej. "ArrowLeft", "Space")
}

interface TouchControlsConfig {
  dpad?: {
    up?: KeySpec;
    down?: KeySpec;
    left?: KeySpec;
    right?: KeySpec;
  };
  buttonA?: KeySpec; // botón de acción único (disparo/rotar), opcional
}

interface TouchControlsProps {
  config: TouchControlsConfig;
}
```

```ts
// _lib/useTouchDevice.ts
function useTouchDevice(): boolean;
```

Cada botón del D-pad/acción, al `touchstart`, despacha:
```ts
window.dispatchEvent(new KeyboardEvent('keydown', { key: spec.key, code: spec.code, bubbles: true }));
```
y al `touchend`/`touchcancel`:
```ts
window.dispatchEvent(new KeyboardEvent('keyup', { key: spec.key, code: spec.code, bubbles: true }));
```

---

## Implementation plan

1. **Crear `_lib/useTouchDevice.ts`** — hook que detecta `'ontouchstart' in window || navigator.maxTouchPoints > 0` una sola vez al montar (evita problemas de SSR devolviendo `false` hasta el primer `useEffect`).

2. **Crear `_components/TouchControls/TouchControls.tsx`** — recibe `config: TouchControlsConfig`:
   - D-pad: contenedor fijo `position: fixed; bottom; left;`, 4 botones direccionales semi-transparentes (cruz), cada uno con handlers `onTouchStart`/`onTouchEnd`/`onTouchCancel` que despachan el `KeyboardEvent` correspondiente a su `KeySpec`.
   - Botón A (si `config.buttonA` existe): contenedor fijo `bottom; right;`, mismo patrón de eventos.
   - `touch-action: none` en los botones para evitar scroll/zoom accidental del navegador al tocar.
   - Tamaño mínimo táctil de cada botón ≥44×44px.
   - Solo se renderiza si `dpad` tiene al menos una dirección definida (siempre será el caso en los 4 usos).

3. **Crear `_components/RotateDeviceHint.tsx`** — banner fijo arriba, texto + ícono de rotar, controlado por `useTouchDevice()` + CSS `@media (orientation: portrait)`, con botón "✕" que lo oculta (estado local, no persistente — reaparece si recarga la página en portrait).

4. **Editar las 4 páginas** (`app/games/{rocas,caida,serpentina,bloque-buster}/play/page.tsx`):
   - Importar `useTouchDevice`, `TouchControls`, `RotateDeviceHint`.
   - Renderizar `{isTouch && <RotateDeviceHint />}` y `{isTouch && <TouchControls config={...} />}` con el mapeo de teclas definido en Scope, ocultos/deshabilitados igual que el resto de controles cuando `over` es true (game-over) o `paused`.
   - Añadir `className` al `<canvas>` o a su contenedor con `max-width: 100%; height: auto;` (o equivalente vía Tailwind `w-full h-auto max-w-[Npx]`) preservando el aspect ratio del `width`/`height` interno del canvas.

5. **Verificar** con `/verify`: en un viewport emulado táctil (Chrome DevTools device toolbar), abrir cada uno de los 4 `/games/{id}/play`, confirmar que aparecen D-pad/botón A según el mapeo, que tocarlos mueve/dispara igual que las teclas físicas, que el teclado sigue funcionando en un viewport sin touch, y que el canvas se ajusta sin overflow horizontal en un ancho de 375px.

---

## Acceptance criteria

- [ ] `_lib/useTouchDevice.ts` existe y devuelve `true` solo cuando el navegador reporta soporte táctil.
- [ ] `_components/TouchControls/TouchControls.tsx` existe y acepta `config: TouchControlsConfig`.
- [ ] `_components/RotateDeviceHint.tsx` existe y solo se muestra en touch + portrait, y es descartable.
- [ ] En viewport táctil, `/games/rocas/play` muestra D-pad (izq/der rota, arriba empuje) + botón A (disparo); tocarlos produce el mismo efecto que `ArrowLeft`/`ArrowRight`/`ArrowUp`/`Space`.
- [ ] En viewport táctil, `/games/caida/play` muestra D-pad (izq/der mueve, abajo soft drop) + botón A (rotar); tocarlos produce el mismo efecto que `ArrowLeft`/`ArrowRight`/`ArrowDown`/`ArrowUp`.
- [ ] En viewport táctil, `/games/serpentina/play` muestra D-pad de 4 direcciones sin botón A; tocarlos cambia la dirección de la serpiente igual que las flechas.
- [ ] En viewport táctil, `/games/bloque-buster/play` muestra D-pad izq/der sin botón A; tocarlos mueve el paddle igual que `ArrowLeft`/`ArrowRight`.
- [ ] En viewport sin soporte táctil (desktop normal), ningún `TouchControls`/`RotateDeviceHint` se renderiza, y el teclado sigue funcionando exactamente igual que antes.
- [ ] Mantener presionado un botón táctil sostiene la acción (ej. empuje en rocas) hasta soltar (`touchend`/`touchcancel` dispara `keyup`).
- [ ] En `rocas`, mantener "empuje" y tocar "disparo" simultáneamente funciona (multi-touch).
- [ ] El canvas de los 4 juegos se ajusta al ancho de un viewport de 375px sin generar scroll horizontal, preservando su aspect ratio.
- [ ] `RotateDeviceHint` aparece en portrait táctil y desaparece al rotar a landscape o al descartarlo con "✕".
- [ ] Los controles táctiles se ocultan/deshabilitan en game-over y mientras está pausado, igual que el resto de controles de partida.
- [ ] Ningún archivo `public/games/*.js` fue modificado.

---

## Decisions

- **Sí: `KeyboardEvent` sintéticos en lugar de tocar los 4 motores canvas** — los 4 juegos ya escuchan `keydown`/`keyup` en `window` con los códigos exactos necesarios; despachar eventos sintéticos cubre el 100% de las acciones sin riesgo de romper la lógica de juego ya verificada.
  **Descartado:** exponer nuevos métodos (`moveLeft()`, `rotate()`, etc.) en cada bridge `window.GAME.start()` — requeriría tocar y volver a probar los 4 archivos canvas para una ganancia nula sobre el approach de eventos sintéticos.

- **Sí: Componente único `TouchControls` configurable por props** — un solo componente reutilizado 4 veces con distinto `config` evita duplicar la UI/lógica táctil en cada página.
  **Descartado:** componente táctil distinto por juego — más código, mismo comportamiento.

- **Sí: D-pad/botones fijos en lugar de gestos swipe** — predecible, igual de discoverable en los 4 juegos, sin riesgo de falsos positivos por gestos accidentales.
  **Descartado:** swipe/drag sobre canvas — distinto por juego, más frágil, y en `bloque-buster` entraría en conflicto con el `mousemove` ya usado para el paddle en desktop.

- **Sí: Detección por capacidad táctil (`ontouchstart`/`maxTouchPoints`), no por ancho de viewport** — cubre tablets táctiles grandes y excluye laptops sin touch aunque la ventana sea angosta.
  **Descartado:** breakpoint de ancho — falsos positivos/negativos en dispositivos híbridos.

- **No: Bloquear/forzar landscape** — se pidió explícitamente solo "sugerir"; un overlay bloqueante sería más invasivo de lo solicitado y impediría jugar a quien prefiere portrait.

- **Sí: Canvas responsivo vía CSS (`max-width:100%; height:auto`) sin tocar la resolución interna** — el `width`/`height` del elemento `<canvas>` (resolución de dibujo) se mantiene igual; solo cambia el tamaño visual en pantalla. Evita recalcular coordenadas internas de cada juego.
  **Descartado:** cambiar el `width`/`height` real del canvas según viewport — afectaría cálculos de grid/posición internos de cada motor (ej. grid 20×20 de serpentina), fuera del alcance de esta spec.

---

## Risks

| Riesgo | Mitigación |
|--------|-----------|
| `preventDefault()` ausente en `asteroids.js`/`bloque-buster.js` permite scroll/zoom accidental al tocar fuera de los botones del control. | Los botones de `TouchControls` usan `touch-action: none` y `e.preventDefault()` en sus propios handlers; no se toca el comportamiento del canvas en sí. |
| Doble disparo de evento si el navegador también sintetiza `click`/`mouseup` desde un `touchend`. | Los listeners se registran solo como `onTouchStart`/`onTouchEnd`/`onTouchCancel` (sin `onClick` paralelo) y se llama `preventDefault()` en el touch handler. |
| Multi-touch mal gestionado (un botón "atascado" en `keydown` si `touchcancel` no se maneja, ej. el dedo sale del elemento). | Se registra `onTouchCancel` además de `onTouchEnd` en cada botón, ambos disparan el `keyup` correspondiente. |
| `RotateDeviceHint` reaparece molestando en cada recarga aunque el usuario ya lo descartó. | Aceptado conscientemente — no se pidió persistencia; es un detalle menor ya que es descartable con un toque. |
| Tamaño de hitbox de los botones táctiles muy pequeño en pantallas muy angostas, dificultando precisión (crítico en `caida`/`rocas`). | Tamaño mínimo táctil ≥44×44px definido en el CSS del componente al implementarlo. |
