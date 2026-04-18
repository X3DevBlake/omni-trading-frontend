import React from "react";
import { TH } from "../theme";

export function OrderBookRow({ price, size, side }) {
  const color = side === "ask" ? TH.red : TH.green;
  const pct = Math.min(100, size * 15);
  return (
    <div style={{ position:"relative", display:"grid", gridTemplateColumns:"1fr 1fr",
      padding:"2px 4px", fontFamily:TH.mono, fontSize:11 }}>
      <div style={{
        position:"absolute", top:0, bottom:0, right:0,
        width:`${pct}%`, background: side === "ask" ? "rgba(255,106,133,0.1)" : "rgba(74,222,160,0.1)",
      }} />
      <span style={{ color, zIndex:1 }}>{price.toFixed(price > 1 ? 2 : 6)}</span>
      <span style={{ color:TH.dim, textAlign:"right", zIndex:1 }}>{size.toFixed(3)}</span>
    </div>
  );
}

/* ══════════ FUTURES VIEW ══════════════════════════════════════════════ */

export default OrderBookRow;
