import React from "react";
import { TH } from "../theme";

export function StatCard({ icon:I, label, value }) {
  return (
    <div className="glass" style={{ padding:16, borderRadius:12, position:"relative", overflow:"hidden" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
        <div style={{
          width:36, height:36, borderRadius:8,
          background:`linear-gradient(135deg,${TH.cyan}22,${TH.magenta}22)`,
          display:"flex", alignItems:"center", justifyContent:"center",
          border:`1px solid ${TH.border}`,
        }}><I size={18} color={TH.cyan} /></div>
        <div style={{ fontSize:11, color:TH.dim, fontFamily:TH.display, letterSpacing:"0.15em" }}>
          {label.toUpperCase()}
        </div>
      </div>
      <div style={{ fontSize:22, fontWeight:700, fontFamily:TH.mono, color:TH.text }}>{value}</div>
    </div>
  );
}

/* ══════════ SWAP VIEW ═════════════════════════════════════════════════ */

export default StatCard;
