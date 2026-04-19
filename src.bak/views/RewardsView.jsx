import React from "react";
import { Trophy, Check } from "lucide-react";
import { useQuests } from "../hooks/useQuests";
import { fmtUsd } from "../lib/formatters";
import { TH } from "../theme";

// Human-readable titles keyed on backend quest IDs
const QUEST_TITLES = {
  "first-swap":    "Complete first swap",
  "ten-trades":    "Make 10 trades",
  "provide-500":   "Provide $500 liquidity",
  "stake-3-pools": "Stake in 3 pools",
  "volume-10k":    "Trade $10k volume",
  "refer-5":       "Refer 5 friends",
  "hold-30-days":  "Hold for 30 days",
};

export function RewardsView() {
  const questState = useQuests();

  // XP from backend if online; otherwise a demo value so the view still shows
  const currentXp = questState.online ? questState.totalXp : 51_800;

  // XP/level math: each level = floor(100 × level^1.4) XP to reach
  const xpForLevel = (lvl) => Math.floor(100 * Math.pow(lvl, 1.4));
  const cumXpForLevel = (lvl) => {
    let t = 0;
    for (let i = 1; i <= lvl; i++) t += xpForLevel(i);
    return t;
  };
  // Find current level
  let level = 1;
  while (cumXpForLevel(level + 1) <= currentXp) level++;
  const xpIntoLevel = currentXp - cumXpForLevel(level);
  const xpNeeded = xpForLevel(level + 1);
  const levelPct = Math.min(100, (xpIntoLevel / xpNeeded) * 100);

  // Tier system
  const tiers = [
    { min:1,  name:"SCOUT",      mul:1.0,  color:"#888" },
    { min:10, name:"VOYAGER",    mul:1.15, color:"#7cc8ff" },
    { min:20, name:"NAVIGATOR",  mul:1.3,  color:"#b089ff" },
    { min:35, name:"COMMANDER",  mul:1.5,  color:"#ffd57a" },
    { min:50, name:"ADMIRAL",    mul:1.8,  color:"#ff6a85" },
    { min:75, name:"OMNI",       mul:2.5,  color:"#4adea0" },
  ];
  const currentTier = tiers.slice().reverse().find(t => level >= t.min) || tiers[0];
  const nextTier = tiers.find(t => level < t.min);

  // Merge backend quest data with human titles; fall back to demo list when offline
  const quests = questState.online
    ? questState.quests.map(q => ({
        id: q.id,
        t: QUEST_TITLES[q.id] || q.id,
        p: q.xp,
        done: q.completed,
        prog: q.progress,
        goal: q.goal,
        claimable: q.completed && !q.rewardClaimed,
      }))
    : [
        { t:"Complete first swap", p:100, done:true },
        { t:"Make 10 trades", p:300, done:true },
        { t:"Provide $500 liquidity", p:400, done:true },
        { t:"Stake in 3 pools", p:500, prog:2, goal:3 },
    { t:"Trade $10k volume", p:750, prog:6800, goal:10000 },
    { t:"Refer 5 friends", p:1000, prog:2, goal:5 },
    { t:"Hold for 30 days", p:2000, prog:18, goal:30 },
  ];
  const omniBalance = 12_480;

  return (
    <div>
      <div className="glass-card" style={{ padding:24, borderRadius:16, marginBottom:16,
        background:`linear-gradient(135deg,${currentTier.color}20,rgba(176,137,255,0.08))` }}>
        <div style={{ display:"flex", alignItems:"center", gap:20, flexWrap:"wrap" }}>
          <div style={{
            width:82, height:82, borderRadius:"50%",
            background:`linear-gradient(135deg,${currentTier.color},${TH.magenta})`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:34, fontWeight:900, fontFamily:TH.display, color:"#000",
            boxShadow:`0 0 40px ${currentTier.color}88`,
          }}>{level}</div>
          <div style={{ flex:1, minWidth:240 }}>
            <div style={{ fontSize:11, color:TH.dim, fontFamily:TH.display, letterSpacing:"0.15em" }}>
              TRADER TIER · {currentTier.mul}× REWARDS
            </div>
            <div style={{ fontFamily:TH.display, fontSize:24, letterSpacing:"0.1em", color:currentTier.color }}>
              OMNI {currentTier.name}
            </div>
            <div style={{ marginTop:8, height:8, borderRadius:4, background:"rgba(0,0,0,0.4)", overflow:"hidden" }}>
              <div style={{
                width:`${levelPct}%`, height:"100%",
                background:`linear-gradient(90deg,${currentTier.color},${TH.magenta})`,
                transition:"width 0.6s",
              }} />
            </div>
            <div style={{ fontSize:11, color:TH.dim, marginTop:4, fontFamily:TH.mono }}>
              {xpIntoLevel.toLocaleString()} / {xpNeeded.toLocaleString()} XP to Level {level + 1}
              {nextTier && ` · ${nextTier.min - level} levels to ${nextTier.name}`}
            </div>
          </div>
          <div>
            <div style={{ fontSize:11, color:TH.dim, fontFamily:TH.display, letterSpacing:"0.12em", textAlign:"right" }}>OMNI BALANCE</div>
            <div style={{ fontSize:28, fontWeight:900, fontFamily:TH.mono, color:TH.gold, textAlign:"right" }}>
              {omniBalance.toLocaleString()}
            </div>
            <div style={{ fontSize:10, color:TH.dim, textAlign:"right", fontFamily:TH.mono }}>
              ≈ {fmtUsd(omniBalance * 0.42)}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))", gap:14 }}>
        <div className="glass-card" style={{ padding:18, borderRadius:12 }}>
          <h3 style={{ marginTop:0, fontFamily:TH.display, letterSpacing:"0.15em" }}>ACTIVE QUESTS</h3>
          {quests.map((q, i) => (
            <div key={i} style={{
              padding:"12px 0", borderBottom: i < quests.length-1 ? `1px solid ${TH.border}` : "none",
              display:"flex", alignItems:"center", gap:12,
            }}>
              <div style={{
                width:34, height:34, borderRadius:"50%",
                background: q.done ? TH.green : "rgba(0,0,0,0.4)",
                border:`1px solid ${q.done ? TH.green : TH.border}`,
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>{q.done ? <Check size={18} color="#000" /> : <Trophy size={14} color={TH.gold} />}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600 }}>{q.t}</div>
                {!q.done && q.prog != null && (
                  <>
                    <div style={{ marginTop:4, height:4, borderRadius:2, background:"rgba(0,0,0,0.4)" }}>
                      <div style={{
                        height:"100%", borderRadius:2,
                        width: `${Math.min(100, (q.prog / q.goal) * 100)}%`,
                        background: `linear-gradient(90deg,${TH.cyan},${TH.magenta})`,
                      }} />
                    </div>
                    <div style={{ fontSize:10, color:TH.dim, fontFamily:TH.mono, marginTop:2 }}>
                      {q.prog.toLocaleString()} / {q.goal.toLocaleString()}
                    </div>
                  </>
                )}
              </div>
              <div style={{ color:q.done ? TH.green : TH.gold, fontFamily:TH.mono, fontSize:12, fontWeight:700 }}>
                {q.done ? "✓ " : "+"}{q.p} XP
              </div>
            </div>
          ))}
        </div>

        <div className="glass-card" style={{ padding:18, borderRadius:12 }}>
          <h3 style={{ marginTop:0, fontFamily:TH.display, letterSpacing:"0.15em" }}>LEADERBOARD</h3>
          {[
            { r:1, n:"CryptoNinja", v:"$2.4M" },
            { r:2, n:"OmniWhale", v:"$1.8M" },
            { r:3, n:"DefiKing", v:"$1.2M" },
            { r:4, n:"MoonLord", v:"$980K" },
            { r:47, n:"You", v:"$142K", me:true },
          ].map((p, i) => (
            <div key={i} style={{
              padding:"10px 12px", marginBottom:6, borderRadius:8,
              background: p.me ? `linear-gradient(135deg,${TH.cyan}22,${TH.magenta}22)` : "rgba(0,0,0,0.25)",
              border: p.me ? `1px solid ${TH.cyan}` : `1px solid ${TH.border}`,
              display:"flex", alignItems:"center", gap:12,
            }}>
              <div style={{
                width:28, height:28, borderRadius:"50%",
                background: p.r <= 3 ? TH.gold : "rgba(0,0,0,0.5)",
                color: p.r <= 3 ? "#000" : TH.dim,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontFamily:TH.display, fontWeight:900, fontSize:12,
              }}>{p.r}</div>
              <div style={{ flex:1, fontFamily:TH.display, fontWeight:700 }}>{p.n}</div>
              <div style={{ fontFamily:TH.mono, color:TH.green, fontWeight:700 }}>{p.v}</div>
            </div>
          ))}
        </div>

        <div className="glass-card" style={{ padding:18, borderRadius:12 }}>
          <h3 style={{ marginTop:0, fontFamily:TH.display, letterSpacing:"0.15em" }}>TIER LADDER</h3>
          {tiers.map((t, i) => {
            const unlocked = level >= t.min;
            const isCurrent = t.name === currentTier.name;
            return (
              <div key={i} style={{
                padding:"10px 12px", marginBottom:6, borderRadius:8,
                background: isCurrent ? `${t.color}15` : "rgba(0,0,0,0.25)",
                border: isCurrent ? `1px solid ${t.color}` : `1px solid ${TH.border}`,
                display:"flex", alignItems:"center", gap:12,
                opacity: unlocked ? 1 : 0.4,
              }}>
                <div style={{
                  width:28, height:28, borderRadius:"50%",
                  background: unlocked ? t.color : "rgba(0,0,0,0.5)",
                  color: unlocked ? "#000" : TH.dim,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontFamily:TH.display, fontWeight:900, fontSize:11,
                }}>{t.min}</div>
                <div style={{ flex:1, fontFamily:TH.display, fontWeight:700, color:unlocked ? TH.text : TH.dim }}>
                  {t.name}
                  {isCurrent && <span style={{ fontSize:9, marginLeft:8, color:t.color, letterSpacing:"0.15em" }}>· CURRENT</span>}
                </div>
                <div style={{ fontFamily:TH.mono, color:unlocked ? t.color : TH.dim, fontSize:12, fontWeight:700 }}>
                  {t.mul}×
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ══════════ WALLET MODAL ══════════════════════════════════════════════ */

export default RewardsView;
