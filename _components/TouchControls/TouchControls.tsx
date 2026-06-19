"use client";

import { useState } from "react";
import styles from "./TouchControls.module.css";

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
  buttonB?: KeySpec;
}

interface TouchControlsProps {
  config: TouchControlsConfig;
}

function dispatchKey(type: "keydown" | "keyup", spec: KeySpec) {
  window.dispatchEvent(new KeyboardEvent(type, { key: spec.key, code: spec.code, bubbles: true }));
}

function ArrowIcon({ direction }: { direction: "up" | "down" | "left" | "right" }) {
  const paths: Record<typeof direction, string> = {
    up: "M12 4 L20 16 L4 16 Z",
    right: "M8 4 L20 12 L8 20 Z",
    down: "M4 8 L20 8 L12 20 Z",
    left: "M16 4 L16 20 L4 12 Z",
  };
  return (
    <svg className={styles.dpArrow} viewBox="0 0 24 24">
      <path d={paths[direction]} fill="currentColor" />
    </svg>
  );
}

function DPadButton({
  spec,
  label,
  direction,
  className,
}: {
  spec?: KeySpec;
  label: string;
  direction: "up" | "down" | "left" | "right";
  className: string;
}) {
  const [pressed, setPressed] = useState(false);

  if (!spec) {
    return (
      <button
        type="button"
        aria-label={label}
        aria-disabled="true"
        disabled
        className={`${styles.dp} ${className} ${styles.disabled}`}
      >
        <ArrowIcon direction={direction} />
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      className={`${styles.dp} ${className} ${pressed ? styles.on : ""}`}
      onTouchStart={(e) => {
        e.preventDefault();
        setPressed(true);
        dispatchKey("keydown", spec);
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        setPressed(false);
        dispatchKey("keyup", spec);
      }}
      onTouchCancel={(e) => {
        e.preventDefault();
        setPressed(false);
        dispatchKey("keyup", spec);
      }}
    >
      <ArrowIcon direction={direction} />
    </button>
  );
}

function ActionButton({
  spec,
  label,
  variant,
}: {
  spec?: KeySpec;
  label: string;
  variant: "a" | "b";
}) {
  const [pressed, setPressed] = useState(false);
  const variantClass = variant === "a" ? styles.abA : styles.abB;

  if (!spec) {
    return (
      <button
        type="button"
        aria-label={label}
        aria-disabled="true"
        disabled
        className={`${styles.ab} ${variantClass} ${styles.disabled}`}
      >
        <span className={styles.abRing} />
        <span className={styles.abLetter}>{label}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      className={`${styles.ab} ${variantClass} ${pressed ? styles.on : ""}`}
      onTouchStart={(e) => {
        e.preventDefault();
        setPressed(true);
        dispatchKey("keydown", spec);
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        setPressed(false);
        dispatchKey("keyup", spec);
      }}
      onTouchCancel={(e) => {
        e.preventDefault();
        setPressed(false);
        dispatchKey("keyup", spec);
      }}
    >
      <span className={styles.abRing} />
      <span className={styles.abLetter}>{label}</span>
    </button>
  );
}

export default function TouchControls({ config }: TouchControlsProps) {
  const { dpad, buttonA, buttonB } = config;
  const hasDpad = dpad && (dpad.up || dpad.down || dpad.left || dpad.right);

  if (!hasDpad) return null;

  return (
    <div className={styles.wrap}>
      <div className={styles.gp} role="group" aria-label="Gamepad">
        <div className={styles.gpBody}>
          <div className={styles.gpDpad} aria-label="D-pad">
            <DPadButton spec={dpad?.up} label="up" direction="up" className={styles.dpUp} />
            <DPadButton spec={dpad?.right} label="right" direction="right" className={styles.dpRight} />
            <DPadButton spec={dpad?.down} label="down" direction="down" className={styles.dpDown} />
            <DPadButton spec={dpad?.left} label="left" direction="left" className={styles.dpLeft} />
            <div className={styles.dpHub} aria-hidden="true">
              <span className={styles.dpHubGem} />
            </div>
          </div>

          <div className={styles.actions}>
            <ActionButton spec={buttonB} label="B" variant="b" />
            <ActionButton spec={buttonA} label="A" variant="a" />
          </div>
        </div>
      </div>
    </div>
  );
}
