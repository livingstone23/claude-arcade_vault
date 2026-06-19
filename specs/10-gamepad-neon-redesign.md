# SPEC 10 — Rediseño neón del gamepad táctil

> **Status:** Implementado · **Depends on:** 09-touch-controls-mobile · **Date:** 2026-06-19 · **Ampliada:** 2026-06-19 (D-pad completo decorativo + ocultar en pantalla no-mobile)
> **Objective:** Reemplazar el estilo visual del componente `TouchControls` (D-pad + botón de acción) por el diseño de gamepad neón de `references/gamepad-assets/` (tarjeta sólida con glow, D-pad con flechas SVG y hub pulsante, botones de acción circulares A/B), agregando soporte de tipo para un futuro botón B, sin modificar el mapeo de teclas ni el comportamiento de los 4 juegos existentes.

---

## Scope

**In:**

- Reescritura visual de `_components/TouchControls/TouchControls.tsx` para adoptar la estética de `references/gamepad-assets/gamepad.html`: tarjeta `.gp` sólida (gradiente `#1c1c28→#0c0c14`, borde cian tenue, glow, textura de puntos de fondo), D-pad con botones cuadrados redondeados + iconos SVG de flecha (reemplazando los caracteres `▲▼◀▶` actuales) + hub central decorativo con gema pulsante (`@keyframes pulse-led`), y botón(es) de acción circulares con halo de color y letra en fuente pixel (`var(--pixel)`), tal como en el mockup.
- Nuevo archivo `_components/TouchControls/TouchControls.module.css` con las clases, `:active`, transiciones, keyframes y media query de tamaño reducido (equivalente al `@media (max-width: 620px)` del mockup), migrando el componente de estilos inline (`CSSProperties`) a `className`.
- Ampliación del tipo `TouchControlsConfig` para incluir `buttonB?: KeySpec` (mismo contrato que `buttonA`), renderizado solo si se pasa un valor — preparado para uso futuro.
- La tarjeta `.gp` se mantiene `position: fixed` anclada abajo, pero ahora centrada y de ancho intrínseco (no ocupa todo el ancho del viewport), conteniendo D-pad (izq) + botón(es) de acción (der) dentro de un mismo contenedor visual, en vez de la franja full-width actual.
- Tamaño mínimo táctil de cada botón se mantiene ≥44×44px en todos los breakpoints.
- **(Ampliación)** El D-pad siempre renderiza sus 4 flechas (arriba/abajo/izquierda/derecha) por completitud visual del mockup, incluso si el `config` del juego no define `KeySpec` para alguna dirección. Las flechas sin `KeySpec` se renderizan en estado decorativo/deshabilitado (sin `onTouchStart`/`onTouchEnd`, sin glow al presionar, opacidad reducida) — no disparan ningún `KeyboardEvent`.
- **(Ampliación)** El botón B siempre se renderiza junto al botón A por completitud visual del mockup, incluso si `config.buttonB` no está definido. Si no hay `KeySpec`, se muestra en estado decorativo/deshabilitado (sin handlers de touch, opacidad reducida) — no dispara eventos. Si `config.buttonB` sí está definido, es completamente funcional.
- **(Ampliación)** La tarjeta `.gp` completa se oculta vía CSS (`display: none`) en viewports por encima del breakpoint mobile (`@media (min-width: 621px)`), independientemente de si el dispositivo reporta soporte táctil — el gamepad solo debe verse en tamaños de pantalla de celular.

**Out of scope:**

- Cambios a `app/games/{rocas,caida,serpentina,bloque-buster}/play/page.tsx` — ningún `config` de mapeo de teclas se modifica; los 4 juegos heredan el nuevo estilo automáticamente sin tocarse.
- Asignación real de `buttonB` en algún juego — el tipo queda disponible pero ninguna página lo usa todavía; el botón se muestra decorativo, no funcional, hasta que algún juego lo configure.
- Rediseño de `_components/RotateDeviceHint.tsx` — queda con su estilo actual.
- Cambios al hook `_lib/useTouchDevice.ts` ni a la lógica de dispatch de `KeyboardEvent` (`dispatchKey`) — se mantiene exactamente igual.
- Modificar archivos `public/games/*.js`.
- PWA, fullscreen, wake-lock, gamepad físico Bluetooth/USB — sin cambios respecto a la spec 09.

