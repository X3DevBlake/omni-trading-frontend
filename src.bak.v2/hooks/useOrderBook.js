import { useState, useEffect, useRef } from "react";

/**
 * Live order book from Binance's public depth stream.
 *
 * Stream: wss://stream.binance.com:9443/ws/{symbol}@depth20@100ms
 * - Updates 10× per second
 * - Returns top 20 bids and asks
 * - No API key required, CORS-enabled, free
 *
 * Docs: https://binance-docs.github.io/apidocs/spot/en/#partial-book-depth-streams
 *
 * Usage:
 *   const { bids, asks, status, spread } = useOrderBook("BTCUSDT");
 *
 * Returns:
 *   bids: [{ price: 64000, size: 0.521, total: 33344 }, ...]   // descending price
 *   asks: [{ price: 64100, size: 0.843, total: 54036 }, ...]   // ascending price
 *   status: "connecting" | "live" | "closed" | "error"
 *   spread: 100  (best ask minus best bid)
 */
export function useOrderBook(symbol = "BTCUSDT", depth = 20, speed = "100ms") {
  const [bids, setBids] = useState([]);
  const [asks, setAsks] = useState([]);
  const [status, setStatus] = useState("connecting");
  const wsRef = useRef(null);
  const retryRef = useRef(0);

  useEffect(() => {
    let alive = true;
    const stream = `${symbol.toLowerCase()}@depth${depth}@${speed}`;
    const url = `wss://stream.binance.com:9443/ws/${stream}`;

    const connect = () => {
      if (!alive) return;
      setStatus("connecting");

      let ws;
      try { ws = new WebSocket(url); }
      catch (_) { setStatus("error"); return scheduleReconnect(); }
      wsRef.current = ws;

      ws.onopen = () => {
        if (!alive) { ws.close(); return; }
        retryRef.current = 0;
        setStatus("live");
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          // Partial book stream returns { lastUpdateId, bids: [[price, qty], ...], asks: [...] }
          if (!msg.bids || !msg.asks) return;

          const parseLevels = (levels) => {
            let running = 0;
            return levels.map(([p, q]) => {
              const price = parseFloat(p);
              const size = parseFloat(q);
              running += price * size;
              return { price, size, total: running };
            });
          };

          setBids(parseLevels(msg.bids));
          setAsks(parseLevels(msg.asks));
        } catch (_) {}
      };

      ws.onclose = () => {
        if (!alive) return;
        setStatus("closed");
        scheduleReconnect();
      };
      ws.onerror = () => {
        try { ws.close(); } catch (_) {}
      };
    };

    const scheduleReconnect = () => {
      if (!alive) return;
      const wait = Math.min(15000, 500 * Math.pow(1.7, retryRef.current++));
      setTimeout(connect, wait);
    };

    connect();

    return () => {
      alive = false;
      try { wsRef.current?.close(); } catch (_) {}
    };
  }, [symbol, depth, speed]);

  const bestBid = bids[0]?.price || null;
  const bestAsk = asks[0]?.price || null;
  const spread = (bestBid != null && bestAsk != null) ? bestAsk - bestBid : null;
  const midPrice = (bestBid != null && bestAsk != null) ? (bestBid + bestAsk) / 2 : null;

  return { bids, asks, status, bestBid, bestAsk, spread, midPrice };
}
