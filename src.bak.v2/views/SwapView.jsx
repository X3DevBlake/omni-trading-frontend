import React, { useState, useEffect, useMemo } from "react";
import { ArrowDownUp, AlertCircle, ExternalLink } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Row } from "../components/Row";
import { TokenInput } from "../components/TokenInput";
import { TokenPicker } from "../components/TokenPicker";
import { CHAINS, SEPOLIA_TOKENS, uniswapFor } from "../lib/chains";
import {
  quoteSwap, executeSwap, approveToken, checkAllowance,
  getTokenBalance, getNativeBalance, withSlippage,
} from "../lib/uniswap";
import { TH } from "../theme";

const SEPOLIA_ID = 11155111;

export function SwapView({ coins, account }) {
  const [mode, setMode] = useState("paper"); // "paper" | "testnet"
  const [from, setFrom] = useState(coins.find(c => c.symbol?.toLowerCase()==="usdt") || coins[2]);
  const [to, setTo] = useState(coins[0]);
  const [fromAmt, setFromAmt] = useState("1000");
  const [slippage, setSlippage] = useState(0.5);
  const [pickerOpen, setPickerOpen] = useState(null);

  useEffect(() => {
    if (!from) setFrom(coins.find(c => c.symbol?.toLowerCase()==="usdt") || coins[2]);
    if (!to) setTo(coins[0]);
  }, [coins]);

  // Paper mode math (CoinGecko prices)
  const rate = (from?.current_price || 0) / Math.max(0.000001, to?.current_price || 1);
  const toAmt = (parseFloat(fromAmt || 0) * rate).toFixed(6);
  const fee = parseFloat(fromAmt || 0) * 0.003;

  return (
    <div style={{ display:"grid", gridTemplateColumns:"minmax(380px,520px) 1fr", gap:20, alignItems:"start" }}>
      <div className="glass" style={{ padding:24, borderRadius:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <h2 style={{ margin:0, fontFamily:TH.display, fontSize:20, letterSpacing:"0.15em" }}>SWAP</h2>
          <button onClick={() => setSlippage(s => s === 0.5 ? 1 : s === 1 ? 3 : 0.5)} style={{
            background:"rgba(0,0,0,0.4)", border:`1px solid ${TH.border}`, color:TH.dim,
            padding:"6px 10px", borderRadius:6, fontSize:11, fontFamily:TH.mono, cursor:"pointer",
          }}>Slippage: {slippage}%</button>
        </div>

        {/* Mode toggle */}
        <div style={{
          display:"flex", borderRadius:8, overflow:"hidden",
          border:`1px solid ${TH.border}`, marginBottom:16,
        }}>
          <button onClick={() => setMode("paper")} style={{
            flex:1, padding:9, background: mode === "paper" ? `${TH.cyan}22` : "transparent",
            border:"none", color: mode === "paper" ? TH.cyan : TH.dim,
            fontFamily:TH.display, fontSize:11, letterSpacing:"0.15em", cursor:"pointer",
          }}>PAPER</button>
          <button onClick={() => setMode("testnet")} style={{
            flex:1, padding:9, background: mode === "testnet" ? `${TH.magenta}22` : "transparent",
            border:"none", color: mode === "testnet" ? TH.magenta : TH.dim,
            fontFamily:TH.display, fontSize:11, letterSpacing:"0.15em", cursor:"pointer",
          }}>TESTNET · SEPOLIA</button>
        </div>

        {mode === "paper" ? (
          <PaperSwap
            from={from} to={to} fromAmt={fromAmt} toAmt={toAmt}
            setFromAmt={setFromAmt} setFrom={setFrom} setTo={setTo}
            setPickerOpen={setPickerOpen} rate={rate} fee={fee} slippage={slippage}
          />
        ) : (
          <TestnetSwap account={account} slippage={slippage} />
        )}
      </div>

      <div className="glass" style={{ padding:20, borderRadius:16 }}>
        <h3 style={{ marginTop:0, fontFamily:TH.display, fontSize:14, letterSpacing:"0.12em", color:TH.dim }}>
          {to?.name?.toUpperCase()} — 7 DAY CHART
        </h3>
        <div style={{ height:320 }}>
          <ResponsiveContainer>
            <AreaChart data={(to?.sparkline_in_7d?.price || []).map((v, i) => ({ i, v }))}>
              <defs>
                <linearGradient id="swapg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={TH.cyan} stopOpacity={0.5}/>
                  <stop offset="100%" stopColor={TH.cyan} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid stroke={TH.border} strokeDasharray="3 3" />
              <XAxis dataKey="i" stroke={TH.dim} tick={{ fontSize:10, fontFamily:TH.mono }} />
              <YAxis stroke={TH.dim} tick={{ fontSize:10, fontFamily:TH.mono }} domain={["auto","auto"]} />
              <Tooltip contentStyle={{ background:"rgba(10,16,32,0.95)", border:`1px solid ${TH.border}`, fontFamily:TH.mono, fontSize:12 }} />
              <Area type="monotone" dataKey="v" stroke={TH.cyan} strokeWidth={2} fill="url(#swapg)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {pickerOpen && (
        <TokenPicker
          coins={coins}
          onSelect={c => { pickerOpen === "from" ? setFrom(c) : setTo(c); setPickerOpen(null); }}
          onClose={() => setPickerOpen(null)}
        />
      )}
    </div>
  );
}

