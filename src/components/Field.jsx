import React from "react";
import { TH } from "../theme";

export function Field({ label, value, onChange }) {
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ fontSize:10, color:TH.dim, letterSpacing:"0.15em", fontFamily:TH.display, marginBottom:4 }}>
        {label}
      </div>
      <input value={value} onChange={e => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
        style={{
          width:"100%", padding:"9px 12px", fontFamily:TH.mono, fontSize:13,
          background:"rgba(0,0,0,0.4)", border:`1px solid ${TH.border}`, borderRadius:6,
          color:TH.text,
        }} />
    </div>
  );
}

export default Field;
