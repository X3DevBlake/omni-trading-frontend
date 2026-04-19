import { useMemo } from "react";

export function useMergedCoins(coins, tick) {
  return useMemo(() => {
    if (!coins || !coins.length) return coins;
    return coins.map(c => {
      const sym = (c.symbol || "").toLowerCase();
      const t = tick[sym];
      if (!t || !isFinite(t.price)) return c;
      return {
        ...c,
        current_price: t.price,
        price_change_percentage_24h: t.pct24h ?? c.price_change_percentage_24h,
        high_24h: isFinite(t.high24h) ? t.high24h : c.high_24h,
        low_24h: isFinite(t.low24h) ? t.low24h : c.low_24h,
        _liveTs: t.ts,
        _livePrev: t.prev,
      };
    });
  }, [coins, tick]);
}

/* ═══════════════════════════════════════════════════════════════════════
   LIVE PRICE — auto-flashes green/red when the underlying price changes
   ═══════════════════════════════════════════════════════════════════════ */
