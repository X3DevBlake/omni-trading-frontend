import React, { useState, useEffect } from "react";
import { Wallet, ArrowDownUp, CreditCard, DollarSign } from "lucide-react";
import { Row } from "../components/Row";
import { TH } from "../theme";

export function BuyCryptoView({ coins }) {
  const [coin, setCoin] = useState(coins[0]);
  const [fiat, setFiat] = useState("USD");
  const [amount, setAmount] = useState("100");
  const [method, setMethod] = useState("card");

  useEffect(() => { if (!coin && coins[0]) setCoin(coins[0]); }, [coins]);

  const receive = parseFloat(amount || 0) / (coin?.current_price || 1);

  return (
    <div style={{ maxWidth:540, margin:"0 auto" }}>
      <div className="glass" style={{ padding:24, borderRadius:16 }}>
        <h2 style={{ marginTop:0, fontFamily:TH.display, letterSpacing:"0.15em" }}>BUY CRYPTO</h2>

        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, color:TH.dim, fontFamily:TH.display, letterSpacing:"0.12em", marginBottom:6 }}>YOU SPEND</div>
          <div style={{ display:"flex", gap:8 }}>
            <input value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              style={{ flex:1, padding:12, fontSize:20, fontFamily:TH.mono, fontWeight:700,
                background:"rgba(0,0,0,0.4)", border:`1px solid ${TH.border}`, borderRadius:8, color:TH.text }} />
            <select value={fiat} onChange={e => setFiat(e.target.value)} style={{
              padding:12, background:"rgba(0,0,0,0.4)", border:`1px solid ${TH.border}`,
              borderRadius:8, color:TH.text, fontFamily:TH.mono,
            }}>
              {["USD","EUR","GBP","JPY","AUD","CAD"].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div style={{ textAlign:"center", margin:"-4px 0" }}>
          <ArrowDownUp size={20} color={TH.cyan} />
        </div>

        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, color:TH.dim, fontFamily:TH.display, letterSpacing:"0.12em", marginBottom:6 }}>YOU RECEIVE</div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <div style={{ flex:1, padding:12, fontSize:20, fontFamily:TH.mono, fontWeight:700,
              background:"rgba(0,0,0,0.4)", border:`1px solid ${TH.border}`, borderRadius:8, color:TH.text }}>
              {receive.toFixed(6)}
            </div>
            <select value={coin?.id} onChange={e => setCoin(coins.find(c => c.id === e.target.value))} style={{
              padding:12, background:"rgba(0,0,0,0.4)", border:`1px solid ${TH.border}`,
              borderRadius:8, color:TH.text, fontFamily:TH.mono, minWidth:110,
            }}>
              {coins.slice(0, 30).map(c => <option key={c.id} value={c.id}>{c.symbol?.toUpperCase()}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, color:TH.dim, fontFamily:TH.display, letterSpacing:"0.12em", marginBottom:8 }}>PAYMENT METHOD</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8 }}>
            {[
              { id:"card", label:"Card", icon:CreditCard },
              { id:"bank", label:"Bank", icon:Wallet },
              { id:"apple", label:"Apple Pay", icon:DollarSign },
              { id:"google", label:"Google Pay", icon:DollarSign },
            ].map(m => {
              const I = m.icon; const active = method === m.id;
              return (
                <button key={m.id} onClick={() => setMethod(m.id)} style={{
                  padding:12, borderRadius:8, display:"flex", alignItems:"center", gap:8,
                  background: active ? `linear-gradient(135deg,${TH.cyan}22,${TH.magenta}22)` : "rgba(0,0,0,0.35)",
                  border: active ? `1px solid ${TH.cyan}` : `1px solid ${TH.border}`,
                  color: active ? TH.cyan : TH.dim, cursor:"pointer",
                  fontFamily:TH.display, fontSize:12, letterSpacing:"0.1em",
                }}><I size={16} /> {m.label.toUpperCase()}</button>
              );
            })}
          </div>
        </div>

        <div style={{ padding:12, background:"rgba(0,0,0,0.35)", borderRadius:8, marginBottom:14, fontFamily:TH.mono, fontSize:11, color:TH.dim }}>
          <Row k="Rate" v={`1 ${coin?.symbol?.toUpperCase()} = ${fmtUsd(coin?.current_price)}`} />
          <Row k="Processing Fee" v={`${(parseFloat(amount) * 0.029).toFixed(2)} ${fiat} (2.9%)`} />
          <Row k="Total" v={`${amount} ${fiat}`} />
        </div>

        <button className="btn-primary" style={{ width:"100%", padding:14, borderRadius:10, fontSize:14 }}>
          BUY {coin?.symbol?.toUpperCase()}
        </button>
      </div>
    </div>
  );
}

/* ══════════ REWARDS / ACHIEVEMENTS VIEW ═══════════════════════════════ */

export default BuyCryptoView;
