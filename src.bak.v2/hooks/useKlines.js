import { useState, useEffect, useRef } from "react";

/**
 * Live candlesticks from Binance.
 *
 * Initial load: REST to /api/v3/klines for the last N candles
 * Live updates: wss://stream.binance.com:9443/ws/{symbol}@kline_{interval}
 *
 * Intervals: 1m 3m 5m 15m 30m 1h 2h 4h 6h 8h 12h 1d 3d 1w 1M
 *
 * No API key required, free, CORS-enabled.
 *
 * Returns array of { time, open, high, low, close, volume } objects
 * where `time` is a Unix seconds timestamp (lightweight-charts format).
 */
export function useKlines(symbol = "BTCUSDT", interval = "1m", limit = 500) {
  const [candles, setCandles] = useState([]);
  const [status, setStatus] = useState("loading");
  const wsRef = useRef(null);

  useEffect(() => {
    let alive = true;
    let retry = 0;
    setStatus("loading");

    // 1. Fetch initial history
    const loadHistory = async () => {
      try {
        const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rows = await res.json();
        if (!alive) return;
        // Binance kline row: [openTime, open, high, low, close, volume, closeTime, ...]
        const parsed = rows.map(r => ({
          time: Math.floor(r[0] / 1000),
          open: parseFloat(r[1]),
          high: parseFloat(r[2]),
          low:  parseFloat(r[3]),
          close: parseFloat(r[4]),
          volume: parseFloat(r[5]),
        }));
        setCandles(parsed);
        setStatus("live");
      } catch (err) {
        if (alive) setStatus("error");
      }
    };

    // 2. Live stream — overwrite the last candle (in-progress) each update
    const connect = () => {
      if (!alive) return;
      const stream = `${symbol.toLowerCase()}@kline_${interval}`;
      const url = `wss://stream.binance.com:9443/ws/${stream}`;

      let ws;
      try { ws = new WebSocket(url); }
      catch (_) { scheduleReconnect(); return; }
      wsRef.current = ws;

      ws.onopen = () => { retry = 0; };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          const k = msg.k;
          if (!k) return;
          const candle = {
            time: Math.floor(k.t / 1000),
            open: parseFloat(k.o),
            high: parseFloat(k.h),
            low:  parseFloat(k.l),
            close: parseFloat(k.c),
            volume: parseFloat(k.v),
          };
          setCandles(prev => {
            if (!prev.length) return [candle];
            const last = prev[prev.length - 1];
            if (last.time === candle.time) {
              // Same candle — update in place
              const next = prev.slice();
              next[next.length - 1] = candle;
              return next;
            }
            // New candle — append, cap buffer
            const next = [...prev, candle];
            return next.length > limit * 2 ? next.slice(-limit) : next;
          });
        } catch (_) {}
      };

      ws.onclose = () => {
        if (alive) scheduleReconnect();
      };
      ws.onerror = () => { try { ws.close(); } catch (_) {} };
    };

    const scheduleReconnect = () => {
      if (!alive) return;
      const wait = Math.min(15000, 600 * Math.pow(1.7, retry++));
      setTimeout(connect, wait);
    };

    loadHistory().then(() => alive && connect());

    return () => {
      alive = false;
      try { wsRef.current?.close(); } catch (_) {}
    };
  }, [symbol, interval, limit]);

  return { candles, status };
}
