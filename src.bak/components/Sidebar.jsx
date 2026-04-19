import React from "react";
import { Menu, X } from "lucide-react";
import { OmniLogo } from "./OmniLogo";
import { NAV_ITEMS } from "../lib/navItems";
import { TH } from "../theme";

export function Sidebar({ view, setView, collapsed, onToggle, onHome, mobileOpen, onMobileClose }) {
  const groups = [
    { title:"TRADE",   items: NAV_ITEMS.filter(n => n.group === "trade") },
    { title:"EARN",    items: NAV_ITEMS.filter(n => n.group === "earn") },
    { title:"ACCOUNT", items: NAV_ITEMS.filter(n => n.group === "account") },
  ];

  const sidebarInner = (isMobile = false) => (
    <aside style={{
      width: collapsed && !isMobile ? 78 : 248,
      minHeight:"100vh",
      position: isMobile ? "relative" : "fixed",
      top:0, left:0, zIndex:40,
      display:"flex", flexDirection:"column",
      background:"linear-gradient(180deg,rgba(6,10,24,0.92) 0%,rgba(3,6,13,0.95) 100%)",
      backdropFilter:"blur(18px) saturate(180%)",
      WebkitBackdropFilter:"blur(18px) saturate(180%)",
      borderRight:`1px solid ${TH.borderStrong}`,
      transition:"width 0.35s cubic-bezier(0.2,0.8,0.2,1)",
      boxShadow:"4px 0 32px rgba(0,0,0,0.5)",
    }}>
      {/* Brand */}
      <button onClick={onHome} style={{
        display:"flex", alignItems:"center", gap:12,
        padding: collapsed && !isMobile ? "22px 0" : "22px 20px",
        justifyContent: collapsed && !isMobile ? "center" : "flex-start",
        background:"none", border:"none", cursor:"pointer",
        borderBottom:`1px solid ${TH.border}`,
      }}>
        <OmniLogo size={collapsed && !isMobile ? 40 : 44} />
        {(!collapsed || isMobile) && (
          <div className="anim-fadeIn">
            <div className="omni-title" style={{ fontSize:16, lineHeight:1 }}>OMNI</div>
            <div style={{ fontSize:8, color:TH.dim, letterSpacing:"0.35em", marginTop:3 }}>
              INFINITE EXCHANGE
            </div>
          </div>
        )}
      </button>

      {/* Nav groups */}
      <nav style={{ flex:1, padding:"16px 12px", overflowY:"auto" }}>
        {groups.map((g, gi) => (
          <div key={g.title} style={{ marginBottom:22 }}>
            {(!collapsed || isMobile) && (
              <div className="anim-fadeIn" style={{
                fontFamily:TH.mono, fontSize:9, color:TH.muted,
                letterSpacing:"0.3em", padding:"0 12px 8px",
              }}>
                {g.title}
              </div>
            )}
            <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
              {g.items.map((n, i) => {
                const I = n.icon; const active = view === n.id;
                return (
                  <button
                    key={n.id}
                    onClick={() => setView(n.id)}
                    className={`nav-item${active ? " active" : ""}`}
                    title={collapsed && !isMobile ? n.label : undefined}
                    style={{
                      justifyContent: collapsed && !isMobile ? "center" : "flex-start",
                      padding: collapsed && !isMobile ? "12px 0" : "12px 16px",
                    }}
                  >
                    <I className="ico" size={18} />
                    {(!collapsed || isMobile) && (
                      <>
                        <span style={{ whiteSpace:"nowrap" }}>{n.label.toUpperCase()}</span>
                        {n.badge && <span className="nav-badge">{n.badge}</span>}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        padding: collapsed && !isMobile ? "14px 0" : "14px 16px",
        borderTop:`1px solid ${TH.border}`,
        display:"flex", flexDirection:"column", gap:8,
      }}>
        {!isMobile && (
          <button onClick={onToggle} className="btn-ghost" style={{
            padding:"10px", borderRadius:8, fontSize:10,
            display:"flex", alignItems:"center", justifyContent:"center", gap:8,
          }}>
            {collapsed
              ? <Menu size={14} />
              : <><Menu size={14} /> COLLAPSE</>
            }
          </button>
        )}
        {(!collapsed || isMobile) && (
          <div className="anim-fadeIn" style={{
            fontSize:9, color:TH.muted, fontFamily:TH.mono,
            textAlign:"center", letterSpacing:"0.18em", lineHeight:1.5,
          }}>
            v2.1 · PHOTONIC CORE<br/>© 2026 OMNI
          </div>
        )}
      </div>
    </aside>
  );

  return (
    <>
      <div className="sidebar-desktop">{sidebarInner(false)}</div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="sidebar-mobile-only" style={{
          position:"fixed", inset:0, zIndex:60,
          background:"rgba(0,0,0,0.6)", backdropFilter:"blur(8px)",
        }} onClick={onMobileClose}>
          <div onClick={e => e.stopPropagation()} className="anim-slideR" style={{
            position:"absolute", top:0, left:0, bottom:0, width:280,
          }}>
            {sidebarInner(true)}
            <button onClick={onMobileClose} style={{
              position:"absolute", top:14, right:-44, width:36, height:36,
              borderRadius:10, background:"rgba(0,0,0,0.7)", border:`1px solid ${TH.border}`,
              color:TH.text, cursor:"pointer", display:"flex",
              alignItems:"center", justifyContent:"center",
            }}><X size={16} /></button>
          </div>
        </div>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   APP HEADER — slim bar with page title, status, wallet
   ══════════════════════════════════════════════════════════════════════ */

export default Sidebar;
