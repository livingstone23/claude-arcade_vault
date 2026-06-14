"use client";

import { useRouter } from "next/navigation";
import { GAMES } from "@/_lib/data";
import { useReveal } from "@/_components/Home/useReveal";
import FloatingSilhouettes from "@/_components/Home/FloatingSilhouettes";
import FeatureIcon from "@/_components/Home/FeatureIcon";
import MiniCard from "@/_components/Home/MiniCard";

const FEATURES = [
  { i: "GAMEPAD" as const, t: "JUEGOS CLÁSICOS",    d: "Arkanoid, Tetris, Snake y muchos más. Los mejores arcades de todos los tiempos en un solo lugar.",    c: "cyan"    },
  { i: "FREE"    as const, t: "100% GRATIS",          d: "Sin suscripciones, sin pagos ocultos. Todos los juegos disponibles de forma gratuita.",                  c: "yellow"  },
  { i: "TROPHY"  as const, t: "LADDER BOARDS",        d: "Compite con jugadores de todo el mundo. Escala el ranking y demuestra quién es el mejor.",               c: "magenta" },
  { i: "ROCKET"  as const, t: "SIEMPRE CRECIENDO",    d: "Agregamos nuevos juegos constantemente. Vuelve seguido, siempre habrá algo nuevo que jugar.",            c: "green"   },
];

const STATS = [
  { n: "12+",   u: "JUEGOS",      s: "Y CONTANDO"              },
  { n: "MILES", u: "DE PARTIDAS", s: "JUGADAS CADA DÍA"        },
  { n: "GLOBAL",u: "RANKING",     s: "COMPITE CON EL MUNDO"    },
];

const TICKER = [
  { p: "NEONFOX",  g: "Caída",        s: 184220, t: "hace 2 min",  c: "magenta" },
  { p: "PX_KAI",   g: "Glotón",       s: 96400,  t: "hace 5 min",  c: "yellow"  },
  { p: "Z3R0COOL", g: "Invasores",    s: 54190,  t: "hace 8 min",  c: "green"   },
  { p: "VAULT_07", g: "Rocas",        s: 41200,  t: "hace 12 min", c: "cyan"    },
  { p: "GLITCHA",  g: "Bloque Buster",s: 28450,  t: "hace 18 min", c: "cyan"    },
  { p: "ARKADYA",  g: "Serpentina",   s: 7820,   t: "hace 24 min", c: "green"   },
  { p: "CYBER_LU", g: "Ranaria",      s: 18900,  t: "hace 31 min", c: "yellow"  },
];

const TOP = [
  { r: 1, p: "NEONFOX",  s: 312840 },
  { r: 2, p: "PX_KAI",   s: 248110 },
  { r: 3, p: "M00NRYU",  s: 196720 },
  { r: 4, p: "VAULT_07", s: 154300 },
  { r: 5, p: "GLITCHA",  s: 138900 },
];

const FAQS = [
  { q: "¿REALMENTE ES GRATIS?",          a: "Sí. Arcade Vault es un proyecto sin fines de lucro hecho por amor a los clásicos. No hay versión 'premium' escondida."                                    },
  { q: "¿NECESITO CREAR CUENTA?",        a: "No. Puedes jugar como invitado. Si quieres guardar tu puntuación y aparecer en el ranking, regístrate en 10 segundos."                                   },
  { q: "¿CÓMO SOBREVIVEN SIN COBRAR?",   a: "Es un proyecto comunitario. Si te gusta, compártelo. Esa es toda la moneda que aceptamos."                                                               },
];

