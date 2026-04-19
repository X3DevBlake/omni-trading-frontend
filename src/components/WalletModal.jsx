import React, { useState } from "react";
import { AlertCircle, Wallet, X } from "lucide-react";
import { TH } from "../theme";
import { useAuth } from "../hooks/useAuth";
import { useWalletDiscovery, MOBILE_WALLETS } from "../hooks/useWalletDiscovery";

export function WalletModal({ onClose, onConnect }) {
  const [connecting, setConnecting] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("browser");
  const auth = useAuth();

  const discovered = useWalletDiscovery();

  const handleConnect = async (walletEntry) => {
    setError(null);
    setConnecting(walletEntry.info.uuid);
    try {
      const provider = walletEntry.provider;
      const accounts = await provider.request({ method: "eth_requestAccounts" });
      if (!accounts || !accounts.length) throw new Error("No accounts returned");
      const address = accounts[0];

      const chainIdHex = await provider.request({ method: "eth_chainId" });
      const chainId = parseInt(chainIdHex, 16);

      let balance = 0;
      try {
        const balHex = await provider.request({
          method: "eth_getBalance",
          params: [address, "latest"],
        });
        balance = parseInt(balHex, 16) / 1e18;
      } catch (_) {}

      let siweUser = null;
      let backendAvailable = true;
      try {
        siweUser = await auth.connect(walletEntry.info.name);
      } catch (e) {
        if (e?.message?.toLowerCase().includes("reject")) {
          setError("Sign-in cancelled. Tap the wallet again to continue.");
          setConnecting(null);
          return;
        }
        backendAvailable = false;
      }

      onConnect({
        type: walletEntry.info.name,
        address: `${address.slice(0, 6)}...${address.slice(-4)}`,
        fullAddress: address,
        balance: balance * 3200,
        ethBalance: balance,
        chainId,
        provider: walletEntry.info.rdns,
        walletName: walletEntry.info.name,
        walletIcon: walletEntry.info.icon,
        authenticated: backendAvailable,
        userId: siweUser?.id || null,
      });
    } catch (err) {
      setError(err?.message || "Connection failed");
      setConnecting(null);
    }
  };

  const handleMobile = () => {
    setError("Mobile wallet support requires WalletConnect project credentials. " +
             "Use a browser wallet (MetaMask, Coinbase, etc) or install the browser " +
             "extension for your mobile wallet.");
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1100,
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 460, maxHeight: "90vh", overflow: "auto",
          borderRadius: 16, background: "rgba(10,16,32,0.96)",
          border: `1px solid ${TH.border}`,
          boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(124,200,255,0.15)",
          padding: 22,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
          <Wallet size={18} color={TH.cyan} style={{ marginRight: 10 }} />
          <h2 style={{ margin: 0, fontFamily: TH.display, fontSize: 18, letterSpacing: "0.15em" }}>
            CONNECT WALLET
          </h2>
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={{
            background: "none", border: "none", color: TH.dim, cursor: "pointer",
          }}><X size={18} /></button>
        </div>

        <div style={{
          display: "flex", borderRadius: 8, overflow: "hidden",
          border: `1px solid ${TH.border}`, marginBottom: 16,
        }}>
          <button onClick={() => setTab("browser")} style={{
            flex: 1, padding: 10, border: "none",
            background: tab === "browser" ? `${TH.cyan}22` : "transparent",
            color: tab === "browser" ? TH.cyan : TH.dim,
            fontFamily: TH.display, fontSize: 11, letterSpacing: "0.15em", cursor: "pointer",
          }}>BROWSER ({discovered.length})</button>
          <button onClick={() => setTab("mobile")} style={{
            flex: 1, padding: 10, border: "none",
            background: tab === "mobile" ? `${TH.magenta}22` : "transparent",
            color: tab === "mobile" ? TH.magenta : TH.dim,
            fontFamily: TH.display, fontSize: 11, letterSpacing: "0.15em", cursor: "pointer",
          }}>MOBILE</button>
        </div>

        {error && (
          <div style={{
            padding: "10px 12px", marginBottom: 14, borderRadius: 8,
            background: `${TH.red}12`, border: `1px solid ${TH.red}55`,
            fontSize: 12, color: TH.red, display: "flex", gap: 8, alignItems: "flex-start",
          }}>
            <AlertCircle size={14} style={{ marginTop: 2, flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {tab === "browser" && (
          <>
            {discovered.length === 0 ? (
              <div style={{
                padding: 24, textAlign: "center", color: TH.dim, fontSize: 13,
                background: "rgba(0,0,0,0.3)", borderRadius: 10,
                border: `1px dashed ${TH.border}`,
              }}>
                <Wallet size={32} color={TH.dim} style={{ margin: "0 auto 10px", display: "block", opacity: 0.5 }} />
                <div style={{ marginBottom: 8, fontWeight: 600, color: TH.text }}>
                  No browser wallets detected
                </div>
                <div style={{ fontSize: 11, lineHeight: 1.6 }}>
                  Install one of: MetaMask, Coinbase Wallet, Rabby, Trust, Rainbow,
                  Brave Wallet, or Frame. Then reload this page.
                </div>
              </div>
            ) : (
              discovered.map(entry => (
                <button
                  key={entry.info.uuid}
                  onClick={() => handleConnect(entry)}
                  disabled={!!connecting}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 14px", marginBottom: 8, borderRadius: 10,
                    background: "rgba(0,0,0,0.35)",
                    border: `1px solid ${connecting === entry.info.uuid ? TH.cyan : TH.border}`,
                    color: TH.text, cursor: connecting ? "wait" : "pointer",
                    textAlign: "left", fontSize: 13,
                    opacity: connecting && connecting !== entry.info.uuid ? 0.4 : 1,
                    transition: "all 0.15s",
                  }}
                >
                  {entry.info.icon ? (
                    <img src={entry.info.icon} alt="" style={{ width: 32, height: 32, borderRadius: 6 }} />
                  ) : (
                    <div style={{
                      width: 32, height: 32, borderRadius: 6,
                      background: `linear-gradient(135deg,${TH.cyan},${TH.magenta})`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, fontWeight: 900, color: "#000",
                    }}>{entry.info.name.charAt(0)}</div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{entry.info.name}</div>
                    <div style={{ fontSize: 10, color: TH.dim, fontFamily: TH.mono }}>
                      {entry.info.rdns === "legacy" ? "INJECTED" : entry.info.rdns}
                    </div>
                  </div>
                  {connecting === entry.info.uuid && (
                    <div style={{
                      width: 16, height: 16, borderRadius: "50%",
                      border: `2px solid ${TH.cyan}33`,
                      borderTopColor: TH.cyan,
                      animation: "spin 0.8s linear infinite",
                    }} />
                  )}
                </button>
              ))
            )}
          </>
        )}

        {tab === "mobile" && (
          <>
            <div style={{
              padding: "10px 12px", marginBottom: 12, borderRadius: 8,
              background: `${TH.gold}14`, border: `1px solid ${TH.gold}55`,
              fontSize: 11, color: TH.dim, lineHeight: 1.6,
            }}>
              Mobile wallet connect requires a WalletConnect project ID. These buttons
              are placeholders. To actually use mobile wallets, install the browser
              extension for the wallet or set up WalletConnect in the project config.
            </div>
            {MOBILE_WALLETS.map(w => (
              <button
                key={w.id}
                onClick={handleMobile}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 14px", marginBottom: 8, borderRadius: 10,
                  background: "rgba(0,0,0,0.35)",
                  border: `1px solid ${TH.border}`,
                  color: TH.text, cursor: "pointer",
                  textAlign: "left", fontSize: 13, opacity: 0.6,
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 6,
                  background: "rgba(255,255,255,0.05)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18,
                }}>{w.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{w.name}</div>
                  <div style={{ fontSize: 10, color: TH.dim, fontFamily: TH.mono }}>
                    {w.description}
                  </div>
                </div>
              </button>
            ))}
          </>
        )}

        <div style={{
          marginTop: 18, fontSize: 10, color: TH.muted, fontFamily: TH.mono,
          letterSpacing: "0.12em", textAlign: "center", lineHeight: 1.6,
        }}>
          EIP-6963 DISCOVERY · EIP-1193 · EIP-4361 SIWE · NON-CUSTODIAL
        </div>
      </div>
    </div>
  );
}

export default WalletModal;
