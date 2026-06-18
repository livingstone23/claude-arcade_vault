"use client";

import { useEffect, useState } from "react";

export function useTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    // Reads a platform capability unavailable during SSR; must run post-mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsTouch("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  return isTouch;
}
