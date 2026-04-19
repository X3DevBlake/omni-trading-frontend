import { useState, useEffect, useCallback } from "react";
import { CC_URL, CG_URL, CG_URL_PRICES, sleep } from "../lib/endpoints";
import { FALLBACK_COINS } from "../lib/fallbackCoins";
import { fetchWithTimeout } from "../lib/fetchWithTimeout";

export function normalizeCryptoCompare(cc) {
  if (!cc || !Array.isArray(cc.Data)) return null;
  return cc.Data.map((entry, i) => {
    const info = entry.CoinInfo || {};
    const raw = (entry.RAW && entry.RAW.USD) || {};
    const imgPart = info.ImageUrl ? `https://www.cryptocompare.com${info.ImageUrl}` : null;
    return {
      id: (info.Name || "").toLowerCase(),
      symbol: (info.Name || "").toLowerCase(),
      name: info.FullName || info.Name || "",
      image: imgPart,
      current_price: raw.PRICE ?? null,
      market_cap: raw.MKTCAP ?? null,
      total_volume: raw.TOTALVOLUME24HTO ?? null,
      market_cap_rank: i + 1,
      price_change_percentage_24h: raw.CHANGEPCT24HOUR ?? null,
      price_change_percentage_1h_in_currency: raw.CHANGEPCTHOUR ?? null,
      price_change_percentage_7d_in_currency: null,
      circulating_supply: raw.SUPPLY ?? null,
      high_24h: raw.HIGH24HOUR ?? null,
      low_24h: raw.LOW24HOUR ?? null,
      ath: null,
      sparkline_in_7d: { price: [] }, // CC top endpoint doesn't include sparkline
    };
  });
}

export function useCoinGecko() {
  const [coins, setCoins] = useState(FALLBACK_COINS);
  const [status, setStatus] = useState("idle"); // idle | loading | live | fallback | error
  const [lastUpdate, setLastUpdate] = useState(null);
  const [source, setSource] = useState(null); // "coingecko" | "cryptocompare" | "fallback"

  const fetchNow = useCallback(async () => {
    setStatus(s => (s === "idle" || s === "fallback") ? "loading" : s);

    // ─── Primary: CoinGecko with up to 3 attempts for transient 5xx/429 ───
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const r = await fetchWithTimeout(CG_URL, {
          headers: { "Accept": "application/json" },
          cache: "no-cache",
        }, 10000);
        if (r.status === 429 || r.status === 503 || r.status === 502 || r.status === 504) {
          // Throttled — backoff and retry
          await sleep(900 * (attempt + 1));
          continue;
        }
        if (!r.ok) throw new Error("HTTP " + r.status);
        const data = await r.json();
        if (Array.isArray(data) && data.length > 0 && data[0].current_price) {
          setCoins(data);
          setStatus("live");
          setLastUpdate(new Date());
          setSource("coingecko");
          return;
        }
        throw new Error("Empty/invalid payload");
      } catch (err) {
        // Network / CORS / parse error — retry unless we've hit the last attempt
        if (attempt < 2) {
          await sleep(700 * (attempt + 1));
          continue;
        }
      }
    }

    // ─── Secondary: CryptoCompare (different host, different CDN, no rate limit) ───
    try {
      const r = await fetchWithTimeout(CC_URL, {
        headers: { "Accept": "application/json" },
        cache: "no-cache",
      }, 10000);
      if (r.ok) {
        const cc = await r.json();
        const normalized = normalizeCryptoCompare(cc);
        if (normalized && normalized.length > 0 && normalized[0].current_price) {
          // Try to backfill sparkline from coin ids using CoinGecko's separate endpoint,
          // but don't block on it — just set what we have now.
          setCoins(normalized);
          setStatus("live");
          setLastUpdate(new Date());
          setSource("cryptocompare");
          return;
        }
      }
    } catch (_) { /* fall through */ }

    // ─── Tertiary: CoinGecko price-only (no sparkline) ───
    try {
      const r = await fetchWithTimeout(CG_URL_PRICES, {
        headers: { "Accept": "application/json" },
        cache: "no-cache",
      }, 10000);
      if (r.ok) {
        const data = await r.json();
        if (Array.isArray(data) && data.length > 0 && data[0].current_price) {
          // Add empty sparkline structures so UI doesn't break
          const adapted = data.map(c => ({ ...c, sparkline_in_7d: c.sparkline_in_7d || { price: [] } }));
          setCoins(adapted);
          setStatus("live");
          setLastUpdate(new Date());
          setSource("coingecko-lite");
          return;
        }
      }
    } catch (_) { /* fall through */ }

    // ─── All sources failed — keep last-known (which might still be fallback mock) ───
    setStatus(prev => prev === "live" ? "live" : "fallback");
    setSource(s => s || "fallback");
  }, []);

  useEffect(() => {
    fetchNow();
    const id = setInterval(fetchNow, 15_000); // every 15s — aggressive refresh for live feel
    return () => clearInterval(id);
  }, [fetchNow]);

  return { coins, status, lastUpdate, refresh: fetchNow, source };
}

/* ═══════════════════════════════════════════════════════════════════════
   LIVE TICKER HOOK — Coinbase WebSocket feed for real-time prices
   Streams sub-second ticker updates for ~15 top pairs. No auth required.
   Merges live prices into the CoinGecko coins array via coinSymbolMap.
   ═══════════════════════════════════════════════════════════════════════ */
