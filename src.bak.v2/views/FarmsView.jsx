import React, { useState, useMemo } from "react";
import { X } from "lucide-react";
import { Row } from "../components/Row";
import { TokenIcon } from "../components/TokenIcon";
import { fmtUsd } from "../lib/formatters";
import { TH } from "../theme";

export function FarmsView({ coins }) {
  const [autoCompound, setAutoCompound] = useState(true);
  const [activeFarm, setActiveFarm] = useState(null);
  const [stakeAmount, setStakeAmount] = useState("500");

  // Base APRs grounded in realistic DeFi farming ranges
  const farms = useMemo(() => [
    { name:"OMNI-USDT", baseApr: 95.0, multiplier:40, staked:85_000_000, a:{ symbol:"OMNI", image:null }, b:coins[2] },
    { name:"BTC-USDT LP", baseApr: 32.5, multiplier:20, staked:45_000_000, a:coins[0], b:coins[2] },
    { name:"ETH-USDT LP", baseApr: 42.0, multiplier:25, staked:38_000_000, a:coins[1], b:coins[2] },
    { name:"SOL-USDT LP", baseApr: 58.0, multiplier:15, staked:18_000_000, a:coins[4], b:coins[2] },
    { name:"BNB-USDT LP", baseApr: 36.5, multiplier:10, staked:22_000_000, a:coins[3], b:coins[2] },
    { name:"AVAX-USDT LP", baseApr: 82.0, multiplier:8,  staked: 6_500_000, a:coins[9], b:coins[2] },
  ].filter(f => f.a && f.b), [coins]);

  // APY from APR with daily compounding: APY = (1 + APR/365)^365 - 1
  const aprToApy = (apr) => (Math.pow(1 + (apr/100/365), 365) - 1) * 100;

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14, flexWrap:"wrap" }}>
        <div>
          <h2 style={{ margin:"0 0 4px", fontFamily:TH.display, letterSpacing:"0.15em" }}>YIELD FARMS</h2>
          <div style={{ color:TH.dim, fontSize:12 }}>
            Stake LP tokens to earn OMNI. Auto-compound reinvests rewards daily.
          </div>
        </div>
        <div style={{ flex:1 }} />
        <label style={{ display:"flex", alignItems:"center", gap:10, fontFamily:TH.display, fontSize:12, letterSpacing:"0.12em", color:TH.dim }}>
          AUTO-COMPOUND
          <button onClick={() => setAutoCompound(!autoCompound)} style={{
            width:44, height:22, borderRadius:11, position:"relative",
            background: autoCompound ? TH.green : "rgba(0,0,0,0.5)",
            border:`1px solid ${autoCompound ? TH.green : TH.border}`,
            cursor:"pointer",
          }}>
            <div style={{
              position:"absolute", top:1, left: autoCompound ? 23 : 1,
              width:18, height:18, borderRadius:"50%",
              background:"#fff", transition:"left 0.2s",
            }} />
          </button>
        </label>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(360px,1fr))", gap:14 }}>
        {farms.map((f, i) => {
          const apr = f.baseApr;
          const apy = aprToApy(apr);
          const displayRate = autoCompound ? apy : apr;
          return (
            <div key={i} className="glass-card" style={{ padding:18, borderRadius:12, position:"relative", overflow:"hidden" }}>
              {i === 0 && (
                <div style={{
                  position:"absolute", top:0, right:0,
                  padding:"3px 10px", fontSize:10, fontFamily:TH.display, letterSpacing:"0.12em",
                  background:`linear-gradient(135deg,${TH.gold},${TH.magenta})`,
                  color:"#000", fontWeight:900, borderBottomLeftRadius:8,
                }}>{f.multiplier}× FEATURED</div>
              )}
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
                <div style={{ display:"flex" }}>
                  <TokenIcon coin={f.a} size={44} />
                  <div style={{ marginLeft:-12 }}><TokenIcon coin={f.b} size={44} /></div>
                </div>
                <div>
                  <div style={{ fontWeight:700, fontFamily:TH.display, fontSize:16 }}>{f.name}</div>
                  <div style={{ fontSize:10, color:TH.dim, fontFamily:TH.mono }}>{f.multiplier}× MULTIPLIER</div>
                </div>
              </div>
              <div style={{
                padding:14, borderRadius:8, marginBottom:12,
                background:`linear-gradient(135deg,rgba(124,200,255,0.1),rgba(176,137,255,0.1))`,
                border:`1px solid ${TH.borderStrong}`,
              }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
                  <div style={{ fontSize:10, color:TH.dim, fontFamily:TH.display, letterSpacing:"0.15em" }}>
                    {autoCompound ? "APY (AUTO-COMPOUND)" : "APR (SIMPLE)"}
                  </div>
                  <div style={{ fontSize:9, color:TH.dim, fontFamily:TH.mono }}>
                    Base {apr.toFixed(1)}%
                  </div>
                </div>
                <div style={{ fontSize:28, fontWeight:900, fontFamily:TH.mono, color:TH.green }}>
                  {displayRate.toFixed(2)}%
                </div>
              </div>
              <Row k="Total Staked" v={fmtUsd(f.staked)} />
              <Row k="My Stake" v="$0.00" />
              <Row k="Pending Rewards" v="0 OMNI" />
              <button
                className="btn-primary"
                onClick={() => { setActiveFarm({ ...f, apr, apy }); setStakeAmount("500"); }}
                style={{ width:"100%", padding:10, borderRadius:8, fontSize:12, marginTop:12 }}
              >
                STAKE LP
              </button>
            </div>
          );
        })}
      </div>

      {activeFarm && (
        <FarmStakeModal
          farm={activeFarm}
          autoCompound={autoCompound}
          amount={stakeAmount}
          setAmount={setStakeAmount}
          onClose={() => setActiveFarm(null)}
        />
      )}
    </div>
  );
}

