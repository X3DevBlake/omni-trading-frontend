import React from "react";
import { LivePrice } from "./LivePrice";
import { TokenIcon } from "./TokenIcon";
import { fmtPct } from "../lib/formatters";
import { TH } from "../theme";

export function TickerStrip({ coins }) {
  return (
    <div style={{
      padding:"10px 0",
      background:"rgba(5,10,24,0.75)",
      borderBottom:`1px solid ${TH.border}`,
      overflow:"hidden", whiteSpace:"nowrap",
    }}>
      <div style={{
        display:"inline-flex", gap:48, animation:"marquee 60s linear infinite",
        fontFamily:TH.mono, fontSize:13,
      }}>
        {[...coins, ...coins, ...coins].map((c, i) => {
          const up = (c.price_change_percentage_24h || 0) >= 0;
          return (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
              <TokenIcon coin={c} size={18} />
              <span style={{ color:TH.text }}>{c.symbol?.toUpperCase()}</span>
              <LivePrice coin={c} style={{ color:TH.dim }} />
              <span style={{ color: up?TH.green:TH.red }}>{fmtPct(c.price_change_percentage_24h)}</span>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>
    </div>
  );
}

/* ══════════ MARKETS VIEW ══════════════════════════════════════════════ */

export default TickerStrip;
