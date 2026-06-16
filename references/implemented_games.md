# Implemented Games — Arcade Vault

| ID | Título | Categoría | Score Tabla | Play Page |
|----|--------|-----------|-------------|-----------|
| `bloque-buster` | ARKANOID | ARCADE | `scores_bloque_buster` | `app/games/bloque-buster/play/page.tsx` |
| `caida` | TETRIS | PUZZLE | `scores_caida` | `app/games/caida/play/page.tsx` |
| `serpentina` | SNAKE | ARCADE | `scores_serpentina` | `app/games/serpentina/play/page.tsx` |
| `rocas` | NAVES | SHOOTER | `scores_rocas` | `app/games/rocas/play/page.tsx` |

## Detalles

### ARKANOID (`bloque-buster`)
- **Descripción:** Rebota la pelota y destruye muros de neón.
- **Best score:** 28,450
- **Supabase rows:** 1

### TETRIS (`caida`)
- **Descripción:** Encaja las piezas antes de que el techo te aplaste.
- **Best score:** 184,220
- **Supabase rows:** 1

### SNAKE (`serpentina`)
- **Descripción:** Crece sin morder tu propia cola.
- **Best score:** 7,820
- **Supabase rows:** 0

### NAVES (`rocas`)
- **Descripción:** Pulveriza asteroides en gravedad cero.
- **Best score:** 41,200
- **Supabase rows:** 0

---

> Fuente: `_lib/data.ts` (GAMES[]) + tablas Supabase + `app/games/*/play/page.tsx`
> Fecha: 2026-06-16
