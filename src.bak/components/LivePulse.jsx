import React from "react";
import { TH } from "../theme";

export function LivePulse({ active = true, size = 8 }) {
  return (
    <span style={{
      display:"inline-block", width:size, height:size, borderRadius:"50%",
      background: active ? TH.green : TH.dim,
      boxShadow: active ? `0 0 10px ${TH.green}, 0 0 4px ${TH.green}` : "none",
      animation: active ? "livePulse 1.1s ease-in-out infinite" : "none",
    }} />
  );
}


/* ═══════════════════════════════════════════════════════════════════════
   TOKEN ICON — SVG-first cascade across multiple CDNs
   ═══════════════════════════════════════════════════════════════════════ */

export default LivePulse;
