import React, { useState, useEffect, useMemo } from "react";
import { Field } from "../components/Field";
import { OrderBookRow } from "../components/OrderBookRow";
import { Row } from "../components/Row";
import { Stat } from "../components/Stat";
import { TokenIcon } from "../components/TokenIcon";
import { TradingChart } from "../components/TradingChart";
import { useKlines } from "../hooks/useKlines";
import { useOrderBook } from "../hooks/useOrderBook";
import { usePaperTrading } from "../hooks/usePaperTrading";
import { useQuests } from "../hooks/useQuests";
import { fmtPct, fmtUsd } from "../lib/formatters";
import { TH } from "../theme";

export function SpotView({ coins, selectedCoin, setSelectedCoin }) {
  const coin = selectedCoin || coins[0];
  const [side, setSide] = useState("buy");
  const [orderType, setOrderType] = useState("limit");
  const [price, setPrice] = useState((coin?.current_price || 0).toFixed(2));
  const [amount, setAmount] = useState("0.1");
  const [chartInterval, setChartInterval] = useState("15m");
  const [submitting, setSubmitting] = useState(false);
  const [flash, setFlash] = useState(null); // { type, msg }

  const paper = usePaperTrading();
  const questState = useQuests();

  // Binance symbol mapping (fall back to BTCUSDT for stables + unsupported)
  const binanceSymbol = useMemo(() => {
    const sym = (coin?.symbol || "btc").toUpperCase();
    const unsupported = new Set(["USDT", "USDC", "DAI", "TUSD"]);
    return unsupported.has(sym) ? "BTCUSDT" : `${sym}USDT`;
  }, [coin]);

  // Real live feeds from Binance (no API key required)
  const { bids, asks, status: bookStatus, midPrice, spread } = useOrderBook(binanceSymbol);
  const { candles, status: klineStatus } = useKlines(binanceSymbol, chartInterval, 300);

  useEffect(() => {
    if (coin) setPrice((coin.current_price || 0).toFixed(coin.current_price > 1 ? 2 : 6));
  }, [coin?.id]);

  // Derive the book object that downstream render expects
  const book = { asks: asks.slice(0, 15), bids: bids.slice(0, 15) };

  return (
    <div>
      {/* Coin selector */}
      <div className="glass" style={{ padding:14, borderRadius:12, marginBottom:16,
        display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <TokenIcon coin={coin} size={40} />
          <div>
            <div style={{ fontFamily:TH.display, fontSize:18, letterSpacing:"0.1em" }}>
              {coin?.symbol?.toUpperCase()}/USDT
            </div>
            <div style={{ fontSize:11, color:TH.dim }}>{coin?.name}</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:24, flexWrap:"wrap" }}>
          <Stat label="LAST PRICE" value={fmtUsd(coin?.current_price)} />
          <Stat label="24H CHANGE" value={fmtPct(coin?.price_change_percentage_24h)} color={(coin?.price_change_percentage_24h || 0) >= 0 ? TH.green : TH.red} />
          <Stat label="24H HIGH" value={fmtUsd(coin?.high_24h)} />
          <Stat label="24H LOW" value={fmtUsd(coin?.low_24h)} />
          <Stat label="24H VOL" value={fmtUsd(coin?.total_volume)} />
        </div>
        <div style={{ flex:1 }} />
        <select onChange={e => setSelectedCoin(coins.find(c => c.id === e.target.value))}
          value={coin?.id}
          style={{
            padding:"8px 12px", background:"rgba(0,0,0,0.4)",
            border:`1px solid ${TH.border}`, borderRadius:8, color:TH.text, fontSize:12, fontFamily:TH.mono,
          }}>
          {coins.slice(0, 50).map(c => (
            <option key={c.id} value={c.id}>{c.symbol?.toUpperCase()} — {c.name}</option>
          ))}
        </select>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 280px 320px", gap:14, alignItems:"start" }}>
        {/* Chart */}
        <div className="glass" style={{ padding:16, borderRadius:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10, flexWrap:"wrap" }}>
            <div style={{ fontFamily:TH.display, fontSize:12, letterSpacing:"0.15em", color:TH.dim }}>
              {binanceSymbol} · {klineStatus === "live" ? "LIVE" : klineStatus.toUpperCase()}
            </div>
            <div style={{ flex:1 }} />
            {["1m","5m","15m","1h","4h","1d"].map(iv => (
              <button
                key={iv}
                onClick={() => setChartInterval(iv)}
                style={{
                  padding:"4px 10px",
                  background: chartInterval === iv ? `${TH.cyan}22` : "transparent",
                  border: `1px solid ${chartInterval === iv ? TH.cyan : TH.border}`,
                  color: chartInterval === iv ? TH.cyan : TH.dim,
                  borderRadius:6, fontSize:10, fontFamily:TH.mono,
                  letterSpacing:"0.1em", cursor:"pointer",
                }}
              >{iv.toUpperCase()}</button>
            ))}
          </div>
          <TradingChart candles={candles} height={460} showVolume={true} />
        </div>

        {/* Order book */}
        <div className="glass" style={{ padding:12, borderRadius:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10 }}>
            <span style={{
              display:"inline-block", width:6, height:6, borderRadius:"50%",
              background: bookStatus === "live" ? TH.green : TH.dim,
              boxShadow: bookStatus === "live" ? `0 0 8px ${TH.green}` : "none",
              animation: bookStatus === "live" ? "livePulse 1.4s ease-in-out infinite" : "none",
            }} />
            <span style={{ fontFamily:TH.display, fontSize:12, letterSpacing:"0.15em", color:TH.dim }}>
              ORDER BOOK · {bookStatus === "live" ? "BINANCE" : bookStatus.toUpperCase()}
            </span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", fontSize:10, color:TH.dim, padding:"0 4px 6px", fontFamily:TH.mono }}>
            <span>Price (USDT)</span>
            <span style={{ textAlign:"right" }}>Size</span>
          </div>
          {book.asks.slice().reverse().map((a, i) => (
            <OrderBookRow key={i} price={a.price} size={a.size} side="ask" />
          ))}
          <div style={{
            padding:"6px 4px", fontFamily:TH.mono, fontSize:15, fontWeight:700,
            color: (coin?.price_change_percentage_24h || 0) >= 0 ? TH.green : TH.red,
            textAlign:"center", borderTop:`1px solid ${TH.border}`, borderBottom:`1px solid ${TH.border}`, margin:"4px 0",
          }}>
            {fmtUsd(coin?.current_price)}
          </div>
          {book.bids.map((b, i) => (
            <OrderBookRow key={i} price={b.price} size={b.size} side="bid" />
          ))}
        </div>

        {/* Order form */}
        <div className="glass" style={{ padding:16, borderRadius:12 }}>
          <div style={{ display:"flex", marginBottom:14, borderRadius:8, overflow:"hidden", border:`1px solid ${TH.border}` }}>
            <button onClick={() => setSide("buy")} style={{
              flex:1, padding:10, background: side === "buy" ? TH.green : "transparent",
              color: side === "buy" ? "#000" : TH.dim, border:"none", cursor:"pointer",
              fontFamily:TH.display, fontWeight:900, letterSpacing:"0.15em",
            }}>BUY</button>
            <button onClick={() => setSide("sell")} style={{
              flex:1, padding:10, background: side === "sell" ? TH.red : "transparent",
              color: side === "sell" ? "#000" : TH.dim, border:"none", cursor:"pointer",
              fontFamily:TH.display, fontWeight:900, letterSpacing:"0.15em",
            }}>SELL</button>
          </div>

          <div style={{ display:"flex", gap:4, marginBottom:12 }}>
            {["limit","market","stop"].map(t => (
              <button key={t} onClick={() => setOrderType(t)} style={{
                flex:1, padding:"6px 8px", borderRadius:6,
                background: orderType === t ? "rgba(124,200,255,0.15)" : "rgba(0,0,0,0.35)",
                border: `1px solid ${orderType === t ? TH.cyan : TH.border}`,
                color: orderType === t ? TH.cyan : TH.dim,
                fontFamily:TH.display, fontSize:10, letterSpacing:"0.1em", cursor:"pointer",
              }}>{t.toUpperCase()}</button>
            ))}
          </div>

          {orderType !== "market" && (
            <Field label="PRICE (USDT)" value={price} onChange={setPrice} />
          )}
          <Field label={`AMOUNT (${coin?.symbol?.toUpperCase()})`} value={amount} onChange={setAmount} />

          <div style={{ display:"flex", gap:4, margin:"10px 0" }}>
            {["25%","50%","75%","MAX"].map(p => (
              <button key={p} style={{
                flex:1, padding:"5px 6px", fontSize:10, borderRadius:6,
                background:"rgba(0,0,0,0.35)", border:`1px solid ${TH.border}`,
                color:TH.dim, cursor:"pointer", fontFamily:TH.mono,
              }}>{p}</button>
            ))}
          </div>

          <div style={{ padding:"10px 12px", background:"rgba(0,0,0,0.35)", borderRadius:8, marginBottom:10, fontFamily:TH.mono, fontSize:11, color:TH.dim }}>
            <Row k="Total" v={`${(parseFloat(amount) * parseFloat(price)).toFixed(2)} USDT`} />
            <Row k="Fee (0.1%)" v={`${(parseFloat(amount) * parseFloat(price) * 0.001).toFixed(4)} USDT`} />
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
              if (!paper.available) {
                setFlash({ type:"error", msg:"Paper trading unavailable." });
                return;
              }
              const qty = parseFloat(amount);
              const px = parseFloat(price);
              const mkt = coin?.current_price || px;
              if (!qty || qty <= 0) { setFlash({ type:"error", msg:"Enter a valid amount." }); return; }
              setSubmitting(true);
              try {
                await paper.place({
                  coinId: coin.id,
                  symbol: coin.symbol,
                  side: side.toUpperCase(),
                  type: orderType.toUpperCase(),
                  quantity: qty,
                  price: orderType === "market" ? undefined : px,
                  currentMarketPrice: mkt,
                  leverage: 1,
                });
                setFlash({ type:"ok", msg:`${side.toUpperCase()} ${qty} ${coin.symbol.toUpperCase()} recorded.` });
                // Auto-increment quest progress
                try {
                  await questState.progress("ten-trades", 1);
                  const vol = qty * mkt;
                  if (vol > 0) await questState.progress("volume-10k", Math.round(vol));
                } catch (_) { /* non-fatal */ }
              } catch (err) {
                setFlash({ type:"error", msg: err?.message || "Order failed" });
              } finally {
                setSubmitting(false);
              }
            }}
            style={{
              width:"100%", padding:12, borderRadius:8, marginTop:8,
              background: submitting ? "rgba(124,200,255,0.2)" : (side === "buy" ? TH.green : TH.red),
              color: submitting ? TH.cyan : "#000", border:"none",
              cursor: submitting ? "wait" : "pointer",
              fontFamily:TH.display, fontWeight:900, letterSpacing:"0.15em",
              boxShadow:`0 4px 20px ${side === "buy" ? "rgba(74,222,160,0.4)" : "rgba(255,106,133,0.4)"}`,
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting
              ? "SUBMITTING..."
              : `${side.toUpperCase()} ${coin?.symbol?.toUpperCase() || ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SpotView;
