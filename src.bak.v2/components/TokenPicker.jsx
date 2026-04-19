import React, { useState } from "react";
import { X } from "lucide-react";
import { LivePrice } from "./LivePrice";
import { TokenIcon } from "./TokenIcon";
import { TH } from "../theme";

export function TokenPicker({ coins, onSelect, onClose }) {
  const [q, setQ] = useState("");
  const filtered = coins.filter(c =>
    c.name?.toLowerCase().includes(q.toLowerCase()) ||
    c.symbol?.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div onClick={onClose} style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,0.75)",
      backdropFilter:"blur(8px)", zIndex:100,
      display:"flex", alignItems:"center", justifyContent:"center", padding:20,
    }}>
      <div onClick={e => e.stopPropagation()} className="glass" style={{
        width:"100%", maxWidth:480, maxHeight:"80vh", borderRadius:16,
        display:"flex", flexDirection:"column", overflow:"hidden",
      }}>
        <div style={{ padding:20, borderBottom:`1px solid ${TH.border}` }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <h3 style={{ margin:0, fontFamily:TH.display, letterSpacing:"0.15em" }}>SELECT TOKEN</h3>
            <button onClick={onClose} style={{ background:"none", border:"none", color:TH.dim, cursor:"pointer" }}>
              <X size={20} />
            </button>
          </div>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search..." style={{
            width:"100%", padding:"10px 14px", background:"rgba(0,0,0,0.4)",
            border:`1px solid ${TH.border}`, borderRadius:8, color:TH.text, fontSize:14,
          }} />
        </div>
        <div style={{ overflowY:"auto", flex:1 }}>
          {filtered.map(c => (
            <button key={c.id} onClick={() => onSelect(c)} style={{
              width:"100%", padding:"12px 20px", display:"flex", alignItems:"center", gap:12,
              background:"transparent", border:"none", borderBottom:`1px solid ${TH.border}`,
              color:TH.text, cursor:"pointer", textAlign:"left",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(124,200,255,0.06)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <TokenIcon coin={c} size={32} />
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700 }}>{c.name}</div>
                <div style={{ fontSize:11, color:TH.dim, textTransform:"uppercase" }}>{c.symbol}</div>
              </div>
              <div style={{ fontFamily:TH.mono, fontSize:13 }}><LivePrice coin={c} /></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════ SPOT VIEW ═════════════════════════════════════════════════ */

export default TokenPicker;
