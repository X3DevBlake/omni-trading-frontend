import React from "react";
import { TH } from "../theme";

export function Stat({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize:10, color:TH.dim, letterSpacing:"0.15em", fontFamily:TH.display }}>{label}</div>
      <div style={{ fontSize:15, fontWeight:700, fontFamily:TH.mono, color: color || TH.text, marginTop:2 }}>{value}</div>
    </div>
  );
}

export default Stat;