---

## Data model

No se introduce persistencia nueva ni tablas Supabase. Se extiende el contrato de tipos de UI existente:

```ts
// _components/TouchControls/TouchControls.tsx
interface KeySpec {
  key: string;
  code: string;
}

interface TouchControlsConfig {
  dpad?: {
    up?: KeySpec;
    down?: KeySpec;
    left?: KeySpec;
    right?: KeySpec;
  };
  buttonA?: KeySpec;
  buttonB?: KeySpec; // NUEVO — mismo contrato que buttonA, opcional, sin uso actual en los 4 juegos
}
```

El despacho de eventos (`dispatchKey`) y el hook `useTouchDevice` no cambian:

```ts
window.dispatchEvent(new KeyboardEvent('keydown', { key: spec.key, code: spec.code, bubbles: true }));
window.dispatchEvent(new KeyboardEvent('keyup', { key: spec.key, code: spec.code, bubbles: true }));
```

Nuevo archivo de estilos (sin lógica, solo CSS):

```
_components/TouchControls/TouchControls.module.css
```

Clases principales esperadas: `.gp`, `.gpBody`, `.dpad`, `.dp`, `.dpHub`, `.dpHubGem`, `.actions`, `.ab`, `.abA`, `.abB`, `.abLetter`, `.abRing` — nombres exactos a definir en implementación, siguiendo la convención `camelCase` de CSS Modules (equivalente a las clases `kebab-case` del mockup `.gp`, `.dp`, `.dp-hub`, `.ab`, etc.).

---

## Implementation plan

1. **Crear `_components/TouchControls/TouchControls.module.css`** — portar las reglas de `references/gamepad-assets/gamepad.html` (`.gp`, `.gp::before`, `.gp::after`, `.gp-body`, `.gp-dpad`, `.dp`, `.dp-arrow`, `.dp-hub`, `.dp-hub-gem` + `@keyframes pulse-led`, `.gp-actions`, `.ab`, `.ab.a`/`.ab.b`, `.ab-letter`, `.ab-ring`, y el `@media (max-width: 620px)`) traducidas a nombres `camelCase` de CSS Module, reutilizando los tokens ya existentes en `app/globals.css` (`--cyan`, `--magenta`, `--pixel`) en vez de redeclararlos.

2. **Reescribir `_components/TouchControls/TouchControls.tsx`**:
   - Agregar `buttonB?: KeySpec` a `TouchControlsConfig`.
   - Eliminar los objetos `CSSProperties` (`dpadButtonStyle`, `actionButtonStyle`) y el `style` inline; reemplazar por `className` desde el CSS Module.
   - D-pad: 4 `TouchButton` con SVG de flecha (mismos paths que `gamepad.html`: `dp-up`/`dp-down`/`dp-left`/`dp-right`) en vez de los glifos `▲▼◀▶`, más un `<div>` central decorativo `aria-hidden` con la gema pulsante (no es un botón, no dispara eventos).
   - Acciones: renderizar `buttonA` y, si existe, `buttonB`, como botones circulares con clase `.ab.a`/`.ab.b`, letra en `<span className={styles.abLetter}>` y el anillo `<span className={styles.abRing}>`.
   - Mantener intactos `onTouchStart`/`onTouchEnd`/`onTouchCancel` y `dispatchKey` — solo cambia el marcado/clases, no el comportamiento de eventos.
   - El contenedor raíz pasa de franja `width: 100%` a tarjeta `.gp` centrada (`left: 50%; transform: translateX(-50%)` o `display:flex; justify-content:center` en un wrapper fixed full-width transparente), conservando `position: fixed; bottom; z-index: 40`.
   - Clase `.on` (equivalente a `:active`) se aplica vía estado local `pressed` por botón (React no tiene `:active` controlable por touch de forma confiable en todos los navegadores) para disparar el glow/transform al tocar.

