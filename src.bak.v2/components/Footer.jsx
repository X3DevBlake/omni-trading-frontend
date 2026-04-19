import React from "react";
import { TH } from "../theme";

export function Footer() {
  return (
    <footer style={{
      padding:"40px 20px 20px", textAlign:"center",
      borderTop:`1px solid ${TH.border}`, marginTop:40,
      background:"rgba(3,6,13,0.6)",
    }}>
      <div className="omni-title" style={{ fontSize:16, marginBottom:8 }}>OMNI TRADING</div>
      <div style={{ fontSize:11, color:TH.dim, fontFamily:TH.mono, letterSpacing:"0.15em" }}>
        THE INFINITE EXCHANGE · MARKET DATA BY COINGECKO · © 2026 OMNI
      </div>
    </footer>
  );
}

export default Footer;
