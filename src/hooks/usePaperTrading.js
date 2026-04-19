import { useState, useEffect, useCallback } from "react";
import { paper as paperApi, getToken } from "../lib/api.js";

const LOCAL_POSITIONS_KEY = "omni:paper:positions";
const LOCAL_ORDERS_KEY = "omni:paper:orders";

function loadLocal(key) {
  try { return JSON.parse(localStorage.getItem(key) || "[]"); }
  catch { return []; }
}
function saveLocal(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}
function makeId() {
  return "local_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function usePaperTrading() {
  const [state, setState] = useState({
    positions: loadLocal(LOCAL_POSITIONS_KEY),
    orders: loadLocal(LOCAL_ORDERS_KEY),
    summary: null,
    loading: false,
    error: null,
    online: false,
  });

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setState(s => ({
        ...s,
        positions: loadLocal(LOCAL_POSITIONS_KEY),
        orders: loadLocal(LOCAL_ORDERS_KEY),
        online: false,
      }));
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

  useEffect(() => { refresh(); }, [refresh]);

  const place = useCallback(async (order) => {
    if (getToken()) {
      try {
        const { order: newOrder } = await paperApi.place(order);
        await refresh();
        return newOrder;
      } catch (err) {
        console.warn("Backend place failed, using local fallback:", err?.message);
      }
    }

    const now = new Date().toISOString();
    const side = order.side === "BUY" ? "LONG" : "SHORT";
    const leverage = order.leverage || 1;
    const mark = order.currentMarketPrice;
    const liqPct = 0.8 / leverage;
    const liquidation = side === "LONG"
      ? mark * (1 - liqPct)
      : mark * (1 + liqPct);

    const newPosition = {
      id: makeId(),
      coinId: order.coinId,
      symbol: order.symbol,
      side,
      size: String(order.quantity),
      entryPrice: String(mark),
      leverage: String(leverage),
      liquidationPrice: String(liquidation),
      openedAt: now,
      status: "OPEN",
      local: true,
    };
    const newOrder = {
      id: makeId(),
      coinId: order.coinId,
      symbol: order.symbol,
      side: order.side,
      type: order.type,
      quantity: String(order.quantity),
      price: order.price ? String(order.price) : null,
      fillPrice: String(mark),
      filledAt: now,
      status: "FILLED",
      createdAt: now,
      local: true,
    };

    setState(prev => {
      const positions = [newPosition, ...prev.positions];
      const orders = [newOrder, ...prev.orders];
      saveLocal(LOCAL_POSITIONS_KEY, positions);
      saveLocal(LOCAL_ORDERS_KEY, orders);
      return { ...prev, positions, orders };
    });
    return newOrder;
  }, [refresh]);

  const cancel = useCallback(async (orderId) => {
    if (getToken() && !orderId.startsWith("local_")) {
      try { await paperApi.cancel(orderId); await refresh(); return; }
      catch (_) {}
    }
    setState(prev => {
      const orders = prev.orders.map(o =>
        o.id === orderId ? { ...o, status: "CANCELLED" } : o
      );
      saveLocal(LOCAL_ORDERS_KEY, orders);
      return { ...prev, orders };
    });
  }, [refresh]);

  const close = useCallback(async (positionId, currentMarketPrice) => {
    if (getToken() && !positionId.startsWith("local_")) {
      try {
        const { position } = await paperApi.close(positionId, currentMarketPrice);
        await refresh();
        return position;
      } catch (_) {}
    }
    let closed;
    setState(prev => {
      const positions = prev.positions.map(p => {
        if (p.id !== positionId) return p;
        const entry = Number(p.entryPrice);
        const size = Number(p.size);
        const lev = Number(p.leverage);
        const dir = p.side === "LONG" ? 1 : -1;
        const realized = size * (currentMarketPrice - entry) * dir * lev;
        closed = { ...p, status: "CLOSED", closedAt: new Date().toISOString(),
                   exitPrice: String(currentMarketPrice),
                   realizedPnl: String(realized) };
        return closed;
      });
      saveLocal(LOCAL_POSITIONS_KEY, positions);
      return { ...prev, positions };
    });
    return closed;
  }, [refresh]);

  const derivedSummary = (() => {
    if (state.summary) return state.summary;
    const open = state.positions.filter(p => p.status === "OPEN");
    const closed = state.positions.filter(p => p.status === "CLOSED");
    const totalRealized = closed.reduce((s, p) => s + Number(p.realizedPnl || 0), 0);
    const winning = closed.filter(p => Number(p.realizedPnl || 0) > 0).length;
    return {
      openCount: open.length,
      closedCount: closed.length,
      totalRealizedPnl: totalRealized,
      winRate: closed.length ? winning / closed.length : 0,
      winning,
      losing: closed.length - winning,
    };
  })();

  return {
    ...state,
    summary: derivedSummary,
    refresh,
    place,
    cancel,
    close,
    available: true,
  };
}
