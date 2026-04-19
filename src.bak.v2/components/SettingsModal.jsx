import React from "react";
import { Settings, X } from "lucide-react";
import { usePreferences } from "../hooks/usePreferences";
import { TH } from "../theme";

export function SettingsModal({ onClose }) {
  const { prefs, update, online } = usePreferences();

  const Group = ({ label, children }) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{
        fontFamily: TH.display, fontSize: 10, letterSpacing: "0.2em",
        color: TH.dim, marginBottom: 8,
      }}>{label}</div>
      {children}
    </div>
  );

  const Toggle = ({ value, onChange, label, hint }) => (
    <label style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 12px", borderRadius: 8, marginBottom: 6,
      background: "rgba(0,0,0,0.3)", border: `1px solid ${TH.border}`,
      cursor: "pointer",
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: TH.dim, fontFamily: TH.mono, marginTop: 2 }}>{hint}</div>}
      </div>
      <div style={{
        width: 40, height: 22, borderRadius: 12,
        background: value ? TH.cyan : "rgba(255,255,255,0.1)",
        position: "relative", transition: "background 0.15s",
      }} onClick={() => onChange(!value)}>
        <div style={{
          width: 18, height: 18, borderRadius: "50%", background: "#000",
          position: "absolute", top: 2, left: value ? 20 : 2,
          transition: "left 0.15s",
        }} />
      </div>
    </label>
  );

  const Select = ({ value, onChange, label, options }) => (
    <label style={{ display: "block", marginBottom: 10 }}>
      <div style={{ fontSize: 12, color: TH.dim, marginBottom: 6 }}>{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%", padding: "10px 12px",
          background: "rgba(0,0,0,0.4)", color: TH.text,
          border: `1px solid ${TH.border}`, borderRadius: 8,
          fontSize: 13, fontFamily: TH.mono,
        }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1200,
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480, maxHeight: "88vh", overflow: "auto",
          borderRadius: 16, background: "rgba(10,16,32,0.95)",
          border: `1px solid ${TH.border}`,
          boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(124,200,255,0.15)",
          padding: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: 18 }}>
          <Settings size={18} color={TH.cyan} style={{ marginRight: 10 }} />
          <h2 style={{ margin: 0, fontFamily: TH.display, fontSize: 18, letterSpacing: "0.15em" }}>
            SETTINGS
          </h2>
          <div style={{ flex: 1 }} />
          <span style={{
            fontSize: 10, fontFamily: TH.mono, letterSpacing: "0.15em",
            color: online ? TH.green : TH.dim,
          }}>{online ? "SYNCED" : "LOCAL"}</span>
          <button onClick={onClose} style={{
            marginLeft: 10, background: "none", border: "none",
            color: TH.dim, cursor: "pointer",
          }}><X size={18} /></button>
        </div>

        <Group label="DEFAULTS">
          <Select
            label="Landing view after login"
            value={prefs.defaultView}
            onChange={(v) => update({ defaultView: v })}
            options={[
              { value: "markets", label: "Markets" },
              { value: "swap", label: "Swap" },
              { value: "spot", label: "Spot" },
              { value: "futures", label: "Futures" },
              { value: "portfolio", label: "Portfolio" },
            ]}
          />
          <Select
            label="Default trading pair"
            value={prefs.defaultPair}
            onChange={(v) => update({ defaultPair: v })}
            options={[
              { value: "BTC-USD", label: "BTC-USD" },
              { value: "ETH-USD", label: "ETH-USD" },
              { value: "SOL-USD", label: "SOL-USD" },
            ]}
          />
        </Group>

        <Group label="DISPLAY">
          <Toggle
            label="Show portfolio balances"
            hint="Uncheck to default values hidden for screenshots"
            value={prefs.showPortfolioBalances}
            onChange={(v) => update({ showPortfolioBalances: v })}
          />
          <Toggle
            label="Reduced motion"
            hint="Pauses the background 3D scene and disables animations"
            value={prefs.reducedMotion}
            onChange={(v) => update({ reducedMotion: v })}
          />
        </Group>

        <Group label="NOTIFICATIONS">
          <Toggle
            label="Enable alerts & notifications"
            value={prefs.notificationsEnabled}
            onChange={(v) => update({ notificationsEnabled: v })}
          />
        </Group>

        <div style={{
          fontSize: 10, color: TH.muted, fontFamily: TH.mono,
          letterSpacing: "0.15em", textAlign: "center", marginTop: 18,
        }}>
          {online
            ? "CHANGES SYNCED TO YOUR WALLET"
            : "CHANGES SAVED LOCALLY · CONNECT WALLET TO SYNC"}
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
