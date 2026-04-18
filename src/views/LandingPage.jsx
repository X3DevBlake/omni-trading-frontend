import React from "react";
import { Wallet, TrendingUp, Zap, Droplet, Sprout, Gauge, Trophy, Globe, Repeat, Sparkles, Flame, Shield, Rocket, Activity } from "lucide-react";
import { Footer } from "../components/Footer";
import { LivePrice } from "../components/LivePrice";
import { OmniLogo } from "../components/OmniLogo";
import { Sparkline } from "../components/Sparkline";
import { TokenIcon } from "../components/TokenIcon";
import { fmtPct, fmtUsd } from "../lib/formatters";
import { TH } from "../theme";

export function LandingPage({ onEnter, onConnect, coins, connected, account, status }) {
  const top = coins.slice(0, 6);
  const gainer = [...coins].filter(c => c.price_change_percentage_24h != null)
    .sort((a,b) => b.price_change_percentage_24h - a.price_change_percentage_24h)[0];

  const stats = [
    { label:"Tokens Tracked",   value: coins.length || 250, suffix:"+", icon:Globe },
    { label:"24h Volume",        value: 12.4, suffix:"B", prefix:"$", icon:Activity },
    { label:"Avg Execution",      value: 0.28, suffix:"s", icon:Zap },
    { label:"Chains Supported",   value: 14,  suffix:"+", icon:Shield },
  ];

  return (
    <div style={{ position:"relative", zIndex:2 }}>
      {/* Landing top-bar: minimal */}
      <header style={{
        position:"sticky", top:0, zIndex:40,
        display:"flex", alignItems:"center", gap:16,
        padding:"16px 32px",
        background:"linear-gradient(180deg,rgba(3,6,13,0.75) 0%,rgba(3,6,13,0.35) 100%)",
        backdropFilter:"blur(14px) saturate(180%)",
        WebkitBackdropFilter:"blur(14px) saturate(180%)",
        borderBottom:`1px solid ${TH.border}`,
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }} className="anim-fadeIn">
          <OmniLogo size={48} />
          <div>
            <div className="omni-title" style={{ fontSize:20, lineHeight:1 }}>OMNI TRADING</div>
            <div style={{ fontSize:9, color:TH.dim, letterSpacing:"0.35em", marginTop:3 }}>
              THE INFINITE EXCHANGE
            </div>
          </div>
        </div>
        <div style={{ flex:1 }} />
        <div className="anim-fadeIn delay-2" style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span className="pill" style={{ color:TH.green, borderColor:`${TH.green}44` }}>
            <span className="status-dot" style={{ background:TH.green, boxShadow:`0 0 8px ${TH.green}` }} />
            {status === "live" ? "LIVE MARKET DATA" : status === "loading" ? "CONNECTING" : "CACHED"}
          </span>
          <button className="btn-ghost" onClick={() => onEnter("markets")} style={{ padding:"10px 18px", borderRadius:10, fontSize:11 }}>
            LAUNCH APP
          </button>
          {connected ? (
            <button onClick={onConnect} className="btn-neon" style={{
              padding:"10px 16px", borderRadius:10, fontSize:11,
              display:"flex", alignItems:"center", gap:8,
            }}>
              <Wallet size={13} /> {account?.address}
            </button>
          ) : (
            <button className="btn-primary" onClick={onConnect} style={{
              padding:"11px 20px", borderRadius:10, fontSize:11,
              display:"flex", alignItems:"center", gap:8,
            }}>
              <Wallet size={13} /> CONNECT
            </button>
          )}
        </div>
      </header>

      {/* Grid overlay + ambient orbs */}
      <div className="hero-grid" style={{
        position:"absolute", inset:"0 0 auto 0", height:"100vh",
        pointerEvents:"none", opacity:0.45, maskImage:"radial-gradient(ellipse at center,#000 30%,transparent 75%)",
        WebkitMaskImage:"radial-gradient(ellipse at center,#000 30%,transparent 75%)",
      }} />
      <div className="hero-glow-orb" style={{ width:520, height:520, top:60, left:-140, background:`radial-gradient(circle,${TH.cyan}66,transparent 70%)` }} />
      <div className="hero-glow-orb" style={{ width:460, height:460, top:200, right:-120, background:`radial-gradient(circle,${TH.magenta}55,transparent 70%)`, animationDelay:"-4s" }} />
      <div className="hero-glow-orb" style={{ width:380, height:380, top:720, left:"40%", background:`radial-gradient(circle,${TH.gold}44,transparent 70%)`, animationDelay:"-8s" }} />

      {/* HERO */}
      <section style={{
        position:"relative", zIndex:3,
        minHeight:"calc(100vh - 76px)",
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
        padding:"60px 32px 80px", textAlign:"center",
      }}>
        <div className="anim-scaleIn" style={{ marginBottom:24 }}>
          <div className="anim-float">
            <OmniLogo size={220} intensity={1.3} />
          </div>
        </div>

        <div className="anim-fadeUp delay-1 pill" style={{
          marginBottom:24, fontSize:10, letterSpacing:"0.3em",
          color:TH.cyan, borderColor:`${TH.cyan}55`,
          background:"linear-gradient(135deg,rgba(124,200,255,0.12),rgba(176,137,255,0.08))",
        }}>
          <Sparkles size={11} /> PHOTONIC-POWERED · SUB-SECOND EXECUTION · GASLESS SWAPS
        </div>

        <h1 className="hero-title anim-fadeUp delay-2" style={{
          fontSize:"clamp(48px, 8vw, 104px)",
          margin:"0 0 8px", lineHeight:0.95,
          textShadow:`0 0 80px rgba(124,200,255,0.3)`,
        }}>
          TRADE EVERYTHING.
        </h1>
        <h1 className="hero-title anim-fadeUp delay-3" style={{
          fontSize:"clamp(48px, 8vw, 104px)",
          margin:"0 0 28px", lineHeight:0.95,
          textShadow:`0 0 80px rgba(176,137,255,0.3)`,
        }}>
          EVERYWHERE. AT ONCE.
        </h1>

        <p className="anim-fadeUp delay-4" style={{
          maxWidth:720, margin:"0 auto 40px",
          fontSize:18, lineHeight:1.6, color:TH.dim,
          fontFamily:TH.font, fontWeight:400,
        }}>
          The hybrid CEX/DEX running on{" "}
          <span style={{ color:TH.cyan }}>live CoinGecko data</span> across{" "}
          <span style={{ color:TH.magenta }}>250+ assets</span>,{" "}
          <span style={{ color:TH.gold }}>14 chains</span>, and a photonic execution layer.
          Spot, futures, liquidity, farms — one omnidirectional terminal.
        </p>

        <div className="anim-fadeUp delay-5" style={{
          display:"flex", gap:14, flexWrap:"wrap", justifyContent:"center",
          marginBottom:80,
        }}>
          <button className="btn-primary anim-glow" onClick={() => onEnter("markets")} style={{
            padding:"16px 34px", borderRadius:12, fontSize:14,
            display:"flex", alignItems:"center", gap:10,
          }}>
            <Rocket size={16} /> ENTER THE OMNIVERSE
          </button>
          <button className="btn-neon" onClick={() => onEnter("swap")} style={{
            padding:"16px 28px", borderRadius:12, fontSize:13,
            display:"flex", alignItems:"center", gap:10,
          }}>
            <Repeat size={15} /> QUICK SWAP
          </button>
          <button className="btn-ghost" onClick={() => onEnter("rewards")} style={{
            padding:"16px 28px", borderRadius:12, fontSize:13,
            display:"flex", alignItems:"center", gap:10,
          }}>
            <Trophy size={15} /> EARN REWARDS
          </button>
        </div>

        {/* Live stat row */}
        <div style={{
          display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",
          gap:16, width:"100%", maxWidth:1040,
        }}>
          {stats.map((s, i) => {
            const I = s.icon;
            return (
              <div key={s.label} className={`glass-card anim-fadeUp delay-${i+5}`} style={{
                padding:"20px 22px", borderRadius:14, textAlign:"left",
              }}>
                <div style={{
                  display:"inline-flex", padding:9, borderRadius:10, marginBottom:12,
                  background:"linear-gradient(135deg,rgba(124,200,255,0.18),rgba(176,137,255,0.12))",
                  border:`1px solid ${TH.border}`,
                }}>
                  <I size={16} color={TH.cyan} />
                </div>
                <div style={{
                  fontFamily:TH.display, fontSize:28, fontWeight:900,
                  color:TH.text, letterSpacing:"0.02em",
                }} className="anim-fadeIn">
                  {s.prefix || ""}{typeof s.value === "number" && s.value < 100 ? s.value.toFixed(s.value % 1 ? 2 : 0) : s.value}{s.suffix || ""}
                </div>
                <div style={{ color:TH.dim, fontSize:11, letterSpacing:"0.18em", fontFamily:TH.mono, marginTop:4 }}>
                  {s.label.toUpperCase()}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* LIVE PREVIEW */}
      <section style={{ position:"relative", zIndex:3, padding:"40px 32px 60px" }}>
        <div style={{ maxWidth:1280, margin:"0 auto" }}>
          <div className="anim-fadeUp" style={{ textAlign:"center", marginBottom:36 }}>
            <div className="pill" style={{ color:TH.green, borderColor:`${TH.green}55`, marginBottom:14 }}>
              <span className="status-dot" style={{ background:TH.green, boxShadow:`0 0 8px ${TH.green}` }} />
              LIVE MARKETS
            </div>
            <h2 className="hero-title" style={{
              fontSize:"clamp(32px,5vw,56px)", margin:"0 0 10px", fontWeight:900, letterSpacing:"0.04em",
            }}>
              REAL PRICES. REAL TIME.
            </h2>
            <p style={{ color:TH.dim, fontSize:15, maxWidth:560, margin:"0 auto" }}>
              Prices, sparklines, and 24h changes — all streaming from CoinGecko every 60 seconds. Tap any token to jump straight into spot.
            </p>
          </div>

          <div style={{
            display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",
            gap:16,
          }}>
            {top.map((c, i) => (
              <button
                key={c.id}
                onClick={() => onEnter("spot")}
                className={`glass-card anim-fadeUp delay-${Math.min(i+1,6)}`}
                style={{
                  padding:20, borderRadius:14, cursor:"pointer",
                  textAlign:"left", color:"inherit", font:"inherit",
                  border:`1px solid ${TH.border}`, background:"rgba(10,16,32,0.6)",
                }}
              >
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
                  <TokenIcon coin={c} size={40} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:TH.display, fontWeight:700, fontSize:14, letterSpacing:"0.06em" }}>
                      {c.symbol?.toUpperCase()}
                    </div>
                    <div style={{ color:TH.dim, fontSize:11, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {c.name}
                    </div>
                  </div>
                  <div style={{
                    fontFamily:TH.mono, fontSize:10, fontWeight:700,
                    color: (c.price_change_percentage_24h||0) >= 0 ? TH.green : TH.red,
                    padding:"3px 8px", borderRadius:6,
                    background: (c.price_change_percentage_24h||0) >= 0 ? "rgba(74,222,160,0.1)" : "rgba(255,106,133,0.1)",
                    border:`1px solid ${(c.price_change_percentage_24h||0) >= 0 ? TH.green : TH.red}33`,
                  }}>
                    {fmtPct(c.price_change_percentage_24h)}
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", gap:12 }}>
                  <div>
                    <div style={{ fontFamily:TH.display, fontSize:22, fontWeight:900 }}>
                      <LivePrice coin={c} />
                    </div>
                    <div style={{ fontSize:10, color:TH.dim, fontFamily:TH.mono, letterSpacing:"0.15em", marginTop:2 }}>
                      MCAP {fmtUsd(c.market_cap)}
                    </div>
                  </div>
                  <Sparkline coin={c} w={110} h={40} />
                </div>
              </button>
            ))}
          </div>

          {gainer && (
            <div className="glass-card anim-fadeUp" style={{
              marginTop:24, padding:"18px 24px", borderRadius:14,
              display:"flex", alignItems:"center", gap:16, flexWrap:"wrap",
              border:`1px solid ${TH.green}44`,
              background:"linear-gradient(135deg,rgba(74,222,160,0.08),rgba(124,200,255,0.05))",
            }}>
              <div style={{
                padding:8, borderRadius:10,
                background:"linear-gradient(135deg,rgba(74,222,160,0.25),rgba(124,200,255,0.2))",
              }}>
                <Flame size={18} color={TH.green} />
              </div>
              <div style={{ flex:1, minWidth:200 }}>
                <div style={{ fontFamily:TH.mono, fontSize:10, color:TH.dim, letterSpacing:"0.2em" }}>
                  TOP GAINER (24h)
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:4 }}>
                  <TokenIcon coin={gainer} size={22} />
                  <span style={{ fontFamily:TH.display, fontWeight:700, fontSize:15 }}>
                    {gainer.name} · {gainer.symbol?.toUpperCase()}
                  </span>
                  <span style={{ color:TH.green, fontFamily:TH.mono, fontSize:13, fontWeight:700 }}>
                    {fmtPct(gainer.price_change_percentage_24h)}
                  </span>
                </div>
              </div>
              <button className="btn-neon" onClick={() => onEnter("markets")} style={{
                padding:"10px 18px", borderRadius:10, fontSize:11,
              }}>
                VIEW ALL MARKETS →
              </button>
            </div>
          )}
        </div>
      </section>


      {/* MARKET PULSE — pure CSS/SVG stat cards, zero external dependencies */}
      <section style={{ position:"relative", zIndex:3, padding:"40px 32px 0" }}>
        <div style={{ maxWidth:1280, margin:"0 auto" }}>
          <div className="anim-fadeUp" style={{ textAlign:"center", marginBottom:28 }}>
            <div className="pill" style={{ color:TH.gold, borderColor:`${TH.gold}55`, marginBottom:14, display:"inline-flex" }}>
              <Activity size={11} /> MARKET PULSE
            </div>
            <h2 className="hero-title" style={{
              fontSize:"clamp(26px,4vw,42px)", margin:"0 0 8px", fontWeight:900, letterSpacing:"0.04em",
            }}>
              ALWAYS IN MOTION.
            </h2>
            <p style={{ color:TH.dim, fontSize:14, maxWidth:520, margin:"0 auto" }}>
              Trading never sleeps — and neither does Omni.
            </p>
          </div>
          <div style={{
            display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:14,
          }}>
            {[
              { label:"24H ACTIVE PAIRS", value: coins.length > 0 ? coins.length : 250, unit:"", icon:Activity, color:TH.cyan },
              { label:"TOP GAINER 24H",   value: gainer?.symbol?.toUpperCase() || "—",
                unit: gainer ? fmtPct(gainer.price_change_percentage_24h) : "",
                icon:TrendingUp, color:TH.green },
              { label:"GLOBAL MCAP",     value:"$3.2", unit:"T", icon:Globe, color:TH.magenta },
              { label:"AVG FILL TIME",    value:"0.28", unit:"s", icon:Zap, color:TH.gold },
            ].map((stat, i) => {
              const I = stat.icon;
              return (
                <div key={i} className={`glass-card anim-fadeUp delay-${i+1}`} style={{
                  padding:"22px 20px", borderRadius:14, position:"relative", overflow:"hidden",
                }}>
                  {/* Ambient glow ellipse */}
                  <div style={{
                    position:"absolute", width:160, height:160, borderRadius:"50%",
                    top:-60, right:-40, background:`radial-gradient(circle,${stat.color}22,transparent 70%)`,
                    pointerEvents:"none", filter:"blur(12px)",
                  }} />
                  <div style={{
                    display:"inline-flex", padding:8, borderRadius:10, marginBottom:12,
                    background:`linear-gradient(135deg,${stat.color}22,${stat.color}08)`,
                    border:`1px solid ${stat.color}44`,
                    position:"relative",
                  }}>
                    <I size={15} color={stat.color} />
                  </div>
                  <div style={{ fontFamily:TH.display, fontSize:26, fontWeight:900, color:TH.text, lineHeight:1 }}>
                    {stat.value}<span style={{ fontSize:16, marginLeft:2, color:stat.color }}>{stat.unit}</span>
                  </div>
                  <div style={{
                    color:TH.dim, fontSize:10, letterSpacing:"0.22em",
                    fontFamily:TH.mono, marginTop:8,
                  }}>{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ position:"relative", zIndex:3, padding:"60px 32px" }}>
        <div style={{ maxWidth:1280, margin:"0 auto" }}>
          <div className="anim-fadeUp" style={{ textAlign:"center", marginBottom:48 }}>
            <h2 className="hero-title" style={{
              fontSize:"clamp(32px,5vw,56px)", margin:"0 0 10px", fontWeight:900, letterSpacing:"0.04em",
            }}>
              ONE TERMINAL. EVERY ANGLE.
            </h2>
          </div>
          <div style={{
            display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",
            gap:18,
          }}>
            {[
              { i:TrendingUp, t:"Spot Trading",    d:"Deep orderbooks on 250+ pairs with sub-second execution.", c:TH.cyan,    go:"spot" },
              { i:Gauge,      t:"Perp Futures",     d:"Up to 100× leverage. Isolated, cross, or auto.",            c:TH.magenta, go:"futures" },
              { i:Repeat,     t:"Omni Swap",        d:"Best-route aggregator across 14 chains. Gasless.",           c:TH.gold,    go:"swap" },
              { i:Droplet,    t:"Liquidity Pools",  d:"Concentrated LPs paying out in OMNI. Auto-rebalance.",       c:TH.green,   go:"liquidity" },
              { i:Sprout,     t:"Yield Farms",      d:"Single-stake and LP farms with auto-compound toggle.",       c:TH.cyan,    go:"farms" },
              { i:Trophy,     t:"Quests & XP",      d:"Trade to level up. Unlock fee tiers and airdrops.",           c:TH.gold,    go:"rewards" },
            ].map((f, i) => {
              const I = f.i;
              return (
                <button
                  key={f.t}
                  onClick={() => onEnter(f.go)}
                  className={`glass-card anim-fadeUp delay-${Math.min(i+1,6)}`}
                  style={{
                    padding:24, borderRadius:14, cursor:"pointer",
                    textAlign:"left", color:"inherit", font:"inherit",
                    border:`1px solid ${TH.border}`,
                  }}
                >
                  <div style={{
                    display:"inline-flex", padding:12, borderRadius:12, marginBottom:16,
                    background:`linear-gradient(135deg,${f.c}22,${f.c}08)`,
                    border:`1px solid ${f.c}44`,
                    boxShadow:`0 0 24px ${f.c}22`,
                  }}>
                    <I size={22} color={f.c} />
                  </div>
                  <div style={{ fontFamily:TH.display, fontSize:18, fontWeight:700, marginBottom:6, letterSpacing:"0.04em" }}>
                    {f.t}
                  </div>
                  <div style={{ color:TH.dim, fontSize:13, lineHeight:1.55 }}>
                    {f.d}
                  </div>
                  <div style={{
                    marginTop:14, color:f.c, fontFamily:TH.mono, fontSize:10,
                    letterSpacing:"0.25em", display:"flex", alignItems:"center", gap:6,
                  }}>
                    OPEN →
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section style={{ position:"relative", zIndex:3, padding:"60px 32px 100px" }}>
        <div className="glass-card anim-fadeUp" style={{
          maxWidth:1080, margin:"0 auto", padding:"50px 40px",
          borderRadius:22, textAlign:"center",
          border:`1px solid ${TH.borderStrong}`,
          background:"linear-gradient(135deg,rgba(124,200,255,0.08) 0%,rgba(176,137,255,0.08) 50%,rgba(255,213,122,0.06) 100%)",
          boxShadow:"0 30px 80px rgba(124,200,255,0.15),0 0 0 1px rgba(124,200,255,0.2)",
        }}>
          <div style={{ marginBottom:18 }} className="anim-floatSlow">
            <OmniLogo size={88} intensity={1.1} />
          </div>
          <h3 className="hero-title" style={{
            fontSize:"clamp(26px,4vw,42px)", margin:"0 0 12px", fontWeight:900, letterSpacing:"0.04em",
          }}>
            READY TO GO OMNIDIRECTIONAL?
          </h3>
          <p style={{ color:TH.dim, fontSize:15, maxWidth:520, margin:"0 auto 28px" }}>
            Hit the button. The wormhole opens and you're inside the terminal.
          </p>
          <button className="btn-primary anim-glow" onClick={() => onEnter("markets")} style={{
            padding:"18px 40px", borderRadius:14, fontSize:15,
            display:"inline-flex", alignItems:"center", gap:12,
          }}>
            <Rocket size={18} /> ENGAGE WARP
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   SIDEBAR NAV — collapsible, grouped, with active-state rail
   ══════════════════════════════════════════════════════════════════════ */

export default LandingPage;
