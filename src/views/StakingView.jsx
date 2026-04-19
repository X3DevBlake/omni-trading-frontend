import React from "react";
import { Lock } from "lucide-react";
import { TH } from "../theme";

export function StakingView({ connected, account }) {
  return (
    <div className="glass" style={{
      padding: 32, borderRadius: 16, textAlign: "center",
    }}>
      <Lock size={40} color={TH.cyan} style={{
        margin: "0 auto 14px", display: "block", opacity: 0.7,
      }} />
      <h2 style={{ fontFamily: TH.display, letterSpacing: "0.15em", margin: 0 }}>
        sOMNI STAKING
      </h2>
      <p style={{
        color: TH.dim, fontSize: 13, maxWidth: 440,
        margin: "14px auto 0", lineHeight: 1.6,
      }}>
        Coming soon — stake sOMNI tokens to earn platform fees, governance
        voting power, and boosted rewards across all pools.
      </p>
    </div>
  );
}

export default StakingView;
