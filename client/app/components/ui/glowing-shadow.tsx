"use client";

import type { ReactNode } from "react";

interface GlowingShadowProps {
  children: ReactNode;
}

export function GlowingShadow({ children }: GlowingShadowProps) {
  return (
    <button type="button" className="glow-container">
      <span className="glow" />
      <div className="glow-content">{children}</div>
    </button>
  );
}
