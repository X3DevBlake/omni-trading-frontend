import React from "react";
import { ChevronDown } from "lucide-react";
import { TokenIcon } from "./TokenIcon";
import { fmtUsd } from "../lib/formatters";
import { TH } from "../theme";

export function TokenInput({ label, coin, amount, onAmount, onPick, balance, readOnly }) {
  return (
    <div style={{
      padding:16, borderRadius:12, marginBottom:8,
      background:"rgba(0,0,0,0.4)", border:`1px solid ${TH.border}`,
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:TH.dim, marginBottom:10, fontFamily:TH.display, letterSpacing:"0.15em" }}>
        <span>{label.toUpperCase()}</span>
        {balance && <span>BALANCE: {balance}</span>}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <button onClick={onPick} style={{
          display:"flex", alignItems:"center", gap:8,
          padding:"8px 12px", borderRadius:10,
          background:"rgba(124,200,255,0.08)", border:`1px solid ${TH.borderStrong}`,
          color:TH.text, cursor:"pointer",
        }}>
          <TokenIcon coin={coin} size={24} />
          <span style={{ fontWeight:700, fontFamily:TH.display }}>{coin?.symbol?.toUpperCase()}</span>
          <ChevronDown size={14} color={TH.dim} />
        </button>
        <input
          type="text" value={amount}
          readOnly={readOnly}
          onChange={e => onAmount?.(e.target.value.replace(/[^0-9.]/g, ""))}
          style={{
            flex:1, background:"transparent", border:"none",
            fontSize:24, color:TH.text, textAlign:"right",
            fontFamily:TH.mono, fontWeight:700,
          }}
        />
      </div>
      <div style={{ textAlign:"right", color:TH.dim, fontSize:11, marginTop:4, fontFamily:TH.mono }}>
        ≈ {fmtUsd(parseFloat(amount || 0) * (coin?.current_price || 0))}
      </div>
    </div>
  );
}

export default TokenInput;
