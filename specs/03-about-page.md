# SPEC 03 — Arcade Vault About Page + Contact Email

> **Status:** Implementado · **Depends on:** 02-home-page · **Date:** 2026-06-14
> **Objective:** Implementar la página About con sección de contacto que envía emails reales vía Resend,
> incluyendo confirmación al remitente.

---

## Scope

**In:**

- `app/about/page.tsx` — página About (Client Component): sección hero + highlights + divider + formulario de contacto
- `_components/About/HighlightIcon.tsx` — íconos SVG pixel (HEART, BROWSER, PLANT) portados del template
- `app/api/contact/route.ts` — Route Handler POST que llama a Resend: envía email al equipo + confirmación al usuario
- `_components/Nav.tsx` — agregar link "ABOUT" después de "BIBLIOTECA"
- `app/page.tsx` — agregar footer con link a `/about`
- `.env.local` — agregar `RESEND_API_KEY`

**Out of scope:**

- Dominio propio verificado en Resend (se usa sandbox `onboarding@resend.dev`)
- Página de política de privacidad o términos
- Rate limiting en el endpoint de contacto
- Internacionalización / cambio de idioma
- Autenticación para enviar el formulario (cualquier visitante puede enviarlo)

---

## Data model

**ContactPayload** — objeto validado en el Route Handler antes de llamar a Resend:

```ts
interface ContactPayload {
  name: string;    // min 1 char, trimmed
  email: string;   // formato email válido
  msg: string;     // min 1 char, trimmed
}
```

**Variables de entorno:**

| Variable         | Scope  | Valor en dev                 |
|------------------|--------|------------------------------|
| `RESEND_API_KEY` | Server | key real de la cuenta Resend |

No se persiste ningún dato en base de datos. Los mensajes viven solo en el inbox del destinatario.

---

## Implementation plan

1. Instalar dependencia: `npm install resend`.

2. Agregar `RESEND_API_KEY` a `.env.local`.

3. Crear `app/api/contact/route.ts` — Route Handler POST:
   - Parsear y validar `ContactPayload` del body (name, email, msg no vacíos, email con formato válido).
   - Si inválido: responder `400` con mensaje de error.
   - Llamar a Resend para enviar email al equipo (`to: livingstone23@gmail.com`,
     `from: onboarding@resend.dev`) con nombre, email y mensaje del usuario.
   - Llamar a Resend para enviar confirmación al usuario (`to: form.email`,
     `from: onboarding@resend.dev`) con mensaje de que su consulta fue recibida.
   - Si Resend falla: responder `500`.
   - Si todo ok: responder `200`.

4. Crear `_components/About/HighlightIcon.tsx` — íconos SVG pixel portados del template
   (HEART, BROWSER, PLANT).

5. Crear `app/about/page.tsx` (Client Component):
   - Reusar el hook `useReveal` de `_components/Home/useReveal.ts` para animaciones `.reveal`.
   - Sección hero: kicker, título, misión, highlight row con `HighlightIcon`.
   - Divider animado con píxeles.
   - Sección contacto: intro con tips + formulario (name, email, msg).
   - `onSubmit` llama a `POST /api/contact` con fetch.
   - Estado `sending` mientras espera respuesta (deshabilitar botón).
   - Estado `sent` (nombre del usuario): mostrar terminal success del template.
   - Estado `error`: mostrar mensaje de error inline sin perder los datos del formulario.
   - Animación shake en el form si campos vacíos al intentar enviar.

6. Actualizar `_components/Nav.tsx`: agregar link "ABOUT" con `href="/about"` después de "BIBLIOTECA".

7. Actualizar `app/page.tsx`: agregar footer al final con link a `/about`.

---

## Acceptance criteria

- [ ] `GET /about` carga la página sin errores de consola.
- [ ] Nav muestra link "ABOUT" después de "BIBLIOTECA"; se resalta cuando la ruta activa es `/about`.
- [ ] Home tiene footer con link funcional a `/about`.
- [ ] Sección hero muestra kicker, título, párrafo de misión y 3 highlight cards con íconos SVG pixel.
- [ ] Animaciones `.reveal` se activan al hacer scroll (divider y sección contacto).
- [ ] El formulario muestra shake animation si se intenta enviar con campos vacíos.
- [ ] El botón "ENVIAR MENSAJE" se deshabilita mientras el request está en curso.
- [ ] Al enviar formulario válido, se muestra la pantalla terminal-success con el nombre del usuario.
- [ ] El equipo recibe un email en `livingstone23@gmail.com` con nombre, email y mensaje del usuario.
- [ ] El usuario recibe un email de confirmación en su dirección con aviso de que fue recibido.
- [ ] Si Resend falla, el formulario muestra un error inline sin perder los datos escritos.
- [ ] "ENVIAR OTRO MENSAJE" resetea el formulario y vuelve al estado inicial.
- [ ] `POST /api/contact` responde `400` si algún campo es inválido o vacío.
- [ ] `RESEND_API_KEY` no está hardcodeada en ningún archivo del repositorio.

---

## Decisions

- **Sí:** Route Handler (`app/api/contact/route.ts`) en lugar de Server Action.
  El formulario es un Client Component que necesita manejar estados de loading/error;
  un fetch a un endpoint POST es más limpio que un Server Action en este contexto.
  **Descartado:** Server Action con `'use server'` — complica el manejo de estados intermedios en el cliente.

- **Sí:** Sandbox Resend (`onboarding@resend.dev`) como remitente.
  No hay dominio propio verificado aún; el sandbox permite enviar sin configuración adicional.
  **Descartado:** Dominio propio — requiere verificación DNS fuera del alcance de este spec.

- **Sí:** Dos emails por envío (equipo + confirmación al usuario).
  Mejora la experiencia del usuario sin complejidad adicional.
  **Descartado:** Solo email al equipo — el usuario queda sin feedback por correo.

- **Sí:** Reusar `_components/Home/useReveal.ts` para las animaciones `.reveal`.
  Ya existe y cumple exactamente la misma función.
  **Descartado:** Duplicar el hook en `_components/About/` — innecesario.

- **Sí:** Error inline sin perder datos del formulario si Resend falla.
  Evita que el usuario tenga que reescribir su mensaje.
  **Descartado:** Resetear el formulario en error — frustrante para el usuario.

---

## Risks

- **Resend sandbox tiene limitaciones.** El sandbox solo puede enviar a emails verificados
  en la cuenta Resend. Si `livingstone23@gmail.com` no está verificado en la cuenta,
  los emails al equipo no llegarán. Verificar en el dashboard de Resend antes de implementar.

- **Confirmación al usuario puede fallar silenciosamente.** Si el email de confirmación falla
  pero el email al equipo llega bien, el usuario ve la pantalla de éxito pero no recibe
  su confirmación. Mitigación: loguear el error en consola del servidor sin bloquear la respuesta `200`.