// ─── Paper mode — simulated swap at CoinGecko prices ─────────────────────
function PaperSwap({ from, to, fromAmt, toAmt, setFromAmt, setFrom, setTo, setPickerOpen, rate, fee, slippage }) {
  return (
    <>
      <TokenInput label="From" coin={from} amount={fromAmt} onAmount={setFromAmt}
        onPick={() => setPickerOpen("from")} balance={12450.38} />

      <div style={{ display:"flex", justifyContent:"center", margin:"-8px 0" }}>
        <button onClick={() => { setFrom(to); setTo(from); }} style={{
          width:40, height:40, borderRadius:"50%",
          background:`linear-gradient(135deg,${TH.cyan},${TH.magenta})`,
          border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow:"0 4px 16px rgba(124,200,255,0.45)", zIndex:2,
        }}><ArrowDownUp size={18} color="#000" /></button>
      </div>

      <TokenInput label="To" coin={to} amount={toAmt} readOnly
        onPick={() => setPickerOpen("to")} />

      <div style={{
        padding:"12px 14px", borderRadius:10, marginTop:14,
        background:"rgba(0,0,0,0.35)", border:`1px solid ${TH.border}`,
        fontSize:12, fontFamily:TH.mono, color:TH.dim,
      }}>
        <Row k="Rate" v={`1 ${from?.symbol?.toUpperCase()} = ${rate.toFixed(6)} ${to?.symbol?.toUpperCase()}`} />
        <Row k="Slippage Tolerance" v={`${slippage}%`} />
        <Row k="Network Fee" v={`${fee.toFixed(4)} ${from?.symbol?.toUpperCase()} (0.3%)`} />
        <Row k="Min. Received" v={`${(parseFloat(toAmt) * (1 - slippage/100)).toFixed(6)} ${to?.symbol?.toUpperCase()}`} />
      </div>

      <div style={{
        padding:"8px 12px", marginTop:10, borderRadius:8,
        background:"rgba(255,213,122,0.08)", border:`1px solid ${TH.gold}33`,
        fontSize:11, color:TH.dim, display:"flex", alignItems:"flex-start", gap:8,
      }}>
        <AlertCircle size={12} color={TH.gold} style={{ marginTop:2, flexShrink:0 }} />
        <span>Paper mode — no real transaction. Prices via CoinGecko. For a real swap, switch to TESTNET.</span>
      </div>

      <button className="btn-primary" style={{ width:"100%", padding:14, borderRadius:10, fontSize:14, marginTop:12 }}>
        CONFIRM SWAP (PAPER)
      </button>
    </>
  );
}

