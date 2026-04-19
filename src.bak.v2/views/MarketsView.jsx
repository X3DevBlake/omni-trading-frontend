import React, { useState, useMemo } from "react";
import { TrendingUp, Search, Star, Flame, Activity, DollarSign } from "lucide-react";
import { useWatchlist } from "../hooks/useWatchlist";
import { LivePrice } from "../components/LivePrice";
import { Sparkline } from "../components/Sparkline";
import { StatCard } from "../components/StatCard";
import { TokenIcon } from "../components/TokenIcon";
import { fmtPct, fmtUsd } from "../lib/formatters";
import { TH } from "../theme";

export function MarketsView({ coins, status, onOpenCoin }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState({ key:"market_cap", dir:-1 });
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("all"); // all | gainers | losers | trending | watchlist
  const { favs, toggle: toggleFav } = useWatchlist();
  const PER = 25;

  const filtered = useMemo(() => {
    let r = coins.filter(c =>
      q === "" ||
      c.name?.toLowerCase().includes(q.toLowerCase()) ||
      c.symbol?.toLowerCase().includes(q.toLowerCase())
    );
    if (filter === "gainers") r = r.filter(c => (c.price_change_percentage_24h || 0) > 0)
      .sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0));
    else if (filter === "losers") r = r.filter(c => (c.price_change_percentage_24h || 0) < 0)
      .sort((a, b) => (a.price_change_percentage_24h || 0) - (b.price_change_percentage_24h || 0));
    else if (filter === "trending") r = r.sort((a, b) => (b.total_volume || 0) - (a.total_volume || 0));
    else if (filter === "watchlist") r = r.filter(c => favs.has(c.id));
    else {
      r = [...r].sort((a, b) => {
        const av = a[sort.key] || 0, bv = b[sort.key] || 0;
        return (av - bv) * sort.dir;
      });
    }
    return r;
  }, [coins, q, sort, filter, favs]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER));
  const pageCoins = filtered.slice((page-1)*PER, page*PER);


  const sortBy = k => setSort(s => ({ key:k, dir: s.key === k ? -s.dir : -1 }));

  return (
    <div>
      <div style={{
        display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:16, marginBottom:24,
      }}>
        <StatCard icon={DollarSign} label="24h Market Cap" value={fmtUsd(coins.reduce((s,c)=>s+(c.market_cap||0),0))} />
        <StatCard icon={Activity} label="24h Volume" value={fmtUsd(coins.reduce((s,c)=>s+(c.total_volume||0),0))} />
        <StatCard icon={Flame} label="BTC Dominance" value={((coins[0]?.market_cap || 0) / coins.reduce((s,c)=>s+(c.market_cap||0),0) * 100).toFixed(1) + "%"} />
        <StatCard icon={TrendingUp} label="Tracked Coins" value={coins.length.toString()} />
      </div>

      <div className="glass" style={{ padding:16, borderRadius:12, marginBottom:16 }}>
        <div style={{ display:"flex", gap:12, flexWrap:"wrap", alignItems:"center" }}>
          <div style={{ flex:"1 1 260px", position:"relative" }}>
            <Search size={16} style={{ position:"absolute", left:12, top:11, color:TH.dim }} />
            <input
              value={q} onChange={e => { setQ(e.target.value); setPage(1); }}
              placeholder="Search 250+ tokens..."
              style={{
                width:"100%", padding:"10px 12px 10px 36px",
                background:"rgba(0,0,0,0.4)",
                border:`1px solid ${TH.border}`, borderRadius:8,
                color:TH.text, fontSize:14,
              }}
            />
          </div>
          <div style={{ display:"flex", gap:6 }}>
            {[
              ["all","ALL"], ["trending","🔥 TRENDING"],
              ["gainers","📈 GAINERS"], ["losers","📉 LOSERS"],
            ].map(([k, l]) => (
              <button key={k} onClick={() => { setFilter(k); setPage(1); }} style={{
                padding:"8px 12px", borderRadius:6,
                background: filter === k ? `linear-gradient(135deg,${TH.cyan}22,${TH.magenta}22)` : "rgba(0,0,0,0.35)",
                border: filter === k ? `1px solid ${TH.cyan}` : `1px solid ${TH.border}`,
                color: filter === k ? TH.cyan : TH.dim,
                fontFamily:TH.display, fontSize:11, letterSpacing:"0.1em", cursor:"pointer",
              }}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="glass" style={{ borderRadius:12, overflow:"hidden" }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", minWidth:980 }}>
            <thead>
              <tr style={{ background:"rgba(124,200,255,0.06)" }}>
                {[
                  ["★", null, 40],
                  ["#", "market_cap_rank", 50],
                  ["Asset", null, 220],
                  ["Price", "current_price", 120],
                  ["1h %", "price_change_percentage_1h_in_currency", 80],
                  ["24h %", "price_change_percentage_24h", 80],
                  ["7d %", "price_change_percentage_7d_in_currency", 80],
                  ["Market Cap", "market_cap", 140],
                  ["Volume 24h", "total_volume", 140],
                  ["7d Chart", null, 140],
                ].map(([label, key, w], i) => (
                  <th key={i} onClick={() => key && sortBy(key)} style={{
                    padding:"12px 10px", textAlign: i < 3 ? "left" : "right", width:w,
                    fontFamily:TH.display, fontSize:11, letterSpacing:"0.12em", color:TH.dim,
                    cursor: key ? "pointer" : "default", whiteSpace:"nowrap", userSelect:"none",
                  }}>
                    {label} {sort.key === key && (sort.dir === 1 ? "↑" : "↓")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageCoins.map(c => {
                const p1 = c.price_change_percentage_1h_in_currency;
                const p24 = c.price_change_percentage_24h;
                const p7 = c.price_change_percentage_7d_in_currency;
                return (
                  <tr key={c.id} onClick={() => onOpenCoin?.(c)}
                    style={{ borderTop:`1px solid ${TH.border}`, cursor:"pointer", transition:"background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(124,200,255,0.04)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding:"10px", textAlign:"center" }}
                        onClick={e => { e.stopPropagation(); toggleFav(c.id, c.symbol); }}>
                      <Star size={14} fill={favs.has(c.id) ? TH.gold : "none"}
                        color={favs.has(c.id) ? TH.gold : TH.dim} />
                    </td>
                    <td style={{ padding:"10px", color:TH.dim, fontFamily:TH.mono, fontSize:12 }}>
                      {c.market_cap_rank}
                    </td>
                    <td style={{ padding:"10px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <TokenIcon coin={c} size={28} />
                        <div>
                          <div style={{ fontWeight:700, fontSize:13 }}>{c.name}</div>
                          <div style={{ fontSize:11, color:TH.dim, fontFamily:TH.mono, textTransform:"uppercase" }}>{c.symbol}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:"10px", textAlign:"right", fontFamily:TH.mono, fontSize:13 }}>
                      <LivePrice coin={c} />
                    </td>
                    {[p1, p24, p7].map((p, i) => (
                      <td key={i} style={{
                        padding:"10px", textAlign:"right", fontFamily:TH.mono, fontSize:12,
                        color: (p ?? 0) >= 0 ? TH.green : TH.red,
                      }}>{fmtPct(p)}</td>
                    ))}
                    <td style={{ padding:"10px", textAlign:"right", fontFamily:TH.mono, fontSize:12 }}>
                      {fmtUsd(c.market_cap)}
                    </td>
                    <td style={{ padding:"10px", textAlign:"right", fontFamily:TH.mono, fontSize:12 }}>
                      {fmtUsd(c.total_volume)}
                    </td>
                    <td style={{ padding:"6px 10px" }}>
                      <Sparkline coin={c} w={120} h={34} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{
          padding:"14px 20px", display:"flex", justifyContent:"space-between", alignItems:"center",
          borderTop:`1px solid ${TH.border}`, fontFamily:TH.mono, fontSize:12, color:TH.dim,
        }}>
          <div>Showing {(page-1)*PER+1}–{Math.min(page*PER, filtered.length)} of {filtered.length}</div>
          <div style={{ display:"flex", gap:6 }}>
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
              className="btn-neon" style={{ padding:"6px 12px", borderRadius:6, fontSize:11, opacity: page===1?0.4:1 }}>
              PREV
            </button>
            <span style={{ padding:"6px 12px", color:TH.text }}>{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
              className="btn-neon" style={{ padding:"6px 12px", borderRadius:6, fontSize:11, opacity: page===totalPages?0.4:1 }}>
              NEXT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MarketsView;