3. **Verificar con `/verify`**: abrir cada uno de los 4 `/games/{id}/play` en viewport táctil emulado (375px y ≥620px), confirmar que:
   - El gamepad se ve como la tarjeta neón del mockup (D-pad con flechas SVG + hub pulsante, botón(es) de acción circulares con halo).
   - `rocas` y `caida` muestran su botón A existente con el nuevo estilo; ningún juego muestra un botón B (porque ninguno lo pasa en su `config`).
   - Tocar cada botón sigue moviendo/disparando exactamente igual que antes (mismo `KeyboardEvent` sintético).
   - El teclado físico sigue funcionando en paralelo.
   - No hay overlap entre la tarjeta del gamepad y el HUD/canvas en 375px de ancho.
   - El build de TypeScript no falla por el nuevo campo `buttonB` opcional no usado en las 4 páginas.

---

## Acceptance criteria

- [x] `_components/TouchControls/TouchControls.module.css` existe y contiene las clases del D-pad (con flechas SVG y hub pulsante) y de los botones de acción (circulares, con halo de color y anillo), usando `var(--cyan)`/`var(--magenta)`/`var(--pixel)` de `app/globals.css`.
- [x] `TouchControlsConfig` incluye `buttonB?: KeySpec`; el componente renderiza siempre un segundo botón circular (estilo `.ab.b`, cian), funcional si `config.buttonB` está definido y decorativo/deshabilitado si no.
- [x] El componente ya no usa `style`/`CSSProperties` para su apariencia — usa `className` del CSS Module.
- [x] **(Ampliación)** En cualquier juego, el D-pad siempre muestra sus 4 flechas; las direcciones sin `KeySpec` en el `config` (p. ej. `down` en rocas) se ven decorativas/deshabilitadas (opacidad reducida, sin glow al tocar) pero no desaparecen.
- [x] **(Ampliación)** El botón B siempre es visible junto al A en los 4 juegos; en los 4 es decorativo/deshabilitado hoy porque ningún `config` define `buttonB`.
- [x] En viewport táctil emulado, `/games/rocas/play` y `/games/caida/play` muestran el botón A funcional (magenta) con el nuevo estilo neón.
- [x] En viewport táctil emulado, `/games/serpentina/play` y `/games/bloque-buster/play` muestran el D-pad con el nuevo estilo neón (sin botón A funcional).
- [x] Tocar cualquier botón funcional del D-pad/acción produce el mismo `KeyboardEvent('keydown'/'keyup', ...)` que antes de este cambio (sin regresión funcional respecto a la spec 09); tocar un botón decorativo no dispara ningún evento.
- [x] El hub central del D-pad es puramente decorativo (`aria-hidden`), no intercepta toques ni dispara eventos.
- [x] Cada botón (funcional o decorativo) mantiene un área táctil mínima de 44×44px en viewport de 375px de ancho (breakpoint reducido equivalente al `@media (max-width: 620px)` del mockup).
- [x] La tarjeta del gamepad no se superpone con el HUD ni genera overflow horizontal en 375px de ancho.
- [x] **(Ampliación)** La tarjeta completa del gamepad no se muestra (`display: none`) en viewports por encima de 620px de ancho, sin importar si el dispositivo reporta soporte táctil.
- [x] El teclado físico sigue funcionando igual que antes en los 4 juegos.
- [x] `RotateDeviceHint.tsx` no fue modificado.
- [x] Ningún archivo `public/games/*.js` ni `app/games/*/play/page.tsx` fue modificado.
- [x] `npx tsc --noEmit` (o el build) no produce errores nuevos por el cambio de tipo en `TouchControlsConfig`.

---

## Decisions

- **Sí: migrar de estilos inline a CSS Module** — el mockup requiere `:active`/`@keyframes`/`@media`, imposibles de expresar con `CSSProperties` puro; un CSS Module es la forma idiomática en Next.js de portar CSS plano sin tocar `globals.css` con reglas específicas de un solo componente.
  **Descartado:** agregar las reglas a `app/globals.css` — mezclaría estilos de un componente puntual con el CSS global compartido del sitio, dificultando su mantenimiento futuro.