// ─── Testnet mode — real Uniswap V3 swap on Sepolia ──────────────────────
function TestnetSwap({ account, slippage }) {
  const [tokenIn, setTokenIn] = useState("WETH");
  const [tokenOut, setTokenOut] = useState("USDC");
  const [amountIn, setAmountIn] = useState("0.01");
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState("");
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);
  const [balances, setBalances] = useState({});

  const inToken = SEPOLIA_TOKENS[tokenIn];
  const outToken = SEPOLIA_TOKENS[tokenOut];
  const connected = !!account?.fullAddress;
  const onSepolia = account?.chainId === SEPOLIA_ID;

  // Fetch user balances when connected
  useEffect(() => {
    if (!connected || !onSepolia) return;
    (async () => {
      try {
        const [inBal, outBal, nativeBal] = await Promise.all([
          getTokenBalance({ chainId: SEPOLIA_ID, token: inToken.address, owner: account.fullAddress }),
          getTokenBalance({ chainId: SEPOLIA_ID, token: outToken.address, owner: account.fullAddress }),
          getNativeBalance({ chainId: SEPOLIA_ID, owner: account.fullAddress }),
        ]);
        setBalances({
          [tokenIn]: Number(inBal.balance) / 10**inToken.decimals,
          [tokenOut]: Number(outBal.balance) / 10**outToken.decimals,
          ETH: Number(nativeBal) / 1e18,
        });
      } catch (_) { /* silently ignore — user probably just hasn't funded wallet */ }
    })();
  }, [connected, onSepolia, tokenIn, tokenOut, account?.fullAddress]);

  // Auto-quote on input change
  useEffect(() => {
    setQuote(null); setError(null);
    if (!amountIn || parseFloat(amountIn) <= 0) return;
    const raw = BigInt(Math.floor(parseFloat(amountIn) * 10**inToken.decimals));
    let cancelled = false;
    (async () => {
      try {
        const q = await quoteSwap({
          chainId: SEPOLIA_ID,
          tokenIn: inToken.address,
          tokenOut: outToken.address,
          amountIn: raw,
          fee: 3000,
        });
        if (!cancelled) setQuote(q);
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    })();
    return () => { cancelled = true; };
  }, [amountIn, tokenIn, tokenOut, inToken.address, inToken.decimals, outToken.address]);

  const outAmount = quote ? Number(quote.amountOut) / 10**outToken.decimals : 0;

  const handleSwap = async () => {
    setError(null); setTxHash(null);
    if (!connected) { setError("Connect wallet first"); return; }
    if (!onSepolia) { setError("Switch to Sepolia in your wallet"); return; }
    if (!quote) { setError("No quote available yet"); return; }

    try {
      setLoading("checking");
      const raw = BigInt(Math.floor(parseFloat(amountIn) * 10**inToken.decimals));
      const allowance = await checkAllowance({
        chainId: SEPOLIA_ID, token: inToken.address, owner: account.fullAddress,
      });

      if (allowance < raw) {
        setLoading("approving");
        await approveToken({
          chainId: SEPOLIA_ID, token: inToken.address,
          amount: raw * 2n, account: account.fullAddress,
        });
      }

      setLoading("swapping");
      const minOut = withSlippage(quote.amountOut, slippage / 100);
      const hash = await executeSwap({
        chainId: SEPOLIA_ID,
        tokenIn: inToken.address, tokenOut: outToken.address,
        amountIn: raw, amountOutMinimum: minOut,
        fee: 3000, account: account.fullAddress,
      });
      setTxHash(hash);
      setLoading("");
    } catch (err) {
      setError(err?.shortMessage || err?.message || String(err));
      setLoading("");
    }
  };

  const swapDirection = () => { setTokenIn(tokenOut); setTokenOut(tokenIn); };

  return (
    <>
      {!connected && (
        <div style={{
          padding:"12px 14px", marginBottom:14, borderRadius:10,
          background:`${TH.gold}12`, border:`1px solid ${TH.gold}55`,
          fontSize:12, color:TH.text, display:"flex", alignItems:"flex-start", gap:8,
        }}>
          <AlertCircle size={14} color={TH.gold} style={{ marginTop:2, flexShrink:0 }} />
          <span>Connect your wallet (top-right) to use testnet swaps.</span>
        </div>
      )}
      {connected && !onSepolia && (
        <div style={{
          padding:"12px 14px", marginBottom:14, borderRadius:10,
          background:`${TH.red}12`, border:`1px solid ${TH.red}55`,
          fontSize:12, color:TH.text,
        }}>
          <strong style={{ color:TH.red }}>Wrong network:</strong> switch to Sepolia in your wallet (chainId 11155111).
        </div>
      )}

      {/* Token in */}
      <div style={{
        padding:14, background:"rgba(0,0,0,0.3)", border:`1px solid ${TH.border}`,
        borderRadius:12, marginBottom:4,
      }}>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:TH.dim, marginBottom:8 }}>
          <span>From</span>
          <span>Balance: {balances[tokenIn] != null ? balances[tokenIn].toFixed(4) : "—"}</span>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <input value={amountIn} onChange={e => setAmountIn(e.target.value)} style={{
            flex:1, background:"transparent", border:"none", color:TH.text,
            fontSize:22, fontFamily:TH.mono, fontWeight:700, outline:"none",
          }} />
          <select value={tokenIn} onChange={e => setTokenIn(e.target.value)} style={{
            background:"rgba(0,0,0,0.4)", border:`1px solid ${TH.border}`, color:TH.text,
            padding:"6px 10px", borderRadius:8, fontFamily:TH.mono, fontSize:13,
          }}>
            {Object.keys(SEPOLIA_TOKENS).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display:"flex", justifyContent:"center", margin:"-8px 0", position:"relative", zIndex:2 }}>
        <button onClick={swapDirection} style={{
          width:36, height:36, borderRadius:"50%",
          background:`linear-gradient(135deg,${TH.magenta},${TH.cyan})`,
          border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow:"0 4px 16px rgba(176,137,255,0.45)",
        }}><ArrowDownUp size={16} color="#000" /></button>
      </div>

      {/* Token out */}
      <div style={{
        padding:14, background:"rgba(0,0,0,0.3)", border:`1px solid ${TH.border}`,
        borderRadius:12, marginTop:4,
      }}>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:TH.dim, marginBottom:8 }}>
          <span>To (estimated)</span>
          <span>Balance: {balances[tokenOut] != null ? balances[tokenOut].toFixed(4) : "—"}</span>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <input value={outAmount ? outAmount.toFixed(6) : ""} readOnly style={{
            flex:1, background:"transparent", border:"none", color:TH.text,
            fontSize:22, fontFamily:TH.mono, fontWeight:700, outline:"none",
          }} />
          <select value={tokenOut} onChange={e => setTokenOut(e.target.value)} style={{
            background:"rgba(0,0,0,0.4)", border:`1px solid ${TH.border}`, color:TH.text,
            padding:"6px 10px", borderRadius:8, fontFamily:TH.mono, fontSize:13,
          }}>
            {Object.keys(SEPOLIA_TOKENS).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>

      <div style={{
        padding:"10px 14px", borderRadius:10, marginTop:14,
        background:"rgba(0,0,0,0.35)", border:`1px solid ${TH.border}`,
        fontSize:12, fontFamily:TH.mono, color:TH.dim,
      }}>
        <Row k="Network" v="Sepolia (testnet)" />
        <Row k="Router" v={<code style={{ fontSize:10 }}>{uniswapFor(SEPOLIA_ID)?.router.slice(0,10)}...</code>} />
        <Row k="Fee tier" v="0.3%" />
        <Row k="Slippage" v={`${slippage}%`} />
        {quote && <Row k="Quoted output" v={`${outAmount.toFixed(6)} ${tokenOut}`} />}
      </div>

      {error && (
        <div style={{
          padding:10, marginTop:10, borderRadius:8,
          background:`${TH.red}12`, border:`1px solid ${TH.red}55`,
          color:TH.red, fontSize:11, fontFamily:TH.mono,
        }}>{error}</div>
      )}

      {txHash && (
        <a
          href={`${CHAINS.sepolia.explorer}/tx/${txHash}`}
          target="_blank" rel="noreferrer"
          style={{
            display:"flex", alignItems:"center", gap:6, padding:10, marginTop:10, borderRadius:8,
            background:`${TH.green}14`, border:`1px solid ${TH.green}55`,
            color:TH.green, fontSize:11, fontFamily:TH.mono, textDecoration:"none",
          }}
        >
          <ExternalLink size={12} /> View on Etherscan — {txHash.slice(0, 16)}…
        </a>
      )}

      <button
        className="btn-primary"
        onClick={handleSwap}
        disabled={!connected || !onSepolia || !quote || !!loading}
        style={{
          width:"100%", padding:14, borderRadius:10, fontSize:14, marginTop:16,
          opacity: (!connected || !onSepolia || !quote || loading) ? 0.5 : 1,
          cursor: (!connected || !onSepolia || !quote || loading) ? "not-allowed" : "pointer",
        }}
      >
        {loading === "checking" && "CHECKING ALLOWANCE..."}
        {loading === "approving" && "APPROVE TOKEN..."}
        {loading === "swapping" && "SWAPPING..."}
        {!loading && (connected && onSepolia ? "EXECUTE SWAP" : "UNAVAILABLE")}
      </button>

      <div style={{
        fontSize:10, color:TH.muted, marginTop:12, fontFamily:TH.mono,
        textAlign:"center", letterSpacing:"0.12em",
      }}>
        REAL UNISWAP V3 ON SEPOLIA · ZERO FINANCIAL RISK · <a href="https://sepoliafaucet.com" target="_blank" rel="noreferrer" style={{ color: TH.cyan }}>GET TESTNET ETH →</a>
      </div>
    </>
  );
}

export default SwapView;
