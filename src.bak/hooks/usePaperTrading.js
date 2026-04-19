import { useState, useEffect, useCallback } from "react";
import { paper as paperApi, getToken } from "../lib/api.js";

/**
 * Paper trading session. Fetches positions, orders, and summary from the
 * backend on demand. Exposes place/cancel/close helpers that POST to the API.
 *
 * Silently returns empty state if user isn't authenticated.
 */
export function usePaperTrading() {
  const [state, setState] = useState({
    positions: [],
    orders: [],
    summary: null,
    loading: false,
    error: null,
    online: false,
  });

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setState(s => ({ ...s, online: false }));
      return;
    }
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const [positionsRes, ordersRes, summaryRes] = await Promise.all([
        paperApi.positions(),
        paperApi.orders(),
        paperApi.summary(),
      ]);
      setState({
        positions: positionsRes.positions || [],
        orders: ordersRes.orders || [],
        summary: summaryRes,
        loading: false,
        error: null,
        online: true,
      });
    } catch (err) {
      setState(s => ({
        ...s,
        loading: false,
        error: err?.message || String(err),
        online: false,
      }));
    }
  }, []);

  // Load on mount + whenever a token appears
  useEffect(() => { refresh(); }, [refresh]);

  const place = useCallback(async (order) => {
    const { order: newOrder } = await paperApi.place(order);
    await refresh();
    return newOrder;
  }, [refresh]);

  const cancel = useCallback(async (orderId) => {
    await paperApi.cancel(orderId);
    await refresh();
  }, [refresh]);

  const close = useCallback(async (positionId, currentMarketPrice) => {
    const { position } = await paperApi.close(positionId, currentMarketPrice);
    await refresh();
    return position;
  }, [refresh]);

  return { ...state, refresh, place, cancel, close };
}
