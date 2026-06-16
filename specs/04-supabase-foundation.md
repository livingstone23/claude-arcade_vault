# SPEC 04 — Supabase Foundation

> **Status:** Implementado · **Depends on:** 03-about-page · **Date:** 2026-06-15
> **Objective:** Instalar y configurar el cliente Supabase (browser + server) como
> fundación para specs futuros de base de datos, realtime y edge functions.

---

## Scope

**In:**

- Instalar `@supabase/ssr` y `@supabase/supabase-js`
- `.env.local` — agregar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `_lib/supabase/client.ts` — `createBrowserClient` para Client Components
- `_lib/supabase/server.ts` — `createServerClient` para Server Components y Route Handlers
- Smoke test temporal en `app/page.tsx` (Server Component call) que loguea la versión
  o confirma conexión al arrancar; se elimina tras verificar

**Out of scope:**

- Tablas, migraciones o esquema de base de datos
- Autenticación / sesiones (spec futuro)
- Realtime subscriptions (spec futuro)
- Edge Functions (spec futuro)
- Proxy / middleware de sesión (`proxy.ts`)
- Datos mock existentes — no se migran ni reemplazan

---

## Implementation plan

1. Instalar dependencias:
   `npm install @supabase/ssr @supabase/supabase-js`

2. Agregar a `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` — URL del proyecto "Arcade_Vault" en Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon/public key del proyecto

3. Crear `_lib/supabase/client.ts` — exporta `createClient()` usando
   `createBrowserClient` de `@supabase/ssr`. Para uso en Client Components.

4. Crear `_lib/supabase/server.ts` — exporta `createClient()` async usando
   `createServerClient` de `@supabase/ssr` con `cookies()` de `next/headers`.
   Para uso en Server Components y Route Handlers.

5. Agregar smoke test en `app/page.tsx`: llamar a `createClient()` del server,
   ejecutar `supabase.from('_dummy_').select()` — esperamos error de tabla inexistente
   (no error de conexión/auth), lo que confirma que la conexión a Supabase es válida.
   Loguear resultado en consola del servidor.

6. Verificar en terminal que el log aparece al cargar `/`. Eliminar el smoke test del código.

---

## Acceptance criteria

- [ ] `@supabase/ssr` y `@supabase/supabase-js` aparecen en `package.json`.
- [ ] `.env.local` contiene `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
      sin estar hardcodeadas en ningún archivo del repositorio.
- [ ] `_lib/supabase/client.ts` exporta `createClient()` usando `createBrowserClient`.
- [ ] `_lib/supabase/server.ts` exporta `createClient()` async usando `createServerClient`.
- [ ] El smoke test produce en consola del servidor un error de tabla (no de conexión),
      confirmando que Supabase responde correctamente.
- [ ] El smoke test es eliminado del código antes de cerrar el spec como Implementado.
- [ ] `npm run build` completa sin errores de TypeScript.

---

## Decisions

- **Sí:** `@supabase/ssr` en lugar de solo `@supabase/supabase-js`.
  Provee `createBrowserClient` y `createServerClient` listos para App Router;
  es el prerequisito para auth y realtime en specs futuros.
  **Descartado:** Solo `@supabase/supabase-js` — no tiene soporte nativo para
  Server Components ni cookies, lo que obligaría a rehacer el setup más adelante.

- **Sí:** Dos archivos separados (`client.ts` / `server.ts`) en `_lib/supabase/`.
  Evita importar cookies de Next.js en contextos de browser y viceversa.
  **Descartado:** Un solo archivo con export condicional — más frágil y confuso.

- **Sí:** Smoke test con query a tabla inexistente.
  Un error de tipo "table not found" confirma que la conexión y las credenciales
  son válidas sin necesidad de tener ninguna tabla real creada.
  **Descartado:** Smoke test con `supabase.auth.getSession()` — introduce
  dependencia con auth antes de que ese spec exista.
