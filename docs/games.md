# Arcade Vault — Juegos Implementados

| # | ID | Título | Categoría | Score Tabla | Play Page |
|---|-----|--------|-----------|-------------|-----------|
| 1 | `bloque-buster` | ARKANOID | ARCADE | `scores_bloque_buster` | ✅ |
| 2 | `caida` | TETRIS | PUZZLE | `scores_caida` | ✅ |
| 3 | `serpentina` | SNAKE | ARCADE | `scores_serpentina` | ✅ |
| 4 | `rocas` | NAVES | SHOOTER | `scores_rocas` | ✅ |

## Registrados pero sin play page dedicada

| # | ID | Título | Categoría | Score Tabla |
|---|-----|--------|-----------|-------------|
| 5 | `gloton` | GLOTÓN | ARCADE | `scores_gloton` |
| 6 | `invasores` | INVASORES | SHOOTER | `scores_invasores` |
| 7 | `ranaria` | RANARIA | ARCADE | `scores_ranaria` |
| 8 | `duelo-pixel` | DUELO PIXEL | VERSUS | `scores_duelo_pixel` |

## Notas

- Play pages en `app/games/<id>/play/page.tsx`
- Todos tienen tabla Supabase con RLS activado
- Los no implementados caen al fallback genérico `app/games/[id]/play/page.tsx`
