import React, { useState, useEffect, useMemo } from "react";
import { Copy } from "lucide-react";
import { Field } from "../components/Field";
import { Row } from "../components/Row";
import { TokenIcon } from "../components/TokenIcon";
import { usePaperTrading } from "../hooks/usePaperTrading";
import { fmtPct, fmtUsd } from "../lib/formatters";
import { TH } from "../theme";

export function PortfolioView({ coins, connected }) {
  const [tab, setTab] = useState("assets");
  const [hidden, setHidden] = useState(false);
  const paper = usePaperTrading();

  // Mock holdings mapped to real coins for realistic prices
  const holdings = useMemo(() => {
    if (!coins.length) return [];
    return [
      { coin: coins.find(c => c.symbol === "btc") || coins[0], amount: 0.185 },
      { coin: coins.find(c => c.symbol === "eth") || coins[1], amount: 3.2 },
      { coin: coins.find(c => c.symbol === "usdt") || coins[2], amount: 2400 },
      { coin: coins.find(c => c.symbol === "sol") || coins[4], amount: 22 },
      { coin: coins.find(c => c.symbol === "bnb") || coins[3], amount: 4.1 },
      { coin: coins.find(c => c.symbol === "doge") || coins[7], amount: 15000 },
    ].filter(h => h.coin);
  }, [coins]);

  const totalValue = holdings.reduce((s, h) => s + h.amount * (h.coin?.current_price || 0), 0);

  return (
    <div>
      <div className="glass" style={{ padding:24, borderRadius:16, marginBottom:16,
        background:`linear-gradient(135deg,rgba(124,200,255,0.1),rgba(176,137,255,0.1))` }}>
        <div style={{ fontSize:12, color:TH.dim, fontFamily:TH.display, letterSpacing:"0.15em", marginBottom:6 }}>
          TOTAL PORTFOLIO VALUE
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ fontSize:44, fontWeight:900, fontFamily:TH.mono,
            background:`linear-gradient(135deg,${TH.cyan},${TH.magenta})`,
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            {hidden ? "•••••" : fmtUsd(totalValue)}
          </div>
          <button onClick={() => setHidden(!hidden)} style={{
            background:"none", border:"none", color:TH.dim, cursor:"pointer",
          }}>{hidden ? "SHOW" : "HIDE"}</button>
        </div>
        <div style={{ marginTop:8, color:TH.green, fontFamily:TH.mono, fontSize:14 }}>
          +$248.14 (+2.14%) 24h
        </div>

        {/* Paper trading summary — only shown when backend is reachable */}
        {paper.summary && (paper.summary.openCount > 0 || paper.summary.closedCount > 0) && (
          <div style={{
            marginTop:18, paddingTop:14, borderTop:`1px solid ${TH.border}`,
            display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))", gap:12,
          }}>
            <div>
              <div style={{ fontSize:9, color:TH.dim, fontFamily:TH.mono, letterSpacing:"0.2em" }}>PAPER · OPEN</div>
              <div style={{ fontSize:18, fontFamily:TH.mono, fontWeight:700, color:TH.text }}>
                {paper.summary.openCount}
              </div>
            </div>
            <div>
              <div style={{ fontSize:9, color:TH.dim, fontFamily:TH.mono, letterSpacing:"0.2em" }}>CLOSED</div>
              <div style={{ fontSize:18, fontFamily:TH.mono, fontWeight:700, color:TH.text }}>
                {paper.summary.closedCount}
              </div>
            </div>
            <div>
              <div style={{ fontSize:9, color:TH.dim, fontFamily:TH.mono, letterSpacing:"0.2em" }}>REALIZED PNL</div>
              <div style={{ fontSize:18, fontFamily:TH.mono, fontWeight:700,
                color: (paper.summary.totalRealizedPnl || 0) >= 0 ? TH.green : TH.red }}>
                {fmtUsd(paper.summary.totalRealizedPnl)}
              </div>
            </div>
            <div>
              <div style={{ fontSize:9, color:TH.dim, fontFamily:TH.mono, letterSpacing:"0.2em" }}>WIN RATE</div>
              <div style={{ fontSize:18, fontFamily:TH.mono, fontWeight:700, color:TH.text }}>
                {paper.summary.closedCount ? (paper.summary.winRate * 100).toFixed(0) + "%" : "—"}
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ display:"flex", gap:4, marginBottom:14, flexWrap:"wrap" }}>
        {["assets","paper","deposits","withdrawals","rewards","history"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding:"9px 16px", borderRadius:8,
            background: tab === t ? `linear-gradient(135deg,${TH.cyan}33,${TH.magenta}33)` : "rgba(0,0,0,0.35)",
            border: tab === t ? `1px solid ${TH.cyan}` : `1px solid ${TH.border}`,
            color: tab === t ? TH.cyan : TH.dim,
            fontFamily:TH.display, fontSize:11, letterSpacing:"0.12em", cursor:"pointer",
          }}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab === "assets" && (
        <div className="glass" style={{ borderRadius:12, overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"rgba(124,200,255,0.05)" }}>
                {["ASSET","BALANCE","PRICE","VALUE","24H","ACTIONS"].map(h => (
                  <th key={h} style={{ padding:"12px", textAlign:"left", fontFamily:TH.display, fontSize:11, color:TH.dim, letterSpacing:"0.12em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {holdings.map((h, i) => (
                <tr key={i} style={{ borderTop:`1px solid ${TH.border}` }}>
                  <td style={{ padding:"12px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <TokenIcon coin={h.coin} size={32} />
                      <div>
                        <div style={{ fontWeight:700 }}>{h.coin.symbol?.toUpperCase()}</div>
                        <div style={{ fontSize:11, color:TH.dim }}>{h.coin.name}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:"12px", fontFamily:TH.mono }}>{h.amount}</td>
                  <td style={{ padding:"12px", fontFamily:TH.mono }}>{fmtUsd(h.coin.current_price)}</td>
                  <td style={{ padding:"12px", fontFamily:TH.mono, fontWeight:700 }}>{fmtUsd(h.amount * (h.coin.current_price || 0))}</td>
                  <td style={{ padding:"12px", fontFamily:TH.mono,
                    color: (h.coin.price_change_percentage_24h || 0) >= 0 ? TH.green : TH.red }}>
                    {fmtPct(h.coin.price_change_percentage_24h)}
                  </td>
                  <td style={{ padding:"12px" }}>
                    <div style={{ display:"flex", gap:4 }}>
                      {["Swap","Send","Receive"].map(a => (
                        <button key={a} className="btn-neon" style={{ padding:"4px 10px", borderRadius:6, fontSize:10 }}>{a}</button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "paper" && (
        <PaperPositionsTab paper={paper} coins={coins} />
      )}

      {tab === "deposits" && <DepositsTab coins={coins} />}
      {tab === "withdrawals" && <WithdrawalsTab coins={coins} />}
      {tab === "rewards" && <RewardsTab />}
      {tab === "history" && <HistoryTab coins={coins} />}
    </div>
  );
}

export function DepositsTab({ coins }) {
  const [coin, setCoin] = useState(coins[0]);
  useEffect(() => { if (!coin && coins[0]) setCoin(coins[0]); }, [coins]);
  return (
    <div className="glass" style={{ padding:24, borderRadius:12 }}>
      <h3 style={{ marginTop:0, fontFamily:TH.display, letterSpacing:"0.15em" }}>DEPOSIT CRYPTO</h3>
      <select onChange={e => setCoin(coins.find(c => c.id === e.target.value))} value={coin?.id || ""} style={{
        width:"100%", padding:10, marginBottom:14,
        background:"rgba(0,0,0,0.4)", border:`1px solid ${TH.border}`, borderRadius:8, color:TH.text, fontFamily:TH.mono,
      }}>
        {coins.slice(0, 30).map(c => <option key={c.id} value={c.id}>{c.symbol?.toUpperCase()} — {c.name}</option>)}
      </select>
      <div style={{ padding:20, background:"rgba(0,0,0,0.35)", borderRadius:8, textAlign:"center" }}>
        <div style={{ width:160, height:160, background:"#fff", margin:"0 auto 14px",
          borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", color:"#000", fontFamily:TH.mono }}>
          [QR CODE]
        </div>
        <div style={{ fontSize:11, color:TH.dim, marginBottom:6, fontFamily:TH.display, letterSpacing:"0.12em" }}>YOUR {coin?.symbol?.toUpperCase()} ADDRESS</div>
        <div style={{ fontFamily:TH.mono, fontSize:12, wordBreak:"break-all", padding:10, background:"rgba(0,0,0,0.5)", borderRadius:6 }}>
          0x7aF3e8a2B9cD4e5F1a8B9cD4e5F1a8B9cD4e5F1a
        </div>
        <button className="btn-neon" style={{ marginTop:10, padding:"8px 16px", borderRadius:6, fontSize:11 }}>
          <Copy size={12} /> COPY
        </button>
      </div>
    </div>
  );
}

export function WithdrawalsTab({ coins }) {
  const [coin, setCoin] = useState(coins[0]);
  useEffect(() => { if (!coin && coins[0]) setCoin(coins[0]); }, [coins]);
  return (
    <div className="glass" style={{ padding:24, borderRadius:12 }}>
      <h3 style={{ marginTop:0, fontFamily:TH.display, letterSpacing:"0.15em" }}>WITHDRAW CRYPTO</h3>
      <select onChange={e => setCoin(coins.find(c => c.id === e.target.value))} value={coin?.id || ""} style={{
        width:"100%", padding:10, marginBottom:14,
        background:"rgba(0,0,0,0.4)", border:`1px solid ${TH.border}`, borderRadius:8, color:TH.text, fontFamily:TH.mono,
      }}>
        {coins.slice(0, 30).map(c => <option key={c.id} value={c.id}>{c.symbol?.toUpperCase()} — {c.name}</option>)}
      </select>
      <Field label="DESTINATION ADDRESS" value="" onChange={() => {}} />
      <Field label={`AMOUNT (${coin?.symbol?.toUpperCase()})`} value="" onChange={() => {}} />
      <div style={{ padding:12, background:"rgba(0,0,0,0.35)", borderRadius:8, marginBottom:14, fontFamily:TH.mono, fontSize:11, color:TH.dim }}>
        <Row k="Network Fee" v={`0.0005 ${coin?.symbol?.toUpperCase()}`} />
        <Row k="Min Withdraw" v={`0.001 ${coin?.symbol?.toUpperCase()}`} />
      </div>
      <button className="btn-primary" style={{ width:"100%", padding:12, borderRadius:8, fontSize:13 }}>WITHDRAW</button>
    </div>
  );
}

export function RewardsTab() {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:14 }}>
      {[
        { label:"Trading Rewards", v:"142.8 OMNI", sub:"$285.60" },
        { label:"Staking Rewards", v:"38.2 OMNI", sub:"$76.40" },
        { label:"Referral Bonuses", v:"24.1 OMNI", sub:"$48.20" },
        { label:"Airdrop Claims", v:"500 OMNI", sub:"$1,000.00" },
      ].map(r => (
        <div key={r.label} className="glass" style={{ padding:18, borderRadius:12 }}>
          <div style={{ fontSize:10, color:TH.dim, fontFamily:TH.display, letterSpacing:"0.15em" }}>{r.label.toUpperCase()}</div>
          <div style={{ fontSize:26, fontWeight:900, fontFamily:TH.mono, margin:"8px 0 4px", color:TH.gold }}>{r.v}</div>
          <div style={{ fontSize:12, color:TH.dim, fontFamily:TH.mono }}>{r.sub}</div>
          <button className="btn-primary" style={{ width:"100%", padding:8, borderRadius:6, fontSize:11, marginTop:12 }}>CLAIM</button>
        </div>
      ))}
    </div>
  );
}

export function HistoryTab({ coins }) {
  const hist = useMemo(() => {
    if (!coins.length) return [];
    return [
      { t:"Swap", a:coins[0], b:coins[2], amt:"0.02 → 1,348 USDT", time:"2h ago", status:"Complete" },
      { t:"Deposit", a:coins[1], amt:"+1.5 ETH", time:"1d ago", status:"Complete" },
      { t:"Trade", a:coins[4], amt:"+10 SOL @ $178.40", time:"2d ago", status:"Complete" },
      { t:"Withdraw", a:coins[2], amt:"-500 USDT", time:"3d ago", status:"Complete" },
      { t:"Farm Stake", a:coins[0], amt:"BTC-USDT LP", time:"5d ago", status:"Active" },
    ];
  }, [coins]);
  return (
    <div className="glass" style={{ borderRadius:12, overflow:"hidden" }}>
      {hist.map((h, i) => (
        <div key={i} style={{
          padding:"14px 20px", borderBottom: i < hist.length-1 ? `1px solid ${TH.border}` : "none",
          display:"flex", alignItems:"center", gap:14,
        }}>
          <TokenIcon coin={h.a} size={32} />
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontFamily:TH.display, letterSpacing:"0.08em" }}>{h.t.toUpperCase()}</div>
            <div style={{ fontSize:12, color:TH.dim, fontFamily:TH.mono }}>{h.amt}</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:11, color:TH.green, fontFamily:TH.mono }}>{h.status}</div>
            <div style={{ fontSize:11, color:TH.dim, fontFamily:TH.mono }}>{h.time}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ══════════ BUY CRYPTO VIEW ═══════════════════════════════════════════ */

function PaperPositionsTab({ paper, coins }) {
  if (!paper.positions || paper.positions.length === 0) {
    return (
      <div className="glass" style={{ padding:24, borderRadius:12, textAlign:"center" }}>
        <h3 style={{ marginTop:0, fontFamily:TH.display, letterSpacing:"0.15em" }}>PAPER POSITIONS</h3>
        <p style={{ color:TH.dim, fontSize:13, margin:"14px 0 0" }}>
          No positions yet. Head to Spot or Futures to place your first paper trade.
          Trades persist locally, and sync to your wallet-backed account when you sign in.
        </p>
      </div>
    );
  }

  const open = paper.positions.filter(p => p.status === "OPEN");
  const closed = paper.positions.filter(p => p.status === "CLOSED");
  const coinBySymbol = (sym) => coins.find(c => c.symbol?.toLowerCase() === (sym || "").toLowerCase());

  return (
    <div className="glass" style={{ padding:18, borderRadius:12 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
        <h3 style={{ margin:0, fontFamily:TH.display, letterSpacing:"0.15em" }}>PAPER POSITIONS</h3>
        <div style={{ flex:1 }} />
        <button onClick={paper.refresh} style={{
          background:"none", border:`1px solid ${TH.border}`,
          color:TH.dim, padding:"4px 10px", borderRadius:6,
          fontSize:10, fontFamily:TH.mono, cursor:"pointer",
        }}>REFRESH</button>
      </div>

      {/* Open positions */}
      <div style={{ fontSize:10, color:TH.dim, fontFamily:TH.mono, letterSpacing:"0.2em", marginBottom:8 }}>
        OPEN · {open.length}
      </div>
      {open.length === 0 && (
        <div style={{ color:TH.muted, fontSize:12, padding:"14px 0" }}>No open positions yet.</div>
      )}
      {open.map((p) => {
        const coin = coinBySymbol(p.symbol);
        const mark = coin?.current_price || Number(p.entryPrice);
        const dir = p.side === "LONG" ? 1 : -1;
        const lev = Number(p.leverage);
        const unrealized = Number(p.size) * (mark - Number(p.entryPrice)) * dir * lev;
        return (
          <div key={p.id} style={{
            display:"grid", gridTemplateColumns:"auto 1fr auto auto auto",
            gap:12, alignItems:"center", padding:"10px 0",
            borderBottom:`1px solid ${TH.border}`, fontFamily:TH.mono,
          }}>
            <TokenIcon coin={coin || { symbol: p.symbol }} size={28} />
            <div>
              <div style={{ fontWeight:700, fontSize:13 }}>
                {p.symbol.toUpperCase()} <span style={{
                  marginLeft:6, fontSize:10, padding:"2px 6px", borderRadius:4,
                  background: p.side === "LONG" ? `${TH.green}22` : `${TH.red}22`,
                  color: p.side === "LONG" ? TH.green : TH.red, letterSpacing:"0.1em",
                }}>{p.side} · {lev}×</span>
              </div>
              <div style={{ fontSize:10, color:TH.dim }}>
                Entry {fmtUsd(p.entryPrice)} · Size {p.size}
              </div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:10, color:TH.dim }}>MARK</div>
              <div style={{ fontSize:12 }}>{fmtUsd(mark)}</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:10, color:TH.dim }}>uPNL</div>
              <div style={{ fontSize:12, color: unrealized >= 0 ? TH.green : TH.red, fontWeight:700 }}>
                {unrealized >= 0 ? "+" : ""}{fmtUsd(unrealized)}
              </div>
            </div>
            <button
              onClick={() => paper.close(p.id, mark).catch(e => alert(e.message))}
              style={{
                padding:"6px 12px", fontSize:10, fontFamily:TH.mono,
                background:`${TH.red}18`, border:`1px solid ${TH.red}55`,
                color:TH.red, borderRadius:6, cursor:"pointer", letterSpacing:"0.1em",
              }}
            >CLOSE</button>
          </div>
        );
      })}

      {/* Closed positions */}
      <div style={{ fontSize:10, color:TH.dim, fontFamily:TH.mono, letterSpacing:"0.2em", margin:"18px 0 8px" }}>
        CLOSED · {closed.length}
      </div>
      {closed.slice(0, 25).map(p => (
        <div key={p.id} style={{
          display:"grid", gridTemplateColumns:"auto 1fr auto",
          gap:12, alignItems:"center", padding:"8px 0",
          borderBottom:`1px solid ${TH.border}`, fontFamily:TH.mono,
          opacity: 0.85,
        }}>
          <TokenIcon coin={coinBySymbol(p.symbol) || { symbol: p.symbol }} size={24} />
          <div style={{ fontSize:12 }}>
            {p.symbol.toUpperCase()} · {p.side} {Number(p.leverage)}×
            <span style={{ color:TH.dim, fontSize:10, marginLeft:6 }}>
              {new Date(p.closedAt || p.openedAt).toLocaleDateString()}
            </span>
          </div>
          <div style={{
            fontSize:12, color: Number(p.realizedPnl) >= 0 ? TH.green : TH.red, fontWeight:700,
          }}>
            {Number(p.realizedPnl) >= 0 ? "+" : ""}{fmtUsd(p.realizedPnl)}
          </div>
        </div>
      ))}
    </div>
  );
}

export default PortfolioView;
