"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GAMES } from "@/_lib/data";
import type { ScoreRow } from "@/_lib/data";
import { supabase, scoreTable } from "@/_lib/supabase";
import { useUser } from "@/_contexts/UserContext";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export default function SalonPage() {
  const router = useRouter();
  const { user } = useUser();
  const [tab, setTab] = useState(GAMES[0].id);
  const [rows, setRows] = useState<ScoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [youScore, setYouScore] = useState<number | null>(null);
  const [youDate, setYouDate] = useState<string>("");

  const game = GAMES.find((g) => g.id === tab)!;

  useEffect(() => {
    setLoading(true);
    setRows([]);
    setYouScore(null);

    supabase
      .from(scoreTable(tab))
      .select("player_name, score, created_at")
      .order("score", { ascending: false })
      .limit(12)
      .then(({ data }) => {
        const mapped: ScoreRow[] = (data ?? []).map((r, i) => ({
          rank: i + 1,
          name: r.player_name,
          score: r.score,
          date: formatDate(r.created_at),
        }));
        setRows(mapped);

        if (user) {
          const inTop = mapped.find((r) => r.name === user.name);
          if (inTop) {
            setYouScore(inTop.score);
            setYouDate(inTop.date);
          } else {
            supabase
              .from(scoreTable(tab))
              .select("score, created_at")
              .eq("player_name", user.name)
              .order("score", { ascending: false })
              .limit(1)
              .then(({ data: best }) => {
                if (best && best.length > 0) {
                  setYouScore(best[0].score);
                  setYouDate(formatDate(best[0].created_at));
                }
              });
          }
        }
      })
      .then(() => setLoading(false), () => setLoading(false));
  }, [tab, user]);

  const youInTop = user ? rows.findIndex((r) => r.name === user.name) : -1;
  const youRank = youInTop >= 0 ? youInTop + 1 : rows.length + 1;

  return (
    <div className="av-hall fade-in">
      <div className="hall-head">
        <h1>SALÓN DE LA FAMA</h1>
        <p className="pixel" style={{ fontSize: 10 }}>LOS NOMBRES QUE NUNCA SE BORRAN DE LA PANTALLA</p>
      </div>

      <div className="hall-tabs">
        {GAMES.map((g) => (
          <button
            key={g.id}
            className={"chip" + (tab === g.id ? " active" : "")}
            onClick={() => setTab(g.id)}
          >
            {g.title}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <p className="pixel blink" style={{ fontSize: 11, letterSpacing: "0.2em" }}>CARGANDO…</p>
        </div>
      ) : rows.length === 0 ? (
        <>
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <p className="pixel" style={{ fontSize: 11, letterSpacing: "0.18em", color: "var(--cyan)" }}>
              AÚN NO HAY SCORES — ¡SÉ EL PRIMERO!
            </p>
          </div>
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <button className="btn lg" onClick={() => router.push("/")}>VOLVER A LA BIBLIOTECA</button>
          </div>
        </>
      ) : (
        <>
          <div className="podium">
            <div className="podium-slot silver">
              <div className="rank-num">02</div>
              <div className="name">{rows[1]?.name ?? "—"}</div>
              <div className="score">{rows[1]?.score.toLocaleString("es-ES") ?? "—"}</div>
              <div className="date">{rows[1]?.date ?? ""}</div>
            </div>
            <div className="podium-slot gold">
              <div className="pixel" style={{ fontSize: 9, color: "var(--gold)", letterSpacing: "0.18em" }}>CAMPEÓN</div>
              <div className="rank-num" style={{ fontSize: 36, marginTop: 4 }}>01</div>
              <div className="name">{rows[0]?.name ?? "—"}</div>
              <div className="score" style={{ fontSize: 20 }}>{rows[0]?.score.toLocaleString("es-ES") ?? "—"}</div>
              <div className="date">{rows[0]?.date ?? ""}</div>
            </div>
            <div className="podium-slot bronze">
              <div className="rank-num">03</div>
              <div className="name">{rows[2]?.name ?? "—"}</div>
              <div className="score">{rows[2]?.score.toLocaleString("es-ES") ?? "—"}</div>
              <div className="date">{rows[2]?.date ?? ""}</div>
            </div>
          </div>

          <div className="hall-table">
            <div className="th">
              <div>RANGO</div>
              <div>JUGADOR</div>
              <div>PUNTUACIÓN</div>
              <div>FECHA</div>
            </div>
            {rows.map((r, i) => (
              <div
                key={r.name + i}
                className={
                  "tr" +
                  (i === 0 ? " top1" : i === 1 ? " top2" : i === 2 ? " top3" : "") +
                  (user && r.name === user.name ? " you" : "")
                }
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="rk" style={user && r.name === user.name ? { color: "var(--yellow)" } : undefined}>
                  #{String(r.rank).padStart(2, "0")}
                </div>
                <div className="pl" style={user && r.name === user.name ? { color: "var(--yellow)" } : undefined}>
                  {r.name}
                </div>
                <div className="sc" style={user && r.name === user.name ? { color: "var(--yellow)", textShadow: "0 0 6px rgba(245,255,0,0.5)" } : undefined}>
                  {r.score.toLocaleString("es-ES")}
                </div>
                <div className="dt">{r.date}</div>
              </div>
            ))}
            {user && youScore !== null && youInTop === -1 && (
              <>
                <div className="tr you-label">▸ TU MEJOR MARCA EN {game.title}</div>
                <div className="tr you" style={{ animationDelay: `${rows.length * 50 + 50}ms` }}>
                  <div className="rk" style={{ color: "var(--yellow)" }}>#{String(youRank).padStart(2, "0")}</div>
                  <div className="pl" style={{ color: "var(--yellow)" }}>{user.name}</div>
                  <div className="sc" style={{ color: "var(--yellow)", textShadow: "0 0 6px rgba(245,255,0,0.5)" }}>
                    {youScore.toLocaleString("es-ES")}
                  </div>
                  <div className="dt">{youDate}</div>
                </div>
              </>
            )}
          </div>

          <div style={{ textAlign: "center", marginTop: 32 }}>
            <button className="btn lg" onClick={() => router.push("/")}>VOLVER A LA BIBLIOTECA</button>
          </div>
        </>
      )}
    </div>
  );
}
