"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { SavedScore } from "@/_lib/data";
import { supabase, scoreTable } from "@/_lib/supabase";

interface UserState {
  user: { name: string } | null;
  login: (u: { name: string }) => void;
  signOut: () => void;
  saveScore: (entry: Omit<SavedScore, "at">) => void;
}

const UserContext = createContext<UserState | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ name: string } | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("av_user");
      if (stored) setUser(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => {
    if (localStorage.getItem("av_migrated")) return;
    try {
      const all: SavedScore[] = JSON.parse(localStorage.getItem("av_scores") || "[]");
      if (all.length === 0) { localStorage.setItem("av_migrated", "1"); return; }
      Promise.all(
        all.map((s) =>
          supabase.from(scoreTable(s.game)).insert({
            player_name: s.name,
            score: s.score,
            created_at: new Date(s.at).toISOString(),
          })
        )
      ).finally(() => localStorage.setItem("av_migrated", "1"));
    } catch {}
  }, []);

  const login = (u: { name: string }) => {
    setUser(u);
    localStorage.setItem("av_user", JSON.stringify(u));
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem("av_user");
  };

  const saveScore = (entry: Omit<SavedScore, "at">) => {
    try {
      const all: SavedScore[] = JSON.parse(localStorage.getItem("av_scores") || "[]");
      all.push({ ...entry, at: Date.now() });
      localStorage.setItem("av_scores", JSON.stringify(all));
    } catch {}
    supabase
      .from(scoreTable(entry.game))
      .insert({ player_name: entry.name, score: entry.score })
      .then(() => {}, () => {});
  };

  return (
    <UserContext.Provider value={{ user, login, signOut, saveScore }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserState {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used inside UserProvider");
  return ctx;
}
