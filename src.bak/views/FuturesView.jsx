import React, { useState, useEffect, useMemo } from "react";
import { Field } from "../components/Field";
import { Row } from "../components/Row";
import { Stat } from "../components/Stat";
import { TokenIcon } from "../components/TokenIcon";
import { TradingChart } from "../components/TradingChart";
import { useKlines } from "../hooks/useKlines";
import { useOrderBook } from "../hooks/useOrderBook";
import { usePaperTrading } from "../hooks/usePaperTrading";
import { useQuests } from "../hooks/useQuests";
import { fmtUsd } from "../lib/formatters";
import { TH } from "../theme";

export function FuturesView({ coins }) {
  const [coin, setCoin] = useState(coins[0]);
  const [leverage, setLeverage] = useState(10);
  const [side, setSide] = useState("long");
  const [margin, setMargin] = useState("500");
  const [chartInterval, setChartInterval] = useState("15m");
  const [submitting, setSubmitting] = useState(false);
  const [flash, setFlash] = useState(null);

  const paper = usePaperTrading();
  const questState = useQuests();

  useEffect(() => { if (!coin && coins[0]) setCoin(coins[0]); }, [coins]);

  const binanceSymbol = useMemo(() => {
    const sym = (coin?.symbol || "btc").toUpperCase();
    const unsupported = new Set(["USDT", "USDC", "DAI", "TUSD"]);
    return unsupported.has(sym) ? "BTCUSDT" : `${sym}USDT`;
  }, [coin]);

  const { candles, status: klineStatus } = useKlines(binanceSymbol, chartInterval, 300);
  const { midPrice } = useOrderBook(binanceSymbol);

  // Use live Binance mid-price for derivative calcs if available, else fall back to CoinGecko
  const markPrice = midPrice || coin?.current_price || 0;

  const positionSize = parseFloat(margin) * leverage;
  const liquidationPrice = side === "long"
    ? markPrice * (1 - 0.9 / leverage)
    : markPrice * (1 + 0.9 / leverage);

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 360px", gap:14, alignItems:"start", marginBottom:16 }}>
        <div className="glass" style={{ padding:16, borderRadius:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
            <TokenIcon coin={coin} size={36} />
            <div>
              <div style={{ fontFamily:TH.display, fontSize:18, letterSpacing:"0.1em" }}>
                {coin?.symbol?.toUpperCase()}-PERP
              </div>
              <div style={{ fontSize:11, color:TH.dim }}>Perpetual Futures</div>
            </div>
            <div style={{ marginLeft:"auto", display:"flex", gap:18 }}>
              <Stat label="MARK" value={fmtUsd(coin?.current_price)} />
              <Stat label="FUNDING" value="0.0128%" color={TH.green} />
              <Stat label="OPEN INT" value="$2.4B" />
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10, flexWrap:"wrap" }}>
            <div style={{ fontFamily:TH.display, fontSize:12, letterSpacing:"0.15em", color:TH.dim }}>
              {binanceSymbol} · PERP · {klineStatus === "live" ? "LIVE" : klineStatus.toUpperCase()}
            </div>
            <div style={{ flex:1 }} />
            {["1m","5m","15m","1h","4h","1d"].map(iv => (
              <button
                key={iv}
                onClick={() => setChartInterval(iv)}
                style={{
                  padding:"4px 10px",
                  background: chartInterval === iv ? `${TH.magenta}22` : "transparent",
                  border: `1px solid ${chartInterval === iv ? TH.magenta : TH.border}`,
                  color: chartInterval === iv ? TH.magenta : TH.dim,
                  borderRadius:6, fontSize:10, fontFamily:TH.mono,
                  letterSpacing:"0.1em", cursor:"pointer",
                }}
              >{iv.toUpperCase()}</button>
            ))}
          </div>
          <TradingChart candles={candles} height={400} showVolume={true} />
        </div>

        <div className="glass" style={{ padding:16, borderRadius:12 }}>
          <select onChange={e => setCoin(coins.find(c => c.id === e.target.value))} value={coin?.id}
            style={{
              width:"100%", padding:"8px 12px", marginBottom:14,
              background:"rgba(0,0,0,0.4)", border:`1px solid ${TH.border}`, borderRadius:8,
              color:TH.text, fontSize:12, fontFamily:TH.mono,
            }}>
            {coins.slice(0, 50).map(c => <option key={c.id} value={c.id}>{c.symbol?.toUpperCase()}-PERP</option>)}
          </select>

          <div style={{ display:"flex", marginBottom:14, borderRadius:8, overflow:"hidden", border:`1px solid ${TH.border}` }}>
            <button onClick={() => setSide("long")} style={{
              flex:1, padding:10, background: side === "long" ? TH.green : "transparent",
              color: side === "long" ? "#000" : TH.dim, border:"none", cursor:"pointer",
              fontFamily:TH.display, fontWeight:900, letterSpacing:"0.15em",
            }}>LONG</button>
            <button onClick={() => setSide("short")} style={{
              flex:1, padding:10, background: side === "short" ? TH.red : "transparent",
              color: side === "short" ? "#000" : TH.dim, border:"none", cursor:"pointer",
              fontFamily:TH.display, fontWeight:900, letterSpacing:"0.15em",
            }}>SHORT</button>
          </div>

          <div style={{ marginBottom:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:TH.dim, marginBottom:6, fontFamily:TH.display, letterSpacing:"0.12em" }}>
              <span>LEVERAGE</span>
              <span style={{ color:TH.gold, fontFamily:TH.mono }}>{leverage}×</span>
            </div>
            <input type="range" min={1} max={125} value={leverage}
              onChange={e => setLeverage(+e.target.value)}
              style={{ width:"100%", accentColor: TH.cyan }} />
            <div style={{ display:"flex", gap:4, marginTop:6 }}>
              {[2, 5, 10, 25, 50, 100, 125].map(l => (
                <button key={l} onClick={() => setLeverage(l)} style={{
                  flex:1, padding:"4px", fontSize:10, borderRadius:4,
                  background: leverage === l ? `${TH.gold}33` : "rgba(0,0,0,0.35)",
                  border:`1px solid ${leverage === l ? TH.gold : TH.border}`,
                  color: leverage === l ? TH.gold : TH.dim, cursor:"pointer", fontFamily:TH.mono,
                }}>{l}×</button>
              ))}
            </div>
          </div>

          <Field label="MARGIN (USDT)" value={margin} onChange={setMargin} />

          <div style={{ padding:12, background:"rgba(0,0,0,0.35)", borderRadius:8, marginBottom:12, fontFamily:TH.mono, fontSize:11, color:TH.dim }}>
            <Row k="Position Size" v={fmtUsd(positionSize)} />
            <Row k="Entry" v={fmtUsd(coin?.current_price)} />
            <Row k="Liq. Price" v={fmtUsd(liquidationPrice)} />
            <Row k="Fee (0.05%)" v={fmtUsd(positionSize * 0.0005)} />
          </div>

          {flash && (
            <div style={{
              padding:"8px 12px", marginTop:10, borderRadius:8, fontSize:11, fontFamily:TH.mono,
              background: flash.type === "error" ? `${TH.red}18` : `${TH.green}18`,
              border: `1px solid ${flash.type === "error" ? TH.red : TH.green}55`,
              color: flash.type === "error" ? TH.red : TH.green,
            }}>{flash.msg}</div>
          )}

          <button
            disabled={submitting || !coin}
            onClick={async () => {
              setFlash(null);
              if (!paper.online) {
                setFlash({ type:"error", msg:"Connect wallet to record paper trades." });
                return;
              }
              const marginNum = parseFloat(margin);
              if (!marginNum || marginNum <= 0) { setFlash({ type:"error", msg:"Enter margin." }); return; }
              const notional = marginNum * leverage;
              const quantity = markPrice > 0 ? notional / markPrice : 0;
              setSubmitting(true);
              try {
                await paper.place({
                  coinId: coin.id,
                  symbol: coin.symbol,
                  side: side === "long" ? "BUY" : "SELL",
                  type: "MARKET",
                  quantity,
                  currentMarketPrice: markPrice,
                  leverage,
                });
                setFlash({ type:"ok", msg:`${side.toUpperCase()} ${leverage}× opened · ${fmtUsd(notional)} notional` });
                try {
                  await questState.progress("ten-trades", 1);
                  if (notional > 0) await questState.progress("volume-10k", Math.round(notional));
                } catch (_) {}
              } catch (err) {
                setFlash({ type:"error", msg: err?.message || "Order failed" });
              } finally {
                setSubmitting(false);
              }
            }}
            style={{
              width:"100%", padding:12, borderRadius:8, marginTop:8,
              background: submitting ? "rgba(124,200,255,0.2)" : (side === "long" ? TH.green : TH.red),
              color: submitting ? TH.cyan : "#000", border:"none",
              cursor: submitting ? "wait" : "pointer",
              fontFamily:TH.display, fontWeight:900, letterSpacing:"0.15em",
              boxShadow:`0 4px 20px ${side === "long" ? "rgba(74,222,160,0.4)" : "rgba(255,106,133,0.4)"}`,
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? "SUBMITTING..." : `OPEN ${side.toUpperCase()} ${leverage}×`}
          </button>
        </div>
      </div>

      {/* Open positions (mock) */}
      <div className="glass" style={{ padding:16, borderRadius:12 }}>
        <h3 style={{ marginTop:0, fontFamily:TH.display, letterSpacing:"0.15em", fontSize:14, color:TH.dim }}>OPEN POSITIONS</h3>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, fontFamily:TH.mono }}>
            <thead>
              <tr style={{ color:TH.dim }}>
                {["SYMBOL","SIDE","SIZE","ENTRY","MARK","PNL","ACTION"].map(h => (
                  <th key={h} style={{ textAlign:"left", padding:"8px", fontFamily:TH.display, fontSize:11, letterSpacing:"0.1em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { sym:"BTC-PERP", side:"LONG", size:"$12,400", entry:"65,800", mark:coins[0]?.current_price || 67400, pnl:198.4 },
                { sym:"ETH-PERP", side:"LONG", size:"$8,200", entry:"3,380", mark:coins[1]?.current_price || 3420, pnl:97.2 },
                { sym:"SOL-PERP", side:"SHORT", size:"$4,500", entry:"182", mark:coins[4]?.current_price || 178, pnl:98.9 },
              ].map((p, i) => {
                const markNum = typeof p.mark === "number" ? p.mark : parseFloat(p.mark);
                return (
                  <tr key={i} style={{ borderTop:`1px solid ${TH.border}` }}>
                    <td style={{ padding:"10px 8px", fontWeight:700 }}>{p.sym}</td>
                    <td style={{ padding:"10px 8px", color: p.side === "LONG" ? TH.green : TH.red, fontWeight:700 }}>{p.side}</td>
                    <td style={{ padding:"10px 8px" }}>{p.size}</td>
                    <td style={{ padding:"10px 8px" }}>${p.entry}</td>
                    <td style={{ padding:"10px 8px" }}>{fmtUsd(markNum)}</td>
                    <td style={{ padding:"10px 8px", color:TH.green, fontWeight:700 }}>+${p.pnl.toFixed(2)}</td>
                    <td style={{ padding:"10px 8px" }}>
                      <button style={{
                        padding:"4px 10px", fontSize:10, borderRadius:4,
                        background:TH.red, color:"#000", border:"none", fontFamily:TH.display, fontWeight:700,
                        letterSpacing:"0.1em", cursor:"pointer",
                      }}>CLOSE</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ══════════ LIQUIDITY VIEW ════════════════════════════════════════════ */

export default FuturesView;
