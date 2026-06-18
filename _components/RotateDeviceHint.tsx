"use client";

import { useState } from "react";
import { useTouchDevice } from "@/_lib/useTouchDevice";

export default function RotateDeviceHint() {
  const isTouch = useTouchDevice();
  const [dismissed, setDismissed] = useState(false);

  if (!isTouch || dismissed) return null;

  return (
    <div
      className="rotate-hint"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 60,
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: "10px 16px",
        background: "rgba(20, 20, 30, 0.92)",
        borderBottom: "1px solid var(--line, #333)",
        color: "var(--ink, #fff)",
        fontSize: 13,
      }}
    >
      <span>⟳ Gira tu dispositivo para mejor experiencia</span>
      <button
        type="button"
        aria-label="Cerrar"
        onClick={() => setDismissed(true)}
        style={{
          background: "transparent",
          border: "none",
          color: "var(--ink, #fff)",
          fontSize: 16,
          lineHeight: 1,
          cursor: "pointer",
          padding: 4,
        }}
      >
        ✕
      </button>
    </div>
  );
}
