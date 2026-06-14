# SPEC 02 — Arcade Vault Home Page

> **Status:** Aprobado · **Depends on:** 01-visual-mvp · **Date:** 2026-06-14
> **Objective:** Implementar la landing page (Home) basada en `references/templates/home-about/home.jsx`, convirtiendo `app/page.tsx` en la nueva ruta raíz y moviendo la Biblioteca a `app/biblioteca/page.tsx`.

---

## Scope

**In:**

- `app/page.tsx` — nueva Home landing page (Hero, Why, Games Preview, Stats, Actividad en vivo, Pricing, Final CTA)
- `app/biblioteca/page.tsx` — Library movida desde `app/page.tsx` (sin cambios de lógica)
- `_components/Nav.tsx` — actualizar link "BIBLIOTECA" de `/` a `/biblioteca`
- `_components/Home/FloatingSilhouettes.tsx` — siluetas SVG pixel decorativas
- `_components/Home/FeatureIcon.tsx` — íconos SVG pixel (GAMEPAD, FREE, TROPHY, ROCKET)
- `_components/Home/MiniCard.tsx` — tarjeta mini de juego para el rail
- `_components/Home/useReveal.ts` — hook IntersectionObserver para animaciones `.reveal`

**Out of scope:**

- Página About / Contacto (spec separado)
- Backend, API o base de datos real para actividad en vivo (datos hardcodeados)
- Campo `featured` en el tipo `Game` — se muestran los 8 juegos existentes en orden de array
- Cualquier lógica de juego real

---

## Implementation plan

1. Renombrar/mover `app/page.tsx` (Library actual) a `app/biblioteca/page.tsx`.
   Verificar que la página carga en `/biblioteca` sin errores.

2. Actualizar `_components/Nav.tsx`: cambiar el link "BIBLIOTECA" de `href="/"` a
   `href="/biblioteca"`. Verificar que el nav activo funciona en ambas rutas.

3. Crear `_components/Home/useReveal.ts` — hook con IntersectionObserver que añade
   clase `.in` a elementos `.reveal` al entrar al viewport (threshold 0.12).

4. Crear `_components/Home/FloatingSilhouettes.tsx` — 8 SVGs pixel decorativos
   (s1–s8) portados desde el template. `aria-hidden="true"`.

5. Crear `_components/Home/FeatureIcon.tsx` — íconos pixel SVG para GAMEPAD, FREE,
   TROPHY, ROCKET portados desde `FeatureIcon` del template.

6. Crear `_components/Home/MiniCard.tsx` — tarjeta mini con cover CSS y metadata,
   `onClick` navega a `/games/[id]` via `useRouter`.

7. Crear `app/page.tsx` (Home) con Client Component que compone todas las secciones:
   Hero → Why → Games Preview (8 juegos) → Stats → Actividad en vivo → Pricing → Final CTA.
   Todos los `navigate({ name: X })` del template se reemplazan por `router.push('/X')`.

---

## Acceptance criteria

- [ ] `/` carga la Home landing page (no la Biblioteca).
- [ ] `/biblioteca` carga la Library con todos sus juegos y filtros funcionando.
- [ ] Nav muestra "BIBLIOTECA" con href correcto (`/biblioteca`) y resalta la ruta activa.
- [ ] Hero muestra eyebrow parpadeante, título en 3 líneas, subtítulo, 2 CTAs y siluetas flotantes.
- [ ] "EXPLORAR JUEGOS" navega a `/biblioteca`; "CREAR CUENTA" navega a `/auth`.
- [ ] Sección Why muestra 4 feature cards con íconos SVG pixel y animación de entrada `.reveal`.
- [ ] Rail de juegos muestra los 8 juegos; click en cualquier MiniCard navega a `/games/[id]`.
- [ ] "VER TODOS LOS JUEGOS →" navega a `/biblioteca`.
- [ ] Sección Stats muestra 3 bloques con animación `.reveal`.
- [ ] Ticker de "Últimas Puntuaciones" muestra 7 entradas hardcodeadas con animación de entrada.
- [ ] "Top Jugadores · Hoy" muestra 5 entradas; "VER SALÓN →" navega a `/salon`.
- [ ] Sección Pricing muestra la price card y las 3 FAQs; "EMPEZAR GRATIS →" navega a `/auth`.
- [ ] Final CTA muestra "¿LISTO PARA JUGAR?" con botón que navega a `/biblioteca`.
- [ ] No hay errores de consola en la Home.
- [ ] Todas las animaciones `.reveal` se activan al hacer scroll en desktop.

---

## Decisions

- **Sí:** Mover Library a `app/biblioteca/page.tsx` y convertir `app/page.tsx` en Home.
  La landing page debe ser la raíz del sitio; la Biblioteca es una sección interna.
  **Descartado:** Poner Home en `/home` — semánticamente incorrecto para una raíz.

- **Sí:** Extraer FloatingSilhouettes, FeatureIcon y MiniCard a `_components/Home/`.
  Mantiene `app/page.tsx` legible y alineado con la convención del proyecto.
  **Descartado:** Definir todo inline en page.tsx — el componente quedaría demasiado largo.

- **Sí:** Datos de actividad en vivo hardcodeados inline en `app/page.tsx`.
  El spec 01 ya estableció que no hay backend; los datos son de demostración.
  **Descartado:** Conectar al UserContext/localStorage — añade complejidad sin valor en este MVP.

- **Sí:** Mostrar los 8 juegos del array en el rail de Games Preview.
  **Descartado:** `GAMES.slice(0, 6)` como en el template — el proyecto tiene 8 juegos, todos deben aparecer.
