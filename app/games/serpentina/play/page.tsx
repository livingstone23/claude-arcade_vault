"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { GAMES } from "@/_lib/data";
import { useUser } from "@/_contexts/UserContext";

interface SerpentinaAPI {
  pause(): void;
  resume(): void;
  end(): void;
  destroy(): void;
}

interface SerpentinaCallbacks {
  onScore(score: number): void;
  onLevel(level: number): void;
  onGameOver(finalScore: number): void;
}

declare global {
  interface Window {
    SERPENTINA: {
      start(canvas: HTMLCanvasElement, callbacks: SerpentinaCallbacks): SerpentinaAPI;
    };
  }
}

const game = GAMES.find((g) => g.id === "serpentina")!;

export default function SerpentinaPlayPage() {
  const router = useRouter();
  const { user, saveScore } = useUser();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const apiRef = useRef<SerpentinaAPI | null>(null);

  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState(user?.name ?? "INVITADO");

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    let timeoutId: ReturnType<typeof setTimeout>;

    const callbacks: SerpentinaCallbacks = {
      onScore: (s) => setScore(s),
      onLevel: (lv) => setLevel(lv),
      onGameOver: (fs) => { setFinalScore(fs); setOver(true); },
    };

    function mount() {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;

      intervalId = setInterval(() => {
        if (window.SERPENTINA) {
          clearInterval(intervalId);
          clearTimeout(timeoutId);
          apiRef.current = window.SERPENTINA.start(canvas, callbacks);
        }
      }, 50);

      timeoutId = setTimeout(() => {
        clearInterval(intervalId);
        console.error("Serpentina: window.SERPENTINA not available after 5s");
      }, 5000);
    }

    mount();

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
      apiRef.current?.destroy();
    };
  }, []);

  function handlePause() {
    const api = apiRef.current;
    if (!api) return;
    if (paused) {
      api.resume();
      setPaused(false);
    } else {
      api.pause();
      setPaused(true);
    }
  }

  function handleEnd() {
    apiRef.current?.end();
  }

  function handleSave() {
    saveScore({ game: "serpentina", score: finalScore, name });
    setSaved(true);
  }

  function handleRestart() {
    const canvas = canvasRef.current;
    if (!canvas || !window.SERPENTINA) return;

    apiRef.current?.destroy();
    setScore(0);
    setLevel(1);
    setPaused(false);
    setOver(false);
    setFinalScore(0);
    setSaved(false);
    setName(user?.name ?? "INVITADO");

    const callbacks: SerpentinaCallbacks = {
      onScore: (s) => setScore(s),
      onLevel: (lv) => setLevel(lv),
      onGameOver: (fs) => { setFinalScore(fs); setOver(true); },
    };
    apiRef.current = window.SERPENTINA.start(canvas, callbacks);
  }

  return (
    <>
      <Script src="/games/serpentina.js" strategy="afterInteractive" />

      <div className="av-player fade-in">
        <div className="player-hud">
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <div className="hud-stat">
              <div className="l">Jugador</div>
              <div className="v" style={{ color: "var(--ink)" }}>{name}</div>
            </div>
            <div className="hud-stat">
              <div className="l">Puntuación</div>
              <div className="v">{score.toLocaleString("es-ES")}</div>
            </div>
            <div className="hud-stat level">
              <div className="l">Nivel</div>
              <div className="v">{String(level).padStart(2, "0")}</div>
            </div>
          </div>
          <div className="hud-actions">
            <button className="btn yellow" onClick={handlePause}>
              {paused ? "REANUDAR" : "PAUSA"}
            </button>
            <button className="btn magenta" onClick={handleEnd}>FIN</button>
            <button className="btn ghost" onClick={() => router.push("/games/serpentina")}>SALIR</button>
          </div>
        </div>

        <div className="crt">
          <div className="crt-screen">
            <canvas
              ref={canvasRef}
              width={600}
              height={600}
              style={{ display: "block", width: "100%", height: "100%" }}
            />
            {paused && (
              <div className="crt-content" style={{ background: "rgba(0,0,0,0.6)", zIndex: 5 }}>
                <div>
                  <div className="pixel neon-yellow" style={{ fontSize: 22 }}>EN PAUSA</div>
                  <div className="mono" style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 10, letterSpacing: "0.16em" }}>
                    PULSA REANUDAR PARA CONTINUAR
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="crt-bottom">
            <span className="led">SEÑAL OK</span>
            <span>{game.title} · CRT-83 · 60 HZ</span>
            <span>CARGA · 1MB</span>
          </div>
        </div>

        {over && (
          <div className="modal-bd">
            <div className="modal">
              <h2>FIN DEL JUEGO</h2>
              <div className="final-label">PUNTUACIÓN FINAL</div>
              <div className="final">{finalScore.toLocaleString("es-ES")}</div>
              {!saved ? (
                <div className="input-row">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value.toUpperCase().slice(0, 10))}
                    placeholder="TUS INICIALES"
                  />
                  <button className="btn yellow" onClick={handleSave}>
                    GUARDAR PUNTUACIÓN
                  </button>
                </div>
              ) : (
                <div className="toast-saved">▸ PUNTUACIÓN GUARDADA_</div>
              )}
              <div className="actions">
                <button className="btn" onClick={handleRestart}>JUGAR DE NUEVO</button>
                <button className="btn magenta" onClick={() => router.push("/games/serpentina")}>VOLVER AL VAULT</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
