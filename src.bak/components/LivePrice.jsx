import React, { useState, useEffect, useRef } from "react";
import { fmtUsd } from "../lib/formatters";
import { TH } from "../theme";

export function LivePrice({ coin, style, format = fmtUsd, className = "" }) {
  const price = coin?.current_price;
  const prevRef = useRef(price);
  const [flash, setFlash] = useState(null); // "up" | "down" | null
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (price == null || !isFinite(price)) return;
    const prev = prevRef.current;
    if (prev != null && isFinite(prev) && prev !== price) {
      setFlash(price > prev ? "up" : "down");
      setTick(t => t + 1);
      const timer = setTimeout(() => setFlash(null), 1100);
      prevRef.current = price;
      return () => clearTimeout(timer);
    }
    prevRef.current = price;
  }, [price]);

  const flashColor = flash === "up" ? TH.green : flash === "down" ? TH.red : null;
  const arrow = flash === "up" ? "▲" : flash === "down" ? "▼" : null;

  return (
    <span
      className={`live-price ${flash ? `flash-${flash}` : ""} ${className}`}
      data-tick={tick}
      style={{
        display:"inline-flex", alignItems:"center", gap:4,
        transition:"color 0.25s ease, text-shadow 0.25s ease",
        color: flashColor || style?.color || "inherit",
        textShadow: flashColor ? `0 0 14px ${flashColor}, 0 0 4px ${flashColor}` : "none",
        fontVariantNumeric:"tabular-nums",
        ...style,
      }}
    >
      {format(price)}
      {arrow && (
        <span style={{
          fontSize:"0.7em", color:flashColor,
          animation:"arrowPop 0.9s cubic-bezier(0.2,0.8,0.2,1) both",
        }}>{arrow}</span>
      )}
    </span>
  );
}

/* Tiny live-pulse dot — shows WS connection is active */

export default LivePrice;
