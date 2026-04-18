import { useState, useEffect, useRef } from "react";

export function useLiveTicker() {
  const [tick, setTick] = useState({}); // { btc: {price, pct24h, ts}, eth: {...}, ... }
  const [wsStatus, setWsStatus] = useState("connecting"); // connecting | connected | closed
  const wsRef = useRef(null);

  useEffect(() => {
    let retry = 0;
    let alive = true;

    const connect = () => {
      if (!alive) return;
      let ws;
      try {
        ws = new WebSocket("wss://ws-feed.exchange.coinbase.com");
      } catch (_) {
        setWsStatus("closed");
        return;
      }
      wsRef.current = ws;

      ws.onopen = () => {
        if (!alive) { ws.close(); return; }
        retry = 0;
        setWsStatus("connected");
        try {
          // Subscribe to ticker + heartbeats (heartbeats keep connection alive)
          ws.send(JSON.stringify({
            type: "subscribe",
            product_ids: LIVE_PAIRS,
            channels: [
              { name: "ticker", product_ids: LIVE_PAIRS },
              { name: "heartbeat", product_ids: ["BTC-USD"] },
            ],
          }));
        } catch (_) {}
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type !== "ticker") return;
          const sym = (msg.product_id || "").split("-")[0].toLowerCase();
          const price = parseFloat(msg.price);
          if (!sym || !isFinite(price)) return;
          const open24h = parseFloat(msg.open_24h);
          const pct24h = (isFinite(open24h) && open24h > 0)
            ? ((price - open24h) / open24h) * 100
            : null;
          setTick(prev => ({
            ...prev,
            [sym]: {
              price,
              pct24h,
              high24h: parseFloat(msg.high_24h),
              low24h: parseFloat(msg.low_24h),
              vol24h: parseFloat(msg.volume_24h),
              ts: Date.now(),
              prev: prev[sym]?.price ?? null,
            },
          }));
        } catch (_) { /* ignore malformed */ }
      };

      ws.onclose = () => {
        setWsStatus("closed");
        if (!alive) return;
        // Exponential backoff reconnect
        const wait = Math.min(15000, 1000 * Math.pow(1.6, retry++));
        setTimeout(connect, wait);
      };

      ws.onerror = () => { try { ws.close(); } catch (_) {} };

      // (removed the broken client-side heartbeat — the server-side heartbeat
      //  channel subscription above keeps the connection alive correctly)
    };

    connect();

    return () => {
      alive = false;
      try { wsRef.current && wsRef.current.close(); } catch (_) {}
    };
  }, []);

  return { tick, wsStatus };
}

/* Merge live WS ticks into a CoinGecko-shaped coin list */
