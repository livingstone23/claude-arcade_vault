"use client";

import type { CSSProperties } from "react";

export interface KeySpec {
  key: string;
  code: string;
}

export interface TouchControlsConfig {
  dpad?: {
    up?: KeySpec;
    down?: KeySpec;
    left?: KeySpec;
    right?: KeySpec;
  };
  buttonA?: KeySpec;
}

interface TouchControlsProps {
  config: TouchControlsConfig;
}

function dispatchKey(type: "keydown" | "keyup", spec: KeySpec) {
  window.dispatchEvent(new KeyboardEvent(type, { key: spec.key, code: spec.code, bubbles: true }));
}

const dpadButtonStyle: CSSProperties = {
  width: 48,
  height: 48,
  minWidth: 44,
  minHeight: 44,
  borderRadius: 10,
  border: "1px solid var(--line, #333)",
  background: "rgba(255, 255, 255, 0.06)",
  color: "var(--ink, #fff)",
  fontSize: 18,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  touchAction: "none",
  userSelect: "none",
  WebkitUserSelect: "none",
};

const actionButtonStyle: CSSProperties = {
  width: 56,
  height: 56,
  minWidth: 44,
  minHeight: 44,
  borderRadius: "50%",
  border: "1px solid var(--magenta, #ff006e)",
  background: "rgba(255, 0, 110, 0.18)",
  color: "var(--ink, #fff)",
  fontSize: 16,
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  touchAction: "none",
  userSelect: "none",
  WebkitUserSelect: "none",
};

function TouchButton({
  spec,
  label,
  style,
}: {
  spec: KeySpec;
  label: string;
  style: CSSProperties;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      style={style}
      onTouchStart={(e) => {
        e.preventDefault();
        dispatchKey("keydown", spec);
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        dispatchKey("keyup", spec);
      }}
      onTouchCancel={(e) => {
        e.preventDefault();
        dispatchKey("keyup", spec);
      }}
    >
      {label}
    </button>
  );
}

export default function TouchControls({ config }: TouchControlsProps) {
  const { dpad, buttonA } = config;
  const hasDpad = dpad && (dpad.up || dpad.down || dpad.left || dpad.right);

  if (!hasDpad) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 24,
        padding: "16px 24px",
        background: "linear-gradient(0deg, rgba(10,10,15,0.96), rgba(10,10,15,0.85))",
        backdropFilter: "blur(8px)",
        borderTop: "1px solid var(--line, #333)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "48px 48px 48px",
          gridTemplateRows: "48px 48px 48px",
          gap: 4,
        }}
      >
        <div />
        {dpad?.up ? (
          <TouchButton spec={dpad.up} label="▲" style={{ ...dpadButtonStyle, gridColumn: 2, gridRow: 1 }} />
        ) : (
          <div />
        )}
        <div />

        {dpad?.left ? (
          <TouchButton spec={dpad.left} label="◀" style={{ ...dpadButtonStyle, gridColumn: 1, gridRow: 2 }} />
        ) : (
          <div />
        )}
        <div />
        {dpad?.right ? (
          <TouchButton spec={dpad.right} label="▶" style={{ ...dpadButtonStyle, gridColumn: 3, gridRow: 2 }} />
        ) : (
          <div />
        )}

        <div />
        {dpad?.down ? (
          <TouchButton spec={dpad.down} label="▼" style={{ ...dpadButtonStyle, gridColumn: 2, gridRow: 3 }} />
        ) : (
          <div />
        )}
        <div />
      </div>

      {buttonA && <TouchButton spec={buttonA} label="A" style={actionButtonStyle} />}
    </div>
  );
}