export function FarmStakeModal({ farm, autoCompound, amount, setAmount, onClose }) {
  const usd = parseFloat(amount) || 0;
  const apr = farm.apr;
  const apy = farm.apy;
  const rate = autoCompound ? apy : apr;
  // Simple returns
  const simpleDaily = usd * apr / 100 / 365;
  const simpleWeekly = simpleDaily * 7;
  const simpleMonthly = simpleDaily * 30;
  const simpleYearly = usd * apr / 100;
  // Auto-compound returns (daily reinvestment)
  const compMonthly = usd * (Math.pow(1 + (apr/100/365), 30) - 1);
  const compYearly = usd * (apy / 100);
  const showMonthly = autoCompound ? compMonthly : simpleMonthly;
  const showYearly  = autoCompound ? compYearly : simpleYearly;

  return (
    <div onClick={onClose} style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", backdropFilter:"blur(10px)",
      zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20,
    }}>
      <div onClick={e => e.stopPropagation()} className="glass" style={{
        width:"100%", maxWidth:460, borderRadius:16, padding:24, maxHeight:"90vh", overflowY:"auto",
      }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <div>
            <h3 style={{ margin:0, fontFamily:TH.display, letterSpacing:"0.15em", fontSize:16 }}>STAKE LP TOKENS</h3>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:8 }}>
              <TokenIcon coin={farm.a} size={22} />
              <TokenIcon coin={farm.b} size={22} />
              <span style={{ fontFamily:TH.mono, fontSize:13 }}>{farm.name}</span>
              <span style={{ fontSize:9, padding:"2px 6px", borderRadius:4, background:`${TH.gold}22`, color:TH.gold, letterSpacing:"0.1em" }}>{farm.multiplier}×</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:TH.dim, cursor:"pointer" }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ marginBottom:18 }}>
          <div style={{ fontSize:11, color:TH.dim, marginBottom:6, fontFamily:TH.mono, letterSpacing:"0.15em" }}>STAKE AMOUNT (USD)</div>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} style={{
            width:"100%", padding:"14px 16px", background:"rgba(0,0,0,0.4)",
            border:`1px solid ${TH.borderStrong}`, borderRadius:10,
            color:TH.text, fontFamily:TH.mono, fontSize:22, fontWeight:700,
          }} />
          <div style={{ display:"flex", gap:6, marginTop:8 }}>
            {[100, 500, 1000, 5000, 10000].map(v => (
              <button key={v} onClick={() => setAmount(String(v))} style={{
                flex:1, padding:"6px 0", background:"rgba(0,0,0,0.3)",
                border:`1px solid ${TH.border}`, borderRadius:6,
                color:TH.dim, fontSize:10, fontFamily:TH.mono, cursor:"pointer",
              }}>${v >= 1000 ? `${v/1000}K` : v}</button>
            ))}
          </div>
        </div>

        <div style={{
          padding:14, background:"rgba(74,222,160,0.06)",
          border:`1px solid ${TH.green}33`, borderRadius:10, marginBottom:14,
        }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <span style={{ fontSize:11, fontFamily:TH.mono, color:TH.dim, letterSpacing:"0.15em" }}>
              PROJECTED REWARDS · {autoCompound ? "AUTO-COMPOUND" : "SIMPLE"}
            </span>
            <span style={{ fontFamily:TH.mono, fontSize:12, color:TH.green, fontWeight:700 }}>
              {rate.toFixed(2)}%
            </span>
          </div>
          <Row k="Per day" v={<span style={{ color:TH.green }}>+{fmtUsd(simpleDaily)}</span>} />
          <Row k="Per week" v={<span style={{ color:TH.green }}>+{fmtUsd(simpleWeekly)}</span>} />
          <Row k="Per month" v={<span style={{ color:TH.green }}>+{fmtUsd(showMonthly)}</span>} />
          <Row k="Per year" v={<span style={{ color:TH.gold, fontWeight:700 }}>+{fmtUsd(showYearly)}</span>} />
          <Row k="Final balance (1yr)" v={<span style={{ color:TH.text, fontWeight:700 }}>{fmtUsd(usd + showYearly)}</span>} />
        </div>

        <div style={{
          padding:12, background:"rgba(255,213,122,0.06)",
          border:`1px solid ${TH.gold}33`, borderRadius:10, marginBottom:14,
          fontSize:11, color:TH.dim,
        }}>
          <strong style={{ color:TH.gold }}>⚠ Reward rates are variable:</strong> APR depends on total staked, emission rate, and OMNI price. Past returns don&apos;t guarantee future results.
        </div>

        <button className="btn-primary" style={{ width:"100%", padding:14, borderRadius:10, fontSize:13 }}>
          CONFIRM STAKE
        </button>
      </div>
    </div>
  );
}

/* ══════════ PORTFOLIO VIEW ════════════════════════════════════════════ */

export default FarmsView;
