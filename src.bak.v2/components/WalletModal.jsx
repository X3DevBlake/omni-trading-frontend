import React, { useState, useMemo } from "react";
import { Wallet, LogIn, X, AlertCircle } from "lucide-react";
import { TH } from "../theme";
import { useAuth } from "../hooks/useAuth";

export function WalletModal({ onClose, onConnect }) {
  const [connecting, setConnecting] = useState(null);
  const [error, setError] = useState(null);
  const [qrMode, setQrMode] = useState(false);
  const auth = useAuth();

  // Detect which providers are available in the browser
  const providers = useMemo(() => {
    if (typeof window === "undefined") return {};
    const eth = window.ethereum;
    if (!eth) return {};
    // Multi-provider wallets (EIP-6963) expose these flags
    return {
      metamask:  eth.isMetaMask && !eth.isBraveWallet,
      coinbase:  eth.isCoinbaseWallet || !!window.coinbaseWalletExtension,
      trust:     eth.isTrust || !!window.trustwallet,
      anyEth:    !!eth,
    };
  }, []);

  const wallets = [
    { id:"omni",     name:"Omni Native",  desc:"Built-in self-custody wallet", recommended:true },
    { id:"metamask", name:"MetaMask",     desc: providers.metamask ? "Detected · Click to connect" : "Browser extension · Install to use" },
    { id:"wc",       name:"WalletConnect", desc:"Mobile QR connection" },
    { id:"coinbase", name:"Coinbase Wallet", desc: providers.coinbase ? "Detected · Click to connect" : "Coinbase integration" },
    { id:"trust",    name:"Trust Wallet", desc: providers.trust ? "Detected · Click to connect" : "Multi-chain support" },
  ];

  const connectWeb3 = async (walletType) => {
    setError(null);
    setConnecting(walletType);

    try {
      // WalletConnect path — show QR (demo; real integration needs a project ID)
      if (walletType === "wc") {
        setQrMode(true);
        setConnecting(null);
        return;
      }

      // Omni native and Google are not real web3 — just pretend-connect for the demo
      if (walletType === "omni" || walletType === "google") {
        onConnect({
          type: walletType,
          address: "omni_" + Math.random().toString(36).slice(2, 10).toUpperCase(),
          balance: 0,
          chainId: 1,
        });
        return;
      }

      // Real EIP-1193 provider path (MetaMask / Coinbase / Trust — all inject window.ethereum)
      const eth = window.ethereum;
      if (!eth) {
        setError("No web3 wallet detected. Install MetaMask, Coinbase Wallet, or Trust Wallet to continue.");
        setConnecting(null);
        return;
      }

      // Request accounts — this is what triggers the wallet popup
      const accounts = await eth.request({ method: "eth_requestAccounts" });
      if (!accounts || !accounts.length) throw new Error("No accounts returned");

      const address = accounts[0];
      const chainIdHex = await eth.request({ method: "eth_chainId" });
      const chainId = parseInt(chainIdHex, 16);

      // Fetch balance
      let balance = 0;
      try {
        const balHex = await eth.request({
          method: "eth_getBalance",
          params: [address, "latest"],
        });
        balance = parseInt(balHex, 16) / 1e18;
      } catch (_) { /* non-fatal */ }

      // Attempt SIWE against backend. If backend is unreachable, still accept
      // the connection but mark the session as local-only.
      let siweUser = null;
      let backendAvailable = true;
      try {
        siweUser = await auth.connect(walletType);
      } catch (e) {
        // Common cases: user rejected signature, backend offline
        if (e?.message?.toLowerCase().includes("reject")) {
          setError("Sign-in cancelled. Connect again to continue.");
          setConnecting(null);
          return;
        }
        backendAvailable = false;
        console.warn("Backend SIWE unavailable — continuing in local-only mode:", e?.message);
      }

      onConnect({
        type: walletType,
        address: `${address.slice(0, 6)}...${address.slice(-4)}`,
        fullAddress: address,
        balance: balance * 3200, // Assume ETH ~$3200 for USD display
        ethBalance: balance,
        chainId,
        authenticated: backendAvailable,
        userId: siweUser?.id || null,
        displayName: siweUser?.displayName || null,
      });
    } catch (err) {
      setError(err?.message || "Connection failed");
      setConnecting(null);
    }
  };

  if (qrMode) {
    return (
      <div onClick={onClose} style={{
        position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", backdropFilter:"blur(10px)",
        zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20,
      }}>
        <div onClick={e => e.stopPropagation()} className="glass" style={{
          width:"100%", maxWidth:440, borderRadius:16, padding:28, textAlign:"center",
        }}>
          <h3 style={{ margin:"0 0 6px", fontFamily:TH.display, letterSpacing:"0.15em" }}>WALLETCONNECT</h3>
          <p style={{ color:TH.dim, fontSize:12, margin:"0 0 20px" }}>
            Scan with your mobile wallet app to connect
          </p>
          {/* Pseudo-QR pattern — 15x15 grid with deterministic pattern */}
          <div style={{
            width:240, height:240, margin:"0 auto 20px",
            padding:12, background:"#fff", borderRadius:12,
            display:"grid", gridTemplateColumns:"repeat(21,1fr)", gap:0,
          }}>
            {Array.from({ length:21*21 }).map((_, i) => {
              const x = i % 21, y = Math.floor(i / 21);
              // Corner squares (QR finder patterns)
              const inCorner = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
              const cornerBlock = inCorner && (
                (x === 0 || x === 6 || x === 14 || x === 20) ||
                (y === 0 || y === 6 || y === 14 || y === 20) ||
                (x >= 2 && x <= 4 && y >= 2 && y <= 4) ||
                (x >= 16 && x <= 18 && y >= 2 && y <= 4) ||
                (x >= 2 && x <= 4 && y >= 16 && y <= 18)
              );
              // Pseudo-random data cells based on coordinates
              const hash = (x * 31 + y * 17 + (x^y) * 7) % 100;
              const isOn = cornerBlock || (!inCorner && hash > 48);
              return <div key={i} style={{ aspectRatio:"1", background: isOn ? "#000" : "transparent" }} />;
            })}
          </div>
          <div style={{
            fontFamily:TH.mono, fontSize:10, color:TH.dim, letterSpacing:"0.15em",
            marginBottom:18, padding:10, background:"rgba(0,0,0,0.3)", borderRadius:8,
            wordBreak:"break-all",
          }}>
            wc:omni-{Math.random().toString(36).slice(2, 20)}@2
          </div>
          <button onClick={() => setQrMode(false)} className="btn-neon" style={{
            padding:"10px 20px", borderRadius:10, fontSize:11,
          }}>
            ← BACK
          </button>
        </div>
      </div>
    );
  }

  return (
    <div onClick={onClose} style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", backdropFilter:"blur(10px)",
      zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20,
    }}>
      <div onClick={e => e.stopPropagation()} className="glass" style={{
        width:"100%", maxWidth:440, borderRadius:16, padding:24, maxHeight:"90vh", overflowY:"auto",
      }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <h3 style={{ margin:0, fontFamily:TH.display, letterSpacing:"0.15em" }}>CONNECT WALLET</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", color:TH.dim, cursor:"pointer" }}>
            <X size={20} />
          </button>
        </div>

        <button onClick={() => connectWeb3("google")} style={{
          width:"100%", padding:14, marginBottom:14, borderRadius:10,
          background:"#fff", color:"#000", border:"none", cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center", gap:10,
          fontFamily:TH.display, fontWeight:700, letterSpacing:"0.1em",
        }}>
          <LogIn size={16} /> SIGN IN WITH GOOGLE
        </button>

        <div style={{ textAlign:"center", color:TH.dim, fontSize:11, margin:"10px 0", fontFamily:TH.mono, letterSpacing:"0.2em" }}>
          — OR CHOOSE WALLET —
        </div>

        {error && (
          <div style={{
            padding:"10px 12px", marginBottom:12, borderRadius:8,
            background:"rgba(255,106,133,0.1)", border:`1px solid ${TH.red}55`,
            color:TH.red, fontSize:12, display:"flex", alignItems:"center", gap:8,
          }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {wallets.map(w => {
          const isConnecting = connecting === w.id;
          const isDetected = (w.id === "metamask" && providers.metamask) ||
                             (w.id === "coinbase" && providers.coinbase) ||
                             (w.id === "trust" && providers.trust);
          return (
            <button
              key={w.id}
              onClick={() => !connecting && connectWeb3(w.id)}
              disabled={!!connecting}
              style={{
                width:"100%", padding:14, marginBottom:8, borderRadius:10,
                background: isConnecting ? `linear-gradient(135deg,${TH.cyan}22,${TH.magenta}22)` : "rgba(0,0,0,0.4)",
                border:`1px solid ${isConnecting ? TH.cyan : isDetected ? `${TH.green}55` : TH.border}`,
                cursor: connecting ? "wait" : "pointer",
                display:"flex", alignItems:"center", gap:12, textAlign:"left", color:TH.text,
                position:"relative", transition:"all 0.15s",
                opacity: connecting && !isConnecting ? 0.4 : 1,
              }}
              onMouseEnter={e => { if (!connecting) { e.currentTarget.style.borderColor = TH.cyan; e.currentTarget.style.background = "rgba(124,200,255,0.06)"; } }}
              onMouseLeave={e => { if (!connecting) { e.currentTarget.style.borderColor = isDetected ? `${TH.green}55` : TH.border; e.currentTarget.style.background = "rgba(0,0,0,0.4)"; } }}
            >
              <div style={{
                width:40, height:40, borderRadius:10,
                background:`linear-gradient(135deg,${TH.cyan}33,${TH.magenta}33)`,
                display:"flex", alignItems:"center", justifyContent:"center",
                border:`1px solid ${TH.border}`,
              }}>
                {isConnecting
                  ? <div style={{ width:16, height:16, borderRadius:"50%", border:`2px solid ${TH.cyan}`, borderTopColor:"transparent", animation:"spin 0.8s linear infinite" }} />
                  : <Wallet size={18} color={TH.cyan} />}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontFamily:TH.display, display:"flex", alignItems:"center", gap:8 }}>
                  {w.name}
                  {isDetected && <span style={{ fontSize:9, padding:"2px 6px", borderRadius:4, background:`${TH.green}22`, color:TH.green, letterSpacing:"0.1em" }}>DETECTED</span>}
                </div>
                <div style={{ fontSize:11, color:TH.dim }}>{w.desc}</div>
              </div>
              {w.recommended && !isConnecting && (
                <span style={{
                  fontSize:10, padding:"3px 8px", borderRadius:4,
                  background:TH.gold, color:"#000", fontFamily:TH.display, fontWeight:700, letterSpacing:"0.1em",
                }}>BEST</span>
              )}
            </button>
          );
        })}

        <div style={{ fontSize:10, color:TH.muted, textAlign:"center", marginTop:14, fontFamily:TH.mono, letterSpacing:"0.15em" }}>
          EIP-1193 · NON-CUSTODIAL · OPEN-SOURCE
        </div>
      </div>
    </div>
  );
}

/* ── Footer ──────────────────────────────────────────────────────────── */

export default WalletModal;
