"use client";

import { useState } from "react";
import { useReveal } from "@/_components/Home/useReveal";
import { HighlightIcon } from "@/_components/About/HighlightIcon";

const HIGHLIGHTS = [
  { kind: "HEART" as const,   text: "HECHO CON ❤️ PARA JUGADORES",                      color: "magenta" },
  { kind: "BROWSER" as const, text: "JUEGOS EN HTML — CORREN EN CUALQUIER NAVEGADOR",   color: "cyan" },
  { kind: "PLANT" as const,   text: "PROYECTO EN CONSTANTE CRECIMIENTO",                color: "green" },
];

interface FormState {
  name: string;
  email: string;
  msg: string;
}

export default function AboutPage() {
  useReveal();

  const [form, setForm] = useState<FormState>({ name: "", email: "", msg: "" });
  const [sent, setSent] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [shake, setShake] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.msg.trim()) {
      triggerShake();
      return;
    }

    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Error al enviar el mensaje. Intenta de nuevo.");
        return;
      }

      setSent(form.name.trim());
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setSent(null);
    setForm({ name: "", email: "", msg: "" });
    setError(null);
  };

  return (
    <div className="about fade-in">
      {/* HERO */}
      <section className="about-hero">
        <div className="kicker pixel neon-yellow">▸ ACERCA DE</div>
        <h1 className="about-title">ACERCA DE ARCADE VAULT</h1>
        <p className="about-mission">
          ARCADE VAULT nació del amor por los videojuegos clásicos. Nuestra misión es preservar y celebrar
          los arcades que definieron una generación, haciéndolos accesibles para todos, en cualquier lugar
          y sin costo.
        </p>
        <div className="highlight-row">
          {HIGHLIGHTS.map((h, i) => (
            <div key={i} className={`highlight ${h.color}`} style={{ transitionDelay: `${i * 80}ms` }}>
              <HighlightIcon kind={h.kind} />
              <div className="hl-text pixel">{h.text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* DIVIDER */}
      <div className="about-divider reveal" aria-hidden="true">
        <div className="div-bar" />
        <div className="div-pixels">
          {Array.from({ length: 24 }).map((_, i) => (
            <span key={i} style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
        <div className="div-bar" />
      </div>

      {/* CONTACT */}
      <section className="about-contact reveal">
        <div className="contact-grid">
          <div className="contact-intro">
            <div className="kicker pixel neon-cyan">▸ CONTACTO</div>
            <h2 className="contact-title">CONTÁCTANOS</h2>
            <p className="contact-sub">
              ¿Tienes alguna sugerencia, quieres proponer un juego, o simplemente quieres saludar?
              Escríbenos.
            </p>
            <div className="contact-tips">
              <div className="tip"><span className="tip-led" />RESPUESTA EN 24-48H</div>
              <div className="tip"><span className="tip-led y" />SUGERENCIAS BIENVENIDAS</div>
              <div className="tip"><span className="tip-led m" />SIN SPAM, JAMÁS</div>
            </div>
          </div>

          <form className={`contact-form${shake ? " shake" : ""}`} onSubmit={onSubmit}>
            {!sent ? (
              <>
                <div className="field">
                  <label>NOMBRE</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="px_kai"
                    disabled={sending}
                  />
                </div>
                <div className="field">
                  <label>CORREO ELECTRÓNICO</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="jugador@vault.gg"
                    disabled={sending}
                  />
                </div>
                <div className="field">
                  <label>MENSAJE</label>
                  <textarea
                    rows={5}
                    value={form.msg}
                    onChange={(e) => setForm({ ...form, msg: e.target.value })}
                    placeholder="Cuéntanos qué tienes en mente…"
                    disabled={sending}
                  />
                </div>
                {error && (
                  <p style={{ color: "var(--magenta)", fontSize: 11, letterSpacing: "0.1em", marginBottom: 12 }}>
                    ⚠ {error}
                  </p>
                )}
                <button className="btn xl press" type="submit" style={{ width: "100%" }} disabled={sending}>
                  {sending ? "▶  ENVIANDO…" : "▶  ENVIAR MENSAJE"}
                </button>
              </>
            ) : (
              <div className="terminal-success">
                <div className="term-bar">
                  <span className="dot r" /><span className="dot y" /><span className="dot g" />
                  <span className="term-title">VAULT-OS // TERMINAL</span>
                </div>
                <div className="term-body">
                  <div className="line"><span className="prompt">vault@arcade:~$</span> ./send_message --to=team</div>
                  <div className="line dim">[OK] Conectando con servidor…</div>
                  <div className="line dim">[OK] Validando contenido…</div>
                  <div className="line dim">[OK] Transmitiendo paquete…</div>
                  <div className="line success">
                    &gt; MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, {sent.toUpperCase()}.<span className="caret">_</span>
                  </div>
                  <div style={{ marginTop: 18 }}>
                    <button className="btn ghost" type="button" onClick={reset}>
                      ENVIAR OTRO MENSAJE
                    </button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </section>
    </div>
  );
}
