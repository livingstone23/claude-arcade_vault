# SPEC — Diseño de DUELO PIXEL (duelo-pixel)

> **Status:** Propuesto · **Tema:** Pong / paddle, estilo VERSUS, paleta cyan · **Date:** 2026-06-17
> **Objective:** Definir las mecánicas, controles y progresión de DUELO PIXEL antes de
> escribir el spec de integración técnica (duelo-pixel/02-integration.md).

---

## Concepto

DUELO PIXEL es el duelo más puro de la consola: dos paletas verticales se enfrentan a
ambos lados del campo por rebotar una pelota luminosa que acelera con cada intercambio.
Conecta directamente con el tema VERSUS al ofrecer dos jugadores compitiendo en la misma
pantalla con teclados separados (o un jugador contra una CPU reactiva si juega solo).
Lo que lo hace divertido es el ritmo creciente: cada rally sube la velocidad de la pelota,
convirtiendo cada punto en una prueba de reflejos cada vez más exigente, hasta que alguien
llega a 11 puntos y se proclama ganador.

## Mecánicas

- **Loop de juego:** cada frame (`requestAnimationFrame`), la pelota avanza según su
  vector de velocidad; se comprueba colisión con los bordes superior/inferior (rebote
  vertical invertido) y con las dos paletas (rebote horizontal invertido + leve cambio de
  ángulo según el punto de impacto en la paleta). Cada paleta se mueve según el input
  activo (teclado humano o IA de la CPU en modo 1 jugador). Si la pelota sale por el borde
  izquierdo o derecho, se anota un punto para el jugador contrario, se resetea la pelota
  al centro con velocidad base y dirección aleatoria, y se dispara `onScore`.
- **Input del jugador:** Jugador 1 controla la paleta izquierda, Jugador 2 (o la CPU)
  controla la paleta derecha. En modo 1 jugador, la CPU mueve su paleta persiguiendo la
  posición `y` de la pelota con una velocidad máxima limitada (para que sea vencible) y un
  margen de error que decrece con el nivel.
- **Condición de derrota:** N/A como "derrota" individual — el modo es competitivo: la
  partida termina cuando un jugador (o la CPU) llega a **11 puntos**, ese jugador gana.
  Para efectos del HUD/Supabase, el score que se guarda y compite en el leaderboard es el
  marcador del Jugador 1 (humano) al finalizar la partida.
- **Condición de victoria:** el primer jugador (P1, P2 o CPU) en alcanzar 11 puntos con al
  menos 2 de diferencia gana la partida; se dispara `onGameOver` con el marcador final de
  P1.

## Controles

| Tecla / input | Acción |
|----------------|--------|
| `W` / `S` | Mueve la paleta izquierda (Jugador 1) arriba / abajo |
| `ArrowUp` / `ArrowDown` | Mueve la paleta derecha (Jugador 2) arriba / abajo — solo en modo 2 jugadores |
| `Space` | Pausa / reanuda la partida (también disponible vía HUD React) |
| `1` (antes de empezar) | Selecciona modo 1 JUGADOR (vs CPU) |
| `2` (antes de empezar) | Selecciona modo 2 JUGADORES |

## Progresión de dificultad

- La pelota arranca cada rally a velocidad base de **5 px/frame** en `x`.
- Cada vez que la pelota es devuelta por una paleta (rebote exitoso), su velocidad escalar
  aumenta un **8%**, hasta un máximo de **16 px/frame** (evita que se vuelva injugable).
- En modo 1 jugador, la precisión de la CPU mejora por nivel de marcador: con 0–3 puntos en
  juego, el margen de error de seguimiento es de **±40px**; con 4–7 puntos, **±25px**; con
  8+ puntos, **±12px** — la CPU se vuelve progresivamente más difícil de vencer en el tramo
  final de la partida.
- El ángulo de rebote varía según dónde golpea la pelota en la paleta (centro = rebote
  recto, extremos = hasta ±35° de desviación vertical), añadiendo variabilidad táctica sin
  depender de RNG puro.

## Arte (canvas puro, sin assets externos)

- **Paleta:**
  - Fondo: `#05080d` (casi negro azulado)
  - Línea central punteada: `#0ff7ff` (cyan) al 30% de opacidad
  - Paletas: `#0ff7ff` (cyan) con `boxShadow`/glow simulado vía `shadowBlur` en canvas
  - Pelota: `#ffffff` con halo cyan (`shadowColor: #0ff7ff`)
  - Marcador en canvas (decorativo, detrás del HUD React): `#0ff7ff` semitransparente
- **Formas:**
  - Paletas: `fillRect` de 12×90px en cada extremo del campo, con `shadowBlur` para el
    efecto neón.
  - Pelota: `arc` de radio 8px, relleno blanco con halo cyan.
  - Línea central: serie de `fillRect` pequeños (segmentos de 4×16px con gaps de 12px)
    simulando la línea punteada clásica de Pong.
  - Campo: `fillRect` de fondo ocupando todo el canvas (800×500px lógicos).

## Categoría y color sugeridos

- **Categoría:** VERSUS — el catálogo tiene actualmente solo 1 juego en VERSUS
  (`duelo-pixel` mismo, ya registrado) frente a 4 ARCADE, 2 SHOOTER, 1 PUZZLE; mantener
  esta categoría es coherente con el registro ya existente en `_lib/data.ts` y refuerza la
  categoría menos representada del catálogo.
- **Color:** cyan — coincide con el valor ya registrado en `_lib/data.ts` (`color: "cyan"`)
  para `duelo-pixel`; cyan tiene actualmente 2 juegos (bloque-buster, duelo-pixel) frente a
  3 green, 2 yellow, 1 magenta, por lo que mantenerlo no desbalancea el catálogo.

## Acceptance criteria (diseño)

- [x] Las reglas del loop de juego están descritas sin ambigüedad.
- [x] Cada control mapea a una acción única.
- [x] La condición de derrota (y victoria, si aplica) es verificable en código.
- [x] La progresión de dificultad tiene valores numéricos concretos, no solo
      descripción cualitativa.
- [x] El arte no depende de ningún asset externo (imagen, spritesheet, audio).
