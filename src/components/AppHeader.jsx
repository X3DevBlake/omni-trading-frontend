import React from "react";
import { Wallet, Menu, BarChart3, RefreshCw, Settings } from "lucide-react";
import { LivePulse } from "./LivePulse";
import { fmtNum } from "../lib/formatters";
import { NAV_ITEMS } from "../lib/navItems";
import { TH } from "../theme";

export function AppHeader({ view, connected, account, onConnect, onDisconnect, onOpenSettings, status, wsStatus, lastUpdate, refresh, onOpenMobileNav }) {
  const statusConfig = {
    idle:     { color:TH.dim,     label:"SYNC" },
    loading:  { color:TH.gold,    label:"SYNC" },
    live:     { color:TH.green,   label:"LIVE REST" },
    fallback: { color:TH.dim,     label:"REST · PAUSED" },
    error:    { color:TH.red,     label:"OFFLINE" },
  };
  const sc = statusConfig[status] || statusConfig.idle;
  const wsConnected = wsStatus === "connected";
  const current = NAV_ITEMS.find(n => n.id === view);
  const PageIcon = current?.icon || BarChart3;

  return (
    <header className="glass" style={{
      position:"sticky", top:0, zIndex:30,
      padding:"14px 28px",
      display:"flex", alignItems:"center", gap:16, flexWrap:"wrap",
      borderTop:"none", borderLeft:"none", borderRight:"none",
      borderBottom:`1px solid ${TH.borderStrong}`,
    }}>
      <button onClick={onOpenMobileNav} className="sidebar-mobile-only" style={{
        background:"none", border:`1px solid ${TH.border}`, color:TH.text,
        width:38, height:38, borderRadius:10, cursor:"pointer",
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        <Menu size={17} />
      </button>

      <div style={{ display:"flex", alignItems:"center", gap:12, minWidth:0 }}>
        <div style={{
          padding:9, borderRadius:10,
          background:"linear-gradient(135deg,rgba(124,200,255,0.22),rgba(176,137,255,0.14))",
          border:`1px solid ${TH.borderStrong}`,
        }}>
          <PageIcon size={16} color={TH.cyan} />
        </div>
        <div>
          <div style={{ fontFamily:TH.display, fontSize:16, fontWeight:700, letterSpacing:"0.1em" }}>
            {(current?.label || "MARKETS").toUpperCase()}
          </div>
          <div style={{ fontSize:10, color:TH.dim, fontFamily:TH.mono, letterSpacing:"0.2em", marginTop:2 }}>
            {lastUpdate ? `UPDATED ${new Date(lastUpdate).toLocaleTimeString()}` : "OMNI TERMINAL"}
          </div>
        </div>
      </div>

      <div style={{ flex:1 }} />

      <div className="pill" style={{
        color: wsConnected ? TH.green : TH.dim,
        borderColor: wsConnected ? `${TH.green}55` : `${TH.dim}55`,
      }} title={wsConnected ? "WebSocket streaming live ticks" : "Live stream paused — displaying last known prices"}>
        <LivePulse active={wsConnected} size={8} />
        {wsConnected ? "WS · STREAMING" : "WS · PAUSED"}
      </div>

      <div className="pill" style={{
        color:sc.color, borderColor:`${sc.color}55`,
      }}>
        <span className="status-dot" style={{ background:sc.color, boxShadow:`0 0 10px ${sc.color}` }} />
        {sc.label}
        <button onClick={refresh} style={{ background:"none", border:"none", color:sc.color, cursor:"pointer", display:"flex", alignItems:"center", padding:0, marginLeft:2 }}>
          <RefreshCw size={11} />
        </button>
      </div>

      {onOpenSettings && (
        <button
          onClick={onOpenSettings}
          title="Settings"
          className="btn-neon"
          style={{
            width: 38, height: 38, borderRadius: 10, padding: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Settings size={15} />
        </button>
      )}

      {connected ? (
        <button onClick={onDisconnect} className="btn-neon" style={{
          padding:"10px 16px", borderRadius:10, fontSize:11,
          display:"flex", alignItems:"center", gap:10,
        }}>
          <Wallet size={13} />
          <span>{account?.address}</span>
          <span style={{ color:TH.green, fontFamily:TH.mono }}>${fmtNum(account?.balance)}</span>
        </button>
      ) : (
        <button onClick={onConnect} className="btn-primary" style={{
          padding:"11px 18px", borderRadius:10, fontSize:11,
          display:"flex", alignItems:"center", gap:8,
        }}>
          <Wallet size={13} /> CONNECT
        </button>
      )}
    </header>
  );
}

/* ── Ticker strip ────────────────────────────────────────────────────── */

export default AppHeader;