- **Sí: reutilizar tokens `--cyan`/`--magenta`/`--pixel` ya definidos en `app/globals.css`** — el mockup ya coincide con la paleta y fuente del proyecto; redeclarar esos valores en el módulo crearía una fuente de verdad duplicada.
  **Descartado:** copiar los valores hardcodeados (`#00f5ff`, `#ff006e`, etc.) tal cual del `gamepad.html` standalone.

- **Sí: agregar `buttonB` al tipo aunque ningún juego lo use aún** — desbloquea fidelidad visual al mockup (A+B) sin forzar a decidir ahora qué acción mapea en cada juego; queda preparado para una spec futura que lo asigne.
  **Descartado:** omitir `buttonB` del tipo — obligaría a reabrir este componente en cuanto algún juego necesite una segunda acción, además de no poder mostrar el botón B del mockup en ningún caso real hoy.

- **Sí: tarjeta `.gp` centrada de ancho intrínseco en vez de franja full-width** — fiel al mockup, y al no ocupar todo el ancho deja más visible el canvas a los costados en pantallas anchas.
  **Descartado:** mantener la franja full-width actual solo reskineada — se alejaría visualmente del mockup adjunto, que es justamente el pedido explícito de esta spec.

- **Sí: fondo sólido/opaco para la tarjeta (no semi-transparente con blur)** — la tarjeta no cubre el área de juego central al estar anclada abajo y centrada, así que no hace falta transparencia para no obstruir la visión del juego.
  **Descartado:** mantener `backdrop-filter: blur()` semi-transparente del overlay actual — el mockup usa fondo opaco y no hay razón funcional para divergir aquí.

- **Sí: estado React `pressed` por botón en vez de depender de `:active` CSS para el glow** — el comportamiento `:active` de CSS en eventos táctiles es inconsistente entre navegadores móviles; ya existen los handlers `onTouchStart`/`onTouchEnd`/`onTouchCancel`, así que controlar la clase visual desde el mismo estado que dispara el `KeyboardEvent` es más confiable.
  **Descartado:** depender solo de `:active`/`.on` vía CSS puro como en el `gamepad.html` standalone (ese usa `classList.add/remove` manual en JS vanilla, equivalente a lo que hacemos con estado React).

- **No: tocar `RotateDeviceHint.tsx` ni los 4 `page.tsx`** — el pedido explícito de esta spec es el rediseño visual del gamepad; ampliar el alcance a esos archivos diluiría el cambio y arriesgaría regresiones en código que ya funciona y está fuera del mockup adjunto.

---

## Risks

| Riesgo | Mitigación |
|--------|-----------|
| El cambio a CSS Module puede generar nombres de clase distintos a los del mockup original, dificultando comparar visualmente contra `gamepad-neon.png` durante la implementación. | Usar nombres `camelCase` que mapeen 1:1 con las clases `kebab-case` del mockup (`.gp-dpad` → `styles.gpDpad`, etc.) para facilitar la verificación lado a lado. |
| Migrar de `style` inline a `className` podría romper algún z-index/posicionamiento que dependía de la cascada de estilos inline (mayor especificidad que las clases). | Verificar visualmente en los 4 juegos tras el cambio que el gamepad sigue por encima del canvas y no es tapado por el HUD; ajustar `z-index` en el módulo si es necesario. |
| El nuevo layout centrado (en vez de full-width) podría dejar menos espacio para futuros elementos del HUD que antes convivían con la franja completa. | No aplica en esta spec — ningún HUD actual depende del ancho de la franja anterior; si surge en el futuro, se resuelve en esa spec. |
| Agregar `buttonB` al tipo sin que ningún juego lo use podría quedar "muerto" indefinidamente si nadie lo retoma. | Aceptado conscientemente — es una preparación de bajo costo (un campo opcional), no deuda técnica real. |
| El hub central decorativo podría capturar toques accidentalmente si su `z-index`/posición se solapa con los botones direccionales reales. | Usar `pointer-events: none` además de `aria-hidden` en el hub para garantizar que nunca intercepta eventos táctiles. |
