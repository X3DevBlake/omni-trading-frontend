import React, { useState } from "react";
import { ExternalLink, RefreshCw, Wallet, Shield } from "lucide-react";
import { useOnchainHoldings } from "../hooks/useOnchainHoldings";
import { TH } from "../theme";
import { fmtUsd } from "../lib/formatters";

export function AssetsView({ connected, account }) {
  const [showTestnet, setShowTestnet] = useState(false);

  const chainIds = showTestnet
    ? [1, 8453, 137, 42161, 10, 11155111]
    : [1, 8453, 137, 42161, 10];

  const { holdings, totalUsd, loading, error } = useOnchainHoldings(
    account?.fullAddress,
    chainIds
  );

  if (!connected) {
    return (
      <div className="glass" style={{ padding:32, borderRadius:16, textAlign:"center" }}>
        <Wallet size={40} color={TH.dim} style={{
          margin:"0 auto 14px", display:"block", opacity:0.5,
        }} />
        <h2 style={{ fontFamily:TH.display, letterSpacing:"0.15em", margin:0 }}>
          CONNECT WALLET
        </h2>
        <p style={{ color:TH.dim, fontSize:13, maxWidth:440, margin:"14px auto 0", lineHeight:1.6 }}>
          Your assets page shows <strong style={{ color:TH.cyan }}>on-chain balances</strong>{" "}
          from your own wallet across Ethereum, Base, Polygon, Arbitrum, and Optimism.
          Nothing is custodied here — your assets stay in your wallet at all times.
        </p>
      </div>
    );
  }

  const visible = showTestnet ? holdings : holdings.filter(h => !h.testnet);
  const totalVisible = visible.reduce((s, h) => s + (h.usdValue || 0), 0);

  // Group by chain
  const byChain = visible.reduce((acc, h) => {
    (acc[h.chain] = acc[h.chain] || []).push(h);
    return acc;
  }, {});

  return (
    <div>
      {/* Total + controls */}
      <div className="glass" style={{
        padding:24, borderRadius:16, marginBottom:16,
        background:`linear-gradient(135deg,rgba(124,200,255,0.08),rgba(176,137,255,0.08))`,
      }}>
        <div style={{ fontSize:12, color:TH.dim, fontFamily:TH.display,
          letterSpacing:"0.15em", marginBottom:6 }}>
          ON-CHAIN HOLDINGS
        </div>
        <div style={{ display:"flex", alignItems:"baseline", gap:16, flexWrap:"wrap" }}>
          <div style={{
            fontSize:42, fontWeight:900, fontFamily:TH.mono,
            background:`linear-gradient(135deg,${TH.cyan},${TH.magenta})`,
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
          }}>
            {fmtUsd(totalVisible)}
          </div>
          <div style={{ fontSize:12, color:TH.dim, fontFamily:TH.mono }}>
            {visible.length} assets · {Object.keys(byChain).length} chains
          </div>
        </div>

        <div style={{ display:"flex", gap:8, marginTop:14, flexWrap:"wrap", alignItems:"center" }}>
          <div style={{
            fontSize:10, fontFamily:TH.mono, letterSpacing:"0.15em",
            color:TH.dim, display:"flex", alignItems:"center", gap:6,
          }}>
            <Shield size={11} /> NON-CUSTODIAL · READ-ONLY
          </div>
          <div style={{ flex:1 }} />
          <button
            onClick={() => setShowTestnet(v => !v)}
            style={{
              padding:"4px 10px",
              background: showTestnet ? `${TH.gold}18` : "transparent",
              border: `1px solid ${showTestnet ? TH.gold : TH.border}`,
              color: showTestnet ? TH.gold : TH.dim,
              borderRadius:6, fontSize:10, fontFamily:TH.mono,
              letterSpacing:"0.1em", cursor:"pointer",
            }}
          >SHOW TESTNETS {showTestnet ? "ON" : "OFF"}</button>
        </div>
      </div>

      {error && (
        <div style={{
          padding:"12px 14px", marginBottom:14, borderRadius:10,
          background:`${TH.red}12`, border:`1px solid ${TH.red}55`,
          color:TH.red, fontSize:12,
        }}>{error}</div>
      )}

      {loading && (
        <div style={{
          display:"flex", alignItems:"center", gap:10, padding:16, color:TH.dim,
          fontSize:12, fontFamily:TH.mono, letterSpacing:"0.1em",
        }}>
          <div style={{
            width:14, height:14, borderRadius:"50%",
            border:`2px solid ${TH.cyan}33`, borderTopColor:TH.cyan,
            animation:"spin 0.8s linear infinite",
          }} />
          SCANNING CHAINS...
        </div>
      )}

      {!loading && visible.length === 0 && (
        <div className="glass" style={{
          padding:32, borderRadius:12, textAlign:"center", color:TH.dim, fontSize:13,
        }}>
          No assets found in this wallet across the selected chains.
          Try connecting a different wallet or enabling testnets.
        </div>
      )}

      {/* Per-chain sections */}
      {Object.entries(byChain).map(([chain, items]) => {
        const chainTotal = items.reduce((s, h) => s + (h.usdValue || 0), 0);
        return (
          <div key={chain} className="glass" style={{
            borderRadius:12, marginBottom:14, overflow:"hidden",
          }}>
            <div style={{
              padding:"12px 18px", background:"rgba(124,200,255,0.06)",
              borderBottom:`1px solid ${TH.border}`,
              display:"flex", alignItems:"center", gap:12,
            }}>
              <div style={{
                width:8, height:8, borderRadius:"50%",
                background:TH.cyan,
                boxShadow:`0 0 8px ${TH.cyan}`,
              }} />
              <div style={{
                fontFamily:TH.display, fontSize:13, letterSpacing:"0.15em",
              }}>{chain.toUpperCase()}</div>
              {items[0]?.testnet && (
                <span style={{
                  fontSize:9, fontFamily:TH.mono, letterSpacing:"0.2em",
                  color:TH.gold, padding:"2px 6px",
                  background:`${TH.gold}14`, borderRadius:4,
                  border:`1px solid ${TH.gold}40`,
                }}>TESTNET</span>
              )}
              <div style={{ flex:1 }} />
              <div style={{
                fontSize:13, fontFamily:TH.mono, fontWeight:700, color:TH.text,
              }}>{fmtUsd(chainTotal)}</div>
            </div>

            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ background:"rgba(0,0,0,0.25)" }}>
                  {["ASSET","AMOUNT","PRICE","VALUE",""].map(h => (
                    <th key={h} style={{
                      padding:"8px 14px", textAlign: h === "ASSET" ? "left" : "right",
                      fontFamily:TH.display, fontSize:10, color:TH.dim,
                      letterSpacing:"0.15em", fontWeight:500,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((h, i) => (
                  <tr key={i} style={{ borderTop:`1px solid ${TH.border}` }}>
                    <td style={{ padding:"10px 14px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{
                          width:28, height:28, borderRadius:"50%",
                          background:h.isNative
                            ? `linear-gradient(135deg,${TH.cyan},${TH.magenta})`
                            : "rgba(255,255,255,0.08)",
                          color: h.isNative ? "#000" : TH.text,
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:10, fontWeight:900,
                        }}>{h.symbol.slice(0,3)}</div>
                        <div>
                          <div style={{ fontWeight:700, fontSize:13 }}>{h.symbol}</div>
                          <div style={{ fontSize:10, color:TH.dim, fontFamily:TH.mono }}>
                            {h.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:"10px 14px", textAlign:"right", fontFamily:TH.mono, fontSize:13 }}>
                      {h.amount.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                    </td>
                    <td style={{ padding:"10px 14px", textAlign:"right", fontFamily:TH.mono, fontSize:12, color:TH.dim }}>
                      {h.price > 0 ? fmtUsd(h.price) : "—"}
                    </td>
                    <td style={{ padding:"10px 14px", textAlign:"right", fontFamily:TH.mono, fontSize:13, fontWeight:700 }}>
                      {h.usdValue > 0 ? fmtUsd(h.usdValue) : "—"}
                    </td>
                    <td style={{ padding:"10px 14px", textAlign:"right" }}>
                      {h.contractAddress && (
                        <a
                          href={`${h.explorer}/address/${h.contractAddress}`}
                          target="_blank" rel="noreferrer"
                          style={{ color:TH.cyan, display:"inline-flex", alignItems:"center" }}
                          onClick={e => e.stopPropagation()}
                        ><ExternalLink size={12} /></a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {/* Footer explainer */}
      <div style={{
        padding:"12px 16px", borderRadius:10, marginTop:10,
        background:"rgba(0,0,0,0.25)", border:`1px solid ${TH.border}`,
        fontSize:11, color:TH.dim, lineHeight:1.7,
      }}>
        <strong style={{ color:TH.text }}>How this works:</strong> Omni reads balances
        directly from public blockchain RPCs using your wallet address. No funds
        are ever held by this platform. To send or receive tokens, use your wallet
        app directly. We only display what's already in your wallet.
      </div>
    </div>
  );
}

export default AssetsView;