export default function HomePage() {
  useReveal();
  const router = useRouter();

  return (
    <div className="home fade-in">

      {/* HERO */}
      <section className="home-hero">
        <FloatingSilhouettes />
        <div className="home-hero-inner">
          <div className="hero-eyebrow pixel neon-yellow">▸ INSERTA UNA MONEDA<span className="blink">_</span></div>
          <h1 className="home-title">
            <span className="line-1">EL ARCADE</span>
            <span className="line-2">CLÁSICO ESTÁ</span>
            <span className="line-3">DE VUELTA</span>
          </h1>
          <p className="home-sub">
            Juega los mejores clásicos directamente en tu navegador.<br />
            Sin descargas. Sin costo. Solo diversión.
          </p>
          <div className="home-ctas">
            <button className="btn xl pulse" onClick={() => router.push("/biblioteca")}>▶  EXPLORAR JUEGOS</button>
            <button className="btn xl magenta" onClick={() => router.push("/auth")}>✦  CREAR CUENTA</button>
          </div>
          <div className="hero-scroll" aria-hidden="true">
            <span>DESLIZA</span>
            <span className="arrow">▼</span>
          </div>
        </div>
      </section>

      {/* WHY */}
      <section className="home-section reveal">
        <div className="section-head">
          <div className="kicker pixel neon-magenta">// 01</div>
          <h2 className="section-title">¿POR QUÉ ARCADE VAULT?</h2>
          <div className="section-rule"></div>
        </div>
        <div className="feature-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className={"feature-card " + f.c} style={{ transitionDelay: (i * 80) + "ms" }}>
              <FeatureIcon kind={f.i} />
              <div className="ft-title pixel">{f.t}</div>
              <div className="ft-desc">{f.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* GAMES PREVIEW */}
      <section className="home-section reveal">
        <div className="section-head">
          <div className="kicker pixel neon-cyan">// 02</div>
          <h2 className="section-title">JUEGOS DISPONIBLES AHORA</h2>
          <div className="section-rule"></div>
        </div>
        <div className="mini-rail">
          {GAMES.map((g) => (
            <MiniCard key={g.id} game={g} />
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <button className="btn lg" onClick={() => router.push("/biblioteca")}>VER TODOS LOS JUEGOS →</button>
        </div>
      </section>

      {/* STATS */}
      <section className="home-stats reveal">
        <div className="stats-inner">
          {STATS.map((st, i) => (
            <div key={i} className="stat-block" style={{ transitionDelay: (i * 90) + "ms" }}>
              <div className="stat-n neon-yellow">{st.n}</div>
              <div className="stat-u pixel">{st.u}</div>
              <div className="stat-s">{st.s}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ACTIVIDAD EN VIVO */}
      <section className="home-section reveal">
        <div className="section-head">
          <div className="kicker pixel neon-yellow">// 03</div>
          <h2 className="section-title">ACTIVIDAD EN VIVO</h2>
          <div className="section-rule"></div>
        </div>
        <div className="activity-grid">
          <div className="activity-card">
            <div className="ac-head">
              <div className="ac-title pixel">▸ ÚLTIMAS PUNTUACIONES</div>
            </div>
            <div className="ticker">
              {TICKER.map((r, i) => (
                <div key={i} className="tick-row" style={{ animationDelay: (i * 60) + "ms" }}>
                  <span className={"tk-p neon-" + r.c}>{r.p}</span>
                  <span className="tk-mid">▸ {r.g}</span>
                  <span className="tk-s">+{r.s.toLocaleString("es-ES")}</span>
                  <span className="tk-t">{r.t}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="activity-card">
            <div className="ac-head">
              <div className="ac-title pixel neon-magenta">▸ TOP JUGADORES · HOY</div>
              <button className="lb-link" onClick={() => router.push("/salon")}>VER SALÓN →</button>
            </div>
            <div className="top-list">
              {TOP.map((r, i) => (
                <div key={i} className={"top-row" + (i === 0 ? " top1" : i === 1 ? " top2" : i === 2 ? " top3" : "")}>
                  <span className="tp-rk">#{String(r.r).padStart(2, "0")}</span>
                  <span className="tp-bar"><span className="tp-fill" style={{ width: (100 - i * 16) + "%" }}></span></span>
                  <span className="tp-p">{r.p}</span>
                  <span className="tp-s">{r.s.toLocaleString("es-ES")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="home-section reveal">
        <div className="section-head">
          <div className="kicker pixel neon-green">// 04</div>
          <h2 className="section-title">PRECIOS</h2>
          <div className="section-rule"></div>
        </div>
        <div className="pricing-grid">
          <div className="price-card">
            <div className="pc-label pixel">PLAN ÚNICO</div>
            <div className="pc-name pixel">JUGADOR VAULT</div>
            <div className="pc-amount">
              <span className="pc-amount-n">$0</span>
              <span className="pc-amount-u">/ SIEMPRE</span>
            </div>
            <div className="pc-tag">SIN TRUCOS · SIN LETRA PEQUEÑA</div>
            <ul className="pc-list">
              <li>✔ Acceso a todos los juegos</li>
              <li>✔ Ranking global y salón de la fama</li>
              <li>✔ Sin anuncios entre partidas</li>
              <li>✔ Guarda tus puntuaciones</li>
              <li>✔ Nuevos juegos cada mes</li>
              <li>✔ Funciona en cualquier navegador</li>
            </ul>
            <button className="btn xl pulse" style={{ width: "100%" }} onClick={() => router.push("/auth")}>EMPEZAR GRATIS →</button>
            <div className="pc-foot">No pedimos tarjeta. Nunca lo haremos.</div>
            <div className="pc-stamp pixel">FREE<br />PLAY</div>
          </div>

          <div className="pricing-faq">
            {FAQS.map((f, i) => (
              <div key={i} className="faq-item">
                <div className="faq-q pixel">{f.q}</div>
                <div className="faq-a">{f.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="home-final reveal">
        <h2 className="final-title pixel">¿LISTO PARA JUGAR?</h2>
        <button className="btn xl pulse final-cta" onClick={() => router.push("/biblioteca")}>INSERTAR MONEDA →</button>
        <div className="final-tag">Gratis. Sin registro obligatorio. Empieza en segundos.</div>
      </section>

      {/* FOOTER */}
      <footer style={{ textAlign: "center", padding: "32px 16px 40px", borderTop: "1px solid var(--line)", marginTop: 40 }}>
        <p style={{ fontFamily: "var(--pixel)", fontSize: 9, color: "var(--ink-faint)", letterSpacing: "0.18em", margin: 0 }}>
          ARCADE VAULT © {new Date().getFullYear()} &nbsp;·&nbsp;{" "}
          <a href="/about" style={{ color: "var(--cyan)", textDecoration: "none" }}>
            ABOUT &amp; CONTACTO
          </a>
        </p>
      </footer>

    </div>
  );
}
